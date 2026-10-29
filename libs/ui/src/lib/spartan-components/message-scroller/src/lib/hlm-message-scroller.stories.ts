import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmMessageScrollerImports } from '../index';
import { HlmMessageScroller } from './hlm-message-scroller';

interface ConversationMessage {
  id: string;
  mine: boolean;
  text: string;
}

const CONVERSATION: ConversationMessage[] = [
  { id: 'm1', mine: false, text: 'Welcome to the project conversation.' },
  { id: 'm2', mine: true, text: 'Thanks! When is the design review?' },
  { id: 'm3', mine: false, text: 'The design review is scheduled for Thursday at 10:00.' },
  { id: 'm4', mine: false, text: 'Please add your notes to the shared document before the meeting.' },
  { id: 'm5', mine: true, text: 'Done, I also added the mockups to the shared folder.' },
  { id: 'm6', mine: false, text: 'Great, I will review them this afternoon.' },
  { id: 'm7', mine: true, text: 'Can we also check the dark theme?' },
  { id: 'm8', mine: false, text: 'Sure, the color tokens are already in place.' },
  { id: 'm9', mine: true, text: 'Perfect. Let’s sync tomorrow morning if anything is missing.' },
  { id: 'm10', mine: false, text: 'Sounds good to me. See you then!' },
];

type ScrollPosition = 'start' | 'end' | 'last-anchor';

interface MessageScrollerStoryArgs {
  autoScroll: boolean;
  defaultScrollPosition: ScrollPosition;
  scrollEdgeThreshold: number;
  scrollMargin: number;
  buttonDirection: 'start' | 'end';
  buttonLabel: string;
}

