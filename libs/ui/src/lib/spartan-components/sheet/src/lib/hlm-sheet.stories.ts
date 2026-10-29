import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmButton } from '../../../button/src/index';
import { HlmSheetImports } from '../index';
import { HlmSheet } from './hlm-sheet';

const meta: Meta = {
  title: 'Spartan/Sheet',
  component: HlmSheet,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HlmButton, ...HlmSheetImports] })],
  parameters: {
    docs: {
      description: {
        component: `A dialog that slides in from an edge of the screen to display content alongside the main view. Use it for details, filters, or editing tasks that benefit from a larger contextual panel.`,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `
      <hlm-sheet>
        <button type="button" hlmBtn hlmSheetTrigger>Open preferences</button>
        <hlm-sheet-content *hlmSheetPortal="let context">
          <div hlmSheetHeader>
            <h2 hlmSheetTitle>Preferences</h2>
            <p hlmSheetDescription>Choose how you receive workspace updates.</p>
          </div>
          <div class="space-y-3 px-4">
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

export const FromTheRight: Story = {
  render: () => ({
    template: `
      <hlm-sheet>
        <button type="button" hlmBtn hlmSheetTrigger side="right">Open account settings</button>
        <hlm-sheet-content *hlmSheetPortal="let context">
          <div hlmSheetHeader>
            <h2 hlmSheetTitle>Account settings</h2>
            <p hlmSheetDescription>Manage your profile and sign-in preferences.</p>
          </div>
          <div class="space-y-3 px-4">
            <a href="#profile">Profile information</a>
            <a href="#security">Security</a>
          </div>
          <div hlmSheetFooter>
            <button type="button" hlmBtn hlmSheetClose>Done</button>
          </div>
        </hlm-sheet-content>
      </hlm-sheet>
    `,
  }),
};
