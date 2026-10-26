import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmTableImports } from '../index';

const meta: Meta = {
  title: 'Spartan/Table',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmTableImports] })],
  parameters: {
    docs: {
      description: {
        component: `Import <code>HlmTableImports</code> from <code>@nuclia/ui-spartan/table</code>. Compose a semantic table inside <code>hlmTableContainer</code> using head, body, rows, header cells, data cells, optional footer, and caption directives. Use proper row and column headers, and provide a caption that summarizes the table's purpose.`,
      },
    },
  },
  render: () => ({
    template: `<div hlmTableContainer class="max-w-2xl">
      <table hlmTable>
        <caption hlmCaption class="caption-bottom">Recent resources in the workspace</caption>
        <thead hlmTHead>
          <tr hlmTr><th hlmTh scope="col">Resource</th><th hlmTh scope="col">Type</th><th hlmTh scope="col">Status</th></tr>
        </thead>
        <tbody hlmTBody>
          <tr hlmTr><th hlmTh scope="row">Research brief</th><td hlmTd>Document</td><td hlmTd>Ready</td></tr>
          <tr hlmTr><th hlmTh scope="row">Product interview</th><td hlmTd>Audio</td><td hlmTd>Processing</td></tr>
          <tr hlmTr><th hlmTh scope="row">Planning notes</th><td hlmTd>Document</td><td hlmTd>Ready</td></tr>
        </tbody>
        <tfoot hlmTFoot><tr hlmTr><td hlmTd colspan="3">3 resources</td></tr></tfoot>
      </table>
    </div>`,
  }),
};

export default meta;
type Story = StoryObj;
export const Default: Story = {};
