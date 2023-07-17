const fs = require('fs');
const path = require('path');
const generatePdf = require('./generatePDF');
const { MessageMedia } = require('whatsapp-web.js');
const imageToText = require('./imageProcessing');
const moment = require('moment');
const database = require('./database');

/**
 * Customer class: Handles each customer input and maintains the state and data of the customer.
 */
class Customer {
	/**
	 * constructor: Initializes the Customer class.
	 */
	constructor() {
		// These properties are use as switches maintain the flow and state for the bot and customer response
		// These properties are use to handle the option logic
		this.sendMessage = true;
		this.option = false;
		this.start = false;
		this.how = false;
		this.support = false;
		this.history = false;
		this.seller = false;
		this.details = false;
		this.about = false;
		this.feedback = false;
		this.ai = false;
		this.sent = false;

		// These properties are use to handle the payment logic
		this.paycard = false;
		this.pay = false;
		this.card = false;
		this.response = false;
		this.payload = null;
		this.payment = {
			status: null,
			type: null
		};

		// These properties are use to handle the customer data logic. 
		this.config = {
			filePath: path.join(__dirname, 'clients')
		      };
		this.update = false;
		this.upDate = {
			name: false,
			phone: false,
			address: false,
			email: false
		}		      
		this.account = {
			name: null,
			address: null,
			phone: null,
			email: null
		};
		this.msgfrom = false;
		this.tmp = {
			itemCount: false,
			notifyName: false,
			totalAmount1000: false,
			type: false,
			Test: false,
			totalcharges: false,
			orderId: false,
			order: false
		}
		// A getter method to check if any account property has a value
		Object.defineProperty(this, 'hasAccount', {
			get: function() {
				let hasTrue = 0;
				let i = 0;

				for (const prop in this.account) {
					if (this.account[prop]) {
						hasTrue++;
					}
					i++;
				}

				if (hasTrue === 4 && i === 4) {
					return true;
				} else if (hasTrue === 6 && i === 6) {
					return true;
				} else {
					return false;
				}
			},
			enumerable: true
		});
	}

	/**
	 * setTmpproperty: Sets a temporary message properties of the customer to hold customer message details.
	 * @param {object} message - The message object.
	 */
	async setTmpproperty(message) {
		this.tmp.type = message.type;
		this.tmp.orderId = message.orderId;
		this.tmp.notifyName = message._data.notifyName;
		this.tmp.itemCount = message._data.itemCount;
		this.tmp.totalAmount1000 = message._data.totalAmount1000;
		this.tmp.order = await message.getOrder();
	}

	/**
	 * sendWelcomeMessages: Sends welcome messages to the customer.
	 * @param {object} client - The client instance.
	 * @param {object} message - The message object.
	 * @returns {boolean} - Returns false.
	 */
	async sendWelcomeMessages(client, message) {
		// Send a welcome message to the customer
		if (!this.account.name) {
			await client.sendMessage(message.from, `Hello 👋👋👋 ${this.account.name}, Welcome to our shopping bot!, Thank you for choosing MarketMate(Ipata & Tanke Market)`);
		} else if (message._data.notifyName) {
			await client.sendMessage(message.from, `Hello 👋👋👋 ${message._data.notifyName}, Welcome to our shopping bot!, Thank you for choosing MarketMate(Ipata & Tanke Market)`);
		} else {
			await client.sendMessage(message.from, `Hello 👋👋👋, Welcome to our shopping bot!, Thank you for choosing, Thank you for choosing MarketMate(Ipata & Tanke Market)`);
		}
		console.log('Message Recived:', message.body);
		await this.sendMenu(client, message);
		return false;
	}
	
	/**
	 * sendMenu: Sends the menu options to the customer.
	 * @param {object} client - The client instance.
 	 * @param {object} message - The message object.
	 * @returns {Promise<void>}
 	 */
	async sendMenu(client, message) {
		// Send the menu options to the customer
		await client.sendMessage(
			message.from,
			'Please reply with an option\n\nA. Start 🛒\nB. How to Shop 🏫\nC. Order History 🧾\nD. Our Sellers 🛍️\nE. Your Account Details 👤\nF. Give us feedback on our service. 📝\nG. About Us. 🌍\nH. Support team\nI.🤖 Test our ongoing AI customer support system (Experimental) 🧪\n\nReply with cancel to end any process.\nNote any invalid response will be ignored you can countinue by replying with the right option or response'
		);
		this.option = true;
	}

	/**
	 * wrapText: A wrapper function.
	 * @param {string} text - The string to be wrapped
	 * @param {number} width - The columns width.
	 * @return: The wrapped text as string. 
	 */
	wrapText(text, width) {
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
	}

	/**
	 * customerPaymentERR - A function that store the any faild payment in a file.
	 * @param {object} response - The respone object from payment api or local means.
	 */
	customerPaymentERR(response) {
		try {
			const date = moment().format('YYYY-MM-DD');
			const wrapDate = this.wrapText(date, 25);

			if (!fs.existsSync(path.join(this.config.filePath, 'logs', 'paymentERR.txt'))) {
				fs.writeFileSync(path.join(this.config.filePath, 'logs', 'paymentERR.txt'), `${this.wrapText('DATE_AND_TIME', 25)} ${this.wrapText('ERROR_MESSAGE', 25)} ${this.wrapText('ORDER_ID', 25)} ${this.wrapText('ITEM_COUNT', 25)} ${this.wrapText('PAYMENT_TYPE', 25)} ${this.wrapText('AMOUNT', 25)}\n`, (err) => {
					if (err) {
						console.error(`Error creating paymentERR.txt`, err);
					} else {
						console.log(`paymentERR.txt created...`);
					}
				});
			}
			const err_msg = this.wrapText(response.message, 25);

			fs.appendFileSync(path.join(this.config.filePath, 'logs', 'paymentERR.txt'), `${wrapDate} ${err_msg} ${this.wrapText(this.tmp.orderId, 25)} ${this.wrapText(this.tmp.itemCount.toString(), 25)} ${this.wrapText(this.payment.type, 25)} ${this.wrapText(this.tmp.totalcharges.toString(), 25)}\n`, (err) => {
				if (err) {
					console.error('Error appending paymentERR.txt: ', err);
				} else {
					console.log('Payment error appended to paymentERR.txt...');
				}
			});
		} catch (error) {
			console.error('Error performing payment err file operation ', error);
		}
	}

