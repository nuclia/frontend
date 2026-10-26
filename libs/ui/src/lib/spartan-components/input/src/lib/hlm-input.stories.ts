import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmInputImports } from '../index';
import { HlmLabelImports } from '../../../label/src/index';
import { HlmInput } from './hlm-input';

interface InputStoryArgs {
  type: string;
  placeholder: string;
  disabled: boolean;
}

const meta: Meta<InputStoryArgs> = {
  title: 'Spartan/Input',
  component: HlmInput,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmInputImports, ...HlmLabelImports] })],
  parameters: {
    docs: {
      description: {
        component: `Import <code>HlmInput</code> or <code>HlmInputImports</code> from <code>@nuclia/ui-spartan/input</code>, then add the <code>hlmInput</code> directive to a native input.
Use the native input type and attributes for validation and browser behavior. Associate a visible label with the input id; use <code>disabled</code> or the field integration to communicate its state accessibly.`,
      },
    },
  },
  args: { type: 'text', placeholder: 'Enter a value', disabled: false },
  argTypes: {
    type: { control: 'select', options: ['text', 'email', 'password', 'search', 'number'] },
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  render: ({ type, placeholder, disabled }) => ({
    props: { type, placeholder, disabled },
    template: `
      <div class="grid w-80 gap-2">
        <label hlmLabel for="sample-input">Workspace name</label>
        <input hlmInput id="sample-input" [type]="type" [placeholder]="placeholder" [disabled]="disabled" />
      </div>
    `,
  }),
};

export default meta;

type Story = StoryObj<InputStoryArgs>;

export const Default: Story = {};

export const Disabled: Story = { args: { disabled: true } };
