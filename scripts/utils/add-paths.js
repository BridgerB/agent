import { promises as fs } from 'fs';
import { join, relative, extname } from 'path';

/**
 * Validates and fixes file path comments in files
 * @param {string} startPath - Directory path to start processing from
 * @throws {Error} If a file contains multiple path comments
 */
async function validateAndFixPaths(startPath) {
	try {
		const entries = await fs.readdir(startPath, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = join(startPath, entry.name);
			const relativePath = relative(process.cwd(), fullPath);

			if (entry.isDirectory()) {
				await validateAndFixPaths(fullPath);
			} else {
				// Skip binary and JSON files
				if (
					['.jpg', '.png', '.gif', '.svg', '.ico', '.woff', '.ttf', '.json'].includes(
						extname(entry.name)
					)
				) {
					continue;
				}

				try {
					const content = await fs.readFile(fullPath, 'utf8');
					const lines = content.split('\n');

					// More specific path comment detection
					const pathRegex = /^(?:\/\/|\/\*|<!--)\s*(src\/.+?\.(js|ts|svelte|css|html))/;
					let pathCommentCount = 0;
					let existingPath = null;
					let needsFixing = false;
					let fixedContent = content;

					// Check first few lines for path comments
					for (const line of lines) {
						const trimmedLine = line.trim();
						const match = trimmedLine.match(pathRegex);

						if (match) {
							pathCommentCount++;
							existingPath = match[1];

							// Compare existing path with actual path
							if (existingPath !== relativePath && relativePath.startsWith('src/')) {
								needsFixing = true;
								// Create new comment with correct path based on file type
								let newComment;
								if (entry.name.endsWith('.css')) {
									newComment = `/* ${relativePath} */`;
								} else if (entry.name.endsWith('.svelte') || entry.name.endsWith('.html')) {
									newComment = `<!-- ${relativePath} -->`;
								} else {
									newComment = `// ${relativePath}`;
								}

								// Replace the first line containing the path
								const lines = fixedContent.split('\n');
								lines[0] = newComment;
								fixedContent = lines.join('\n');
							}
						} else if (
							!trimmedLine.startsWith('//') &&
							!trimmedLine.startsWith('/*') &&
							!trimmedLine.startsWith('<!--')
						) {
							break;
						}

						if (pathCommentCount > 1) {
							throw new Error(`Multiple path comments found in file: ${relativePath}`);
						}
					}

					// Add path comment if missing
					if (pathCommentCount === 0 && relativePath.startsWith('src/')) {
						let pathComment;
						if (entry.name.endsWith('.css')) {
							pathComment = `/* ${relativePath} */\n`;
						} else if (entry.name.endsWith('.svelte') || entry.name.endsWith('.html')) {
							pathComment = `<!-- ${relativePath} -->\n`;
						} else {
							pathComment = `// ${relativePath}\n`;
						}
						fixedContent = pathComment + content;
						needsFixing = true;
					}

					// Write fixed content if needed
					if (needsFixing) {
						await fs.writeFile(fullPath, fixedContent);
						console.log(`Fixed path in: ${relativePath}`);
						if (existingPath) {
							console.log(`  Changed from: ${existingPath}`);
							console.log(`  Changed to: ${relativePath}`);
						}
					}
				} catch (err) {
					if (err.message.includes('Multiple path comments found')) {
						console.error(`Error: ${err.message}`);
						process.exit(1);
					} else if (err.code === 'ENOENT') {
						console.log(`File not found: ${relativePath}`);
					} else if (err.code === 'EISDIR') {
						console.log(`Is a directory: ${relativePath}`);
					} else {
						console.error(`Error processing ${relativePath}:`, err);
					}
				}
			}
		}
	} catch (err) {
		console.error('Error:', err);
	}
}

// Start processing from the src directory
validateAndFixPaths('./src')
	.then(() => console.log('Finished processing files'))
	.catch((err) => console.error('Fatal error:', err));
