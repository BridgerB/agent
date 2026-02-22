<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.png';
	import bridgerbFavicon from '$lib/assets/bridgerb-favicon.png';
	import type { LayoutData } from './$types';

	import type { Snippet } from 'svelte';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	const tabs = [
		{ href: '/', label: 'Home' },
		{ href: '/history', label: 'History' },
		{ href: '/settings', label: 'Settings' }
	] as const;

	let showMenu = $state(false);

	const handleLogout = async () => {
		await fetch('/api/auth/logout', { method: 'POST' });
		window.location.reload();
	};

	const toggleMenu = () => {
		showMenu = !showMenu;
	};

	const closeMenu = () => {
		showMenu = false;
	};
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if page.url.pathname === '/login'}
	{@render children()}
{:else}
	<div class="shell">
		<header>
			<h1>Agent</h1>
			<div class="header-right">
				{#if data.user}
					<div class="avatar-wrap">
						<button class="avatar-btn" onclick={toggleMenu}>
							{#if data.user.picture}
								<img
									src={data.user.picture}
									alt={data.user.name}
									class="avatar"
									referrerpolicy="no-referrer"
								/>
							{:else}
								<span class="avatar-placeholder">{data.user.email?.[0]?.toUpperCase()}</span>
							{/if}
						</button>
						{#if showMenu}
							<button class="menu-backdrop" onclick={closeMenu}></button>
							<div class="menu">
								<span class="menu-name">{data.user.name || data.user.email}</span>
								<button class="menu-item" onclick={handleLogout}>Sign out</button>
							</div>
						{/if}
					</div>
				{:else}
					<a href={resolve('/login')} class="avatar-btn" title="Sign in">
						<img src={favicon} alt="Sign in" class="avatar" />
					</a>
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

		<footer>
			<a href="https://github.com/BridgerB/agent" target="_blank" title="GitHub">
				<img
					src="https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/github.svg"
					alt="GitHub"
					class="footer-icon invert"
				/>
			</a>
			<a href="https://bridgerb.com/" target="_blank" title="bridgerb.com">
				<img
					src={bridgerbFavicon}
					alt="bridgerb.com"
					class="footer-icon"
				/>
			</a>
			<a href="https://www.linkedin.com/in/bridgerb/" target="_blank" title="LinkedIn">
				<img
					src="https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/linkedin.svg"
					alt="LinkedIn"
					class="footer-icon invert"
				/>
			</a>
		</footer>
	</div>
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
		min-height: calc(100dvh - 3rem);
		display: flex;
		flex-direction: column;
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

	.avatar-wrap {
		position: relative;
	}

	.avatar-placeholder {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		border: 2px solid #333;
		background: #222;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.875rem;
		font-weight: 600;
		color: #888;
	}

	.menu-backdrop {
		position: fixed;
		inset: 0;
		background: transparent;
		border: none;
		cursor: default;
		z-index: 9;
	}

	.menu {
		position: absolute;
		right: 0;
		top: calc(100% + 0.5rem);
		background: #1a1a1a;
		border: 1px solid #333;
		border-radius: 8px;
		padding: 0.5rem;
		min-width: 160px;
		z-index: 10;
	}

	.menu-name {
		display: block;
		padding: 0.375rem 0.5rem;
		font-size: 0.8125rem;
		color: #888;
		border-bottom: 1px solid #2a2a2a;
		margin-bottom: 0.25rem;
	}

	.menu-item {
		display: block;
		width: 100%;
		padding: 0.375rem 0.5rem;
		border: none;
		border-radius: 4px;
		background: none;
		color: #eee;
		cursor: pointer;
		font-size: 0.8125rem;
		text-align: left;
	}

	.menu-item:hover {
		background: #2a2a2a;
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
		flex: 1;
	}

	footer {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1.25rem;
		padding: 2rem 0 1rem;
		margin-top: 2rem;
		border-top: 1px solid #222;
	}

	footer a {
		display: flex;
		align-items: center;
	}

	.footer-icon {
		width: 20px;
		height: 20px;
		opacity: 0.4;
		transition: opacity 0.15s;
	}

	.footer-icon:hover {
		opacity: 0.8;
	}

	.footer-icon.invert {
		filter: invert(1);
	}
</style>
