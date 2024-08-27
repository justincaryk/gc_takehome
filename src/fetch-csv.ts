import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';

import AWS from 'aws-sdk';
import csv from 'csv-parser';
import dotenv from 'dotenv';

import { CsvRow } from './seed';

dotenv.config();

const pipelineAsync = promisify(pipeline);

// get CSV
const privateKey = fs.readFileSync('private_key.pem', 'utf8');
const keyPairId = process.env.KEY_PAIR_ID as string;
const csvUrl = process.env.CSV_FETCH_URL as string;

const signer = new AWS.CloudFront.Signer(keyPairId, privateKey);
const expires = Math.floor((Date.now() + 3600000) / 1000);

const signedUrl = signer.getSignedUrl({
  url: csvUrl,
  expires,
});

const fetchData = async () => {
  try {
    const response = await fetch(signedUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const csvFilePath = path.join(__dirname, '..', 'data.csv');
    const dataStream = response.body; // Stream of CSV data

    if (!dataStream) {
      throw new Error('cannot retrieve data stream');
    }

    // Write CSV data to a file
    await pipelineAsync(dataStream, fs.createWriteStream(csvFilePath));
    console.log('CSV file written to:', csvFilePath);

    // Convert CSV to JSON and print it
    const results: CsvRow[] = [];
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => results.push(row))
      .on('end', () => {
        console.log('CSV data converted to JSON:', JSON.stringify(results, null, 2));
      });
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

(async function () {
  await fetchData();
})();
