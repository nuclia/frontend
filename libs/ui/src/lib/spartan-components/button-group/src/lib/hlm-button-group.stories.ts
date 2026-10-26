import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmButtonImports } from '../../../button/src/index';
import { HlmButtonGroupImports } from '../index';
import { HlmButtonGroup } from './hlm-button-group';

const meta: Meta = {
  title: 'Spartan/Button Group',
  component: HlmButtonGroup,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmButtonGroupImports, ...HlmButtonImports] })],
  parameters: {
    docs: {
      description: {
        component: `Import <code>HlmButtonGroupImports</code> or its components from <code>@nuclia/ui-spartan/button-group</code>; use <code>HlmButtonImports</code> from <code>@nuclia/ui-spartan/button</code> for the grouped actions.
Compose buttons inside <code>hlm-button-group</code>, optionally adding <code>hlm-button-group-separator</code> or <code>hlm-button-group-text</code>. The group exposes its orientation and <code>role="group"</code>; give each action a clear accessible name.`,
      },
    },
  },
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `
      <div hlmButtonGroup aria-label="Text alignment">
        <button hlmBtn variant="outline" type="button">Align left</button>
        <hlm-button-group-separator />
        <button hlmBtn variant="outline" type="button">Align center</button>
        <button hlmBtn variant="outline" type="button">Align right</button>
      </div>
    `,
  }),
};

export const Vertical: Story = {
  render: () => ({
    template: `
      <div hlmButtonGroup orientation="vertical" aria-label="Document actions">
        <button hlmBtn variant="outline" type="button">Save draft</button>
        <button hlmBtn variant="outline" type="button">Preview</button>
        <button hlmBtn variant="outline" type="button">Publish</button>
      </div>
    `,
  }),
};

export const WithGroupText: Story = {
  render: () => ({
    template: `
      <div hlmButtonGroup aria-label="Editor controls">
        <span hlmButtonGroupText>Zoom</span>
        <button hlmBtn variant="outline" type="button" aria-label="Zoom out">−</button>
        <button hlmBtn variant="outline" type="button" aria-label="Zoom in">+</button>
      </div>
    `,
  }),
};
