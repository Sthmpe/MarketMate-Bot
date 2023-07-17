const Customer = require('./customer');
const chatLog = require('./ChatLog');
const fs = require('fs');
const path = require('path');
const generatePdf = require('./generatePDF');
const { MessageMedia } = require('whatsapp-web.js');
const database = require('./database');


// Create customer map
const customer = new Map();
database.connect();

/**
 * start: start client start reciving the client messages and handle response.
 * @param {object} client - The client object for the WhatsApp API.
 */
function start(client) {
	// Listen for incoming messages
	client.on('message', async function(message) {
		// Check if customer exists in the map i use map so it can store each customer and the bot can treat every customers diffrently like handle their respones without conflicting each other.
		if (!customer.has(message.from)) {
			// Create new Customer instance and add it to the map
			customer.set(message.from, new Customer());
			customer.get(message.from).msgfrom = message.from;
			// Save chat log for the new customer
			chatLog.saveChatLog(customer.get(message.from).msgfrom, message._data.notifyName, path.join(__dirname, 'clients'));
		}
		if (message.from === '2349152540533@c.us' && message.body.toUpperCase() === 'DATA') {
			dir = path.join(__dirname, 'clients');
			await generatePDFData(client, message, dir, 'Registered_Accounts.txt', path.join(dir, 'customers', 'Registered_Accounts.pdf'));
			await generateTXTData(client, message, path.join(dir, 'customers', 'Registered_Accounts.txt'));
			await generatePDFData(client, message, dir, 'successfulPayment.txt', path.join(dir, 'customers', 'successfulPayment.pdf'));
			await generateTXTData(client, message, path.join(dir, 'customers', 'successfulPayment.txt'));
			await generatePDFData(client, message, dir, 'paymentERR.txt', path.join(dir, 'customers', 'paymentERR.pdf'));
			await generateTXTData(client, message, path.join(dir, 'customers', 'paymentERR.txt'));
			await generatePDFData(client, message, dir, 'Terminate.txt', path.join(dir, 'customers', 'Terminate.pdf'));
			await generateTXTData(client, message, path.join(dir, 'customers', 'Terminate.txt'));
			await generateTXTData(client, message, path.join(dir, 'logs', 'chatLogs.txt'));
		}
		if (customer.get(message.from).msgfrom === message.from && message.from !== 'status@broadcast') {
			if (!customer.get(message.from).account) {
				customer.get(message.from).account = await database.getCustomers(message.from);
			}
			const chat = await message.getChat();
			await chat.sendStateTyping();
			if (customer.get(message.from).option) {
				const selectedOption = message.body.trim().toUpperCase();
				if (
					selectedOption === 'A' || 
					selectedOption === 'B' || 
					selectedOption === 'C' || 
					selectedOption === 'D' || 
					selectedOption === 'E' || 
					selectedOption === 'F' ||
					selectedOption === 'G' || 
					selectedOption === 'H' || 
					selectedOption === 'I' ||
					selectedOption === 'J' ||
					selectedOption === 'HI' ||
					selectedOption === 'HEY' ||
					selectedOption == 'DEAR' ||
					selectedOption === 'HELLO' ||
					selectedOption === 'GOODMORNING' ||
					selectedOption === 'GOOD MORNING' ||
					selectedOption === 'GOODAFTERNOON' ||
					selectedOption === 'GOOD AFTERNOON' ||
					selectedOption === 'GOOD EVENING' ||
					selectedOption === 'GOODEVENING'
				) {
					await chat.sendStateTyping();
					await customer.get(message.from).handleMenuOptions(client, message);
				} else {
					await chat.sendStateTyping();
					client.sendMessage(message.from, '❗❗❗Please reply with a valid option.');
				}
			}

			switch(true) {
				case customer.get(message.from).sendMessage:
					if (!customer.get(message.from).sent) {
						await chat.sendStateTyping();
					}
					customer.get(message.from).sendMessage = await customer.get(message.from).sendWelcomeMessages(client, message);
					break;
				case customer.get(message.from).start:
					if (message.body.trim().toUpperCase() === 'CANCEL' && customer.get(message.from).sent === false) {
						await chat.sendStateTyping();
						customer.get(message.from).start = false;
						await customer.get(message.from).sendMenu(client, message);
						break;
					}
					console.log('message type', message.type);
					console.log('sent ', customer.get(message.from).sent);
					if (customer.get(message.from).sent === false && message.type !== 'order') {
						if (message.body.trim().toUpperCase() === 'A') {
							break;
						} else {
							client.sendMessage(message.from, '❗❗❗ Please reply with a valid response.');
						}
					} else {
						if (customer.get(message.from).sent) {
							await chat.sendStateTyping();
							await customer.get(message.from).handleStart(client, message);
						} else if (message.type === 'order') {
							console.log('wait for handlestart');
							await chat.sendStateTyping();
							await customer.get(message.from).setTmpproperty(message);
							const order = await message.getOrder();
							console.log('order: ', order);
							if(order.products.every((product) => product.name === 'Developer Support Pack')) {
								customer.get(message.from).tmp.Test = true;
							} else {
								customer.get(message.from).tmp.Test = false;
							}
							await chat.sendStateTyping();
							await customer.get(message.from).handleStart(client, message);
							console.log('handlestart already ended');
						}
					}
					break;
				case customer.get(message.from).how:
					if (!customer.get(message.from).sent) {
						await chat.sendStateTyping();
					}
					if (message.body.trim().toUpperCase() !== 'CANCEL' && customer.get(message.from).sent) {
						client.sendMessage(message.from, '❗❗❗ Please reply with a valid response');
						break;
					}
					await customer.get(message.from).handleHowToShop(client, message);
					break;
				case customer.get(message.from).support:
					if (!customer.get(message.from).sent) {
						await chat.sendStateTyping();
					}
					await customer.get(message.from).handleSupport(client, message);
					break;
				case customer.get(message.from).history:
					if (!customer.get(message.from).sent) {
						await chat.sendStateTyping();
					}
					if (message.body.trim().toUpperCase() !== 'CANCEL' && customer.get(message.from).sent) {
						client.sendMessage(message.from, '❗❗❗ Please reply with a valid response');
						break;
					}
					await customer.get(message.from).handleOrderHistory(client, message);
					break;
				case customer.get(message.from).seller:
					if (!customer.get(message.from).sent) {
						await chat.sendStateTyping();
					}
					if (message.body.trim().toUpperCase() !== 'CANCEL' && customer.get(message.from).sent) {
						client.sendMessage(message.from, '❗❗❗ Please reply with a valid response');
						break;
					}
					await customer.get(message.from).handleOurSellers(client, message);
					break;
				case customer.get(message.from).details:
					if (!customer.get(message.from).sent) {
						await chat.sendStateTyping();
					}
					if (!customer.get(message.from).update && customer.get(message.from).sent) {
						if (
							message.body.trim().toUpperCase() !== 'CANCEL' &&
							message.body.trim().toUpperCase() !== 'UPDATE'
						) {
							client.sendMessage(message.from, '❗❗❗ Please reply with a valid response');
							break;
						}
					}
					await customer.get(message.from).handleAccountDetails(client, message);
					break;
				case customer.get(message.from).feedback:
					if (!customer.get(message.from).sent) {
						await chat.sendStateTyping();
					}
					await customer.get(message.from).handleFeedbacks(client, message);
					break;
				case customer.get(message.from).about:
					if (!customer.get(message.from).sent) {
						await chat.sendStateTyping();
					}
					if (message.body.trim().toUpperCase() !== 'CANCEL' && customer.get(message.from).sent) {
						client.sendMessage(message.from, '❗❗❗ Please reply with a valid response');
						break;
					}
					await customer.get(message.from).handleAboutsUs(client, message);
					break;
				case customer.get(message.from).ai:
					if (!customer.get(message.from).sent) {
						await chat.sendStateTyping();
					}
					if (message.body.trim().toUpperCase() !== 'CANCEL' && customer.get(message.from).sent) {
						client.sendMessage(message.from, '❗❗❗ Please reply with a valid response');
						break;
					}
					await customer.get(message.from).handleAItest(client, message);
					break;
			}
		}
	});
}

