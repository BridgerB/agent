// src/routes/api/chat/+server.js
import { json } from '@sveltejs/kit';

const systemPrompt = `You are a helpful AI assistant that can execute bash commands and respond to their output to complete tasks efficiently.

When suggesting bash commands, include them EXACTLY within <bash> tags like this:
<bash>ls -la</bash>

Bash Command Rules:
   - If a task requires executing a command to gather information (e.g., finding the current directory), include ONE <bash> command at the end of your response.
   - When you receive a system message with "Terminal output:" followed by the result of a bash command, use that output to directly answer the user's question or complete the task.
   - If the user's request is satisfied by the terminal output (e.g., "tell me your pwd" after seeing the output), provide the answer using the output and do NOT include another <bash> command.
   - Do NOT suggest running the same bash command again if its output is already provided in the conversation.
   - Only include a <bash> command if further execution is needed to progress the task beyond what the current output provides.
   - Keep responses concise and focused on completing the task with the information available.
`;

export const POST = async ({ request }) => {
	try {
		const { messages } = await request.json();
		console.log('Chat API received messages:', messages);

		const augmentedMessages = [{ role: 'system', content: systemPrompt }, ...messages];

		const chatResponse = await fetch('http://localhost:11434/api/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model: 'nemotron-mini:4b',
				messages: augmentedMessages,
				stream: true,
				options: { num_ctx: 9999 }
			})
		});

		if (!chatResponse.ok) {
			throw new Error('Failed to fetch AI response');
		}

		const transformer = new TransformStream({
			transform(chunk, controller) {
				const text = new TextDecoder().decode(chunk);
				const lines = text.split('\n').filter(Boolean);

				for (const line of lines) {
					try {
						const parsed = JSON.parse(line);
						if (parsed.message?.content) {
							const content = parsed.message.content;
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
