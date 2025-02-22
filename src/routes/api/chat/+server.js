// src/routes/api/chat/+server.js
import { json } from '@sveltejs/kit';

const systemPrompt = `You are a helpful AI assistant that can suggest both bash commands and JavaScript code to run in Node.js. 

When suggesting bash commands, include them EXACTLY within <bash> tags like this:
<bash>ls -la</bash>

When suggesting JavaScript to run in Node.js, use node -e with double quotes, wrapped in <bash> tags like this:
<bash>node -e "console.log('Hello world')"</bash>

For more complex JavaScript operations that need to process files or perform calculations, use this structure:
<bash>node -e "function doSomething(x) { return x * 2 }; const result = doSomething(21); console.log(result);"</bash>

Always explain the command's purpose before suggesting it.

Example interaction:
Human: Calculate 15 factorial
Assistant: I'll create a JavaScript function to calculate the factorial of 15 using Node.js:

<bash>node -e "function factorial(n) { return n <= 1 ? 1 : n * factorial(n-1) }; console.log(factorial(15));"</bash>

This command defines a recursive factorial function and calculates 15!, outputting the result.`;

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
