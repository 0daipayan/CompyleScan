const { createWorker } = require('tesseract.js');

const extractTextFromImage = async (imageBuffer) => {
  const worker = await createWorker('eng');
  const { data: { text } } = await worker.recognize(imageBuffer);
  await worker.terminate();
  return text;
};

module.exports = { extractTextFromImage };