import express from 'express';
import { getConnectors, setConnectors } from './connectors';

export const router = express.Router();

router.get('/', (req, res) => {
  res.send('Nuclia desktop service is running!');
});

router.post('/connector', (req, res) => {
  const connectors = getConnectors();
  setConnectors({ ...connectors, ...req.body });
  res.send('{ "success": true }');
});
