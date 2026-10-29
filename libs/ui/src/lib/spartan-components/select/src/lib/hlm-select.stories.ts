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
        component: `Presents a list of predefined options in a dropdown opened from a field. Use it to keep forms compact when users can choose a value without needing to type a search.`,
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
