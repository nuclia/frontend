import { applicationConfig, moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideFolderKanban, lucideHouse, lucideUsers } from '@ng-icons/lucide';
import { HlmSidebarImports } from '../index';
import { HlmSidebar } from './hlm-sidebar';

const meta: Meta = {
  title: 'Spartan/Sidebar',
  component: HlmSidebar,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({ providers: [provideIcons({ lucideFolderKanban, lucideHouse, lucideUsers })] }),
    moduleMetadata({ imports: [...HlmSidebarImports, NgIcon] }),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `A side panel that organizes navigation and supporting actions alongside the main content. Use it for application sections, nested destinations, and workspace controls, with collapsible layouts to leave more room for the current task.`,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `
      <div hlmSidebarWrapper class="h-svh min-h-[420px] overflow-hidden rounded-lg border">
        <hlm-sidebar collapsible="none">
          <div hlmSidebarHeader>
            <h2 class="px-2 font-semibold">Northstar</h2>
          </div>
          <div hlmSidebarContent>
            <section hlmSidebarGroup>
              <div hlmSidebarGroupLabel>Workspace</div>
              <div hlmSidebarGroupContent>
                <ul hlmSidebarMenu>
                  <li hlmSidebarMenuItem><button type="button" hlmSidebarMenuButton isActive>Overview</button></li>
                  <li hlmSidebarMenuItem><button type="button" hlmSidebarMenuButton>Projects</button></li>
                  <li hlmSidebarMenuItem><button type="button" hlmSidebarMenuButton>Team</button></li>
                </ul>
              </div>
            </section>
          </div>
          <div hlmSidebarFooter><p class="px-2 text-sm">Jordan Lee</p></div>
        </hlm-sidebar>
        <main hlmSidebarInset class="p-6">
          <h2 class="text-lg font-semibold">Workspace overview</h2>
          <p class="text-sm text-muted-foreground">Choose a section from the navigation.</p>
        </main>
      </div>
    `,
  }),
};

export const Collapsible: Story = {
  render: () => ({
    template: `
      <div hlmSidebarWrapper class="h-svh min-h-[420px] overflow-hidden rounded-lg border">
        <hlm-sidebar collapsible="icon">
          <div hlmSidebarHeader>
            <h2 class="flex items-center gap-2 px-2 font-semibold">
              <ng-icon name="lucideHouse" />
              <span class="group-data-[collapsible=icon]:hidden">Northstar</span>
            </h2>
          </div>
          <div hlmSidebarContent>
            <section hlmSidebarGroup>
              <div hlmSidebarGroupLabel class="group-data-[collapsible=icon]:hidden">Workspace</div>
              <ul hlmSidebarMenu>
              <li hlmSidebarMenuItem>
                <button type="button" hlmSidebarMenuButton isActive>
                  <ng-icon name="lucideHouse" />
                  <span>Overview</span>
                </button>
              </li>
              <li hlmSidebarMenuItem>
                <button type="button" hlmSidebarMenuButton>
                  <ng-icon name="lucideFolderKanban" />
                  <span>Projects</span>
                </button>
              </li>
              <li hlmSidebarMenuItem>
                <button type="button" hlmSidebarMenuButton>
                  <ng-icon name="lucideUsers" />
                  <span>Team</span>
                </button>
              </li>
              </ul>
            </section>
          </div>
          <div hlmSidebarFooter><p class="px-2 text-sm group-data-[collapsible=icon]:hidden">Jordan Lee</p></div>
        </hlm-sidebar>
        <main hlmSidebarInset class="p-6">
          <header class="mb-4 flex items-center gap-2">
          <button type="button" hlmSidebarTrigger aria-label="Toggle sidebar"></button>
          <h2 class="text-lg font-semibold">Collapsible navigation</h2>
          </header>
          <p class="text-sm text-muted-foreground">Use the sidebar trigger to expand or collapse the navigation.</p>
        </main>
      </div>
    `,
  }),
};
