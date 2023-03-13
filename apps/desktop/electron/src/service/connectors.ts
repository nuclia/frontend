import * as fs from 'fs';

export const getConnectors = () => {
  try {
    const data = fs.readFileSync('./connectors-db.json', 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.log(`Error reading file: ${err}`);
  }
};

export const setConnectors = (connectors: any) => {
  try {
    fs.writeFileSync('./connectors-db.json', JSON.stringify(connectors));
  } catch (err) {
    console.log(`Error writing file: ${err}`);
    throw err;
  }
};
