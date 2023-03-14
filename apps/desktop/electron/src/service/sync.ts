import { getSources } from './sources';
import { importConnector, loadConnectors } from './dynamic-connectors';

export const sync = () => {
  importConnector('https://nuclia.github.io/status/connectors/youtube.js');
  loadConnectors();
  setInterval(() => {
    const sources = getSources();
    // console.log(sources);
  }, 5000);
};
