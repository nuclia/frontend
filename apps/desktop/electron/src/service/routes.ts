import express from 'express';
import { firstValueFrom } from 'rxjs';
import { getSourceFiles, getSources, setSources } from './sources';

export const router = express.Router();

router.get('/', (req, res) => {
  res.send('Nuclia desktop service is running!');
});

router.post('/source', (req, res) => {
  const connectors = getSources();
  setSources({ ...connectors, ...req.body });
  res.send('{ "success": true }');
});

router.get('/source/:id/files', async (req, res) => {
  const results = await firstValueFrom(getSourceFiles(req.params.id, req.query.query as string));
  res.send(JSON.stringify(results));
});
