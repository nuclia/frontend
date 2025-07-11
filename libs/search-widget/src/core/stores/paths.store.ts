import type { Search } from '@nuclia/core';
import { SvelteState } from '../state-lib';
import { getFacets } from '..';
import { of, switchMap, tap } from 'rxjs';

interface PathsState {
  paths: PathTree;
}

export type PathTree = { [key: string]: PathNode };

export interface PathNode {
  path: string;
  label: string;
  count: number;
  children: PathTree;
  childrenPaths: string[];
}

export const pathState = new SvelteState<PathsState>({
  paths: {},
});

export const paths = pathState.writer<PathTree, Search.FacetsResult>(
  (state) => state.paths['origin.path']?.children || {},
  (state, facets) => {
    Object.entries(facets).forEach(([key, value]) => {
      const elements = key.slice(1).split('/');
      const label = elements[elements.length - 1];
      const newNode = {
        label,
        path: key,
        count: Object.keys(value).length,
        childrenPaths: Object.keys(value),
        children: {},
      };
      if (elements.length === 1) {
        state.paths[label] = newNode;
      } else {
        const parent = getPathNode(state.paths, elements.slice(0, elements.length - 1));
        if (parent) {
          parent.children[label] = newNode;
        }
      }
    });
    return {
      ...state,
      // Clone paths, otherwise component props do not work
      paths: clone(state.paths),
    };
  },
);

export function loadPaths(items: string[], loadChildren = false) {
  return getFacets(items).pipe(
    tap((facets) => paths.set(facets)),
    switchMap((facets) => {
      const children = Object.values(facets).reduce((acc, curr) => [...acc, ...Object.keys(curr)], [] as string[]);
      return loadChildren ? getFacets(children).pipe(tap((facets) => paths.set(facets))) : of(facets);
    }),
  );
}

const getPathNode = (nodes: PathTree, path: string[]): PathNode | undefined => {
  if (path.length === 1) {
    return nodes[path[0]];
  } else {
    return nodes[path[0]] ? getPathNode(nodes[path[0]]?.children, path.slice(1)) : undefined;
  }
};

const clone = (nodes: PathTree): PathTree => {
  return Object.fromEntries(
    Object.entries(nodes).map(([key, node]) => [key, { ...node, children: clone(node.children) }]),
  );
};
