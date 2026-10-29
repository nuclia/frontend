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
        component: `Visually connects related buttons into a single group. Use it for compact sets of actions, such as editing tools or a primary action paired with additional options.`,
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
