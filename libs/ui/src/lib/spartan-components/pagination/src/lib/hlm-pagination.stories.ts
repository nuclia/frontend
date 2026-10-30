import { applicationConfig, moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { provideRouter } from '@angular/router';
import { HlmPaginationImports } from '../index';
import { HlmPagination } from './hlm-pagination';

interface PaginationStoryArgs {
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  maxSize: number;
  showEdges: boolean;
  pageSizes: number[];
}

const meta: Meta<PaginationStoryArgs> = {
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
        component: `Divides a large collection into pages and provides controls to move between them. Use it for search results, tables, and lists where users need a manageable view and a clear sense of their position.
Import <code>HlmPaginationImports</code> from <code>@nuclia/ui-spartan/pagination</code>. For client-side or server-side paging, use <code>hlm-numbered-pagination</code> with <code>[(currentPage)]</code>, <code>[(itemsPerPage)]</code> and <code>totalItems</code>; it renders the page links, ellipses, previous/next buttons and a page-size selector. Tune it with <code>maxSize</code>, <code>showEdges</code> and <code>pageSizes</code>.

To drive paging from the URL, use <code>hlm-numbered-pagination-query-params</code>, which links to the <code>page</code> query parameter (set <code>link</code> to the target route).
For full control, compose <code>nav[hlmPagination]</code> &gt; <code>ul[hlmPaginationContent]</code> &gt; <code>li[hlmPaginationItem]</code> with <code>a[hlmPaginationLink]</code> (<code>isActive</code> marks the current page with <code>aria-current</code>), <code>hlm-pagination-previous</code>, <code>hlm-pagination-next</code> and <code>hlm-pagination-ellipsis</code>.
Links rely on the Angular router, so provide it in the application. Set an <code>aria-label</code> on the <code>nav</code> to describe what is paginated.`,
      },
    },
  },
  args: {
    totalItems: 100,
    currentPage: 3,
    itemsPerPage: 10,
    maxSize: 7,
    showEdges: true,
    pageSizes: [10, 20, 50, 100],
  },
  argTypes: {
    totalItems: {
      description: 'Total number of items across all pages.',
      control: { type: 'number', min: 0 },
    },
    currentPage: {
      description: 'Active page (1-based). Two-way bindable with <code>[(currentPage)]</code>.',
      control: { type: 'number', min: 1 },
    },
    itemsPerPage: {
      description: 'Number of items on each page. Two-way bindable with <code>[(itemsPerPage)]</code>.',
      control: { type: 'number', min: 1 },
    },
    maxSize: {
      description: 'Maximum number of page links displayed, ellipses included.',
      control: { type: 'number', min: 3 },
    },
    showEdges: {
      description: 'Shows the previous and next controls.',
      control: 'boolean',
    },
    pageSizes: {
      description: 'Options offered in the page-size selector.',
      control: 'object',
    },
  },
  render: ({ totalItems, currentPage, itemsPerPage, maxSize, showEdges, pageSizes }) => ({
    props: { totalItems, currentPage, itemsPerPage, maxSize, showEdges, pageSizes },
    template: `
      <hlm-numbered-pagination
        [totalItems]="totalItems"
        [(currentPage)]="currentPage"
        [(itemsPerPage)]="itemsPerPage"
        [maxSize]="maxSize"
        [showEdges]="showEdges"
        [pageSizes]="pageSizes"
      />
    `,
  }),
};

export default meta;
type Story = StoryObj<PaginationStoryArgs>;

export const Default: Story = {};

export const FirstPage: Story = {
  args: { currentPage: 1 },
};

export const LastPage: Story = {
  args: { currentPage: 10 },
};

export const FewPages: Story = {
  args: { totalItems: 25, currentPage: 1 },
};

export const WithoutEdges: Story = {
  args: { showEdges: false },
};

export const CustomPageSizes: Story = {
  args: { totalItems: 240, itemsPerPage: 12, pageSizes: [12, 24, 48] },
};

export const Composed: Story = {
  parameters: { controls: { disable: true } },
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

export const IconOnlyEdges: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <nav hlmPagination aria-label="Invoices pages">
        <ul hlmPaginationContent>
          <li hlmPaginationItem>
            <hlm-pagination-previous link="#" iconOnly />
          </li>
          <li hlmPaginationItem>
            <a hlmPaginationLink link="#" isActive>1</a>
          </li>
          <li hlmPaginationItem>
            <a hlmPaginationLink link="#">2</a>
          </li>
          <li hlmPaginationItem>
            <a hlmPaginationLink link="#">3</a>
          </li>
          <li hlmPaginationItem>
            <hlm-pagination-next link="#" iconOnly />
          </li>
        </ul>
      </nav>
    `,
  }),
};
