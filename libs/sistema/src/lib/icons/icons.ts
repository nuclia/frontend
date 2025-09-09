export const mimeIcons: { [mime: string]: string } = {
  'application/pdf': 'file-pdf',
  'application/stf-conversation': 'chat',
  'application/stf-link': 'link',

  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'file',
  'application/vnd.oasis.opendocument.text': 'file',
  'application/msword': 'file',
  'application/stf-text': 'file',
  'text/html': 'file',
  'text/plain': 'file',
  'text/rtf': 'file',

  'application/excel': 'spreadsheet',
  'application/vnd.ms-excel': 'spreadsheet',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'spreadsheet',
  'text/csv': 'spreadsheet',
};

const genericIcon = 'file-empty';

export function getMimeIcon(mime: string): string {
  if (mime.includes('video')) {
    return 'play';
  } else if (mime.includes('audio')) {
    return 'audio';
  } else if (mime.includes('image')) {
    return 'image';
  } else if (mime.includes('message')) {
    return 'chat';
  } else {
    return mimeIcons[mime] || genericIcon;
  }
}
