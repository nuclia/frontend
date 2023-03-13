import { getConnectors } from './connectors';

export const sync = () => {
  setInterval(() => {
    const connectors = getConnectors();
    console.log(connectors);
  }, 5000);
};
