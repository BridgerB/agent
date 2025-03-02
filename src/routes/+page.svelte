<!-- src/routes/+page.svelte -->
<script>
	import { writable } from 'svelte/store';
	import ChatMessage from '$lib/components/ChatMessage.svelte';
	import ChatInput from '$lib/components/ChatInput.svelte';
	let userMessage = '';
	let messages = writable([]);
	let messageContainer;
	let lastScrollTop = 0; // Track the last scroll position

	// Smart auto-scroll: only scroll to bottom if user is near the bottom or just sent a message
	function autoScroll() {
		if (!messageContainer) return;

		const { scrollTop, scrollHeight, clientHeight } = messageContainer;
		const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50; // 50px tolerance

		// Only scroll if the user was already near the bottom
		if (isNearBottom) {
			setTimeout(() => {
				messageContainer.scrollTop = messageContainer.scrollHeight;
			}, 0);
		}
	}

	// Update scroll tracking on user scroll
	function handleScroll() {
		lastScrollTop = messageContainer.scrollTop;
	}

	// Watch for message updates and trigger smart auto-scroll
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

	async function fetchAIResponse(messageList) {
		const response = await fetch('/api/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ messages: messageList })
		});

		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = '';
		let fullContent = '';

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
		return fullContent;
	}

	async function handleSendMessage() {
		if (!userMessage.trim()) return;

		// Add user message to the chat
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

		// Force scroll to bottom after user sends a message
		setTimeout(() => {
			if (messageContainer) {
				messageContainer.scrollTop = messageContainer.scrollHeight;
			}
		}, 0);

		// Get initial AI response
		const initialResponse = await fetchAIResponse(newMessages);
		console.log('Initial AI response:', initialResponse);

		// Check for and execute bash commands
		const bashRegex = /<bash>([\s\S]*?)<\/bash>/g;
		let match;
		const commandOutputs = [];

		while ((match = bashRegex.exec(initialResponse)) !== null) {
			const command = match[1].trim();
			const result = await executeBashCommand(command);

			// Add command output to the chat
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

		// If commands were executed, re-prompt the AI with context
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

			// Get follow-up AI response
			const followUpResponse = await fetchAIResponse(followUpMessages);
			console.log('Follow-up AI response:', followUpResponse);
		}
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
