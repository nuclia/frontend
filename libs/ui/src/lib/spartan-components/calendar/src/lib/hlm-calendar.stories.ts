import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { provideBrnCalendarI18n } from '@spartan-ng/brain/calendar';
import { provideNativeDateAdapter } from '@spartan-ng/brain/date-time';
import { HlmCalendarImports } from '../index';
import { HlmCalendar } from './hlm-calendar';

interface CalendarStoryArgs {
  captionLayout: 'label' | 'dropdown' | 'dropdown-months' | 'dropdown-years';
}

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
        component: `Import <code>HlmCalendarImports</code> or individual calendar components from <code>@nuclia/ui-spartan/calendar</code>. A date adapter and calendar internationalisation provider are required; this story uses the native JavaScript <code>Date</code> adapter.
Use <code>hlm-calendar</code> for one date, <code>hlm-calendar-multi</code> for multiple selections, or <code>hlm-calendar-range</code> for a start/end range. Calendar buttons support keyboard navigation and expose the grid and date selection state to assistive technology.`,
      },
    },
  },
  args: { captionLayout: 'label' },
  argTypes: {
    captionLayout: {
      control: 'select',
      options: ['label', 'dropdown', 'dropdown-months', 'dropdown-years'],
      description: 'Controls whether month and year navigation uses a heading or select controls.',
    },
  },
  render: ({ captionLayout }) => ({
    props: { captionLayout },
    template: `<hlm-calendar [captionLayout]="captionLayout" />`,
  }),
};

export default meta;

type Story = StoryObj<CalendarStoryArgs>;

export const Default: Story = {};

export const DropdownNavigation: Story = {
  args: { captionLayout: 'dropdown' },
};

export const MultipleDates: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({ template: `<hlm-calendar-multi captionLayout="dropdown" />` }),
};

export const DateRange: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({ template: `<hlm-calendar-range captionLayout="dropdown" />` }),
};
