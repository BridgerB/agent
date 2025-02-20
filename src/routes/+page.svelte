
<!-- src/routes/+page.svelte -->
<script>
    import { writable } from 'svelte/store';
    import ChatMessage from '$lib/components/ChatMessage.svelte';
    import ChatInput from '$lib/components/ChatInput.svelte';

    let userMessage = '';
    let messages = writable([]);
    let messageContainer;

    // Auto-scroll to bottom when messages update
    $: if (messageContainer && $messages) {
        setTimeout(() => {
            messageContainer.scrollTop = messageContainer.scrollHeight;
        }, 0);
    }

    async function sendMessage() {
        if (userMessage.trim()) {
            const newMessages = [...$messages, { 
                role: 'user', 
                content: userMessage,
                timestamp: new Date().toISOString()
            }];
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
                                if (lastMessage?.role === 'assistant') {
                                    lastMessage.content += parsedChunk.message.content;
                                } else {
                                    current = [
                                        ...current,
                                        { 
                                            role: 'assistant', 
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
    }
</script>

<div class="chat-container">
    <div class="messages" bind:this={messageContainer}>
        {#each $messages as message}
            <ChatMessage {...message} />
        {/each}
    </div>
    <ChatInput bind:userMessage onSendMessage={sendMessage} />
</div>

<style>
    .chat-container {
        display: flex;
        flex-direction: column;
        height: 100vh;
        background-color: rgb(17, 18, 18);
        color: #e5e5e5;
    }

    .messages {
        flex: 1;
        overflow-y: auto;
        padding: 1rem;
        scroll-behavior: smooth;
    }
</style>>