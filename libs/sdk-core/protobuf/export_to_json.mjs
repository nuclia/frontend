import fs from 'fs';
import path from 'path';
import protobufjs from 'protobufjs';
import dirname from 'es-dirname';

const root = new protobufjs.Root();
root.resolvePath = function (_origin, target) {
  return path.join(dirname(), target);
};
root.load('nucliadb_protos/writer.proto', function (err) {
  if (err) {
    throw new Error(err);
  }
  const model = root.toJSON();
  fs.writeFileSync('./build/model.json', JSON.stringify(model));
});
