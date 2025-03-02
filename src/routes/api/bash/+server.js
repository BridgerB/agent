/**
 * Bash command execution API endpoint
 *
 * This module provides an API endpoint for executing bash commands in a tmux session
 * within a NixOS container, and returns the last command with its immediate output.
 *
 * @module api/bash
 */

import { json } from '@sveltejs/kit';
import { exec } from 'child_process';
import { promisify } from 'util';

// Constants
const EXEC_TIMEOUT = 30000; // 30 seconds
const EXEC_MAX_BUFFER = 1024 * 1024; // 1MB
const CAPTURE_LINES = 10; // Capture enough lines to ensure we get command + output

// Convert exec to promise-based
const execPromise = promisify(exec);

/**
 * Sends a command to the tmux session running in the NixOS container
 * and captures the command's output
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

	// Increased sleep time to ensure output is captured
	const fullCommand = `sudo nixos-container run agent -- su -l agent -c 'HOME=/home/agent tmux send-keys -t agent-session "${escapedCommand}" Enter && sleep 0.5 && tmux capture-pane -t agent-session -p -S -${CAPTURE_LINES}'`;

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

		// Execute command and get output
		const { stdout, stderr, escapedCommand } = await executeTmuxCommand(command);

		// Split output by lines and remove empty lines
		const outputLines = stdout
			.trim()
			.split('\n')
			.filter((line) => line.trim() !== '');

		// Find the last occurrence of the command and its output
		let commandLine = `[agent@nixos:~]$ ${escapedCommand}`;
		let commandOutput = '';

		// Look for the command in the output lines
		for (let i = outputLines.length - 1; i >= 0; i--) {
			if (outputLines[i].includes(escapedCommand)) {
				// Found the command, now get the next line as output if it exists
				if (
					i + 1 < outputLines.length &&
					!outputLines[i + 1].match(/^\s*agent@.*?:.*?\$/) &&
					outputLines[i + 1] !== escapedCommand
				) {
					commandOutput = outputLines[i + 1];
				}
				break;
			}
		}

		// Combine command and output
		const finalOutput = commandOutput ? `${commandLine}\n${commandOutput}` : commandLine;

		return json({
			success: true,
			stdout: finalOutput,
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
