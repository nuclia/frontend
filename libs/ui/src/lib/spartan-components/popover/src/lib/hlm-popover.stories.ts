import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmButton } from '../../../button/src/index';
import { HlmPopoverImports } from '../index';
import { HlmPopover } from './hlm-popover';

const meta: Meta = {
  title: 'Spartan/Popover',
  component: HlmPopover,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HlmButton, ...HlmPopoverImports] })],
  parameters: {
    docs: {
      description: {
        component: `Opens a small panel anchored to a trigger for contextual information or controls. Use it for quick settings, filters, or compact forms that do not need a full dialog.`,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `
      <hlm-popover>
        <button type="button" hlmBtn hlmPopoverTrigger>Invite a teammate</button>
        <div hlmPopoverContent *hlmPopoverPortal="let context">
          <div hlmPopoverHeader>
            <h2 hlmPopoverTitle>Invite to workspace</h2>
            <p hlmPopoverDescription>Share access with a colleague.</p>
          </div>
          <label class="grid gap-2 text-sm">
            Email address
            <input class="rounded-md border px-3 py-2" type="email" placeholder="name@example.com" />
          </label>
          <button type="button" hlmBtn>Send invitation</button>
        </div>
      </hlm-popover>
    `,
  }),
};

export const CompactContent: Story = {
  render: () => ({
    template: `
      <hlm-popover>
        <button type="button" hlmBtn variant="outline" hlmPopoverTrigger aria-label="More information">ⓘ More information</button>
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
