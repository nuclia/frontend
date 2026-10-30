import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmLabelImports } from '../../../label/src/index';
import { HlmInputImports } from '../index';
import { HlmInput } from './hlm-input';

interface InputStoryArgs {
  type: 'text' | 'email' | 'password' | 'number' | 'file';
  placeholder: string;
  disabled: boolean;
  forceInvalid: boolean;
}

const meta: Meta<InputStoryArgs> = {
  title: 'Spartan/Input',
  component: HlmInput,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [...HlmInputImports, ...HlmLabelImports],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: `Style a native text field with consistent borders, focus ring, and invalid state.
Import <code>HlmInputImports</code> from <code>@nuclia/ui-spartan/input</code> and apply <code>hlmInput</code> to a native <code>&lt;input&gt;</code>.

Native attributes such as <code>type</code>, <code>placeholder</code>, and <code>disabled</code> work as usual.
Set <code>forceInvalid</code> to show the invalid style, and pair the input with <code>hlmLabel</code> through matching <code>id</code> and <code>for</code> values.`,
      },
    },
  },
  args: {
    type: 'text',
    placeholder: 'Type something...',
    disabled: false,
    forceInvalid: false,
  },
  argTypes: {
    type: {
      description: 'Native input type.',
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'file'],
    },
    placeholder: {
      description: 'Placeholder text displayed while the input is empty.',
      control: 'text',
    },
    disabled: {
      description: 'Disables the input.',
      control: 'boolean',
    },
    forceInvalid: {
      description: 'Forces the invalid style regardless of form validation state.',
      control: 'boolean',
    },
  },
  render: (args) => ({
    props: args,
    template: `
            <input
                hlmInput
                class="w-72"
                [type]="type"
                [placeholder]="placeholder"
                [disabled]="disabled"
                [forceInvalid]="forceInvalid"
            />
        `,
  }),
};

export default meta;

type Story = StoryObj<InputStoryArgs>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Invalid: Story = {
  args: {
    forceInvalid: true,
  },
};

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Password',
  },
};

export const FileUpload: Story = {
  args: {
    type: 'file',
  },
};

export const WithLabel: Story = {
  parameters: {
    controls: {
      disable: true,
    },
  },
  render: () => ({
    template: `
            <div class="flex w-72 flex-col gap-2">
                <label hlmLabel for="storybook-input-email">Email</label>
                <input hlmInput id="storybook-input-email" type="email" placeholder="name@example.com" />
            </div>
        `,
  }),
};
