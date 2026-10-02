import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmButton } from './hlm-button';

type ButtonVariant = 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link';
type ButtonSize = 'default' | 'xs' | 'sm' | 'lg' | 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg';

interface ButtonStoryArgs {
  variant: ButtonVariant;
  size: ButtonSize;
  disabled: boolean;
  label: string;
}

const meta: Meta<ButtonStoryArgs> = {
  title: 'Spartan/Button',
  component: HlmButton,
  decorators: [
    moduleMetadata({
      imports: [HlmButton],
    }),
  ],
  args: {
    variant: 'default',
    size: 'default',
    disabled: false,
    label: 'Button',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'xs', 'sm', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'],
    },
    disabled: {
      control: 'boolean',
    },
    label: {
      control: 'text',
    },
  },
  render: ({ variant, size, disabled, label }) => ({
    props: { variant, size, disabled, label },
    template: `
            <button
                hlmBtn
                type="button"
                [variant]="variant"
                [size]="size"
                [disabled]="disabled"
            >
                {{ label }}
            </button>
        `,
  }),
};

export default meta;

type Story = StoryObj<ButtonStoryArgs>;

export const Default: Story = {};

export const Variants: Story = {
  parameters: {
    controls: {
      disable: true,
    },
  },
  render: ({ label }) => ({
    props: { label },
    template: `
            <div class="flex flex-wrap items-center gap-3">
                <button hlmBtn type="button" variant="default">{{ label }}</button>
                <button hlmBtn type="button" variant="outline">Outline</button>
                <button hlmBtn type="button" variant="secondary">Secondary</button>
                <button hlmBtn type="button" variant="ghost">Ghost</button>
                <button hlmBtn type="button" variant="destructive">Destructive</button>
                <button hlmBtn type="button" variant="link">Link</button>
            </div>
        `,
  }),
};

export const Sizes: Story = {
  parameters: {
    controls: {
      disable: true,
    },
  },
  render: () => ({
    template: `
            <div class="flex flex-wrap items-center gap-3">
                <button hlmBtn type="button" size="xs">Extra small</button>
                <button hlmBtn type="button" size="sm">Small</button>
                <button hlmBtn type="button" size="default">Default</button>
                <button hlmBtn type="button" size="lg">Large</button>
            </div>
        `,
  }),
};

export const IconSizes: Story = {
  parameters: {
    controls: {
      disable: true,
    },
  },
  render: () => ({
    template: `
            <div class="flex items-center gap-3">
                <button hlmBtn type="button" size="icon-xs" aria-label="Add item">
                    <span aria-hidden="true">+</span>
                </button>

                <button hlmBtn type="button" size="icon-sm" aria-label="Add item">
                    <span aria-hidden="true">+</span>
                </button>

                <button hlmBtn type="button" size="icon" aria-label="Add item">
                    <span aria-hidden="true">+</span>
                </button>

                <button hlmBtn type="button" size="icon-lg" aria-label="Add item">
                    <span aria-hidden="true">+</span>
                </button>
            </div>
        `,
  }),
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const AsLink: Story = {
  parameters: {
    controls: {
      disable: true,
    },
  },
  render: () => ({
    template: `
            <a hlmBtn href="#" variant="link">Learn more</a>
        `,
  }),
};
