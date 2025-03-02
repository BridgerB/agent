<!-- src/lib/components/FileTree.svelte -->
<script>
	export let files = [];
	export let onFileSelect = () => {};

	let selectedFile = null;
	let rootExpanded = true; // Add state for root folder

	function handleFileSelect(file) {
		if (file.type === 'file') {
			selectedFile = file;
			onFileSelect({ ...file, name: file.path });
		}
	}

	function toggleDir(dir) {
		dir.expanded = !dir.expanded;
		files = [...files]; // Trigger reactivity
	}

	function toggleRoot() {
		rootExpanded = !rootExpanded;
	}
</script>

<div class="file-tree">
	<div class="tree-header">EXPLORER</div>
	<div class="tree-content">
		<div class="tree-item">
			<div
				class="item-header"
				role="button"
				tabindex="0"
				on:click={toggleRoot}
				on:keydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						toggleRoot();
					}
				}}
			>
				<span class="icon">
					{#if rootExpanded}
						▼
					{:else}
						▶
					{/if}
				</span>
				<span class="icon">📁</span>
				<span class="name">folder</span>
			</div>

			{#if rootExpanded}
				{#each files as item}
					{#if item.type === 'directory'}
						<div class="tree-item child">
							<div
								class="item-header"
								on:click={() => toggleDir(item)}
								on:keydown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										toggleDir(item);
									}
								}}
								role="button"
								tabindex="0"
							>
								<span class="icon">
									{#if item.expanded}
										▼
									{:else}
										▶
									{/if}
								</span>
								<span class="icon">📁</span>
								<span class="name">{item.name}</span>
							</div>

							{#if item.expanded && item.children}
								{#each item.children as child}
									<div class="tree-item child">
										<div
											class="item-header {selectedFile === child ? 'selected' : ''}"
											on:click={() => handleFileSelect(child)}
											on:keydown={(e) => {
												if (e.key === 'Enter' || e.key === ' ') {
													handleFileSelect(child);
												}
											}}
											role="button"
											tabindex="0"
										>
											<span class="icon">
												{#if child.name.endsWith('.js')}
													📄
												{:else if child.name.endsWith('.html')}
													🌐
												{:else if child.name.endsWith('.css')}
													🎨
												{:else if child.name.endsWith('.svg')}
													🖼
												{:else}
													📄
												{/if}
											</span>
											<span class="name">{child.name}</span>
										</div>
									</div>
								{/each}
							{/if}
						</div>
					{:else}
						<div class="tree-item child">
							<div
								class="item-header {selectedFile === item ? 'selected' : ''}"
								on:click={() => handleFileSelect(item)}
								on:keydown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										handleFileSelect(item);
									}
								}}
								role="button"
								tabindex="0"
							>
								<span class="icon">
									{#if item.name.endsWith('.js')}
										📄
									{:else if item.name.endsWith('.html')}
										🌐
									{:else if item.name.endsWith('.css')}
										🎨
									{:else if item.name.endsWith('.svg')}
										🖼
									{:else}
										📄
									{/if}
								</span>
								<span class="name">{item.name}</span>
							</div>
						</div>
					{/if}
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
