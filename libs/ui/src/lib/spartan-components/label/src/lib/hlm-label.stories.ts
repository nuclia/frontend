import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmCheckboxImports } from '../../../checkbox/src/index';
import { HlmInputImports } from '../../../input/src/index';
import { HlmLabelImports } from '../index';
import { HlmLabel } from './hlm-label';

interface LabelStoryArgs {
  text: string;
  controlId: string;
}

const meta: Meta<LabelStoryArgs> = {
  title: 'Spartan/Label',
  component: HlmLabel,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [...HlmLabelImports, ...HlmInputImports, ...HlmCheckboxImports],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: `Render an accessible label for a form control.
Import <code>HlmLabelImports</code> from <code>@nuclia/ui-spartan/label</code> and apply <code>hlmLabel</code> to a native <code>&lt;label&gt;</code>.

Associate the label with a control by setting <code>for</code> to the control's <code>id</code> (use <code>inputId</code> on <code>hlm-checkbox</code>).`,
      },
    },
  },
  args: {
    text: 'Email',
    controlId: 'storybook-label-email',
  },
  argTypes: {
    text: {
      description: 'Label text.',
      control: 'text',
    },
    controlId: {
      description: 'Id of the form control the label is associated with.',
      control: 'text',
    },
  },
  render: (args) => ({
    props: args,
    template: `
            <div class="flex w-72 flex-col gap-2">
                <label hlmLabel [for]="controlId">{{ text }}</label>
                <input hlmInput [id]="controlId" type="email" placeholder="name@example.com" />
            </div>
        `,
  }),
};

export default meta;

type Story = StoryObj<LabelStoryArgs>;

export const Default: Story = {};

export const WithCheckbox: Story = {
  parameters: {
    controls: {
      disable: true,
    },
  },
  render: () => ({
    template: `
            <div class="flex items-center gap-2">
                <hlm-checkbox inputId="storybook-label-terms" />
                <label hlmLabel for="storybook-label-terms">Accept terms and conditions</label>
            </div>
        `,
  }),
};
