// Copyright (c) 2026 Progress Software Corporation and/or its subsidiaries or affiliates. All Rights Reserved.

import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from '@angular/core';
import { HlmButton } from '@progress/pdp-ui-spartan/button';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { UiConfirmData, UiConfirmDialog } from './confirm-dialog.component';
import { UiConfirmService } from './confirm.service';

@Component({
  selector: 'ui-confirm-dialog-story',
  imports: [HlmButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      hlmBtn
      type="button"
      [variant]="data().isDestructive ? 'destructive' : 'default'"
      (click)="open()"
    >
      Open confirmation
    </button>
    @if (result() !== null) {
      <p class="mt-4 text-sm" role="status">
        Result: {{ result() ? 'confirmed' : 'cancelled' }}
      </p>
    }
  `,
})
class ConfirmDialogStory {
  readonly data = input.required<UiConfirmData>();
  protected readonly result = signal<boolean | null>(null);
  private readonly confirmService = inject(UiConfirmService);

  protected open(): void {
    this.result.set(null);
    this.confirmService.confirm(this.data()).subscribe((confirmed) => {
      this.result.set(confirmed);
    });
  }
}

const meta: Meta<UiConfirmData> = {
  title: 'PDP-UI/Confirm dialog',
  component: UiConfirmDialog,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [ConfirmDialogStory] })],
  parameters: {
    docs: {
      description: {
        component: `A confirmation dialog opened with <code>UiConfirmService</code>.
Import <code>UiConfirmService</code> and <code>UiConfirmData</code> from <code>@progress/pdp-ui</code>.

Inject the service and call <code>confirm({ title, description, confirmLabel, cancelLabel, isDestructive })</code>.
The returned observable emits <code>true</code> when confirmed and <code>false</code> when cancelled or dismissed.
The description and button labels are optional; the default labels are Confirm and Cancel.
Set <code>isDestructive</code> for actions such as deletion. Outside clicks do not close the dialog.`,
      },
    },
  },
  args: {
    title: 'Continue?',
    description: 'Please confirm that you want to continue.',
    isDestructive: false,
  },
  argTypes: {
    title: { description: 'Dialog title.', control: 'text' },
    description: {
      description: 'Optional dialog description.',
      control: 'text',
    },
    confirmLabel: {
      description: 'Confirm button label. Defaults to Confirm.',
      control: 'text',
    },
    cancelLabel: {
      description: 'Cancel button label. Defaults to Cancel.',
      control: 'text',
    },
    isDestructive: {
      description: 'Uses the destructive style for the confirm button.',
      control: 'boolean',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <ui-confirm-dialog-story
        [data]="{ title, description, confirmLabel, cancelLabel, isDestructive }"
      />
    `,
  }),
};

export default meta;
type Story = StoryObj<UiConfirmData>;

export const Default: Story = {};

export const WithoutDescription: Story = {
  args: { title: 'Continue?', description: undefined },
};

export const Destructive: Story = {
  args: {
    title: 'Delete this item?',
    description: 'This action cannot be undone.',
    confirmLabel: 'Delete',
    cancelLabel: 'Keep',
    isDestructive: true,
  },
};
