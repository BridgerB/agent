<svelte:head>
	<title>Agent - History</title>
</svelte:head>

<div class="empty">
	<p>No history yet</p>
	<span>Completed tasks will appear here</span>
</div>

<style>
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 1rem;
		color: #666;
	}

	.empty p {
		font-size: 1.125rem;
		margin: 0 0 0.5rem;
		color: #888;
	}

	.empty span {
		font-size: 0.875rem;
	}
</style>
