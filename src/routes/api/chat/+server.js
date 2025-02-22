// src/routes/api/chat/+server.js
import { json } from '@sveltejs/kit';

const systemPrompt = `You are a helpful AI assistant that can suggest bash commands. When you want to run commands, include them EXACTLY within <bash> tags like this:

<bash>ls -la</bash>

Always explain the command's purpose before suggesting it.`;

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
