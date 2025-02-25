<!-- src/routes/+page.svelte -->
<script>
	import { writable } from 'svelte/store';
	import ChatMessage from '$lib/components/ChatMessage.svelte';
	import ChatInput from '$lib/components/ChatInput.svelte';
	import VSCode from '$lib/components/VSCode.svelte';

	let userMessage = '';
	let messages = writable([]);
	let messageContainer;
	let startX;
	let editorWidth;
	let chatWidth;

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
							if (lastMessage?.role === 'agent') {
								lastMessage.content += parsedChunk.message.content;
							} else {
								current = [
									...current,
									{
										role: 'agent',
										content: parsedChunk.message.content,
										timestamp: new Date().toISOString()
									}
								];
							}
							return current;
						});
					}
				}
				buffer = '';
			} catch (error) {
				console.error(error);
			}
		}
	}

	function handleDragStart(event) {
		startX = event.clientX;
		editorWidth = document.querySelector('.editor-container').offsetWidth;
		chatWidth = document.querySelector('.chat-container').offsetWidth;
	}

	function handleDrag(event) {
		if (!startX) return;
		const dx = event.clientX - startX;
		const newEditorWidth = editorWidth + dx;
		const newChatWidth = chatWidth - dx;

		// Set minimum widths
		const minWidth = 200;
		if (newEditorWidth < minWidth || newChatWidth < minWidth) return;

		document.querySelector('.editor-container').style.flex = `0 0 ${newEditorWidth}px`;
		document.querySelector('.chat-container').style.flex = `0 0 ${newChatWidth}px`;
	}

	function handleDragEnd() {
		startX = null;
	}
</script>

<div class="app-container">
	<div class="editor-container">
		<VSCode />
	</div>
	<div
		class="splitter"
		draggable="true"
		on:dragstart={handleDragStart}
		on:drag={handleDrag}
		on:dragend={handleDragEnd}
	></div>
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
		gap: 0;
	}

	.editor-container {
		flex: 3; /* 75% initial width */
		height: 100%;
		background-color: rgba(30, 31, 34, 0.95);
		border-radius: 4px 0 0 4px;
		overflow: hidden;
	}

	.chat-container {
		flex: 1; /* 25% initial width */
		display: flex;
		flex-direction: column;
		height: 100%;
		background-color: rgba(30, 31, 34, 0.95);
		border-radius: 0 4px 4px 0;
	}

	.messages {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		scroll-behavior: smooth;
	}

	.splitter {
		width: 5px;
		background-color: #666;
		cursor: ew-resize;
		height: 100%;
	}

	.splitter:hover {
		background-color: #888;
	}
</style>
