import { applicationConfig, moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { provideRouter } from '@angular/router';
import { HlmPaginationImports } from '../index';
import { HlmNumberedPagination } from './hlm-numbered-pagination';
import { HlmPagination } from './hlm-pagination';

interface PaginationStoryArgs {
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  maxSize: number;
  showEdges: boolean;
}

const meta: Meta = {
  title: 'Spartan/Pagination',
  component: HlmPagination,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({ providers: [provideRouter([])] }),
    moduleMetadata({ imports: [...HlmPaginationImports] }),
  ],
  parameters: {
    docs: {
      description: {
        component: `Import <code>HlmPaginationImports</code> from <code>@nuclia/ui-spartan/pagination</code>. Compose the navigation, content, item, page link, previous, next, and ellipsis primitives for route-based pagination. Use the advanced numbered component when page state is managed locally, or the query-parameter variant when page state belongs in the URL.`,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `
      <nav hlmPagination aria-label="Search results pages">
        <ul hlmPaginationContent>
          <li hlmPaginationItem>
            <hlm-pagination-previous link="#" />
          </li>
          <li hlmPaginationItem>
            <a hlmPaginationLink link="#">1</a>
          </li>
          <li hlmPaginationItem>
            <a hlmPaginationLink link="#" isActive>2</a>
          </li>
          <li hlmPaginationItem>
            <a hlmPaginationLink link="#">3</a>
          </li>
          <li hlmPaginationItem>
            <hlm-pagination-ellipsis />
          </li>
          <li hlmPaginationItem>
            <hlm-pagination-next link="#" />
          </li>
        </ul>
      </nav>
    `,
  }),
};

export const Advanced: StoryObj<PaginationStoryArgs> = {
  args: { totalItems: 100, currentPage: 3, itemsPerPage: 10, maxSize: 7, showEdges: true },
  argTypes: {
    totalItems: { control: { type: 'number', min: 1 }, description: 'Total number of items across all pages.' },
    currentPage: { control: { type: 'number', min: 1 }, description: 'Initially active page.' },
    itemsPerPage: { control: { type: 'number', min: 1 }, description: 'Number of items represented by a page.' },
    maxSize: { control: { type: 'number', min: 3 }, description: 'Maximum number of page links to display.' },
    showEdges: { control: 'boolean', description: 'Show previous and next page controls.' },
  },
  render: ({ totalItems, currentPage, itemsPerPage, maxSize, showEdges }) => ({
    props: { totalItems, currentPage, itemsPerPage, maxSize, showEdges },
    template: `
      <hlm-numbered-pagination
        [totalItems]="totalItems"
        [(currentPage)]="currentPage"
        [(itemsPerPage)]="itemsPerPage"
        [maxSize]="maxSize"
        [showEdges]="showEdges"
      />
    `,
  }),
};

export const FirstPage: StoryObj<PaginationStoryArgs> = {
  args: { totalItems: 100, currentPage: 1, itemsPerPage: 10, maxSize: 7, showEdges: true },
  render: Advanced.render,
};
