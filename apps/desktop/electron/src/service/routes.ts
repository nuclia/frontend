import express from 'express';
import { firstValueFrom } from 'rxjs';
import {
  clearLogs,
  deleteSource,
  getActiveSyncs,
  getLogs,
  getSource,
  getSourceFiles,
  getSourceFolders,
  getSourceFromBody,
  getSources,
  hasAuth,
  setSources,
} from './sources';
import { restartCollection } from './sync';
import { getServerLogs } from './logging';

export const router = express.Router();

router.get('/', (req, res) => {
  res.send('"Nuclia desktop service is running!"');
});

router.get('/status', (req, res) => {
  const data = { running: true, logs: getServerLogs() };
  res.send(JSON.stringify(data));
});

router.get('/sources', async (req, res) => {
  const sources = getSources();
  res.send(JSON.stringify(sources));
});

router.get('/source/:id', async (req, res) => {
  const source = getSource(req.params.id);
  res.send(JSON.stringify(source));
});

router.delete('/source/:id', async (req, res) => {
  deleteSource(req.params.id);
  res.status(201).send();
});

router.get('/source/:id/auth', async (req, res) => {
  res.send(JSON.stringify({ hasAuth: hasAuth(req.params.id) }));
});

router.post('/source', (req, res) => {
  const sources = getSources();
  const id = Object.keys(req.body)[0];
  if (sources[id]) {
    sources[id] = { ...sources[id], ...getSourceFromBody(req.body[id], sources[id].items || []) };
  } else {
    sources[id] = getSourceFromBody(req.body[id], []);
  }
  setSources(sources);
  res.send('{ "success": true }');
});

router.patch('/source/:id', (req, res) => {
  const sources = getSources();
  const existing = sources[req.params.id];
  const updatedSource = { ...existing, ...getSourceFromBody(req.body, existing.items || []) };
  setSources({ ...sources, [req.params.id]: updatedSource });
  restartCollection();
  res.send('{ "success": true }');
});

router.get('/source/:id/:type/search', async (req, res) => {
  try {
    const results = await firstValueFrom(
      req.params.type === 'folders'
        ? getSourceFolders(req.params.id, req.query.query as string)
        : getSourceFiles(req.params.id, req.query.query as string),
    );
    res.send(JSON.stringify(results));
  } catch (e) {
    if (e.message === 'Unauthorized') {
      res.status(401).send('');
    } else {
      res.status(500).send(`"${e.message || e}"`);
    }
  }
});

router.get('/logs', (req, res) => {
  const logs = getLogs();
  res.send(JSON.stringify(logs));
});
router.get('/logs/:since', (req, res) => {
  const logs = getLogs(req.params.since);
  res.send(JSON.stringify(logs));
});

router.get('/active-logs', (req, res) => {
  const logs = getActiveSyncs();
  res.send(JSON.stringify(logs));
});

router.delete('/logs', (req, res) => {
  clearLogs();
  res.send();
});
