import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmButton } from '../../../button/src/index';
import { HlmInputImports } from '../../../input/src/index';
import { HlmLabelImports } from '../../../label/src/index';
import { HlmSheetImports } from '../index';
import { HlmSheet } from './hlm-sheet';

interface SheetStoryArgs {
  side: 'top' | 'right' | 'bottom' | 'left';
  showCloseButton: boolean;
  title: string;
  description: string;
}

const meta: Meta<SheetStoryArgs> = {
  title: 'Spartan/Sheet',
  component: HlmSheet,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HlmButton, ...HlmInputImports, ...HlmLabelImports, ...HlmSheetImports] })],
  parameters: {
    docs: {
      description: {
        component: `A dialog that slides in from an edge of the screen to display content alongside the main view. Use it for details, filters, or editing tasks that benefit from a larger contextual panel.
Import <code>HlmSheetImports</code> from <code>@nuclia/ui-spartan/sheet</code> (and <code>HlmButton</code> from <code>@nuclia/ui-spartan/button</code> for the trigger).

Compose <code>hlm-sheet</code> (set <code>side</code> to <code>top</code>, <code>right</code>, <code>bottom</code> or <code>left</code>) with a <code>button[hlmSheetTrigger]</code> and an <code>hlm-sheet-content</code> rendered through <code>*hlmSheetPortal</code>.
Inside, use <code>hlmSheetHeader</code> (<code>hlmSheetTitle</code>, <code>hlmSheetDescription</code>) and <code>hlmSheetFooter</code>, and <code>button[hlmSheetClose]</code> to close it. The content shows a close button by default, hide it with <code>[showCloseButton]="false"</code>.
The sheet is a modal dialog: focus is trapped, <code>Esc</code> closes it, and the title and description label it for assistive technology, so always provide them.`,
      },
    },
  },
  args: {
    side: 'right',
    showCloseButton: true,
    title: 'Preferences',
    description: 'Choose how you receive workspace updates.',
  },
  argTypes: {
    side: {
      description: 'Edge of the screen from which the sheet slides in, set on <code>hlm-sheet</code>.',
      control: 'inline-radio',
      options: ['top', 'right', 'bottom', 'left'],
    },
    showCloseButton: {
      description: 'Shows the close button in the corner of the content, set on <code>hlm-sheet-content</code>.',
      control: 'boolean',
    },
    title: {
      description: 'Sheet title.',
      control: 'text',
    },
    description: {
      description: 'Sheet description.',
      control: 'text',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <hlm-sheet [side]="side">
        <button type="button" hlmBtn variant="outline" hlmSheetTrigger>Open preferences</button>
        <hlm-sheet-content *hlmSheetPortal="let context" [showCloseButton]="showCloseButton">
          <div hlmSheetHeader>
            <h2 hlmSheetTitle>{{ title }}</h2>
            <p hlmSheetDescription>{{ description }}</p>
          </div>
          <div class="space-y-3 px-4 text-sm">
            <label class="flex items-center gap-2"><input type="checkbox" checked /> Weekly summary</label>
            <label class="flex items-center gap-2"><input type="checkbox" /> Product announcements</label>
          </div>
          <div hlmSheetFooter>
            <button type="button" hlmBtn hlmSheetClose>Save preferences</button>
          </div>
        </hlm-sheet-content>
      </hlm-sheet>
    `,
  }),
};

export default meta;

type Story = StoryObj<SheetStoryArgs>;

export const Default: Story = {};

export const FromTheLeft: Story = {
  args: {
    side: 'left',
    title: 'Navigation',
    description: 'Jump to any section of your knowledge box.',
  },
};

export const FromTheTop: Story = {
  args: {
    side: 'top',
    title: 'Announcement',
    description: 'A new version of the search widget is available.',
  },
};

export const FromTheBottom: Story = {
  args: {
    side: 'bottom',
    title: 'Filters',
    description: 'Narrow down the resources shown in the list.',
  },
};

export const WithoutCloseButton: Story = {
  args: {
    showCloseButton: false,
    title: 'Review changes',
    description: 'Use the footer button to close this panel.',
  },
};

export const WithForm: Story = {
  parameters: {
    controls: {
      disable: true,
    },
  },
  render: () => ({
    template: `
      <hlm-sheet side="right">
        <button type="button" hlmBtn hlmSheetTrigger>Edit profile</button>
        <hlm-sheet-content *hlmSheetPortal="let context">
          <div hlmSheetHeader>
            <h2 hlmSheetTitle>Edit profile</h2>
            <p hlmSheetDescription>Make changes to your profile here. Click save when you are done.</p>
          </div>
          <div class="grid gap-4 px-4">
            <div class="grid gap-2">
              <label hlmLabel for="sheet-name">Name</label>
              <input hlmInput id="sheet-name" value="Ana Torres" />
            </div>
            <div class="grid gap-2">
              <label hlmLabel for="sheet-email">Email</label>
              <input hlmInput id="sheet-email" type="email" value="ana@example.com" />
            </div>
          </div>
          <div hlmSheetFooter>
            <button type="button" hlmBtn hlmSheetClose>Save changes</button>
            <button type="button" hlmBtn variant="outline" hlmSheetClose>Cancel</button>
          </div>
        </hlm-sheet-content>
      </hlm-sheet>
    `,
  }),
};
