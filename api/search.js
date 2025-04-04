console.log('[DEBUG] Search handler loaded');

export default function handler(req, res) {
  const { q } = req.query;
  console.log('[DEBUG] Query:', q);

import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

export default function handler(req, res) {
  const { q } = req.query;
  if (!q || q.length < 2) {
    return res.status(400).json({ error: 'Missing or too-short query' });
  }

  const results = [];
  const filePath = path.join(process.cwd(), 'public', 'ebird_taxonomy.csv');

  fs.createReadStream(filePath)
    .pipe(csv({ separator: ',', skipLines: 0 }))
    .on('data', (row) => {
      const commonName = row['PRIMARY_COM_NAME']?.toLowerCase().replace(/^"|"$/g, '');
      if (commonName && commonName.includes(q.toLowerCase())) {
        results.push({
          name: row['PRIMARY_COM_NAME'].replace(/^"|"$/g, ''),
          sciName: row['SCI_NAME']?.replace(/^"|"$/g, ''),
          family: row['FAMILY']?.replace(/^"|"$/g, ''),
          order: row['ORDER1']?.replace(/^"|"$/g, ''),
          code: row['SPECIES_CODE']?.replace(/^"|"$/g, ''),
        });
      }
    })
    .on('end', () => {
      res.status(200).json(results.slice(0, 20));
    })
    .on('error', (err) => {
      res.status(500).json({ error: 'CSV read error', details: err.message });
    });
}
