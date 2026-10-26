import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmDropdownMenuImports } from '../../../dropdown-menu/src/index';
import { HlmMenubarImports } from '../index';
import { HlmMenubar } from './hlm-menubar';

const meta: Meta = {
  title: 'Spartan/Menubar',
  component: HlmMenubar,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmMenubarImports, ...HlmDropdownMenuImports] })],
  parameters: {
    docs: {
      description: {
        component: `Import <code>HlmMenubarImports</code> from <code>@nuclia/ui-spartan/menubar</code> for the menubar root and trigger. Each trigger points to a menu template; this package exposes no menubar-specific item or panel components, so the example uses the public dropdown-menu primitives from <code>@nuclia/ui-spartan/dropdown-menu</code> to render panel contents. The menubar uses Angular CDK menu-bar keyboard and focus behavior. Keep trigger names concise and make each action a real button.`,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `
      <ng-template #fileActions>
        <div hlmDropdownMenu aria-label="File actions">
          <button type="button" hlmDropdownMenuItem>New document</button>
          <button type="button" hlmDropdownMenuItem>Open document</button>
          <div hlmDropdownMenuSeparator></div>
          <button type="button" hlmDropdownMenuItem>Export</button>
        </div>
      </ng-template>
      <ng-template #editActions>
        <div hlmDropdownMenu aria-label="Edit actions">
          <button type="button" hlmDropdownMenuItem>Undo</button>
          <button type="button" hlmDropdownMenuItem>Redo</button>
          <div hlmDropdownMenuSeparator></div>
          <button type="button" hlmDropdownMenuItem>Select all</button>
        </div>
      </ng-template>
      <div hlmMenubar aria-label="Document menu">
        <button type="button" [hlmMenubarTrigger]="fileActions">File</button>
        <button type="button" [hlmMenubarTrigger]="editActions">Edit</button>
      </div>
    `,
  }),
};
