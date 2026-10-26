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
        component: `A single-line field for entering text or other short values. Use it for form details, search terms, or numeric entries, with a label that makes the expected value clear.`,
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
