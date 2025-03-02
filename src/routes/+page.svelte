<!-- src/routes/+page.svelte -->
<script>
	import { writable } from 'svelte/store';
	import ChatMessage from '$lib/components/ChatMessage.svelte';
	import ChatInput from '$lib/components/ChatInput.svelte';

	let userMessage = '';
	let messages = writable([]);
	let messageContainer;

	// Auto-scroll to bottom when near the end
	function autoScroll() {
		if (!messageContainer) return;
		const { scrollTop, scrollHeight, clientHeight } = messageContainer;
		if (scrollTop + clientHeight >= scrollHeight - 50) {
			messageContainer.scrollTop = scrollHeight;
		}
	}

	$: $messages, autoScroll();

	// Execute bash command via API
	async function executeBashCommand(command) {
		const response = await fetch('/api/bash', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ command })
		});
		return await response.json();
	}

	// Stream AI response and handle bash commands
	async function streamAIResponse(messageList) {
		const response = await fetch('/api/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ messages: messageList })
		});

		if (!response.ok) throw new Error('Failed to fetch AI response');

		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let fullContent = '';
		let lastBashCommand = null;
		const bashRegex = /<bash>([\s\S]*?)<\/bash>/g;
		const thinkRegex = /<think>[\s\S]*?<\/think>/g;

		while (true) {
			const { value, done } = await reader.read();
			if (done) break;

			const text = decoder.decode(value, { stream: true });
			const lines = text.split('\n').filter(Boolean);

			for (const line of lines) {
				try {
					const parsed = JSON.parse(line);
					if (parsed.message?.content) {
						const char = parsed.message.content;
						fullContent += char;

						// Update or create assistant message
						messages.update((current) => {
							const last = current[current.length - 1];
							if (last?.role === 'agent') {
								last.content += char;
								return [...current.slice(0, -1), { ...last }];
							}
							return [
								...current,
								{ role: 'agent', content: char, timestamp: new Date().toISOString() }
							];
						});

						// Process bash commands, excluding think blocks
						const contentToProcess = fullContent.replace(thinkRegex, '');
						bashRegex.lastIndex = 0;
						lastBashCommand = null;
						let match;
						while ((match = bashRegex.exec(contentToProcess)) !== null) {
							lastBashCommand = match[1].trim();
						}
					}
					if (parsed.done && lastBashCommand) {
						const result = await executeBashCommand(lastBashCommand);
						const outputContent = result.success
							? result.stdout || 'No output'
							: `${result.stderr || result.error || 'Unknown error'}`;

						messages.update((current) => [
							...current,
							{
								role: 'system',
								content: outputContent,
								timestamp: new Date().toISOString(),
								isTerminal: true // Flag for terminal styling
							}
						]);
					}
				} catch (error) {
					console.error('Error parsing stream:', error, 'Line:', line);
				}
			}
		}
	}

	// Handle sending user message
	async function handleSendMessage() {
		if (!userMessage.trim()) return;

		messages.update((current) => [
			...current,
			{ role: 'user', content: userMessage, timestamp: new Date().toISOString() }
		]);
		const newMessages = $messages;
		userMessage = '';

		await streamAIResponse(newMessages);
	}
</script>

<div class="app-container">
	<div class="chat-container">
		<div class="messages" bind:this={messageContainer}>
			{#each $messages as message}
				{#if message.isTerminal}
					<div class="terminal-window">
						<div class="terminal-header">
							<span class="terminal-title">Terminal</span>
						</div>
						<pre class="terminal-output">{message.content}</pre>
					</div>
				{:else}
					<ChatMessage {...message} />
				{/if}
			{/each}
		</div>
		<ChatInput bind:userMessage {handleSendMessage} />
	</div>
</div>

<style>
	.app-container {
		display: flex;
		height: 100vh;
		background-color: #111212;
		color: #e5e5e5;
		padding: 1rem;
	}

	.chat-container {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
	}

	.messages {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		scroll-behavior: smooth;
	}

	.terminal-window {
		background-color: #1e1e1e;
		border-radius: 6px;
		margin: 0.5rem 0;
		max-width: 600px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}

	.terminal-header {
		background-color: #2d2d2d;
		padding: 0.3rem 0.6rem;
		border-top-left-radius: 6px;
		border-top-right-radius: 6px;
		display: flex;
		align-items: center;
	}

	.terminal-title {
		color: #999;
		font-size: 0.8rem;
	}

	.terminal-output {
		margin: 0;
		padding: 0.8rem;
		font-family: 'Courier New', monospace;
		font-size: 0.9rem;
		color: #00ff00;
		white-space: pre-wrap;
		word-wrap: break-word;
	}
</style>
