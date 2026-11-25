// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import {
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  matCheckCircleRound,
  matDescriptionRound,
  matErrorRound,
  matScheduleRound,
  matSearchRound,
} from '@ng-icons/material-symbols/round';
import { HlmTraceImports } from '../index';
import { HlmTrace } from './hlm-trace';

type TraceStatus = 'done' | 'running' | 'error' | 'pending';

interface TraceStoryArgs {
  status: TraceStatus;
  expanded: boolean;
  disabled: boolean;
  title: string;
  description: string;
}

const meta: Meta<TraceStoryArgs> = {
  title: 'Spartan/Trace',
  component: HlmTrace,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [...HlmTraceImports, NgIcon],
      providers: [
        provideIcons({
          matCheckCircleRound,
          matDescriptionRound,
          matErrorRound,
          matScheduleRound,
          matSearchRound,
        }),
      ],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: `Shows the steps of a process, such as the tool calls and reasoning of an AI agent, as a compact vertical list.
Import <code>HlmTraceImports</code> from <code>@progress/pdp-ui-spartan/trace</code> and compose <code>hlm-trace</code> with <code>hlm-trace-line</code> elements containing an optional <code>hlm-trace-icon</code>, a <code>hlm-trace-title</code> and an optional <code>hlm-trace-description</code> (for example a duration).

Set <code>status</code> on a line to <code>running</code> (shimmering title), <code>error</code> (destructive color) or <code>pending</code> (dimmed); leave it unset for a completed step. Wrap a line in a <code>button</code> or <code>a</code> to make it interactive.

To reveal step details, use <code>hlm-trace-collapsible</code> with a <code>button[hlmTraceCollapsibleTrigger]</code> containing the line and a <code>hlm-trace-collapsible-content</code>. The collapsible supports <code>expanded</code>, <code>disabled</code> and <code>expandedChange</code>, and the trigger exposes its expanded state to assistive technology.`,
      },
    },
  },
  args: {
    status: 'done',
    expanded: false,
    disabled: false,
    title: 'Searched the knowledge base',
    description: '1.2s',
  },
  argTypes: {
    status: {
      description:
        'Status of the collapsible step. <code>done</code> leaves the <code>status</code> input unset.',
      control: 'select',
      options: ['done', 'running', 'error', 'pending'],
    },
    expanded: {
      description: 'Expanded state of the collapsible step.',
      control: 'boolean',
    },
    disabled: {
      description: 'Prevents the collapsible step from being toggled.',
      control: 'boolean',
    },
    title: {
      description:
        'Text of the collapsible step, shown in <code>hlm-trace-title</code>.',
      control: 'text',
    },
    description: {
      description:
        'Secondary text of the collapsible step, shown in <code>hlm-trace-description</code>.',
      control: 'text',
    },
  },
  render: ({ status, expanded, disabled, title, description }) => ({
    props: {
      title,
      description,
      expanded,
      disabled,
      lineStatus: status === 'done' ? undefined : status,
      details:
        status === 'error'
          ? 'The search service did not respond. Try again later.'
          : 'Found 12 passages matching "quarterly revenue" across 3 documents.',
    },
    template: `
      <hlm-trace class="max-w-md">
        <hlm-trace-line>
          <hlm-trace-icon><ng-icon name="matDescriptionRound" /></hlm-trace-icon>
          <hlm-trace-title>Read 3 documents</hlm-trace-title>
          <hlm-trace-description>0.4s</hlm-trace-description>
        </hlm-trace-line>

        <hlm-trace-collapsible [expanded]="expanded" [disabled]="disabled">
          <button hlmTraceCollapsibleTrigger type="button">
            <hlm-trace-line [status]="lineStatus">
              <hlm-trace-icon><ng-icon name="matSearchRound" /></hlm-trace-icon>
              <hlm-trace-title>{{ title }}</hlm-trace-title>
              <hlm-trace-description>{{ description }}</hlm-trace-description>
            </hlm-trace-line>
          </button>
          <hlm-trace-collapsible-content>
            <p>{{ details }}</p>
          </hlm-trace-collapsible-content>
        </hlm-trace-collapsible>

        <hlm-trace-line status="pending">
          <hlm-trace-icon><ng-icon name="matScheduleRound" /></hlm-trace-icon>
          <hlm-trace-title>Write the answer</hlm-trace-title>
        </hlm-trace-line>
      </hlm-trace>
    `,
  }),
};

export default meta;

type Story = StoryObj<TraceStoryArgs>;

export const Default: Story = {};

export const Expanded: Story = {
  args: { expanded: true },
};

export const Running: Story = {
  args: {
    status: 'running',
    title: 'Searching the knowledge base…',
    description: '',
  },
};

export const Error: Story = {
  args: {
    status: 'error',
    expanded: true,
    title: 'Search failed',
  },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Statuses: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    template: `
      <hlm-trace class="max-w-md">
        <hlm-trace-line>
          <hlm-trace-icon><ng-icon name="matCheckCircleRound" /></hlm-trace-icon>
          <hlm-trace-title>Completed step</hlm-trace-title>
          <hlm-trace-description>0.8s</hlm-trace-description>
        </hlm-trace-line>
        <hlm-trace-line status="running">
          <hlm-trace-title>Running step</hlm-trace-title>
        </hlm-trace-line>
        <hlm-trace-line status="error">
          <hlm-trace-icon><ng-icon name="matErrorRound" /></hlm-trace-icon>
          <hlm-trace-title>Failed step</hlm-trace-title>
        </hlm-trace-line>
        <hlm-trace-line status="pending">
          <hlm-trace-icon><ng-icon name="matScheduleRound" /></hlm-trace-icon>
          <hlm-trace-title>Pending step</hlm-trace-title>
        </hlm-trace-line>
      </hlm-trace>
    `,
  }),
};

export const InteractiveLines: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    template: `
      <hlm-trace class="max-w-md">
        <a href="#">
          <hlm-trace-line>
            <hlm-trace-icon><ng-icon name="matDescriptionRound" /></hlm-trace-icon>
            <hlm-trace-title>Opened Quarterly report.pdf</hlm-trace-title>
          </hlm-trace-line>
        </a>
        <button type="button">
          <hlm-trace-line>
            <hlm-trace-icon><ng-icon name="matSearchRound" /></hlm-trace-icon>
            <hlm-trace-title>Show search results</hlm-trace-title>
            <hlm-trace-description>12 results</hlm-trace-description>
          </hlm-trace-line>
        </button>
      </hlm-trace>
    `,
  }),
};
