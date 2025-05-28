import mime from 'mime';

export const FILES_TO_IGNORE = ['.DS_Store', 'Thumbs.db'];
export const PATTERNS_TO_IGNORE = [/^~.+/, /.+\.tmp$/];
export const PENDING_RESOURCES_LIMIT = 900;

export function getFilesByType(files: File[], mediaFile: boolean): File[] {
  return files.filter((file) => {
    const type = file.type?.split('/')[0];
    const isMediaFile = type === 'audio' || type === 'video' || type === 'image';
    return mediaFile ? isMediaFile : !isMediaFile;
  });
}

export function getFilesGroupedByType(filesOrFileList: File[] | FileList): {
  mediaFiles: File[];
  nonMediaFiles: File[];
} {
  const files = Array.from(filesOrFileList)
    .filter(
      (file) => !FILES_TO_IGNORE.includes(file.name) && !PATTERNS_TO_IGNORE.some((pattern) => file.name.match(pattern)),
    )
    .map((file) => {
      // Some file types (like .mkv) are not recognized by some browsers
      return file.type
        ? file
        : new File([file], file.name, { type: (mime as unknown as any).getType(file.name) || undefined });
    });
  const mediaFiles = getFilesByType(files, true);
  const nonMediaFiles = getFilesByType(files, false);

  return { mediaFiles, nonMediaFiles };
}
