import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

export default async function handler(req, res) {
  const { q } = req.query;
  if (!q || q.length < 2) {
    return res.status(400).json({ error: 'Missing or too-short query' });
  }

  const results = [];
  const filePath = path.join(__dirname, '..', 'data', 'ebird_taxonomy.csv');

  try {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        const match = row['PRIMARY_COM_NAME']?.toLowerCase().includes(q.toLowerCase());
        if (match) {
          results.push({
            name: row['PRIMARY_COM_NAME'],
            sciName: row['SCI_NAME'],
            family: row['FAMILY'],
            order: row['ORDER1'],
            code: row['SPECIES_CODE'],
          });
        }
      })
      .on('end', () => {
        res.status(200).json(results.slice(0, 20));
      });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read taxonomy file', details: err.message });
  }
}
