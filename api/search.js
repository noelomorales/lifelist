import csv from 'csv-parser';

export default async function handler(req, res) {
  const { q } = req.query;
  if (!q || q.length < 2) {
    return res.status(400).json({ error: 'Missing or too-short query' });
  }

  const results = [];
  try {
    const response = await fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/ebird_taxonomy.csv`);
    if (!response.ok) throw new Error('Failed to fetch taxonomy');

    const text = await response.text();
    const rows = text.split('\n');
    const headers = rows[0].split(',');

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i].split(',');
      if (!cols.length) continue;

      const row = Object.fromEntries(headers.map((h, j) => [h.trim(), cols[j]?.trim() || '']));

      if (row['PRIMARY_COM_NAME']?.toLowerCase().includes(q.toLowerCase())) {
        results.push({
          name: row['PRIMARY_COM_NAME'],
          sciName: row['SCI_NAME'],
          family: row['FAMILY'],
          order: row['ORDER1'],
          code: row['SPECIES_CODE'],
        });
      }

      if (results.length >= 20) break;
    }

    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ error: 'Search failed', details: err.message });
  }
}
