const { Client, LocalAuth } = require('whatsapp-web.js');
const create = require('./create');
const start = require('./start');
const terminal = require('./ReadTerminal');
const fs = require('fs');
const path = require('path');
const chatLog = require('./ChatLog');


console.log('program started...');

// Create terminal interface and start listening to input
terminal.CreateInterface();
terminal.startListening();

/**
 * createClient: Create Whatsapp client (client represent the whatsapp account that was or will be login).
 */
async function createClients() {
	const client = new Client({
		authStrategy: new LocalAuth({clientId: 'MarketMate'}),// I set the client Id to MarketMate
		puppeteer: {
			args: ['--no-sandbox', '--disable-setuid-sandbox']
		      }
	});
	
	// Create a client directory if not exist
	// The client dir is to save all the chatlog and other related file that client(The business)
	// 	might need for to track thier sales.
	const clientDir = path.join(__dirname, 'clients')
	if (!fs.existsSync(clientDir)) {
		fs.mkdir(clientDir, (err) => {
			if (err) {
				console.error(`Error creating client dir`, err);
			} else {
				console.error(`client dir created...`);
			}
		});
	}
	// Initialize chat log
	chatLog.initializeLog(clientDir);

	create(client)
		.then(() => start(client))
		.catch(error => {
			console.error('Error occurred during create: ', error);
		});
}

// create whatsapp client
createClients();
