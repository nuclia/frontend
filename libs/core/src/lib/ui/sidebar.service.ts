import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SidebarService {
  // Private
  private _registry: { [key: string]: any } = {};

  constructor() {}

  register(key: string, sidebar: any): void {
    if (this._registry[key]) {
      console.error(
        `The sidebar with the key '${key}' already exists. Either unregister it first or use a unique key.`
      );

      return;
    }

    this._registry[key] = sidebar;
  }

  unregister(key: string): void {
    if (!this._registry[key]) {
      console.warn(`The sidebar with the key '${key}' doesn't exist in the registry.`);
    }

    delete this._registry[key];
  }

  getSidebar(key: string): any {
    if (!this._registry[key]) {
      console.warn(`The sidebar with the key '${key}' doesn't exist in the registry.`);

      return;
    }

    return this._registry[key];
  }
}
