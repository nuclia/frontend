import { CdkPortalOutlet, TemplatePortal } from '@angular/cdk/portal';
import { CdkStep } from '@angular/cdk/stepper';
import {
  ChangeDetectionStrategy,
  Component,
  contentChild,
  DestroyRef,
  effect,
  inject,
  input,
  untracked,
  ViewContainerRef,
} from '@angular/core';
import { UiStepContent } from './ui-step-content';
import { UiStepLabel } from './ui-step-label';

@Component({
  selector: 'ui-step',
  exportAs: 'uiStep',
  imports: [CdkPortalOutlet],
  providers: [
    {
      provide: CdkStep,
      useExisting: UiStep,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    hidden: '',
  },
  template: `
    <ng-template>
      <ng-content></ng-content>
      <ng-template [cdkPortalOutlet]="portal"></ng-template>
    </ng-template>
  `,
})
export class UiStep extends CdkStep {
  private readonly _viewContainerRef = inject(ViewContainerRef);
  private readonly _destroyRef = inject(DestroyRef);

  public readonly icon = input<string | null>(null);

  /** Content for step label given by `<ng-template UiStepLabel>`. */
  public readonly stepLabelContent = contentChild(UiStepLabel);

  /** Content that will be rendered lazily. */
  private readonly _lazyContent = contentChild(UiStepContent);

  /** Currently-attached portal containing the lazy content. */
  public portal: TemplatePortal | null = null;

  constructor() {
    super();

    effect(() => {
      const isSelected = this.isSelected();
      const lazyContent = this._lazyContent();

      untracked(() => {
        if (isSelected && lazyContent && !this.portal) {
          this.portal = new TemplatePortal(lazyContent.template, this._viewContainerRef);
        }
      });
    });

    this._destroyRef.onDestroy(() => {
      if (this.portal?.isAttached) {
        this.portal.detach();
      }
    });
  }
}
