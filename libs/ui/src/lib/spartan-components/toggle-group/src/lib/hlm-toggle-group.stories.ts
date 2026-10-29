import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmToggleGroupImports } from '../index';
import { HlmToggleGroup } from './hlm-toggle-group';

interface ToggleGroupStoryArgs {
  type: 'single' | 'multiple';
  orientation: 'horizontal' | 'vertical';
  variant: 'default' | 'outline';
}

const meta: Meta<ToggleGroupStoryArgs> = {
  title: 'Spartan/Toggle Group',
  component: HlmToggleGroup,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmToggleGroupImports] })],
  parameters: {
    docs: {
      description: {
        component: `Groups related toggle buttons with either one or multiple active choices. Use it for compact option sets such as text alignment, formatting tools, or view modes where the active state should stay visible.`,
      },
    },
  },
  args: { type: 'single', orientation: 'horizontal', variant: 'outline' },
  argTypes: {
    type: { control: 'select', options: ['single', 'multiple'] },
    orientation: { control: 'select', options: ['horizontal', 'vertical'] },
    variant: { control: 'select', options: ['default', 'outline'] },
  },
  render: ({ type, orientation, variant }) => ({
    props: { type, orientation, variant },
    template: `
      <div hlmToggleGroup aria-label="Text alignment" [type]="type" [orientation]="orientation" [variant]="variant">
        <button hlmToggleGroupItem value="left" type="button">Left</button>
        <button hlmToggleGroupItem value="center" type="button">Center</button>
        <button hlmToggleGroupItem value="right" type="button">Right</button>
      </div>
    `,
  }),
};

export default meta;

type Story = StoryObj<ToggleGroupStoryArgs>;

export const Default: Story = {};

export const MultipleSelection: Story = { args: { type: 'multiple' } };

export const Vertical: Story = { args: { orientation: 'vertical' } };
