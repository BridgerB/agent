/**
 * Custom script to handle pre-commit hooks with format verification
 * Only checks for unstaged changes after formatting
 * @returns {Promise<void>}
 */
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

const runPreCommit = async () => {
	try {
		// Store list of files that are staged for commit
		const { stdout: stagedFiles } = await execPromise('git diff --cached --name-only');
		const stagedFilesList = stagedFiles.split('\n').filter(Boolean);

		console.log('Running formatter...');
		await execPromise('npm run format');

		// Check if any staged files were modified by the formatter
		const { stdout: modifiedFiles } = await execPromise('git diff --name-only');
		const modifiedFilesList = modifiedFiles.split('\n').filter(Boolean);

		// Find intersection of staged and modified files
		const formattedStagedFiles = stagedFilesList.filter((file) => modifiedFilesList.includes(file));

		if (formattedStagedFiles.length > 0) {
			console.error('💅 Prettier made changes to files you were trying to commit:');
			formattedStagedFiles.forEach((file) => console.error(`  ${file}`));
			console.error('\nCommit aborted. Please stage the formatted changes and try again.');
			process.exit(1);
		}

		// console.log('Running linter...');
		// await execPromise('npm run lint');

		console.log('✨ Pre-commit checks completed successfully!');
	} catch (error) {
		console.error('❌ Pre-commit checks failed:', error.message);
		process.exit(1);
	}
};

runPreCommit();
