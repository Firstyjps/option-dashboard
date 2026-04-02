import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

const TARGETS = {
  '/api/deribit': 'https://www.deribit.com',
  '/api/binance': 'https://eapi.binance.com',
  '/api/bybit': 'https://api.bybit.com',
  '/api/okx': 'https://www.okx.com',
};

// API proxy routes
for (const [prefix, target] of Object.entries(TARGETS)) {
  app.use(prefix, async (req, res) => {
    const url = target + req.url;
    try {
      const resp = await fetch(url, {
        headers: { 'User-Agent': 'OptionsScanner/1.0', 'Accept': 'application/json' },
      });
      const data = await resp.text();
      res.set('Content-Type', resp.headers.get('content-type') || 'application/json');
      res.set('Cache-Control', 'public, max-age=5');
      res.send(data);
    } catch (err) {
      res.status(502).json({ error: err.message });
    }
  });
}

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback
app.get('{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Options Scanner running on port ${PORT}`);
});
