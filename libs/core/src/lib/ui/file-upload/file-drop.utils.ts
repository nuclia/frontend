import { from } from 'rxjs';
import { DroppedFile } from './file-drop.directive';

export const getDroppedFiles = (dataTransferItemList: DataTransferItemList) =>
  from(getAllFileEntries(dataTransferItemList));

// Drop handler function to get all files
async function getAllFileEntries(dataTransferItemList: DataTransferItemList) {
  let fileEntries: DroppedFile[] = [];
  // Use BFS to traverse entire directory/file structure
  const queue: { entry: FileSystemEntry; path: string }[] = [];
  // Unfortunately dataTransferItemList is not iterable i.e. no forEach
  for (let i = 0; i < dataTransferItemList.length; i++) {
    const entry = dataTransferItemList[i].webkitGetAsEntry();
    if (entry) {
      queue.push({ entry, path: '' });
    }
  }
  while (queue.length > 0) {
    const { entry, path } = queue.shift()!;
    if (entry) {
      if (entry.isFile) {
        const file = await getFile(entry as FileSystemFileEntry);
        (file as DroppedFile).relativePath = path + file.name;
        fileEntries.push(file as DroppedFile);
      } else if (entry.isDirectory) {
        const directoryEntries = await readAllDirectoryEntries((entry as FileSystemDirectoryEntry).createReader());
        queue.push(...directoryEntries.map((item) => ({ entry: item, path: path + entry.name + '/' })));
      }
    }
  }
  return fileEntries;
}

// Get all the entries (files or sub-directories) in a directory
// by calling readEntries until it returns empty array
async function readAllDirectoryEntries(directoryReader: FileSystemDirectoryReader) {
  const entries: FileSystemEntry[] = [];
  let readEntries = await readEntriesPromise(directoryReader);
  while ((readEntries as FileSystemEntry[]).length > 0) {
    entries.push(...(readEntries as FileSystemEntry[]));
    readEntries = await readEntriesPromise(directoryReader);
  }
  return entries;
}

// Wrap readEntries in a promise to make working with readEntries easier
// readEntries will return only some of the entries in a directory
// e.g. Chrome returns at most 100 entries at a time
async function readEntriesPromise(directoryReader: FileSystemDirectoryReader) {
  try {
    return await new Promise((resolve, reject) => {
      directoryReader.readEntries(resolve, reject);
    });
  } catch (err) {
    console.log(err);
  }
}

async function getFile(fsFile: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => {
    fsFile.file((file) => resolve(file), reject);
  });
}
