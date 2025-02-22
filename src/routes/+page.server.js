// src/routes/+page.server.js
import { error } from '@sveltejs/kit';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execPromise = promisify(exec);

// Helper function to execute command in container
async function executeInContainer(command) {
	const escapedCommand = command.replace(/'/g, "'\\''");
	const containerCommand = `sudo nixos-container run agent -- su -l agent -c 'HOME=/home/agent ${escapedCommand}'`;
	return await execPromise(containerCommand, {
		timeout: 30000,
		maxBuffer: 1024 * 1024
	});
}

async function getDirectoryContents(dirPath, relativePath = '') {
	try {
		// List directory contents using ls -la and parse the output
		const { stdout } = await executeInContainer(`ls -la "${dirPath}"`);
		const entries = stdout
			.split('\n')
			.slice(1) // Skip total line
			.map((line) => {
				const parts = line.trim().split(/\s+/);
				if (parts.length < 9) return null;

				const name = parts.slice(8).join(' ');
				if (name === '.' || name === '..') return null;

				const isDir = parts[0].startsWith('d');
				const size = parseInt(parts[4]);
				const modified = new Date(parts.slice(5, 8).join(' ')).toISOString();

				return { name, isDir, size, modified };
			})
			.filter((entry) => entry !== null);

		const contents = await Promise.all(
			entries.map(async (entry) => {
				const fullPath = path.join(dirPath, entry.name);
				const entryRelativePath = path.join(relativePath, entry.name);

				if (entry.isDir) {
					const children = await getDirectoryContents(fullPath, entryRelativePath);
					return {
						name: entry.name,
						type: 'directory',
						path: entryRelativePath,
						children,
						expanded: false,
						size: entry.size,
						modified: entry.modified
					};
				}

				return {
					name: entry.name,
					type: 'file',
					path: entryRelativePath,
					size: entry.size,
					modified: entry.modified
				};
			})
		);

		return contents.sort((a, b) => {
			if (a.type === 'directory' && b.type === 'file') return -1;
			if (a.type === 'file' && b.type === 'directory') return 1;
			return a.name.localeCompare(b.name);
		});
	} catch (err) {
		console.error(`Error reading directory ${dirPath}:`, err);
		throw err;
	}
}

export async function load() {
	try {
		const workingDir = '/home/agent/git/time';
		console.log('Reading directory recursively:', workingDir);

		// Ensure .agent directory exists in container
		await executeInContainer('mkdir -p /home/agent/git/time');

		const fileList = await getDirectoryContents(workingDir);
		console.log('File structure built:', JSON.stringify(fileList, null, 2));

		return {
			files: fileList
		};
	} catch (err) {
		console.error('Error building file structure:', err);
		throw error(500, 'Failed to read directory structure');
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

			// Join the path correctly with the .agent directory
			const filePath = path.join('/home/agent/git/time', filename);

			// Read file content from container
			const { stdout: content } = await executeInContainer(`cat "${filePath}"`);

			// Get file stats
			const { stdout: statsStr } = await executeInContainer(
				`stat --printf="%s\\n%Y\\n%W" "${filePath}"`
			);
			const [size, mtime, birthtime] = statsStr.split('\n').map(Number);

			return {
				success: true,
				content,
				metadata: {
					size: parseInt(size),
					modified: new Date(mtime * 1000),
					created: new Date(birthtime * 1000)
				}
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
