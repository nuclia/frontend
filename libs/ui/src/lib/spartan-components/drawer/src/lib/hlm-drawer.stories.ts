import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmButton } from '../../../button/src/index';
import { HlmDrawerImports } from '../index';
import { HlmDrawer } from './hlm-drawer';

const meta: Meta = {
  title: 'Spartan/Drawer',
  component: HlmDrawer,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [HlmButton, ...HlmDrawerImports] })],
  parameters: {
    docs: {
      description: {
        component: `Import <code>HlmDrawerImports</code> or the drawer, trigger, portal, content, header, title, description, footer, and close primitives from <code>@nuclia/ui-spartan/drawer</code>. Compose a trigger with a portal template and labelled content; the drawer content supports the drawer's directional presentation and drag handle. Provide a title and description, retain a clear close action, and verify that the underlying page remains understandable when the drawer is open.`,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `
      <hlm-drawer>
        <button type="button" hlmBtn hlmDrawerTrigger>Open project details</button>
        <hlm-drawer-content *hlmDrawerPortal="let context">
          <div hlmDrawerHeader>
            <h2 hlmDrawerTitle>Project details</h2>
            <p hlmDrawerDescription>Review the current workspace project information.</p>
          </div>
          <div class="px-4 py-2">
            <p class="font-medium">Atlas redesign</p>
            <p class="text-sm text-muted-foreground">Owned by the Product team</p>
          </div>
          <div hlmDrawerFooter>
            <button type="button" hlmBtn hlmDrawerClose>Close details</button>
          </div>
        </hlm-drawer-content>
      </hlm-drawer>
    `,
  }),
};

export const FromTheLeft: Story = {
  render: () => ({
    template: `
      <hlm-drawer>
        <button type="button" hlmBtn hlmDrawerTrigger side="left">Open navigation drawer</button>
        <hlm-drawer-content *hlmDrawerPortal="let context">
          <div hlmDrawerHeader>
            <h2 hlmDrawerTitle>Workspace navigation</h2>
            <p hlmDrawerDescription>Choose a workspace section.</p>
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
