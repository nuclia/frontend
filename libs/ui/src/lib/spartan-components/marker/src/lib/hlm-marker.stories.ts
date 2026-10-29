import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideGitBranch } from '@ng-icons/lucide';
import { applicationConfig, moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmMarkerImports } from '../index';

interface MarkerStoryArgs {
  variant: 'default' | 'separator' | 'border';
}

const meta: Meta<MarkerStoryArgs> = {
  title: 'Spartan/Marker',
  tags: ['autodocs'],
  decorators: [
    applicationConfig({ providers: [provideIcons({ lucideGitBranch })] }),
    moduleMetadata({ imports: [...HlmMarkerImports, NgIcon] }),
  ],
  parameters: {
    docs: {
      description: {
        component: `Displays a status update, system note, or labeled separator within a conversation. Use it to distinguish events such as processing activity or conversation milestones from messages sent by participants.`,
      },
    },
  },
  args: { variant: 'default' },
  argTypes: { variant: { control: 'select', options: ['default', 'separator', 'border'] } },
  render: ({ variant }) => ({
    props: { variant },
    template: `<div hlmMarker [variant]="variant" class="max-w-xl">
      <span hlmMarkerIcon><ng-icon name="lucideGitBranch" /></span>
      <span hlmMarkerContent>Switched to a new branch</span>
    </div>`,
  }),
};

export default meta;
type Story = StoryObj<MarkerStoryArgs>;
export const Default: Story = {};
export const Separator: Story = { args: { variant: 'separator' } };
export const Border: Story = { args: { variant: 'border' } };
