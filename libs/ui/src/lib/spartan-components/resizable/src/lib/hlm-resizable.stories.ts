import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmResizableImports } from '../index';
import { HlmResizableGroup } from './hlm-resizable-group';

const meta: Meta = {
  title: 'Spartan/Resizable',
  component: HlmResizableGroup,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmResizableImports] })],
  parameters: {
    docs: {
      description: {
        component: `Import <code>HlmResizableImports</code> or the resizable group, panel, and handle primitives from <code>@nuclia/ui-spartan/resizable</code>. Arrange panels as direct children of a group and place a handle between adjacent panels. The handle supports keyboard resizing; keep it focusable and ensure each panel remains usable at its minimum size.`,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `
      <div hlmResizableGroup direction="horizontal" class="min-h-48 max-w-2xl rounded-lg border">
        <section hlmResizablePanel [defaultSize]="35" [minSize]="20" class="p-4">
          <h2 class="font-semibold">Navigation</h2>
          <p class="text-sm text-muted-foreground">Drag the divider to resize this panel.</p>
        </section>
        <hlm-resizable-handle withHandle />
        <section hlmResizablePanel [defaultSize]="65" [minSize]="30" class="p-4">
          <h2 class="font-semibold">Project overview</h2>
          <p class="text-sm">The panel layout can be adjusted to fit the work in view.</p>
        </section>
      </div>
    `,
  }),
};

export const Vertical: Story = {
  render: () => ({
    template: `
      <div hlmResizableGroup direction="vertical" class="h-80 max-w-xl rounded-lg border">
        <section hlmResizablePanel [defaultSize]="55" [minSize]="25" class="p-4">
          <h2 class="font-semibold">Editor</h2>
          <p class="text-sm">Write and review the project notes.</p>
        </section>
        <hlm-resizable-handle withHandle />
        <section hlmResizablePanel [defaultSize]="45" [minSize]="20" class="p-4">
          <h2 class="font-semibold">Activity</h2>
          <p class="text-sm text-muted-foreground">Recent updates appear here.</p>
        </section>
      </div>
    `,
  }),
};
