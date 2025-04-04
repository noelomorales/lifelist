import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

export default function handler(req, res) {
  const { q } = req.query;
  if (!q || q.length < 2) {
    return res.status(400).json({ error: 'Missing or too-short query' });
  }

  const filePath = path.join(process.cwd(), 'public', 'ebird_taxonomy.csv');
  const results = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      const name = row['English name']?.toLowerCase();
      if (name && name.includes(q.toLowerCase())) {
        results.push({
          name: row['English name'],
          sciName: row['scientific name'],
          family: row['family'],
          order: row['order'],
          code: row['species_code']
        });
      }
    })
    .on('end', () => {
      res.status(200).json(results.slice(0, 20));
    })
    .on('error', (err) => {
      res.status(500).json({ error: 'CSV read failed', details: err.message });
    });
}
