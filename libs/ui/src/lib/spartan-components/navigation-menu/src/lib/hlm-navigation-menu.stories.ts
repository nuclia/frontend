import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmNavigationMenuImports } from '../index';
import { HlmNavigationMenu } from './hlm-navigation-menu';

interface NavigationMenuStoryArgs {
  orientation: 'horizontal' | 'vertical';
  openOn: 'hover' | 'click';
  delayDuration: number;
  skipDelayDuration: number;
}

const meta: Meta<NavigationMenuStoryArgs> = {
  title: 'Spartan/Navigation Menu',
  component: HlmNavigationMenu,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmNavigationMenuImports] })],
  parameters: {
    docs: {
      description: {
        component: `Organizes links to the main sections of a site or application, with expandable panels for related destinations. Use it for primary navigation rather than menus of commands or actions.
Import <code>HlmNavigationMenuImports</code> from <code>@nuclia/ui-spartan/navigation-menu</code> and compose <code>nav[hlmNavigationMenu]</code> &gt; <code>ul[hlmNavigationMenuList]</code> &gt; <code>li[hlmNavigationMenuItem]</code>.

An item holds either a plain <code>a[hlmNavigationMenuLink]</code>, or a <code>button[hlmNavigationMenuTrigger]</code> followed by <code>hlm-navigation-menu-content</code> with the <code>*hlmNavigationMenuPortal</code> structural directive, which renders the panel lazily.
Set <code>[active]="true"</code> on the link of the current page. <code>orientation</code>, <code>openOn</code>, the delays and <code>[(value)]</code> (id of the open item) are set on the <code>nav</code>. Always give the <code>nav</code> an <code>aria-label</code>.`,
      },
    },
  },
  args: {
    orientation: 'horizontal',
    openOn: 'hover',
    delayDuration: 200,
    skipDelayDuration: 300,
  },
  argTypes: {
    orientation: {
      description: 'Layout direction of the menu and the keyboard navigation axis.',
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
    },
    openOn: {
      description:
        'Whether panels open on hover or only after a click. With <code>click</code>, hovering still switches between items once one is open.',
      control: 'inline-radio',
      options: ['hover', 'click'],
    },
    delayDuration: {
      description: 'Milliseconds between the pointer entering a trigger and its panel opening.',
      control: 'number',
    },
    skipDelayDuration: {
      description: 'Milliseconds during which moving to another trigger opens its panel without the delay.',
      control: 'number',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <div class="min-h-64">
        <nav
          hlmNavigationMenu
          aria-label="Main navigation"
          [orientation]="orientation"
          [openOn]="openOn"
          [delayDuration]="delayDuration"
          [skipDelayDuration]="skipDelayDuration">
          <ul hlmNavigationMenuList>
            <li hlmNavigationMenuItem>
              <button type="button" hlmNavigationMenuTrigger>Products</button>
              <hlm-navigation-menu-content *hlmNavigationMenuPortal>
                <ul class="grid w-72 gap-2 p-3">
                  <li>
                    <a hlmNavigationMenuLink href="#workspace"><strong>Workspace</strong><br />Plan work with your team.</a>
                  </li>
                  <li>
                    <a hlmNavigationMenuLink href="#analytics"><strong>Analytics</strong><br />Understand project progress.</a>
                  </li>
                </ul>
              </hlm-navigation-menu-content>
            </li>
            <li hlmNavigationMenuItem>
              <a hlmNavigationMenuLink href="#resources">Resources</a>
            </li>
            <li hlmNavigationMenuItem>
              <a hlmNavigationMenuLink href="#about">About</a>
            </li>
          </ul>
        </nav>
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<NavigationMenuStoryArgs>;

export const Default: Story = {};

export const OpenOnClick: Story = {
  args: { openOn: 'click' },
};

export const Vertical: Story = {
  args: { orientation: 'vertical' },
};

export const ActiveLink: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <nav hlmNavigationMenu aria-label="Documentation sections">
        <ul hlmNavigationMenuList>
          <li hlmNavigationMenuItem>
            <a hlmNavigationMenuLink href="#overview" [active]="true" aria-current="page">Overview</a>
          </li>
          <li hlmNavigationMenuItem>
            <a hlmNavigationMenuLink href="#guides">Guides</a>
          </li>
          <li hlmNavigationMenuItem>
            <a hlmNavigationMenuLink href="#api">API reference</a>
          </li>
        </ul>
      </nav>
    `,
  }),
};

export const WithMultipleMenus: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="min-h-72">
        <nav hlmNavigationMenu aria-label="Site navigation">
          <ul hlmNavigationMenuList>
            <li hlmNavigationMenuItem>
              <button type="button" hlmNavigationMenuTrigger>Getting started</button>
              <hlm-navigation-menu-content *hlmNavigationMenuPortal>
                <ul class="grid w-72 gap-2 p-3">
                  <li>
                    <a hlmNavigationMenuLink href="#introduction"><strong>Introduction</strong><br />What the platform does.</a>
                  </li>
                  <li>
                    <a hlmNavigationMenuLink href="#quickstart"><strong>Quickstart</strong><br />Set up your first project.</a>
                  </li>
                </ul>
              </hlm-navigation-menu-content>
            </li>
            <li hlmNavigationMenuItem>
              <button type="button" hlmNavigationMenuTrigger>Components</button>
              <hlm-navigation-menu-content *hlmNavigationMenuPortal>
                <ul class="grid w-72 gap-2 p-3">
                  <li>
                    <a hlmNavigationMenuLink href="#forms"><strong>Forms</strong><br />Inputs, selects and checkboxes.</a>
                  </li>
                  <li>
                    <a hlmNavigationMenuLink href="#feedback"><strong>Feedback</strong><br />Alerts, progress and toasts.</a>
                  </li>
                </ul>
              </hlm-navigation-menu-content>
            </li>
            <li hlmNavigationMenuItem>
              <a hlmNavigationMenuLink href="#changelog">Changelog</a>
            </li>
          </ul>
        </nav>
      </div>
    `,
  }),
};
