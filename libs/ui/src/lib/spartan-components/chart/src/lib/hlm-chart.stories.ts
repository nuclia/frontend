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
        component: `Visualizes data to make comparisons, trends, and relationships easier to understand. Use charts in reports and dashboards, with consistent colors, labels, and tooltips to support interpretation.`,
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
