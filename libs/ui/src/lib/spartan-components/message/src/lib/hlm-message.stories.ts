import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmAvatarImports } from '../../../avatar/src';
import { HlmBubbleImports } from '../../../bubble/src';
import { HlmMessageImports } from '../index';

interface MessageStoryArgs {
  align: 'start' | 'end';
}

const meta: Meta<MessageStoryArgs> = {
  title: 'Spartan/Message',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmMessageImports, ...HlmAvatarImports, ...HlmBubbleImports] })],
  parameters: {
    docs: {
      description: {
        component: `Import <code>HlmMessageImports</code> from <code>@nuclia/ui-spartan/message</code> and <code>HlmBubbleImports</code> from <code>@nuclia/ui-spartan/bubble</code>. Message provides the conversation layout; render the visible message surface with <code>hlmBubble</code> inside <code>hlmMessageContent</code>. Use <code>hlmMessageGroup</code> to group related messages. Provide meaningful avatar alt text or mark decorative avatar content as hidden.`,
      },
    },
  },
  args: { align: 'start' },
  argTypes: { align: { control: 'inline-radio', options: ['start', 'end'] } },
  render: ({ align }) => ({
    props: { align },
    template: `<div hlmMessageGroup class="max-w-xl space-y-4">
      <article hlmMessage [align]="align">
        <div hlmMessageAvatar aria-hidden="true">
          <hlm-avatar><span hlmAvatarFallback>SP</span></hlm-avatar>
        </div>
        <div hlmMessageContent>
          <header hlmMessageHeader><strong>Research assistant</strong></header>
          <div hlmBubble>
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
          <div hlmBubble variant="secondary">
            <div hlmBubbleContent>Thanks, that is exactly what I needed.</div>
          </div>
        </div>
      </article>
    </div>`,
  }),
};

export default meta;
type Story = StoryObj<MessageStoryArgs>;
export const Default: Story = {};
export const Outgoing: Story = { args: { align: 'end' } };
