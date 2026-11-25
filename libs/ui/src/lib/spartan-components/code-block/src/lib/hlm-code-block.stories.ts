// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import {
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  matDescriptionRound,
  matErrorRound,
} from '@ng-icons/material-symbols/round';
import { HlmCodeBlockImports } from '../index';
import { HlmCodeBlock } from './hlm-code-block';

interface CodeBlockStoryArgs {
  variant: 'default' | 'destructive';
  size: 'default' | 'sm';
  lineNumbers: boolean;
  wrap: boolean;
  startLine: number;
  title: string;
  code: string;
}

const SAMPLE_CODE = `import { Component } from '@angular/core';

@Component({
  selector: 'app-greeting',
  template: '<p>Hello, {{ name }}!</p>',
})
export class Greeting {
  name = 'world';
}`;

const meta: Meta<CodeBlockStoryArgs> = {
  title: 'Spartan/Code Block',
  component: HlmCodeBlock,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [...HlmCodeBlockImports, NgIcon],
      providers: [provideIcons({ matDescriptionRound, matErrorRound })],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: `Displays a read-only snippet of code or terminal output, with an optional header, footer and copy action.
Import <code>HlmCodeBlockImports</code> from <code>@progress/pdp-ui-spartan/code-block</code> and compose <code>hlm-code-block</code> with <code>hlm-code-block-header</code> (containing <code>hlm-code-block-title</code>), <code>pre[hlmCodeBlockContent]</code> and an optional <code>hlm-code-block-footer</code>.

Pass the source through the <code>code</code> input of <code>hlmCodeBlockContent</code>, or project <code>span[hlmCodeBlockLine]</code> elements to control each line. Set <code>lineNumbers</code>, <code>startLine</code> and <code>wrap</code> on the content, and <code>variant</code> and <code>size</code> on the block. Lines accept <code>variant</code> <code>added</code>, <code>removed</code> or <code>highlighted</code> to render diffs.

Place <code>button[hlmCodeBlockCopyButton]</code> inside <code>hlm-code-block-actions</code>; it copies its <code>value</code> to the clipboard and announces the result. Directly inside the block, actions float over the top corner and appear on hover or focus. The content is focusable so keyboard users can scroll long lines.`,
      },
    },
  },
  args: {
    variant: 'default',
    size: 'default',
    lineNumbers: false,
    wrap: false,
    startLine: 1,
    title: 'greeting.ts',
    code: SAMPLE_CODE,
  },
  argTypes: {
    variant: {
      description: 'Visual style of the block. Use destructive for errors.',
      control: 'inline-radio',
      options: ['default', 'destructive'],
    },
    size: {
      description: 'Size of the text and paddings.',
      control: 'inline-radio',
      options: ['default', 'sm'],
    },
    lineNumbers: {
      description: 'Shows a line number in front of each line.',
      control: 'boolean',
    },
    wrap: {
      description: 'Wraps long lines instead of scrolling horizontally.',
      control: 'boolean',
    },
    startLine: {
      description: 'Number of the first line when line numbers are shown.',
      control: { type: 'number', min: 1 },
    },
    title: {
      description: 'Text shown in <code>hlm-code-block-title</code>.',
      control: 'text',
    },
    code: {
      description:
        'Source rendered by the <code>code</code> input of <code>hlmCodeBlockContent</code>.',
      control: 'text',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <hlm-code-block class="max-w-lg" [variant]="variant" [size]="size">
        <hlm-code-block-header>
          <hlm-code-block-title>
            <ng-icon name="matDescriptionRound" aria-hidden="true" />{{ title }}
          </hlm-code-block-title>
          <hlm-code-block-actions>
            <button hlmCodeBlockCopyButton [value]="code"></button>
          </hlm-code-block-actions>
        </hlm-code-block-header>
        <pre
          hlmCodeBlockContent
          [attr.aria-label]="title"
          [code]="code"
          [lineNumbers]="lineNumbers"
          [wrap]="wrap"
          [startLine]="startLine"></pre>
      </hlm-code-block>
    `,
  }),
};

export default meta;

type Story = StoryObj<CodeBlockStoryArgs>;

export const Default: Story = {};

export const LineNumbers: Story = {
  args: { lineNumbers: true },
};

export const StartLine: Story = {
  args: { lineNumbers: true, startLine: 42 },
};

export const Wrap: Story = {
  args: {
    wrap: true,
    title: 'install.sh',
    code: 'npm install @spartan-ng/brain @spartan-ng/cli class-variance-authority clsx tailwind-merge @ng-icons/core @ng-icons/material-symbols',
  },
};

export const Small: Story = {
  args: { size: 'sm' },
};

export const Destructive: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    props: {
      error: `TypeError: Cannot read properties of undefined (reading 'name')
    at Greeting.render (greeting.ts:9:12)`,
    },
    template: `
      <hlm-code-block class="max-w-lg" variant="destructive">
        <hlm-code-block-header>
          <hlm-code-block-title>
            <ng-icon name="matErrorRound" aria-hidden="true" />Error
          </hlm-code-block-title>
        </hlm-code-block-header>
        <pre hlmCodeBlockContent aria-label="Error" [code]="error"></pre>
      </hlm-code-block>
    `,
  }),
};

export const FloatingActions: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    props: { command: 'npx nx run ui:storybook' },
    template: `
      <hlm-code-block class="max-w-lg">
        <hlm-code-block-actions>
          <button hlmCodeBlockCopyButton [value]="command"></button>
        </hlm-code-block-actions>
        <pre hlmCodeBlockContent aria-label="Command" [code]="command"></pre>
      </hlm-code-block>
    `,
  }),
};

export const Diff: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    props: {
      lines: [
        { variant: 'default', text: 'export class Greeting {' },
        { variant: 'removed', text: "  name = 'world';" },
        { variant: 'added', text: "  name = 'Spartan';" },
        { variant: 'highlighted', text: '  greet() { return this.name; }' },
        { variant: 'default', text: '}' },
      ],
    },
    template: `
      <hlm-code-block class="max-w-lg">
        <hlm-code-block-header>
          <hlm-code-block-title>greeting.ts</hlm-code-block-title>
        </hlm-code-block-header>
        <pre hlmCodeBlockContent aria-label="greeting.ts diff" lineNumbers startLine="7">@for (line of lines; track $index) {<span hlmCodeBlockLine [variant]="line.variant">{{ line.text }}</span>}</pre>
      </hlm-code-block>
    `,
  }),
};

export const WithFooter: Story = {
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    props: { output: '✓ 128 tests passed\n✓ 0 failed' },
    template: `
      <hlm-code-block class="max-w-lg" size="sm">
        <hlm-code-block-header>
          <hlm-code-block-title>Test output</hlm-code-block-title>
        </hlm-code-block-header>
        <pre hlmCodeBlockContent aria-label="Test output" [code]="output"></pre>
        <hlm-code-block-footer>Finished in 4.2s</hlm-code-block-footer>
      </hlm-code-block>
    `,
  }),
};
