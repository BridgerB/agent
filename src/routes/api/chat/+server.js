// src/routes/api/chat/+server.js
import { json } from '@sveltejs/kit';
import { VM } from 'vm2';

// Function to execute code safely
async function executeCode(code) {
	const vm = new VM({
		timeout: 5000,
		sandbox: {
			console: {
				log: (...args) => {
					output.push(...args);
				}
			}
		}
	});

	const output = [];

	try {
		// Wrap code to capture return value
		const wrappedCode = `
            (function() {
                const result = (async () => {
                    ${code}
                })();
                return result;
            })()
        `;

		const result = await vm.run(wrappedCode);
		return {
			success: true,
			result,
			output
		};
	} catch (error) {
		return {
			success: false,
			error: error.message,
			output
		};
	}
}

// Updated system prompt with clearer execution instructions
const systemPrompt = `You are a helpful AI assistant with the ability to execute JavaScript code. When a user asks you to write and run code, follow these steps exactly:

1. First explain what you'll do
2. Write the complete code wrapped in triple backticks with 'javascript' as the language specifier
3. Do not write phrases like "Let me run this" or try to execute code by writing '{executeCode}' - the system will automatically execute code blocks
4. After the code block, say "Running the code..." so the system knows to execute it
5. After execution, explain the results

Example correct format:
"I'll write a function to calculate prime numbers.

\`\`\`javascript
function isPrime(n) {
    // code here
}
isPrime(7);
\`\`\`

Running the code...

The result shows that 7 is prime."

Remember:
- Don't try to execute code yourself - just write "Running the code..."
- Keep code blocks complete and self-contained
- Always include any necessary function calls in the code block
- Handle errors gracefully
- Explain results after execution`;

export const POST = async ({ request }) => {
	try {
		const { messages } = await request.json();

		// Add system prompt to the beginning of the conversation
		const augmentedMessages = [{ role: 'system', content: systemPrompt }, ...messages];

		let currentCodeBlock = '';
		let isCollectingCode = false;
		let shouldExecuteCode = false;

		const chatResponse = await fetch('http://localhost:11434/api/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model: 'llama3.1:8b',
				messages: augmentedMessages,
				stream: true
			})
		});

		// Create stream transformer to handle code execution
		const transformer = new TransformStream({
			async transform(chunk, controller) {
				const text = new TextDecoder().decode(chunk);
				const lines = text.split('\n').filter(Boolean);

				for (const line of lines) {
					const parsed = JSON.parse(line);
					if (!parsed.message?.content) continue;

					const content = parsed.message.content;

					// Check for code block start
					if (content.includes('```javascript')) {
						isCollectingCode = true;
						currentCodeBlock = '';
						controller.enqueue(chunk);
						continue;
					}

					// Check for code block end
					if (isCollectingCode && content.includes('```')) {
						isCollectingCode = false;
						shouldExecuteCode = true;
						controller.enqueue(chunk);
						continue;
					}

					// Collect code
					if (isCollectingCode) {
						currentCodeBlock += content;
					}

					// Check for execution trigger
					if (
						!isCollectingCode &&
						shouldExecuteCode &&
						content.toLowerCase().includes('running the code')
					) {
						shouldExecuteCode = false;
						// Execute the collected code
						const result = await executeCode(currentCodeBlock);

						// Send execution results
						const resultMessage = {
							message: {
								role: 'assistant',
								content: `\nExecution results:\n${
									result.success
										? `${result.output.length ? 'Output:\n' + result.output.join('\n') : ''}${
												result.result !== undefined ? '\nReturn value: ' + result.result : ''
											}`
										: `Error: ${result.error}`
								}\n`
							}
						};
						controller.enqueue(new TextEncoder().encode(JSON.stringify(resultMessage) + '\n'));
					}

					controller.enqueue(chunk);
				}
			}
		});

		return new Response(chatResponse.body.pipeThrough(transformer), {
			headers: {
				'Content-Type': 'application/json'
			}
		});
	} catch (error) {
		console.error('Error in chat request:', error);
		return json({ error: 'Failed to process request' }, { status: 500 });
	}
};
