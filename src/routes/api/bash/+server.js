// src/routes/api/bash/+server.js
import { json } from '@sveltejs/kit';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export const POST = async ({ request }) => {
	try {
		const { command } = await request.json();

		if (!command) {
			return json({ error: 'No command provided' }, { status: 400 });
		}

		const { stdout, stderr } = await execPromise(command, {
			timeout: 30000, // 30 second timeout
			maxBuffer: 1024 * 1024 // 1MB buffer
		});

		return json({
			success: true,
			stdout,
			stderr
		});
	} catch (error) {
		console.error('Error executing command:', error);
		return json(
			{
				success: false,
				error: error.message || 'Error executing command',
				stack: error.stack
			},
			{ status: 500 }
		);
	}
};
