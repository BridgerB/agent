<!-- src/routes/+page.svelte -->
<script>
	import { writable } from 'svelte/store';
	import ChatMessage from '$lib/components/ChatMessage.svelte';
	import ChatInput from '$lib/components/ChatInput.svelte';
	let userMessage = '';
	let messages = writable([]);
	let messageContainer;
	let lastScrollTop = 0;

	// Smart auto-scroll: only scroll to bottom if user is near the bottom
	function autoScroll() {
		if (!messageContainer) return;
		const { scrollTop, scrollHeight, clientHeight } = messageContainer;
		const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50;
		if (isNearBottom) {
			messageContainer.scrollTop = messageContainer.scrollHeight;
		}
	}

	// Track user scroll position
	function handleScroll() {
		lastScrollTop = messageContainer.scrollTop;
	}

	// Trigger auto-scroll on message updates
	$: if ($messages) autoScroll();

	// Execute bash command and return result
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

	// Stream AI response and process dynamically
	async function streamAIResponse(messageList, onComplete) {
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
		let buffer = '';
		let fullContent = '';
		let bashCommands = [];
		const bashRegex = /<bash>([\s\S]*?)<\/bash>/g;

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
						const chunk = parsed.message.content;
						console.log('Streaming chunk:', chunk);
						fullContent += chunk;

						// Force immediate UI update for each chunk
						messages.update((current) => {
							const lastMessage = current[current.length - 1];
							if (lastMessage?.role === 'agent') {
								lastMessage.content += chunk;
								return [...current.slice(0, -1), { ...lastMessage }]; // Force new object
							} else {
								return [
									...current,
									{
										role: 'agent',
										content: chunk,
										timestamp: new Date().toISOString()
									}
								];
							}
						});

						// Check for bash commands in the stream
						let match;
						while ((match = bashRegex.exec(fullContent)) !== null) {
							const command = match[1].trim();
							if (!bashCommands.includes(command)) {
								bashCommands.push(command);
							}
						}
					}
				} catch (error) {
					console.error('Error parsing chunk:', error, 'Line:', line);
				}
			}
		}

		// Process commands and call onComplete after streaming ends
		const commandOutputs = [];
		for (const command of bashCommands) {
			const result = await executeBashCommand(command);
			const outputContent = result.success
				? `Command: \`${command}\`\nOutput:\n\`\`\`\n${result.stdout || 'No output'}\n\`\`\``
				: `Command: \`${command}\`\nError:\n\`\`\`\n${result.stderr || result.error || 'Unknown error'}\n\`\`\``;

			messages.update((current) => [
				...current,
				{
					role: 'system',
					content: outputContent,
					timestamp: new Date().toISOString()
				}
			]);

			commandOutputs.push({
				command,
				output: result.success ? result.stdout : result.stderr || result.error
			});
		}

		onComplete(fullContent, commandOutputs);
	}

	// Handle user message and orchestrate streaming
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
		const originalUserMessage = userMessage;
		userMessage = '';

		// Scroll to bottom when user sends a message
		if (messageContainer) {
			messageContainer.scrollTop = messageContainer.scrollHeight;
		}

		// Stream initial AI response
		await streamAIResponse(newMessages, async (initialResponse, commandOutputs) => {
			console.log('Initial AI response complete:', initialResponse);

			// If commands were executed, re-prompt AI with context
			if (commandOutputs.length > 0) {
				const followUpPrompt = `Original user message: "${originalUserMessage}"\nInitial AI response: "${initialResponse}"\nCommand outputs:\n${commandOutputs
					.map((co) => `Command: "${co.command}"\nOutput: "${co.output}"`)
					.join('\n')}`;

				const followUpMessages = [
					...newMessages,
					{
						role: 'system',
						content: followUpPrompt,
						timestamp: new Date().toISOString()
					}
				];

				// Stream follow-up AI response
				await streamAIResponse(followUpMessages, (followUpResponse, _) => {
					console.log('Follow-up AI response complete:', followUpResponse);
				});
			}
		});
	}
</script>

<div class="app-container">
	<div class="chat-container">
		<div class="messages" bind:this={messageContainer} on:scroll={handleScroll}>
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
