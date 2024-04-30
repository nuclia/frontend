import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaDemoModule } from '../../../../../../libs/pastanaga-angular/projects/demo/src';
import { FolderTree, FolderTreeComponent } from '@nuclia/sistema';

@Component({
  selector: 'nsd-sistema-folder-tree',
  standalone: true,
  imports: [CommonModule, PaDemoModule, FolderTreeComponent],
  templateUrl: './sistema-folder-tree.component.html',
  styleUrl: './sistema-folder-tree.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SistemaFolderTreeComponent {
  tree1: FolderTree = {
    id: 'root1',
    title: '/',
    path: '/',
    children: {
      '/Level 1 - A': {
        id: '1A',
        title: 'Level 1 - A',
        path: '/Level 1 - A',
        children: {
          '/Level 1 - A/Level 2A - a': {
            id: '2A-a',
            title: 'Level 2A - a',
            path: '/Level 1 - A/Level 2A - a',
            children: {
              '/Level 1 - A/Level 2A - a/a1': { id: '3A-a1', path: '/Level 1 - A/Level 2A - a/a1', title: 'a1' },
              '/Level 1 - A/Level 2A - a/a2': { id: '3A-a2', path: '/Level 1 - A/Level 2A - a/a2', title: 'a2' },
              '/Level 1 - A/Level 2A - a/a3': { id: '3A-a3', path: '/Level 1 - A/Level 2A - a/a3', title: 'a3' },
            },
          },
          '/Level 1 - A/Level 2A - b': { id: '2A-b', title: 'Level 2A - b', path: '/Level 1 - A/Level 2A - b' },
          '/Level 1 - A/Level 2A - c': {
            id: '2A-c',
            title: 'Level 2A - c',
            path: '/Level 1 - A/Level 2A - c',
            children: {
              '/Level 1 - A/Level 2A - c/c1': { id: '3A-c1', title: 'c1', path: '/Level 1 - A/Level 2A - c/c1' },
              '/Level 1 - A/Level 2A - c/c2': { id: '3A-c2', title: 'c2', path: '/Level 1 - A/Level 2A - c/c2' },
              '/Level 1 - A/Level 2A - c/c3': { id: '3A-c3', title: 'c3', path: '/Level 1 - A/Level 2A - c/c3' },
            },
          },
        },
      },
      '/Level 1 - B': { id: '1B', title: 'Level 1 - B', path: '/Level 1 - B' },
      '/Level 1 - C': {
        id: '1C',
        title: 'Level 1 - C',
        path: '/Level 1 - C',
        children: {
          '/Level 1 - C/Level 2C - a': { id: '2C-a', title: 'Level 2C - a', path: '/Level 1 - C/Level 2C - a' },
          '/Level 1 - C/Level 2C - b': { id: '2C-b', title: 'Level 2C - b', path: '/Level 1 - C/Level 2C - b' },
          '/Level 1 - C/Level 2C - c': {
            id: '2C-c',
            title: 'Level 2C - c',
            path: '/Level 1 - C/Level 2C - c',
            children: {
              '/Level 1 - C/Level 2C - c/c1': { id: '3C-c1', title: 'c1', path: '/Level 1 - C/Level 2C - c/c1' },
              '/Level 1 - C/Level 2C - c/c2': { id: '3C-c2', title: 'c2', path: '/Level 1 - C/Level 2C - c/c2' },
              '/Level 1 - C/Level 2C - c/c3': { id: '3C-c3', title: 'c3', path: '/Level 1 - C/Level 2C - c/c3' },
            },
          },
          '/Level 1 - C/Level 2C - d': { id: '2C-d', title: 'Level 2C - d', path: '/Level 1 - C/Level 2C - d' },
        },
      },
      '/Level 1 - D': { id: '1D', title: 'Level 1 - D', path: '/Level 1 - D', children: {} },
      '/Level 1 - E': { id: '1E', title: 'Level 1 - E', path: '/Level 1 - E', children: {} },
    },
  };
  tree2: FolderTree = {
    id: 'root2',
    title: '/',
    path: '/',
    children: {
      '/Folder 1': { id: 'folder1', path: '/Folder 1', title: 'Folder 1' },
      '/Folder 2': {
        id: 'folder2',
        path: '/Folder 2',
        title: 'Folder 2',
        children: {
          '/Folder 2/a': { id: 'folder2a', path: '/Folder 2/a', title: 'a' },
          '/Folder 2/b': { id: 'folder2b', path: '/Folder 2/b', title: 'b' },
        },
      },
      '/Folder 3': { id: 'folder3', path: '/Folder 3', title: 'Folder 3' },
      '/Folder 4': { id: 'folder4', path: '/Folder 4', title: 'Folder 4' },
    },
  };

  selection1: { id: string; path: string }[] = [];
  selection2: { id: string; path: string }[] = [];
  code = `<nsi-folder-tree
      [folderTree]="tree"
      (selectionChange)="selection = $event"></nsi-folder-tree>`;
}
