/**
 * Bash command execution API endpoint
 *
 * This module provides an API endpoint for executing bash commands in a tmux session
 * within a NixOS container, and returning only the most recent command output.
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
 * and captures only the command's output
 *
 * @param {string} command - The command to execute in the tmux session
 * @returns {Promise<{stdout: string, stderr: string, escapedCommand: string}>} The command execution result and escaped command
 * @throws {Error} If the command execution fails
 */
async function executeTmuxCommand(command) {
	// Escape quotes for shell safety
	const escapedCommand = command
		.replace(/'/g, "'\\''") // Escape single quotes using bash technique
		.replace(/"/g, '\\"'); // Escape double quotes with backslash

	// Modified to run command directly and capture its output
	const fullCommand = `sudo nixos-container run agent -- su -l agent -c 'HOME=/home/agent tmux send-keys -t agent-session "${escapedCommand}" Enter && sleep 0.1 && tmux capture-pane -t agent-session -p -S -1'`;

	const result = await execPromise(fullCommand, {
		timeout: EXEC_TIMEOUT,
		maxBuffer: EXEC_MAX_BUFFER
	});

	return { ...result, escapedCommand };
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

		// Execute command and get only the latest output
		const { stdout, stderr, escapedCommand } = await executeTmuxCommand(command);

		// Split output by lines and get only the relevant command output
		const outputLines = stdout.trim().split('\n');
		// Filter out the command echo and prompt lines, take last line of actual output
		const filteredOutput =
			outputLines
				.filter((line) => !line.includes(escapedCommand) && !line.match(/^\s*agent@.*?:.*?\$/))
				.pop() || '';

		return json({
			success: true,
			stdout: filteredOutput,
			stderr: stderr
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
