import express from 'express';
import { firstValueFrom } from 'rxjs';
import { getSourceFiles, getSources, setSources } from './sources';

export const router = express.Router();

router.get('/', (req, res) => {
  res.send('Nuclia desktop service is running!');
});

router.post('/source', (req, res) => {
  const sources = getSources();
  setSources({ ...sources, ...req.body });
  res.send('{ "success": true }');
});

router.patch('/source/:id', (req, res) => {
  const sources = getSources();
  const updatedSource = { ...sources[req.params.id], ...req.body };
  setSources({ ...sources, ...updatedSource });
  res.send('{ "success": true }');
});

router.get('/source/:id/search', async (req, res) => {
  const results = await firstValueFrom(getSourceFiles(req.params.id, req.query.query as string));
  res.send(JSON.stringify(results));
});
