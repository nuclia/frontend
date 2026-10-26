import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { barY, defineChart, lineY } from '@tanstack/charts';
import { scaleBand } from '@tanstack/charts/scales/band';
import { scaleLinear } from '@tanstack/charts/scales/linear';
import { scalePoint } from '@tanstack/charts/scales/point';
import { HLM_CHART_THEME, HlmChartImports, hlmChartTooltip } from '../index';
import { HlmChart } from './hlm-chart';

const monthlyResources = [
  { month: 'Jan', resources: 8 },
  { month: 'Feb', resources: 12 },
  { month: 'Mar', resources: 9 },
  { month: 'Apr', resources: 16 },
  { month: 'May', resources: 13 },
  { month: 'Jun', resources: 18 },
];

const barChartOptions = {
  definition: defineChart(
    {
      marks: [barY(monthlyResources, { x: 'month', y: 'resources', fill: 'var(--chart-1)' })],
      scales: {
        x: { scale: () => scaleBand<string>().paddingInner(0.2).paddingOuter(0.1), axis: { line: false } },
        y: { scale: scaleLinear, nice: true, grid: true, axis: { label: 'Resources' } },
      },
      theme: HLM_CHART_THEME,
    },
    { focus: 'group-x', tooltip: hlmChartTooltip() },
  ),
  ariaLabel: 'Resources added by month',
  ariaDescription: 'Bar chart showing resources added from January through June.',
  height: 250,
};

const lineChartOptions = {
  definition: defineChart(
    {
      marks: [
        lineY(monthlyResources, {
          x: 'month',
          y: 'resources',
          points: true,
          stroke: 'var(--chart-2)',
          strokeWidth: 2.5,
        }),
      ],
      scales: {
        x: { scale: () => scalePoint<string>().padding(0.2), axis: { label: 'Month' } },
        y: { scale: scaleLinear, nice: true, grid: true, axis: { label: 'Resources' } },
      },
      theme: HLM_CHART_THEME,
    },
    { focus: 'nearest-x', tooltip: hlmChartTooltip() },
  ),
  ariaLabel: 'Resources added by month',
  ariaDescription: 'Line chart showing resources added from January through June.',
  aspectRatio: 16 / 9,
};

const meta: Meta = {
  title: 'Spartan/Chart',
  component: HlmChart,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...HlmChartImports] })],
  parameters: {
    docs: {
      description: {
        component: `Import <code>HlmChartImports</code>, <code>HLM\\_CHART\\_THEME</code>, and <code>hlmChartTooltip</code> from <code>@nuclia/ui-spartan/chart</code>.
Apply <code>hlmChart</code> to a <code>tanstack-chart</code> and pass an <code>options</code> object whose <code>definition</code> is built with <code>defineChart(spec, interaction)</code> from <code>@tanstack/charts</code>.
Import scales from subpaths such as <code>@tanstack/charts/scales/band</code>, use <code>HLM\\_CHART\\_THEME</code> as the spec theme, and <code>hlmChartTooltip()</code> as the interaction tooltip.
Size the chart with <code>height</code> or <code>aspectRatio</code>, and always provide <code>ariaLabel</code> and <code>ariaDescription</code>.`,
      },
    },
    controls: {
      disable: true,
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    props: { options: barChartOptions },
    template: `
      <div class="w-full max-w-2xl">
        <tanstack-chart hlmChart [options]="options" />
      </div>
    `,
  }),
};

export const Line: Story = {
  render: () => ({
    props: { options: lineChartOptions },
    template: `
      <div class="w-full max-w-2xl">
        <tanstack-chart hlmChart [options]="options" />
      </div>
    `,
  }),
};
