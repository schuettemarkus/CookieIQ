import { Router } from 'express';
import { getScans, listDomains, diffScans, upsertSchedule, db } from '../db.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ domains: listDomains() });
});

router.get('/:domain', (req, res) => {
  const scans = getScans(req.params.domain);
  const latest = scans[0]?.cookies || [];
  const previous = scans[1]?.cookies || [];
  res.json({
    domain: req.params.domain,
    scans: scans.map(s => ({ id: s.id, scanned_at: s.scanned_at, count: s.cookies.length })),
    latest,
    previous,
    diff: diffScans(previous, latest),
  });
});

router.post('/:domain/schedule', (req, res) => {
  const { url, frequency } = req.body || {};
  if (!url || !['daily', 'weekly'].includes(frequency)) {
    return res.status(400).json({ error: 'url and frequency (daily|weekly) required' });
  }
  upsertSchedule(req.params.domain, url, frequency);
  res.json({ ok: true });
});

router.get('/:domain/schedule', (req, res) => {
  const row = db.prepare('SELECT * FROM schedules WHERE domain = ?').get(req.params.domain);
  res.json({ schedule: row || null });
});

export default router;
