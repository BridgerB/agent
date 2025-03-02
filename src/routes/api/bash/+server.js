/**
 * Bash command execution API endpoint
 *
 * This module provides an API endpoint for executing bash commands in a tmux session
 * within a NixOS container, and returning the command output.
 *
 * @module api/bash
 */

import { json } from '@sveltejs/kit';
import { exec } from 'child_process';
import { promisify } from 'util';

// Constants
const EXEC_TIMEOUT = 30000; // 30 seconds
const EXEC_MAX_BUFFER = 1024 * 1024; // 1MB
const COMMAND_EXECUTION_DELAY = 500; // 500ms

// Convert exec to promise-based
const execPromise = promisify(exec);

/**
 * Sends a command to the tmux session running in the NixOS container
 *
 * @param {string} command - The command to execute in the tmux session
 * @returns {Promise<{stdout: string, stderr: string}>} The command execution result
 * @throws {Error} If the command execution fails
 */
async function sendToTmuxSession(command) {
	// Escape quotes for shell safety
	const escapedCommand = command
		.replace(/'/g, "'\\''") // Escape single quotes using bash technique
		.replace(/"/g, '\\"'); // Escape double quotes with backslash

	const tmuxCommand = `sudo nixos-container run agent -- su -l agent -c 'HOME=/home/agent tmux send-keys -t agent-session "${escapedCommand}" Enter'`;

	return await execPromise(tmuxCommand, {
		timeout: EXEC_TIMEOUT,
		maxBuffer: EXEC_MAX_BUFFER
	});
}

/**
 * Captures the current output visible in the tmux pane
 *
 * @returns {Promise<{stdout: string, stderr: string}>} The captured tmux pane content
 * @throws {Error} If the capture operation fails
 */
async function captureTmuxOutput() {
	const captureCommand = `sudo nixos-container run agent -- su -l agent -c 'HOME=/home/agent tmux capture-pane -t agent-session -p'`;

	return await execPromise(captureCommand, {
		timeout: EXEC_TIMEOUT,
		maxBuffer: EXEC_MAX_BUFFER
	});
}

/**
 * POST handler for the bash API endpoint
 *
 * @param {Object} options - SvelteKit request options
 * @param {Request} options.request - The HTTP request object
 * @returns {Response} JSON response with command execution results
 */
export const POST = async ({ request }) => {
	try {
		const { command } = await request.json();

		if (!command) {
			return json({ error: 'No command provided' }, { status: 400 });
		}

		// Execute the command in the tmux session
		const { stdout: execStdout, stderr: execStderr } = await sendToTmuxSession(command);

		// Wait for command execution to complete
		await new Promise((resolve) => setTimeout(resolve, COMMAND_EXECUTION_DELAY));

		// Capture the visible output in the tmux pane
		const { stdout, stderr } = await captureTmuxOutput();

		return json({
			success: true,
			stdout: stdout || execStdout,
			stderr: stderr || execStderr
		});
	} catch (error) {
		return json(
			{
				success: false,
				error: error.message || 'Error executing command in tmux',
				stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
			},
			{ status: 500 }
		);
	}
};
