import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmToggleGroupImports } from '../index';
import { HlmToggleGroup } from './hlm-toggle-group';

interface ToggleGroupStoryArgs {
  type: 'single' | 'multiple';
  variant: 'default' | 'outline';
  size: 'default' | 'sm' | 'lg';
  spacing: number;
  orientation: 'horizontal' | 'vertical';
  nullable: boolean;
  disabled: boolean;
}

const meta: Meta<ToggleGroupStoryArgs> = {
  title: 'Spartan/Toggle Group',
  component: HlmToggleGroup,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [...HlmToggleGroupImports],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: `A set of two-state buttons that can be toggled on or off.
Import <code>HlmToggleGroupImports</code> from <code>@nuclia/ui-spartan/toggle-group</code> and compose <code>hlm-toggle-group</code> with <code>button[hlmToggleGroupItem]</code> children, each with a unique <code>value</code>.

Use <code>type="single"</code> to allow one pressed item or <code>type="multiple"</code> for several. Listen to <code>valueChange</code> for updates.
Variant, size, spacing, and orientation are set on the group and apply to every item. Icon-only items should include an <code>aria-label</code>.`,
      },
    },
  },
  args: {
    type: 'single',
    variant: 'default',
    size: 'default',
    spacing: 0,
    orientation: 'horizontal',
    nullable: false,
    disabled: false,
  },
  argTypes: {
    type: {
      description: 'Whether one or several items can be pressed at a time.',
      control: 'select',
      options: ['single', 'multiple'],
    },
    variant: {
      description: 'Visual style applied to all items.',
      control: 'select',
      options: ['default', 'outline'],
    },
    size: {
      description: 'Size applied to all items.',
      control: 'select',
      options: ['default', 'sm', 'lg'],
    },
    spacing: {
      description: 'Gap between items, in spacing units. Use 0 for items joined together.',
      control: 'number',
    },
    orientation: {
      description: 'Layout direction of the group.',
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
    nullable: {
      description: 'Whether the single-selection group allows having no pressed item.',
      control: 'boolean',
    },
    disabled: {
      description: 'Disables the whole group.',
      control: 'boolean',
    },
  },
  render: (args) => ({
    props: args,
    template: `
            <hlm-toggle-group
                [type]="type"
                [variant]="variant"
                [size]="size"
                [spacing]="spacing"
                [orientation]="orientation"
                [nullable]="nullable"
                [disabled]="disabled"
            >
                <button hlmToggleGroupItem type="button" value="bold" aria-label="Toggle bold">Bold</button>
                <button hlmToggleGroupItem type="button" value="italic" aria-label="Toggle italic">Italic</button>
                <button hlmToggleGroupItem type="button" value="underline" aria-label="Toggle underline">
                    Underline
                </button>
            </hlm-toggle-group>
        `,
  }),
};

export default meta;

type Story = StoryObj<ToggleGroupStoryArgs>;

export const Single: Story = {};

export const Multiple: Story = {
  args: {
    type: 'multiple',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
  },
};

export const Spacing: Story = {
  args: {
    variant: 'outline',
    spacing: 2,
  },
};

export const Vertical: Story = {
  args: {
    variant: 'outline',
    orientation: 'vertical',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const DisabledItem: Story = {
  parameters: {
    controls: {
      disable: true,
    },
  },
  render: () => ({
    template: `
            <hlm-toggle-group type="multiple" variant="outline">
                <button hlmToggleGroupItem type="button" value="bold">Bold</button>
                <button hlmToggleGroupItem type="button" value="italic" [disabled]="true">Italic</button>
                <button hlmToggleGroupItem type="button" value="underline">Underline</button>
            </hlm-toggle-group>
        `,
  }),
};
