import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  MEMORY_MOCK_RESOURCE,
  MemoryMockFact,
  MemoryMockGraphEdge,
  MemoryMockEntry,
  MemoryMockReferenceContent,
  MemoryMockSession,
  MemoryMockTab,
  MemoryMockTranscriptTurn,
  MemoryMockTopic,
  MemoryMockUser,
} from './memory-resource-mock.config';
import { EditResourceService } from '../edit-resource';

@Injectable()
export class MemoryResourceMockService {
  private editResource = inject(EditResourceService);
  private currentResource = toSignal(this.editResource.resource, { initialValue: null });
  private _activeTab = signal<MemoryMockTab>('sessions');
  private _selectedTopicId = signal<string>(MEMORY_MOCK_RESOURCE.topics[0]?.id || '');
  private _selectedUserId = signal<string>('');
  private _activeSessionId = signal<string>('');
  private _expandedEntryIds = signal<string[]>([]);
  private _expandedFactIds = signal<string[]>([]);
  private _resourceId = computed(() => this.currentResource()?.id || 'resource');

  resource = computed(() => ({
    ...MEMORY_MOCK_RESOURCE,
    title: this.currentResource()?.title || MEMORY_MOCK_RESOURCE.title,
    description: this.currentResource()?.summary || MEMORY_MOCK_RESOURCE.description,
  }));
  activeTab = this._activeTab.asReadonly();
  selectedTopicId = this._selectedTopicId.asReadonly();
  selectedUserId = this._selectedUserId.asReadonly();
  activeSessionId = this._activeSessionId.asReadonly();

  topics = computed<MemoryMockTopic[]>(() => this.resource().topics as MemoryMockTopic[]);
  selectedTopic = computed<MemoryMockTopic | undefined>(() =>
    this.topics().find((topic) => topic.id === this._selectedTopicId()),
  );
  users = computed<MemoryMockUser[]>(() => this.resource().users as MemoryMockUser[]);
  usersForSelectedTopic = computed<MemoryMockUser[]>(() => {
    const userIds = new Set(
      this.resource()
        .sessions.filter((session) => session.topic_id === this._selectedTopicId())
        .map((session) => session.user_id),
    );
    return this.users().filter((user) => userIds.has(user.id));
  });
  selectedUser = computed<MemoryMockUser | undefined>(() =>
    this.users().find((user) => user.id === this._selectedUserId()),
  );
  sessions = computed<MemoryMockSession[]>(() =>
    this.resource()
      .sessions.filter(
        (session) => session.topic_id === this._selectedTopicId() && session.user_id === this._selectedUserId(),
      )
      .map((session) => ({
        ...session,
        id: `${this._resourceId()}-${session.id}`,
        entries: session.entries.map((entry) => ({ ...entry, id: `${this._resourceId()}-${entry.id}` })),
      })),
  );
  facts = computed<MemoryMockFact[]>(() =>
    this.resource().facts.filter((fact) => fact.topic_id === this._selectedTopicId() && fact.user_id === this._selectedUserId()),
  );
  referenceContent = computed<MemoryMockReferenceContent[]>(
    () => this.resource().reference_content.filter((item) => item.topic_id === this._selectedTopicId()),
  );
  graph = computed<MemoryMockGraphEdge[]>(() =>
    this.resource().graph.filter((edge) => edge.topic_id === this._selectedTopicId() && edge.user_id === this._selectedUserId()),
  );
  activeSession = computed<MemoryMockSession | undefined>(() =>
    this.sessions().find((session) => session.id === this._activeSessionId()),
  );
  allEntries = computed<MemoryMockEntry[]>(() => this.sessions().flatMap((session) => session.entries));

  constructor() {
    effect(() => {
      const availableUsers = this.usersForSelectedTopic();
      const selectedUserId = this._selectedUserId();
      if (!selectedUserId || !availableUsers.some((user) => user.id === selectedUserId)) {
        this._selectedUserId.set(availableUsers[0]?.id || '');
      }
    });
    effect(() => {
      const firstSessionId = this.sessions()[0]?.id || '';
      const hasActiveSession = this.sessions().some((session) => session.id === this._activeSessionId());
      if (!hasActiveSession) {
        this._activeSessionId.set(firstSessionId);
      }
    });
    effect(() => {
      const validEntryIds = new Set(this.allEntries().map((entry) => entry.id));
      this._expandedEntryIds.update((ids) => ids.filter((id) => validEntryIds.has(id)));
    });
    effect(() => {
      const validFactIds = new Set(this.facts().map((fact) => fact.id));
      this._expandedFactIds.update((ids) => ids.filter((id) => validFactIds.has(id)));
    });
  }

  setTab(tab: MemoryMockTab) {
    this._activeTab.set(tab);
  }

  setTopic(topicId: string) {
    this._selectedTopicId.set(topicId);
  }

  setUser(userId: string) {
    this._selectedUserId.set(userId);
  }

  selectSession(sessionId: string) {
    this._activeSessionId.set(sessionId);
  }

  setEntryExpanded(entryId: string, expanded: boolean) {
    this._expandedEntryIds.update((ids) => {
      const isExpanded = ids.includes(entryId);
      if (expanded && !isExpanded) {
        return ids.concat(entryId);
      }
      if (!expanded && isExpanded) {
        return ids.filter((id) => id !== entryId);
      }
      return ids;
    });
  }

  isEntryExpanded(entryId: string) {
    return this._expandedEntryIds().includes(entryId);
  }

  shouldCollapseEntry(entry: MemoryMockEntry) {
    return (
      entry.text.length > 180 ||
      !!entry.reasoning ||
      (entry.context || []).length > 0 ||
      Object.keys(entry.metadata || {}).length > 0
    );
  }

  setFactExpanded(factId: string, expanded: boolean) {
    this._expandedFactIds.update((ids) => {
      const isExpanded = ids.includes(factId);
      if (expanded && !isExpanded) {
        return ids.concat(factId);
      }
      if (!expanded && isExpanded) {
        return ids.filter((id) => id !== factId);
      }
      return ids;
    });
  }

  isFactExpanded(factId: string) {
    return this._expandedFactIds().includes(factId);
  }

  shouldCollapseFact(fact: MemoryMockFact) {
    return fact.text.length > 140 || fact.related_entry_ids.length > 0;
  }

  getRelatedEntries(fact: MemoryMockFact): MemoryMockEntry[] {
    const related = new Set(fact.related_entry_ids.map((id) => `${this._resourceId()}-${id}`));
    return this.allEntries().filter((entry) => related.has(entry.id));
  }

  getDummyTranscript(entry: MemoryMockEntry): MemoryMockTranscriptTurn[] {
    const contextTurns =
      entry.context?.map((message, index) => ({
        id: `${entry.id}-context-${index}`,
        speaker: message.author,
        message: message.text,
      })) || [];
    const timeline: MemoryMockTranscriptTurn[] = [
      ...contextTurns,
      {
        id: `${entry.id}-analysis`,
        speaker: entry.author,
        message: entry.text,
      },
    ];

    if (entry.reasoning) {
      timeline.push({
        id: `${entry.id}-reasoning`,
        speaker: entry.author,
        message: entry.reasoning,
      });
    }

    if (timeline.length === 0) {
      timeline.push({
        id: `${entry.id}-fallback`,
        speaker: entry.author,
        message: entry.text,
      });
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
