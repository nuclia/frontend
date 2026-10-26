import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmAttachmentImports } from '../index';

interface AttachmentStoryArgs {
  state: 'idle' | 'uploading' | 'processing' | 'error' | 'done';
  size: 'default' | 'sm' | 'xs';
  orientation: 'horizontal' | 'vertical';
}

const meta: Meta<AttachmentStoryArgs> = {
  title: 'Spartan/Attachment',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmAttachmentImports] })],
  parameters: {
    docs: {
      description: {
        component: `Import <code>HlmAttachmentImports</code> from <code>@nuclia/ui-spartan/attachment</code>. Build an attachment from <code>hlmAttachment</code> with media, content, title, description, and optional action/group directives; a trigger can be a button or link. The state describes upload progress. Label icon-only actions and provide the trigger with meaningful accessible text.`,
      },
    },
  },
  args: { state: 'done', size: 'default', orientation: 'horizontal' },
  argTypes: {
    state: { control: 'select', options: ['idle', 'uploading', 'processing', 'error', 'done'] },
    size: { control: 'select', options: ['default', 'sm', 'xs'] },
    orientation: { control: 'select', options: ['horizontal', 'vertical'] },
  },
  render: ({ state, size, orientation }) => ({
    props: { state, size, orientation },
    template: `<div hlmAttachmentGroup class="flex flex-col items-start gap-2">
      <div hlmAttachment [state]="state" [size]="size" [orientation]="orientation">
        <span hlmAttachmentMedia aria-hidden="true">📄</span>
        <div hlmAttachmentContent>
          <div hlmAttachmentTitle>Quarterly report.pdf</div>
          <div hlmAttachmentDescription>2.4 MB · {{ state }}</div>
        </div>
        <button hlmAttachmentTrigger type="button" aria-label="Open quarterly report"></button>
        <div hlmAttachmentActions>
          <button hlmAttachmentAction aria-label="Remove quarterly report">×</button>
        </div>
      </div>
    </div>`,
  }),
};

export default meta;
type Story = StoryObj<AttachmentStoryArgs>;
export const Default: Story = {};
export const Uploading: Story = { args: { state: 'uploading' } };
export const Error: Story = { args: { state: 'error' } };
export const Compact: Story = { args: { size: 'xs' } };
export const Vertical: Story = { args: { orientation: 'vertical' } };