	/**
	 * customerTerminate- A function that store the any terminated payment in a file.
	 */
	customerTerminate() {
		try {
			const date = moment().format('YYYY-MM-DD');
			const wrapDate = this.wrapText(date, 25);

			if (!fs.existsSync(path.join(this.config.filePath, 'logs', 'Terminate.txt'))) {
				fs.writeFileSync(path.join(this.config.filePath, 'logs', 'Terminate.txt'), `${this.wrapText('DATE_AND_TIME', 25)} ${this.wrapText('ORDER_ID', 25)} ${this.wrapText('ITEM_COUNT', 25)} ${this.wrapText('PAYMENT_TYPE', 25)} ${this.wrapText('AMOUNT', 25)}\n`, (err) => {
					if (err) {
						console.error(`Error creating Terminate.txt`, err);
					} else {
						console.log(`Terminate.txt created...`);
					}
				});
			}

			fs.appendFileSync(path.join(this.config.filePath, 'logs', 'Terminate.txt'), `${wrapDate} ${this.wrapText(this.tmp.orderId, 25)} ${this.wrapText(this.tmp.itemCount.toString(), 25)} ${this.wrapText(this.payment.type, 25)} ${this.wrapText(this.tmp.totalcharges.toString(), 25)}\n`, (err) => {
				if (err) {
					console.error('Error appending Terminate.txt: ', err);
				} else {
					console.log('Payment error appended to Terminate.txt...');
				}
			});
		} catch (error) {
			console.error('Error performing terminated order file operation ', error);
		}
	}


	/**
	 * customerPaymentSuc - A function that store the any faild payment in a file.
	 */
	customerPaymentSuc() {
		try {
			const date = moment().format('YYYY-MM-DD');
			const wrapDate = this.wrapText(date, 25);

			if (!fs.existsSync(path.join(this.config.filePath, 'logs', 'successfulPayment.txt'))) {
				fs.writeFileSync(path.join(this.config.filePath, 'logs', 'successfulPayment.txt'), `${this.wrapText('DATE_AND_TIME', 25)} ${this.wrapText('ORDER_ID', 25)} ${this.wrapText('ITEM_COUNT', 25)} ${this.wrapText('PAYMENT_TYPE', 25)} ${this.wrapText('AMOUNT', 25)}\n`, (err) => {
						if (err) {
							console.error(`Error creating successfulPayment.txt`, err);
						} else {
							console.error(`successfulPayment.txt created...`);
						}
					});
			}

			fs.appendFileSync(path.join(this.config.filePath, 'logs', 'successfulPayment.txt'), `${wrapDate} ${this.wrapText(this.tmp.orderId, 25)} ${this.wrapText(this.tmp.itemCount.toString(), 25)} ${this.wrapText(this.payment.type, 25)} ${this.wrapText(this.tmp.totalcharges.toString(), 25)}\n`, (err) => {
				if (err) {
					console.error('Error appending successfulPayment.txt: ', err);
				} else {
					console.log('Payment error appended to successfulPayment.txt...');
				}
			});
		} catch (error) {
			console.error('Error performing payment suc file operation ', error);
		}
	}

	/**
	 * customerOrderHistory: TO update a customer order histroy
	 */
	customerOrderHistory() {
		try {
			const fileId = this.msgfrom.replace(/\./g, '');
			const customerHstryPath = path.join(this.config.filePath, 'customers', `${fileId}_orderHistory`, `${fileId}_orderHistory.txt`);
			const date = moment().format('YYYY-MM-DD');
			const wrapDate = this.wrapText(date, 25);

			if (!fs.existsSync(path.join(customerHstryPath))) {
				fs.writeFileSync(path.join(customerHstryPath), `${this.wrapText('DATE_AND_TIME', 25)} ${this.wrapText('ORDER_ID', 25)} ${this.wrapText('ITEM_COUNT', 25)} ${this.wrapText('PAYMENT_TYPE', 25)} ${this.wrapText('PAYMENT_STATUS', 25)} ${this.wrapText('AMOUNT', 25)}\n`, (err) => {
					if (err) {
						console.error(`Error creating ${fileId}_orderHistory.txt`, err);
					} else {
						console.error(`${fileId}_orderHistory.txt created...`);
					}
				});
			}

			fs.appendFileSync(path.join(customerHstryPath), `${wrapDate} ${this.wrapText(this.tmp.orderId, 25)} ${this.wrapText(this.tmp.itemCount.toString(), 25)} ${this.wrapText(this.payment.type, 25)} ${this.wrapText(this.payment.status, 25)} ${this.wrapText(this.tmp.totalcharges.toString(), 25)}\n`, (err) => {
				if (err) {
					console.error(`Error appending ${fileId}_orderHistory.txt: `, err);
				} else {
					console.log(`${fileId}_orderHistory.txt appended...`)
				}
			});
		} catch (error) {
			console.error('Error performing order history file operation ', error);
		}

	}