const meta: Meta<MessageScrollerStoryArgs> = {
  title: 'Spartan/Message Scroller',
  component: HlmMessageScroller,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmMessageScrollerImports] })],
  parameters: {
    docs: {
      description: {
        component: `A scrollable conversation area with a shortcut back to the latest messages. Use it to let users browse earlier messages and easily return to the current conversation.
Import <code>HlmMessageScrollerImports</code> from <code>@nuclia/ui-spartan/message-scroller</code>.

Nest <code>hlmMessageScrollerProvider</code> (configuration, renders no box) &gt; <code>hlmMessageScroller</code> &gt; <code>hlmMessageScrollerViewport</code> &gt; <code>hlmMessageScrollerContent</code> &gt; one <code>hlmMessageScrollerItem</code> per message; add a <code>button[hlmMessageScrollerButton]</code> inside the scroller. The scroller needs a bounded height (for example <code>h-72</code> on a parent).
The provider exposes <code>autoScroll</code> (follow new messages while at the bottom), <code>defaultScrollPosition</code> (<code>start</code>, <code>end</code> or <code>last-anchor</code>), <code>scrollEdgeThreshold</code>, <code>scrollMargin</code> and <code>scrollPreviousItemPeek</code>. Items accept <code>messageId</code> and <code>scrollAnchor</code>; the viewport accepts <code>preserveScrollOnPrepend</code> to keep the position when older messages are loaded above.
The button takes <code>direction</code> (<code>start</code> or <code>end</code>) and <code>behavior</code>, and only shows when there is overflow in that direction. Name the scroll region with <code>aria-label</code> on the viewport (it is a live log) and customise the button with <code>aria-label</code>.`,
      },
    },
  },
  args: {
    autoScroll: false,
    defaultScrollPosition: 'start',
    scrollEdgeThreshold: 8,
    scrollMargin: 0,
    buttonDirection: 'end',
    buttonLabel: 'Scroll to the latest message',
  },
  argTypes: {
    autoScroll: {
      description: 'Follows new content at the bottom while the viewport is already at the end.',
      control: 'boolean',
    },
    defaultScrollPosition: {
      description: 'Where the viewport is positioned the first time messages are rendered.',
      control: 'inline-radio',
      options: ['start', 'end', 'last-anchor'],
    },
    scrollEdgeThreshold: {
      description: 'Distance in pixels from an edge that still counts as being at the top or bottom.',
      control: 'number',
    },
    scrollMargin: {
      description: 'Margin in pixels kept on the aligned edge when scrolling to a message.',
      control: 'number',
    },
    buttonDirection: {
      description: 'Edge of the conversation the floating button scrolls toward.',
      control: 'inline-radio',
      options: ['start', 'end'],
    },
    buttonLabel: {
      description: 'Accessible name of the floating button.',
      control: 'text',
    },
  },
  render: (args) => ({
    props: { ...args, messages: CONVERSATION },
    template: `
      <div class="h-72 w-96">
        <div
          hlmMessageScrollerProvider
          [autoScroll]="autoScroll"
          [defaultScrollPosition]="defaultScrollPosition"
          [scrollEdgeThreshold]="scrollEdgeThreshold"
          [scrollMargin]="scrollMargin">
          <section hlmMessageScroller class="rounded-lg border">
            <div hlmMessageScrollerViewport aria-label="Conversation messages">
              <div hlmMessageScrollerContent class="p-4">
                @for (message of messages; track message.id) {
                  <article hlmMessageScrollerItem [messageId]="message.id" [scrollAnchor]="message.mine">
                    <div class="flex" [class.justify-end]="message.mine">
                      <div
                        class="max-w-[80%] rounded-lg px-3 py-2 text-sm"
                        [class.bg-primary]="message.mine"
                        [class.text-primary-foreground]="message.mine"
                        [class.bg-muted]="!message.mine">
                        {{ message.text }}
                      </div>
                    </div>
                  </article>
                }
              </div>
            </div>
            <button hlmMessageScrollerButton type="button" [direction]="buttonDirection" [attr.aria-label]="buttonLabel"></button>
          </section>
        </div>
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<MessageScrollerStoryArgs>;

export const Default: Story = {};

export const OpensAtLatest: Story = {
  args: {
    defaultScrollPosition: 'end',
    buttonDirection: 'start',
    buttonLabel: 'Scroll to the first message',
  },
};

export const FollowsNewMessages: Story = {
  args: {
    autoScroll: true,
    defaultScrollPosition: 'end',
  },
  render: (args) => {
    const messages: ConversationMessage[] = CONVERSATION.slice(0, 6);
    return {
      props: {
        ...args,
        messages,
        addMessage: () => {
          const next = CONVERSATION[messages.length % CONVERSATION.length];
          messages.push({ ...next, id: `new-${messages.length}` });
        },
      },
      template: `
      <div class="flex w-96 flex-col gap-3">
        <div class="h-72">
          <div
            hlmMessageScrollerProvider
            [autoScroll]="autoScroll"
            [defaultScrollPosition]="defaultScrollPosition"
            [scrollEdgeThreshold]="scrollEdgeThreshold"
            [scrollMargin]="scrollMargin">
            <section hlmMessageScroller class="rounded-lg border">
              <div hlmMessageScrollerViewport aria-label="Conversation messages">
                <div hlmMessageScrollerContent class="p-4">
                  @for (message of messages; track message.id) {
                    <article hlmMessageScrollerItem [messageId]="message.id">
                      <div class="flex" [class.justify-end]="message.mine">
                        <div
                          class="max-w-[80%] rounded-lg px-3 py-2 text-sm"
                          [class.bg-primary]="message.mine"
                          [class.text-primary-foreground]="message.mine"
                          [class.bg-muted]="!message.mine">
                          {{ message.text }}
                        </div>
                      </div>
                    </article>
                  }
                </div>
              </div>
              <button hlmMessageScrollerButton type="button" [direction]="buttonDirection" [attr.aria-label]="buttonLabel"></button>
            </section>
          </div>
        </div>
        <button type="button" class="rounded-md border px-3 py-1 text-sm" (click)="addMessage()">Receive a message</button>
      </div>
    `,
    };
  },
};
