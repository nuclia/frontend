import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmButtonImports } from '../../../button/src/index';
import { HlmInputGroupImports } from '../index';
import { HlmLabelImports } from '../../../label/src/index';
import { HlmInputGroup } from './hlm-input-group';

const meta: Meta = {
  title: 'Spartan/Input Group',
  component: HlmInputGroup,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmInputGroupImports, ...HlmButtonImports, ...HlmLabelImports] })],
  parameters: {
    docs: {
      description: {
        component: `Import <code>HlmInputGroupImports</code> or its individual components from <code>@nuclia/ui-spartan/input-group</code>. Compose the group with its input, textarea, addon, text, and button parts; grouped buttons can use <code>HlmButtonImports</code> from <code>@nuclia/ui-spartan/button</code>.
Give the input its own visible label and give icon-only buttons accessible names. Addons are supporting content and should not replace the input's label.`,
      },
    },
  },
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `
      <div class="grid w-96 gap-2">
        <label hlmLabel for="website">Website</label>
        <div hlmInputGroup>
          <span hlmInputGroupAddon><span hlmInputGroupText>https://</span></span>
          <input hlmInputGroupInput id="website" type="url" placeholder="example.com" />
          <span hlmInputGroupAddon align="inline-end"><span hlmInputGroupText>↗</span></span>
        </div>
      </div>
    `,
  }),
};

export const WithAction: Story = {
  render: () => ({
    template: `
      <div class="grid w-96 gap-2">
        <label hlmLabel for="search-resources">Search resources</label>
        <div hlmInputGroup>
          <input hlmInputGroupInput id="search-resources" type="search" placeholder="Title or keyword" />
          <span hlmInputGroupAddon align="inline-end">
            <button hlmInputGroupButton hlmBtn variant="secondary" type="button">Search</button>
          </span>
        </div>
      </div>
    `,
  }),
};

export const WithTextarea: Story = {
  render: () => ({
    template: `
      <div class="grid w-96 gap-2">
        <label hlmLabel for="notes">Notes</label>
        <div hlmInputGroup>
          <textarea hlmInputGroupTextarea id="notes" placeholder="Add a note for your team"></textarea>
          <span hlmInputGroupAddon align="block-end"><span hlmInputGroupText>Visible to workspace members</span></span>
        </div>
      </div>
    `,
  }),
};
