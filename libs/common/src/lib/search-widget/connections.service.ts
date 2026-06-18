import { Injectable, signal } from '@angular/core';

export type KbConnectionType = 'kb' | 'mcp' | 'perplexity' | 'perplexity-search' | 'perplexity-answer' | 'gemini';

export interface KbConnection {
  id: string;
  type: KbConnectionType;
  label: string;
  description: string;
  preselectedFilterExpression?: string;
  // MCP-specific fields
  url?: string;
  key?: string;
  timeout?: number | null;
}

@Injectable({ providedIn: 'root' })
export class KbConnectionsService {
  private _connections = signal<KbConnection[]>([]);
  readonly connections = this._connections.asReadonly();

  addOrUpdate(connection: KbConnection): void {
    this._connections.update((list) => {
      const idx = list.findIndex((c) => c.id === connection.id);
      if (idx >= 0) {
        return list.map((c, i) => (i === idx ? connection : c));
      }
      return [...list, connection];
    });
  }

  update(id: string, changes: Partial<Omit<KbConnection, 'id'>>): void {
    this._connections.update((list) => list.map((c) => (c.id === id ? { ...c, ...changes } : c)));
  }

  remove(id: string): void {
    this._connections.update((list) => list.filter((c) => c.id !== id));
  }
}
