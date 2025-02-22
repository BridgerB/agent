// src/routes/api/bash/+server.js
import { json } from '@sveltejs/kit';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Helper function to execute command in container
async function executeInContainer(command) {
	// Escape single quotes in the command to prevent breaking the container command
	const escapedCommand = command.replace(/'/g, "'\\''");

	// Construct the container execution command
	// Use sudo to execute nixos-container run, then su to the agent user
	// Include -l flag for login shell to set proper environment
	// Use HOME=/home/agent to ensure correct home directory
	const containerCommand = `sudo nixos-container run agent -- su -l agent -c 'HOME=/home/agent ${escapedCommand}'`;

	return await execPromise(containerCommand, {
		timeout: 30000, // 30 second timeout
		maxBuffer: 1024 * 1024 // 1MB buffer
	});
}

export const POST = async ({ request }) => {
	try {
		const { command } = await request.json();

		if (!command) {
			return json({ error: 'No command provided' }, { status: 400 });
		}

		// Execute the command in the container
		const { stdout, stderr } = await executeInContainer(command);

		return json({
			success: true,
			stdout,
			stderr
		});
	} catch (error) {
		console.error('Error executing command in container:', error);
		return json(
			{
				success: false,
				error: error.message || 'Error executing command in container',
				stack: error.stack
			},
			{ status: 500 }
		);
	}
};
