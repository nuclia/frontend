import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCopy, lucideLogOut, lucidePencil, lucideTrash2, lucideUser } from '@ng-icons/lucide';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmButton } from '../../../button/src/index';
import { HlmDropdownMenuImports } from '../index';
import { HlmDropdownMenu } from './hlm-dropdown-menu';

interface DropdownMenuStoryArgs {
  side: 'top' | 'bottom' | 'left' | 'right';
  align: 'start' | 'center' | 'end';
  sideOffset: number;
  triggerLabel: string;
}

const meta: Meta<DropdownMenuStoryArgs> = {
  title: 'Spartan/Dropdown Menu',
  component: HlmDropdownMenu,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [HlmButton, NgIcon, ...HlmDropdownMenuImports],
      providers: [provideIcons({ lucideCopy, lucideLogOut, lucidePencil, lucideTrash2, lucideUser })],
    }),
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `Open a menu of actions or options from a button. Use it to keep secondary commands, account actions or related choices available without displaying them all on the page.
Import <code>HlmDropdownMenuImports</code> from <code>@nuclia/ui-spartan/dropdown-menu</code> (and <code>HlmButton</code> from <code>@nuclia/ui-spartan/button</code> for the trigger).

Define the menu in an <code>&lt;ng-template #menu&gt;</code> whose root is <code>hlmDropdownMenu</code> (set an <code>aria-label</code>), then bind it on the trigger with <code>[hlmDropdownMenuTrigger]="menu"</code>. The trigger accepts <code>side</code> and <code>align</code>.
Inside the menu use <code>button[hlmDropdownMenuItem]</code> (inputs <code>disabled</code>, <code>variant="destructive"</code>, <code>inset</code>; output <code>triggered</code>), <code>hlmDropdownMenuLabel</code>, <code>hlmDropdownMenuSeparator</code>, <code>hlmDropdownMenuShortcut</code> and <code>hlmDropdownMenuGroup</code>.
For toggles use <code>hlmDropdownMenuCheckbox</code> and, inside a group, <code>hlmDropdownMenuRadio</code>, each with <code>hlm-dropdown-menu-checkbox-indicator</code> / <code>hlm-dropdown-menu-radio-indicator</code>. For nested menus use <code>[hlmDropdownMenuSubTrigger]</code> on an item pointing to a template whose root is <code>hlmDropdownMenuSub</code>.
Keyboard navigation (arrows, Home/End, Enter, Escape) is provided by the CDK menu.`,
      },
    },
  },
  args: {
    side: 'bottom',
    align: 'start',
    sideOffset: 1,
    triggerLabel: 'Project actions',
  },
  argTypes: {
    side: {
      description: 'Side of the trigger where the menu opens (<code>hlmDropdownMenuTrigger</code> input).',
      control: 'inline-radio',
      options: ['top', 'bottom', 'left', 'right'],
    },
    align: {
      description: 'Alignment of the menu relative to the trigger (<code>hlmDropdownMenuTrigger</code> input).',
      control: 'inline-radio',
      options: ['start', 'center', 'end'],
    },
    sideOffset: {
      description: 'Distance in pixels between the trigger and the menu (<code>hlmDropdownMenu</code> input).',
      control: 'number',
    },
    triggerLabel: {
      description: 'Label of the trigger button (story-only argument).',
      control: 'text',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <ng-template #projectMenu>
        <div hlmDropdownMenu aria-label="Project actions" [sideOffset]="sideOffset">
          <div hlmDropdownMenuLabel>Project</div>
          <button type="button" hlmDropdownMenuItem>
            Open project <span hlmDropdownMenuShortcut>⌘O</span>
          </button>
          <button type="button" hlmDropdownMenuItem>
            Duplicate project <span hlmDropdownMenuShortcut>⌘D</span>
          </button>
          <div hlmDropdownMenuSeparator></div>
          <button type="button" hlmDropdownMenuItem [disabled]="true">Share project</button>
          <button type="button" hlmDropdownMenuItem variant="destructive">Delete project</button>
        </div>
      </ng-template>
      <button type="button" hlmBtn variant="outline" [hlmDropdownMenuTrigger]="projectMenu" [side]="side" [align]="align">
        {{ triggerLabel }}
      </button>
    `,
  }),
};

export default meta;
type Story = StoryObj<DropdownMenuStoryArgs>;

export const Default: Story = {};

export const AlignedToEnd: Story = {
  args: {
    align: 'end',
    triggerLabel: 'Account menu',
  },
  render: (args) => ({
    props: args,
    template: `
      <ng-template #accountMenu>
        <div hlmDropdownMenu aria-label="Account actions" [sideOffset]="sideOffset">
          <div hlmDropdownMenuLabel>Jordan Lee</div>
          <button type="button" hlmDropdownMenuItem>Account settings</button>
          <button type="button" hlmDropdownMenuItem>Sign out</button>
        </div>
      </ng-template>
      <button type="button" hlmBtn variant="outline" [hlmDropdownMenuTrigger]="accountMenu" [side]="side" [align]="align">
        {{ triggerLabel }}
      </button>
    `,
  }),
};

export const WithIcons: Story = {
  args: {
    triggerLabel: 'Document actions',
  },
  render: (args) => ({
    props: args,
    template: `
      <ng-template #documentMenu>
        <div hlmDropdownMenu aria-label="Document actions" [sideOffset]="sideOffset">
          <button type="button" hlmDropdownMenuItem>
            <ng-icon name="lucidePencil" />
            Rename
          </button>
          <button type="button" hlmDropdownMenuItem>
            <ng-icon name="lucideCopy" />
            Duplicate
          </button>
          <div hlmDropdownMenuSeparator></div>
          <button type="button" hlmDropdownMenuItem variant="destructive">
            <ng-icon name="lucideTrash2" />
            Delete
          </button>
        </div>
      </ng-template>
      <button type="button" hlmBtn variant="outline" [hlmDropdownMenuTrigger]="documentMenu" [side]="side" [align]="align">
        {{ triggerLabel }}
      </button>
    `,
  }),
};

export const WithCheckboxItems: Story = {
  args: {
    triggerLabel: 'View options',
  },
  render: (args) => ({
    props: args,
    template: `
      <ng-template #viewMenu>
        <div hlmDropdownMenu aria-label="View options" [sideOffset]="sideOffset">
          <div hlmDropdownMenuLabel>Appearance</div>
          <div hlmDropdownMenuSeparator></div>
          <button type="button" hlmDropdownMenuCheckbox [checked]="true">
            Status bar
            <hlm-dropdown-menu-checkbox-indicator />
          </button>
          <button type="button" hlmDropdownMenuCheckbox>
            Activity bar
            <hlm-dropdown-menu-checkbox-indicator />
          </button>
          <button type="button" hlmDropdownMenuCheckbox [disabled]="true">
            Panel (unavailable)
            <hlm-dropdown-menu-checkbox-indicator />
          </button>
        </div>
      </ng-template>
      <button type="button" hlmBtn variant="outline" [hlmDropdownMenuTrigger]="viewMenu" [side]="side" [align]="align">
        {{ triggerLabel }}
      </button>
    `,
  }),
};

export const WithRadioItems: Story = {
  args: {
    triggerLabel: 'Sort by',
  },
  render: (args) => ({
    props: args,
    template: `
      <ng-template #sortMenu>
        <div hlmDropdownMenu aria-label="Sort resources" [sideOffset]="sideOffset">
          <div hlmDropdownMenuLabel>Sort resources by</div>
          <div hlmDropdownMenuSeparator></div>
          <div hlmDropdownMenuGroup>
            <button type="button" hlmDropdownMenuRadio [checked]="true">
              Creation date
              <hlm-dropdown-menu-radio-indicator />
            </button>
            <button type="button" hlmDropdownMenuRadio>
              Title
              <hlm-dropdown-menu-radio-indicator />
            </button>
            <button type="button" hlmDropdownMenuRadio>
              Size
              <hlm-dropdown-menu-radio-indicator />
            </button>
          </div>
        </div>
      </ng-template>
      <button type="button" hlmBtn variant="outline" [hlmDropdownMenuTrigger]="sortMenu" [side]="side" [align]="align">
        {{ triggerLabel }}
      </button>
    `,
  }),
};

export const WithSubmenu: Story = {
  args: {
    triggerLabel: 'Account',
  },
  render: (args) => ({
    props: args,
    template: `
      <ng-template #shareMenu>
        <div hlmDropdownMenuSub aria-label="Share options">
          <button type="button" hlmDropdownMenuItem>Email link</button>
          <button type="button" hlmDropdownMenuItem>Copy public link</button>
        </div>
      </ng-template>
      <ng-template #accountMenu>
        <div hlmDropdownMenu aria-label="Account actions" [sideOffset]="sideOffset">
          <button type="button" hlmDropdownMenuItem>
            <ng-icon name="lucideUser" />
            Profile
          </button>
          <button type="button" hlmDropdownMenuItem [hlmDropdownMenuSubTrigger]="shareMenu">
            Share
            <hlm-dropdown-menu-item-sub-indicator />
          </button>
          <div hlmDropdownMenuSeparator></div>
          <button type="button" hlmDropdownMenuItem>
            <ng-icon name="lucideLogOut" />
            Sign out
          </button>
        </div>
      </ng-template>
      <button type="button" hlmBtn variant="outline" [hlmDropdownMenuTrigger]="accountMenu" [side]="side" [align]="align">
        {{ triggerLabel }}
      </button>
    `,
  }),
};
