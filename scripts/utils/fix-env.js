import fs from 'fs';

// Read the .env file
const env = fs.readFileSync('.env', 'utf8');

// Function to process the env content
function processEnv(content) {
	// Split into lines and track what we're processing
	const lines = content.split('\n');
	let currentVar = null;
	let currentContent = [];
	let result = [];

	// Process each line
	lines.forEach((line) => {
		// If line starts with a variable assignment containing an object
		const varMatch = line.match(/^([A-Z_]+)=`?{/);

		if (varMatch) {
			currentVar = varMatch[1];
			currentContent = [line];
		} else if (currentVar && line.includes('}`')) {
			// End of object found
			currentContent.push(line);

			// Join all lines and parse the object
			const fullContent = currentContent.join('\n');
			try {
				// Extract the object part
				const objMatch = fullContent.match(/=`?({[\s\S]*})`?$/);
				if (objMatch) {
					let jsonStr = objMatch[1]
						.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":') // Fix unquoted keys
						.replace(/:\s*'([^']*)'/g, ':"$1"') // Replace single quotes with double quotes for values
						.replace(/:\s*"([^"]*)"/g, ':"$1"') // Normalize spacing around existing quoted values
						.replace(/\s+/g, ' '); // Normalize whitespace

					// Parse and re-stringify to ensure proper format
					const parsed = JSON.parse(jsonStr);
					const compressed = JSON.stringify(parsed);

					// Add the compressed version
					result.push(`${currentVar}=${compressed}`);
				}
			} catch (error) {
				console.error(`Error processing ${currentVar}:`, error);
				result.push(fullContent);
			}

			currentVar = null;
			currentContent = [];
		} else if (currentVar) {
			currentContent.push(line);
		} else if (line.trim() && !line.trim().startsWith('#')) {
			// Not in an object definition and not a comment
			const [key, ...valueParts] = line.split('=');
			const value = valueParts.join('=');
			// Remove outer quotes if they exist
			const cleanValue = value.replace(/^["'`](.*)["'`]$/, '$1');
			result.push(`${key}=${cleanValue}`);
		} else {
			// Keep comments and empty lines
			result.push(line);
		}
	});

	return result.join('\n');
}

// Process and write back to file
try {
	const processed = processEnv(env);
	fs.writeFileSync('.env', processed);
	console.log('Successfully compressed environment variables');
} catch (error) {
	console.error('Error:', error);
	process.exit(1);
}
