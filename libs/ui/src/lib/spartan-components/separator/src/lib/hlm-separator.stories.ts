import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmSeparatorImports } from '../index';

const meta: Meta = {
  title: 'Spartan/Separator',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmSeparatorImports] })],
  parameters: {
    docs: {
      description: {
        component: `Import <code>HlmSeparatorImports</code> from <code>@nuclia/ui-spartan/separator</code> and apply <code>hlmSeparator</code> to a divider. Set <code>decorative</code> for a purely visual divider so it is hidden from assistive technology; for meaningful section separation, retain separator semantics and label it when needed.`,
      },
    },
  },
  render: () => ({
    template: `<div class="max-w-md space-y-4">
      <p>Profile details</p>
      <div hlmSeparator role="separator" class="my-4"></div>
      <p>Notification preferences</p>
    </div>`,
  }),
};

export default meta;
type Story = StoryObj;
export const Default: Story = {};
export const Decorative: Story = {
  render: () => ({
    template: `<div class="max-w-md space-y-4">
      <p>Workspace overview</p>
      <div hlmSeparator [decorative]="true" class="my-4"></div>
      <p>Recent activity</p>
    </div>`,
  }),
};
