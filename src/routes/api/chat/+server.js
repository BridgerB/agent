// src/routes/api/chat/+server.js
import { json } from '@sveltejs/kit';

// Updated system prompt with correct bash tag usage
const systemPrompt = `You are a helpful AI assistant with the ability to execute bash commands. When you want to execute commands, include them EXACTLY within <bash> tags like this:

<bash>ls -la</bash>

The system will execute any commands within <bash> tags and return the results. 

Some key points:
- Commands must be inside <bash> tags to be executed
- Results will be automatically provided after execution
- Multiple commands can be included in one block:

<bash>
pwd
ls -la
</bash>

Always explain the command's purpose before running it and interpret the results after seeing them.

WARNING: Do not try to simulate or predict command output - wait for actual execution results.`;

export const POST = async ({ request }) => {
	try {
		const { messages } = await request.json();

		// Add system prompt to the beginning of the conversation
		const augmentedMessages = [{ role: 'system', content: systemPrompt }, ...messages];

		let currentBashContent = '';
		let isCollectingBash = false;

		const chatResponse = await fetch('http://localhost:11434/api/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model: 'llama3.1:8b',
				messages: augmentedMessages,
				stream: true,
				options: {
					num_ctx: 9999
				}
			})
		});

		// Create stream transformer to handle bash execution
		const transformer = new TransformStream({
			async transform(chunk, controller) {
				const text = new TextDecoder().decode(chunk);
				const lines = text.split('\n').filter(Boolean);

				for (const line of lines) {
					const parsed = JSON.parse(line);
					if (!parsed.message?.content) continue;

					let content = parsed.message.content;

					// Find any bash commands in the content
					const bashRegex = /<bash>([\s\S]*?)<\/bash>/g;
					let match;
					let lastIndex = 0;
					let modifiedContent = '';

					while ((match = bashRegex.exec(content)) !== null) {
						// Add any text before the bash block
						modifiedContent += content.slice(lastIndex, match.index);

						const bashCommand = match[1].trim();
						lastIndex = match.index + match[0].length;

						try {
							// Execute the bash command
							const response = await fetch('/api/bash', {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({ command: bashCommand })
							});

							const result = await response.json();

							// Add the command and its results
							modifiedContent += `<bash>${bashCommand}</bash>\n\nCommand output:\n`;
							if (result.success) {
								if (result.stdout) modifiedContent += `stdout:\n${result.stdout}\n`;
								if (result.stderr) modifiedContent += `stderr:\n${result.stderr}\n`;
							} else {
								modifiedContent += `Error: ${result.error}\n`;
							}
						} catch (error) {
							modifiedContent += `Error executing command: ${error.message}\n`;
						}
					}

					// Add any remaining content after the last bash block
					modifiedContent += content.slice(lastIndex);

					// Send the modified content
					if (modifiedContent) {
						controller.enqueue(
							new TextEncoder().encode(
								JSON.stringify({
									message: {
										role: 'assistant',
										content: modifiedContent
									}
								}) + '\n'
							)
						);
					} else {
						controller.enqueue(chunk);
					}
				}
			}
		});

		return new Response(chatResponse.body.pipeThrough(transformer), {
			headers: {
				'Content-Type': 'application/json'
			}
		});
	} catch (error) {
		console.error('Error in chat request:', error);
		return json({ error: 'Failed to process request' }, { status: 500 });
	}
};
