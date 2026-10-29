import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmFieldImports } from '../../../field/src/index';
import { HlmLabelImports } from '../../../label/src/index';
import { HlmSelectImports } from '../index';
import { HlmSelect } from './hlm-select';

interface SelectStoryArgs {
  disabled: boolean;
  size: 'default' | 'sm';
  forceInvalid: boolean;
  placeholder: string;
}

const meta: Meta<SelectStoryArgs> = {
  title: 'Spartan/Select',
  component: HlmSelect,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmSelectImports, ...HlmFieldImports, ...HlmLabelImports] })],
  parameters: {
    docs: {
      description: {
        component: `Presents a list of predefined options in a dropdown opened from a field. Use it to keep forms compact when users can choose a value without needing to type a search.
Import <code>HlmSelectImports</code> from <code>@nuclia/ui-spartan/select</code>. Compose <code>hlm-select</code> with an <code>hlm-select-trigger</code> (containing <code>hlm-select-value</code>) and an <code>hlm-select-content</code> rendered through <code>*hlmSelectPortal</code>, holding <code>hlm-select-item</code> elements (optionally grouped with <code>hlm-select-group</code>, <code>hlm-select-label</code> and <code>hlm-select-separator</code>).

<code>hlm-select</code> accepts <code>value</code> and <code>disabled</code>, emits <code>valueChange</code> and works with Angular forms; use <code>hlm-select-multiple</code> for several values. The trigger takes <code>size</code> (<code>default</code> or <code>sm</code>), <code>buttonId</code> and <code>forceInvalid</code>, and each item takes a <code>value</code> and can be <code>disabled</code>.
Associate a visible label with the trigger through <code>buttonId</code> and <code>for</code> (for instance with <code>hlmFieldLabel</code>) so the control has an accessible name.`,
      },
    },
  },
  args: {
    disabled: false,
    size: 'default',
    forceInvalid: false,
    placeholder: 'Select a plan',
  },
  argTypes: {
    disabled: {
      description: 'Disables the select and prevents the dropdown from opening.',
      control: 'boolean',
    },
    size: {
      description: 'Height of the trigger.',
      control: 'inline-radio',
      options: ['default', 'sm'],
    },
    forceInvalid: {
      description: 'Forces the trigger into the invalid state, useful outside of Angular forms.',
      control: 'boolean',
    },
    placeholder: {
      description: 'Text shown in the trigger while no value is selected.',
      control: 'text',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <div hlmField class="w-80">
        <label hlmFieldLabel for="plan-select">Plan</label>
        <hlm-select [disabled]="disabled">
          <hlm-select-trigger buttonId="plan-select" class="w-full" [size]="size" [forceInvalid]="forceInvalid">
            <hlm-select-value [placeholder]="placeholder" />
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

export default meta;

type Story = StoryObj<SelectStoryArgs>;

export const Default: Story = {};

export const Small: Story = {
  args: { size: 'sm' },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Invalid: Story = {
  args: { forceInvalid: true },
};

export const WithPreselectedValue: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div hlmField class="w-80">
        <label hlmFieldLabel for="role-select">Role</label>
        <hlm-select value="editor">
          <hlm-select-trigger buttonId="role-select" class="w-full">
            <hlm-select-value placeholder="Select a role" />
          </hlm-select-trigger>
          <hlm-select-content *hlmSelectPortal>
            <hlm-select-item value="viewer">Viewer</hlm-select-item>
            <hlm-select-item value="editor">Editor</hlm-select-item>
            <hlm-select-item value="admin">Administrator</hlm-select-item>
          </hlm-select-content>
        </hlm-select>
      </div>
    `,
  }),
};

export const WithDisabledItem: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div hlmField class="w-80">
        <label hlmFieldLabel for="region-select">Region</label>
        <hlm-select>
          <hlm-select-trigger buttonId="region-select" class="w-full">
            <hlm-select-value placeholder="Select a region" />
          </hlm-select-trigger>
          <hlm-select-content *hlmSelectPortal>
            <hlm-select-item value="eu">Europe</hlm-select-item>
            <hlm-select-item value="us">North America</hlm-select-item>
            <hlm-select-item value="apac" disabled>Asia Pacific (coming soon)</hlm-select-item>
          </hlm-select-content>
        </hlm-select>
      </div>
    `,
  }),
};

export const WithGroups: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div hlmField class="w-80">
        <label hlmFieldLabel for="timezone-select">Time zone</label>
        <hlm-select>
          <hlm-select-trigger buttonId="timezone-select" class="w-full">
            <hlm-select-value placeholder="Select a time zone" />
          </hlm-select-trigger>
          <hlm-select-content *hlmSelectPortal>
            <hlm-select-group>
              <hlm-select-label>Europe</hlm-select-label>
              <hlm-select-item value="cet">Central European Time</hlm-select-item>
              <hlm-select-item value="gmt">Greenwich Mean Time</hlm-select-item>
            </hlm-select-group>
            <hlm-select-separator />
            <hlm-select-group>
              <hlm-select-label>North America</hlm-select-label>
              <hlm-select-item value="est">Eastern Standard Time</hlm-select-item>
              <hlm-select-item value="pst">Pacific Standard Time</hlm-select-item>
            </hlm-select-group>
          </hlm-select-content>
        </hlm-select>
      </div>
    `,
  }),
};

export const WithSeparator: Story = {
  parameters: { controls: { disable: true } },
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

export const Multiple: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div hlmField class="w-80">
        <label hlmFieldLabel for="topics-select">Topics</label>
        <hlm-select-multiple>
          <hlm-select-trigger buttonId="topics-select" class="w-full">
            <hlm-select-value placeholder="Select topics" />
            <hlm-select-values-content>
              <ng-container *hlmSelectValues="let values">{{ values.join(', ') }}</ng-container>
            </hlm-select-values-content>
          </hlm-select-trigger>
          <hlm-select-content *hlmSelectPortal>
            <hlm-select-item value="Design">Design</hlm-select-item>
            <hlm-select-item value="Engineering">Engineering</hlm-select-item>
            <hlm-select-item value="Marketing">Marketing</hlm-select-item>
          </hlm-select-content>
        </hlm-select-multiple>
      </div>
    `,
  }),
};
