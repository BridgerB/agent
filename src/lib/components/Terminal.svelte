<!-- src/lib/components/Terminal.svelte -->
<script>
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	let terminal;
	let terminalElement;
	let fitAddon;
	let Terminal;
	let FitAddon;
	let WebLinksAddon;
	let currentCommand = '';
	let currentPath = '/home/agent';
	let commandHistory = [];
	let historyIndex = -1;

	// Expose the simulateCommand method to parent components
	export async function simulateCommand(command) {
		console.log('Simulating command:', command);
		if (!terminal) {
			console.error('Terminal not initialized');
			return;
		}

		// Clear current command if any
		while (currentCommand.length > 0) {
			currentCommand = currentCommand.slice(0, -1);
			terminal.write('\b \b');
		}

		// Type out the command with delay
		for (const char of command) {
			currentCommand += char;
			terminal.write(char);
			await new Promise((resolve) => setTimeout(resolve, 50)); // Delay between characters
		}

		// Execute the command (simulate Enter key)
		terminal.write('\r\n');
		if (currentCommand.trim()) {
			commandHistory.push(currentCommand);
			historyIndex = commandHistory.length;
			await executeCommand(currentCommand);
			currentCommand = '';
		} else {
			terminal.write(`\r\n${currentPath} $ `);
		}
	}

	async function executeCommand(command) {
		try {
			console.log('Executing command:', command);
			// Handle cd command specially
			if (command.trim().startsWith('cd')) {
				const path = command.trim().split(' ')[1] || '~';

				// Execute cd command with absolute path based on currentPath
				let newPath;
				if (path.startsWith('/')) {
					newPath = path;
				} else if (path === '~') {
					newPath = '/home/agent';
				} else if (path === '..') {
					newPath = currentPath.split('/').slice(0, -1).join('/') || '/';
				} else {
					newPath = `${currentPath}/${path}`;
				}

				// Verify the path exists
				const checkPath = await fetch('/api/bash', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						command: `test -d "${newPath}" && echo "exists"`,
						cwd: currentPath
					})
				});

				const checkResult = await checkPath.json();
				if (checkResult.success && checkResult.stdout.trim() === 'exists') {
					currentPath = newPath;
					terminal.write(`\r\n${currentPath} $ `);
					return;
				} else {
					terminal.writeln(`\r\ncd: no such directory: ${path}`);
					terminal.write(`\r\n${currentPath} $ `);
					return;
				}
			}

			// For all other commands, execute with current working directory
			const response = await fetch('/api/bash', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					command: `cd "${currentPath}" && ${command}`,
					cwd: currentPath
				})
			});

			const result = await response.json();

			if (result.success) {
				if (result.stdout) terminal.writeln(result.stdout.trimEnd());
				if (result.stderr) terminal.writeln('\x1b[31m' + result.stderr.trimEnd() + '\x1b[0m');
			} else {
				terminal.writeln('\x1b[31mError: ' + result.error + '\x1b[0m');
			}

			terminal.write(`\r\n${currentPath} $ `);
		} catch (error) {
			console.error('Error executing command:', error);
			terminal.writeln('\x1b[31mError executing command: ' + error.message + '\x1b[0m');
			terminal.write(`\r\n${currentPath} $ `);
		}
	}

	onMount(async () => {
		if (browser) {
			console.log('Mounting terminal component');
			// Dynamically import xterm modules
			const xtermModule = await import('xterm');
			const fitModule = await import('xterm-addon-fit');
			const webLinksModule = await import('xterm-addon-web-links');

			Terminal = xtermModule.Terminal;
			FitAddon = fitModule.FitAddon;
			WebLinksAddon = webLinksModule.WebLinksAddon;

			terminal = new Terminal({
				cursorBlink: true,
				cursorStyle: 'block',
				fontSize: 14,
				fontFamily: 'Menlo, Monaco, "Courier New", monospace',
				theme: {
					background: '#1e1e1e',
					foreground: '#e5e5e5',
					cursor: '#ffffff',
					selection: 'rgba(255, 255, 255, 0.3)',
					black: '#000000',
					red: '#e06c75',
					green: '#98c379',
					yellow: '#d19a66',
					blue: '#61afef',
					magenta: '#c678dd',
					cyan: '#56b6c2',
					white: '#abb2bf',
					brightBlack: '#5c6370',
					brightRed: '#e06c75',
					brightGreen: '#98c379',
					brightYellow: '#d19a66',
					brightBlue: '#61afef',
					brightMagenta: '#c678dd',
					brightCyan: '#56b6c2',
					brightWhite: '#ffffff'
				}
			});

			// Add addons
			fitAddon = new FitAddon();
			terminal.loadAddon(fitAddon);
			terminal.loadAddon(new WebLinksAddon());

			// Handle keyboard input
			terminal.onKey(({ key, domEvent }) => {
				const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;

				if (domEvent.keyCode === 13) {
					// Enter
					terminal.write('\r\n');
					if (currentCommand.trim()) {
						commandHistory.push(currentCommand);
						historyIndex = commandHistory.length;
						executeCommand(currentCommand);
						currentCommand = '';
					} else {
						terminal.write(`\r\n${currentPath} $ `);
					}
				} else if (domEvent.keyCode === 8) {
					// Backspace
					if (currentCommand.length > 0) {
						currentCommand = currentCommand.slice(0, -1);
						terminal.write('\b \b');
					}
				} else if (domEvent.keyCode === 38) {
					// Up arrow
					if (historyIndex > 0) {
						historyIndex--;
						currentCommand = commandHistory[historyIndex];
						terminal.write('\x1b[2K\r' + currentPath + ' $ ' + currentCommand);
					}
				} else if (domEvent.keyCode === 40) {
					// Down arrow
					if (historyIndex < commandHistory.length - 1) {
						historyIndex++;
						currentCommand = commandHistory[historyIndex];
						terminal.write('\x1b[2K\r' + currentPath + ' $ ' + currentCommand);
					} else if (historyIndex === commandHistory.length - 1) {
						historyIndex = commandHistory.length;
						currentCommand = '';
						terminal.write('\x1b[2K\r' + currentPath + ' $ ');
					}
				} else if (printable) {
					currentCommand += key;
					terminal.write(key);
				}
			});

			// Initialize terminal
			terminal.open(terminalElement);
			fitAddon.fit();

			// Write welcome message
			terminal.writeln('Welcome to the terminal! Connected to your system.');
			terminal.write(`\r\n${currentPath} $ `);

			// Handle window resize
			const handleResize = () => {
				fitAddon?.fit();
			};
			window.addEventListener('resize', handleResize);

			return () => {
				window.removeEventListener('resize', handleResize);
			};
		}
	});

	onDestroy(() => {
		if (terminal) {
			terminal.dispose();
		}
	});
</script>

<svelte:head>
	{#if browser}
		<link rel="stylesheet" href="node_modules/xterm/css/xterm.css" />
	{/if}
</svelte:head>

<div class="terminal-container">
	<div bind:this={terminalElement} class="terminal"></div>
</div>

<style>
	.terminal-container {
		width: 100%;
		height: 100%;
		background-color: #1e1e1e;
		padding: 8px;
		border-radius: 4px;
		overflow: hidden;
	}

	.terminal {
		width: 100%;
		height: 100%;
	}

	:global(.xterm) {
		padding: 8px;
	}

	:global(.xterm-viewport) {
		overflow-y: auto !important;
	}
</style>
