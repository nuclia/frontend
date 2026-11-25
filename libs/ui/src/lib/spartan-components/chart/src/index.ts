// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import { Chart, ChartTooltipBodyDirective } from '@tanstack/angular-charts';
import { HlmChart } from './lib/hlm-chart';

export * from './lib/hlm-chart';
export * from './lib/hlm-chart-theme';
export * from './lib/hlm-chart-tooltip';

export const HlmChartImports = [
  Chart,
  ChartTooltipBodyDirective,
  HlmChart,
] as const;
