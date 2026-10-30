import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmButton } from '../../../button/src/index';
import { HlmDrawerImports } from '../index';
import { HlmDrawer } from './hlm-drawer';

type DrawerDirection = 'bottom' | 'top' | 'left' | 'right';

interface DrawerStoryArgs {
  direction: DrawerDirection;
  title: string;
  description: string;
}

const meta: Meta<DrawerStoryArgs> = {
  title: 'Spartan/Drawer',
  component: HlmDrawer,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HlmButton, ...HlmDrawerImports] })],
  parameters: {
    docs: {
      description: {
        component: `A sliding dialog with a draggable surface, following the bottom-sheet pattern common on mobile devices. Use it for contextual details or short tasks that benefit from a touch-friendly overlay.
Import <code>HlmDrawerImports</code> from <code>@nuclia/ui-spartan/drawer</code> (and <code>HlmButton</code> from <code>@nuclia/ui-spartan/button</code> for the buttons).

Compose <code>hlm-drawer</code> with a <code>button[hlmDrawerTrigger]</code> and an <code>hlm-drawer-content</code> rendered through <code>*hlmDrawerPortal</code>.
Inside, use <code>hlmDrawerHeader</code> (with <code>hlmDrawerTitle</code> and <code>hlmDrawerDescription</code>) and <code>hlmDrawerFooter</code>; add <code>hlmDrawerClose</code> to any button that should close the drawer.
Set <code>direction</code> (<code>bottom</code>, <code>top</code>, <code>left</code> or <code>right</code>) on <code>hlm-drawer</code> to choose the edge it slides from. Dragging the content towards the edge closes it; <code>closeThreshold</code> on <code>hlm-drawer-content</code> tunes how far it must be dragged.
Always include a title so the drawer has an accessible name.`,
      },
    },
  },
  args: {
    direction: 'bottom',
    title: 'Project details',
    description: 'Review the current workspace project information.',
  },
  argTypes: {
    direction: {
      description: 'Edge of the screen the drawer slides in from (<code>hlm-drawer</code> input).',
      control: 'inline-radio',
      options: ['bottom', 'top', 'left', 'right'],
    },
    title: {
      description: 'Drawer title (story-only argument).',
      control: 'text',
    },
    description: {
      description: 'Drawer description (story-only argument).',
      control: 'text',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <hlm-drawer [direction]="direction">
        <button type="button" hlmBtn variant="outline" hlmDrawerTrigger>Open project details</button>
        <hlm-drawer-content *hlmDrawerPortal="let context">
          <div hlmDrawerHeader>
            <h2 hlmDrawerTitle>{{ title }}</h2>
            <p hlmDrawerDescription>{{ description }}</p>
          </div>
          <div class="px-4 py-2">
            <p class="font-medium">Atlas redesign</p>
            <p class="text-muted-foreground text-sm">Owned by the Product team</p>
          </div>
          <div hlmDrawerFooter>
            <button type="button" hlmBtn hlmDrawerClose>Close details</button>
          </div>
        </hlm-drawer-content>
      </hlm-drawer>
    `,
  }),
};

export default meta;
type Story = StoryObj<DrawerStoryArgs>;

export const Default: Story = {};

export const FromTheRight: Story = {
  args: {
    direction: 'right',
    title: 'Activity',
    description: 'Latest changes in this workspace.',
  },
};

export const FromTheTop: Story = {
  args: {
    direction: 'top',
    title: 'Announcements',
    description: 'What is new in the workspace this week.',
  },
};

export const FromTheLeft: Story = {
  args: {
    direction: 'left',
    title: 'Workspace navigation',
    description: 'Choose a workspace section.',
  },
  render: (args) => ({
    props: args,
    template: `
      <hlm-drawer [direction]="direction">
        <button type="button" hlmBtn variant="outline" hlmDrawerTrigger>Open navigation drawer</button>
        <hlm-drawer-content *hlmDrawerPortal="let context">
          <div hlmDrawerHeader>
            <h2 hlmDrawerTitle>{{ title }}</h2>
            <p hlmDrawerDescription>{{ description }}</p>
          </div>
          <nav aria-label="Workspace sections" class="grid gap-3 px-4">
            <a href="#projects">Projects</a>
            <a href="#activity">Activity</a>
            <a href="#settings">Settings</a>
          </nav>
          <div hlmDrawerFooter>
            <button type="button" hlmBtn hlmDrawerClose>Close navigation</button>
          </div>
        </hlm-drawer-content>
      </hlm-drawer>
    `,
  }),
};
