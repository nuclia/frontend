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
        component: `Shows actions relevant to a particular item or area when users open its context menu, typically with a right-click. Use it as a shortcut to contextual actions, not as their only point of access.`,
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
