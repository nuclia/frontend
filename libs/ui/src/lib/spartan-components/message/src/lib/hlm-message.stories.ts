import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmAvatarImports } from '../../../avatar/src';
import { HlmBubbleImports } from '../../../bubble/src';
import { HlmMessageImports } from '../index';
import { HlmMessage } from './hlm-message';

type BubbleVariant = 'default' | 'secondary' | 'muted' | 'tinted' | 'outline' | 'ghost' | 'destructive';

interface MessageStoryArgs {
  align: 'start' | 'end';
  bubbleVariant: BubbleVariant;
  sender: string;
  text: string;
  time: string;
}

const meta: Meta<MessageStoryArgs> = {
  title: 'Spartan/Message',
  component: HlmMessage,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmMessageImports, ...HlmAvatarImports, ...HlmBubbleImports] })],
  parameters: {
    docs: {
      description: {
        component: `Organizes a message within a conversation, combining its content with optional avatar, sender details, timestamp, and actions. Use it to make authorship and message grouping clear in chat interfaces.
Import <code>HlmMessageImports</code> from <code>@nuclia/ui-spartan/message</code>. The examples also use the avatar and bubble components.

Compose <code>hlmMessage</code> with an optional <code>hlmMessageAvatar</code> and an <code>hlmMessageContent</code> column made of <code>hlmMessageHeader</code> (sender name), a bubble (<code>hlmBubble</code> from <code>@nuclia/ui-spartan/bubble</code>) and <code>hlmMessageFooter</code> (time, status). Wrap consecutive messages in <code>hlmMessageGroup</code>.
The <code>align</code> input is <code>start</code> (incoming, default) or <code>end</code> (outgoing, mirrors the row). Use semantic elements such as <code>article</code> for each message, and mark purely decorative avatars with <code>aria-hidden="true"</code> since the sender is already named in the header.`,
      },
    },
  },
  args: {
    align: 'start',
    bubbleVariant: 'muted',
    sender: 'Research assistant',
    text: 'The report covers the three main findings from your selected sources.',
    time: '10:42 AM',
  },
  argTypes: {
    align: {
      description:
        'Side of the conversation the message belongs to: <code>start</code> for incoming, <code>end</code> for outgoing.',
      control: 'inline-radio',
      options: ['start', 'end'],
    },
    bubbleVariant: {
      description: 'Variant of the <code>hlmBubble</code> wrapping the text.',
      control: 'select',
      options: ['default', 'secondary', 'muted', 'tinted', 'outline', 'ghost', 'destructive'],
    },
    sender: {
      description: 'Sender name displayed in the message header.',
      control: 'text',
    },
    text: {
      description: 'Text of the message.',
      control: 'text',
    },
    time: {
      description: 'Text displayed in the message footer.',
      control: 'text',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <article hlmMessage [align]="align" class="max-w-xl">
        <div hlmMessageAvatar aria-hidden="true">
          <hlm-avatar><span hlmAvatarFallback>SP</span></hlm-avatar>
        </div>
        <div hlmMessageContent>
          <header hlmMessageHeader>{{ sender }}</header>
          <div hlmBubble [variant]="bubbleVariant">
            <div hlmBubbleContent>{{ text }}</div>
          </div>
          <footer hlmMessageFooter>{{ time }}</footer>
        </div>
      </article>
    `,
  }),
};

export default meta;
type Story = StoryObj<MessageStoryArgs>;

export const Default: Story = {};

export const Outgoing: Story = {
  args: {
    align: 'end',
    bubbleVariant: 'default',
    sender: 'You',
    text: 'Thanks, that is exactly what I needed.',
    time: '10:43 AM · Read',
  },
};

export const Ghost: Story = {
  args: {
    bubbleVariant: 'ghost',
  },
};

export const SendFailed: Story = {
  args: {
    align: 'end',
    bubbleVariant: 'destructive',
    sender: 'You',
    text: 'Could you summarize the second document as well?',
    time: 'Not delivered',
  },
};

export const Conversation: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    template: `
      <div hlmMessageGroup class="max-w-xl gap-4">
        <article hlmMessage>
          <div hlmMessageAvatar aria-hidden="true">
            <hlm-avatar><span hlmAvatarFallback>SP</span></hlm-avatar>
          </div>
          <div hlmMessageContent>
            <header hlmMessageHeader>Research assistant</header>
            <div hlmBubble variant="muted">
              <div hlmBubbleContent>The report covers the three main findings from your selected sources.</div>
            </div>
            <footer hlmMessageFooter>10:42 AM</footer>
          </div>
        </article>
        <article hlmMessage align="end">
          <div hlmMessageAvatar aria-hidden="true">
            <hlm-avatar><span hlmAvatarFallback>You</span></hlm-avatar>
          </div>
          <div hlmMessageContent>
            <div hlmBubble>
              <div hlmBubbleContent>Thanks, that is exactly what I needed.</div>
            </div>
            <footer hlmMessageFooter>10:43 AM · Read</footer>
          </div>
        </article>
      </div>
    `,
  }),
};
