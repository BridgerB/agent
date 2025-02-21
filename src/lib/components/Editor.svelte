<!-- src/lib/components/Editor.svelte -->
<script>
	import { onMount, onDestroy } from 'svelte';
	import loader from '@monaco-editor/loader';
	import { browser } from '$app/environment';

	export let value = '// Start coding here...';
	export let language = 'javascript';
	export let theme = 'vs-dark';
	export let height = '500px';

	let editorContainer;
	let editor;
	let monaco;

	// Configure the loader
	if (browser) {
		loader.config({
			paths: {
				vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.0/min/vs'
			}
		});
	}

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

				// Handle value changes
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

	// Update editor value when prop changes
	$: if (editor && value !== editor.getValue()) {
		editor.setValue(value);
	}
</script>

<div class="editor-container" bind:this={editorContainer} style="height: {height};"></div>

<style>
	.editor-container {
		width: 100%;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 4px;
		overflow: hidden;
	}
</style>
