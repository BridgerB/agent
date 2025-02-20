<!-- src/lib/components/ChatInput.svelte -->
<script>
	export let onSendMessage;
	export let userMessage = '';
</script>

<div class="input-area">
	<input
		type="text"
		bind:value={userMessage}
		on:keydown={(e) => e.key === 'Enter' && !e.shiftKey && onSendMessage()}
		placeholder="Type your message..."
	/>
	<button on:click={onSendMessage} disabled={!userMessage.trim()}> Send </button>
</div>

<style>
	.input-area {
		display: flex;
		padding: 1rem;
		gap: 0.5rem;
		background-color: rgb(24, 25, 26);
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	input {
		flex: 1;
		padding: 0.75rem;
		font-size: 1rem;
		background-color: rgba(30, 31, 34, 0.95);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.375rem;
		color: #e5e5e5;
	}

	input:focus {
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
