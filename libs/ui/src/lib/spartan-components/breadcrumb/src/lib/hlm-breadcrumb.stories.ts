import { provideRouter } from '@angular/router';
import { applicationConfig, moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmBreadcrumbImports } from '../index';
import { HlmBreadcrumb } from './hlm-breadcrumb';

interface BreadcrumbStoryArgs {
  ariaLabel: string;
  currentPage: string;
}

const meta: Meta<BreadcrumbStoryArgs> = {
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
        component: `Shows the current page's place in a hierarchy and provides links back to its parent pages. Use it to help users stay oriented and move through nested sections.
Import <code>HlmBreadcrumbImports</code> from <code>@nuclia/ui-spartan/breadcrumb</code> and build <code>nav[hlmBreadcrumb]</code> &gt; <code>ol[hlmBreadcrumbList]</code> &gt; <code>li[hlmBreadcrumbItem]</code> entries.
Use <code>a[hlmBreadcrumbLink]</code> for parent pages (set <code>link</code> for Angular router navigation, or a plain <code>href</code>), <code>hlmBreadcrumbPage</code> for the current page, <code>li[hlmBreadcrumbSeparator]</code> between items (it renders a chevron unless you project your own content) and <code>hlm-breadcrumb-ellipsis</code> for collapsed levels.

The host has <code>role="navigation"</code>; set its accessible name with <code>aria-label</code> (defaults to "breadcrumb"). <code>hlmBreadcrumbPage</code> already sets <code>aria-current="page"</code>.`,
      },
    },
  },
  args: {
    ariaLabel: 'Breadcrumb',
    currentPage: 'Design system',
  },
  argTypes: {
    ariaLabel: {
      description: 'Accessible name of the navigation landmark, set through the <code>aria-label</code> input.',
      control: 'text',
    },
    currentPage: {
      description: 'Label of the current page, rendered with <code>hlmBreadcrumbPage</code>.',
      control: 'text',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <nav hlmBreadcrumb [aria-label]="ariaLabel">
        <ol hlmBreadcrumbList>
          <li hlmBreadcrumbItem><a hlmBreadcrumbLink href="#workspace">Workspace</a></li>
          <li hlmBreadcrumbSeparator></li>
          <li hlmBreadcrumbItem><a hlmBreadcrumbLink href="#projects">Projects</a></li>
          <li hlmBreadcrumbSeparator></li>
          <li hlmBreadcrumbItem><span hlmBreadcrumbPage>{{ currentPage }}</span></li>
        </ol>
      </nav>
    `,
  }),
};

export default meta;

type Story = StoryObj<BreadcrumbStoryArgs>;

export const Default: Story = {};

export const WithEllipsis: Story = {
  parameters: {
    controls: { disable: true },
  },
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
          <li hlmBreadcrumbItem><span hlmBreadcrumbPage>Quarterly report</span></li>
        </ol>
      </nav>
    `,
  }),
};

export const CustomSeparator: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    template: `
      <nav hlmBreadcrumb aria-label="Breadcrumb">
        <ol hlmBreadcrumbList>
          <li hlmBreadcrumbItem><a hlmBreadcrumbLink href="#home">Home</a></li>
          <li hlmBreadcrumbSeparator>/</li>
          <li hlmBreadcrumbItem><a hlmBreadcrumbLink href="#knowledge-boxes">Knowledge boxes</a></li>
          <li hlmBreadcrumbSeparator>/</li>
          <li hlmBreadcrumbItem><span hlmBreadcrumbPage>Support articles</span></li>
        </ol>
      </nav>
    `,
  }),
};

export const SinglePage: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    template: `
      <nav hlmBreadcrumb aria-label="Breadcrumb">
        <ol hlmBreadcrumbList>
          <li hlmBreadcrumbItem><span hlmBreadcrumbPage>Dashboard</span></li>
        </ol>
      </nav>
    `,
  }),
};
