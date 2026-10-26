import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmCardImports } from '../index';

interface CardStoryArgs {
  size: 'default' | 'sm';
}

const meta: Meta<CardStoryArgs> = {
  title: 'Spartan/Card',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmCardImports] })],
  parameters: {
    docs: {
      description: {
        component: `Groups related information and actions in a distinct surface. Use cards for summaries, settings, or self-contained content that needs a clear visual boundary within a page.`,
      },
    },
  },
  args: { size: 'default' },
  argTypes: { size: { control: 'inline-radio', options: ['default', 'sm'] } },
  render: ({ size }) => ({
    props: { size },
    template: `<section hlmCard [size]="size" class="w-full max-w-md">
      <header hlmCardHeader>
        <h2 hlmCardTitle>Workspace activity</h2>
        <p hlmCardDescription>Recent work in the research workspace.</p>
      </header>
      <div hlmCardContent><p>12 resources were added this week.</p></div>
      <footer hlmCardFooter><span>Updated just now</span></footer>
    </section>`,
  }),
};

export default meta;
type Story = StoryObj<CardStoryArgs>;
export const Default: Story = {};
export const Compact: Story = { args: { size: 'sm' } };
export const WithAction: Story = {
  render: () => ({
    template: `<section hlmCard class="w-full max-w-md">
      <header hlmCardHeader>
        <h2 hlmCardTitle>Workspace activity</h2>
        <p hlmCardDescription>Review the latest resource changes.</p>
        <button hlmCardAction type="button" aria-label="More workspace activity options">•••</button>
      </header>
      <div hlmCardContent>12 resources were added this week.</div>
    </section>`,
  }),
};
