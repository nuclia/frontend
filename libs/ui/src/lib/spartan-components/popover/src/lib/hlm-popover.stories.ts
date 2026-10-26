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
        component: `Import <code>HlmPopoverImports</code> or the popover, trigger, portal, content, header, title, and description primitives from <code>@nuclia/ui-spartan/popover</code>. Keep the trigger and portal content under the same root and provide a title when the panel contains a distinct task or set of information. The trigger exposes expanded state and the underlying primitive manages focus and keyboard dismissal; use a named button trigger.`,
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
