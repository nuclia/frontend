import express from 'express';
import { firstValueFrom } from 'rxjs';
import { Source } from './models';
import { getSource, getSourceFiles, getSources, setSources } from './sources';

export const router = express.Router();

router.get('/', (req, res) => {
  res.send('Nuclia desktop service is running!');
});

router.get('/status', (req, res) => {
  res.send('{"running": true}');
});

router.get('/source/:id', async (req, res) => {
  const source = getSource(req.params.id);
  res.send(JSON.stringify(source));
});

router.post('/source', (req, res) => {
  const sources = getSources();
  const id = Object.keys(req.body)[0];
  if (sources[id]) {
    sources[id] = { ...sources[id], ...req.body[id] } as Source;
  } else {
    sources[id] = req.body[id] as Source;
  }
  setSources(sources);
  res.send('{ "success": true }');
});

router.patch('/source/:id', (req, res) => {
  const sources = getSources();
  const updatedSource = { ...sources[req.params.id], ...req.body };
  setSources({ ...sources, [req.params.id]: updatedSource });
  res.send('{ "success": true }');
});

router.get('/source/:id/search', async (req, res) => {
  const results = await firstValueFrom(getSourceFiles(req.params.id, req.query.query as string));
  res.send(JSON.stringify(results));
});
