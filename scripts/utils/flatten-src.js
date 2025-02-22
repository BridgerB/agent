/**
 * @fileoverview Script to clear destination directory and copy all files from src directory to /data/claud/ in a flat structure,
 * excluding the lib/server/model/data folder. Includes 'src_' prefix in output filenames and appends .txt extension.
 * @author Claude
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Checks if a path should be excluded from processing
 * @param {string} filePath - Path to check
 * @returns {boolean} True if path should be excluded
 */
function shouldExclude(filePath) {
	// Check if path contains lib/server/model/data
	return filePath.includes(path.join('lib', 'server', 'model', 'data'));
}

/**
 * Recursively finds all files in a directory
 * @param {string} dir - Directory to search
 * @param {Array<string>} fileList - Accumulator for found files
 * @returns {Promise<Array<string>>} Array of file paths
 */
async function getAllFiles(dir, fileList = []) {
	const files = await fs.readdir(dir);

	for (const file of files) {
		const filePath = path.join(dir, file);

		// Skip if path should be excluded
		if (shouldExclude(filePath)) {
			continue;
		}

		const stat = await fs.stat(filePath);

		if (stat.isDirectory()) {
			// Recursively search subdirectories
			await getAllFiles(filePath, fileList);
		} else {
			fileList.push(filePath);
		}
	}

	return fileList;
}

/**
 * Removes all files and subdirectories from a directory
 * @param {string} dir - Directory to clear
 */
async function clearDirectory(dir) {
	try {
		// Check if directory exists
		await fs.access(dir);

		// Get all files in directory
		const files = await fs.readdir(dir);

		// Remove each file/directory
		for (const file of files) {
			const filePath = path.join(dir, file);
			const stat = await fs.stat(filePath);

			if (stat.isDirectory()) {
				// Recursively remove subdirectories
				await fs.rm(filePath, { recursive: true });
			} else {
				await fs.unlink(filePath);
			}
		}
		console.log(`Cleared directory: ${dir}`);
	} catch (error) {
		if (error.code === 'ENOENT') {
			// Directory doesn't exist, that's fine
			return;
		}
		throw error;
	}
}

/**
 * Gets a flat filename by replacing directory separators with underscores,
 * adding 'src_' prefix, and appending .txt extension
 * @param {string} filePath - Original file path
 * @param {string} sourceDir - Source directory to strip from path
 * @returns {string} Flattened filename with src_ prefix and .txt extension
 */
function getFlatFilename(filePath, sourceDir) {
	// Remove the source directory from the path and trim any leading separator
	const relativePath = filePath.replace(sourceDir, '').replace(/^[/\\]/, '');
	// Replace all directory separators with underscores and add src_ prefix and .txt suffix
	return 'src_' + relativePath.replace(/[/\\]/g, '_') + '.txt';
}

/**
 * Copies all files to destination directory in a flat structure
 */
async function copyFilesFlat() {
	const sourceDir = path.join(__dirname, '../../src');
	const destDir = path.join(__dirname, '../../data/claud');

	try {
		// Clear destination directory first
		await clearDirectory(destDir);

		// Create destination directory if it doesn't exist
		await fs.mkdir(destDir, { recursive: true });

		// Get all files from source directory, excluding lib/server/model/data
		const files = await getAllFiles(sourceDir);

		// Copy each file to destination
		for (const filePath of files) {
			const flatFilename = getFlatFilename(filePath, sourceDir);
			const destPath = path.join(destDir, flatFilename);

			await fs.copyFile(filePath, destPath);
			console.log(`Copied: ${filePath} -> ${destPath}`);
		}

		console.log('All files copied successfully!');
	} catch (error) {
		console.error('Error copying files:', error);
		process.exit(1);
	}
}

// Run the script
copyFilesFlat();
