import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCircleCheck, lucideGitBranch } from '@ng-icons/lucide';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmMarkerImports } from '../index';
import { HlmMarker } from './hlm-marker';

interface MarkerStoryArgs {
  variant: 'default' | 'separator' | 'border';
  text: string;
}

const meta: Meta<MarkerStoryArgs> = {
  title: 'Spartan/Marker',
  component: HlmMarker,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [...HlmMarkerImports, NgIcon],
      providers: [provideIcons({ lucideCircleCheck, lucideGitBranch })],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: `Displays a status update, system note, or labeled separator within a conversation. Use it to distinguish events such as processing activity or conversation milestones from messages sent by participants.
Import <code>HlmMarkerImports</code> from <code>@nuclia/ui-spartan/marker</code>.

Compose <code>hlmMarker</code> with an optional <code>hlmMarkerIcon</code> (decorative, hidden from assistive technology) and an <code>hlmMarkerContent</code> holding the text. The <code>variant</code> input is <code>default</code> (plain line), <code>separator</code> (text centered between two rules) or <code>border</code> (underlined).
Because the icon is <code>aria-hidden</code>, the text must carry the whole meaning of the marker.`,
      },
    },
  },
  args: {
    variant: 'default',
    text: 'Switched to the main branch',
  },
  argTypes: {
    variant: {
      description: 'Visual style of the marker.',
      control: 'inline-radio',
      options: ['default', 'separator', 'border'],
    },
    text: {
      description: 'Text of <code>hlmMarkerContent</code>.',
      control: 'text',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <div hlmMarker [variant]="variant" class="max-w-xl">
        <span hlmMarkerIcon>
          <ng-icon name="lucideGitBranch" />
        </span>
        <span hlmMarkerContent>{{ text }}</span>
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<MarkerStoryArgs>;

export const Default: Story = {};

export const Separator: Story = {
  args: {
    variant: 'separator',
    text: 'Yesterday',
  },
};

export const Border: Story = {
  args: {
    variant: 'border',
    text: 'Conversation started on 12 March',
  },
};

export const StatusUpdate: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    template: `
      <div hlmMarker class="max-w-xl">
        <span hlmMarkerIcon>
          <ng-icon name="lucideCircleCheck" />
        </span>
        <span hlmMarkerContent>Indexing finished: 24 documents are now searchable</span>
      </div>
    `,
  }),
};

export const WithoutIcon: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    template: `
      <div hlmMarker variant="separator" class="max-w-xl">
        <span hlmMarkerContent>New messages</span>
      </div>
    `,
  }),
};
