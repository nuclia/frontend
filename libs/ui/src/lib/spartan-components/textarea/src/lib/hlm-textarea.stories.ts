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
        component: `A multi-line field for entering longer text. Use it for messages, descriptions, comments, or other responses that need more room than a single-line input.`,
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
