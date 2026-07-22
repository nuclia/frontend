export type MemoryMockTab = 'sessions' | 'facts' | 'reference' | 'graph';

export interface MemoryMockTopic {
  id: string;
  title: string;
  description: string;
}

export interface MemoryMockContextMessage {
  author: string;
  text: string;
}

export interface MemoryMockEntry {
  id: string;
  topic_id: string;
  user_id: string;
  author: string;
  at: string;
  text: string;
  reasoning?: string;
  context?: MemoryMockContextMessage[];
  metadata?: Record<string, string | number | boolean>;
}

export interface MemoryMockSession {
  id: string;
  topic_id: string;
  user_id: string;
  owner: string;
  last_activity: string;
  entries: MemoryMockEntry[];
}

export interface MemoryMockFact {
  id: string;
  topic_id: string;
  user_id: string;
  text: string;
  source_session: string;
  related_entry_ids: string[];
  reasoning?: string;
}

export interface MemoryMockReferenceContent {
  id: string;
  topic_id: string;
  title: string;
  type: string;
  summary: string;
}

export interface MemoryMockGraphEdge {
  id: string;
  topic_id: string;
  user_id: string;
  source: string;
  relation: string;
  destination: string;
}

export interface MemoryMockUser {
  id: string;
  label: string;
}

