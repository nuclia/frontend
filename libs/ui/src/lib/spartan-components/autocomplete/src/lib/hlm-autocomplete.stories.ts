import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmAutocompleteImports } from '../index';
import { HlmLabelImports } from '../../../label/src/index';
import { HlmAutocomplete } from './hlm-autocomplete';

const meta: Meta = {
  title: 'Spartan/Autocomplete',
  component: HlmAutocomplete,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmAutocompleteImports, ...HlmLabelImports] })],
  parameters: {
    docs: {
      description: {
        component: `Import <code>HlmAutocompleteImports</code> or the individual components from <code>@nuclia/ui-spartan/autocomplete</code>.
Compose <code>hlm-autocomplete</code>, <code>hlm-autocomplete-input</code>, <code>hlm-autocomplete-content</code>, <code>hlm-autocomplete-list</code>, and <code>hlm-autocomplete-item</code>; the family also exports grouping, status, empty-state, separator, search, and portal helpers.
Give the input a visible label and the list an accessible name. Items support the underlying autocomplete keyboard navigation and selection behavior.`,
      },
    },
  },
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `
      <hlm-autocomplete class="w-80">
        <label hlmLabel for="country-search">Country</label>
        <hlm-autocomplete-input inputId="country-search" placeholder="Search countries" [showClear]="true" />
        <hlm-autocomplete-content *hlmAutocompletePortal>
          <hlm-autocomplete-list aria-label="Countries">
            <hlm-autocomplete-item value="Canada">Canada</hlm-autocomplete-item>
            <hlm-autocomplete-item value="Japan">Japan</hlm-autocomplete-item>
            <hlm-autocomplete-item value="Portugal">Portugal</hlm-autocomplete-item>
          </hlm-autocomplete-list>
        </hlm-autocomplete-content>
      </hlm-autocomplete>
    `,
  }),
};

export const EmptyState: Story = {
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
