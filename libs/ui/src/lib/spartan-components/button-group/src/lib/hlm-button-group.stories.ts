import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMinus, lucidePlus, lucideSearch } from '@ng-icons/lucide';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmButtonImports } from '../../../button/src/index';
import { HlmInputImports } from '../../../input/src/index';
import { HlmButtonGroupImports } from '../index';
import { HlmButtonGroup } from './hlm-button-group';

interface ButtonGroupStoryArgs {
  orientation: 'horizontal' | 'vertical';
  variant: 'default' | 'outline' | 'secondary' | 'ghost';
  size: 'default' | 'sm' | 'lg';
}

const meta: Meta<ButtonGroupStoryArgs> = {
  title: 'Spartan/Button Group',
  component: HlmButtonGroup,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [...HlmButtonGroupImports, ...HlmButtonImports, ...HlmInputImports, NgIcon],
      providers: [provideIcons({ lucideMinus, lucidePlus, lucideSearch })],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: `Visually connects related buttons into a single group. Use it for compact sets of actions, such as editing tools or a primary action paired with additional options.
Import <code>HlmButtonGroupImports</code> from <code>@nuclia/ui-spartan/button-group</code> (and <code>HlmButtonImports</code> from <code>@nuclia/ui-spartan/button</code> for the buttons) and wrap <code>button[hlmBtn]</code> elements in <code>hlmButtonGroup</code>.
Set <code>orientation</code> to <code>vertical</code> to stack the buttons. Use <code>hlm-button-group-separator</code> to divide buttons that share the same style and <code>hlmButtonGroupText</code> for a non-interactive label.

The host has <code>role="group"</code>: give it an <code>aria-label</code> describing the set of actions, and give icon-only buttons their own <code>aria-label</code>.`,
      },
    },
  },
  args: {
    orientation: 'horizontal',
    variant: 'outline',
    size: 'default',
  },
  argTypes: {
    orientation: {
      description: 'Layout direction of the group.',
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
    },
    variant: {
      description: 'Variant of the buttons (set on each <code>hlmBtn</code>, not on the group).',
      control: 'select',
      options: ['default', 'outline', 'secondary', 'ghost'],
    },
    size: {
      description: 'Size of the buttons (set on each <code>hlmBtn</code>, not on the group).',
      control: 'inline-radio',
      options: ['default', 'sm', 'lg'],
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <div hlmButtonGroup [orientation]="orientation" aria-label="Text alignment">
        <button hlmBtn [variant]="variant" [size]="size" type="button">Align left</button>
        <button hlmBtn [variant]="variant" [size]="size" type="button">Align center</button>
        <button hlmBtn [variant]="variant" [size]="size" type="button">Align right</button>
      </div>
    `,
  }),
};

export default meta;

type Story = StoryObj<ButtonGroupStoryArgs>;

export const Default: Story = {};

export const Vertical: Story = {
  args: {
    orientation: 'vertical',
  },
  render: (args) => ({
    props: args,
    template: `
      <div hlmButtonGroup [orientation]="orientation" aria-label="Document actions">
        <button hlmBtn [variant]="variant" [size]="size" type="button">Save draft</button>
        <button hlmBtn [variant]="variant" [size]="size" type="button">Preview</button>
        <button hlmBtn [variant]="variant" [size]="size" type="button">Publish</button>
      </div>
    `,
  }),
};

export const WithSeparator: Story = {
  args: {
    variant: 'secondary',
  },
  render: (args) => ({
    props: args,
    template: `
      <div hlmButtonGroup [orientation]="orientation" aria-label="Message actions">
        <button hlmBtn [variant]="variant" [size]="size" type="button">Reply</button>
        <hlm-button-group-separator />
        <button hlmBtn [variant]="variant" [size]="size" type="button">Forward</button>
        <hlm-button-group-separator />
        <button hlmBtn [variant]="variant" [size]="size" type="button">Archive</button>
      </div>
    `,
  }),
};

export const WithGroupText: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    template: `
      <div hlmButtonGroup aria-label="Zoom controls">
        <span hlmButtonGroupText>Zoom</span>
        <button hlmBtn variant="outline" type="button" aria-label="Zoom out"><ng-icon name="lucideMinus" /></button>
        <button hlmBtn variant="outline" type="button" aria-label="Zoom in"><ng-icon name="lucidePlus" /></button>
      </div>
    `,
  }),
};

export const WithInput: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    template: `
      <div hlmButtonGroup class="w-80" aria-label="Search">
        <input hlmInput type="search" placeholder="Search resources" aria-label="Search resources" />
        <button hlmBtn variant="outline" type="button" aria-label="Search"><ng-icon name="lucideSearch" /></button>
      </div>
    `,
  }),
};
