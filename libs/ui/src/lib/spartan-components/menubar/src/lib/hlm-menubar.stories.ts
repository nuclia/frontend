import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmDropdownMenuImports } from '../../../dropdown-menu/src/index';
import { HlmMenubarImports } from '../index';
import { HlmMenubar } from './hlm-menubar';

interface MenubarStoryArgs {
  align: 'start' | 'center' | 'end';
  side: 'top' | 'bottom' | 'left' | 'right';
  disabled: boolean;
}

const meta: Meta<MenubarStoryArgs> = {
  title: 'Spartan/Menubar',
  component: HlmMenubar,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmMenubarImports, ...HlmDropdownMenuImports] })],
  parameters: {
    docs: {
      description: {
        component: `A horizontal set of menus that organizes application commands into familiar categories. Use it for desktop-style interfaces with groups of actions such as File, Edit, and View.
Import <code>HlmMenubarImports</code> from <code>@nuclia/ui-spartan/menubar</code>, plus <code>HlmDropdownMenuImports</code> from <code>@nuclia/ui-spartan/dropdown-menu</code> for the menu content.

Put <code>hlmMenubar</code> on the container and one <code>button[hlmMenubarTrigger]</code> per menu, bound to an <code>ng-template</code> (<code>[hlmMenubarTrigger]="template"</code>) that contains a <code>hlmDropdownMenu</code> with <code>hlmDropdownMenuItem</code>, <code>hlmDropdownMenuSeparator</code>, <code>hlmDropdownMenuShortcut</code>… elements.
Each trigger has <code>disabled</code>, <code>align</code> (<code>start</code>, <code>center</code>, <code>end</code>) and <code>side</code> (<code>top</code>, <code>bottom</code>, <code>left</code>, <code>right</code>) inputs; defaults can be set with <code>provideHlmMenubarConfig</code>. Menu open/close events are available as <code>hlmDropdownMenuOpened</code> and <code>hlmDropdownMenuClosed</code>.
Keyboard navigation (arrow keys, Enter, Escape) is provided by the CDK menu. Give the bar and each menu an <code>aria-label</code>.`,
      },
    },
  },
  args: {
    align: 'start',
    side: 'bottom',
    disabled: false,
  },
  argTypes: {
    align: {
      description: 'Alignment of the opened menu relative to its trigger.',
      control: 'inline-radio',
      options: ['start', 'center', 'end'],
    },
    side: {
      description: 'Side of the trigger where the menu opens.',
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
    },
    disabled: {
      description: 'Disables every trigger of the menubar.',
      control: 'boolean',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <ng-template #fileActions>
        <div hlmDropdownMenu aria-label="File actions">
          <button type="button" hlmDropdownMenuItem>
            New document <span hlmDropdownMenuShortcut>⌘N</span>
          </button>
          <button type="button" hlmDropdownMenuItem>
            Open document <span hlmDropdownMenuShortcut>⌘O</span>
          </button>
          <div hlmDropdownMenuSeparator></div>
          <button type="button" hlmDropdownMenuItem>Export</button>
        </div>
      </ng-template>
      <ng-template #editActions>
        <div hlmDropdownMenu aria-label="Edit actions">
          <button type="button" hlmDropdownMenuItem>
            Undo <span hlmDropdownMenuShortcut>⌘Z</span>
          </button>
          <button type="button" hlmDropdownMenuItem>
            Redo <span hlmDropdownMenuShortcut>⇧⌘Z</span>
          </button>
          <div hlmDropdownMenuSeparator></div>
          <button type="button" hlmDropdownMenuItem>Select all</button>
        </div>
      </ng-template>
      <ng-template #viewActions>
        <div hlmDropdownMenu aria-label="View actions">
          <button type="button" hlmDropdownMenuItem>Zoom in</button>
          <button type="button" hlmDropdownMenuItem>Zoom out</button>
          <button type="button" hlmDropdownMenuItem>Full screen</button>
        </div>
      </ng-template>
      <div class="p-24">
        <div hlmMenubar aria-label="Document menu" class="w-fit">
          <button type="button" [hlmMenubarTrigger]="fileActions" [align]="align" [side]="side" [disabled]="disabled">
            File
          </button>
          <button type="button" [hlmMenubarTrigger]="editActions" [align]="align" [side]="side" [disabled]="disabled">
            Edit
          </button>
          <button type="button" [hlmMenubarTrigger]="viewActions" [align]="align" [side]="side" [disabled]="disabled">
            View
          </button>
        </div>
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<MenubarStoryArgs>;

export const Default: Story = {};

export const AlignedToEnd: Story = {
  args: {
    align: 'end',
  },
};

export const OpensAbove: Story = {
  args: {
    side: 'top',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const DisabledTrigger: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    template: `
      <ng-template #fileActions>
        <div hlmDropdownMenu aria-label="File actions">
          <button type="button" hlmDropdownMenuItem>New document</button>
          <button type="button" hlmDropdownMenuItem>Open document</button>
        </div>
      </ng-template>
      <ng-template #shareActions>
        <div hlmDropdownMenu aria-label="Share actions">
          <button type="button" hlmDropdownMenuItem>Copy link</button>
        </div>
      </ng-template>
      <div class="p-24">
        <div hlmMenubar aria-label="Document menu" class="w-fit">
          <button type="button" [hlmMenubarTrigger]="fileActions">File</button>
          <button type="button" [hlmMenubarTrigger]="shareActions" [disabled]="true">Share</button>
        </div>
      </div>
    `,
  }),
};
