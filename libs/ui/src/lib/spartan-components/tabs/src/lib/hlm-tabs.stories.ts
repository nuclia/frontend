import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmTabsImports } from '../index';
import { HlmTabs } from './hlm-tabs';

const meta: Meta = {
  title: 'Spartan/Tabs',
  component: HlmTabs,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmTabsImports] })],
  parameters: {
    docs: {
      description: {
        component: `Import <code>HlmTabsImports</code> or the tabs root, list, trigger, content, lazy content, and paginated list primitives from <code>@nuclia/ui-spartan/tabs</code>. Give the root a selected <code>tab</code> value and make each trigger's <code>hlmTabsTrigger</code> value match its content's <code>hlmTabsContent</code> value. The underlying tabs primitive provides tablist/tab/tabpanel semantics and keyboard navigation; keep labels concise and ensure every panel has a corresponding trigger.`,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `
      <div hlmTabs tab="overview" class="w-full max-w-lg">
        <div hlmTabsList aria-label="Project details">
          <button type="button" hlmTabsTrigger="overview">Overview</button>
          <button type="button" hlmTabsTrigger="activity">Activity</button>
          <button type="button" hlmTabsTrigger="members">Members</button>
        </div>
        <section hlmTabsContent="overview" class="rounded-md border p-4">
          <h2 class="font-medium">Project overview</h2>
          <p class="text-sm text-muted-foreground">A shared space for the Atlas redesign.</p>
        </section>
        <section hlmTabsContent="activity" class="rounded-md border p-4">
          <h2 class="font-medium">Recent activity</h2>
          <p class="text-sm text-muted-foreground">Jordan updated the project plan today.</p>
        </section>
        <section hlmTabsContent="members" class="rounded-md border p-4">
          <h2 class="font-medium">Project members</h2>
          <p class="text-sm text-muted-foreground">Eight people are contributing to this project.</p>
        </section>
      </div>
    `,
  }),
};

export const Vertical: Story = {
  render: () => ({
    template: `
      <div hlmTabs tab="profile" orientation="vertical" class="w-full max-w-lg">
        <div hlmTabsList aria-label="Account settings">
          <button type="button" hlmTabsTrigger="profile">Profile</button>
          <button type="button" hlmTabsTrigger="security">Security</button>
          <button type="button" hlmTabsTrigger="notifications">Notifications</button>
        </div>
        <section hlmTabsContent="profile" class="rounded-md border p-4">
          <h2 class="font-medium">Profile settings</h2>
          <p class="text-sm text-muted-foreground">Manage your name and contact information.</p>
        </section>
        <section hlmTabsContent="security" class="rounded-md border p-4">
          <h2 class="font-medium">Security settings</h2>
          <p class="text-sm text-muted-foreground">Review sign-in and recovery options.</p>
        </section>
        <section hlmTabsContent="notifications" class="rounded-md border p-4">
          <h2 class="font-medium">Notification settings</h2>
          <p class="text-sm text-muted-foreground">Choose which updates you receive.</p>
        </section>
      </div>
    `,
  }),
};
