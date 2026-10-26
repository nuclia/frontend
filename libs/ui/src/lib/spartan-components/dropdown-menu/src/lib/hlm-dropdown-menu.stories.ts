import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmButton } from '../../../button/src/index';
import { HlmDropdownMenuImports } from '../index';
import { HlmDropdownMenu } from './hlm-dropdown-menu';

const meta: Meta = {
  title: 'Spartan/Dropdown Menu',
  component: HlmDropdownMenu,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HlmButton, ...HlmDropdownMenuImports] })],
  parameters: {
    docs: {
      description: {
        component: `Import <code>HlmDropdownMenuImports</code> or the dropdown-menu trigger, panel, group, label, item, checkbox, radio, submenu, separator, shortcut, and indicator primitives from <code>@nuclia/ui-spartan/dropdown-menu</code>. Bind the trigger to an <code>ng-template</code> containing the menu panel. Menu items are keyboard navigable and manage focus; use buttons for actions, provide a descriptive trigger name, and group related commands with labels and separators.`,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `
      <ng-template #projectMenu>
        <div hlmDropdownMenu aria-label="Project actions">
          <div hlmDropdownMenuLabel>Project</div>
          <button type="button" hlmDropdownMenuItem>
            Open project <span hlmDropdownMenuShortcut>⌘O</span>
          </button>
          <button type="button" hlmDropdownMenuItem>
            Duplicate project <span hlmDropdownMenuShortcut>⌘D</span>
          </button>
          <div hlmDropdownMenuSeparator></div>
          <button type="button" hlmDropdownMenuItem disabled>Share project</button>
          <button type="button" hlmDropdownMenuItem variant="destructive">Delete project</button>
        </div>
      </ng-template>
      <button type="button" hlmBtn [hlmDropdownMenuTrigger]="projectMenu">Project actions</button>
    `,
  }),
};

export const AlignedToStart: Story = {
  render: () => ({
    template: `
      <ng-template #accountMenu>
        <div hlmDropdownMenu aria-label="Account actions">
          <div hlmDropdownMenuLabel>Jordan Lee</div>
          <button type="button" hlmDropdownMenuItem>Account settings</button>
          <button type="button" hlmDropdownMenuItem>Sign out</button>
        </div>
      </ng-template>
      <button type="button" hlmBtn [hlmDropdownMenuTrigger]="accountMenu" align="start">Account menu</button>
    `,
  }),
};
