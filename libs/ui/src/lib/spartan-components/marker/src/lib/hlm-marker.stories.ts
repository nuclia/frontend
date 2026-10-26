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
        component: `Import <code>HlmMarkerImports</code> from <code>@nuclia/ui-spartan/marker</code>. Pair the marker root with its content and optional icon directives. The default variant supports inline marker content, separator adds flanking rules, and border adds a lower divider. Give meaningful text to links and hide purely decorative icons from assistive technology.`,
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
