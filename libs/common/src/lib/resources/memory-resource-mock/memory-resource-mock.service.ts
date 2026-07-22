import { Injectable, computed, signal } from '@angular/core';
import {
  MEMORY_MOCK_RESOURCE,
  MemoryMockFact,
  MemoryMockReferenceContent,
  MemoryMockSession,
  MemoryMockTab,
} from './memory-resource-mock.config';

@Injectable()
export class MemoryResourceMockService {
  private _activeTab = signal<MemoryMockTab>('sessions');
  private _activeSessionId = signal<string>(MEMORY_MOCK_RESOURCE.sessions[0]?.id || '');

  resource = signal(MEMORY_MOCK_RESOURCE);
  activeTab = this._activeTab.asReadonly();
  activeSessionId = this._activeSessionId.asReadonly();

  sessions = computed<MemoryMockSession[]>(() => this.resource().sessions as MemoryMockSession[]);
  facts = computed<MemoryMockFact[]>(() => this.resource().facts as MemoryMockFact[]);
  referenceContent = computed<MemoryMockReferenceContent[]>(
    () => this.resource().reference_content as MemoryMockReferenceContent[],
  );
  activeSession = computed<MemoryMockSession | undefined>(() =>
    this.sessions().find((session) => session.id === this._activeSessionId()),
  );

  setTab(tab: MemoryMockTab) {
    this._activeTab.set(tab);
  }

  selectSession(sessionId: string) {
    this._activeSessionId.set(sessionId);
  }
}
