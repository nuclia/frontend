import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmEmptyImports } from '../index';

const meta: Meta = {
  title: 'Spartan/Empty',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmEmptyImports] })],
  parameters: {
    docs: {
      description: {
        component: `Import <code>HlmEmptyImports</code> from <code>@nuclia/ui-spartan/empty</code>. Compose the empty-state root with header, media, title, description, and optional content directives. Explain why the area is empty and offer a clear next step; keep action labels descriptive.`,
      },
    },
  },
  render: () => ({
    template: `<section hlmEmpty class="mx-auto max-w-md">
      <header hlmEmptyHeader>
        <div hlmEmptyMedia variant="icon" aria-hidden="true">⌕</div>
        <h2 hlmEmptyTitle>No resources yet</h2>
        <p hlmEmptyDescription>Add a document to start building your knowledge base.</p>
      </header>
      <div hlmEmptyContent>
        <button type="button" class="rounded-md border px-3 py-2">Add a document</button>
      </div>
    </section>`,
  }),
};

export default meta;
type Story = StoryObj;
export const Default: Story = {};
export const NoSearchResults: Story = {
  render: () => ({
    template: `<section hlmEmpty class="mx-auto max-w-md">
      <header hlmEmptyHeader>
        <h2 hlmEmptyTitle>No matching resources</h2>
        <p hlmEmptyDescription>Try a different phrase or clear the active filters.</p>
      </header>
      <div hlmEmptyContent><button type="button" class="underline">Clear filters</button></div>
    </section>`,
  }),
};
