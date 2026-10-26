import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmCommandImports } from '../index';
import { HlmCommand } from './hlm-command';

const meta: Meta = {
  title: 'Spartan/Command',
  component: HlmCommand,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmCommandImports] })],
  parameters: {
    docs: {
      description: {
        component: `A searchable list of commands or destinations that users can navigate with the keyboard. Use it for command palettes and quick-action menus that help users find and perform tasks efficiently.`,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `
      <div hlmCommand class="w-full max-w-md rounded-lg border shadow-md">
        <hlm-command-input placeholder="Search actions..." />
        <hlm-command-list>
          <div hlmCommandEmpty>No matching actions found.</div>
          <div hlmCommandGroup>
            <div hlmCommandGroupLabel>Suggestions</div>
            <button type="button" hlmCommandItem value="calendar">
              Open calendar <span hlmCommandShortcut>⌘K</span>
            </button>
            <button type="button" hlmCommandItem value="search">
              Search resources <span hlmCommandShortcut>⌘S</span>
            </button>
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

export const Empty: Story = {
  render: () => ({
    template: `
      <div hlmCommand class="w-full max-w-md rounded-lg border shadow-md">
        <hlm-command-input placeholder="Search projects..." />
        <hlm-command-list>
          <div hlmCommandEmptyState>
            <p class="font-medium">No projects found</p>
            <p class="text-sm text-muted-foreground">Try a different name or create a project.</p>
          </div>
        </hlm-command-list>
      </div>
    `,
  }),
};
