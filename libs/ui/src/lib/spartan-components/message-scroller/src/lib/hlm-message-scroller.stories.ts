import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmMessageScrollerImports } from '../index';

const meta: Meta = {
  title: 'Spartan/Message Scroller',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmMessageScrollerImports] })],
  parameters: {
    docs: {
      description: {
        component: `Chat-style scroll container with a "scroll to latest" button. Scroll up in the example to reveal the button and review its theme (colors, border, radius, spacing). For usage, API and examples, see the <a href="https://www.spartan.ng/components/message-scroller" target="_blank" rel="noopener noreferrer">Spartan documentation</a>.`,
      },
    },
  },
  render: () => ({
    template: `<div class="h-72 max-w-lg">
      <div hlmMessageScrollerProvider>
      <section hlmMessageScroller class="h-full rounded-lg border">
        <div hlmMessageScrollerViewport aria-label="Conversation messages" class="h-full">
          <div hlmMessageScrollerContent class="space-y-3 p-4">
            <article hlmMessageScrollerItem class="rounded-md bg-muted p-3">Welcome to the project conversation.</article>
            <article hlmMessageScrollerItem class="rounded-md bg-muted p-3">The design review is scheduled for Thursday.</article>
            <article hlmMessageScrollerItem class="rounded-md bg-muted p-3">Please add your notes before the meeting.</article>
            <article hlmMessageScrollerItem class="rounded-md bg-muted p-3">I added the mockups to the shared folder.</article>
            <article hlmMessageScrollerItem class="rounded-md bg-muted p-3">Thanks, I will review them this afternoon.</article>
            <article hlmMessageScrollerItem class="rounded-md bg-muted p-3">Can we also check the dark theme?</article>
            <article hlmMessageScrollerItem class="rounded-md bg-muted p-3">Sure, the tokens are already in place.</article>
            <article hlmMessageScrollerItem class="rounded-md bg-muted p-3">Great, let's sync tomorrow morning.</article>
            <article hlmMessageScrollerItem class="rounded-md bg-muted p-3">Sounds good to me.</article>
            <article hlmMessageScrollerItem class="rounded-md bg-muted p-3">See you then!</article>
          </div>
        </div>
        <button hlmMessageScrollerButton type="button" aria-label="Scroll to the latest message">Latest message</button>
      </section>
      </div>
    </div>`,
  }),
};

export default meta;
type Story = StoryObj;
export const Default: Story = {};
