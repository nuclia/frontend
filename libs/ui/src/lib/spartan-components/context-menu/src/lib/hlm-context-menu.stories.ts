import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmButton } from '../../../button/src/index';
import { HlmDropdownMenuImports } from '../../../dropdown-menu/src/index';
import { HlmContextMenuImports } from '../index';
import { HlmContextMenuTrigger } from './hlm-context-menu-trigger';

const meta: Meta = {
  title: 'Spartan/Context Menu',
  component: HlmContextMenuTrigger,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [HlmButton, ...HlmContextMenuImports, ...HlmDropdownMenuImports],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: `Import <code>HlmContextMenuImports</code> from <code>@nuclia/ui-spartan/context-menu</code> for the context-trigger directive. Bind its <code>hlmContextMenuTrigger</code> input to a menu template. Style that panel with the public dropdown-menu primitives from <code>@nuclia/ui-spartan/dropdown-menu</code>, since the context-menu entrypoint intentionally exports only the trigger and configuration token. Context menus open with the context-menu gesture and use Angular CDK menu focus and keyboard behavior; keep the target discoverable and ensure the same actions are available through a keyboard-accessible trigger or equivalent controls.`,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `
      <ng-template #actionsMenu>
        <div hlmDropdownMenu aria-label="Document actions">
          <button type="button" hlmDropdownMenuItem>Open document</button>
          <button type="button" hlmDropdownMenuItem>Rename document</button>
          <div hlmDropdownMenuSeparator></div>
          <button type="button" hlmDropdownMenuItem variant="destructive">Move to trash</button>
        </div>
      </ng-template>
      <div
        [hlmContextMenuTrigger]="actionsMenu"
        class="bg-neutral-50 flex p-12 w-50 items-center justify-center rounded-xl border border-dashed text-sm"
      >
        Right-click here
      </div>
    `,
  }),
};