	/**
	 * createCustomerFolder: To create a customer folder.
	 */
	createCustomerFolder() {
		try {
			const fileId = this.msgfrom.replace(/\./g, '');
			const customersFolderPath = path.join(this.config.filePath, 'customers');

			if (!fs.existsSync(customersFolderPath)) {
				fs.mkdirSync(customersFolderPath, (err) => {
					if (err) {
						console.error(`Error creating customers folder path ${customersFolderPath}`, err);
					} else {
						console.log('customers folder path created...');
					}
				});
			}

			if (!fs.existsSync(path.join(customersFolderPath, 'Registered_Accounts.txt'))) {
				fs.writeFileSync(path.join(customersFolderPath, 'Registered_Accounts.txt'), `${this.wrapText('NAME', 25)} ${this.wrapText('PHONE_NUMBER', 25)} ${this.wrapText('EMAIL_ADDRESS', 40)}\n`, (err) => {
					if (err) {
						console.error('Error Creating Registered_Accounts.txt', err);
					} else {
						console.log('Registered_Accounts.txt created...');
					}
				});

				fs.appendFileSync(path.join(customersFolderPath, 'Registered_Accounts.txt'), `${this.wrapText(this.account.name, 25)} ${this.wrapText(this.account.phone, 25)} ${this.wrapText(this.account.email, 40)}\n`, (err) => {
					if (err) {
						console.error('Error writting Registered_Accounts.txt', err);
					} else {
						console.log('Regitered_Accounts.txt appended...');
					}
				});
			} else {
				fs.appendFileSync(path.join(customersFolderPath, 'Registered_Accounts.txt'), `${this.wrapText(this.account.name, 25)} ${this.wrapText(this.account.phone, 25)} ${this.wrapText(this.account.email, 40)}\n`, (err) => {
					if (err) {
						console.error('Error writting Registered_Accounts.txt', err);
					} else {
						console.log('Registered_Accounts.txt appended...');
					}
				});
			}

			if (!fs.existsSync(path.join(customersFolderPath, `${fileId}_orderHistory`))) {
				fs.mkdirSync(path.join(customersFolderPath, `${fileId}_orderHistory`), (err) => {
					if (err) {
						console.error(`Error creating customers order history folder path`, err);
					} else {
						console.error(`Customers order history folder path created...`);
					}
				});

				fs.writeFileSync(path.join(customersFolderPath, `${fileId}_orderHistory`, `${fileId}_orderHistory.txt`), `${this.wrapText('DATE_AND_TIME', 25)} ${this.wrapText('ORDER_ID', 25)} ${this.wrapText('ITEM_COUNT', 25)} ${this.wrapText('PAYMENT_TYPE', 25)} ${this.wrapText('PAYMENT_STATUS', 25)} ${this.wrapText('AMOUNT', 25)}\n`, (err) => {
					if (err) {
						console.error(`Error creating ${fileId}_orderHistory.txt`, err);
					} else {
						console.error(`${fileId}_orderHistory.txt created...`);
					}
				});
			}
		} catch (error) {
			console.error('Error performing custormer file operation ', error);
		}
	}

	
	
	/**
	 * handleMenuoption: Handles customer response to the menu option and turn on the neccessary flag or switch.
	 * @param {object} client - The client instance.
	 * @param {object} message - The message object.
	 */
	handleMenuOptions(client, message) {
		console.log('menuoption was called');
		// Handle customer responses to the menu options
		const selectedOption = message.body.trim().toUpperCase();

		if (
			selectedOption === 'HI' ||
			selectedOption === 'HEY' ||
			selectedOption === 'DEAR' ||
			selectedOption === 'HELLO' ||
			selectedOption === 'GOODMORNING' ||
			selectedOption === 'GOOD MORNING' ||
			selectedOption === 'GOODAFTERNOON' ||
			selectedOption === 'GOOD AFTERNOON' ||
			selectedOption === 'GOOD EVENING' ||
			selectedOption === 'GOODEVENING'
		) {
			this.sendMessage = true;
		}

		switch (selectedOption) {
			case 'A':
				this.start = true;
				client.sendMessage(message.from, 'Select the ✨shop button at the top right corner of your screen to explore our extensive catalog of products select your desired product 🛍️, tap \"Veiw cart\" then tap \"place order\" to send your order.');
				client.sendMessage(message.from, 'Reply with cancel to go back to main menu');
				break;
			case 'B':
				this.how = true;
				break;
			case 'C':
				this.history = true;
				break;
			case 'D':
				this.seller = true;
				break;
			case 'E':
				this.details = true;
				break;
			case 'F':
				this.feedback = true;
				break;
			case 'G':
				this.about = true;
				break;
			case 'H':
				this.support = true;
			case 'I':
				this.ai = true;
				break;
				
		}
		this.option = false;
		this.sent = false;
	}

	/**
	 * handleSupport: Collect customer feedbacks.
	 * @param {object} client - The client instance.
	 * @param {object} message - The message object.
	 */
	handleSupport(client, message) {
		if (message.body.trim().toUpperCase() === 'CANCEL') {
			this.bill = false;
			this.sendMenu(client, message);
			return;
		}

		if (!this.sent) {
			client.sendMessage(message.from, 'Drop your messege our support team will get in touch with you shortly.');
			client.sendMessage(message.from, 'Reply with cancel to go back to main menu');
			this.sent = true;
		}
		return;
	}
	
