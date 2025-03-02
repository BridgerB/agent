<!-- src/routes/+page.svelte -->
<script>
	import { writable } from 'svelte/store';
	import ChatMessage from '$lib/components/ChatMessage.svelte';
	import ChatInput from '$lib/components/ChatInput.svelte';
	let userMessage = '';
	let messages = writable([]);
	let messageContainer;

	// Auto-scroll to bottom when messages update
	$: if (messageContainer && $messages) {
		setTimeout(() => {
			messageContainer.scrollTop = messageContainer.scrollHeight;
		}, 0);
	}

	async function executeBashCommand(command) {
		console.log('Executing bash command:', command);
		const response = await fetch('/api/bash', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ command })
		});
		const result = await response.json();
		console.log('Bash command result:', result);
		return result;
	}

	async function handleSendMessage() {
		if (!userMessage.trim()) return;

		const newMessages = [
			...$messages,
			{
				role: 'user',
				content: userMessage,
				timestamp: new Date().toISOString()
			}
		];
		messages.set(newMessages);
		userMessage = '';

		const response = await fetch('/api/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ messages: newMessages })
		});

		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = '';
		let fullContent = ''; // Accumulate full AI response

		while (true) {
			const { value, done } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() || '';

			for (const line of lines) {
				try {
					const parsed = JSON.parse(line);
					if (parsed.message?.content) {
						console.log('Received chat content chunk:', parsed.message.content);
						fullContent += parsed.message.content;

						messages.update((current) => {
							const lastMessage = current[current.length - 1];
							if (lastMessage?.role === 'agent') {
								lastMessage.content += parsed.message.content;
							} else {
								current = [
									...current,
									{
										role: 'agent',
										content: parsed.message.content,
										timestamp: new Date().toISOString()
									}
								];
							}
							return current;
						});
					}
				} catch (error) {
					console.error('Error processing chat message:', error);
				}
			}
		}

		// After the full response is received, check for and execute <bash> commands
		console.log('Full AI response:', fullContent);
		const bashRegex = /<bash>([\s\S]*?)<\/bash>/g;
		let match;
		while ((match = bashRegex.exec(fullContent)) !== null) {
			const command = match[1].trim();
			await executeBashCommand(command);
		}
	}
</script>

<div class="app-container">
	<div class="chat-container">
		<div class="messages" bind:this={messageContainer}>
			{#each $messages as message}
				<ChatMessage {...message} />
			{/each}
		</div>
		<ChatInput bind:userMessage {handleSendMessage} />
	</div>
</div>

<style>
	.app-container {
		display: flex;
		height: 100vh;
		background-color: rgb(17, 18, 18);
		color: #e5e5e5;
		padding: 1rem;
	}

	.chat-container {
		display: flex;
		flex-direction: column;
		height: 100%;
		width: 100%;
	}

	.messages {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		scroll-behavior: smooth;
		background-color: rgba(30, 31, 34, 0.95);
		border-radius: 4px;
	}
</style>
