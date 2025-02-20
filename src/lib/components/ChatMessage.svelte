<!-- src/lib/components/ChatMessage.svelte -->
<script>
	export let role;
	export let content;
	export let timestamp;

	// Improved markdown-style formatting
	function formatMessage(content) {
		// Replace code blocks with language specification
		content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
			const language = lang ? ` language-${lang}` : '';
			return `<pre><code class="${language}">${code.trim()}</code></pre>`;
		});

		// Replace inline code
		content = content.replace(/`([^`]+)`/g, '<code>$1</code>');

		// Replace bold text
		content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

		// Replace italics
		content = content.replace(/\*([^*]+)\*/g, '<em>$1</em>');

		// Replace lists (now handles nested lists better)
		content = content.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
		content = content.replace(/^-\s+(.+)$/gm, '<li>$1</li>');

		// Wrap lists in appropriate containers
		content = content.replace(/<li>.*?<\/li>(\n<li>.*?<\/li>)*/g, (match) => `<ul>${match}</ul>`);

		// Add paragraphs while preserving code blocks
		const blocks = [];
		content = content.replace(/<pre>[\s\S]*?<\/pre>/g, (match) => {
			blocks.push(match);
			return `__CODEBLOCK${blocks.length - 1}__`;
		});

		content = content
			.split('\n\n')
			.map((p) => p.trim())
			.filter((p) => p)
			.map((p) => (p.startsWith('<') ? p : `<p>${p}</p>`))
			.join('\n');

		// Restore code blocks
		content = content.replace(/__CODEBLOCK(\d+)__/g, (_, i) => blocks[i]);

		return content;
	}
</script>

<div class="message {role}">
	<div class="message-header">
		<div class="avatar {role}">
			{role === 'user' ? 'U' : 'A'}
		</div>
		<div class="message-info">
			<span class="name">{role === 'user' ? 'You' : 'Agent'}</span>
			<div class="timestamp">
				<span>{new Date(timestamp).toLocaleTimeString()}</span>
			</div>
		</div>
	</div>
	<div class="message-content">
		{@html formatMessage(content)}
	</div>
</div>

<style>
	/* Previous styles remain the same */
	.message {
		margin-bottom: 1.5rem;
		padding: 1rem;
		border-radius: 0.5rem;
		background-color: rgba(30, 31, 34, 0.95);
	}

	.message.agent {
		background-color: rgba(35, 36, 40, 0.95);
	}

	.message-header {
		display: flex;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.avatar {
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
		margin-right: 0.75rem;
	}

	.avatar.user {
		background-color: #9333ea;
	}

	.avatar.agent {
		background-color: #2563eb;
	}

	.message-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.name {
		font-weight: 600;
		color: #e5e5e5;
	}

	.timestamp {
		color: #9ca3af;
		font-size: 0.75rem;
	}

	.message-content {
		line-height: 1.5;
		overflow-wrap: break-word;
	}

	/* Improved code block styling */
	.message-content :global(pre) {
		background-color: rgba(0, 0, 0, 0.2);
		padding: 1rem;
		border-radius: 0.375rem;
		overflow-x: auto;
		margin: 0.5rem 0;
		position: relative;
	}

	.message-content :global(pre code) {
		font-family: 'Fira Code', monospace;
		font-size: 0.875rem;
		display: block;
		padding: 0;
		background-color: transparent;
	}

	/* Add language indicator */
	.message-content :global(pre code[class*='language-']):before {
		content: attr(class);
		position: absolute;
		top: 0;
		right: 0;
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		color: #9ca3af;
		background-color: rgba(0, 0, 0, 0.3);
		border-radius: 0 0.375rem 0 0.25rem;
		text-transform: capitalize;
	}

	.message-content :global(code) {
		font-family: monospace;
		font-size: 0.875rem;
		padding: 0.2rem 0.4rem;
		background-color: rgba(0, 0, 0, 0.2);
		border-radius: 0.25rem;
	}

	.message-content :global(p) {
		margin: 0.5rem 0;
	}

	.message-content :global(ul) {
		margin: 0.5rem 0;
		padding-left: 1.5rem;
	}

	.message-content :global(li) {
		margin: 0.25rem 0;
	}
</style>
