import protobufjs from 'protobufjs';
import { fileURLToPath } from 'url';
import path from 'path';

let _Message;

export const NucliaProtobufConverter = (buffer) =>
  new Promise((resolve, reject) => {
    if (_Message) {
      resolve(_Message.decode(buffer));
    } else {
      const root = new protobufjs.Root();
      root.resolvePath = function (origin, target) {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        return path.join(__dirname, target);
      };
      root.load('nucliadb_protos/writer.proto', function (err) {
        if (err) {
          reject(err);
        }
        _Message = root.lookupType('fdbwriter.BrokerMessage');
        resolve(_Message.decode(buffer));
      });
    }
  });
