<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const loggedIn = $derived(page.data.user !== null);
</script>

<svelte:head>
	<title>Agent</title>
</svelte:head>

{#if form?.profileSaved}
	<p class="toast success">Profile saved.</p>
{/if}
{#if form?.error}
	<p class="toast error">{form.error}</p>
{/if}

<form method="POST" action="?/updateProfile" class="profile-fields">
	<section class="field-section">
		<h2>Important</h2>
		<textarea
			name="important"
			disabled={!loggedIn}
			placeholder="Context beyond Slack, Jira, and GitHub — priorities, blockers, things to keep top of mind..."
			>{data.important}</textarea
		>
	</section>

	{#if loggedIn}
		<button type="submit" class="btn-save">Save</button>
	{:else}
		<a href={resolve('/login')} class="auth-prompt">Sign in to get started</a>
	{/if}
</form>

<section class="tasks">
	<h2>Tasks</h2>
	<div class="empty">
		<p>No tasks yet</p>
		<span>Your agent-generated tasks will appear here</span>
	</div>
</section>

<style>
	h2 {
		font-size: 1rem;
		color: #888;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0 0 0.75rem;
	}

	.profile-fields {
		display: flex;
		flex-direction: column;
	}

	.field-section {
		margin-bottom: 1rem;
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
		padding: 0.5rem 1.25rem;
		border: none;
		border-radius: 6px;
		background: #4f46e5;
		color: white;
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		margin-bottom: 2rem;
	}

	.btn-save:hover {
		background: #4338ca;
	}

	.tasks {
		margin-bottom: 2rem;
	}

	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 1rem;
		color: #666;
		border: 1px dashed #333;
		border-radius: 8px;
	}

	.empty p {
		font-size: 1rem;
		margin: 0 0 0.25rem;
		color: #888;
	}

	.empty span {
		font-size: 0.875rem;
	}

	textarea:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.auth-prompt {
		align-self: center;
		color: #818cf8;
		font-size: 0.875rem;
		text-decoration: none;
		padding: 0.5rem;
		margin-bottom: 2rem;
	}

	.auth-prompt:hover {
		text-decoration: underline;
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
</style>
