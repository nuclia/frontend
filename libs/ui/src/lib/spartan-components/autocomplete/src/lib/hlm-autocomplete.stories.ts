import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmLabelImports } from '../../../label/src/index';
import { HlmAutocompleteImports } from '../index';
import { HlmAutocomplete } from './hlm-autocomplete';

interface AutocompleteStoryArgs {
  placeholder: string;
  showSearch: boolean;
  showClear: boolean;
  autoHighlight: boolean;
  disabled: boolean;
  forceInvalid: boolean;
}

const meta: Meta<AutocompleteStoryArgs> = {
  title: 'Spartan/Autocomplete',
  component: HlmAutocomplete,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmAutocompleteImports, ...HlmLabelImports] })],
  parameters: {
    docs: {
      description: {
        component: `Suggests matching options as users type into a text field. Use it for search suggestions or assisted text entry to reduce typing and help users discover relevant values.
Import <code>HlmAutocompleteImports</code> from <code>@nuclia/ui-spartan/autocomplete</code> and compose <code>hlm-autocomplete</code> with an <code>hlm-autocomplete-input</code> and an <code>hlm-autocomplete-content</code> rendered through <code>*hlmAutocompletePortal</code>.
Inside the content, use <code>hlmAutocompleteList</code> (with an <code>aria-label</code>) holding <code>hlm-autocomplete-item</code> elements with a <code>value</code>, plus optional <code>hlm-autocomplete-empty</code>, <code>hlmAutocompleteGroup</code>/<code>hlmAutocompleteLabel</code>, <code>hlmAutocompleteSeparator</code> and <code>hlm-autocomplete-status</code>.

Items are filtered by what the user types. Use <code>[(value)]</code> and <code>[(search)]</code> (or forms) to read the selected value and the typed text; for server-side suggestions use <code>hlm-autocomplete-search</code> instead.
Associate the input with a <code>label</code> through <code>inputId</code>.`,
      },
    },
  },
  args: {
    placeholder: 'Search countries',
    showSearch: true,
    showClear: false,
    autoHighlight: false,
    disabled: false,
    forceInvalid: false,
  },
  argTypes: {
    placeholder: {
      description: 'Placeholder of the text input (<code>hlm-autocomplete-input</code>).',
      control: 'text',
    },
    showSearch: {
      description: 'Shows the search icon inside the input.',
      control: 'boolean',
    },
    showClear: {
      description: 'Shows a button to clear the input.',
      control: 'boolean',
    },
    autoHighlight: {
      description: 'Automatically highlights the first matching item while typing.',
      control: 'boolean',
    },
    disabled: {
      description: 'Disables the autocomplete.',
      control: 'boolean',
    },
    forceInvalid: {
      description: 'Forces the invalid style regardless of form validation state.',
      control: 'boolean',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <hlm-autocomplete class="w-80" [disabled]="disabled" [autoHighlight]="autoHighlight">
        <label hlmLabel for="country-search">Country</label>
        <hlm-autocomplete-input
          inputId="country-search"
          [placeholder]="placeholder"
          [showSearch]="showSearch"
          [showClear]="showClear"
          [forceInvalid]="forceInvalid" />
        <hlm-autocomplete-content *hlmAutocompletePortal>
          <hlm-autocomplete-list aria-label="Countries">
            <hlm-autocomplete-empty>No matching countries.</hlm-autocomplete-empty>
            <hlm-autocomplete-item value="Canada">Canada</hlm-autocomplete-item>
            <hlm-autocomplete-item value="Japan">Japan</hlm-autocomplete-item>
            <hlm-autocomplete-item value="Portugal">Portugal</hlm-autocomplete-item>
            <hlm-autocomplete-item value="Spain">Spain</hlm-autocomplete-item>
          </hlm-autocomplete-list>
        </hlm-autocomplete-content>
      </hlm-autocomplete>
    `,
  }),
};

export default meta;

type Story = StoryObj<AutocompleteStoryArgs>;

export const Default: Story = {};

export const WithClearButton: Story = {
  args: {
    showClear: true,
  },
};

export const WithoutSearchIcon: Story = {
  args: {
    showSearch: false,
  },
};

export const AutoHighlight: Story = {
  args: {
    autoHighlight: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Invalid: Story = {
  args: {
    forceInvalid: true,
  },
};

export const EmptyState: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    template: `
      <hlm-autocomplete class="w-80">
        <label hlmLabel for="city-search">City</label>
        <hlm-autocomplete-input inputId="city-search" placeholder="Search cities" />
        <hlm-autocomplete-content *hlmAutocompletePortal>
          <hlm-autocomplete-list aria-label="Cities">
            <hlm-autocomplete-empty>No matching cities.</hlm-autocomplete-empty>
            <hlm-autocomplete-item value="Lisbon">Lisbon</hlm-autocomplete-item>
            <hlm-autocomplete-item value="Osaka">Osaka</hlm-autocomplete-item>
          </hlm-autocomplete-list>
        </hlm-autocomplete-content>
      </hlm-autocomplete>
    `,
  }),
};

export const Groups: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    template: `
      <hlm-autocomplete class="w-80">
        <label hlmLabel for="tag-search">Tag</label>
        <hlm-autocomplete-input inputId="tag-search" placeholder="Search tags" />
        <hlm-autocomplete-content *hlmAutocompletePortal>
          <hlm-autocomplete-list aria-label="Tags">
            <hlm-autocomplete-empty>No matching tags.</hlm-autocomplete-empty>
            <div hlmAutocompleteGroup>
              <div hlmAutocompleteLabel>Documents</div>
              <hlm-autocomplete-item value="Invoices">Invoices</hlm-autocomplete-item>
              <hlm-autocomplete-item value="Contracts">Contracts</hlm-autocomplete-item>
            </div>
            <div hlmAutocompleteSeparator></div>
            <div hlmAutocompleteGroup>
              <div hlmAutocompleteLabel>Media</div>
              <hlm-autocomplete-item value="Podcasts">Podcasts</hlm-autocomplete-item>
              <hlm-autocomplete-item value="Webinars">Webinars</hlm-autocomplete-item>
            </div>
          </hlm-autocomplete-list>
        </hlm-autocomplete-content>
      </hlm-autocomplete>
    `,
  }),
};
