export const mimeIcons: { [mime: string]: string } = {

  'application/excel': 'application/excel.svg',
  'application/msword': 'application/doc.svg',
  'application/note': 'application/note.svg',
  'application/pdf': 'application/pdf.svg',
  'application/powerpoint': 'application/ppt.svg',
  'application/vnd.ms-powerpoint': 'application/ppt.svg',
  'application/vnd.ms-excel': 'application/xls.svg',
  'application/stf-conversation': 'application/stf-conversation.svg',
  'application/stf-link': 'application/stf-link.svg',
  'application/stf-page': 'application/stf-page.svg',
  'application/stf-text': 'application/stf-text.svg',
  'application/ticket': 'application/ticket.svg',
  'application/zip': 'application/zip.svg',
  'application/vnd.oasis.opendocument.text': 'application/vnd.oasis.opendocument.text.svg',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'application/xlsx.svg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'application/doc.svg',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'application/ppt.svg',

  'image/bmp': 'image/bmp.svg',
  'image/jpeg': 'image/jpg.svg',
  'image/pdf': 'image/pdf.svg',
  'image/svg+xml': 'image/svg+xml.svg',
  'image/zip': 'image/zip.svg',
  'image/gif': 'image/gif.svg',
  'image/jpg': 'image/jpg.svg',
  'image/png': 'image/png.svg',
  'image/txt': 'image/txt.svg',

  'text/html': 'text/html.svg',
  'text/plain': 'text/plain.svg',
  'text/rtf': 'text/rtf.svg',
  'text/csv': 'text/csv.svg',

  'unknown/dwg': 'unknown/dwg.svg',
  'unknown/msg': 'unknown/msg.svg',
  'unknown/mts': 'unknown/mts.svg',

  'video/mp4': 'video/mp4.svg',
  'video/quicktime': 'video/mov.svg',
  'audio/mpeg': 'audio/mpeg.svg',
  'media/video': 'video/video.svg',
  'media/video+srt': 'video/video-cc.svg',
};

const defaultIcons: { [mime: string]: string } = {
  'video': 'video/video.svg',
}

const genericIcon = 'application/generic.svg';

export function getMimeIcon(mime: string): string {
  return mimeIcons[mime] || defaultIcons[mime.split('/')[0]] || genericIcon;
}
