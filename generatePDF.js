const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

/**
 * generatePdf: To generate a pdf file by embedding txt file
 * @param {path} Path - The path  to the file folder.
 * @param {string} file - The file name.
 * @param {object} account - An object that holds the account details.
 * @param {string} name - It represent the Whatsapp number.
 * @return {Promise} - The property pdffile size  and pdf data or filecontent in base64 encoding.
 */
function generatePdf(Path, file, account, name) {
	return new Promise(async (resolve, reject) => {
		try {
			const doc = new PDFDocument(); // Create a new instance of PDFdocument
			let title = null; // The title of the pdf document or file.
			let filePath = null; // The path to the txt file.
			let pdfPath = null; // The path to the new pdf file.



			// To check the file name so it could handle it according to their respective path or file location.
			if (file === 'Terminate.txt') {
				title = 'Terminated order log';
				filePath = path.join(Path, 'logs', file);
				pdfPath = path.join(Path, 'logs', 'Terminate.pdf');
			} else if (file === 'paymentERR.txt') {
				title = 'Failed payment log';
				filePath = path.join(Path, 'logs', file);
				pdfPath = path.join(Path, 'logs', 'paymentERR.pdf');
			} else if (file === 'successfulPayment.txt') {
				title = 'Successful payment log';
				filePath = path.join(Path, 'logs', file);
				pdfPath = path.join(Path, 'logs', 'successfulPayment.pdf');
			} else if (file === `${name}_orderHistory.txt`) {
				title = 'Order history';
				filePath = path.join(Path, 'customers', `${name}_orderHistory`, file);
				pdfPath = path.join(Path, 'customers', `${name}_orderHistory`, `MarketMate_${name}_Orders_History.pdf`);
			} else if (file === 'Registered_Accounts.txt') {
				title = 'List of registered accounts';
				filePath = path.join(Path, 'customers', 'Registered_Accounts.txt');
				pdfPath = path.join(Path, 'customers', 'Registered_Accounts.pdf');
			}


			// Set the document title
			doc.info.Title = title;

			// Set the font size for the header
			doc.fontSize(16).text('MarketMate', { align: 'center' });
			doc.fontSize(12).text(`${title}`, { align: 'center' }).moveDown(0.5);

			// Add customer details if the file is orderhistory.
			if (file === `${name}_orderHistory.txt`) {
				doc.fontSize(8).text(`Customer Name: ${account.name}`, { align: 'left' }).moveDown(0.5);
				doc.fontSize(8).text(`Customer Address: ${account.address}`, { align: 'left' }).moveDown(0.5);
				doc.fontSize(8).text(`Customer Phone: ${account.phone}`, { align: 'left' }).moveDown(0.5);
				doc.fontSize(8).text(`Customer Email: ${account.email}`, { align: 'left' }).moveDown(0.5);
			}

			// Read the Text file content
			const fileContent = fs.readFileSync(path.join(filePath));
			doc.fontSize(6).text(fileContent.toString('utf-8'), { align: 'left' }).moveDown(4);
			const stream = fs.createWriteStream(pdfPath);

			// Save the PDF to a file - which is the pdfPath we created.
			doc.pipe(stream);
			doc.end(); // End the pdf and a pdf file sholud have been created.



			stream.on('finish', () => {
				console.log('PDF generation completed successfully.');
				const pdfContent = fs.readFileSync(path.join(pdfPath)); // Read the nemly generated pdffile but this where im having issue it was working before it start returning err
				// Encode the PDF content to Base64
				const pdfData = fs.readFileSync(path.join(pdfPath), 'base64'); // Read to generate the pdf file in base64 encoded data becuse to send it through the whatsapp-web.js i will need the data in base64 and filesize in bytes.
				// Set the filesize property if available
				const pdfFilesize = pdfContent.length; // I use the buffer file content so i can get it size as every buffer character is one byte.
				resolve({
					data: pdfData,
					filesize: pdfFilesize
				});
			}).on('error', (err) => {
				console.error('Error generating PDF:', err);
				reject(new Error('Error processing pdf file'));
			});
		} catch (error) {
			console.error('Error generating PDF:', error);
      			reject(new Error('Error generating PDF'));
		}
	});
}

module.exports = generatePdf;
