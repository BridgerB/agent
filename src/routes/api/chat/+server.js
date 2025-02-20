// src/routes/api/chat/+server.js
import { json } from '@sveltejs/kit';

export const POST = async ({ request }) => {
	try {
		const { messages } = await request.json();

		const chatResponse = await fetch('http://localhost:11434/api/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				// model: 'deepseek-r1:14b',
				model: 'llama3.1:8b',
				messages,
				stream: true
			})
		});

		return new Response(chatResponse.body, {
			headers: {
				'Content-Type': 'application/json'
			}
		});
	} catch (error) {
		console.error('Error in backend request:', error);
		return json({ error: 'Failed to process request' }, { status: 500 });
	}
};
