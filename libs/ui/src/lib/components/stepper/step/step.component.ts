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
import { UiStepContent } from '../directives/step-content.directive';
import { UiStepLabel } from '../directives/step-label.directive';

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
  templateUrl: './step.component.html',
})
export class UiStep extends CdkStep {
  private readonly _viewContainerRef = inject(ViewContainerRef);
  private readonly _destroyRef = inject(DestroyRef);

  public readonly icon = input<string | null>(null);

  public readonly stepLabelContent = contentChild(UiStepLabel);

  private readonly _lazyContent = contentChild(UiStepContent);

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
