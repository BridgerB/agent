import { exec } from 'child_process';

// Execute bash command
exec('echo "hello world"', (error, stdout, stderr) => {
    if (error) {
        console.error(`Error executing command: ${error}`);
        return;
    }
    
    // Print stdout (will contain "hello world")
    console.log(stdout);
    
    // Print any errors if they occur
    if (stderr) {
        console.error(`stderr: ${stderr}`);
    }
});