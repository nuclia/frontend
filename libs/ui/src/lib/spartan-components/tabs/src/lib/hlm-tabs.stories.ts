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
        component: `Organizes related content into panels, showing one panel at a time. Use tabs to switch between peer views or sections within the same context without leaving the page.`,
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
