// src/routes/api/chat/+server.js
import { json } from '@sveltejs/kit';

const systemPrompt = `You are a helpful AI assistant that can suggest both bash commands and JavaScript code to run in Node.js (v23.8.0).

When suggesting bash commands, include them EXACTLY within <bash> tags like this:
<bash>ls -la</bash>

When suggesting JavaScript to run in Node.js, use node -e with double quotes, wrapped in <bash> tags like this:
<bash>node -e "console.log('Hello world')"</bash>

IMPORTANT LIMITATIONS:
1. Do NOT use readline() or require('readline') - these don't work in the -e context
2. Do NOT use require('fs') - use window.fs API instead for file operations
3. Do NOT attempt interactive input - the terminal cannot accept user input in -e mode
4. Break complex programs into multiple separate commands

For file operations, use the window.fs API like this:
<bash>node -e "const data = await window.fs.readFile('file.txt', {encoding: 'utf8'}); console.log(data);"</bash>

For random number programs, generate and store the number first:
<bash>node -e "console.log('Secret number:', Math.floor(Math.random() * 100) + 1);"</bash>

Example interaction:
Human: Create a number guessing game
Assistant: Let's break this into steps:

1. First, generate and save our secret number:
<bash>node -e "const secret = Math.floor(Math.random() * 100) + 1; console.log('Secret number (for testing):', secret);"</bash>

2. Then create our guess checker (replace NUMBER with the generated secret):
<bash>node -e "function checkGuess(guess, secret) { return guess === secret ? 'Correct!' : guess < secret ? 'Too low!' : 'Too high!'; }; console.log(checkGuess(50, NUMBER));"</bash>

Always explain commands before suggesting them. Break complex operations into multiple simple commands.`;

export const POST = async ({ request }) => {
	try {
		const { messages } = await request.json();

		const augmentedMessages = [{ role: 'system', content: systemPrompt }, ...messages];

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

		const transformer = new TransformStream({
			start() {
				this.bufferedContent = '';
				this.messageCount = 0;
			},
			async transform(chunk, controller) {
				const text = new TextDecoder().decode(chunk);
				const lines = text.split('\n').filter(Boolean);

				for (const line of lines) {
					try {
						const parsed = JSON.parse(line);
						if (!parsed.message?.content) continue;

						this.bufferedContent += parsed.message.content;
						this.messageCount++;

						if (this.bufferedContent.trim() && parsed.done !== false) {
							controller.enqueue(
								new TextEncoder().encode(
									JSON.stringify({
										message: {
											role: 'assistant',
											content: this.bufferedContent
										}
									}) + '\n'
								)
							);

							if (parsed.done) {
								this.bufferedContent = '';
								this.messageCount = 0;
							}
						}
					} catch (error) {
						// Silent error handling
					}
				}
			},
			flush(controller) {
				if (this.bufferedContent.trim()) {
					controller.enqueue(
						new TextEncoder().encode(
							JSON.stringify({
								message: {
									role: 'assistant',
									content: this.bufferedContent
								}
							}) + '\n'
						)
					);
				}
			}
		});

		return new Response(chatResponse.body.pipeThrough(transformer), {
			headers: {
				'Content-Type': 'application/json'
			}
		});
	} catch (error) {
		return json({ error: 'Failed to process request' }, { status: 500 });
	}
};
