const fs = require('fs');
const moment = require('moment');
const path = require('path');

// chatlog object to keep all record of the chat per day.
const chatLog = {
		currentDate: null, // A variable that holds the date.
		currentSerial: null, // A variable that holds the serial number.

		/**
		 * wrapText: A wrapper function.
		 * @param {string} text - The string to be wrapped
		 * @param {number} width - The columns width.
		 * @return: The wrapped text as string. 
		 */
		wrapText: function (text, width) {
			const lines = [];
			let currentLine = '';
			
			for (let i = 0; i < text.length; i++) {
				currentLine += text[i];
			
				if (currentLine.length >= width || text[i] === '\n') {
					lines.push(currentLine.trim().padEnd(width, ' '));
					currentLine = '';
				}
			}
			
			if (currentLine.trim().length > 0) {
				lines.push(currentLine.trim().padEnd(width, ' '));
			}
			
			return lines.join('\n');
		},

	 	/**
		 * initializeLog: Initializes the chat log by checking the existing log file or creating a new one.
		 * @param {path} filePath - The path to the file.
		 */
		initializeLog: function (filePath) {
			// Specify the path to the log file
			const logFilePath = path.join(filePath, 'logs', 'chatLogs.txt');
			
			// Check if the file chatLogs.txt exists
			if (fs.existsSync(logFilePath)) {
				// Read the file content
				const logContent = fs.readFileSync(logFilePath, 'utf8', (err) => {
					if (err) {
						console.error(`Error reading chatLogs.txt`, err);
					} else {
						console.error(`ChatLogs.txt read...`);
					}
				});
				// Extract the last log entry
				const lastLogEntry = logContent.slice(logContent.lastIndexOf('\n') + 1);
				
				if (lastLogEntry === '') {
					// No valid log entries
					this.currentDate = moment().format('YYYY-MM-DD');
					this.currentSerial = 0;
				} else if (lastLogEntry === `${this.wrapText('S/N', 25)} ${this.wrapText('DATE_AND_TIME', 25)} ${this.wrapText('NAME', 25)} ${this.wrapText('NUMBER', 25)}\n`) {
					// Update the current date and serial number
					this.currentDate = moment().format('YYYY-MM-DD');
					this.currentSerial = 0;
				} else {
					console.log('lets parse the lastlogentry');
					// Parse the string into a valid JavaScript object
					const lastLog = JSON.parse(lastLogEntry);
					// Get the current date and serial number
					this.currentDate = lastLog.timeStamp.split('T')[0];
					++this.currentSerial;
				}
			} else {
				// Update the current date and serial number
				this.currentDate = moment().format('YYYY-MM-DD');
				this.currentSerial = 0;
		
				// Create the logs directory if it doesn't exist
				const logsDir = path.join(filePath, 'logs');
				if (!fs.existsSync(logsDir)) {
					fs.mkdirSync(logsDir, (err) => {
						if (err) {
							console.error(`Error creating client log folder path`, err);
						} else {
							console.error(`Client log folder path created...`);
						}
					});
				}
		
				// Create an empty log file
				fs.writeFile(logFilePath, `${this.wrapText('S/N', 25)} ${this.wrapText('DATE_AND_TIME', 25)} ${this.wrapText('NAME', 25)} ${this.wrapText('NUMBER', 25)}\n`, (err) => {
					if (err) {
						console.error(`Error creating chatLogs.txt`, err);
					} else {
						console.error(`ChatLogs.txt created...`);
					}
				});
			}
		
			console.log('Program initialized log...');
	},
	
	 /**
	  * saveChatLog: Saves the chat log entry into the log file.
   	  * @param {string} chatId - The chat ID.
  	  * @param {string} notifyName - The name to notify.
	  * @param {path} filePath - The path to the file.
	  * 
   	  */
	saveChatLog: function (chatId, notifyName, filePath) {
		const now = moment(); // A variable that holds the object required to provide the system date.
		
		// Check if the current date variable is the same as the real or system date
		if (now.format('YYYY-MM-DD') !== this.currentDate) {
			this.initializeLog(filePath);
		} else {
			// Log entry object that contains the data to be saved in the log
			const logEntry = {
				serial: ++this.currentSerial,
				timeStamp: now.toISOString(),
				notifyName,
				chatId,
			};
	
			// Format the log entry as a string
			const logLine = `${this.wrapText(`${logEntry.serial}`, 25)} ${this.wrapText(`${logEntry.timeStamp}`, 25)} ${this.wrapText(`${logEntry.notifyName}`, 25)} ${this.wrapText(`${logEntry.chatId}`, 25)}\n`;
	
			// Specify the path to the log file
			const logFilePath = path.join(filePath, 'logs', 'chatLogs.txt');
	
			// Append the log entry to the file
			fs.appendFile(logFilePath, logLine, (err) => {
				if (err) {
					console.error('Error writing chat log: ', err);
				} else {
					console.log('chatLogs.txt was appended successfully...');
				}
			});
	
			console.log('Program saved log to chatLogs.txt...');
		}
	},
};

module.exports = chatLog;
