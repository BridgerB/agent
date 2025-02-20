import { exec } from 'child_process';

// Function to move mouse to top-left (0,0)
const moveMouseToTopLeft = () => {
    exec('xdotool mousemove 0 0', (error, stdout, stderr) => {
        if (error) {
            console.error('Error moving mouse:', error);
            console.log('Make sure xdotool is installed. You can install it with:');
            console.log('sudo apt-get install xdotool  # For Debian/Ubuntu');
            console.log('sudo pacman -S xdotool        # For Arch Linux');
            return;
        }
        console.log('Mouse moved to top-left corner');
        
        if (stderr) {
            console.error('stderr:', stderr);
        }
    });
};

// Execute the mouse movement
moveMouseToTopLeft();