/**
 * generatePDFData - This function is to generate the data and statistic
 * @param {object} client - The client instance.
 * @param {object} message - The message instance.
 */
async function generatePDFData(client, message, filedir, filename, pdfpath) {
	await generatePdf(filedir, filename, null, null)
		.then(async pdfData => {
			if (pdfData) {
				const pdf = MessageMedia.fromFilePath(pdfpath);
				pdf.data = pdfData.data;
				pdf.filesize = pdfData.filesize;

				await client.sendMessage(message.from,  pdf, {
					caption: '📂 Here is a file containing the bot statistic',
					sendMediaAsDocument: true // Send media as a document
		     		});
			} else {
				client.sendMessage(message.from, '⚠️ Sorry, due to some reason the PDF file could not be generated. Please try again later');
			}
		})
		.catch(error => {
			console.error('Error generating pdf file:', error);
			client.sendMessage(message.from, '⚠️ Sorry, an error occurred while generating the PDF file. Please try again later');
		});
	
}

/**
 * generateTXTData - This function is to generate the data and statistic
 * @param {object} client - The client instance.
 * @param {object} message - The message instance.
 */
async function generateTXTData(client, message, filePath) {
	try {
		const fileContent = fs.readFileSync(filePath);
		const fileBase64 = fs.readFileSync(filePath, 'base64');
		const txt = MessageMedia.fromFilePath(filePath);
		txt.data = fileBase64;
		txt.filesize = fileContent.lenght;

		await client.sendMessage(message.from,  txt, {
			caption: '📂 Here is a file containing bot statistic',
			sendMediaAsDocument: true // Send media as a document
		});
	} catch (error) {
		console.error('Error Sending txt file:', error);
		client.sendMessage(message.from, '⚠️ Sorry, an error occurred while sending the file. Please try again later');
	}
}
module.exports = start;
