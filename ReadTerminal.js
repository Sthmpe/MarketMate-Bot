const readline = require('readline');

// ReadTerminal object for creating and interacting with a terminal interface.
const ReadTerminal = {
	rl: null,

 	/**
   	 * CreateInterface: Initializes the terminal interface to accept input while the program runs.
   	 */
	CreateInterface:function () {
		try {
			this.rl = readline.createInterface({
      				input: process.stdin,
      				output: process.stdout,
    			});
			console.log('Terminal interface successfully initiallize...');
		} catch(error) {
			console.error('Error initializing terminal interface:', error);
		}
  	},
	
	/**
   	 * endProgram: Ends the program and exits.
   	 */
  	endProgram: function () {
		try {
    			console.log('Exiting the program...');
    			process.exit(0);
		} catch (error) {
			console.error('Error ending the program:', error);
		}
  	},

  	/**
   	 * startListening: Starts listening to the terminal input and handles the "stop" command to end the program.
   	 */
	startListening: function () {
		try {
    			this.rl.on('line', (input) => {
      			if (input.trim().toLowerCase() === 'stop') {
        			this.endProgram();
      			}});
		} catch (error) {
			console.error('Error starting to listen for terminal input:', error);
		}
	}
};
module.exports = ReadTerminal;