export const MEMORY_MOCK_RESOURCE = {
  title: 'HR — Paid Time Off',
  description: 'Internal HR memory for PTO policy support',
  topics: [
    {
      id: 'vacation-policy',
      title: 'Vacation policy',
      description: 'Rules and decisions related to paid time off and exceptions.',
    },
    {
      id: 'handbook',
      title: 'Employee handbook',
      description: 'Operational and onboarding guidance for employees.',
    },
  ] as MemoryMockTopic[],
  users: [
    { id: 'alice-hr', label: 'Alice (HR)' },
    { id: 'bob-hr', label: 'Bob (HR)' },
  ] as MemoryMockUser[],
  sessions: [
    {
      id: 'vacation-alice-1',
      topic_id: 'vacation-policy',
      user_id: 'alice-hr',
      owner: 'Alice (HR)',
      last_activity: '2026-07-21T14:50:00Z',
      entries: [
        {
          id: 'alice-entry-001',
          topic_id: 'vacation-policy',
          user_id: 'alice-hr',
          author: 'Alice (HR)',
          at: '2026-07-21T14:41:00Z',
          text:
            'Approved carry-over exception for Maria (EMP-1042). She was unable to take her 8 remaining days due to the Q4 product launch.',
          reasoning:
            'Business-critical launch period limited vacation scheduling. Decision balanced policy consistency with operational reality.',
          context: [
            {
              author: 'Maria (employee)',
              text: 'Can I carry over 8 days from the Q4 launch period?',
            },
            {
              author: "Maria's manager",
              text: "Confirmed — Maria's presence was essential during the launch period.",
            },
          ],
          metadata: {
            employee_id: 'EMP-1042',
            department: 'Engineering',
            decision: 'approved',
            days: 8,
          },
        },
        {
          id: 'alice-entry-002',
          topic_id: 'vacation-policy',
          user_id: 'alice-hr',
          author: 'Alice (HR)',
          at: '2026-07-21T15:05:00Z',
          text:
            'Clarified that half-day PTO requests are valid when manager approval is in place and team coverage is confirmed.',
          context: [
            {
              author: 'HR knowledge base',
              text: 'Half-day requests are valid under standard approval policy.',
            },
          ],
        },
      ],
    },
    {
      id: 'vacation-bob-1',
      topic_id: 'vacation-policy',
      user_id: 'bob-hr',
      owner: 'Bob (HR)',
      last_activity: '2026-07-20T17:12:00Z',
      entries: [
        {
          id: 'bob-entry-001',
          topic_id: 'vacation-policy',
          user_id: 'bob-hr',
          author: 'Bob (HR)',
          at: '2026-07-20T17:03:00Z',
          text:
            'Denied carry-over exception for Leo (EMP-5512). He had adequate opportunity to schedule vacation and 6 days were forfeited under standard policy.',
          reasoning: 'No documented business-critical blocker. Standard policy applied.',
          context: [
            {
              author: 'Leo (employee)',
              text: 'I forgot to use 6 days. Can I carry them over this year?',
            },
          ],
          metadata: {
            employee_id: 'EMP-5512',
            decision: 'denied',
            days: 6,
          },
        },
      ],
    },
    {
      id: 'handbook-alice-1',
      topic_id: 'handbook',
      user_id: 'alice-hr',
      owner: 'Alice (HR)',
      last_activity: '2026-07-18T09:40:00Z',
      entries: [
        {
          id: 'alice-entry-010',
          topic_id: 'handbook',
          user_id: 'alice-hr',
          author: 'Alice (HR)',
          at: '2026-07-18T09:40:00Z',
          text:
            'Shared onboarding checklist update: new hires now complete security training before access provisioning.',
          metadata: {
            process: 'onboarding',
            step: 'security-training-first',
          },
        },
      ],
    },
  ] as MemoryMockSession[],
  facts: [
    {
      id: 'fact-alice-1',
      topic_id: 'vacation-policy',
      user_id: 'alice-hr',
      text: 'Alice approved an 8-day carry-over exception for Maria (EMP-1042) during a Q4 launch period.',
      source_session: 'Alice (HR)',
      related_entry_ids: ['alice-entry-001'],
      reasoning: 'Documented business-critical constraint.',
    },
    {
      id: 'fact-alice-2',
      topic_id: 'vacation-policy',
      user_id: 'alice-hr',
      text: 'Half-day PTO requests are allowed with manager approval and team coverage.',
      source_session: 'Alice (HR)',
      related_entry_ids: ['alice-entry-002'],
    },
    {
      id: 'fact-bob-1',
      topic_id: 'vacation-policy',
      user_id: 'bob-hr',
      text: 'Bob denied Leo’s carry-over request because policy conditions for exception were not met.',
      source_session: 'Bob (HR)',
      related_entry_ids: ['bob-entry-001'],
    },
    {
      id: 'fact-alice-3',
      topic_id: 'handbook',
      user_id: 'alice-hr',
      text: 'Onboarding now requires security training before system access is granted.',
      source_session: 'Alice (HR)',
      related_entry_ids: ['alice-entry-010'],
    },
  ] as MemoryMockFact[],
  reference_content: [
    {
      id: 'ref-1',
      topic_id: 'vacation-policy',
      title: 'PTO Policy 2026',
      type: 'PDF',
      summary: 'Official company PTO policy document.',
    },
    {
      id: 'ref-2',
      topic_id: 'vacation-policy',
      title: 'Manager PTO Exception Checklist',
      type: 'DOCX',
      summary: 'Internal checklist for approving time-off requests.',
    },
    {
      id: 'ref-3',
      topic_id: 'handbook',
      title: 'Employee Handbook 2026',
      type: 'PDF',
      summary: 'Main handbook used for onboarding and policy clarifications.',
    },
  ] as MemoryMockReferenceContent[],
  graph: [
    {
      id: 'edge-1',
      topic_id: 'vacation-policy',
      user_id: 'alice-hr',
      source: 'Maria (EMP-1042)',
      relation: 'received_exception_for',
      destination: '8-day PTO carry-over',
    },
    {
      id: 'edge-2',
      topic_id: 'vacation-policy',
      user_id: 'alice-hr',
      source: 'Q4 product launch',
      relation: 'caused',
      destination: 'carry-over exception',
    },
    {
      id: 'edge-3',
      topic_id: 'vacation-policy',
      user_id: 'bob-hr',
      source: 'Leo (EMP-5512)',
      relation: 'was_denied',
      destination: '6-day carry-over request',
    },
    {
      id: 'edge-4',
      topic_id: 'handbook',
      user_id: 'alice-hr',
      source: 'Security training',
      relation: 'precedes',
      destination: 'access provisioning',
    },
  ] as MemoryMockGraphEdge[],
} as const;
