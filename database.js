// database.js
const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://olaniteolanight:Oluwasegun%231@marketmate.erud7dv.mongodb.net/?retryWrites=true&w=majority';
const client = new MongoClient(uri);
let db = null;

async function connect() {
	try {
		if (db) return db; // If a connection is already established, return it
	    
		await client.connect();
		db = client.db('MarketMate');
		console.log('Connected to MongoDB');
		return db;
	} catch (error) {
		console.error('Error connecting to MongoDB:', error);
		throw error;
	}
}

async function insertCustomer(account, ID) {
  	try {
		account.id = ID;
    		const db = client.db('MarketMate');
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

async function getCustomers(ID) {
  	try {
    		const db = client.db('MarketMate');
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