	/**
	 * handleStart: Handles customer order process.
	 * @param {object} client - The client instance.
	 * @param {object} message - The message object.
	 */
	async handleStart(client, message) {
		console.log('sart function...');
		if (
			this.update === false &&
			(
				message.body.trim().toUpperCase() !== 'CANCEL' &&
				message.body.trim().toUpperCase() !== 'PAY' &&
				message.body.trim().toUpperCase() !== 'A' &&
				message.body.trim().toUpperCase() !== 'B' &&
				message.body.trim().toUpperCase() !== 'C' &&
				message.type !== 'order' &&
				message.type !== 'image'
			)
		) {
			client.sendMessage(message.from, '❗❗❗ Please reply with a vaild response.');
			return;
		} 
		// check incomining messages
		if (message.body.trim().toUpperCase() === 'CANCEL') {
			if (!this.payment.status && !this.payment.type) {
				this.payment.type = 'Incomplete';
				this.payment.status = 'Terminated';
				this.customerTerminate();
				this.customerOrderHistory();
			} else if (!this.payment.status && this.payment.type) {
				this.payment.status = 'Terminated';
				this.customerTerminate();
				this.customerOrderHistory();
			}

			this.start = false;
			this.pay = false;
			this.paycard = false;
			this.payTrans = false;
			this. payment = {
				type: null,
				status: null
			};

			this.sendMenu(client, message);
			return;
		} else if (message.body.trim().toUpperCase() === 'PAY' && !this.pay) {
			client.sendMessage(message.from, 'Please note our transaction are 🔒 secured by flutterwave, paystack and opay and a 2% transaction and service charges 💸💼 might be added');
			client.sendMessage(message.from, 'We are continuously working to expand our payment options. Currently, we only support Bank transfer option');
			client.sendMessage(message.from, 'please reply with a payment option to continue:\n\nA.Bank transfer(🔒 secured by opay)\nB. Bank card (🔒 secured by flutterwave)\nC. Bank account(🔒 secured by paystack)\n\nReply with cancel to go back to main menu');
			this.pay = true;
			return;
		} else if (message.body.trim().toUpperCase() === 'C!@#$%^&*()(*&^%$#@!' && !this.paycard) {
			// not in use for now i will work on you later it is to handle flutterwave card payment logic.
			this.paycard = true;
			this.payload = {
				card_number: null,
				cvv: null,
				expiry_month: null,
   				expiry_year: null,
    				currency: 'NGN',
    				email: null,
    				fullname: null,
    				enckey: process.env.FLW_ENCRYPTION_KEY
			};
			this.card = {
				no: false,
				name: false,
				date: false,
				email: false,
				cvv: false
			};
		} else if (!this.paycard && (message.body.trim().toUpperCase() === 'B' || message.body.trim().toUpperCase() === 'C')) {
			client.sendMessage(message.from, 'Sorry this payment option is currently not available continue with the Bank transfer option ');
			client.sendMessage(message.from, 'please reply with a payment option to continue:\n\nA.Bank transfer(🔒 secured by opay)\nB. Bank card (🔒 secured by flutterwave)\nC. Bank account(🔒 secured by paystack)\n\nReply with cancel to go back to main menu');
			this.paycard = true;
			return;
		} else if (message.body.trim().toUpperCase()  === 'A' && !this.payTrans) {
			client.sendMessage(message.from, `Here are our account details for bank transfer:\n\n🏦 Bank: Opay\n💼 Account Name: David Olanite Oluwasegun\n💳 Account Number: 9152540533\n💸 Amount: ${this.tmp.totalcharges}\n\nPlease make the payment and reply with an image file of the payment receipt, including the order ID in the description. This will help us process your payment and prioritize your order for delivery. If you have any questions or need assistance, please contact our support team.\nThank you for choosing MarketMate! 😊`);
			client.sendMessage(message.from, 'Reply with Cancel to go back to main menu');
			this.payment.type = 'TRANSFER';
			this.payTrans = true;
			return;
		}

		// hanndle the transfer option.
		if (this.payTrans) {
			let image = null;
			let messageArray = [];
			if(message.type === 'image') {
				await client.sendMessage(message.from, 'Hold on processing receipt...\n\nPlease note that I will validate the content in the receipt, but I am limited to image quality. The final confirmation will be done by our dispute team.');
				image = await message.downloadMedia();
				const imageBuffer = Buffer.from(image.data, 'base64');
				const imageFormat = image.mimetype.split('/')[1];
				console.log('image format:', imageFormat);
				const imagePath = path.join(this.config.filePath, 'customers', `${this.msgfrom.replace(/\./g, '')}_orderHistory`, `receipt_img.${imageFormat}`);
				const currentDate = new Date();
				const options = { month: 'long', day: 'numeric', year: 'numeric' };
				const formattedDate = currentDate.toLocaleDateString('en-US', options);

				fs.writeFileSync(path.join(imagePath), imageBuffer, (err) => {
					if (err) {
						console.error('Error wrritting the receipt image');
					} else {
						console.log('Receipt image successfully written...');
					}
				});

				await imageToText(imagePath)
					.then(async text => {
						console.log('text:', text.toString().toUpperCase());
						console.log('formated date', formattedDate.toUpperCase());
						console.log('totlat charges ', this.tmp.totalcharges.toString());

						if (text.toUpperCase().includes('SUCCESS') || text.toUpperCase().includes('SUCCESSFUL')) {
							messageArray.push('✔ Verified successful remark from receipt');
						} else {
							messageArray.push('❗ Couldn\'t verify successful remark from receipt');
						}

						if (text.toUpperCase().includes(`${formattedDate.toUpperCase()}`)) {
							messageArray.push('✔ Verified date from receipt');
						} else {
							messageArray.push('❗ Couldn\'t verify date from receipt');
						}

						if (text.includes(`#${this.tmp.totalcharges.toString()}`)) {
							messageArray.push('✔ Verified total charges from receipt');
						} else {
							messageArray.push('❗ Couldn\'t verify total charges from receipt');
						}

						if (text.toUpperCase().includes('DAVID OLANITE OLUWASEGUN')) {
							messageArray.push('✔ Verified receipiant name as David olanite oluwasegun from receipt');
						} else {
							messageArray.push('❗ Couldn\'t verify receipiant name as David olanite oluwasegun from receipt');
						}

						if (text.toUpperCase().includes('9152540533')) {
							messageArray.push('✔ Verified account number from receipt');
						} else {
							messageArray.push('❗ Couldn\'t verify account number from receipt');
						}

						if (text.toUpperCase().includes(`${this.tmp.orderId}`)) {
							messageArray.push('✔ Verified OrderID from receipt');
						} else {
							messageArray.push('❗ Couldn\'t verify OrderID from receipt');
						}

						if (messageArray.every(message => message.includes('✔'))) {
							this.payment.status = 'Read_recipt_successful_AC';
						} else {
							this.payment.status = 'Read_recipt_failed_AC';
						}

						await client.sendMessage(message.from, `Here's the processed output:\n\n${messageArray.join('\n')}\n\nThank you for choosing MarketMate! 😊`);
					})
					.catch(async error => {
						console.error('Error reading text from image:', error);
						await client.sendMessage(message.from, '⚠️ Sorry, an error occurred while reading receipt\n\nThank you for choosing MarketMate! 😊');
						this.payment.status = 'Error_reading_receipt_AC';
					});

					this.customerOrderHistory();

					this.start = false;
					this.pay = false;
					this.paycard = false;
					this.payTrans = false;
					this. payment = {
						type: null,
						status: null
					};

					this.sendMenu(client, message);
					return;
			}
			
		}
		// check if this message has been sent 
		if (!this.sent) {
			this.account = await database.getCustomers(message.from);
			console.log(this.account);
			if (this.account === null) {
				this.account = {
					name: null,
					address: null,
					phone: null,
					email: null
				};
			}
			console.log('hasAccout', this.hasAccount);
			if(this.hasAccount) {
				let price = message._data.totalAmount1000;
				let quantity = message._data.itemCount;
				let orderId = message.orderId;
				let order = await message.getOrder();
				
				console.log('order details :');
				console.log('order id :', orderId);
				console.log('order item count :', quantity);
				console.log('order amount :', price/1000);
				// Handle the order details or order message immediately
				const deliveryCharges = this.calculateDeliveryCharges(order);
				const orderSummary = this.generateOrderSummary(quantity, price, orderId, deliveryCharges);

				// Send the order details to the customer
				client.sendMessage(message.from, `📦 Thank you for placing your order!\n\nYour information:\n\t\t👤 Name: ${this.account.name}\n\t\t🏠 Address: ${this.account.address}\n\t\t📞 Phone: ${this.account.phone}\n\t\t📧 Email: ${this.account.email}\n\n${orderSummary}`);
				client.sendMessage(message.from, 'Reply with pay to proceed to payment\nReply with Cancel to go back to main menu');

				this.tmp.Test = false;
				this.sent = true;
				return;
			} else {
				client.sendMessage(message.from, '📝 You dont have an account with us or an incomplete account details, please provide the following information to create or complete your account details.\nIt wont take up to 2 min \n please ensure to give the correct details');
				console.log('account', this.account);
				this.upDate.address = false;
				this.upDate.email = false;
				this.upDate.name = false;
				this.upDate.phone = false;
				this.update = true;
				this.sent = true;
			}
		}

		// Check if the customer has an account an
		if (this.update) {
			let price = this.tmp.totalAmount1000;
			let quantity = this.tmp.itemCount;
			let orderId = this.tmp.orderId;
			let order = this.tmp.order;
			const returnValue = await this.createAccount(client, message);

			if (returnValue === 0) {
				return;
			}

			client.sendMessage(message.from, `Account details successfully updated 😉`);

			this.createCustomerFolder();

			console.log('order details :');
			console.log('order id :', orderId);
			console.log('order item count :', quantity);
			console.log('order amount :', price/1000);
			// Handle the order details or order message immediately
			const deliveryCharges = this.calculateDeliveryCharges(order);
			const orderSummary = this.generateOrderSummary(quantity, price, orderId, deliveryCharges);

			// Send the order details to the customer
			client.sendMessage(message.from, `📦 Thank you for placing your order!\n\nYour information:\n\t\t👤 Name: ${this.account.name}\n\t\t🏠 Address: ${this.account.address}\n\t\t📞 Phone: ${this.account.phone}\n\t\t📧 Email: ${this.account.email}\n\n${orderSummary}`);
			client.sendMessage(message.from, 'Reply with pay to proceed to payment\nReply with Cancel to go back to main menu\n');

			this.tmp.Test = false;
			this.update = false;
			return;
		}
	}


