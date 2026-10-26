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
        component: `Import <code>HlmToggleGroupImports</code> or its components from <code>@nuclia/ui-spartan/toggle-group</code>. Compose <code>hlm-toggle-group</code> with native buttons carrying <code>hlmToggleGroupItem</code>.
Set the group to <code>single</code> or <code>multiple</code>, provide a group label, and give every item a value and visible accessible name. The group supports keyboard navigation and announces pressed state.`,
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
