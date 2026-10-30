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
        component: `Visualize data to make comparisons, trends and relationships easier to understand. Use charts in reports and dashboards, with consistent colors, labels and tooltips.
Import <code>HlmChartImports</code> from <code>@nuclia/ui-spartan/chart</code> and add the <code>hlmChart</code> directive to a <code>&lt;tanstack-chart&gt;</code> element (TanStack Charts for Angular).

<code>hlmChart</code> only applies the Spartan theme (the <code>--chart-1</code>…<code>--chart-5</code> palette, tooltip colors). The chart itself is configured through the <code>options</code> input of <code>tanstack-chart</code>:
build a <code>definition</code> with <code>defineChart</code>, pass <code>HLM_CHART_THEME</code> as <code>theme</code> and <code>hlmChartTooltip()</code> as tooltip, then set <code>height</code> or <code>aspectRatio</code>.
Always provide <code>ariaLabel</code> and <code>ariaDescription</code> in the options so screen reader users get a summary of the data. The chart has no Storybook controls as it is configured through the options object.`,
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
