import { provideBrnCalendarI18n } from '@spartan-ng/brain/calendar';
import { provideNativeDateAdapter } from '@spartan-ng/brain/date-time';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmLabelImports } from '../../../label/src/index';
import { HlmDatePickerImports } from '../index';
import { HlmDatePicker } from './hlm-date-picker';

interface DatePickerStoryArgs {
  placeholder: string;
  align: 'start' | 'center' | 'end';
  captionLayout: 'label' | 'dropdown' | 'dropdown-months' | 'dropdown-years';
  disabled: boolean;
  autoCloseOnSelect: boolean;
  forceInvalid: boolean;
}

const meta: Meta<DatePickerStoryArgs> = {
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
        component: `Let users choose dates from a calendar opened from a field or button. Use it for scheduling, deadlines or date filters when a full calendar should only appear during selection.
Import <code>HlmDatePickerImports</code> from <code>@nuclia/ui-spartan/date-picker</code> (and <code>HlmLabelImports</code> from <code>@nuclia/ui-spartan/label</code> for the label). Provide a date adapter with <code>provideNativeDateAdapter()</code> and <code>provideBrnCalendarI18n()</code> (done in these stories; configure it once in your app providers).

Compose <code>hlm-date-picker</code> with either an <code>hlm-date-picker-trigger</code> (a button showing the formatted date; its content is the placeholder) or an <code>hlm-date-picker-input</code> (a typeable field with a calendar button).
Inputs on <code>hlm-date-picker</code>: <code>date</code>, <code>minDate</code>, <code>maxDate</code>, <code>disabled</code>, <code>align</code>, <code>captionLayout</code>, <code>autoCloseOnSelect</code>, <code>formatDate</code>; output: <code>dateChange</code>. It also works with <code>ngModel</code> / reactive forms.
Variants: <code>hlm-date-range-picker</code> + <code>hlm-date-range-input</code> (start and end dates), <code>hlm-date-picker-multi</code> + <code>hlm-date-multi-input</code> (several dates) and <code>hlm-month-year-picker</code> + <code>hlm-month-year-input</code> (month and year only).
Always associate a visible label with the control: <code>&lt;label hlmLabel for="id"&gt;</code> and <code>inputId</code> on the input (or <code>buttonId</code> on the trigger).`,
      },
    },
  },
  args: {
    placeholder: 'Select a start date',
    align: 'center',
    captionLayout: 'label',
    disabled: false,
    autoCloseOnSelect: true,
    forceInvalid: false,
  },
  argTypes: {
    placeholder: {
      description: 'Text displayed while no date is selected (story-only argument).',
      control: 'text',
    },
    align: {
      description: 'Alignment of the calendar popover relative to the trigger.',
      control: 'inline-radio',
      options: ['start', 'center', 'end'],
    },
    captionLayout: {
      description: 'Calendar header: a text label, or dropdowns to pick the month and/or the year.',
      control: 'select',
      options: ['label', 'dropdown', 'dropdown-months', 'dropdown-years'],
    },
    disabled: {
      description: 'Disables the date picker.',
      control: 'boolean',
    },
    autoCloseOnSelect: {
      description: 'Closes the calendar once a date is selected.',
      control: 'boolean',
    },
    forceInvalid: {
      description: 'Forces the invalid style regardless of form validation state (applied to the trigger or input).',
      control: 'boolean',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <hlm-date-picker
        [align]="align"
        [captionLayout]="captionLayout"
        [disabled]="disabled"
        [autoCloseOnSelect]="autoCloseOnSelect"
      >
        <hlm-date-picker-trigger class="w-64" [forceInvalid]="forceInvalid">{{ placeholder }}</hlm-date-picker-trigger>
      </hlm-date-picker>
    `,
  }),
};

export default meta;

type Story = StoryObj<DatePickerStoryArgs>;

export const Default: Story = {};

export const WithSelectedDate: Story = {
  render: (args) => ({
    props: { ...args, selectedDate: new Date(2026, 5, 15) },
    template: `
      <hlm-date-picker
        [date]="selectedDate"
        [align]="align"
        [captionLayout]="captionLayout"
        [disabled]="disabled"
        [autoCloseOnSelect]="autoCloseOnSelect"
      >
        <hlm-date-picker-trigger class="w-64" [forceInvalid]="forceInvalid">{{ placeholder }}</hlm-date-picker-trigger>
      </hlm-date-picker>
    `,
  }),
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

export const WithMonthYearDropdowns: Story = {
  args: {
    captionLayout: 'dropdown',
    placeholder: 'Select your date of birth',
  },
};

export const WithMinAndMaxDates: Story = {
  args: {
    placeholder: 'Select a delivery date',
  },
  render: (args) => ({
    props: { ...args, minDate: new Date(2026, 5, 10), maxDate: new Date(2026, 5, 25) },
    template: `
      <hlm-date-picker
        [minDate]="minDate"
        [maxDate]="maxDate"
        [align]="align"
        [captionLayout]="captionLayout"
        [disabled]="disabled"
        [autoCloseOnSelect]="autoCloseOnSelect"
      >
        <hlm-date-picker-trigger class="w-64" [forceInvalid]="forceInvalid">{{ placeholder }}</hlm-date-picker-trigger>
      </hlm-date-picker>
    `,
  }),
};

export const WithDateInput: Story = {
  args: {
    placeholder: 'Choose a date',
  },
  render: (args) => ({
    props: args,
    template: `
      <hlm-date-picker
        class="w-64"
        [align]="align"
        [captionLayout]="captionLayout"
        [disabled]="disabled"
        [autoCloseOnSelect]="autoCloseOnSelect"
      >
        <label hlmLabel for="date-input" class="mb-2">Start date</label>
        <hlm-date-picker-input inputId="date-input" [placeholder]="placeholder" [forceInvalid]="forceInvalid" />
      </hlm-date-picker>
    `,
  }),
};

export const DateRange: Story = {
  args: {
    placeholder: 'Select a date range',
  },
  render: (args) => ({
    props: args,
    template: `
      <hlm-date-range-picker
        class="w-72"
        [align]="align"
        [captionLayout]="captionLayout"
        [disabled]="disabled"
      >
        <label hlmLabel for="trip-dates" class="mb-2">Trip dates</label>
        <hlm-date-range-input inputId="trip-dates" [placeholder]="placeholder" [forceInvalid]="forceInvalid" />
      </hlm-date-range-picker>
    `,
  }),
};

export const MultipleDates: Story = {
  args: {
    placeholder: 'Select one or more dates',
  },
  render: (args) => ({
    props: args,
    template: `
      <hlm-date-picker-multi
        class="w-72"
        [align]="align"
        [captionLayout]="captionLayout"
        [disabled]="disabled"
      >
        <label hlmLabel for="available-dates" class="mb-2">Available dates</label>
        <hlm-date-multi-input inputId="available-dates" [placeholder]="placeholder" [forceInvalid]="forceInvalid" />
      </hlm-date-picker-multi>
    `,
  }),
};

export const MonthAndYear: Story = {
  args: {
    placeholder: 'Choose a month and year',
  },
  render: (args) => ({
    props: args,
    template: `
      <hlm-month-year-picker
        class="w-64"
        [align]="align"
        [disabled]="disabled"
        [autoCloseOnSelect]="autoCloseOnSelect"
      >
        <label hlmLabel for="billing-period" class="mb-2">Billing period</label>
        <hlm-month-year-input inputId="billing-period" [placeholder]="placeholder" [forceInvalid]="forceInvalid" />
      </hlm-month-year-picker>
    `,
  }),
};
