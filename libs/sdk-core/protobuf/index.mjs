import protobufjs from 'protobufjs';
import path from 'path';
import dirname from 'es-dirname';

let _Message;

export const NucliaProtobufConverter = (buffer) =>
  new Promise((resolve, reject) => {
    if (_Message) {
      resolve(_Message.decode(buffer));
    } else {
      const root = new protobufjs.Root();
      root.resolvePath = function (_origin, target) {
        return path.join(dirname(), target);
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

// By default, paragraphs are just defined by their start and end character positions.
// This function will add in each paragraph object a `text` attribute containing the actual text of the paragraph.
export const extractParagraphTexts = (payload) => ({
  ...payload,
  fieldMetadata: payload.fieldMetadata?.map((field, index) => ({
    ...field,
    metadata: field.metadata
      ? {
          ...field.metadata,
          metadata: field.metadata.metadata
            ? {
                ...field.metadata.metadata,
                paragraphs: field.metadata.metadata.paragraphs?.map((paragraph) => ({
                  ...paragraph,
                  text: payload.extractedText
                    ? payload.extractedText[index]?.body?.text?.slice(paragraph.start || 0, paragraph.end).trim()
                    : undefined,
                })),
              }
            : undefined,
        }
      : undefined,
  })),
});
