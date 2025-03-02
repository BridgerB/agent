// src/routes/api/chat/+server.js
import { json } from '@sveltejs/kit';

const systemPrompt = `You are a helpful AI assistant that can suggest both bash commands and JavaScript code to run in Node.js (v23.8.0).

When suggesting bash commands, include them EXACTLY within <bash> tags like this:
<bash>ls -la</bash>

When suggesting JavaScript to run in Node.js, use node -e with double quotes, wrapped in <bash> tags like this:
<bash>node -e "console.log('Hello world')"</bash>

1. Context: You will receive the full conversation history with each request. Use this context to inform your responses.
2. Bash Command Rule: 
   - Your response involves executing a command and it's the final step of a completed task, end your response with EXACTLY ONE relevant <bash> command
   - Do NOT include a final bash command if you've completed a multi-step task
   - Do NOT include multiple bash commands at the end
3. Fresh Responses: Treat each interaction as a new prompt, but with full context from previous messages
4. Keep responses focused on the current request while considering the conversation history

IMPORTANT LIMITATIONS:
1. Do NOT use readline() or require('readline') - these don't work in the -e context
2. Do NOT use require('fs') - use window.fs API instead for file operations
3. Do NOT attempt interactive input - the terminal cannot accept user input in -e mode
4. Break complex programs into multiple separate commands`;

export const POST = async ({ request }) => {
	try {
		const { messages } = await request.json();
		console.log('Chat API received messages:', messages);

		const augmentedMessages = [{ role: 'system', content: systemPrompt }, ...messages];

		const chatResponse = await fetch('http://localhost:11434/api/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model: 'llama3.1:8b',
				messages: augmentedMessages,
				stream: true,
				options: { num_ctx: 9999 }
			})
		});

		if (!chatResponse.ok) {
			throw new Error('Failed to fetch AI response');
		}

		// Custom TransformStream to stream each character
		const transformer = new TransformStream({
			transform(chunk, controller) {
				const text = new TextDecoder().decode(chunk);
				const lines = text.split('\n').filter(Boolean);

				for (const line of lines) {
					try {
						const parsed = JSON.parse(line);
						if (parsed.message?.content) {
							const content = parsed.message.content;
							// Stream each character individually
							for (const char of content) {
								controller.enqueue(
									new TextEncoder().encode(
										JSON.stringify({
											message: { role: 'assistant', content: char }
										}) + '\n'
									)
								);
							}
						}
						if (parsed.done) {
							controller.enqueue(new TextEncoder().encode(JSON.stringify({ done: true }) + '\n'));
						}
					} catch (error) {
						console.error('Error parsing AI response line:', error, 'Line:', line);
					}
				}
			}
		});

		return new Response(chatResponse.body.pipeThrough(transformer), {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive'
			}
		});
	} catch (error) {
		console.error('Chat API error:', error);
		return json({ error: error.message }, { status: 500 });
	}
};
