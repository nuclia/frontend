import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmButton } from '../../../button/src/index';
import { HlmCollapsibleImports } from '../index';
import { HlmCollapsible } from './hlm-collapsible';

const meta: Meta = {
  title: 'Spartan/Collapsible',
  component: HlmCollapsible,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HlmButton, ...HlmCollapsibleImports] })],
  parameters: {
    docs: {
      description: {
        component: `Import <code>HlmCollapsibleImports</code> or the collapsible root, trigger, and content primitives from <code>@nuclia/ui-spartan/collapsible</code>. Put the trigger and content under one root; use the root's <code>expanded</code> input when an initial state is needed. The trigger exposes expanded state for assistive technology and supports keyboard activation. Use a real button and a descriptive label for the trigger.`,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `
      <section hlmCollapsible class="w-full max-w-md space-y-2">
        <div class="flex items-center justify-between gap-4">
          <h2 class="font-medium">Project details</h2>
          <button type="button" hlmBtn variant="outline" hlmCollapsibleTrigger>Toggle details</button>
        </div>
        <div hlmCollapsibleContent>
          <p class="rounded-md border px-4 py-3 text-sm">
            The Atlas project brings product, design, and engineering planning together.
          </p>
        </div>
      </section>
    `,
  }),
};

export const InitiallyExpanded: Story = {
  render: () => ({
    template: `
      <section hlmCollapsible [expanded]="true" class="w-full max-w-md space-y-2">
        <div class="flex items-center justify-between gap-4">
          <h2 class="font-medium">Release notes</h2>
          <button type="button" hlmBtn variant="outline" hlmCollapsibleTrigger>Toggle release notes</button>
        </div>
        <div hlmCollapsibleContent>
          <p class="rounded-md border px-4 py-3 text-sm">
            Version 2.4 improves keyboard navigation and adds clearer empty states.
          </p>
        </div>
      </section>
    `,
  }),
};
