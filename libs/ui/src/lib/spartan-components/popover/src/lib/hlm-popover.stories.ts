import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideInfo } from '@ng-icons/lucide';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmButton } from '../../../button/src/index';
import { HlmInputImports } from '../../../input/src/index';
import { HlmLabelImports } from '../../../label/src/index';
import { HlmPopoverImports } from '../index';
import { HlmPopover } from './hlm-popover';

interface PopoverStoryArgs {
  align: 'start' | 'center' | 'end';
  sideOffset: number;
  offsetX: number;
  closeOnOutsidePointerEvents: boolean;
}

const meta: Meta<PopoverStoryArgs> = {
  title: 'Spartan/Popover',
  component: HlmPopover,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [HlmButton, NgIcon, ...HlmInputImports, ...HlmLabelImports, ...HlmPopoverImports],
      providers: [provideIcons({ lucideInfo })],
    }),
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `Opens a small panel anchored to a trigger for contextual information or controls. Use it for quick settings, filters, or compact forms that do not need a full dialog.
Import <code>HlmPopoverImports</code> from <code>@nuclia/ui-spartan/popover</code> and wrap a <code>button[hlmPopoverTrigger]</code> and a <code>[hlmPopoverContent]</code> element in <code>hlm-popover</code>. The content must use the <code>*hlmPopoverPortal</code> structural directive, which renders it lazily in an overlay.

Inside the content, <code>hlmPopoverHeader</code>, <code>hlmPopoverTitle</code> and <code>hlmPopoverDescription</code> provide the standard layout. <code>align</code>, <code>sideOffset</code> and <code>offsetX</code> position the panel; listen to <code>stateChanged</code> or <code>closed</code> on <code>hlm-popover</code>.
Icon-only triggers need an <code>aria-label</code>. Unlike a tooltip, a popover can hold interactive content and also works with touch.`,
      },
    },
  },
  args: {
    align: 'center',
    sideOffset: 0,
    offsetX: 0,
    closeOnOutsidePointerEvents: true,
  },
  argTypes: {
    align: {
      description: 'Alignment of the panel relative to the trigger.',
      control: 'inline-radio',
      options: ['start', 'center', 'end'],
    },
    sideOffset: {
      description: 'Distance in pixels between the trigger and the panel.',
      control: 'number',
    },
    offsetX: {
      description: 'Horizontal offset in pixels applied to the panel.',
      control: 'number',
    },
    closeOnOutsidePointerEvents: {
      description: 'Closes the popover when the user clicks outside of it.',
      control: 'boolean',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <hlm-popover
        [align]="align"
        [sideOffset]="sideOffset"
        [offsetX]="offsetX"
        [closeOnOutsidePointerEvents]="closeOnOutsidePointerEvents">
        <button type="button" hlmBtn variant="outline" hlmPopoverTrigger>Invite a teammate</button>
        <div hlmPopoverContent *hlmPopoverPortal="let context">
          <div hlmPopoverHeader>
            <h2 hlmPopoverTitle>Invite to workspace</h2>
            <p hlmPopoverDescription>Share access with a colleague.</p>
          </div>
          <div class="grid gap-2">
            <label hlmLabel for="invite-email">Email address</label>
            <input hlmInput id="invite-email" type="email" placeholder="name@example.com" />
          </div>
          <button type="button" hlmBtn>Send invitation</button>
        </div>
      </hlm-popover>
    `,
  }),
};

export default meta;
type Story = StoryObj<PopoverStoryArgs>;

export const Default: Story = {};

export const AlignStart: Story = {
  args: { align: 'start' },
};

export const AlignEnd: Story = {
  args: { align: 'end' },
};

export const CompactContent: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <hlm-popover>
        <button type="button" hlmBtn variant="ghost" size="icon" hlmPopoverTrigger aria-label="More information">
          <ng-icon name="lucideInfo" />
        </button>
        <div hlmPopoverContent class="w-56" *hlmPopoverPortal="let context">
          <div hlmPopoverHeader>
            <h2 hlmPopoverTitle>Last updated</h2>
            <p hlmPopoverDescription>This report was refreshed today at 10:30 AM.</p>
          </div>
        </div>
      </hlm-popover>
    `,
  }),
};