	/**
	 * createAccount: Create the customer account.
	 */
	async createAccount(client, message) {
		if(!this.account.name) {
			if (!this.upDate.name) {
				client.sendMessage(message.from, 'Reply with your full name  🙋‍♂️ e.g  David smith');
				this.upDate.name = true;
				return 0;
			}

			if (message.body.trim().length > 5 && message.body.trim().includes(" ")) {
				this.account.name = message.body.trim();
			} else {
				client.sendMessage(message.from, 'Pleese reply with the proper name fromat e.g David smith');
				return 0;
			}
		}

		if(!this.account.address) {
			if (!this.upDate.address) {
				client.sendMessage(message.from, 'Reply with your address 🏠 e.g No 22, oloke str, ajanaku tanke, ilorin, kwara state.');
				this.upDate.address = true;
				return 0;
			}

			if (message.body.trim().includes(",")) {
				this.account.address = message.body.trim();
			} else {
				client.sendMessage(message.from, 'Please reply with a correct address format e.g No 22, oloke str, ajanuku, tanke, ilorin. (make use of the comma\'s)');
				return 0;
			}
		}

		if(!this.account.phone) {
			if (!this.upDate.phone) {
				client.sendMessage(message.from, 'Reply with your phonenumber  📞 e.g 080123456789');
				this.upDate.phone = true;
				return 0;
			}

			if (
				message.body.trim().length === 11 && 
				!isNaN(message.body.trim()) && 
				(message.body.trim().startsWith("081") ||
				 message.body.trim().startsWith("080") ||
				 message.body.trim().startsWith("070") ||
				 message.body.trim().startsWith("071") ||
				 message.body.trim().startsWith("090") ||
				 message.body.trim().startsWith("091"))
			) {
				this.account.phone = message.body.trim();
			} else {
				client.sendMessage(message.from, 'Pleese reply with a valid phone number format e.g 081123456789');
				return 0;
			}
		}

		if(!this.account.email) {
			if (!this.upDate.email) {
				client.sendMessage(message.from, 'Reply with your Email address 📧 e.g myemailaddress@example.com');
				this.upDate.email = true;
				return 0;
			}

			if (
				message.body.trim().includes("@") &&
				message.body.trim().indexOf("@") > 0 &&
				message.body.trim().indexOf("@") < message.body.trim().lastIndexOf(".com")
			) {
				this.account.email = message.body.trim();
			} else {
				client.sendMessage(message.from, 'Please reply with a valid email address e.g myemailaddress@example.com');
				return 0;
			}
		}
		await database.insertCustomer(this.account, message.from);
	}

