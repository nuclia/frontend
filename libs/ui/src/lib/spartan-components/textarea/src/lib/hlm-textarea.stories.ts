import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmLabelImports } from '../../../label/src/index';
import { HlmTextareaImports } from '../index';
import { HlmTextarea } from './hlm-textarea';

interface TextareaStoryArgs {
  placeholder: string;
  disabled: boolean;
}

const meta: Meta<TextareaStoryArgs> = {
  title: 'Spartan/Textarea',
  component: HlmTextarea,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmTextareaImports, ...HlmLabelImports] })],
  parameters: {
    docs: {
      description: {
        component: `Import <code>HlmTextarea</code> or <code>HlmTextareaImports</code> from <code>@nuclia/ui-spartan/textarea</code>, then apply <code>hlmTextarea</code> to a native textarea.
Associate a visible label with the textarea id and use native attributes such as <code>rows</code>, <code>required</code>, and <code>disabled</code> for form behavior.`,
      },
    },
  },
  args: { placeholder: 'Share context with your team', disabled: false },
  argTypes: {
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  render: ({ placeholder, disabled }) => ({
    props: { placeholder, disabled },
    template: `
      <div class="grid w-96 gap-2">
        <label hlmLabel for="project-summary">Project summary</label>
        <textarea hlmTextarea id="project-summary" rows="4" [placeholder]="placeholder" [disabled]="disabled"></textarea>
      </div>
    `,
  }),
};

export default meta;

type Story = StoryObj<TextareaStoryArgs>;

export const Default: Story = {};

export const Disabled: Story = { args: { disabled: true } };
