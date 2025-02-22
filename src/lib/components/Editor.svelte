<!-- src/lib/components/Editor.svelte -->
<script>
	import { onMount } from 'svelte';
	import FileTree from './FileTree.svelte';
	import Terminal from './Terminal.svelte';
	import { enhance } from '$app/forms';

	export let value = '// Start coding here...';
	export let files = [];

	// Handle file selection (unchanged)
	function handleFileSelect(file) {
		const form = document.getElementById('file-form');
		const input = document.getElementById('filename-input');
		input.value = file.name;

		const submitEvent = new Event('submit', {
			bubbles: true,
			cancelable: true
		});
		form.dispatchEvent(submitEvent);
	}

	// For now, the iframe won't directly sync with 'value' like Monaco did
	// You could extend this with postMessage to communicate with the iframe if needed
</script>

<div class="editor-with-tree">
	<form
		id="file-form"
		method="POST"
		action="?/readFile"
		use:enhance={({ formData }) => {
			return async ({ result }) => {
				if (result.type === 'success' && result.data.success) {
					const filename = formData.get('filename');
					value = result.data.content;
					// TODO: Communicate with iframe to update content if needed
				}
			};
		}}
	>
		<input type="hidden" id="filename-input" name="filename" />
		<FileTree {files} onFileSelect={handleFileSelect} />
	</form>
	<div class="right-panel">
		<div class="editor-container">
			<iframe
				src="http://localhost:8080"
				title="VS Code Web Editor"
				frameborder="0"
				style="width: 100%; height: 100%;"
			></iframe>
		</div>
		<div class="terminal-wrapper">
			<Terminal />
		</div>
	</div>
</div>

<style>
	.editor-with-tree {
		display: flex;
		width: 100%;
		height: 100%;
		background-color: rgb(30, 30, 30);
	}

	.right-panel {
		flex: 1;
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.editor-container {
		flex: 1;
		min-height: 0;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		overflow: hidden;
		margin-bottom: 8px;
	}

	.terminal-wrapper {
		height: 30vh;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		overflow: hidden;
	}

	form {
		display: contents;
	}
</style>
