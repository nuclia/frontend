export type MemoryMockTab = 'sessions' | 'facts' | 'reference';

export interface MemoryMockEntry {
  author: string;
  at: string;
  text: string;
}

export interface MemoryMockSession {
  id: string;
  owner: string;
  last_activity: string;
  entries: MemoryMockEntry[];
}

export interface MemoryMockFact {
  id: string;
  text: string;
  source_session: string;
}

export interface MemoryMockReferenceContent {
  id: string;
  title: string;
  type: string;
  summary: string;
}

export const MEMORY_MOCK_RESOURCE = {
  title: 'HR — Paid Time Off',
  description: 'Internal HR memory for PTO policy support',
  sessions: [
    {
      id: 'hr-alex',
      owner: 'Alex (HR)',
      last_activity: '2026-07-21T14:50:00Z',
      entries: [
        {
          author: 'Employee',
          at: '2026-07-21T14:41:00Z',
          text: 'Can I split my PTO into half-days?',
        },
        {
          author: 'Alex (HR)',
          at: '2026-07-21T14:43:00Z',
          text: 'Yes, PTO can be requested in half-day increments with manager approval.',
        },
        {
          author: 'Employee',
          at: '2026-07-21T14:50:00Z',
          text: 'Great, thanks!',
        },
      ],
    },
    {
      id: 'hr-jules',
      owner: 'Jules (HR)',
      last_activity: '2026-07-20T17:12:00Z',
      entries: [
        {
          author: 'Employee',
          at: '2026-07-20T17:03:00Z',
          text: 'How far in advance do I need to submit PTO?',
        },
        {
          author: 'Jules (HR)',
          at: '2026-07-20T17:12:00Z',
          text: 'At least 2 weeks for absences longer than 3 business days.',
        },
      ],
    },
  ] as MemoryMockSession[],
  facts: [
    {
      id: 'fact-1',
      text: 'PTO can be taken in half-day increments with manager approval.',
      source_session: 'Alex (HR)',
    },
    {
      id: 'fact-2',
      text: 'Requests longer than 3 business days should be submitted at least 2 weeks in advance.',
      source_session: 'Jules (HR)',
    },
    {
      id: 'fact-3',
      text: 'Unused PTO is handled according to local payroll policy at year-end.',
      source_session: 'System',
    },
  ] as MemoryMockFact[],
  reference_content: [
    {
      id: 'ref-1',
      title: 'PTO Policy 2026',
      type: 'PDF',
      summary: 'Official company PTO policy document.',
    },
    {
      id: 'ref-2',
      title: 'Manager PTO Approval Checklist',
      type: 'DOCX',
      summary: 'Internal checklist for approving time-off requests.',
    },
  ] as MemoryMockReferenceContent[],
} as const;
