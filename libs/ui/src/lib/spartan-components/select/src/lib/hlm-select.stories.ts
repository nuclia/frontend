import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmFieldImports } from '../../../field/src/index';
import { HlmLabelImports } from '../../../label/src/index';
import { HlmSelectImports } from '../index';
import { HlmSelect } from './hlm-select';

const meta: Meta = {
  title: 'Spartan/Select',
  component: HlmSelect,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmSelectImports, ...HlmFieldImports, ...HlmLabelImports] })],
  parameters: {
    docs: {
      description: {
        component: `Import <code>HlmSelectImports</code> or its components from <code>@nuclia/ui-spartan/select</code>. Compose <code>hlm-select</code> with a trigger, value, content, and items; use the exported group, label, separator, placeholder, portal, and scroll helpers as needed.
Pair the trigger with a visible label and a stable button id. Options are keyboard navigable and selection is announced through the underlying select semantics.`,
      },
    },
  },
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `
      <div hlmField class="w-80">
        <label hlmFieldLabel for="plan-select">Plan</label>
        <hlm-select>
          <hlm-select-trigger buttonId="plan-select" class="w-full">
            <hlm-select-value placeholder="Select a plan" />
          </hlm-select-trigger>
          <hlm-select-content *hlmSelectPortal>
            <hlm-select-group>
              <hlm-select-label>Available plans</hlm-select-label>
              <hlm-select-item value="starter">Starter</hlm-select-item>
              <hlm-select-item value="team">Team</hlm-select-item>
              <hlm-select-item value="enterprise">Enterprise</hlm-select-item>
            </hlm-select-group>
          </hlm-select-content>
        </hlm-select>
      </div>
    `,
  }),
};

export const WithSeparator: Story = {
  render: () => ({
    template: `
      <div hlmField class="w-80">
        <label hlmFieldLabel for="language-select">Language</label>
        <hlm-select>
          <hlm-select-trigger buttonId="language-select" class="w-full">
            <hlm-select-value placeholder="Choose a language" />
          </hlm-select-trigger>
          <hlm-select-content *hlmSelectPortal>
            <hlm-select-item value="english">English</hlm-select-item>
            <hlm-select-item value="spanish">Spanish</hlm-select-item>
            <hlm-select-separator />
            <hlm-select-item value="other">Other</hlm-select-item>
          </hlm-select-content>
        </hlm-select>
      </div>
    `,
  }),
};
