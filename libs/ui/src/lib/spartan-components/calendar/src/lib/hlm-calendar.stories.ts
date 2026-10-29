import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { provideBrnCalendarI18n } from '@spartan-ng/brain/calendar';
import { provideNativeDateAdapter } from '@spartan-ng/brain/date-time';
import { HlmCalendarImports } from '../index';
import { HlmCalendar } from './hlm-calendar';

interface CalendarStoryArgs {
  captionLayout: 'label' | 'dropdown' | 'dropdown-months' | 'dropdown-years';
  disabled: boolean;
  weekStartsOn: number;
}

const isWeekend = (date: Date): boolean => date.getDay() === 0 || date.getDay() === 6;

const meta: Meta<CalendarStoryArgs> = {
  title: 'Spartan/Calendar',
  component: HlmCalendar,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [...HlmCalendarImports],
      providers: [provideNativeDateAdapter(), provideBrnCalendarI18n()],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: `Presents a calendar for browsing months and selecting a date, multiple dates, or a date range. Use it when users need to see dates in context, such as scheduling or choosing a reporting period.
Import <code>HlmCalendarImports</code> from <code>@nuclia/ui-spartan/calendar</code> and use <code>hlm-calendar</code> (single date), <code>hlm-calendar-multi</code> (several dates), <code>hlm-calendar-range</code> (start and end date) or <code>hlm-month-year-calendar</code> (month or year picker).
The calendars need a date adapter and i18n config: provide <code>provideNativeDateAdapter()</code> and <code>provideBrnCalendarI18n()</code> (as these stories do).

Bind the selection with <code>[(date)]</code> (single and multi) or <code>[(startDate)]</code>/<code>[(endDate)]</code> (range). Restrict choices with <code>min</code>, <code>max</code> and <code>dateDisabled</code>, and set <code>weekStartsOn</code> (0 = Sunday).
Days are keyboard navigable with the arrow keys; <code>captionLayout</code> switches the heading to month/year selects.`,
      },
    },
  },
  args: {
    captionLayout: 'label',
    disabled: false,
    weekStartsOn: 0,
  },
  argTypes: {
    captionLayout: {
      description: 'Controls whether month and year navigation uses a heading or select controls.',
      control: 'select',
      options: ['label', 'dropdown', 'dropdown-months', 'dropdown-years'],
    },
    disabled: {
      description: 'Disables the whole calendar.',
      control: 'boolean',
    },
    weekStartsOn: {
      description: 'First day of the week: 0 is Sunday, 1 is Monday, and so on.',
      control: 'select',
      options: [0, 1, 6],
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <hlm-calendar [captionLayout]="captionLayout" [disabled]="disabled" [weekStartsOn]="weekStartsOn" />
    `,
  }),
};

export default meta;

type Story = StoryObj<CalendarStoryArgs>;

export const Default: Story = {};

export const DropdownNavigation: Story = {
  args: { captionLayout: 'dropdown' },
};

export const DropdownMonths: Story = {
  args: { captionLayout: 'dropdown-months' },
};

export const WeekStartsOnMonday: Story = {
  args: { weekStartsOn: 1 },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const DisabledWeekends: Story = {
  render: (args) => ({
    props: { ...args, isWeekend },
    template: `
      <hlm-calendar
        [captionLayout]="captionLayout"
        [disabled]="disabled"
        [weekStartsOn]="weekStartsOn"
        [dateDisabled]="isWeekend" />
    `,
  }),
};

export const MinAndMaxDate: Story = {
  render: (args) => {
    const day = 24 * 60 * 60 * 1000;
    return {
      props: { ...args, min: new Date(Date.now() - 7 * day), max: new Date(Date.now() + 30 * day) },
      template: `
        <hlm-calendar
          [captionLayout]="captionLayout"
          [disabled]="disabled"
          [weekStartsOn]="weekStartsOn"
          [min]="min"
          [max]="max" />
      `,
    };
  },
};

export const MultipleDates: Story = {
  render: (args) => ({
    props: args,
    template: `
      <hlm-calendar-multi [captionLayout]="captionLayout" [disabled]="disabled" [weekStartsOn]="weekStartsOn" />
    `,
  }),
};

export const DateRange: Story = {
  render: (args) => ({
    props: args,
    template: `
      <hlm-calendar-range [captionLayout]="captionLayout" [disabled]="disabled" [weekStartsOn]="weekStartsOn" />
    `,
  }),
};

export const MonthYearPicker: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    template: `<hlm-month-year-calendar />`,
  }),
};
