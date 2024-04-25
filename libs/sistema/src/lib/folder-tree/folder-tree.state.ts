import { Injectable } from '@angular/core';
import { FolderTree, getAllPaths } from './folder-tree.model';
import { BehaviorSubject, filter, map } from 'rxjs';

let count = 0;

/**
 * This service is not injected in root as it's not a singleton.
 * It is directly provided in FolderTreeComponent’s providers list,
 * so each FolderTreeComponent instance have its own instance of FolderTreeState
 * which is shared with its child components (RecursiveFolderTreeComponent)
 */
@Injectable()
export class FolderTreeState {
  private readonly id = `state-${count++}`;
  private _tree = new BehaviorSubject<FolderTree | null>(null);
  tree = this._tree.asObservable().pipe(
    filter((tree) => !!tree),
    map((tree) => tree as FolderTree),
  );

  initTree(tree: FolderTree, selection?: { id: string; path: string }[]) {
    this._tree.next(tree);
    (selection || []).forEach((selectedItem) => {
      const node = this.getFolder(selectedItem.path);
      if (node) {
        this.toggleFolder(node, true);
      }
    });
  }

  toggleFolder(folder: FolderTree, selected: boolean) {
    const updatedFolder = this.toggleAllChildren(folder, selected);
    const updatedTree = this.updateAllParents(updatedFolder, true);
    if (updatedTree) {
      this._tree.next({ ...updatedTree });
    } else if (updatedFolder && updatedFolder.path === '/') {
      // updatedTree is undefined when folder is actually the root
      this._tree.next({ ...updatedFolder });
    }
  }

  updateExpanded(folder: FolderTree) {
    folder.expanded = !folder.expanded;
    if (folder.path === '/') {
      this._tree.next({ ...folder });
    } else {
      const updatedTree = this.updateAllParents(folder);
      if (updatedTree) {
        this._tree.next({ ...updatedTree });
      }
    }
  }

  private toggleAllChildren(folder: FolderTree, selected: boolean): FolderTree {
    return {
      ...folder,
      selected,
      indeterminate: false,
      children: Object.values(folder.children || {}).reduce((children, child) => {
        return {
          ...children,
          [child.path]: this.toggleAllChildren(child, selected),
        };
      }, {}),
    };
  }

  private updateAllParents(folder: FolderTree, updateSelection = false): FolderTree | undefined {
    if (folder.path === '/') {
      return;
    }
    const parentPath = this.getParentPath(folder.path);
    const parent = this.getFolder(parentPath);
    if (!parent) {
      return;
    }
    const children = {
      ...parent.children,
      [folder.path]: folder,
    };
    const updatedParent = {
      ...parent,
      children,
    };
    if (updateSelection) {
      const childList = Object.values(children);
      const allChildrenSelected = childList.every((child) => child.selected);
      updatedParent.selected = allChildrenSelected;
      updatedParent.indeterminate =
        !allChildrenSelected && childList.some((child) => child.selected || child.indeterminate);
    }
    if (updatedParent.path === '/') {
      return updatedParent;
    } else {
      return this.updateAllParents(updatedParent, updateSelection);
    }
  }

  private getParentPath(path: string): string {
    const titles = path.split('/');
    return titles.slice(0, titles.length - 1).join('/') || '/';
  }

  private getFolder(path: string): FolderTree | undefined {
    if (!this._tree.value) {
      return undefined;
    }
    if (path === '/') {
      return this._tree.value;
    }

    const allPaths = getAllPaths(path);
    let parent = this._tree.value;
    let folder: FolderTree | undefined;
    allPaths.forEach((part) => {
      if (parent) {
        folder = parent.children?.[part];
        if (folder) {
          parent = folder;
        }
      }
    });
    return folder;
  }
}
