import { expect, test } from '@playwright/test';

// Define the command to type into the terminal
const TERMINAL_COMMAND = 'node git/time/test.js';

test('type command into VSCode terminal', async ({ page }) => {
	console.log('Navigating to http://10.233.1.2:8080/');
	await page.goto('http://10.233.1.2:8080/', { waitUntil: 'domcontentloaded' });

	console.log('Waiting for .monaco-workbench...');
	await expect(page.locator('.monaco-workbench')).toBeVisible({ timeout: 30000 });
	console.log('.monaco-workbench loaded.');

	// Check if terminal is already visible
	const terminal = page.locator('#terminal');
	const isTerminalVisible = await terminal.isVisible({ timeout: 2000 }).catch(() => false);

	if (!isTerminalVisible) {
		console.log('Terminal not visible, opening with Ctrl+`...');
		await page.keyboard.press('Control+Backquote');
		console.log('Terminal shortcut pressed.');

		console.log('Waiting for #terminal to appear...');
		await expect(terminal).toBeVisible({ timeout: 10000 });
	} else {
		console.log('Terminal already visible, skipping shortcut.');
	}
	console.log('#terminal confirmed visible.');

	// Focus the terminal textarea
	console.log('Focusing terminal...');
	const textarea = page.locator('.xterm-helper-textarea');
	await textarea.focus();
	console.log('Terminal focused.');

	// Type the reusable command
	console.log(`Typing "${TERMINAL_COMMAND}"...`);
	await page.keyboard.type(TERMINAL_COMMAND); // No delay
	console.log(`"${TERMINAL_COMMAND}" typed.`);

	console.log('Pressing Enter...');
	await page.keyboard.press('Enter');
	console.log('Enter pressed.');

	console.log('Verifying #terminal persists...');
	await expect(terminal).toBeVisible({ timeout: 5000 });
	console.log('Test complete.');
});
