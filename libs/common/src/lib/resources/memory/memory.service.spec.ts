import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { Message, Resource } from '@nuclia/core';
import { EditResourceService } from '../edit-resource';
import { MemoryService } from './memory.service';
import { MEMORY_SESSION_FIELD_PREFIX } from './memory.config';
import { MemoryEntry } from './memory.model';

describe('MemoryService', () => {
  const sessionFieldId = `${MEMORY_SESSION_FIELD_PREFIX}s1`;

  let service: MemoryService;
  let getFieldSpy: jest.Mock;
  let resourceSubject: BehaviorSubject<Resource | null>;

  function setup(getFieldReturn: () => ReturnType<jest.Mock>) {
    getFieldSpy = jest.fn(getFieldReturn);
    const fakeResource = {
      data: { conversations: { [sessionFieldId]: {} } },
      getField: getFieldSpy,
    } as unknown as Resource;
    resourceSubject = new BehaviorSubject<Resource | null>(fakeResource);

    TestBed.configureTestingModule({
      providers: [
        MemoryService,
        { provide: EditResourceService, useValue: { resource: resourceSubject.asObservable() } },
      ],
    });
    service = TestBed.inject(MemoryService);
  }

  function fakeMessage(text: string, ident = 'e1'): Message {
    return { ident, content: { text: JSON.stringify({ text }) }, timestamp: '2024-05-01T10:00:00.000Z' };
  }

  it('should share one in-flight request when the same session is requested twice before the first resolves', () => {
    const fieldSubject = new Subject<{ value: { messages: Message[] } }>();
    setup(() => fieldSubject);

    const results: MemoryEntry[][] = [];
    service.loadSessionEntries(sessionFieldId).subscribe((entries) => results.push(entries));
    service.loadSessionEntries(sessionFieldId).subscribe((entries) => results.push(entries));

    // Both calls happened before the request settled: only a single HTTP call should have fired.
    expect(getFieldSpy).toHaveBeenCalledTimes(1);

    fieldSubject.next({ value: { messages: [fakeMessage('hello there')] } });
    fieldSubject.complete();

    expect(results).toHaveLength(2);
    expect(results[0]).toEqual(results[1]);
    expect(results[0][0].content.text).toBe('hello there');
  });

  it('should fire a new request for a session requested again after the previous one has settled', () => {
    setup(() => of({ value: { messages: [fakeMessage('first')] } }));

    service.loadSessionEntries(sessionFieldId).subscribe();
    expect(getFieldSpy).toHaveBeenCalledTimes(1);

    // Second, unrelated session -> must trigger its own request (no cross-session bleed).
    service.loadSessionEntries(`${MEMORY_SESSION_FIELD_PREFIX}s2`).subscribe();
    expect(getFieldSpy).toHaveBeenCalledTimes(2);
  });

  it('should serve cached entries without re-fetching once a session has loaded successfully', () => {
    setup(() => of({ value: { messages: [fakeMessage('cached')] } }));

    service.loadSessionEntries(sessionFieldId).subscribe();
    expect(getFieldSpy).toHaveBeenCalledTimes(1);

    let secondResult: MemoryEntry[] | undefined;
    service.loadSessionEntries(sessionFieldId).subscribe((entries) => (secondResult = entries));

    expect(getFieldSpy).toHaveBeenCalledTimes(1);
    expect(secondResult?.[0].content.text).toBe('cached');
  });

  it('should resolve with an empty list and clear the loading flag when the request fails', () => {
    const fieldSubject = new Subject<{ value: { messages: Message[] } }>();
    setup(() => fieldSubject);

    let result: MemoryEntry[] | undefined;
    service.loadSessionEntries(sessionFieldId).subscribe((entries) => (result = entries));
    expect(service.isSessionEntriesLoading(sessionFieldId)).toBe(true);

    fieldSubject.error(new Error('network error'));

    expect(result).toEqual([]);
    expect(service.isSessionEntriesLoading(sessionFieldId)).toBe(false);
  });
});
