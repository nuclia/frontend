import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { HlmTableImports } from '../index';

const meta: Meta = {
  title: 'Spartan/Table',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmTableImports] })],
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        component: `Organizes structured information into rows and columns for easy comparison. Use it for records, reports, or other data where users need to scan shared attributes across multiple entries.
Import <code>HlmTableImports</code> from <code>@nuclia/ui-spartan/table</code>. The table is made of attribute directives applied to native elements: <code>div[hlmTableContainer]</code> (horizontal scroll wrapper), <code>table[hlmTable]</code>, <code>caption[hlmCaption]</code>, <code>thead[hlmTHead]</code>, <code>tbody[hlmTBody]</code>, <code>tfoot[hlmTFoot]</code>, <code>tr[hlmTr]</code>, <code>th[hlmTh]</code> and <code>td[hlmTd]</code>.

The directives only add styling and have no inputs, so keep the native table semantics for accessibility: use <code>&lt;th scope="col"&gt;</code> / <code>scope="row"</code> and a <code>&lt;caption&gt;</code> describing the data. Add <code>data-state="selected"</code> on a row to highlight it.`,
      },
    },
  },
  render: () => ({
    template: `
      <div hlmTableContainer class="max-w-2xl">
        <table hlmTable>
          <caption hlmCaption>Recent resources in the workspace</caption>
          <thead hlmTHead>
            <tr hlmTr>
              <th hlmTh scope="col">Resource</th>
              <th hlmTh scope="col">Type</th>
              <th hlmTh scope="col">Status</th>
            </tr>
          </thead>
          <tbody hlmTBody>
            <tr hlmTr>
              <th hlmTh scope="row">Research brief</th>
              <td hlmTd>Document</td>
              <td hlmTd>Ready</td>
            </tr>
            <tr hlmTr>
              <th hlmTh scope="row">Product interview</th>
              <td hlmTd>Audio</td>
              <td hlmTd>Processing</td>
            </tr>
            <tr hlmTr>
              <th hlmTh scope="row">Planning notes</th>
              <td hlmTd>Document</td>
              <td hlmTd>Ready</td>
            </tr>
          </tbody>
          <tfoot hlmTFoot>
            <tr hlmTr>
              <td hlmTd colspan="3">3 resources</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `,
  }),
};

export default meta;

type Story = StoryObj;

export const Default: Story = {};

export const SelectedRow: Story = {
  render: () => ({
    template: `
      <div hlmTableContainer class="max-w-2xl">
        <table hlmTable>
          <caption hlmCaption>Team members (the second row is selected)</caption>
          <thead hlmTHead>
            <tr hlmTr>
              <th hlmTh scope="col">Name</th>
              <th hlmTh scope="col">Role</th>
              <th hlmTh scope="col" class="text-end">Last active</th>
            </tr>
          </thead>
          <tbody hlmTBody>
            <tr hlmTr>
              <td hlmTd>Ana Torres</td>
              <td hlmTd>Owner</td>
              <td hlmTd class="text-end">Today</td>
            </tr>
            <tr hlmTr data-state="selected">
              <td hlmTd>Marc Vidal</td>
              <td hlmTd>Contributor</td>
              <td hlmTd class="text-end">Yesterday</td>
            </tr>
            <tr hlmTr>
              <td hlmTd>Lea Martin</td>
              <td hlmTd>Reader</td>
              <td hlmTd class="text-end">3 days ago</td>
            </tr>
          </tbody>
        </table>
      </div>
    `,
  }),
};

export const NumericColumnsWithFooter: Story = {
  render: () => ({
    template: `
      <div hlmTableContainer class="max-w-2xl">
        <table hlmTable>
          <caption hlmCaption>Monthly usage by service</caption>
          <thead hlmTHead>
            <tr hlmTr>
              <th hlmTh scope="col">Service</th>
              <th hlmTh scope="col" class="text-end">Requests</th>
              <th hlmTh scope="col" class="text-end">Tokens</th>
            </tr>
          </thead>
          <tbody hlmTBody>
            <tr hlmTr>
              <th hlmTh scope="row">Search</th>
              <td hlmTd class="text-end">12,430</td>
              <td hlmTd class="text-end">0</td>
            </tr>
            <tr hlmTr>
              <th hlmTh scope="row">Ask</th>
              <td hlmTd class="text-end">3,208</td>
              <td hlmTd class="text-end">1,482,900</td>
            </tr>
          </tbody>
          <tfoot hlmTFoot>
            <tr hlmTr>
              <th hlmTh scope="row">Total</th>
              <td hlmTd class="text-end">15,638</td>
              <td hlmTd class="text-end">1,482,900</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `,
  }),
};

export const ScrollableContainer: Story = {
  render: () => ({
    template: `
      <div hlmTableContainer class="max-w-sm">
        <table hlmTable>
          <thead hlmTHead>
            <tr hlmTr>
              <th hlmTh scope="col">Resource</th>
              <th hlmTh scope="col">Created</th>
              <th hlmTh scope="col">Language</th>
              <th hlmTh scope="col">Size</th>
              <th hlmTh scope="col">Owner</th>
            </tr>
          </thead>
          <tbody hlmTBody>
            <tr hlmTr>
              <th hlmTh scope="row">Research brief</th>
              <td hlmTd>12 March 2026</td>
              <td hlmTd>English</td>
              <td hlmTd>2.4 MB</td>
              <td hlmTd>Ana Torres</td>
            </tr>
            <tr hlmTr>
              <th hlmTh scope="row">Product interview</th>
              <td hlmTd>18 March 2026</td>
              <td hlmTd>Spanish</td>
              <td hlmTd>38 MB</td>
              <td hlmTd>Marc Vidal</td>
            </tr>
          </tbody>
        </table>
      </div>
    `,
  }),
};
