import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmLabelImports } from '../../../label/src/index';
import { HlmComboboxImports } from '../index';
import { HlmCombobox } from './hlm-combobox';

interface ComboboxStoryArgs {
  placeholder: string;
  value: string;
  disabled: boolean;
  forceInvalid: boolean;
  showClear: boolean;
  showTrigger: boolean;
  autoHighlight: boolean;
  closeOnSelect: boolean;
}

const meta: Meta<ComboboxStoryArgs> = {
  title: 'Spartan/Combobox',
  component: HlmCombobox,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmComboboxImports, ...HlmLabelImports] })],
  parameters: {
    docs: {
      description: {
        component: `Combine a text input with a list of predefined options to select from. Use it when users need to search a long list of choices rather than browse a simple select menu.
Import <code>HlmComboboxImports</code> from <code>@nuclia/ui-spartan/combobox</code> (and <code>HlmLabelImports</code> from <code>@nuclia/ui-spartan/label</code> for the label).

Compose <code>hlm-combobox</code> with an <code>hlm-combobox-input</code> and an <code>hlm-combobox-content</code> rendered through <code>*hlmComboboxPortal</code>, containing a <code>div[hlmComboboxList]</code> of <code>hlm-combobox-item</code> (each with a <code>value</code>) and an optional <code>hlm-combobox-empty</code>.
Group options with <code>hlmComboboxGroup</code>, <code>hlmComboboxLabel</code> and <code>hlmComboboxSeparator</code>.
Inputs on <code>hlm-combobox</code>: <code>value</code> (two-way with <code>[(value)]</code>, or use <code>ngModel</code> / reactive forms), <code>search</code>, <code>disabled</code>, <code>autoHighlight</code>, <code>closeOnSelect</code>, <code>filter</code> and <code>itemToString</code> (for object values); outputs <code>valueChange</code> and <code>searchChange</code>.
Inputs on <code>hlm-combobox-input</code>: <code>placeholder</code>, <code>showTrigger</code>, <code>showClear</code>, <code>forceInvalid</code>, <code>inputId</code>.
Use <code>hlm-combobox-multiple</code> with <code>hlm-combobox-chips</code> for multiple selection, or <code>hlm-combobox-trigger</code> for a select-like button. Always associate a visible label with the input through <code>inputId</code>.`,
      },
    },
  },
  args: {
    placeholder: 'Choose a team',
    value: '',
    disabled: false,
    forceInvalid: false,
    showClear: false,
    showTrigger: true,
    autoHighlight: false,
    closeOnSelect: true,
  },
  argTypes: {
    placeholder: {
      description: 'Placeholder of the input (<code>hlm-combobox-input</code> input).',
      control: 'text',
    },
    value: {
      description: 'Selected value (<code>hlm-combobox</code> input). Empty means nothing selected.',
      control: 'select',
      options: ['', 'design', 'engineering', 'research'],
    },
    disabled: {
      description: 'Disables the combobox.',
      control: 'boolean',
    },
    forceInvalid: {
      description:
        'Forces the invalid style regardless of form validation state (<code>hlm-combobox-input</code> input).',
      control: 'boolean',
    },
    showClear: {
      description: 'Shows a button to clear the selection (<code>hlm-combobox-input</code> input).',
      control: 'boolean',
    },
    showTrigger: {
      description: 'Shows the chevron button that toggles the options (<code>hlm-combobox-input</code> input).',
      control: 'boolean',
    },
    autoHighlight: {
      description: 'Automatically highlights the first matching option while searching.',
      control: 'boolean',
    },
    closeOnSelect: {
      description: 'Closes the list after an option is selected.',
      control: 'boolean',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <hlm-combobox
        class="w-80"
        [value]="value || null"
        [disabled]="disabled"
        [autoHighlight]="autoHighlight"
        [closeOnSelect]="closeOnSelect"
      >
        <label hlmLabel for="team-combobox" class="mb-2">Team</label>
        <hlm-combobox-input
          inputId="team-combobox"
          [placeholder]="placeholder"
          [showClear]="showClear"
          [showTrigger]="showTrigger"
          [forceInvalid]="forceInvalid"
        />
        <hlm-combobox-content *hlmComboboxPortal>
          <hlm-combobox-empty>No teams found.</hlm-combobox-empty>
          <div hlmComboboxList>
            <hlm-combobox-item value="design">Design</hlm-combobox-item>
            <hlm-combobox-item value="engineering">Engineering</hlm-combobox-item>
            <hlm-combobox-item value="research">Research</hlm-combobox-item>
          </div>
        </hlm-combobox-content>
      </hlm-combobox>
    `,
  }),
};

export default meta;

type Story = StoryObj<ComboboxStoryArgs>;

export const Default: Story = {};

export const WithClearButton: Story = {
  args: {
    value: 'engineering',
    showClear: true,
  },
};

export const Disabled: Story = {
  args: {
    value: 'design',
    disabled: true,
  },
};

export const Invalid: Story = {
  args: {
    forceInvalid: true,
  },
};

export const WithGroupedOptions: Story = {
  args: {
    placeholder: 'Choose a region',
  },
  render: (args) => ({
    props: args,
    template: `
      <hlm-combobox class="w-80" [disabled]="disabled" [autoHighlight]="autoHighlight" [closeOnSelect]="closeOnSelect">
        <label hlmLabel for="region-combobox" class="mb-2">Region</label>
        <hlm-combobox-input
          inputId="region-combobox"
          [placeholder]="placeholder"
          [showClear]="showClear"
          [showTrigger]="showTrigger"
          [forceInvalid]="forceInvalid"
        />
        <hlm-combobox-content *hlmComboboxPortal>
          <hlm-combobox-empty>No regions found.</hlm-combobox-empty>
          <div hlmComboboxList>
            <div hlmComboboxGroup>
              <div hlmComboboxLabel>Americas</div>
              <hlm-combobox-item value="north-america">North America</hlm-combobox-item>
              <hlm-combobox-item value="south-america">South America</hlm-combobox-item>
            </div>
            <div hlmComboboxSeparator></div>
            <div hlmComboboxGroup>
              <div hlmComboboxLabel>Europe</div>
              <hlm-combobox-item value="europe">Europe</hlm-combobox-item>
              <hlm-combobox-item value="uk">United Kingdom</hlm-combobox-item>
            </div>
          </div>
        </hlm-combobox-content>
      </hlm-combobox>
    `,
  }),
};

export const WithTriggerButton: Story = {
  args: {
    placeholder: 'Search frameworks...',
  },
  render: (args) => ({
    props: args,
    template: `
      <hlm-combobox class="w-64" [disabled]="disabled" [autoHighlight]="autoHighlight" [closeOnSelect]="closeOnSelect">
        <hlm-combobox-trigger class="w-full justify-between">
          <span hlmComboboxValue placeholder="Select a framework"></span>
        </hlm-combobox-trigger>
        <hlm-combobox-content *hlmComboboxPortal>
          <hlm-combobox-input [placeholder]="placeholder" [showTrigger]="false" />
          <hlm-combobox-empty>No frameworks found.</hlm-combobox-empty>
          <div hlmComboboxList>
            <hlm-combobox-item value="angular">Angular</hlm-combobox-item>
            <hlm-combobox-item value="svelte">Svelte</hlm-combobox-item>
            <hlm-combobox-item value="react">React</hlm-combobox-item>
          </div>
        </hlm-combobox-content>
      </hlm-combobox>
    `,
  }),
};

export const MultipleWithChips: Story = {
  args: {
    placeholder: 'Add a language',
  },
  render: (args) => ({
    props: { ...args, selected: ['typescript'] },
    template: `
      <hlm-combobox-multiple class="w-80" [value]="selected" [disabled]="disabled" [autoHighlight]="autoHighlight">
        <hlm-combobox-chips [forceInvalid]="forceInvalid">
          <ng-template hlmComboboxValues let-values>
            @for (language of values; track language) {
              <hlm-combobox-chip [value]="language">{{ language }}</hlm-combobox-chip>
            }
          </ng-template>
          <input hlmComboboxChipInput [placeholder]="placeholder" aria-label="Languages" />
        </hlm-combobox-chips>
        <hlm-combobox-content *hlmComboboxPortal>
          <hlm-combobox-empty>No languages found.</hlm-combobox-empty>
          <div hlmComboboxList>
            <hlm-combobox-item value="typescript">typescript</hlm-combobox-item>
            <hlm-combobox-item value="python">python</hlm-combobox-item>
            <hlm-combobox-item value="rust">rust</hlm-combobox-item>
            <hlm-combobox-item value="go">go</hlm-combobox-item>
          </div>
        </hlm-combobox-content>
      </hlm-combobox-multiple>
    `,
  }),
};
