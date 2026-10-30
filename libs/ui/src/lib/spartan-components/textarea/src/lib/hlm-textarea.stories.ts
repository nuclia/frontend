import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmLabelImports } from '../../../label/src/index';
import { HlmTextareaImports } from '../index';
import { HlmTextarea } from './hlm-textarea';

interface TextareaStoryArgs {
  placeholder: string;
  disabled: boolean;
  forceInvalid: boolean;
}

const meta: Meta<TextareaStoryArgs> = {
  title: 'Spartan/Textarea',
  component: HlmTextarea,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [...HlmTextareaImports, ...HlmLabelImports],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: `Style a native multi-line text field with consistent borders, focus ring, and invalid state.
Import <code>HlmTextareaImports</code> from <code>@nuclia/ui-spartan/textarea</code> and apply <code>hlmTextarea</code> to a native <code>&lt;textarea&gt;</code>.

Native attributes such as <code>placeholder</code>, <code>rows</code>, and <code>disabled</code> work as usual.
Set <code>forceInvalid</code> to show the invalid style, and pair the textarea with <code>hlmLabel</code> through matching <code>id</code> and <code>for</code> values.`,
      },
    },
  },
  args: {
    placeholder: 'Type your message here...',
    disabled: false,
    forceInvalid: false,
  },
  argTypes: {
    placeholder: {
      description: 'Placeholder text displayed while the textarea is empty.',
      control: 'text',
    },
    disabled: {
      description: 'Disables the textarea.',
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
            <textarea
                hlmTextarea
                class="w-80"
                [placeholder]="placeholder"
                [disabled]="disabled"
                [forceInvalid]="forceInvalid"
            ></textarea>
        `,
  }),
};

export default meta;

type Story = StoryObj<TextareaStoryArgs>;

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

export const WithLabel: Story = {
  parameters: {
    controls: {
      disable: true,
    },
  },
  render: () => ({
    template: `
            <div class="flex w-80 flex-col gap-2">
                <label hlmLabel for="storybook-textarea-message">Your message</label>
                <textarea hlmTextarea id="storybook-textarea-message" placeholder="Type your message here..."></textarea>
            </div>
        `,
  }),
};
