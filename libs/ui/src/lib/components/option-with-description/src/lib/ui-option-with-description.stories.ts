import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { UiOptionWithDescriptionImports } from '../index';
import { UiOptionWithDescription } from './ui-option-with-description';

interface OptionWithDescriptionStoryArgs {
  label: string;
  description: string;
}

const meta: Meta<OptionWithDescriptionStoryArgs> = {
  title: 'PDP-UI/Option with description',
  component: UiOptionWithDescription,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...UiOptionWithDescriptionImports] })],
  parameters: {
    docs: {
      description: {
        component: `Title and description for options that need two lines, for example inside <code>hlm-select-item</code>.
Import <code>UiOptionWithDescriptionImports</code> from <code>@nuclia/ui/option-with-description</code>.

Both lines are cut with an ellipsis when they do not fit and the full text is shown in a tooltip on hover.`,
      },
    },
  },
  args: {
    label: 'new-billing-formula',
    description: 'From predict all, generative models usage operations, except the retrieval_rephrase and more text.',
  },
  argTypes: {
    label: { description: 'First line.', control: 'text' },
    description: { description: 'Second, muted line. Optional.', control: 'text' },
  },
  render: (args) => ({
    props: args,
    template: `<div class="w-64 rounded-md border px-2"><ui-option-with-description [label]="label" [description]="description" /></div>`,
  }),
};

export default meta;
type Story = StoryObj<OptionWithDescriptionStoryArgs>;

export const Default: Story = {};

export const WithoutDescription: Story = {
  args: { description: '' },
};
