// src/routes/+page.server.js
import { readdir, readFile, stat } from 'fs/promises';
import { error } from '@sveltejs/kit';
import path from 'path';

async function getDirectoryContents(dirPath, relativePath = '') {
	try {
		const entries = await readdir(dirPath, { withFileTypes: true });
		const contents = await Promise.all(
			entries.map(async (entry) => {
				const fullPath = path.join(dirPath, entry.name);
				const entryRelativePath = path.join(relativePath, entry.name);
				const stats = await stat(fullPath);

				if (entry.isDirectory()) {
					const children = await getDirectoryContents(fullPath, entryRelativePath);
					return {
						name: entry.name,
						type: 'directory',
						path: entryRelativePath,
						children,
						expanded: false,
						size: stats.size,
						modified: stats.mtime
					};
				}

				return {
					name: entry.name,
					type: 'file',
					path: entryRelativePath,
					size: stats.size,
					modified: stats.mtime
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
		const workingDir = path.join(process.cwd(), '.agent');
		console.log('Reading directory recursively:', workingDir);

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
			const filePath = path.join(process.cwd(), '.agent', filename);

			// Verify the path is within the .agent directory
			const normalizedPath = path.normalize(filePath);
			const normalizedRoot = path.normalize(path.join(process.cwd(), '.agent'));

			if (!normalizedPath.startsWith(normalizedRoot)) {
				throw new Error('Invalid file path');
			}

			console.log('Full file path:', filePath);

			// Verify file exists
			try {
				const fileStats = await stat(filePath);
				if (!fileStats.isFile()) {
					throw new Error('Not a file');
				}

				const content = await readFile(filePath, 'utf-8');
				console.log('File content loaded, length:', content.length);

				return {
					success: true,
					content,
					metadata: {
						size: fileStats.size,
						modified: fileStats.mtime,
						created: fileStats.birthtime
					}
				};
			} catch (statErr) {
				if (statErr.code === 'ENOENT') {
					throw new Error(`File not found: ${filename}`);
				}
				throw statErr;
			}
		} catch (err) {
			console.error('Error reading file:', err);
			return {
				success: false,
				error: err.message
			};
		}
	}
};
