<!-- src/routes/+page.svelte -->
<script>
	import { writable } from 'svelte/store';
	import ChatMessage from '$lib/components/ChatMessage.svelte';
	import ChatInput from '$lib/components/ChatInput.svelte';

	let userMessage = '';
	let messages = writable([]);
	let messageContainer;

	function autoScroll() {
		if (!messageContainer) return;
		const { scrollTop, scrollHeight, clientHeight } = messageContainer;
		const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50;
		if (isNearBottom) {
			messageContainer.scrollTop = messageContainer.scrollHeight;
		}
	}

	$: if ($messages) autoScroll();

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
	async function streamAIResponse(messageList) {
		const response = await fetch('/api/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ messages: messageList })
		});

		if (!response.ok) {
			throw new Error('Failed to fetch AI response');
		}

		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let fullContent = '';
		let lastBashCommand = null; // Only store the last bash command
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

						// Update the last assistant message or create a new one
						messages.update((current) => {
							const lastMessage = current[current.length - 1];
							if (lastMessage?.role === 'agent') {
								lastMessage.content += char;
								return [...current.slice(0, -1), { ...lastMessage }];
							} else {
								return [
									...current,
									{
										role: 'agent',
										content: char,
										timestamp: new Date().toISOString()
									}
								];
							}
						});

						// Process content for bash commands, excluding those in think blocks
						let contentToProcess = fullContent;
						// Remove think blocks before bash processing
						contentToProcess = contentToProcess.replace(thinkRegex, '');

						// Find all bash commands and keep only the last one
						let match;
						bashRegex.lastIndex = 0; // Reset regex index
						lastBashCommand = null; // Reset before re-evaluating
						while ((match = bashRegex.exec(contentToProcess)) !== null) {
							lastBashCommand = match[1].trim(); // Overwrite with the latest command
						}
					}
					if (parsed.done && lastBashCommand) {
						// Execute only the last bash command after streaming completes
						const result = await executeBashCommand(lastBashCommand);
						const outputContent = result.success
							? `Command: \`${lastBashCommand}\`\nOutput:\n\`\`\`\n${result.stdout || 'No output'}\n\`\`\``
							: `Command: \`${lastBashCommand}\`\nError:\n\`\`\`\n${result.stderr || result.error || 'Unknown error'}\n\`\`\``;

						messages.update((current) => [
							...current,
							{
								role: 'system',
								content: outputContent,
								timestamp: new Date().toISOString()
							}
						]);
					}
				} catch (error) {
					console.error('Error parsing stream line:', error, 'Line:', line);
				}
			}
		}
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

		if (messageContainer) {
			messageContainer.scrollTop = messageContainer.scrollHeight;
		}

		await streamAIResponse(newMessages);
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
