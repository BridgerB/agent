<!-- src/lib/components/Editor.svelte -->
<script>
	import { onMount, onDestroy } from 'svelte';
	import loader from '@monaco-editor/loader';
	import { browser } from '$app/environment';
	import FileTree from './FileTree.svelte';
	import { enhance } from '$app/forms';

	export let value = '// Start coding here...';
	export let language = 'javascript';
	export let theme = 'vs-dark';
	export let height = '500px';
	export let files = [];

	let editorContainer;
	let editor;
	let monaco;

	onMount(async () => {
		if (browser && editorContainer) {
			try {
				monaco = await loader.init();

				editor = monaco.editor.create(editorContainer, {
					value,
					language,
					theme,
					automaticLayout: true,
					minimap: {
						enabled: true
					},
					scrollBeyondLastLine: false,
					fontSize: 14,
					lineNumbers: 'on',
					roundedSelection: false,
					scrollBars: 'vertical',
					readOnly: false,
					cursorStyle: 'line',
					fixedOverflowWidgets: true
				});

				editor.onDidChangeModelContent(() => {
					const newValue = editor.getValue();
					value = newValue;
				});
			} catch (error) {
				console.error('Failed to load Monaco Editor:', error);
			}
		}
	});

	onDestroy(() => {
		if (editor) {
			editor.dispose();
		}
	});

	$: if (editor && value !== editor.getValue()) {
		editor.setValue(value);
	}

	// Handle form submission and file selection
	function handleFileSelect(file) {
		const form = document.getElementById('file-form');
		const input = document.getElementById('filename-input');
		input.value = file.name;

		// Use the form's submit handler
		const submitEvent = new Event('submit', {
			bubbles: true,
			cancelable: true
		});
		form.dispatchEvent(submitEvent);
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
						monaco.editor.setModelLanguage(model, language);
					}
				}
			};
		}}
	>
		<input type="hidden" id="filename-input" name="filename" />
		<FileTree {files} onFileSelect={handleFileSelect} />
	</form>
	<div class="editor-container" bind:this={editorContainer} style="height: {height};"></div>
</div>

<style>
	.editor-with-tree {
		display: flex;
		width: 100%;
		height: 100%;
		background-color: rgb(30, 30, 30);
	}

	.editor-container {
		flex: 1;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		overflow: hidden;
	}

	form {
		display: contents;
	}
</style>
