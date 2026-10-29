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
        component: `A horizontal set of menus that organizes application commands into familiar categories. Use it for desktop-style interfaces with groups of actions such as File, Edit, and View.`,
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
