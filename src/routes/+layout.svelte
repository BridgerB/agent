<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.png';
	import type { LayoutData } from './$types';

	import type { Snippet } from 'svelte';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	const tabs = [
		{ href: '/', label: 'Home' },
		{ href: '/history', label: 'History' },
		{ href: '/settings', label: 'Settings' }
	] as const;

	const handleLogout = async () => {
		await fetch('/api/auth/logout', { method: 'POST' });
		window.location.href = '/login';
	};
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if data.user}
	<div class="shell">
		<header>
			<h1>Agent</h1>
			<div class="header-right">
				{#if data.user.picture}
					<button class="avatar-btn" onclick={handleLogout} title="Sign out">
						<img
							src={data.user.picture}
							alt={data.user.name}
							class="avatar"
							referrerpolicy="no-referrer"
						/>
					</button>
				{:else}
					<button class="sign-out" onclick={handleLogout}>Sign out</button>
				{/if}
			</div>
		</header>

		<nav class="nav">
			{#each tabs as tab (tab.href)}
				<a
					href={resolve(tab.href)}
					class="nav-tab"
					class:active={tab.href === '/'
						? page.url.pathname === '/'
						: page.url.pathname.startsWith(tab.href)}
				>
					{tab.label}
				</a>
			{/each}
		</nav>

		<main>
			{@render children()}
		</main>
	</div>
{:else}
	{@render children()}
{/if}

<style>
	:global(body) {
		margin: 0;
		background: #111;
		color: #eee;
		font-family: system-ui, sans-serif;
	}

	.shell {
		max-width: 720px;
		margin: 0 auto;
		padding: 1.5rem;
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	h1 {
		margin: 0;
		font-size: 1.25rem;
	}

	.header-right {
		display: flex;
		align-items: center;
	}

	.avatar-btn {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		border-radius: 50%;
	}

	.avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		border: 2px solid #333;
		transition: border-color 0.15s;
	}

	.avatar:hover {
		border-color: #555;
	}

	.sign-out {
		padding: 0.375rem 0.75rem;
		border: 1px solid #333;
		border-radius: 6px;
		background: #222;
		color: #eee;
		cursor: pointer;
		font-size: 0.8125rem;
	}

	.sign-out:hover {
		background: #2a2a2a;
		border-color: #555;
	}

	.nav {
		display: flex;
		background: #1a1a1a;
		border: 1px solid #333;
		border-radius: 999px;
		padding: 4px;
		margin-bottom: 2rem;
	}

	.nav-tab {
		flex: 1;
		text-align: center;
		padding: 0.5rem 1rem;
		border-radius: 999px;
		text-decoration: none;
		color: #888;
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.15s;
	}

	.nav-tab:hover {
		color: #ccc;
	}

	.nav-tab.active {
		background: #333;
		color: #fff;
	}

	main {
		min-height: 60vh;
	}
</style>
