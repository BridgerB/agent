<!-- src/lib/components/FileTree.svelte -->
<script>
    export let files = [];
    export let onFileSelect = () => {};
    
    let expandedFolders = new Set();

    function toggleFolder(path) {
        if (expandedFolders.has(path)) {
            expandedFolders.delete(path);
        } else {
            expandedFolders.add(path);
        }
        expandedFolders = expandedFolders; // Trigger reactivity
    }

    function getFileIcon(filename) {
        if (filename.endsWith('.js')) return '📄';
        if (filename.endsWith('.css')) return '🎨';
        if (filename.endsWith('.html') || filename.endsWith('.svelte')) return '🌐';
        if (filename.endsWith('.json')) return '📦';
        return '📄';
    }
</script>

<div class="file-tree">
    <div class="tree-header">
        EXPLORER
    </div>
    <div class="tree-content">
        {#each files as file}
            <div class="file-item" on:click={() => onFileSelect(file)}>
                <span class="file-icon">{getFileIcon(file.name)}</span>
                <span class="file-name">{file.name}</span>
            </div>
        {/each}
    </div>
</div>

<style>
    .file-tree {
        background-color: rgb(30, 31, 34);
        color: #e5e5e5;
        height: 100%;
        width: 250px;
        border-right: 1px solid rgba(255, 255, 255, 0.1);
    }

    .tree-header {
        padding: 10px;
        font-size: 0.8rem;
        font-weight: bold;
        color: #9ca3af;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .tree-content {
        padding: 8px;
    }

    .file-item {
        display: flex;
        align-items: center;
        padding: 4px 8px;
        cursor: pointer;
        border-radius: 4px;
        font-size: 0.9rem;
    }

    .file-item:hover {
        background-color: rgba(255, 255, 255, 0.1);
    }

    .file-icon {
        margin-right: 8px;
    }

    .file-name {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
</style>