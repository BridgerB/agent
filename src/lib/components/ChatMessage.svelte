<!-- src/lib/components/ChatMessage.svelte -->
<script>
	export let role;
	export let content;
	export let timestamp;

	let codeResults = new Map();
	let codeLoading = new Map();

	async function executeCode(code, blockId) {
		codeLoading.set(blockId, true);
		codeResults = codeResults; // Trigger reactivity

		try {
			const response = await fetch('/api/execute', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ code })
			});

			const data = await response.json();

			codeResults.set(blockId, {
				success: !data.error,
				result: data.result,
				output: data.output,
				error: data.error
			});
		} catch (error) {
			codeResults.set(blockId, {
				success: false,
				error: error.message
			});
		} finally {
			codeLoading.set(blockId, false);
			codeResults = codeResults; // Trigger reactivity
		}
	}

	function formatMessage(content) {
		let blockCounter = 0;

		// First, handle code blocks with language specification
		content = content.replace(/```(javascript|js)?\n([\s\S]*?)```/gi, (match, lang, code) => {
			const blockId = `block-${blockCounter++}`;
			const trimmedCode = code.trim();

			return `
                <div class="code-block" data-block-id="${blockId}">
                    <div class="code-header">
                        <span class="code-lang">${lang || 'javascript'}</span>
                        <button class="run-code-btn" data-code="${encodeURIComponent(trimmedCode)}" data-block-id="${blockId}">
                            Run Code
                        </button>
                    </div>
                    <pre><code class="language-${lang || 'javascript'}">${trimmedCode}</code></pre>
                    <div class="code-result" id="result-${blockId}"></div>
                </div>`;
		});

		// Then handle other markdown elements
		content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
		content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
		content = content.replace(/\*([^*]+)\*/g, '<em>$1</em>');

		// Handle lists
		content = content.replace(/^\s*(?:[-*]|\d+\.)\s+(.+)$/gm, '<li>$1</li>');
		content = content.replace(/(<li>.*<\/li>)\s*(?=<li>|$)/g, '<ul>$1</ul>');

		// Handle paragraphs
		content = content
			.split('\n\n')
			.map((p) => {
				p = p.trim();
				return p.startsWith('<') ? p : `<p>${p}</p>`;
			})
			.join('\n');

		return content;
	}

	function handleClick(event) {
		const button = event.target.closest('.run-code-btn');
		if (!button) return;

		const code = decodeURIComponent(button.dataset.code);
		const blockId = button.dataset.blockId;

		// Update button state
		button.disabled = true;
		button.textContent = 'Running...';

		executeCode(code, blockId).finally(() => {
			button.disabled = false;
			button.textContent = 'Run Code';

			// Update result display
			const resultDiv = document.getElementById(`result-${blockId}`);
			if (resultDiv && codeResults.has(blockId)) {
				const result = codeResults.get(blockId);
				resultDiv.innerHTML = result.error
					? `<div class="error">Error: ${result.error}</div>`
					: `<div class="output">${result.output?.join('\n') || ''}</div>
                       ${result.result !== undefined ? `<div class="result">Result: ${result.result}</div>` : ''}`;
			}
		});
	}

	$: formattedContent = formatMessage(content);
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
	<div class="message-content" on:click={handleClick}>
		{@html formattedContent}
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

	.code-block {
		position: relative;
		margin: 1rem 0;
	}

	.run-code-btn {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		padding: 0.25rem 0.75rem;
		background-color: #2563eb;
		color: white;
		border: none;
		border-radius: 0.25rem;
		cursor: pointer;
		font-size: 0.875rem;
		z-index: 1;
	}

	.run-code-btn:hover {
		background-color: #1d4ed8;
	}

	.code-result {
		margin-top: 0.5rem;
		padding: 0.75rem;
		background-color: rgba(0, 0, 0, 0.2);
		border-radius: 0.375rem;
		font-family: monospace;
		white-space: pre-wrap;
	}

	.code-result:empty {
		display: none;
	}
	.code-block {
		position: relative;
		margin: 1rem 0;
		background-color: rgba(0, 0, 0, 0.2);
		border-radius: 0.5rem;
		overflow: hidden;
	}

	.code-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 1rem;
		background-color: rgba(0, 0, 0, 0.3);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.code-lang {
		font-size: 0.875rem;
		color: #9ca3af;
		text-transform: uppercase;
	}

	.run-code-btn {
		padding: 0.25rem 0.75rem;
		background-color: #2563eb;
		color: white;
		border: none;
		border-radius: 0.25rem;
		cursor: pointer;
		font-size: 0.875rem;
		transition: background-color 0.2s;
	}

	.run-code-btn:hover {
		background-color: #1d4ed8;
	}

	.run-code-btn:disabled {
		background-color: #4b5563;
		cursor: not-allowed;
	}

	.code-result {
		margin-top: 0.5rem;
		padding: 0.75rem;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		font-family: monospace;
		white-space: pre-wrap;
	}

	.code-result:empty {
		display: none;
	}

	.code-result .error {
		color: #ef4444;
	}

	.code-result .output {
		color: #10b981;
	}

	.code-result .result {
		color: #3b82f6;
		margin-top: 0.5rem;
	}
</style>
