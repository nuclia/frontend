import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmSeparatorImports } from '../index';
import { HlmSeparator } from './hlm-separator';

interface SeparatorStoryArgs {
  orientation: 'horizontal' | 'vertical';
  decorative: boolean;
}

const meta: Meta<SeparatorStoryArgs> = {
  title: 'Spartan/Separator',
  component: HlmSeparator,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmSeparatorImports] })],
  parameters: {
    docs: {
      description: {
        component: `A horizontal or vertical divider that separates groups of content. Use it to clarify structure without adding another container.
Import <code>HlmSeparatorImports</code> from <code>@nuclia/ui-spartan/separator</code> and apply <code>hlmSeparator</code> to an element (or use <code>&lt;hlm-separator&gt;</code>).

Set <code>orientation</code> to <code>horizontal</code> (default) or <code>vertical</code>. A vertical separator stretches to the height of its flex parent, so give the parent a height.
By default the separator is exposed to assistive technology with <code>role="separator"</code>; set <code>decorative</code> when it is purely visual so it is hidden from them (<code>role="none"</code>).`,
      },
    },
  },
  args: {
    orientation: 'horizontal',
    decorative: false,
  },
  argTypes: {
    orientation: {
      description: 'Direction of the separator line.',
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
    },
    decorative: {
      description: 'When true the separator is purely visual and is hidden from assistive technology.',
      control: 'boolean',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <div [class]="orientation === 'vertical' ? 'flex h-6 items-center gap-4 text-sm' : 'max-w-md space-y-4 text-sm'">
        <span>Profile details</span>
        <hlm-separator [orientation]="orientation" [decorative]="decorative" />
        <span>Notification preferences</span>
      </div>
    `,
  }),
};

export default meta;

type Story = StoryObj<SeparatorStoryArgs>;

export const Default: Story = {};

export const Vertical: Story = {
  args: {
    orientation: 'vertical',
  },
};

export const Decorative: Story = {
  args: {
    decorative: true,
  },
};

export const InNavigation: Story = {
  parameters: {
    controls: {
      disable: true,
    },
  },
  render: () => ({
    template: `
      <div class="max-w-md">
        <div class="space-y-1">
          <h4 class="text-sm leading-none font-medium">Knowledge box</h4>
          <p class="text-muted-foreground text-sm">Manage resources, labels and synonyms.</p>
        </div>
        <div hlmSeparator class="my-4"></div>
        <div class="flex h-5 items-center gap-4 text-sm">
          <span>Resources</span>
          <div hlmSeparator orientation="vertical" [decorative]="true"></div>
          <span>Labels</span>
          <div hlmSeparator orientation="vertical" [decorative]="true"></div>
          <span>Synonyms</span>
        </div>
      </div>
    `,
  }),
};
