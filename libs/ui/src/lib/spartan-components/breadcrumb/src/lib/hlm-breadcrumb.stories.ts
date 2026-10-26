import { provideRouter } from '@angular/router';
import { applicationConfig, moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmBreadcrumbImports } from '../index';
import { HlmBreadcrumb } from './hlm-breadcrumb';

const meta: Meta = {
  title: 'Spartan/Breadcrumb',
  component: HlmBreadcrumb,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({ providers: [provideRouter([])] }),
    moduleMetadata({ imports: [...HlmBreadcrumbImports] }),
  ],
  parameters: {
    docs: {
      description: {
        component: `Shows the current page's place in a hierarchy and provides links back to its parent pages. Use it to help users stay oriented and move through nested sections.`,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `
      <nav hlmBreadcrumb aria-label="Breadcrumb">
        <ol hlmBreadcrumbList>
          <li hlmBreadcrumbItem><a hlmBreadcrumbLink href="#workspace">Workspace</a></li>
          <li hlmBreadcrumbSeparator></li>
          <li hlmBreadcrumbItem><a hlmBreadcrumbLink href="#projects">Projects</a></li>
          <li hlmBreadcrumbSeparator></li>
          <li hlmBreadcrumbItem><span hlmBreadcrumbPage aria-current="page">Design system</span></li>
        </ol>
      </nav>
    `,
  }),
};

export const WithEllipsis: Story = {
  render: () => ({
    template: `
      <nav hlmBreadcrumb aria-label="Breadcrumb">
        <ol hlmBreadcrumbList>
          <li hlmBreadcrumbItem><a hlmBreadcrumbLink href="#home">Home</a></li>
          <li hlmBreadcrumbSeparator></li>
          <li hlmBreadcrumbItem><hlm-breadcrumb-ellipsis /></li>
          <li hlmBreadcrumbSeparator></li>
          <li hlmBreadcrumbItem><a hlmBreadcrumbLink href="#resources">Resources</a></li>
          <li hlmBreadcrumbSeparator></li>
          <li hlmBreadcrumbItem><span hlmBreadcrumbPage aria-current="page">Quarterly report</span></li>
        </ol>
      </nav>
    `,
  }),
};
