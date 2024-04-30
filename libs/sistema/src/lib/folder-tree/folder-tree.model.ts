export const FOLDER_ICON_PATH = 'assets/icons/folder.svg';

export interface FolderTree {
  id: string;
  path: string;
  title: string;
  children?: { [path: string]: FolderTree };
  indeterminate?: boolean;
  selected?: boolean;
  expanded?: boolean;
}

export interface FolderTreeUI extends FolderTree {
  height: number;
  children?: { [path: string]: FolderTreeUI };
}

export function getAllPaths(path: string): string[] {
  return path.split('/').reduce((paths, part) => {
    if (!part) return ['/'];
    const path = paths.length === 1 ? `/${part}` : paths[paths.length - 1] + `/${part}`;
    paths.push(path);
    return paths;
  }, [] as string[]);
}
