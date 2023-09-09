require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.uri;
const DbClient = new MongoClient(uri);
let db = null;

/**
 * connect: To connect to mongoDb.
 */
async function connect() {
	try {
		if (db) return db; // If a connection is already established, return it
	    
		await DbClient.connect();
		db = DbClient.db('MarketMate');
		console.log('Connected to MongoDB');
		return db;
	} catch (error) {
		console.error('Error connecting to MongoDB:', error);
		throw error;
	}
}

/**
 * insertCustomer: To insert the customer data to the database.
 * @param {object} account - The object that contans the customer details.
 * @param {variable} ID - The customer whatsapp number.
 */
async function insertCustomer(account, ID) {
  	try {
		account.id = ID;
    		const db = Dbclient.db('MarketMate');
    		const collection = db.collection('customers_data');
		const existingCustomer = await collection.findOne({ id: ID});
		if (existingCustomer && account) {
			const result = await collection.updateOne({ id: ID }, { $set: account });
			console.log('Customer updated:', result.modifiedCount);
			return;
		}
    		const result = await collection.insertOne(account);
    		console.log('Customer data inserted:', result.insertedId);
  	} catch (error) {
    		console.error('Error inserting customer data:', error);
  	}
}

/**
 * getCustomer: To get the customer data from the database using their ID(whatsapp number).
 * @param {variable} ID - The customer whatsapp number.
 */
async function getCustomers(ID) {
  	try {
    		const db = Dbclient.db('MarketMate');
    		const collection = db.collection('customers_data');
    		const customerData = await collection.findOne({id: ID});
    		console.log('Customer data:', customerData);
		return customerData;
  	} catch (error) {
    		console.error('Error retrieving customer data:', error);
  	}
}

module.exports = {
	connect,
	insertCustomer,
	getCustomers,
};
