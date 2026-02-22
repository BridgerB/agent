<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const handleLogout = async () => {
		await fetch('/api/auth/logout', { method: 'POST' });
		window.location.href = '/login';
	};
</script>

<svelte:head>
	<title>Agent</title>
</svelte:head>

<div class="page">
	<div class="header">
		<h1>Agent</h1>
		{#if data.user}
			<button onclick={handleLogout}>Sign out</button>
		{/if}
	</div>

	{#if data.user}
		<p>Signed in as {data.user.email}</p>
		<a href={resolve('/integrations')}>Integrations &rarr;</a>
	{/if}
</div>

<style>
	.page {
		max-width: 720px;
		margin: 0 auto;
		padding: 2rem;
		font-family: system-ui, sans-serif;
		color: #eee;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	h1 {
		margin: 0;
	}

	p {
		color: #aaa;
	}

	a {
		color: #818cf8;
		font-size: 1.125rem;
	}

	button {
		padding: 0.5rem 1rem;
		border: 1px solid #333;
		border-radius: 6px;
		background: #222;
		color: #eee;
		cursor: pointer;
		font-size: 0.875rem;
	}

	button:hover {
		background: #2a2a2a;
		border-color: #555;
	}
</style>
