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
 * createClient: Create Whatsapp client (client represent the whatsapp account that was login).
 */
async function createClients() {
	// Create a client directory if not exist
	const clientDir = path.join(__dirname, 'clients')
	if (!fs.existsSync(clientDir)) {
		fs.mkdir(clientDir, (err) => {
			if (err) {
				console.error(`Error creating client dir`, err);
			} else {
				console.error(`Client dir created...`);
			}
		});
	}
	// Initialize chat log
	chatLog.initializeLog(clientDir);
	const client = new Client({
		authStrategy: new LocalAuth({clientId: 'MarketMate-Ilorin'}),
		puppeteer: {
			args: ['--no-sandbox', '--disable-setuid-sandbox']
		      }
	});
	
	create(client)
		.then(() => start(client))
		.catch(error => {
			console.error('Error occurred during create: ', error);
		});
}

// create whatsapp client
createClients();
