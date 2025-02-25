<!-- src/lib/components/VSCode.svelte -->
<script>
	import { onMount } from 'svelte';

	let container;

	onMount(() => {
		// Create iframe for localhost VS Code instance
		const iframe = document.createElement('iframe');
		iframe.src = 'http://10.233.1.2:8080'; // This opens the github/dev repo as an example
		iframe.style.width = '100%';
		iframe.style.height = '100%';
		iframe.style.border = 'none';

		// Add iframe to container
		container.appendChild(iframe);

		return () => {
			iframe.remove();
		};
	});
</script>

<div class="vscode-container" bind:this={container}></div>

<style>
	.vscode-container {
		width: 100%;
		height: 100%;
		background-color: #1e1e1e;
	}
</style>
