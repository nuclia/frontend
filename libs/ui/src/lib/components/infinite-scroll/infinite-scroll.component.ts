import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  output,
} from '@angular/core';

@Component({
  selector: 'ui-infinite-scroll',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-slot': 'infinite-scroll', 'aria-hidden': 'true', class: 'block h-px' },
})
export class UiInfiniteScroll {
  private readonly _element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly _injector = inject(Injector);

  public readonly rootMargin = input('200px');
  public readonly disabled = input(false);
  public readonly reachAnchor = output<void>();

  constructor() {
    effect((onCleanup) => {
      const rootMargin = this.rootMargin();
      if (typeof IntersectionObserver === 'undefined') return;
      let disposed = false;
      const observer = new IntersectionObserver(
        (entries) => {
          if (this.disabled() || !entries.some((entry) => entry.isIntersecting)) return;
          this.reachAnchor.emit();
          // The observer only fires on visibility changes: observe again once the new content is rendered
          // so the anchor triggers again if it is still visible
          afterNextRender(
            () => {
              if (disposed) return;
              observer.unobserve(this._element);
              observer.observe(this._element);
            },
            { injector: this._injector },
          );
        },
        { rootMargin },
      );
      observer.observe(this._element);
      onCleanup(() => {
        disposed = true;
        observer.disconnect();
      });
    });
  }
}