	/**
	 * calculateDeliveryCharges: calculate the delivery charges of the customer.
	 * @param {Object} order - The order details.
	 */
	calculateDeliveryCharges(order) {
		// Process each product in the order
		order.products.forEach(product => {
  			// Extract the mass and quantity from the product name
  			let productName = product.name;
  			let matches = productName.match(/(\d+)(g|kg|ml)(?:\sx(\d+))?/i);
			console.log('matches :', matches);

  			if (matches) {
    				const quantityFromName = matches[3] || 1; // Default quantity is 1 if not specified in name

    				if (matches[2] === 'ml') {
      					// For mL units, treat the quantity as the mass (assuming density of 0.95 g/cm³)
      					product.mass = matches[1] * 0.95;
      					product.unit = 'g'; // Unit is grams
    				} else {
      					const mass = matches[1]; // Mass in grams or kilograms
      					const unit = matches[2]; // Unit of mass (g or kg)
     	 				// Convert kilograms (kg) to grams (g) if the unit is in kg
      					const convertedMass = unit.toLowerCase() === 'kg' ? mass * 1000 : mass;

	      				// Update the product object with the extracted information
      					product.mass = convertedMass;
      					product.unit = 'g'; // Always set the unit to grams (g)
    				}	

    				product.quantityFromName = quantityFromName;
  			}
			// Console log statements here will display the correct values
			console.log('product mass:', product.mass);
			console.log('product unit:', product.unit);
			console.log('quantity from name:', product.quantityFromName);
		});

		// Calculate the total mass of the order in grams
		let totalMassGrams = 0;
		order.products.forEach(product => {
 	 		let massGrams = product.mass;
  			let quantityFromName = product.quantityFromName || 1; // Use quantity from name, or default to 1 if not specified
  			let quantityFromObject = product.quantity || 1; // Use quantity from object, or default to 1 if not specified

  			totalMassGrams += massGrams * quantityFromName * quantityFromObject;
		});

		// Convert the total mass to kilograms (kg)
		const totalMassKg = totalMassGrams / 1000;
		console.log('total mass kg ', totalMassKg);

		// Add the total mass to the order object
		order.totalMass = totalMassKg;

		let deliveryCost = 0;

		if (totalMassKg <= 5) {
  			deliveryCost = 900;
		} else if (totalMassKg <= 10) {
  			deliveryCost = 1000;
		} else if (totalMassKg <= 20) {
  			deliveryCost = 1200;
		} else if (totalMassKg <= 50) {
  			deliveryCost = 1500;
		} else {
			return { cost: 'MAX', totalMass: totalMassKg };
		}

		// Create an array with delivery cost and total mass
		const deliveryInfo = {
			totalMass: totalMassKg, 
			cost: deliveryCost 
		};
		return deliveryInfo;
}
	
	/**
	 * generateOrderSummary: Generate the summary of the order.
	 * @param {variable} quantity - The quantity of product purchase.
	 * @param {variable} price - The price of the product purchase.
	 * @param {variable} orderId - The orderID.
	 * @param {object} deliveryCharges - The delivery charges.
	 * @returns {the order summary} 
	 */
	generateOrderSummary(quantity, price, orderId, deliveryCharges) {
		// Generate the order summary message
		// You can customize this code to format the order summary based on your requirements
		const totalAmount = price / 1000;
		let totalAmountWithCharges = 0;

		if (this.tmp.Test) {
			totalAmountWithCharges = totalAmount;
			this.tmp.totalcharges = totalAmountWithCharges;
	
			return `Order Summary:\n\t📋 Order ID: ${orderId}\n\t🛍️ Items: ${quantity}\n\t💰 Amount: NGN ${totalAmount}\n\t💸 Total Amount: NGN ${totalAmountWithCharges}\n\nPlease review the summary above and make the payment accordingly. Once your payment is confirmed, we will prioritize your order for delivery. You can expect to receive your products within 2-4 hours 🚚. Should you have any questions or need assistance, please don't hesitate to reach out to our support team 📞\n\nThank you for choosing MarketMate. We appreciate your business and look forward to serving you! 😊`;
		} else if (deliveryCharges.cost === 'MAX') {
			// If the delivery cost is 'MAX', prompt them to pay for the product
			return `Order Summary:\n\t📋 Order ID: ${orderId}\n\t🛍️ Items: ${quantity}\n\t🚚 Delivery Mass: ${deliveryCharges.cost}\n\t💰 Amount: NGN ${totalAmount}\n\nPlease make a payment of NGN ${totalAmount} to confirm your order. Once your payment is confirmed, we will connect you with our logistic partners for delivery of your products. You can expect to receive your products within 2-4 hours 🚚. Should you have any questions or need assistance, please don't hesitate to reach out to our support team 📞\n\nThank you for choosing MarketMate. We appreciate your business and look forward to serving you! 😊`;
		} else {
			totalAmountWithCharges = totalAmount + deliveryCharges.cost;
			this.tmp.totalcharges = totalAmountWithCharges;
	
			return `Order Summary:\n\t📋 Order ID: ${orderId}\n\t🛍️ Items: ${quantity}\n\t🚚 Delivery Mass: ${deliveryCharges.totalMass}\n\t💰 Amount: NGN ${totalAmount}\n\t🚚 Delivery Charges: NGN ${deliveryCharges.cost}\n\t💸 Total Amount: NGN ${totalAmountWithCharges}\n\nPlease review the summary above and make the payment accordingly. Once your payment is confirmed, we will prioritize your order for delivery. You can expect to receive your products within 2-4 hours 🚚. Should you have any questions or need assistance, please don't hesitate to reach out to our support team 📞\n\nThank you for choosing MarketMate. We appreciate your business and look forward to serving you! 😊`;
		}
		
	}

