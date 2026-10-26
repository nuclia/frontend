import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmTypographyImports } from '../index';

const meta: Meta = {
  title: 'Spartan/Typography',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmTypographyImports] })],
  parameters: {
    docs: {
      description: {
        component: `Import <code>HlmTypographyImports</code> from <code>@nuclia/ui-spartan/typography</code>. Apply the heading, paragraph, lead, large, small, muted, blockquote, code, and list directives to native semantic elements. Keep heading levels in document order and use semantic elements for meaning rather than choosing a directive based only on appearance.`,
      },
    },
  },
  render: () => ({
    template: `<article class="max-w-2xl space-y-4">
      <h1 hlmH1>Designing useful knowledge tools</h1>
      <p hlmLead>Clear language helps teams find and use the information they need.</p>
      <h2 hlmH2>Start with a meaningful structure</h2>
      <p hlmP>Organize content around real questions, keep labels familiar, and make each next step easy to understand.</p>
      <h3 hlmH3>Write for the next action</h3>
      <p hlmLarge>Use concise explanations to help people move confidently through their work.</p>
      <h4 hlmH4>Keep guidance close by</h4>
      <blockquote hlmBlockquote>Good interfaces make complex work feel manageable.</blockquote>
      <p hlmMuted>Updated for the current release</p>
      <p>Use <code hlmCode>resource.search()</code> to look up a document.</p>
      <small hlmSmall>Short, helpful guidance belongs close to the relevant control.</small>
      <ul hlmUl><li>Use descriptive titles</li><li>Keep related content together</li></ul>
    </article>`,
  }),
};

export default meta;
type Story = StoryObj;
export const Default: Story = {};
