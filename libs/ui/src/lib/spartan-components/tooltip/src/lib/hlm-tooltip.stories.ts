import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmButton } from '../../../button/src/index';
import { HlmTooltipImports } from '../index';
import { HlmTooltip } from './hlm-tooltip';

interface TooltipStoryArgs {
  position: 'top' | 'bottom' | 'left' | 'right';
}

const meta: Meta<TooltipStoryArgs> = {
  title: 'Spartan/Tooltip',
  component: HlmTooltip,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HlmButton, ...HlmTooltipImports] })],
  parameters: {
    docs: {
      description: {
        component: `Import <code>HlmTooltipImports</code> or <code>HlmTooltip</code> from <code>@nuclia/ui-spartan/tooltip</code>. Attach <code>hlmTooltip</code> to a focusable element and bind it to short supplemental text or a template; use <code>position</code> to choose the preferred placement. Tooltip content is available on pointer hover and keyboard focus, but should never be the sole source of essential instructions or the accessible name.`,
      },
    },
  },
  args: { position: 'top' },
  argTypes: {
    position: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
    },
  },
  render: ({ position }) => ({
    props: { position },
    template: `
      <ng-template #helpText>Save your changes to the current workspace.</ng-template>
      <button type="button" hlmBtn [hlmTooltip]="helpText" [position]="position">Save changes</button>
    `,
  }),
};

export default meta;
type Story = StoryObj<TooltipStoryArgs>;

export const Default: Story = {};

export const BottomPlacement: Story = {
  args: { position: 'bottom' },
};
