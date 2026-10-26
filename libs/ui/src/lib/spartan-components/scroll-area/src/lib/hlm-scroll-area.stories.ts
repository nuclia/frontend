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
        component: `Import <code>HlmScrollAreaImports</code> or <code>HlmScrollArea</code> from <code>@nuclia/ui-spartan/scroll-area</code> and the <code>NgScrollbar</code> component from <code>ngx-scrollbar</code>. Apply the Hlm directive to an <code>ng-scrollbar</code> and give the viewport a constrained size so overflowing content can scroll. Keep content in the document's normal reading order and do not rely on color alone to indicate the scrollbar.`,
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
