<!-- src/routes/+page.svelte -->
<script>
	import { writable } from 'svelte/store';
	import ChatMessage from '$lib/components/ChatMessage.svelte';
	import ChatInput from '$lib/components/ChatInput.svelte';
	import Terminal from '$lib/components/Terminal.svelte';
	export let data;
	let userMessage = '';
	let messages = writable([]);
	let messageContainer;
	let editorValue = '// Write your code here...';
	let terminalComponent;

	// Auto-scroll to bottom when messages update
	$: if (messageContainer && $messages) {
		setTimeout(() => {
			messageContainer.scrollTop = messageContainer.scrollHeight;
		}, 0);
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
						console.log('Received content:', parsed.message.content);
						// Check for command markers
						const content = parsed.message.content;
						const bashRegex = /<bash>([\s\S]*?)<\/bash>/g;
						let match;

						while ((match = bashRegex.exec(content)) !== null) {
							const command = match[1].trim();
							console.log('Found command to execute:', command);
							if (terminalComponent) {
								await terminalComponent.simulateCommand(command);
							}
						}

						messages.update((current) => {
							const lastMessage = current[current.length - 1];
							if (lastMessage?.role === 'agent') {
								lastMessage.content += content;
							} else {
								current = [
									...current,
									{
										role: 'agent',
										content,
										timestamp: new Date().toISOString()
									}
								];
							}
							return current;
						});
					}
				} catch (error) {
					console.error('Error processing message:', error);
				}
			}
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
	<div class="editor-container">
		<div class="editor-wrapper"></div>
		<Terminal bind:this={terminalComponent} />
	</div>
</div>

<style>
	.app-container {
		display: grid;
		grid-template-columns: 1fr 1fr;
		height: 100vh;
		background-color: rgb(17, 18, 18);
		color: #e5e5e5;
		gap: 1rem;
		padding: 1rem;
	}

	.chat-container {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.messages {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		scroll-behavior: smooth;
		background-color: rgba(30, 31, 34, 0.95);
		border-radius: 4px;
	}

	.editor-container {
		display: flex;
		flex-direction: column;
		height: 100%;
		background-color: rgba(30, 31, 34, 0.95);
		border-radius: 4px;
		overflow: hidden;
	}

	.editor-wrapper {
		flex: 1;
		height: 70%;
	}
</style>
