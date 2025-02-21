<!-- src/routes/+page.svelte -->
<script>
    import { writable } from 'svelte/store';
    import ChatMessage from '$lib/components/ChatMessage.svelte';
    import ChatInput from '$lib/components/ChatInput.svelte';
    import Editor from '$lib/components/Editor.svelte';
    import FileTree from '$lib/components/FileTree.svelte';

    let userMessage = '';
    let messages = writable([]);
    let messageContainer;
    let editorValue = '// Write your code here...';

    // Sample files for the file tree
    const files = [
        { name: 'src/app.css', content: '/* CSS content */' },
        { name: 'src/app.html', content: '<!-- HTML content -->' },
        { name: 'src/routes/+page.svelte', content: '<!-- Svelte content -->' },
        { name: 'src/lib/components/Editor.svelte', content: '<!-- Editor component -->' }
    ];

    function handleFileSelect(file) {
        editorValue = file.content;
    }

    // Auto-scroll to bottom when messages update
    $: if (messageContainer && $messages) {
        setTimeout(() => {
            messageContainer.scrollTop = messageContainer.scrollHeight;
        }, 0);
    }

    async function handleSendMessage() {
        if (!userMessage.trim()) return;

        const newMessages = [
            ...$messages,
            {
                role: 'user',
                content: userMessage,
                timestamp: new Date().toISOString()
            }
        ];
        messages.set(newMessages);
        userMessage = '';

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: newMessages })
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let buffer = '';

        while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            buffer += decoder.decode(value, { stream: !readerDone });

            try {
                const jsonChunks = buffer.split('\n').filter(Boolean);
                for (const chunk of jsonChunks) {
                    const parsedChunk = JSON.parse(chunk);
                    if (parsedChunk.message?.content) {
                        messages.update((current) => {
                            const lastMessage = current[current.length - 1];
                            if (lastMessage?.role === 'agent') {
                                lastMessage.content += parsedChunk.message.content;
                            } else {
                                current = [
                                    ...current,
                                    {
                                        role: 'agent',
                                        content: parsedChunk.message.content,
                                        timestamp: new Date().toISOString()
                                    }
                                ];
                            }
                            return current;
                        });
                    }
                }
                buffer = '';
            } catch (error) {
                console.error(error);
            }
        }
    }
</script>

<div class="app-container">
    <div class="chat-container">
        <div class="messages" bind:this={messageContainer}>
            {#each $messages as message}
                <ChatMessage {...message} />
            {/each}
        </div>
        <ChatInput bind:userMessage onSendMessage={handleSendMessage} />
    </div>
    <div class="editor-container">
        <FileTree files={files} onFileSelect={handleFileSelect} />
        <div class="editor-wrapper">
            <Editor bind:value={editorValue} height="100%" />
        </div>
    </div>
</div>

<style>
    .app-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        height: 100vh;
        background-color: rgb(17, 18, 18);
        color: #e5e5e5;
        gap: 1rem;
        padding: 1rem;
    }

    .chat-container {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .messages {
        flex: 1;
        overflow-y: auto;
        padding: 1rem;
        scroll-behavior: smooth;
        background-color: rgba(30, 31, 34, 0.95);
        border-radius: 4px;
    }

    .editor-container {
        display: flex;
        height: 100%;
        background-color: rgba(30, 31, 34, 0.95);
        border-radius: 4px;
        overflow: hidden;
    }

    .editor-wrapper {
        flex: 1;
        height: 100%;
    }
</style>