import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCalendar, lucideFileText, lucideSettings, lucideUsers } from '@ng-icons/lucide';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmButton } from '../../../button/src/index';
import { HlmCommandImports } from '../index';
import { HlmCommand } from './hlm-command';

interface CommandStoryArgs {
  placeholder: string;
  disabled: boolean;
  search: string;
}

const meta: Meta<CommandStoryArgs> = {
  title: 'Spartan/Command',
  component: HlmCommand,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [HlmButton, NgIcon, ...HlmCommandImports],
      providers: [provideIcons({ lucideCalendar, lucideFileText, lucideSettings, lucideUsers })],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: `A searchable list of commands or destinations that users can navigate with the keyboard. Use it for command palettes and quick-action menus that help users find and perform tasks efficiently.
Import <code>HlmCommandImports</code> from <code>@nuclia/ui-spartan/command</code>.

Compose <code>hlmCommand</code> with <code>hlm-command-input</code> and an <code>hlm-command-list</code> holding one or more <code>hlmCommandGroup</code> (with <code>hlmCommandGroupLabel</code>) of <code>button[hlmCommandItem]</code>, separated by <code>hlmCommandSeparator</code>.
Each item needs a <code>value</code> (used for filtering) and emits <code>selected</code>; <code>hlmCommandShortcut</code> shows a keyboard hint inside an item.
Show a "no results" message with the structural directive <code>*hlmCommandEmptyState</code> wrapping an <code>hlmCommandEmpty</code> element.
On <code>hlmCommand</code>, use <code>[(search)]</code> to read or set the query, <code>valueChange</code> for the selected value, <code>filter</code> for a custom filter function and <code>disabled</code>.
To show the palette in a modal, wrap it in <code>hlm-command-dialog</code> (inputs <code>state</code>, <code>title</code>, <code>description</code>, output <code>stateChange</code>). Arrow keys move the highlight and Enter selects it.`,
      },
    },
  },
  args: {
    placeholder: 'Search actions...',
    disabled: false,
    search: '',
  },
  argTypes: {
    placeholder: {
      description: 'Placeholder of the search input (<code>hlm-command-input</code> input).',
      control: 'text',
    },
    disabled: {
      description: 'Disables the whole command.',
      control: 'boolean',
    },
    search: {
      description: 'Current search query. Supports two-way binding with <code>[(search)]</code>.',
      control: 'text',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <div hlmCommand [disabled]="disabled" [(search)]="search" class="w-full max-w-md rounded-lg border shadow-md">
        <hlm-command-input [placeholder]="placeholder" />
        <hlm-command-list>
          <div *hlmCommandEmptyState hlmCommandEmpty>No matching actions found.</div>
          <div hlmCommandGroup>
            <div hlmCommandGroupLabel>Suggestions</div>
            <button type="button" hlmCommandItem value="calendar">Open calendar</button>
            <button type="button" hlmCommandItem value="search">Search resources</button>
          </div>
          <div hlmCommandSeparator></div>
          <div hlmCommandGroup>
            <div hlmCommandGroupLabel>Workspace</div>
            <button type="button" hlmCommandItem value="settings">Workspace settings</button>
            <button type="button" hlmCommandItem value="members">Manage members</button>
          </div>
        </hlm-command-list>
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<CommandStoryArgs>;

export const Default: Story = {};

export const WithIconsAndShortcuts: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div hlmCommand [disabled]="disabled" [(search)]="search" class="w-full max-w-md rounded-lg border shadow-md">
        <hlm-command-input [placeholder]="placeholder" />
        <hlm-command-list>
          <div *hlmCommandEmptyState hlmCommandEmpty>No matching actions found.</div>
          <div hlmCommandGroup>
            <div hlmCommandGroupLabel>Suggestions</div>
            <button type="button" hlmCommandItem value="calendar">
              <ng-icon name="lucideCalendar" />
              Open calendar
              <span hlmCommandShortcut>⌘K</span>
            </button>
            <button type="button" hlmCommandItem value="documents">
              <ng-icon name="lucideFileText" />
              Browse documents
              <span hlmCommandShortcut>⌘D</span>
            </button>
          </div>
          <div hlmCommandSeparator></div>
          <div hlmCommandGroup>
            <div hlmCommandGroupLabel>Workspace</div>
            <button type="button" hlmCommandItem value="members">
              <ng-icon name="lucideUsers" />
              Manage members
            </button>
            <button type="button" hlmCommandItem value="settings">
              <ng-icon name="lucideSettings" />
              Workspace settings
              <span hlmCommandShortcut>⌘,</span>
            </button>
            <button type="button" hlmCommandItem value="billing" [disabled]="true">
              <ng-icon name="lucideFileText" />
              Billing (unavailable)
            </button>
          </div>
        </hlm-command-list>
      </div>
    `,
  }),
};

export const NoResults: Story = {
  args: {
    placeholder: 'Search projects...',
    search: 'zzz',
  },
  render: (args) => ({
    props: args,
    template: `
      <div hlmCommand [disabled]="disabled" [(search)]="search" class="w-full max-w-md rounded-lg border shadow-md">
        <hlm-command-input [placeholder]="placeholder" />
        <hlm-command-list>
          <div *hlmCommandEmptyState hlmCommandEmpty>
            <p class="font-medium">No projects found</p>
            <p class="text-muted-foreground text-sm">Try a different name or create a project.</p>
          </div>
          <div hlmCommandGroup>
            <button type="button" hlmCommandItem value="atlas">Atlas redesign</button>
            <button type="button" hlmCommandItem value="orion">Orion migration</button>
          </div>
        </hlm-command-list>
      </div>
    `,
  }),
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const InDialog: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    props: { dialogState: 'closed' },
    template: `
      <button type="button" hlmBtn variant="outline" (click)="dialogState = 'open'">Open command palette</button>
      <hlm-command-dialog [state]="dialogState" (stateChange)="dialogState = $event">
        <div hlmCommand>
          <hlm-command-input placeholder="Type a command or search..." />
          <hlm-command-list>
            <div *hlmCommandEmptyState hlmCommandEmpty>No results found.</div>
            <div hlmCommandGroup>
              <div hlmCommandGroupLabel>Suggestions</div>
              <button type="button" hlmCommandItem value="calendar" (selected)="dialogState = 'closed'">
                <ng-icon name="lucideCalendar" />
                Calendar
              </button>
              <button type="button" hlmCommandItem value="settings" (selected)="dialogState = 'closed'">
                <ng-icon name="lucideSettings" />
                Settings
              </button>
            </div>
          </hlm-command-list>
        </div>
      </hlm-command-dialog>
    `,
  }),
};
