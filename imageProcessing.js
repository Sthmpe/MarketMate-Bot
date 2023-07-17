const Tesseract = require('tesseract.js');

/**
 * imageToText - Generate the text in an image file
 * @param {path} image: The path to the image file
 * @return: The text in the image.
 */
async function imageToText(image) {
	// This is a simple function to read text from image using reconginze i use terrasct because of it simplicity as there wolud be no need for me to apply Machine learning or natural language processing but it accuraccy is not perfect it is limited to image quality and only black text on the image.
	const result = await Tesseract.recognize(image, 'eng', {
		errorHandler: err => console.error('Error reading text from image...', err)
	});
	return result.data.text;
}

module.exports = imageToText;
