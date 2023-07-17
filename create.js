const Qrcode = require('qrcode');
const QRcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

/**
 * create: Creates a client and sets up event listeners for loading screen, QR code, authentication, and readiness.
 * @param {object} client - The client object for the WhatsApp API.
 * @return {Promise} A promise that resolves when the client is initialized.
 */
function create(client) {
	return new Promise((resolve, reject) => {
		/**
   		 * loading_screen event: Fired when a loading screen is displayed during client initialization.
   		 * @param {number} percent - The percentage of loading completion.
   		 * @param {string} message - The message displayed on the loading screen.
   		 */
		client.on('loading_screen', (percent, message) => {
			console.log('LOADING SCREEN', percent, message);
		});

		/**
   		 * qr event: Fired when a QR code is generated for authentication.
   		 * @param {string} qr - The generated QR code data.
   		 */
		client.on('qr', qr => {
			const qrcodeDirPath = path.join(__dirname, 'clients');
			const qrcodeFilePath = path.join(qrcodeDirPath, 'qrcode.png');
			
			// Check if the directory exists
			if (!fs.existsSync(qrcodeDirPath)) {
			  // Create the directory
			  fs.mkdir(qrcodeDirPath, { recursive: true }, (err) => {
				if (err) {
					console.error(`Error creating client folder path`, err);
				} else {
					console.log(`Client folder path created...`);
				}
			});
			}
			// save qrcode to a file.
			Qrcode.toFile(qrcodeFilePath, qr,{
				color: {
					dark: '#FFF',  // white dots color
					light: '#0000' // Transparent background
		      		}
			}, (err) => {
				if (err) {
				  console.error('Failed to save QR code to file:', err);
				} else {
				  console.log(`QR code saved to file '${qrcodeFilePath}...`);
				}
			});
			// Generate the QR code in the terminal
			QRcode.generate(qr, {small: true});
			console.log('qrcode geneerated...');
		});

		/**
   		 * authenticated event: Fired when the client is successfully authenticated.
   		 */
		client.on('authenticated', () => {
			console.log('AUTHENTICATED...');
		});

		/**
   		 * auth_failure event: Fired if session restore was unsuccessful.
   		 * @param {string} msg - The failure message.
		 */
		client.on('auth_failure', msg => {
			// Fired if session restore was unsuccessful
			console.error('AUTHENTICATION FAILURE', msg);
			reject(msg);
		});

		// Initialize the client
		client.initialize(() => {
			console.log('client has been initialized...');
		});

		/**
   		 * ready event: Fired when the client is ready to receive messages.
   		 */
		client.on('ready', () => {
    			console.log('Client is ready!...');
			resolve();
		});

	});
}

module.exports = create;