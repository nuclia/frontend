import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { provideBrnCalendarI18n } from '@spartan-ng/brain/calendar';
import { provideNativeDateAdapter } from '@spartan-ng/brain/date-time';
import { HlmDatePickerImports } from '../index';
import { HlmLabelImports } from '../../../label/src/index';
import { HlmDatePicker } from './hlm-date-picker';

const meta: Meta = {
  title: 'Spartan/Date Picker',
  component: HlmDatePicker,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [...HlmDatePickerImports, ...HlmLabelImports],
      providers: [provideNativeDateAdapter(), provideBrnCalendarI18n()],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: `Import <code>HlmDatePickerImports</code> or individual components from <code>@nuclia/ui-spartan/date-picker</code>. Provide a date adapter and calendar internationalisation provider; this story uses the native JavaScript <code>Date</code> adapter.
Compose <code>hlm-date-picker</code> with either <code>hlm-date-picker-trigger</code> or <code>hlm-date-picker-input</code>; the public family also includes range, multi-date, and month/year pickers and their inputs. Pair the trigger/input with a visible field label. Calendar navigation and selection are keyboard accessible.`,
      },
    },
  },
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `
      <hlm-date-picker>
        <hlm-date-picker-trigger class="w-64">Select a start date</hlm-date-picker-trigger>
      </hlm-date-picker>
    `,
  }),
};

export const WithDateInput: Story = {
  render: () => ({
    template: `
      <hlm-date-picker>
        <label hlmLabel for="date-input">Start date</label>
        <hlm-date-picker-input inputId="date-input" placeholder="Choose a date" />
      </hlm-date-picker>
    `,
  }),
};

export const DateRange: Story = {
  render: () => ({
    template: `
      <hlm-date-range-picker>
        <label hlmLabel for="trip-dates">Trip dates</label>
        <hlm-date-range-input inputId="trip-dates" placeholder="Select a date range" />
      </hlm-date-range-picker>
    `,
  }),
};

export const MultipleDates: Story = {
  render: () => ({
    template: `
      <hlm-date-picker-multi>
        <label hlmLabel for="available-dates">Available dates</label>
        <hlm-date-multi-input inputId="available-dates" placeholder="Select one or more dates" />
      </hlm-date-picker-multi>
    `,
  }),
};

export const MonthAndYear: Story = {
  render: () => ({
    template: `
      <hlm-month-year-picker>
        <label hlmLabel for="billing-period">Billing period</label>
        <hlm-month-year-input inputId="billing-period" placeholder="Choose a month and year" />
      </hlm-month-year-picker>
    `,
  }),
};
