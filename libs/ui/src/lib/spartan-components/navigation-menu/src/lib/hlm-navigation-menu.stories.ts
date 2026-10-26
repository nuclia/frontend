import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmNavigationMenuImports } from '../index';
import { HlmNavigationMenu } from './hlm-navigation-menu';

const meta: Meta = {
  title: 'Spartan/Navigation Menu',
  component: HlmNavigationMenu,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmNavigationMenuImports] })],
  parameters: {
    docs: {
      description: {
        component: `Organizes links to the main sections of a site or application, with expandable panels for related destinations. Use it for primary navigation rather than menus of commands or actions.`,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `
      <nav hlmNavigationMenu aria-label="Main navigation">
        <ul hlmNavigationMenuList>
          <li hlmNavigationMenuItem>
            <button type="button" hlmNavigationMenuTrigger>Products</button>
            <hlm-navigation-menu-content *hlmNavigationMenuPortal>
              <ul class="grid w-72 gap-2 p-3">
                <li><a hlmNavigationMenuLink href="#workspace"><strong>Workspace</strong><br />Plan work with your team.</a></li>
                <li><a hlmNavigationMenuLink href="#analytics"><strong>Analytics</strong><br />Understand project progress.</a></li>
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
    `,
  }),
};
