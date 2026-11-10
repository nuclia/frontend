import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { HlmTooltipImports } from '@nuclia/ui-spartan/tooltip';

@Component({
  selector: 'ui-option-with-description',
  imports: [HlmTooltipImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'option-with-description',
    class: 'flex min-w-0 flex-1 flex-col items-start gap-0.5 py-1 text-left',
  },
  templateUrl: './option-with-description.component.html',
})
export class UiOptionWithDescription {
  private readonly _element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  public readonly label = input.required<string>();
  public readonly description = input<string>();

  protected readonly labelTruncated = signal(false);
  protected readonly descriptionTruncated = signal(false);

  constructor() {
    const resizeObserver = new ResizeObserver(() => this._measure());
    resizeObserver.observe(this._element);
    inject(DestroyRef).onDestroy(() => resizeObserver.disconnect());

    afterRenderEffect(() => {
      this.label();
      this.description();
      this._measure();
    });
  }

  private _measure(): void {
    this.labelTruncated.set(this._isTruncated('option-with-description-label'));
    this.descriptionTruncated.set(this._isTruncated('option-with-description-text'));
  }

  private _isTruncated(slot: string): boolean {
    const element = this._element.querySelector<HTMLElement>(`[data-slot=${slot}]`);
    return !!element && element.scrollWidth > element.clientWidth;
  }
}
