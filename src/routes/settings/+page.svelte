<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.png';
	import type { PageData, ActionData } from './$types';
	import type { LayoutData } from '../$types';

	let { data, form }: { data: PageData & LayoutData; form: ActionData } = $props();

	const loggedIn = $derived(page.data.user !== null);

	const providers = [
		{
			type: 'slack',
			label: 'Slack',
			icon: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/slack.svg',
			color: '#4A154B'
		},
		{
			type: 'jira',
			label: 'Jira',
			icon: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/jira.svg',
			color: '#0052CC'
		},
		{
			type: 'github',
			label: 'GitHub',
			icon: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/github.svg',
			color: '#333'
		}
	] as const;

	function getIntegration(type: string) {
		return data.integrations.find((i) => i.type === type);
	}
</script>

<svelte:head>
	<title>Agent - Settings</title>
</svelte:head>

<section class="profile">
	<div class="profile-header">
		{#if loggedIn}
			{#if data.user?.picture}
				<img
					src={data.user.picture}
					alt={data.user.name}
					class="profile-avatar"
					referrerpolicy="no-referrer"
				/>
			{:else}
				<div class="profile-avatar-placeholder">{data.user?.email?.[0]?.toUpperCase()}</div>
			{/if}
			<div class="profile-info">
				<h3>{data.user?.name || 'User'}</h3>
				<span>{data.user?.email}</span>
			</div>
		{:else}
			<img src={favicon} alt="Sign in" class="profile-avatar" />
			<div class="profile-info">
				<h3>Not signed in</h3>
				<a href={resolve('/login')} class="auth-link">Sign in to see your profile</a>
			</div>
		{/if}
	</div>
</section>

{#if form?.aboutSaved}
	<p class="toast success">About saved.</p>
{/if}

<form method="POST" action="?/updateAbout" class="about-form">
	<section>
		<h2>About</h2>
		<textarea
			name="about"
			disabled={!loggedIn}
			placeholder="Help the agent understand you — your role, your team, what you're working on..."
			>{data.about}</textarea
		>
	</section>
	{#if loggedIn}
		<button type="submit" class="btn-save">Save</button>
	{/if}
</form>

<section class="integrations">
	<h2>Integrations</h2>

	{#if form?.error}
		<p class="toast error">{form.error}</p>
	{/if}
	{#if form?.success}
		<p class="toast success">{form.type} connected.</p>
	{/if}
	{#if form?.removed}
		<p class="toast success">Integration removed.</p>
	{/if}

	<div class="grid">
		{#each providers as provider (provider.type)}
			{@const existing = getIntegration(provider.type)}
			<div class="card">
				<div class="card-header">
					<img src={provider.icon} alt={provider.label} class="provider-icon" />
					<span class="provider-label">{provider.label}</span>
					{#if existing}
						<span class="badge connected">Connected</span>
					{:else}
						<span class="badge disconnected">Not connected</span>
					{/if}
				</div>

				{#if existing}
					<div class="card-body">
						<span class="username">{existing.username}</span>
						<form method="POST" action="?/remove">
							<input type="hidden" name="id" value={existing.id} />
							<button type="submit" class="btn-disconnect">Disconnect</button>
						</form>
					</div>
				{:else if loggedIn}
					<form method="POST" action="?/save" class="card-form">
						<input type="hidden" name="type" value={provider.type} />
						<input type="text" name="username" placeholder="Username" required />
						<input type="password" name="password" placeholder="Password / Token" required />
						<button type="submit">Connect</button>
					</form>
				{/if}
			</div>
		{/each}
	</div>
</section>

<style>
	section {
		margin-bottom: 2rem;
	}

	h2 {
		font-size: 1rem;
		color: #888;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0 0 1rem;
	}

	.profile {
		background: #1a1a1a;
		border: 1px solid #333;
		border-radius: 12px;
		padding: 1.25rem;
	}

	.profile-header {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.profile-avatar {
		width: 48px;
		height: 48px;
		border-radius: 50%;
	}

	.profile-avatar-placeholder {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: #333;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.25rem;
		font-weight: 600;
		color: #888;
	}

	.profile-info h3 {
		margin: 0;
		font-size: 1rem;
	}

	.profile-info span {
		color: #888;
		font-size: 0.875rem;
	}

	.about-form {
		display: flex;
		flex-direction: column;
		margin-bottom: 2rem;
	}

	textarea {
		width: 100%;
		min-height: 100px;
		padding: 0.75rem;
		border: 1px solid #333;
		border-radius: 8px;
		background: #1a1a1a;
		color: #eee;
		font-size: 0.875rem;
		font-family: inherit;
		resize: vertical;
		box-sizing: border-box;
	}

	textarea::placeholder {
		color: #555;
	}

	textarea:focus {
		outline: none;
		border-color: #4f46e5;
	}

	.btn-save {
		align-self: flex-end;
		margin-top: 0.75rem;
		padding: 0.5rem 1.25rem;
		border: none;
		border-radius: 6px;
		background: #4f46e5;
		color: white;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.btn-save:hover {
		background: #4338ca;
	}

	.grid {
		display: grid;
		gap: 0.75rem;
	}

	.card {
		background: #1a1a1a;
		border: 1px solid #333;
		border-radius: 12px;
		padding: 1rem 1.25rem;
	}

	.card-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.provider-icon {
		width: 24px;
		height: 24px;
		filter: invert(1);
	}

	.provider-label {
		font-weight: 500;
		flex: 1;
	}

	.badge {
		font-size: 0.75rem;
		padding: 0.2rem 0.6rem;
		border-radius: 999px;
		font-weight: 500;
	}

	.badge.connected {
		background: rgba(74, 222, 128, 0.15);
		color: #4ade80;
	}

	.badge.disconnected {
		background: rgba(255, 255, 255, 0.06);
		color: #666;
	}

	.card-body {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid #2a2a2a;
	}

	.username {
		color: #aaa;
		font-size: 0.875rem;
	}

	.btn-disconnect {
		padding: 0.375rem 0.75rem;
		border: 1px solid #991b1b;
		border-radius: 6px;
		background: transparent;
		color: #f87171;
		cursor: pointer;
		font-size: 0.8125rem;
	}

	.btn-disconnect:hover {
		background: rgba(153, 27, 27, 0.2);
	}

	.card-form {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid #2a2a2a;
	}

	.card-form input {
		flex: 1;
		min-width: 0;
		padding: 0.5rem 0.75rem;
		border: 1px solid #444;
		border-radius: 6px;
		background: #111;
		color: #eee;
		font-size: 0.875rem;
	}

	.card-form input::placeholder {
		color: #555;
	}

	.card-form button {
		width: 100%;
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 6px;
		background: #4f46e5;
		color: white;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		white-space: nowrap;
	}

	.card-form button:hover {
		background: #4338ca;
	}

	.toast {
		font-size: 0.875rem;
		padding: 0.5rem 0.75rem;
		border-radius: 6px;
		margin-bottom: 1rem;
	}

	.toast.error {
		color: #f87171;
		background: rgba(248, 113, 113, 0.1);
		border: 1px solid rgba(248, 113, 113, 0.2);
	}

	.toast.success {
		color: #4ade80;
		background: rgba(74, 222, 128, 0.1);
		border: 1px solid rgba(74, 222, 128, 0.2);
	}

	textarea:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.auth-link {
		color: #818cf8;
		font-size: 0.875rem;
		text-decoration: none;
	}

	.auth-link:hover {
		text-decoration: underline;
	}
</style>
