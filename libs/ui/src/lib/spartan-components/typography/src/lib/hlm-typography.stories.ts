import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmTypographyImports } from '../index';

const meta: Meta = {
  title: 'Foundations/Typography',
  decorators: [moduleMetadata({ imports: [...HlmTypographyImports] })],
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    template: `
      <article class="max-w-2xl space-y-4">
        <h1 hlmH1>Designing useful knowledge tools</h1>
        <p hlmLead>Clear language helps teams find and use the information they need.</p>
        <h2 hlmH2>Start with a meaningful structure</h2>
        <p hlmP>
          Organize content around real questions, keep labels familiar, and make each next step easy to understand.
        </p>
        <h3 hlmH3>Write for the next action</h3>
        <p hlmLarge>Use concise explanations to help people move confidently through their work.</p>
        <h4 hlmH4>Keep guidance close by</h4>
        <blockquote hlmBlockquote>Good interfaces make complex work feel manageable.</blockquote>
        <p hlmMuted>Updated for the current release</p>
        <p hlmP>Use <code hlmCode>resource.search()</code> to look up a document.</p>
        <small hlmSmall>Short, helpful guidance belongs close to the relevant control.</small>
        <ul hlmUl>
          <li>Use descriptive titles</li>
          <li>Keep related content together</li>
        </ul>
      </article>
    `,
  }),
};

export default meta;

type Story = StoryObj;

export const Default: Story = {};

export const Headings: Story = {
  render: () => ({
    template: `
      <div class="max-w-2xl space-y-4">
        <h1 hlmH1>Heading 1: Knowledge boxes</h1>
        <h2 hlmH2>Heading 2: Connecting data sources</h2>
        <h3 hlmH3>Heading 3: Scheduling synchronisation</h3>
        <h4 hlmH4>Heading 4: Retry behaviour</h4>
      </div>
    `,
  }),
};

export const BodyText: Story = {
  render: () => ({
    template: `
      <div class="max-w-2xl space-y-4">
        <p hlmLead>Lead: a short introduction that sets the context for the page.</p>
        <p hlmLarge>Large: emphasised text for key statements.</p>
        <p hlmP>
          Paragraph: the default style for body copy. Resources are processed in the background, so new content may take
          a few minutes to become searchable.
        </p>
        <p hlmMuted>Muted: secondary information such as helper text.</p>
        <small hlmSmall>Small: fine print and captions.</small>
      </div>
    `,
  }),
};

export const Quote: Story = {
  render: () => ({
    template: `
      <blockquote hlmBlockquote class="max-w-2xl">
        "Search is only as good as the content behind it, so keep your knowledge base clean and up to date."
      </blockquote>
    `,
  }),
};

export const List: Story = {
  render: () => ({
    template: `
      <ul hlmUl class="max-w-2xl">
        <li>Upload documents, web pages or videos</li>
        <li>Review the extracted text and metadata</li>
        <li>Ask questions and share the answers with your team</li>
      </ul>
    `,
  }),
};

export const InlineCode: Story = {
  render: () => ({
    template: `
      <p hlmP class="max-w-2xl">
        Call <code hlmCode>kb.catalog('')</code> to list all the resources of a knowledge box.
      </p>
    `,
  }),
};

export const Link: Story = {
  render: () => ({
    template: `
      <p hlmP>
        Use a
        <a
          href="#supporting-heading"
          class="font-medium text-link underline underline-offset-4 hover:text-link-hover focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          supporting heading
        </a>
        to introduce related guidance.
      </p>
      <h4 hlmH4 id="supporting-heading" class="mt-4">Keep guidance close by</h4>
    `,
  }),
};

export const Table: Story = {
  render: () => ({
    template: `
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <caption class="mb-4 text-left text-sm text-muted-foreground">Typography roles at a glance</caption>
          <thead>
            <tr>
              <th scope="col" class="border border-border px-4 py-2 text-left font-semibold">Role</th>
              <th scope="col" class="border border-border px-4 py-2 text-left font-semibold">Use</th>
            </tr>
          </thead>
          <tbody>
            <tr class="even:bg-muted">
              <td class="border border-border px-4 py-2">Heading</td>
              <td class="border border-border px-4 py-2">Establish the content hierarchy</td>
            </tr>
            <tr class="even:bg-muted">
              <td class="border border-border px-4 py-2">Paragraph</td>
              <td class="border border-border px-4 py-2">Explain the main content</td>
            </tr>
            <tr class="even:bg-muted">
              <td class="border border-border px-4 py-2">Muted</td>
              <td class="border border-border px-4 py-2">Provide secondary context</td>
            </tr>
          </tbody>
        </table>
      </div>
    `,
  }),
};
