<!-- src/lib/components/ChatInput.svelte -->
<script>
	export let handleSendMessage;
	export let userMessage = '';

	// Function to adjust textarea height
	function adjustHeight(event) {
		const textarea = event.target;
		textarea.style.height = 'auto'; // Reset height to auto to get correct scrollHeight
		textarea.style.height = `${Math.min(textarea.scrollHeight, 500)}px`; // Set height to content or 500px max
	}
</script>

<div class="input-area">
	<textarea
		bind:value={userMessage}
		on:keydown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
		on:input={adjustHeight}
		placeholder="Type your message... (Shift+Enter for new line)"
		rows="1"
	></textarea>
	<button on:click={handleSendMessage} disabled={!userMessage.trim()}> Send </button>
</div>

<style>
	.input-area {
		display: flex;
		padding: 1rem;
		gap: 0.5rem;
		background-color: rgb(24, 25, 26);
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	textarea {
		flex: 1;
		padding: 0.75rem;
		font-size: 1rem;
		background-color: rgba(30, 31, 34, 0.95);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.375rem;
		color: #e5e5e5;
		resize: vertical;
		min-height: 2.5rem;
		line-height: 1.5;
		max-height: 500px;
		overflow-y: auto;
	}

	textarea:focus {
		outline: none;
		border-color: #2563eb;
	}

	button {
		padding: 0.75rem 1.5rem;
		font-size: 1rem;
		background-color: #2563eb;
		color: white;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	button:hover {
		background-color: #1d4ed8;
	}

	button:disabled {
		background-color: #4b5563;
		cursor: not-allowed;
	}
</style>
