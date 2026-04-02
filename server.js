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

for (const [prefix, target] of Object.entries(TARGETS)) {
  app.use(prefix, async (req, res) => {
    const url = target + req.url;
    try {
      const resp = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
      });

      const contentType = resp.headers.get('content-type') || '';
      const body = await resp.text();

      // If exchange returns HTML instead of JSON (captcha/block page), return error JSON
      if (contentType.includes('text/html') || body.trimStart().startsWith('<')) {
        res.status(503).json({
          error: `${prefix.replace('/api/', '')} returned non-JSON (possibly blocked)`,
          code: resp.status,
        });
        return;
      }

      res.set('Content-Type', 'application/json');
      res.set('Cache-Control', 'public, max-age=5');
      res.send(body);
    } catch (err) {
      res.status(502).json({ error: err.message });
    }
  });
}

app.use(express.static(path.join(__dirname, 'dist')));

app.get('{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Options Scanner running on port ${PORT}`);
});
