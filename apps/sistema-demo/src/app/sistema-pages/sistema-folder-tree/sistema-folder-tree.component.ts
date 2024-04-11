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
      '1A': {
        id: '1A',
        title: 'Level 1 – A',
        path: '/1A',
        children: {
          '2A-a': {
            id: '2A-a',
            title: 'Level 2A – a',
            path: '/1A/2A-a',
            children: {
              '3A-a1': { id: '3A-a1', path: '/1A/2A-a/3A-a1', title: 'a1' },
              '3A-a2': { id: '3A-a2', path: '/1A/2A-a/3A-a2', title: 'a2' },
              '3A-a3': { id: '3A-a3', path: '/1A/2A-a/3A-a3', title: 'a3' },
            },
          },
          '2A-b': { id: '2A-b', title: 'Level 2A – b', path: '/1A/2A-b' },
          '2A-c': {
            id: '2A-c',
            title: 'Level 2A – c',
            path: '/1A/2A-c',
            children: {
              '3A-c1': { id: '3A-c1', title: 'c1', path: '/1A/2A-c/3A-c1' },
              '3A-c2': { id: '3A-c2', title: 'c2', path: '/1A/2A-c/3A-c2' },
              '3A-c3': { id: '3A-c3', title: 'c3', path: '/1A/2A-c/3A-c3' },
            },
          },
        },
      },
      '1B': { id: '1B', title: 'Level 1 – B', path: '/Level 1 – B' },
      '1C': {
        id: '1C',
        title: 'Level 1 – C',
        path: '/1C',
        children: {
          '2C-a': { id: '2C-a', title: 'Level 2C - a', path: '/1C/2C-a' },
          '2C-b': { id: '2C-b', title: 'Level 2C - b', path: '/1C/2C-b' },
          '2C-c': {
            id: '2C-c',
            title: 'Level 2C - c',
            path: '/1C/2C-c',
            children: {
              '3C-c1': { id: '3C-c1', title: 'c1', path: '/1C/2C-c/3C-c1' },
              '3C-c2': { id: '3C-c2', title: 'c2', path: '/1C/2C-c/3C-c2' },
              '3C-c3': { id: '3C-c3', title: 'c3', path: '/1C/2C-c/3C-c3' },
            },
          },
          '2C-d': { id: '2C-d', title: 'Level 2C - d', path: '/1C/2C-d' },
        },
      },
      '1D': { id: '1D', title: 'Level 1 – D', path: '/1D', children: {} },
      '1E': { id: '1E', title: 'Level 1 – E', path: '/1E', children: {} },
    },
  };
  tree2: FolderTree = {
    id: 'root2',
    title: '/',
    path: '/',
    children: {
      folder1: { id: 'folder1', path: '/folder1', title: 'Folder 1' },
      folder2: {
        id: 'folder2',
        path: '/folder2',
        title: 'Folder 2',
        children: {
          folder2a: { id: 'folder2a', path: '/folder2/folder2a', title: 'a' },
          folder2b: { id: 'folder2b', path: '/folder2/folder2b', title: 'b' },
        },
      },
      folder3: { id: 'folder3', path: '/folder3', title: 'Folder 3' },
      folder4: { id: 'folder4', path: '/folder4', title: 'Folder 4' },
    },
  };

  selection1: string[] = [];
  selection2: string[] = [];
  code = `<nsi-folder-tree
      [folderTree]="tree"
      (selection)="selection = $event"></nsi-folder-tree>`;
}
