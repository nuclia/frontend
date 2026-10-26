import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmSeparatorImports } from '../index';

const meta: Meta = {
  title: 'Spartan/Separator',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmSeparatorImports] })],
  parameters: {
    docs: {
      description: {
        component: `A horizontal or vertical divider that separates groups of content. Use it to clarify structure and distinguish related sections or actions without adding another container.`,
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
