/**
 * Bash command execution API endpoint
 *
 * This module provides an API endpoint for executing bash commands in a NixOS container
 * and returns the command with its full output, mimicking a terminal prompt.
 *
 * @module api/bash
 */

import { json } from '@sveltejs/kit';
import { exec } from 'child_process';
import { promisify } from 'util';

// Constants
const EXEC_TIMEOUT = 30000; // 30 seconds
const EXEC_MAX_BUFFER = 1024 * 1024; // 1MB

// Convert exec to promise-based
const execPromise = promisify(exec);

/**
 * Executes a command in the NixOS container and captures its output
 *
 * @param {string} command - The command to execute
 * @returns {Promise<{stdout: string, stderr: string, escapedCommand: string}>} The command execution result and escaped command
 * @throws {Error} If the command execution fails
 */
async function executeCommand(command) {
	// Escape quotes for shell safety
	const escapedCommand = command
		.replace(/'/g, "'\\''") // Escape single quotes using bash technique
		.replace(/"/g, '\\"'); // Escape double quotes with backslash

	// Execute the command directly in the container and capture its output
	const fullCommand = `sudo nixos-container run agent -- su -l agent -c 'HOME=/home/agent bash -c "${escapedCommand}"'`;

	const result = await execPromise(fullCommand, {
		timeout: EXEC_TIMEOUT,
		maxBuffer: EXEC_MAX_BUFFER
	});

	// Format output with the command prompt
	const commandLine = `[agent@nixos:~]$ ${escapedCommand}`;
	const finalOutput = result.stdout.trim()
		? `${commandLine}\n${result.stdout.trim()}`
		: commandLine;

	return { stdout: finalOutput, stderr: result.stderr, escapedCommand };
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
		const { stdout, stderr, escapedCommand } = await executeCommand(command);

		return json({
			success: true,
			stdout: stdout,
			stderr: stderr
		});
	} catch (error) {
		return json(
			{
				success: false,
				error: error.message || 'Error executing command',
				stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
			},
			{ status: 500 }
		);
	}
};
