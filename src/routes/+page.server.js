// src/routes/+page.server.js
import { readdir, readFile } from 'fs/promises';
import { error } from '@sveltejs/kit';
import path from 'path';

export async function load() {
	try {
		const workingDir = path.join(process.cwd(), '.agent');
		console.log('Reading directory:', workingDir);

		const files = await readdir(workingDir, { withFileTypes: true });
		console.log('Files found:', files);

		const fileList = files.map((file) => ({
			name: file.name,
			type: file.isDirectory() ? 'directory' : 'file'
		}));

		return {
			files: fileList
		};
	} catch (err) {
		console.error('Error reading directory:', err);
		throw error(500, 'Failed to read directory');
	}
}

export const actions = {
	readFile: async ({ request }) => {
		try {
			const formData = await request.formData();
			const filename = formData.get('filename');

			console.log('Reading file:', filename);

			if (!filename) {
				throw new Error('No filename provided');
			}

			// Join the path correctly
			const filePath = path.join(process.cwd(), '.agent', filename);
			console.log('Full file path:', filePath);

			const content = await readFile(filePath, 'utf-8');
			console.log('File content loaded, length:', content.length);

			return {
				success: true,
				content
			};
		} catch (err) {
			console.error('Error reading file:', err);
			return {
				success: false,
				error: err.message
			};
		}
	}
};
