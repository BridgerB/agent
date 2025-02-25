import { expect, test } from '@playwright/test';

test('type hello into VSCode terminal', async ({ page }) => {
	console.log('Navigating to http://10.233.1.2:8080/');
	await page.goto('http://10.233.1.2:8080/', { waitUntil: 'domcontentloaded' });

	console.log('Waiting for .monaco-workbench...');
	await expect(page.locator('.monaco-workbench')).toBeVisible({ timeout: 30000 });
	console.log('.monaco-workbench loaded.');

	console.log('Opening terminal with Ctrl+`...');
	await page.keyboard.press('Control+Backquote');
	console.log('Terminal shortcut pressed.');

	console.log('Waiting for #terminal...');
	await expect(page.locator('#terminal')).toBeVisible({ timeout: 10000 });
	console.log('#terminal visible.');

	console.log('Waiting for .xterm-helper-textarea...');
	await expect(page.locator('.xterm-helper-textarea')).toBeVisible({ timeout: 10000 });
	console.log('.xterm-helper-textarea visible.');

	console.log('Focusing terminal...');
	await page.locator('.xterm-helper-textarea').focus();
	console.log('Terminal focused.');

	console.log('Typing "hello"...');
	await page.keyboard.type('node git/time/test.js'); // No delay
	console.log('"hello" typed.');

	console.log('Pressing Enter...');
	await page.keyboard.press('Enter');
	console.log('Enter pressed.');

	console.log('Verifying #terminal...');
	await expect(page.locator('#terminal')).toBeVisible({ timeout: 5000 });
	console.log('Test complete.');
});