	/**
	 * handleHowToShop: Send a the shopping guide to customer.
	 * @param {object} client - The client instance.
	 * @param {object} message - The message object.
	 */
	handleHowToShop(client, message) {
		if (message.body.trim().toUpperCase() === 'CANCEL') {
			this.how = false;
			this.sendMenu(client, message);
			return;
		}
		// this condition statement is to ensure that this message is not sent again if the customer send any other message so it can be treated as ignored.
		if (!this.sent) {
			client.sendMessage(message.from, 'Here are the steps to shop on our platform:\n\n1️⃣ Select Type A: Start Shopping\nUse the letter \'A\' to indicate your intention to start shopping.\n\n2️⃣ Navigate through the Catalog:\nExplore our extensive catalog of products.\n\n3️⃣ Select Your Desired Product:\nOnce you find a product you like, take note of the product details, including the item name and any variations (size, color, etc.).\n\n4️⃣ Place Your Order:\nWhen you\'ve made your selection, proceed to place your order. Follow the prompts, include the desired quantity\n\n5️⃣ Proceed to Payment:\nAfter confirming your order, you will be provided with payment instructions.\n\n6️⃣ Confirmation of Payment:\nOnce your payment has been confirmed, you will receive a notification verifying the successful transaction.\n\n7️⃣ Delivery Timeframe:\nSit back and relax! Your order will be prepared and delivered to your specified address within 2-4 hours.\n\n8️⃣ Save Our Number\nTo stay updated on our latest products and available offers, save our contact number in your phone.\n\nBy following these steps, you\'ll have access to our latest products, the convenience of placing orders, and the assurance of prompt delivery. Enjoy shopping with MarketMate! 🛍️✨');
			client.sendMessage(message.from, 'Reply with Cancel to go back to main menu');
			this.sent = true;
		}
		return;
	}

