import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCopy, lucidePencil, lucideTrash2 } from '@ng-icons/lucide';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmDropdownMenuImports } from '../../../dropdown-menu/src/index';
import { HlmContextMenuImports } from '../index';
import { HlmContextMenuTrigger } from './hlm-context-menu-trigger';

interface ContextMenuStoryArgs {
  disabled: boolean;
  side: 'top' | 'bottom' | 'left' | 'right';
  align: 'start' | 'center' | 'end';
  triggerText: string;
}

const meta: Meta<ContextMenuStoryArgs> = {
  title: 'Spartan/Context Menu',
  component: HlmContextMenuTrigger,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [NgIcon, ...HlmContextMenuImports, ...HlmDropdownMenuImports],
      providers: [provideIcons({ lucideCopy, lucidePencil, lucideTrash2 })],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: `Show actions relevant to a particular item or area when users open its context menu, typically with a right-click. Use it as a shortcut to contextual actions, never as their only point of access.
Import <code>HlmContextMenuImports</code> from <code>@nuclia/ui-spartan/context-menu</code>. The menu content reuses the dropdown menu parts, so also import <code>HlmDropdownMenuImports</code> from <code>@nuclia/ui-spartan/dropdown-menu</code>.

Define the menu in an <code>&lt;ng-template #menu&gt;</code> whose root is <code>hlmDropdownMenu</code> (set an <code>aria-label</code>) and bind it on the target area with <code>[hlmContextMenuTrigger]="menu"</code>.
The trigger accepts <code>disabled</code>, <code>side</code> and <code>align</code>, <code>[hlmContextMenuTriggerData]</code> to pass context to the template, and emits <code>hlmContextMenuOpened</code> / <code>hlmContextMenuClosed</code>.
Fill the menu with <code>hlmDropdownMenuItem</code>, <code>hlmDropdownMenuLabel</code>, <code>hlmDropdownMenuSeparator</code>, <code>hlmDropdownMenuCheckbox</code>… exactly like a dropdown menu. Touch and keyboard users can open it with a long press or the context-menu key.`,
      },
    },
  },
  args: {
    disabled: false,
    side: 'bottom',
    align: 'start',
    triggerText: 'Right-click here',
  },
  argTypes: {
    disabled: {
      description: 'Disables the context menu so the browser menu is shown instead.',
      control: 'boolean',
    },
    side: {
      description: 'Side of the pointer where the menu opens.',
      control: 'inline-radio',
      options: ['top', 'bottom', 'left', 'right'],
    },
    align: {
      description: 'Alignment of the menu relative to the pointer.',
      control: 'inline-radio',
      options: ['start', 'center', 'end'],
    },
    triggerText: {
      description: 'Text displayed in the target area (story-only argument).',
      control: 'text',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <ng-template #actionsMenu>
        <div hlmDropdownMenu aria-label="Document actions">
          <button type="button" hlmDropdownMenuItem>Open document</button>
          <button type="button" hlmDropdownMenuItem>Rename document</button>
          <div hlmDropdownMenuSeparator></div>
          <button type="button" hlmDropdownMenuItem variant="destructive">Move to trash</button>
        </div>
      </ng-template>
      <div
        [hlmContextMenuTrigger]="actionsMenu"
        [disabled]="disabled"
        [side]="side"
        [align]="align"
        class="bg-neutral-50 flex p-12 w-50 items-center justify-center rounded-xl border border-dashed text-sm"
      >
        {{ triggerText }}
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<ContextMenuStoryArgs>;

export const Default: Story = {};

export const WithIconsAndShortcuts: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ng-template #actionsMenu>
        <div hlmDropdownMenu aria-label="Document actions">
          <div hlmDropdownMenuLabel>Document</div>
          <button type="button" hlmDropdownMenuItem>
            <ng-icon name="lucidePencil" />
            Rename <span hlmDropdownMenuShortcut>F2</span>
          </button>
          <button type="button" hlmDropdownMenuItem>
            <ng-icon name="lucideCopy" />
            Duplicate <span hlmDropdownMenuShortcut>⌘D</span>
          </button>
          <div hlmDropdownMenuSeparator></div>
          <button type="button" hlmDropdownMenuItem variant="destructive">
            <ng-icon name="lucideTrash2" />
            Move to trash <span hlmDropdownMenuShortcut>⌫</span>
          </button>
        </div>
      </ng-template>
      <div
        [hlmContextMenuTrigger]="actionsMenu"
        [disabled]="disabled"
        [side]="side"
        [align]="align"
        class="bg-neutral-50 flex p-12 w-50 items-center justify-center rounded-xl border border-dashed text-sm"
      >
        {{ triggerText }}
      </div>
    `,
  }),
};

export const WithCheckboxItems: Story = {
  args: {
    triggerText: 'Right-click the toolbar',
  },
  render: (args) => ({
    props: args,
    template: `
      <ng-template #viewMenu>
        <div hlmDropdownMenu aria-label="Toolbar options">
          <div hlmDropdownMenuLabel>Show in toolbar</div>
          <div hlmDropdownMenuSeparator></div>
          <button type="button" hlmDropdownMenuCheckbox [checked]="true">
            Bookmarks
            <hlm-dropdown-menu-checkbox-indicator />
          </button>
          <button type="button" hlmDropdownMenuCheckbox>
            Full URLs
            <hlm-dropdown-menu-checkbox-indicator />
          </button>
        </div>
      </ng-template>
      <div
        [hlmContextMenuTrigger]="viewMenu"
        [disabled]="disabled"
        [side]="side"
        [align]="align"
        class="bg-neutral-50 flex p-12 w-50 items-center justify-center rounded-xl border border-dashed text-sm"
      >
        {{ triggerText }}
      </div>
    `,
  }),
};

export const Disabled: Story = {
  args: {
    disabled: true,
    triggerText: 'Context menu disabled',
  },
};
