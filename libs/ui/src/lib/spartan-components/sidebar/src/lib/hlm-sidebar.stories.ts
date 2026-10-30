import { applicationConfig, moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideFolderKanban, lucideHouse, lucidePlus, lucideUsers } from '@ng-icons/lucide';
import { HlmSidebarImports } from '../index';
import { HlmSidebar } from './hlm-sidebar';

interface SidebarStoryArgs {
  side: 'left' | 'right';
  variant: 'sidebar' | 'floating' | 'inset';
  collapsible: 'offcanvas' | 'icon' | 'none';
  srOnlySheetTitle: string;
}

const meta: Meta<SidebarStoryArgs> = {
  title: 'Spartan/Sidebar',
  component: HlmSidebar,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [provideIcons({ lucideFolderKanban, lucideHouse, lucidePlus, lucideUsers })],
    }),
    moduleMetadata({ imports: [...HlmSidebarImports, NgIcon] }),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      story: { inline: false, iframeHeight: 520 },
      description: {
        component: `A side panel that organizes navigation and supporting actions alongside the main content. Use it for application sections, nested destinations, and workspace controls, with collapsible layouts to leave more room for the current task.
Import <code>HlmSidebarImports</code> from <code>@nuclia/ui-spartan/sidebar</code> and wrap the page in <code>hlmSidebarWrapper</code> containing <code>hlm-sidebar</code> and a <code>main[hlmSidebarInset]</code>.

Inside <code>hlm-sidebar</code> compose <code>hlmSidebarHeader</code>, <code>hlmSidebarContent</code> (with <code>hlmSidebarGroup</code>, <code>hlmSidebarGroupLabel</code>, <code>hlmSidebarGroupContent</code>), <code>hlmSidebarMenu</code> / <code>hlmSidebarMenuItem</code> / <code>hlmSidebarMenuButton</code> (<code>isActive</code>, <code>size</code>, <code>variant</code>, <code>tooltip</code>), optional <code>hlmSidebarMenuBadge</code>, <code>hlmSidebarMenuSub</code> and <code>hlmSidebarFooter</code>.
Configure <code>side</code>, <code>variant</code> (<code>sidebar</code>, <code>floating</code>, <code>inset</code>) and <code>collapsible</code> (<code>offcanvas</code>, <code>icon</code>, <code>none</code>) on <code>hlm-sidebar</code>. Add <code>button[hlmSidebarTrigger]</code> (or <code>hlmSidebarRail</code>) to toggle it; <code>Ctrl/Cmd + B</code> works too. On narrow screens the sidebar opens as a sheet; <code>srOnlySheetTitle</code> and <code>srOnlySheetDescription</code> label it for screen readers.
Open and collapsed state is shared through <code>HlmSidebarService</code> (persisted in a cookie) and defaults can be changed with <code>provideHlmSidebarConfig()</code>. Use <code>&lt;nav aria-label&gt;</code> around the menu in real pages, and an <code>aria-label</code> on icon-only triggers.`,
      },
    },
  },
  args: {
    side: 'left',
    variant: 'sidebar',
    collapsible: 'none',
    srOnlySheetTitle: 'Navigation',
  },
  argTypes: {
    side: {
      description: 'Side of the screen where the sidebar is displayed.',
      control: 'inline-radio',
      options: ['left', 'right'],
    },
    variant: {
      description: 'Visual style of the sidebar: attached to the edge, floating card, or inset content area.',
      control: 'inline-radio',
      options: ['sidebar', 'floating', 'inset'],
    },
    collapsible: {
      description:
        'How the sidebar collapses: slides fully off-canvas, shrinks to an icon rail, or never collapses (none).',
      control: 'inline-radio',
      options: ['offcanvas', 'icon', 'none'],
    },
    srOnlySheetTitle: {
      description: 'Screen-reader title of the sheet used on mobile.',
      control: 'text',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <div
        hlmSidebarWrapper
        class="h-svh min-h-[420px] transform-gpu overflow-hidden rounded-lg border"
        [class.flex-row-reverse]="side === 'right'"
      >
        <hlm-sidebar
          [side]="side"
          [variant]="variant"
          [collapsible]="collapsible"
          [srOnlySheetTitle]="srOnlySheetTitle"
        >
          <div hlmSidebarHeader>
            <h2 class="flex items-center gap-2 px-2 font-semibold">
              <ng-icon name="lucideHouse" />
              <span class="group-data-[collapsible=icon]:hidden">Northstar</span>
            </h2>
          </div>
          <div hlmSidebarContent>
            <section hlmSidebarGroup>
              <div hlmSidebarGroupLabel>Workspace</div>
              <div hlmSidebarGroupContent>
                <ul hlmSidebarMenu>
                  <li hlmSidebarMenuItem>
                    <button type="button" hlmSidebarMenuButton isActive tooltip="Overview">
                      <ng-icon name="lucideHouse" />
                      <span>Overview</span>
                    </button>
                  </li>
                  <li hlmSidebarMenuItem>
                    <button type="button" hlmSidebarMenuButton tooltip="Projects">
                      <ng-icon name="lucideFolderKanban" />
                      <span>Projects</span>
                    </button>
                  </li>
                  <li hlmSidebarMenuItem>
                    <button type="button" hlmSidebarMenuButton tooltip="Team">
                      <ng-icon name="lucideUsers" />
                      <span>Team</span>
                    </button>
                  </li>
                </ul>
              </div>
            </section>
          </div>
          <div hlmSidebarFooter><p class="px-2 text-sm group-data-[collapsible=icon]:hidden">Jordan Lee</p></div>
        </hlm-sidebar>
        <main hlmSidebarInset class="p-6">
          <header class="mb-4 flex items-center gap-2">
            @if (collapsible !== 'none') {
              <button type="button" hlmSidebarTrigger></button>
            }
            <h2 class="text-lg font-semibold">Workspace overview</h2>
          </header>
          <p class="text-sm text-muted-foreground">Choose a section from the navigation.</p>
        </main>
      </div>
    `,
  }),
};

export default meta;

type Story = StoryObj<SidebarStoryArgs>;

export const Default: Story = {};

export const CollapsibleToIcons: Story = {
  args: {
    collapsible: 'icon',
  },
};

export const Offcanvas: Story = {
  args: {
    collapsible: 'offcanvas',
  },
};

export const Floating: Story = {
  args: {
    variant: 'floating',
    collapsible: 'icon',
  },
};

export const Inset: Story = {
  args: {
    variant: 'inset',
    collapsible: 'icon',
  },
};

export const RightSide: Story = {
  args: {
    side: 'right',
    collapsible: 'offcanvas',
  },
};

export const WithBadgesAndSubMenu: Story = {
  parameters: {
    controls: {
      disable: true,
    },
  },
  render: () => ({
    template: `
      <div hlmSidebarWrapper class="h-svh min-h-[420px] transform-gpu overflow-hidden rounded-lg border">
        <hlm-sidebar collapsible="none">
          <div hlmSidebarHeader>
            <input hlmSidebarInput type="search" placeholder="Search…" aria-label="Search navigation" />
          </div>
          <div hlmSidebarContent>
            <section hlmSidebarGroup>
              <div hlmSidebarGroupLabel>Projects</div>
              <button type="button" hlmSidebarGroupAction aria-label="Add project">
                <ng-icon name="lucidePlus" />
              </button>
              <div hlmSidebarGroupContent>
                <ul hlmSidebarMenu>
                  <li hlmSidebarMenuItem>
                    <button type="button" hlmSidebarMenuButton isActive>
                      <ng-icon name="lucideFolderKanban" />
                      <span>Atlas redesign</span>
                    </button>
                    <span hlmSidebarMenuBadge>12</span>
                    <ul hlmSidebarMenuSub>
                      <li hlmSidebarMenuSubItem>
                        <a href="#planning" hlmSidebarMenuSubButton isActive>Planning</a>
                      </li>
                      <li hlmSidebarMenuSubItem>
                        <a href="#research" hlmSidebarMenuSubButton>Research</a>
                      </li>
                    </ul>
                  </li>
                  <li hlmSidebarMenuItem>
                    <button type="button" hlmSidebarMenuButton>
                      <ng-icon name="lucideUsers" />
                      <span>Customer interviews</span>
                    </button>
                    <span hlmSidebarMenuBadge>3</span>
                  </li>
                </ul>
              </div>
            </section>
            <hr hlmSidebarSeparator />
            <section hlmSidebarGroup>
              <div hlmSidebarGroupLabel>Loading</div>
              <ul hlmSidebarMenu>
                <li hlmSidebarMenuItem><div hlmSidebarMenuSkeleton showIcon></div></li>
                <li hlmSidebarMenuItem><div hlmSidebarMenuSkeleton></div></li>
              </ul>
            </section>
          </div>
        </hlm-sidebar>
        <main hlmSidebarInset class="p-6">
          <h2 class="text-lg font-semibold">Atlas redesign</h2>
          <p class="text-sm text-muted-foreground">Planning notes and research for the next release.</p>
        </main>
      </div>
    `,
  }),
};
