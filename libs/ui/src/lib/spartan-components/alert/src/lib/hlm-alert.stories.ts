import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCircleAlert, lucideCircleCheck } from '@ng-icons/lucide';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmButton } from '../../../button/src/index';
import { HlmAlertImports } from '../index';
import { HlmAlert } from './hlm-alert';

interface AlertStoryArgs {
  variant: 'default' | 'destructive';
  title: string;
  description: string;
}

const meta: Meta<AlertStoryArgs> = {
  title: 'Spartan/Alert',
  component: HlmAlert,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [...HlmAlertImports, HlmButton, NgIcon],
      providers: [provideIcons({ lucideCircleAlert, lucideCircleCheck })],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: `Highlights important information within the page, such as a warning, an error, or a status update. Unlike a dialog, an alert keeps the message in context without interrupting the user's task.
Import <code>HlmAlertImports</code> from <code>@nuclia/ui-spartan/alert</code> and compose <code>hlm-alert</code> with <code>hlmAlertTitle</code> and <code>hlmAlertDescription</code> children.

Add an <code>ng-icon</code> as the first child to show a leading icon, and a <code>hlmAlertAction</code> element (e.g. a small button) to place an action in the top-right corner.
Set <code>variant</code> to <code>destructive</code> for errors. The host gets <code>role="alert"</code>, so screen readers announce it; give icon-only actions an <code>aria-label</code>.`,
      },
    },
  },
  args: {
    variant: 'default',
    title: 'Resource is ready',
    description: 'Your report has finished processing and is available to review.',
  },
  argTypes: {
    variant: {
      description: 'Visual style of the alert. Use <code>destructive</code> for errors.',
      control: 'inline-radio',
      options: ['default', 'destructive'],
    },
    title: {
      description: 'Short summary shown in the <code>hlmAlertTitle</code> element.',
      control: 'text',
    },
    description: {
      description: 'Supporting text shown in the <code>hlmAlertDescription</code> element.',
      control: 'text',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <hlm-alert [variant]="variant" class="max-w-lg">
        <h2 hlmAlertTitle>{{ title }}</h2>
        <div hlmAlertDescription>{{ description }}</div>
      </hlm-alert>
    `,
  }),
};

export default meta;

type Story = StoryObj<AlertStoryArgs>;

export const Default: Story = {};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    title: 'Upload could not be completed',
    description: 'Check the file format and try again.',
  },
};

export const WithIcon: Story = {
  render: (args) => ({
    props: args,
    template: `
      <hlm-alert [variant]="variant" class="max-w-lg">
        <ng-icon name="lucideCircleCheck" />
        <h2 hlmAlertTitle>{{ title }}</h2>
        <div hlmAlertDescription>{{ description }}</div>
      </hlm-alert>
    `,
  }),
};

export const DestructiveWithIcon: Story = {
  args: {
    variant: 'destructive',
    title: 'Indexing failed',
    description: 'We could not process 3 files in this knowledge box. Remove them and upload them again.',
  },
  render: (args) => ({
    props: args,
    template: `
      <hlm-alert [variant]="variant" class="max-w-lg">
        <ng-icon name="lucideCircleAlert" />
        <h2 hlmAlertTitle>{{ title }}</h2>
        <div hlmAlertDescription>{{ description }}</div>
      </hlm-alert>
    `,
  }),
};

export const WithAction: Story = {
  args: {
    title: 'New version available',
    description: 'Reload the page to get the latest improvements to search and ask.',
  },
  render: (args) => ({
    props: args,
    template: `
      <hlm-alert [variant]="variant" class="max-w-lg">
        <button hlmAlertAction hlmBtn variant="outline" size="xs" type="button">Reload</button>
        <h2 hlmAlertTitle>{{ title }}</h2>
        <div hlmAlertDescription>{{ description }}</div>
      </hlm-alert>
    `,
  }),
};

export const TitleOnly: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    template: `
      <hlm-alert class="max-w-lg">
        <h2 hlmAlertTitle>Changes saved</h2>
      </hlm-alert>
    `,
  }),
};
