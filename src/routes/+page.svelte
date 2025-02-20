<!-- src/routes/+page.svelte -->
<script>
	import { writable } from 'svelte/store';

	let userMessage = '';
	let messages = writable([]);

	async function sendMessage() {
		if (userMessage.trim()) {
			const newMessages = [...$messages, { role: 'user', content: userMessage }];
			messages.set(newMessages);
			userMessage = '';

			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ messages: newMessages })
			});

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let done = false;
			let buffer = '';

			while (!done) {
				const { value, done: readerDone } = await reader.read();
				done = readerDone;
				buffer += decoder.decode(value, { stream: !readerDone });

				try {
					const jsonChunks = buffer.split('\n').filter(Boolean);
					for (const chunk of jsonChunks) {
						const parsedChunk = JSON.parse(chunk);
						if (parsedChunk.message?.content) {
							messages.update((current) => {
								const lastMessage = current[current.length - 1];
								if (lastMessage?.role === 'assistant') {
									lastMessage.content += parsedChunk.message.content;
								} else {
									current = [
										...current,
										{ role: 'assistant', content: parsedChunk.message.content }
									];
								}
								return current;
							});
						}
					}
					buffer = ''; // Clear buffer after successful parsing
				} catch (error) {
					console.error(error);
					// If parsing fails, the buffer may not yet contain a complete JSON object, so we keep the buffer for the next iteration
				}
			}
		}
	}
</script>

<div class="chat-container">
	<div class="messages">
		{#each $messages as { role, content }}
			<div class="message {role}">
				<strong>{role === 'user' ? 'You' : 'Assistant'}:</strong>
				{content}
			</div>
		{/each}
	</div>
	<div class="input-area">
		<input
			type="text"
			bind:value={userMessage}
			on:keydown={(e) => e.key === 'Enter' && sendMessage()}
			placeholder="Type your message..."
		/>
		<button on:click={sendMessage}>Send</button>
	</div>
</div>

<style>
	/* Basic styles for the chat UI */
	.chat-container {
		max-width: 600px;
		margin: 0 auto;
		padding: 20px;
		border: 1px solid #ddd;
		border-radius: 8px;
	}

	.messages {
		max-height: 400px;
		overflow-y: auto;
		margin-bottom: 20px;
	}

	.message {
		padding: 10px;
		margin-bottom: 10px;
		border-radius: 5px;
	}

	.message.user {
		background-color: #daf8e3;
		text-align: right;
	}

	.message.assistant {
		background-color: #f1f1f1;
	}

	.input-area {
		display: flex;
	}

	.input-area input {
		flex: 1;
		padding: 10px;
		border: 1px solid #ddd;
		border-radius: 4px;
	}

	.input-area button {
		margin-left: 10px;
		padding: 10px;
		border: none;
		background-color: #007bff;
		color: white;
		border-radius: 4px;
	}
</style>
