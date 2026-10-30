import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideInfo } from '@ng-icons/lucide';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmButton } from '../../../button/src/index';
import { HlmTooltipImports } from '../index';
import { HlmTooltip } from './hlm-tooltip';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface TooltipStoryArgs {
  text: string;
  position: TooltipPosition;
  showDelay: number;
  hideDelay: number;
  tooltipDisabled: boolean;
}

const meta: Meta<TooltipStoryArgs> = {
  title: 'Spartan/Tooltip',
  component: HlmTooltip,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [...HlmTooltipImports, HlmButton, NgIcon],
      providers: [provideIcons({ lucideInfo })],
    }),
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `Show short, non-interactive help when an element is hovered or focused.
Import <code>HlmTooltipImports</code> from <code>@nuclia/ui-spartan/tooltip</code> and set the text on the host element with <code>hlmTooltip="..."</code>.

The tooltip opens on mouse hover and keyboard focus, never on a touch tap. Use a popover if touch users must be able to read the content.
Give icon-only triggers an <code>aria-label</code>. Content wider than 36rem wraps onto several lines.`,
      },
    },
  },
  args: {
    text: 'A user can belong to several segments if they are linked to several accounts.',
    position: 'top',
    showDelay: 150,
    hideDelay: 0,
    tooltipDisabled: false,
  },
  argTypes: {
    text: {
      description: 'Tooltip content, set through the <code>hlmTooltip</code> input.',
      control: 'text',
    },
    position: {
      description: 'Side of the host element where the tooltip is shown.',
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
    },
    showDelay: {
      description: 'Delay in milliseconds before the tooltip opens.',
      control: 'number',
    },
    hideDelay: {
      description: 'Delay in milliseconds before the tooltip closes.',
      control: 'number',
    },
    tooltipDisabled: {
      description: 'Prevents the tooltip from opening.',
      control: 'boolean',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <button
        hlmBtn
        type="button"
        variant="outline"
        [hlmTooltip]="text"
        [position]="position"
        [showDelay]="showDelay"
        [hideDelay]="hideDelay"
        [tooltipDisabled]="tooltipDisabled">
        Hover or focus me
      </button>
    `,
  }),
};

export default meta;

type Story = StoryObj<TooltipStoryArgs>;

export const Default: Story = {};

export const Positions: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    template: `
      <div class="flex gap-4 p-16">
        <button hlmBtn type="button" variant="outline" hlmTooltip="Top" position="top">Top</button>
        <button hlmBtn type="button" variant="outline" hlmTooltip="Bottom" position="bottom">Bottom</button>
        <button hlmBtn type="button" variant="outline" hlmTooltip="Left" position="left">Left</button>
        <button hlmBtn type="button" variant="outline" hlmTooltip="Right" position="right">Right</button>
      </div>
    `,
  }),
};

export const InfoIcon: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    template: `
      <div class="flex items-center gap-1 p-16 text-sm font-medium">
        Account role
        <button
          hlmBtn
          type="button"
          variant="ghost"
          size="icon-xs"
          class="text-muted-foreground size-5"
          aria-label="More information"
          position="right"
          hlmTooltip="A user can belong to several segments if they are linked to several accounts. Use account owners to reduce overlaps.">
          <ng-icon name="lucideInfo" />
        </button>
      </div>
    `,
  }),
};

export const Disabled: Story = {
  args: {
    tooltipDisabled: true,
  },
};
