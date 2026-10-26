import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmComboboxImports } from '../index';
import { HlmLabelImports } from '../../../label/src/index';
import { HlmCombobox } from './hlm-combobox';

const meta: Meta = {
  title: 'Spartan/Combobox',
  component: HlmCombobox,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmComboboxImports, ...HlmLabelImports] })],
  parameters: {
    docs: {
      description: {
        component: `Combines a text input with a list of predefined options to select. Use it when users need to search a long list of choices rather than browse a simple select menu.`,
      },
    },
  },
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `
      <hlm-combobox class="w-80">
        <label hlmLabel for="team-combobox">Team</label>
        <hlm-combobox-input inputId="team-combobox" placeholder="Choose a team" [showClear]="true" />
        <hlm-combobox-content *hlmComboboxPortal>
          <hlm-combobox-list>
            <hlm-combobox-empty>No teams found.</hlm-combobox-empty>
            <hlm-combobox-item value="design">Design</hlm-combobox-item>
            <hlm-combobox-item value="engineering">Engineering</hlm-combobox-item>
            <hlm-combobox-item value="research">Research</hlm-combobox-item>
          </hlm-combobox-list>
        </hlm-combobox-content>
      </hlm-combobox>
    `,
  }),
};

export const WithGroupedOptions: Story = {
  render: () => ({
    template: `
      <hlm-combobox class="w-80">
        <label hlmLabel for="region-combobox">Region</label>
        <hlm-combobox-input inputId="region-combobox" placeholder="Choose a region" />
        <hlm-combobox-content *hlmComboboxPortal>
          <hlm-combobox-list>
            <div hlmComboboxGroup>
              <div hlmComboboxLabel>Americas</div>
              <hlm-combobox-item value="north-america">North America</hlm-combobox-item>
              <hlm-combobox-item value="south-america">South America</hlm-combobox-item>
            </div>
            <div hlmComboboxSeparator></div>
            <div hlmComboboxGroup>
              <div hlmComboboxLabel>Europe</div>
              <hlm-combobox-item value="europe">Europe</hlm-combobox-item>
            </div>
          </hlm-combobox-list>
        </hlm-combobox-content>
      </hlm-combobox>
    `,
  }),
};