	/**
	 * handleOrderHistory: Send the customer history to customer.
	 * @param {object} client - The client instance.
	 * @param {object} message - The message object.
	 */
	async handleOrderHistory(client, message) {
		if (message.body.trim().toUpperCase() === 'CANCEL') {
			this.history = false;
			this.sendMenu(client, message);
			return;
		}

		if (!this.sent) {
			const fileId = this.msgfrom.replace(/\./g, '');
			if (this.hasAccount) {
				client.sendMessage(message.from, 'Hold on generating your order history...\n\nPlease note this data may not be accurate due to our current state of development');
				try {
					const txtPath = path.join(this.config.filePath, 'customers', `${fileId}_orderHistory`, `${fileId}_orderHistory.txt`)
					const fileContent = fs.readFileSync(txtPath);
					const fileBase64 = fs.readFileSync(txtPath, 'base64');
					const txt = MessageMedia.fromFilePath(txtPath);
					txt.data = fileBase64;
					txt.filesize = fileContent.lenght;
			
					await client.sendMessage(message.from,  txt, {
						caption: '📂 Here is a file containing your order history in txt format',
						sendMediaAsDocument: true // Send media as a document
					});
				} catch (error) {
					console.error('Error Sending txt file:', error);
					client.sendMessage(message.from, '⚠️ Sorry, an error occurred while sending the txt file. Please try again later');
				}
				client.sendMessage(message.from, 'Hold on generating your order history in pdf format...');
				generatePdf(this.config.filePath, `${fileId}_orderHistory.txt`, this.account, fileId)
					.then(async pdfData => {
						if (pdfData) {
							const pdf = MessageMedia.fromFilePath(path.join(this.config.filePath, 'customers', `${fileId}_orderHistory`, `MarketMate_${fileId}_Orders_History.pdf`));

							pdf.data = pdfData.data;
							pdf.filesize = pdfData.filesize;

							await client.sendMessage(message.from,  pdf, {
								caption: '📂 Here is a file containing your order history in pdf format',
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
			} else {
				client.sendMessage(message.from, '📦 You do not have an order history. Start shopping 🛒 with MarketMate and view your order history here. Happy shopping!');
			}
			client.sendMessage(message.from, 'Reply with cancel to go back to main menu');
			
			this.sent = true;
		}
		return;
	}

	
	/**
	 * handleOurSellers: Send list of sellers to Customer.
	 * @param {object} client - The client instance.
	 * @param {object} message - The message object.
	 */
	handleOurSellers(client, message) {
		if (message.body.trim().toUpperCase() === 'CANCEL') {
			this.seller = false;
			this.sendMenu(client, message);
			return;
		}

		if (!this.sent) {
			client.sendMessage(message.from, 'Here is the list of our trusted seller 👤 :\n\n🏪Store: Dehenny\n\t\t📞 Phone: 08164240388\n🏪Store: Sonibare nimantali\n\t\t📞 Phone: 07031113472\n🏪Store: Az\n\t\t📞 Phone: 08062422560\n🏪Store: Opeyemi\n\t\t📞 Phone: 08106902787\n\nWe are actively working to expand our network of traders in the market, connecting you with a wider range of sellers and products. Our goal is to provide you with an extensive selection and the best shopping experience possible. Stay tuned as we continue to grow and enhance our marketplace!');
			client.sendMessage(message.from, 'Reply with Cancel to go back to main menu');
			this.sent = true;
		}
		return;
	}

	/**
	 * handleAccountDetails: Send account details to customer.
	 * @param {object} client - The client instance.
	 * @param {object} message - The message object.
	 */
	async handleAccountDetails(client, message) {
		if (message.body.trim().toUpperCase() === 'CANCEL') {
			this.details = false;
			this.sendMenu(client, message);
			return;
		}

		if (message.body.trim().toUpperCase() === 'UPDATE') {
			this.account.name = false;
			this.account.address = false;
			this.account.phone = false;
			this.account.email = false;
			this.upDate.address = false;
			this.upDate.email = false;
			this.upDate.name = false;
			this.upDate.phone = false;
			client.sendMessage(message.from,'Please reply with the correct details as this will help us providing you a seamless delivery experience');
			this.update = true;
		}

		if (this.update) {
			const returnValue = await this.createAccount(client, message);
			if (returnValue === 0) {
				return;
			}
			this.createCustomerFolder();
			client.sendMessage(message.from, `Account details successfully updated\n\nHere is your account details 😉\n\n\t👤 Name: ${this.account.name}\n\t📞 Phone: ${this.account.phone}\n\t🏠 Address: ${this.account.address}\n\t📧 Email: ${this.account.email}\n\nReply with update to update your details, Reply with cancel to go back to main menu`);
			this.update = false;

		}

		if (!this.sent) {
			if(this.hasAccount) {
				client.sendMessage(message.from, `Here is your account details 😉\n\n\t👤 Name: ${this.account.name}\n\t📞 Phone: ${this.account.phone}\n\t🏠 Address: ${this.account.address}\n\t📧 Email: ${this.account.email}\n\nReply with update to update your details, Reply with cancel to go back to main menu`);
			} else {
				client.sendMessage(message.from, 'You dont have an account with us please Reply with update to create an account 😊');
				client.sendMessage(message.from, 'Reply with Cancel to go back to main menu');
			}
			this.sent = true;
		}
		return;
	}

	/**
	 * handleFeedbacks: Collect customer feedbacks.
	 * @param {object} client - The client instance.
	 * @param {object} message - The message object.
	 */
	handleFeedbacks(client, message) {
		if (message.body.trim().toUpperCase() === 'CANCEL') {
			this.feedback = false;
			this.sendMenu(client, message);
			return;
		}

		if (!this.sent) {
			client.sendMessage(message.from, 'After sending your feedback, please reply with "Cancel" to go back to the main menu. ⛔️');
			this.sent = true;
		}
		return;
	}

	/**
	 * handleAboutUs: Send AboutUs to customer.
	 * @param {object} client - The client instance.
	 * @param {object} message - The message object.
	 */
	handleAboutsUs(client, message) {
		if (message.body.trim().toUpperCase() === 'CANCEL') {
			this.about = false;
			this.sendMenu(client, message);
			return;
		}

		if (!this.sent) {
			client.sendMessage(message.from, '🌍 Welcome to MarketMate! 🛒\n\nDiscover a world of convenience with MarketMate, your trusted platform for connecting with local sellers and finding a wide range of quality products. We\'re dedicated to supporting local businesses and providing you with a seamless shopping experience.\n\n📍 Store Location:\nMarketMate works with a network of trusted sellers located throughout the city of Ilorin, Ipata & Tanke market. With our platform, you can explore products from multiple stores in the market, giving you access to a diverse selection right at your fingertips.\n\n🚀 Fast Delivery:\nAt MarketMate, we understand the importance of speedy delivery. That\'s why we\'re proud to offer an efficient delivery service, ensuring your purchases reach you in 2-4 hours. Say goodbye to long waiting times and enjoy the convenience of quick and reliable delivery.\n\n🤖 AI Customer Assistance (Under Development):\nTo enhance your experience, we\'re implementing an AI-powered customer assistance feature that can respond to your messages. Please note that the AI is currently under development and may have limitations or occasional errors. However, we\'re committed to providing you with the best customer experience in every way we can.\n\n⏰ Working Hours Availability:\nOur AI customer assistance and support are available during our working hours. We want to make sure you receive prompt and efficient service within our designated timeframe.\n\n🛍️ Shop Local, Support Local:\nBy choosing MarketMate, you\'re actively supporting local businesses and the community. We believe in the power of local entrepreneurship and strive to create opportunities for small businesses to thrive.\n\n📞 Contact Us:\nFor any inquiries, assistance, or feedback, our dedicated support team is available during our working hours. Reach out to us at [Phone Number/WhatsApp Number] from [Specify working hours/days].\n\nThank you for choosing MarketMate! Start exploring, shop with ease, and experience the convenience of connecting with local sellers. We\'re continuously working to enhance your experience and bring you the best customer service. Happy shopping! 🎉');
			client.sendMessage(message.from, 'Reply with Cancel to go back to main menu');
			this.sent = true;
		}
		return;
	}

	/**
	 * handleAItest: Start AI customer services.
	 * @param {object} client - The client instance.
	 * @param {object} message - The message object.
	 */
	handleAItest(client, message) {
		if (message.body.trim().toUpperCase() === 'CANCEL') {
			this.ai = false;
			this.sendMenu(client, message);
			return;
		}

		if (!this.sent) {
			client.sendMessage(message.from, 'Our AI assitance 🤖 is currently unavailable');
			client.sendMessage(message.from, 'Reply with Cancel to go back to main menu');
			this.sent = true;
		}
		return;
	}
}

module.exports = Customer;