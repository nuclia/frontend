import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmTabsImports } from '../index';
import { HlmTabs } from './hlm-tabs';

interface TabsStoryArgs {
  tab: string;
  orientation: 'horizontal' | 'vertical';
  activationMode: 'automatic' | 'manual';
  variant: 'default' | 'line';
  membersDisabled: boolean;
}

const meta: Meta<TabsStoryArgs> = {
  title: 'Spartan/Tabs',
  component: HlmTabs,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmTabsImports] })],
  parameters: {
    docs: {
      description: {
        component: `Organizes related content into panels, showing one panel at a time. Use tabs to switch between peer views or sections within the same context without leaving the page.
Import <code>HlmTabsImports</code> from <code>@nuclia/ui-spartan/tabs</code> and compose <code>hlmTabs</code> (root, with the active <code>tab</code> id), <code>hlmTabsList</code>, one <code>hlmTabsTrigger="id"</code> per tab and one <code>hlmTabsContent="id"</code> panel per trigger. Use <code>ng-template hlmTabsContentLazy</code> inside a panel to render its content only when first activated, and <code>hlm-paginated-tabs-list</code> when there are too many tabs to fit.

Set <code>orientation</code> and <code>activationMode</code> (automatic activates on focus, manual on Enter/Space) on the root, <code>variant</code> (<code>default</code> or <code>line</code>) on the list, and <code>disabled</code> on a trigger. Listen to <code>tabActivated</code> for the active tab id.
Keyboard arrows move between triggers. Give the list an <code>aria-label</code> describing the set of tabs.`,
      },
    },
  },
  args: {
    tab: 'overview',
    orientation: 'horizontal',
    activationMode: 'automatic',
    variant: 'default',
    membersDisabled: false,
  },
  argTypes: {
    tab: {
      description: 'Id of the active tab, matching an <code>hlmTabsTrigger</code> value.',
      control: 'select',
      options: ['overview', 'activity', 'members'],
    },
    orientation: {
      description: 'Layout direction of the tab list.',
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
    },
    activationMode: {
      description: 'Whether a tab is activated when focused (automatic) or only after Enter/Space (manual).',
      control: 'inline-radio',
      options: ['automatic', 'manual'],
    },
    variant: {
      description: 'Visual style of the tab list, set on <code>hlmTabsList</code>.',
      control: 'inline-radio',
      options: ['default', 'line'],
    },
    membersDisabled: {
      description: 'Disables the "Members" trigger (the <code>disabled</code> input of <code>hlmTabsTrigger</code>).',
      control: 'boolean',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <div hlmTabs [tab]="tab" [orientation]="orientation" [activationMode]="activationMode" class="w-full max-w-lg">
        <div hlmTabsList [variant]="variant" aria-label="Project details">
          <button type="button" hlmTabsTrigger="overview">Overview</button>
          <button type="button" hlmTabsTrigger="activity">Activity</button>
          <button type="button" hlmTabsTrigger="members" [disabled]="membersDisabled">Members</button>
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

export default meta;

type Story = StoryObj<TabsStoryArgs>;

export const Default: Story = {};

export const Line: Story = {
  args: {
    variant: 'line',
  },
};

export const ManualActivation: Story = {
  args: {
    activationMode: 'manual',
  },
};

export const DisabledTab: Story = {
  args: {
    membersDisabled: true,
  },
};

export const Vertical: Story = {
  args: {
    orientation: 'vertical',
  },
};

export const LazyContent: Story = {
  parameters: {
    controls: {
      disable: true,
    },
  },
  render: () => ({
    template: `
      <div hlmTabs tab="summary" class="w-full max-w-lg">
        <div hlmTabsList aria-label="Document views">
          <button type="button" hlmTabsTrigger="summary">Summary</button>
          <button type="button" hlmTabsTrigger="entities">Entities</button>
        </div>
        <section hlmTabsContent="summary" class="rounded-md border p-4">
          <ng-template hlmTabsContentLazy>
            <p class="text-sm text-muted-foreground">This panel is rendered the first time it is shown.</p>
          </ng-template>
        </section>
        <section hlmTabsContent="entities" class="rounded-md border p-4">
          <ng-template hlmTabsContentLazy>
            <p class="text-sm text-muted-foreground">Detected entities: Atlas, Jordan, Barcelona.</p>
          </ng-template>
        </section>
      </div>
    `,
  }),
};
