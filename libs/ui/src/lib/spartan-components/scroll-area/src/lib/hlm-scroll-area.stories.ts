import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmScrollAreaImports } from '../index';
import { NgScrollbar } from 'ngx-scrollbar';
import { HlmScrollArea } from './hlm-scroll-area';

const meta: Meta = {
  title: 'Spartan/Scroll Area',
  component: HlmScrollArea,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [NgScrollbar, ...HlmScrollAreaImports] })],
  parameters: {
    docs: {
      description: {
        component: `Contains overflowing content in a scrollable region with consistently styled scrollbars. Use it for long lists or panels that need to stay within a fixed area of the layout.`,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `
      <ng-scrollbar hlm class="h-56 w-full max-w-sm rounded-md border">
        <div class="space-y-4 p-4">
          <h2 class="font-semibold">Workspace activity</h2>
          <article>
            <h3 class="font-medium">Project created</h3>
            <p class="text-sm text-muted-foreground">Jordan created Atlas redesign.</p>
          </article>
          <article>
            <h3 class="font-medium">A teammate joined</h3>
            <p class="text-sm text-muted-foreground">Sam joined the Product workspace.</p>
          </article>
          <article>
            <h3 class="font-medium">Report updated</h3>
            <p class="text-sm text-muted-foreground">The weekly progress report is ready.</p>
          </article>
          <article>
            <h3 class="font-medium">Review scheduled</h3>
            <p class="text-sm text-muted-foreground">The design review is scheduled for Thursday.</p>
          </article>
        </div>
      </ng-scrollbar>
    `,
  }),
};
