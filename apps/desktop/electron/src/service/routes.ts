import express from 'express';
import { getSources, setSources } from './sources';

export const router = express.Router();

router.get('/', (req, res) => {
  res.send('Nuclia desktop service is running!');
});

router.post('/source', (req, res) => {
  const connectors = getSources();
  setSources({ ...connectors, ...req.body });
  res.send('{ "success": true }');
});
