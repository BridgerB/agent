<!-- src/lib/components/ChatMessage.svelte -->
<script>
	export let role;
	export let content;
	export let timestamp;

	function formatMessage(content) {
		// Handle code blocks
		content = content.replace(/```([\s\S]*?)```/gi, (match, code) => {
			const trimmedCode = code.trim();
			return `
				<pre><code>${trimmedCode}</code></pre>
			`;
		});

		// Handle inline code
		content = content.replace(/`([^`]+)`/g, '<code>$1</code>');

		// Handle bold text
		content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

		// Handle italicized text
		content = content.replace(/\*([^*]+)\*/g, '<em>$1</em>');

		// Handle unordered lists
		content = content.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
		content = content.replace(/(<li>.*<\/li>)\s*(?=<li>|$)/g, '<ul>$1</ul>');

		// Handle paragraphs
		content = content
			.split('\n\n')
			.map((p) => `<p>${p.trim()}</p>`)
			.join('\n');

		return content;
	}

	$: formattedContent = formatMessage(content);
</script>

<div class="message {role}">
	<div class="message-header">
		<div class="avatar {role}">
			{role === 'user' ? 'You' : 'AI'}
		</div>
		<div class="message-info">
			<div class="name">{role === 'user' ? 'You' : 'AI Assistant'}</div>
			<div class="timestamp">{new Date(timestamp).toLocaleString()}</div>
		</div>
	</div>
	<div class="message-content">
		{@html formattedContent}
	</div>
</div>

<style>
	.message {
		margin-bottom: 1rem;
		padding: 0.75rem;
		border-radius: 0.5rem;
	}

	.message.user {
		background-color: #3f3f46;
	}

	.message.agent {
		background-color: #18181b;
	}

	.message-header {
		display: flex;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.avatar {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		background: #2d2d30;
		color: #a1a1aa;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 0.75rem;
	}

	.message-info {
		line-height: 1.25;
	}

	.name {
		font-weight: 500;
	}

	.timestamp {
		font-size: 0.75rem;
		color: #a1a1aa;
	}

	.message-content :global(pre) {
		margin: 0.5rem 0;
		padding: 0.5rem;
		background: #2d2d30;
		overflow-x: auto;
		border-radius: 0.375rem;
	}

	.message-content :global(code) {
		font-family: monospace;
	}

	.message-content :global(p) {
		margin: 0.5rem 0;
	}

	.message-content :global(ul) {
		padding-left: 1rem;
		margin: 0.5rem 0;
	}
</style>
