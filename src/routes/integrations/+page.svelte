<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const providers = [
		{ type: 'slack', label: 'Slack' },
		{ type: 'jira', label: 'Jira' },
		{ type: 'github', label: 'GitHub' }
	] as const;

	function getIntegration(type: string) {
		return data.integrations.find((i) => i.type === type);
	}
</script>

<svelte:head>
	<title>Integrations</title>
</svelte:head>

<div class="page">
	<a href={resolve('/')}>&larr; Back</a>
	<h1>Integrations</h1>

	{#if form?.error}
		<p class="error">{form.error}</p>
	{/if}
	{#if form?.success}
		<p class="success">{form.type} connected.</p>
	{/if}
	{#if form?.removed}
		<p class="success">Integration removed.</p>
	{/if}

	<div class="grid">
		{#each providers as provider (provider.type)}
			{@const existing = getIntegration(provider.type)}
			<div class="card">
				<h2>{provider.label}</h2>

				{#if existing}
					<p class="connected">Connected as <strong>{existing.username}</strong></p>
					<form method="POST" action="?/remove">
						<input type="hidden" name="id" value={existing.id} />
						<button type="submit" class="btn-remove">Disconnect</button>
					</form>
				{:else}
					<form method="POST" action="?/save">
						<input type="hidden" name="type" value={provider.type} />
						<label>
							Username
							<input type="text" name="username" required />
						</label>
						<label>
							Password
							<input type="password" name="password" required />
						</label>
						<button type="submit">Connect</button>
					</form>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.page {
		max-width: 720px;
		margin: 0 auto;
		padding: 2rem;
		font-family: system-ui, sans-serif;
	}

	h1 {
		margin: 1rem 0 1.5rem;
	}

	.grid {
		display: grid;
		gap: 1.5rem;
	}

	.card {
		border: 1px solid #333;
		border-radius: 8px;
		padding: 1.5rem;
		background: #1a1a1a;
	}

	.card h2 {
		margin: 0 0 1rem;
	}

	label {
		display: block;
		margin-bottom: 0.75rem;
		font-size: 0.875rem;
		color: #aaa;
	}

	input[type='text'],
	input[type='password'] {
		display: block;
		width: 100%;
		padding: 0.5rem;
		margin-top: 0.25rem;
		border: 1px solid #444;
		border-radius: 4px;
		background: #111;
		color: #eee;
		font-size: 1rem;
		box-sizing: border-box;
	}

	button {
		padding: 0.5rem 1.25rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.875rem;
		background: #4f46e5;
		color: white;
	}

	button:hover {
		background: #4338ca;
	}

	.btn-remove {
		background: #991b1b;
	}

	.btn-remove:hover {
		background: #7f1d1d;
	}

	.connected {
		color: #4ade80;
		margin-bottom: 0.75rem;
	}

	.error {
		color: #f87171;
		padding: 0.5rem;
		border: 1px solid #f87171;
		border-radius: 4px;
	}

	.success {
		color: #4ade80;
		padding: 0.5rem;
		border: 1px solid #4ade80;
		border-radius: 4px;
	}

	a {
		color: #818cf8;
	}
</style>
