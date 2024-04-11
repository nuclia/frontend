export interface FolderTree {
  id: string;
  path: string;
  title: string;
  children?: { [id: string]: FolderTree };
  indeterminate?: boolean;
  selected?: boolean;
  expanded?: boolean;
}

export interface FolderTreeUI extends FolderTree {
  height: number;
  children?: { [id: string]: FolderTreeUI };
}
