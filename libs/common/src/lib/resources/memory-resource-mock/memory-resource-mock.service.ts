import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  MEMORY_MOCK_RESOURCE,
  MemoryMockEntry,
  MemoryMockFact,
  MemoryMockSession,
  MemoryMockTranscriptTurn,
} from './memory-resource-mock.config';
import { EditResourceService } from '../edit-resource';

@Injectable()
export class MemoryResourceMockService {
  private editResource = inject(EditResourceService);
  private currentResource = toSignal(this.editResource.resource, { initialValue: null });
  private _selectedDateIso = signal<string | null>(null);
  private _expandedFactIds = signal<string[]>([]);
  private _resourceId = computed(() => this.currentResource()?.id || 'resource');

  // TODO: replace MEMORY_MOCK_RESOURCE with SDK API call when real data is available.
  // The resource title and description map to the KB resource's title/summary fields.
  resource = computed(() => ({
    ...MEMORY_MOCK_RESOURCE,
    title: this.currentResource()?.title || MEMORY_MOCK_RESOURCE.title,
    description: this.currentResource()?.summary || MEMORY_MOCK_RESOURCE.description,
  }));

  selectedDateIso = this._selectedDateIso.asReadonly();

  // TODO: replace with SDK call — sessions should be fetched from the memory API
  // and entries are the individual conversation turns within each session.
  sessions = computed<MemoryMockSession[]>(() =>
    this.resource().sessions.map((session) => ({
      ...session,
      id: `${this._resourceId()}-${session.id}`,
      entries: session.entries.map((entry) => ({ ...entry, id: `${this._resourceId()}-${entry.id}` })),
    })),
  );

  allEntries = computed<MemoryMockEntry[]>(() => this.sessions().flatMap((session) => session.entries));

  // TODO: replace with SDK call — facts should come from the memory facts API endpoint.
  // Each fact has: id, text (the fact), source_session (author label), related_entry_ids (links to session entries).
  // The date filter compares against the related entry's timestamp (entry.at ISO string).
  facts = computed<MemoryMockFact[]>(() =>
    this.resource().facts.filter((fact) => {
      const selectedDate = this._selectedDateIso();
      if (!selectedDate) {
        return true;
      }
      const factDate = this.getRelatedEntries(fact)[0]?.at;
      return !!factDate && factDate.slice(0, 10) === selectedDate.slice(0, 10);
    }),
  );

  constructor() {
    // Keep expanded state in sync when facts change (e.g. after date filter applied)
    effect(() => {
      const validFactIds = new Set(this.facts().map((fact) => fact.id));
      this._expandedFactIds.update((ids) => ids.filter((id) => validFactIds.has(id)));
    });
  }

  setDateFilter(dateIso: string | null) {
    this._selectedDateIso.set(dateIso);
  }

  setFactExpanded(factId: string, expanded: boolean) {
    this._expandedFactIds.update((ids) => {
      const isExpanded = ids.includes(factId);
      if (expanded && !isExpanded) return ids.concat(factId);
      if (!expanded && isExpanded) return ids.filter((id) => id !== factId);
      return ids;
    });
  }

  isFactExpanded(factId: string): boolean {
    return this._expandedFactIds().includes(factId);
  }

  // Returns session entries linked to a fact via related_entry_ids.
  // TODO: when connecting to real API, related entries may be fetched separately per fact.
  getRelatedEntries(fact: MemoryMockFact): MemoryMockEntry[] {
    const related = new Set(fact.related_entry_ids.map((id) => `${this._resourceId()}-${id}`));
    return this.allEntries().filter((entry) => related.has(entry.id));
  }

  // TODO: remove this method when real transcript data is available from the API.
  // The transcript modal should fetch the actual conversation turns for a given session entry.
  getDummyTranscript(entry: MemoryMockEntry): MemoryMockTranscriptTurn[] {
    const contextTurns =
      entry.context?.map((message, index) => ({
        id: `${entry.id}-context-${index}`,
        speaker: message.author,
        message: message.text,
      })) || [];

    const timeline: MemoryMockTranscriptTurn[] = [
      ...contextTurns,
      { id: `${entry.id}-analysis`, speaker: entry.author, message: entry.text },
    ];

    if (entry.reasoning) {
      timeline.push({ id: `${entry.id}-reasoning`, speaker: entry.author, message: entry.reasoning });
    }

    return timeline.concat(this._buildDummyLongTranscript(entry));
  }

  private _buildDummyLongTranscript(entry: MemoryMockEntry): MemoryMockTranscriptTurn[] {
    const turns: MemoryMockTranscriptTurn[] = [];
    for (let i = 1; i <= 10; i += 1) {
      turns.push(
        {
          id: `${entry.id}-dummy-user-${i}`,
          speaker: 'User',
          message: `Dummy follow-up question ${i}: can you clarify this policy with more detail and an example scenario?`,
        },
        {
          id: `${entry.id}-dummy-agent-${i}`,
          speaker: entry.author,
          message: `Dummy transcript response ${i}: this is expanded mock transcript content to validate long-scroll behavior in the overlay, including multi-line details and additional context.`,
        },
      );
    }
    return turns;
  }
}

