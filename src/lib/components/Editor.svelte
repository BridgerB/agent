<!-- src/lib/components/Editor.svelte -->
<script>
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import FileTree from './FileTree.svelte';
	import Terminal from './Terminal.svelte';
	import { enhance } from '$app/forms';

	export let value = '// Start coding here...';
	export let language = 'javascript';
	export let files = [];

	let editorContainer;
	let editor;

	onMount(async () => {
		if (!browser) return; // Only run in browser

		try {
			const { default: initialize } = await import('vscode-web');
			editor = await initialize({
				container: editorContainer,
				options: {
					uri: 'file:///sample.js',
					value,
					language,
					theme: 'vs-dark'
				}
			});

			editor.onDidChangeModelContent(() => {
				value = editor.getValue();
			});
		} catch (error) {
			console.error('Failed to initialize vscode-web:', error);
		}
	});

	onDestroy(() => {
		if (editor) editor.dispose();
	});

	$: if (editor && value !== editor.getValue()) {
		editor.setValue(value);
	}

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

	$: if (editor && files.length) {
		const input = document.getElementById('filename-input');
		const ext = files
			.find((f) => f.name === input?.value)
			?.name.split('.')
			.pop()
			.toLowerCase();
		const languageMap = {
			js: 'javascript',
			html: 'html',
			css: 'css',
			json: 'json'
		};
		language = languageMap[ext] || 'plaintext';
		editor.getModel().setLanguage(language);
	}
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

					const ext = filename.split('.').pop().toLowerCase();
					const languageMap = {
						js: 'javascript',
						html: 'html',
						css: 'css',
						json: 'json'
					};
					language = languageMap[ext] || 'plaintext';

					if (editor) {
						const model = editor.getModel();
						model.setValue(value);
						model.setLanguage(language);
					}
				}
			};
		}}
	>
		<input type="hidden" id="filename-input" name="filename" />
		<FileTree {files} onFileSelect={handleFileSelect} />
	</form>
	<div class="right-panel">
		<div class="editor-container" bind:this={editorContainer}></div>
		<div class="terminal-wrapper">
			<Terminal />
		</div>
	</div>
</div>

<style>
	/* Same styles as before */
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
