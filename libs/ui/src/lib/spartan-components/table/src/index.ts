// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import {
  HlmCaption,
  HlmTable,
  HlmTableContainer,
  HlmTBody,
  HlmTd,
  HlmTFoot,
  HlmTh,
  HlmTHead,
  HlmTr,
} from './lib/hlm-table';

export * from './lib/hlm-table';

export const HlmTableImports = [
  HlmCaption,
  HlmTableContainer,
  HlmTable,
  HlmTBody,
  HlmTd,
  HlmTFoot,
  HlmTh,
  HlmTHead,
  HlmTr,
] as const;
