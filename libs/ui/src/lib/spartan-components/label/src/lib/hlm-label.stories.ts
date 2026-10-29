import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmInputImports } from '../../../input/src/index';
import { HlmLabelImports } from '../index';
import { HlmLabel } from './hlm-label';

const meta: Meta = {
  title: 'Spartan/Label',
  component: HlmLabel,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmLabelImports, ...HlmInputImports] })],
  parameters: {
    docs: {
      description: {
        component: `Identifies a form control and tells users what information or choice is expected. Use a clear, visible label to make each field understandable and easy to locate.`,
      },
    },
  },
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `
      <div class="grid w-80 gap-2">
        <label hlmLabel for="account-email">Email address</label>
        <input hlmInput id="account-email" type="email" placeholder="name@example.com" />
      </div>
    `,
  }),
};

export const Required: Story = {
  render: () => ({
    template: `
      <div class="grid w-80 gap-2">
        <label hlmLabel for="account-name">Account name <span aria-hidden="true">*</span></label>
        <input hlmInput id="account-name" required aria-describedby="account-name-hint" />
        <p id="account-name-hint" class="text-muted-foreground text-sm">This field is required.</p>
      </div>
    `,
  }),
};
