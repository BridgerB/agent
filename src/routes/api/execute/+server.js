// src/routes/api/execute/+server.js
import { json } from '@sveltejs/kit';
import { VM } from 'vm2';

export const POST = async ({ request }) => {
	try {
		const { code } = await request.json();

		if (!code) {
			return json({ error: 'No code provided' }, { status: 400 });
		}

		// Create a new VM instance with a timeout
		const vm = new VM({
			timeout: 5000, // 5 second timeout
			sandbox: {
				console: {
					log: (...args) => {
						output.push(...args);
					}
				}
			}
		});

		// Capture console.log output
		const output = [];

		// Wrap the code to capture the return value
		const wrappedCode = `
            (function() {
                const result = (async () => {
                    ${code}
                })();
                return result;
            })()
        `;

		// Execute the code
		const result = await vm.run(wrappedCode);

		return json({
			result,
			output
		});
	} catch (error) {
		console.error('Error executing code:', error);
		return json(
			{
				error: error.message || 'Error executing code',
				stack: error.stack
			},
			{ status: 500 }
		);
	}
};
