<!-- src/lib/components/FileTree.svelte -->
<script>
	export let files = [];
	export let onFileSelect = () => {};

	let selectedFile = null;
	let expanded = true;

	function handleFileSelect(file) {
		selectedFile = file;
		onFileSelect(file);
	}

	function toggleExpanded() {
		expanded = !expanded;
	}
</script>

<div class="file-tree">
	<div class="tree-header">EXPLORER</div>
	<div class="tree-content">
		<div class="tree-item">
			<div class="item-header" on:click={toggleExpanded}>
				<span class="icon">
					{#if expanded}
						▼
					{:else}
						▶
					{/if}
				</span>
				<span class="icon">📁</span>
				<span class="name">.agent</span>
			</div>
			{#if expanded}
				{#each files as file}
					<div class="tree-item child">
						<div
							class="item-header {selectedFile === file ? 'selected' : ''}"
							on:click={() => handleFileSelect(file)}
						>
							<span class="icon">
								{#if file.type === 'directory'}
									📁
								{:else if file.name.endsWith('.js')}
									📄
								{:else if file.name.endsWith('.html')}
									🌐
								{:else}
									📄
								{/if}
							</span>
							<span class="name">{file.name}</span>
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</div>
</div>

<style>
	.file-tree {
		width: 250px;
		height: 100%;
		background-color: rgb(37, 37, 38);
		color: #e5e5e5;
		border-right: 1px solid rgba(255, 255, 255, 0.1);
		display: flex;
		flex-direction: column;
	}

	.tree-header {
		padding: 10px;
		font-size: 11px;
		font-weight: 600;
		color: #969696;
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.tree-content {
		flex: 1;
		overflow-y: auto;
	}

	.tree-item {
		font-size: 13px;
	}

	.tree-item.child {
		margin-left: 16px;
	}

	.item-header {
		display: flex;
		align-items: center;
		padding: 4px 8px;
		cursor: pointer;
		user-select: none;
	}

	.item-header:hover {
		background-color: rgba(255, 255, 255, 0.1);
	}

	.item-header.selected {
		background-color: rgba(255, 255, 255, 0.05);
	}

	.icon {
		margin-right: 4px;
		display: flex;
		align-items: center;
	}

	.name {
		margin-left: 4px;
	}
</style>
