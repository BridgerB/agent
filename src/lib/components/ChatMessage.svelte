<!-- src/lib/components/ChatMessage.svelte -->
<script>
    export let role;
    export let content;
    export let timestamp;

    // Simple markdown-style formatting
    function formatMessage(content) {
        // Replace code blocks
        content = content.replace(/```([\s\S]*?)```/g, (match, code) => 
            `<pre><code>${code.trim()}</code></pre>`
        );
        
        // Replace inline code
        content = content.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Replace bold text
        content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        
        // Replace italics
        content = content.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        
        // Replace lists
        content = content.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
        content = content.replace(/^-\s+(.+)$/gm, '<li>$1</li>');
        
        // Add paragraphs
        content = content.split('\n\n').map(p => `<p>${p}</p>`).join('');
        
        return content;
    }
</script>

<div class="message {role}">
    <div class="message-header">
        <div class="avatar {role}">
            {role === 'user' ? 'U' : 'A'}
        </div>
        <div class="message-info">
            <span class="name">{role === 'user' ? 'You' : 'Assistant'}</span>
            <div class="timestamp">
                <span>{new Date(timestamp).toLocaleTimeString()}</span>
            </div>
        </div>
    </div>
    <div class="message-content">
        {@html formatMessage(content)}
    </div>
</div>

<style>
    .message {
        margin-bottom: 1.5rem;
        padding: 1rem;
        border-radius: 0.5rem;
        background-color: rgba(30, 31, 34, 0.95);
    }

    .message.assistant {
        background-color: rgba(35, 36, 40, 0.95);
    }

    .message-header {
        display: flex;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    .avatar {
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        margin-right: 0.75rem;
    }

    .avatar.user {
        background-color: #9333ea;
    }

    .avatar.assistant {
        background-color: #2563eb;
    }

    .message-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .name {
        font-weight: 600;
        color: #e5e5e5;
    }

    .timestamp {
        color: #9ca3af;
        font-size: 0.75rem;
    }

    .message-content {
        line-height: 1.5;
        overflow-wrap: break-word;
    }

    .message-content :global(pre) {
        background-color: rgba(0, 0, 0, 0.2);
        padding: 1rem;
        border-radius: 0.375rem;
        overflow-x: auto;
        margin: 0.5rem 0;
    }

    .message-content :global(code) {
        font-family: monospace;
        font-size: 0.875rem;
        padding: 0.2rem 0.4rem;
        background-color: rgba(0, 0, 0, 0.2);
        border-radius: 0.25rem;
    }

    .message-content :global(p) {
        margin: 0.5rem 0;
    }

    .message-content :global(li) {
        margin: 0.25rem 0;
        margin-left: 1.5rem;
    }
</style>