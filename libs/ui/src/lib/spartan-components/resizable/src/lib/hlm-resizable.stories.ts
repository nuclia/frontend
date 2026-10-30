import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmResizableImports } from '../index';
import { HlmResizableGroup } from './hlm-resizable-group';

interface ResizableStoryArgs {
  direction: 'horizontal' | 'vertical';
  withHandle: boolean;
  disabled: boolean;
  minSize: number;
  collapsible: boolean;
}

const meta: Meta<ResizableStoryArgs> = {
  title: 'Spartan/Resizable',
  component: HlmResizableGroup,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmResizableImports] })],
  parameters: {
    docs: {
      description: {
        component: `Divides a layout into panels whose sizes users can adjust. Use it for workspaces, editors, or split views where users need to give more room to the content they are working with.
Import <code>HlmResizableImports</code> from <code>@nuclia/ui-spartan/resizable</code>. Put two or more <code>hlmResizablePanel</code> elements in an <code>hlmResizableGroup</code> and separate each pair with an <code>hlm-resizable-handle</code>. The group needs a bounded width or height.

The group takes <code>direction</code> (horizontal or vertical) and a two-way <code>layout</code> with the panel sizes in percent, and emits <code>dragStart</code>, <code>dragEnd</code> and <code>layoutChange</code>. Panels accept <code>defaultSize</code>, <code>minSize</code>, <code>maxSize</code> and <code>collapsible</code>; handles accept <code>withHandle</code> to show a grip and <code>disabled</code> to lock the split.
Handles are keyboard focusable and can be moved with the arrow keys; panels with meaningful content should expose a heading.`,
      },
    },
  },
  args: {
    direction: 'horizontal',
    withHandle: true,
    disabled: false,
    minSize: 20,
    collapsible: false,
  },
  argTypes: {
    direction: {
      description: 'Layout direction of the panels.',
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
    },
    withHandle: {
      description: 'Shows a visible grip on the handle.',
      control: 'boolean',
    },
    disabled: {
      description: 'Prevents the handle from being dragged or moved with the keyboard.',
      control: 'boolean',
    },
    minSize: {
      description: 'Minimum size of each panel, in percent of the group.',
      control: { type: 'number', min: 0, max: 50 },
    },
    collapsible: {
      description: 'Allows the panel to collapse when dragged below its minimum size.',
      control: 'boolean',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <div hlmResizableGroup [direction]="direction" class="h-64 max-w-2xl rounded-lg border">
        <section hlmResizablePanel [defaultSize]="40" [minSize]="minSize" [collapsible]="collapsible" class="p-4">
          <h2 class="font-semibold">Navigation</h2>
          <p class="text-sm text-muted-foreground">Drag the divider to resize this panel.</p>
        </section>
        <hlm-resizable-handle [withHandle]="withHandle" [disabled]="disabled" />
        <section hlmResizablePanel [defaultSize]="60" [minSize]="minSize" class="p-4">
          <h2 class="font-semibold">Project overview</h2>
          <p class="text-sm">The panel layout can be adjusted to fit the work in view.</p>
        </section>
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<ResizableStoryArgs>;

export const Default: Story = {};

export const Vertical: Story = {
  args: { direction: 'vertical' },
};

export const Collapsible: Story = {
  args: { collapsible: true, minSize: 15 },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const WithoutHandle: Story = {
  args: { withHandle: false },
};

export const ThreePanels: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div hlmResizableGroup direction="horizontal" class="h-64 max-w-3xl rounded-lg border">
        <section hlmResizablePanel [defaultSize]="20" [minSize]="15" class="p-4">
          <h2 class="font-semibold">Folders</h2>
          <p class="text-sm text-muted-foreground">Inbox, drafts and archive.</p>
        </section>
        <hlm-resizable-handle withHandle />
        <section hlmResizablePanel [defaultSize]="40" [minSize]="25" class="p-4">
          <h2 class="font-semibold">Messages</h2>
          <p class="text-sm">Weekly planning notes and design feedback.</p>
        </section>
        <hlm-resizable-handle withHandle />
        <section hlmResizablePanel [defaultSize]="40" [minSize]="25" class="p-4">
          <h2 class="font-semibold">Preview</h2>
          <p class="text-sm text-muted-foreground">Select a message to read it here.</p>
        </section>
      </div>
    `,
  }),
};

export const Nested: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div hlmResizableGroup direction="horizontal" class="h-72 max-w-2xl rounded-lg border">
        <section hlmResizablePanel [defaultSize]="30" [minSize]="20" class="p-4">
          <h2 class="font-semibold">Sidebar</h2>
        </section>
        <hlm-resizable-handle withHandle />
        <div hlmResizablePanel [defaultSize]="70" [minSize]="30">
          <div hlmResizableGroup direction="vertical" class="h-full">
            <section hlmResizablePanel [defaultSize]="60" [minSize]="25" class="p-4">
              <h2 class="font-semibold">Editor</h2>
              <p class="text-sm">Write and review the project notes.</p>
            </section>
            <hlm-resizable-handle withHandle />
            <section hlmResizablePanel [defaultSize]="40" [minSize]="20" class="p-4">
              <h2 class="font-semibold">Activity</h2>
              <p class="text-sm text-muted-foreground">Recent updates appear here.</p>
            </section>
          </div>
        </div>
      </div>
    `,
  }),
};
