import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCopy, lucideSearch } from '@ng-icons/lucide';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmInputGroupImports } from '../index';
import { HlmLabelImports } from '../../../label/src/index';
import { HlmInputGroup } from './hlm-input-group';

type InputGroupAddonAlign = 'inline-start' | 'inline-end' | 'block-start' | 'block-end';

interface InputGroupStoryArgs {
  addonAlign: InputGroupAddonAlign;
  addonText: string;
  placeholder: string;
  disabled: boolean;
}

const meta: Meta<InputGroupStoryArgs> = {
  title: 'Spartan/Input Group',
  component: HlmInputGroup,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [...HlmInputGroupImports, ...HlmLabelImports, NgIcon],
      providers: [provideIcons({ lucideCopy, lucideSearch })],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: `Combines an input with supporting text, icons, or actions inside one visual control. Use it for search fields, values with units, or entries with a related action such as copying or submitting.
Import <code>HlmInputGroupImports</code> from <code>@nuclia/ui-spartan/input-group</code>.

Wrap the parts in <code>hlmInputGroup</code>: one control (<code>input[hlmInputGroupInput]</code> or <code>textarea[hlmInputGroupTextarea]</code>) plus any number of <code>hlmInputGroupAddon</code> elements.
The addon <code>align</code> input places it at the <code>inline-start</code> (default), <code>inline-end</code>, <code>block-start</code> or <code>block-end</code> of the control. Inside an addon use <code>hlmInputGroupText</code> for text or icons and <code>button[hlmInputGroupButton]</code> for actions (<code>size</code>: <code>xs</code>, <code>sm</code>, <code>icon-xs</code>, <code>icon-sm</code>; <code>variant</code> as on the button).
Always associate a visible <code>label</code> with the control through <code>for</code>/<code>id</code>, and give icon-only buttons an <code>aria-label</code>.`,
      },
    },
  },
  args: {
    addonAlign: 'inline-start',
    addonText: 'https://',
    placeholder: 'example.com',
    disabled: false,
  },
  argTypes: {
    addonAlign: {
      description: 'Position of the addon relative to the input.',
      control: 'select',
      options: ['inline-start', 'inline-end', 'block-start', 'block-end'],
    },
    addonText: {
      description: 'Text displayed inside the addon.',
      control: 'text',
    },
    placeholder: {
      description: 'Placeholder of the input.',
      control: 'text',
    },
    disabled: {
      description: 'Disables the input; the whole group is dimmed.',
      control: 'boolean',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <div class="grid w-96 gap-2">
        <label hlmLabel for="input-group-website">Website</label>
        <div hlmInputGroup>
          <input
            hlmInputGroupInput
            id="input-group-website"
            type="url"
            [placeholder]="placeholder"
            [disabled]="disabled" />
          <div hlmInputGroupAddon [align]="addonAlign">
            <span hlmInputGroupText>{{ addonText }}</span>
          </div>
        </div>
      </div>
    `,
  }),
};

export default meta;

type Story = StoryObj<InputGroupStoryArgs>;

export const Default: Story = {};

export const InlineEnd: Story = {
  args: {
    addonAlign: 'inline-end',
    addonText: '.com',
    placeholder: 'your-company',
  },
};

export const BlockStart: Story = {
  args: {
    addonAlign: 'block-start',
    addonText: 'Public website address',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const WithIcon: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    template: `
      <div class="grid w-96 gap-2">
        <label hlmLabel for="input-group-search">Search resources</label>
        <div hlmInputGroup>
          <input hlmInputGroupInput id="input-group-search" type="search" placeholder="Title or keyword" />
          <div hlmInputGroupAddon>
            <ng-icon name="lucideSearch" />
          </div>
          <div hlmInputGroupAddon align="inline-end">
            <span hlmInputGroupText>12 results</span>
          </div>
        </div>
      </div>
    `,
  }),
};

export const WithAction: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    template: `
      <div class="grid w-96 gap-2">
        <label hlmLabel for="input-group-share">Share link</label>
        <div hlmInputGroup>
          <input
            hlmInputGroupInput
            id="input-group-share"
            readonly
            value="https://app.example.com/share/8f3a2c" />
          <div hlmInputGroupAddon align="inline-end">
            <button hlmInputGroupButton size="icon-xs" type="button" aria-label="Copy share link">
              <ng-icon name="lucideCopy" />
            </button>
          </div>
        </div>
      </div>
    `,
  }),
};

export const WithTextAction: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    template: `
      <div class="grid w-96 gap-2">
        <label hlmLabel for="input-group-keyword">Keyword</label>
        <div hlmInputGroup>
          <input hlmInputGroupInput id="input-group-keyword" type="search" placeholder="Title or keyword" />
          <div hlmInputGroupAddon align="inline-end">
            <button hlmInputGroupButton variant="secondary" type="button">Search</button>
          </div>
        </div>
      </div>
    `,
  }),
};

export const WithTextarea: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    template: `
      <div class="grid w-96 gap-2">
        <label hlmLabel for="input-group-notes">Notes</label>
        <div hlmInputGroup>
          <textarea hlmInputGroupTextarea id="input-group-notes" placeholder="Add a note for your team"></textarea>
          <div hlmInputGroupAddon align="block-end">
            <span hlmInputGroupText>Visible to workspace members</span>
          </div>
        </div>
      </div>
    `,
  }),
};
