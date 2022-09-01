import protobufjs from 'protobufjs';

const MODEL = `__MODEL__`;
let _Message;

export const NucliaProtobufConverter = (buffer) =>
  new Promise((resolve, reject) => {
    if (_Message) {
      resolve(_Message.decode(buffer));
    } else {
      const root = protobufjs.Root.fromJSON(JSON.parse(MODEL));
      _Message = root.lookupType('fdbwriter.BrokerMessage');
      resolve(_Message.decode(buffer));
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
