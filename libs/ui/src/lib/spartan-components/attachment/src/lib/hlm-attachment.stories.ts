import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideFileText, lucideX } from '@ng-icons/lucide';
import { HlmAttachmentImports } from '../index';
import { HlmAttachment, type AttachmentState } from './hlm-attachment';

interface AttachmentStoryArgs {
  state: AttachmentState;
  size: 'default' | 'sm' | 'xs';
  orientation: 'horizontal' | 'vertical';
  title: string;
  description: string;
}

const meta: Meta<AttachmentStoryArgs> = {
  title: 'Spartan/Attachment',
  component: HlmAttachment,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [...HlmAttachmentImports, NgIcon],
      providers: [provideIcons({ lucideFileText, lucideX })],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: `Represents an attached file or image with a preview, file details, upload status, and related actions. Use it to help users recognize and manage files in messages or upload flows.
Import <code>HlmAttachmentImports</code> from <code>@nuclia/ui-spartan/attachment</code> and compose <code>hlm-attachment</code> with <code>hlmAttachmentMedia</code> (icon or image preview), <code>hlmAttachmentContent</code> (<code>hlmAttachmentTitle</code> and <code>hlmAttachmentDescription</code>), and <code>hlmAttachmentActions</code> containing <code>button[hlmAttachmentAction]</code> buttons.

Set <code>state</code>, <code>size</code> and <code>orientation</code> on the attachment. Add <code>hlmAttachmentTrigger</code> (a <code>button</code> or <code>a</code>) to make the whole card clickable, and wrap several attachments in <code>hlmAttachmentGroup</code> for a horizontally scrollable list.
Icon-only triggers and actions need an <code>aria-label</code>.`,
      },
    },
  },
  args: {
    state: 'done',
    size: 'default',
    orientation: 'horizontal',
    title: 'Quarterly report.pdf',
    description: '2.4 MB',
  },
  argTypes: {
    state: {
      description: 'Upload lifecycle state. It drives the border, media and text styling.',
      control: 'select',
      options: ['idle', 'uploading', 'processing', 'error', 'done'],
    },
    size: {
      description: 'Size of the attachment.',
      control: 'inline-radio',
      options: ['default', 'sm', 'xs'],
    },
    orientation: {
      description: 'Layout of the media and content: side by side or stacked.',
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
    },
    title: {
      description: 'File name shown in <code>hlmAttachmentTitle</code>.',
      control: 'text',
    },
    description: {
      description: 'Secondary text such as the file size or status, shown in <code>hlmAttachmentDescription</code>.',
      control: 'text',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <div
        hlmAttachment
        [state]="state"
        [size]="size"
        [orientation]="orientation">
        <span hlmAttachmentMedia aria-hidden="true"><ng-icon name="lucideFileText" /></span>
        <div hlmAttachmentContent>
          <div hlmAttachmentTitle>{{ title }}</div>
          <div hlmAttachmentDescription>{{ description }}</div>
        </div>
        <button hlmAttachmentTrigger type="button" [attr.aria-label]="'Open ' + title"></button>
        <div hlmAttachmentActions>
          <button hlmAttachmentAction type="button" [attr.aria-label]="'Remove ' + title">
            <ng-icon name="lucideX" />
          </button>
        </div>
      </div>
    `,
  }),
};

export default meta;

type Story = StoryObj<AttachmentStoryArgs>;

export const Default: Story = {};

export const Idle: Story = {
  args: { state: 'idle', description: 'Waiting to upload' },
};

export const Uploading: Story = {
  args: { state: 'uploading', description: 'Uploading… 45%' },
};

export const Processing: Story = {
  args: { state: 'processing', description: 'Extracting text…' },
};

export const Error: Story = {
  args: { state: 'error', description: 'Upload failed. Unsupported file format.' },
};

export const Small: Story = {
  args: { size: 'sm' },
};

export const ExtraSmall: Story = {
  args: { size: 'xs' },
};

export const Vertical: Story = {
  args: { orientation: 'vertical', title: 'Report.pdf' },
};

export const Group: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    template: `
      <div hlmAttachmentGroup class="max-w-md">
        <div hlmAttachment>
          <span hlmAttachmentMedia aria-hidden="true"><ng-icon name="lucideFileText" /></span>
          <div hlmAttachmentContent>
            <div hlmAttachmentTitle>Quarterly report.pdf</div>
            <div hlmAttachmentDescription>2.4 MB</div>
          </div>
        </div>
        <div hlmAttachment state="uploading">
          <span hlmAttachmentMedia aria-hidden="true"><ng-icon name="lucideFileText" /></span>
          <div hlmAttachmentContent>
            <div hlmAttachmentTitle>Meeting notes.docx</div>
            <div hlmAttachmentDescription>Uploading…</div>
          </div>
        </div>
        <div hlmAttachment state="error">
          <span hlmAttachmentMedia aria-hidden="true"><ng-icon name="lucideFileText" /></span>
          <div hlmAttachmentContent>
            <div hlmAttachmentTitle>Archive.zip</div>
            <div hlmAttachmentDescription>Unsupported format</div>
          </div>
        </div>
      </div>
    `,
  }),
};
