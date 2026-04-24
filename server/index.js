import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { db, getDueSchedules, recordScan } from './db.js';
import researchRoute from './routes/research.js';
import chatRoute from './routes/chat.js';
import scanRoute, { runScan } from './routes/scan.js';
import historyRoute from './routes/history.js';
import regulatoryRoute from './routes/regulatory.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/research', researchRoute);
app.use('/api/chat', chatRoute);
app.use('/api/scan', scanRoute);
app.use('/api/history', historyRoute);
app.use('/api/regulatory', regulatoryRoute);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`[cookieiq] server on :${PORT}`));

// Scheduled monitoring tick — runs hourly, fires any due schedules.
cron.schedule('0 * * * *', async () => {
  const due = getDueSchedules();
  for (const s of due) {
    try {
      const cookies = await runScan(s.url, 'homepage');
      recordScan(s.domain, cookies);
      db.prepare('UPDATE schedules SET last_run_at = ? WHERE id = ?')
        .run(new Date().toISOString(), s.id);
      console.log(`[cron] scanned ${s.domain}`);
    } catch (err) {
      console.error(`[cron] scan failed for ${s.domain}:`, err.message);
    }
  }
});
