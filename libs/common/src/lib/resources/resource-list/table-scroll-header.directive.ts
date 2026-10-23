import { afterNextRender, DestroyRef, Directive, ElementRef, inject } from '@angular/core';

@Directive({
  selector: '[stfTableScrollHeader]',
})
export class TableScrollHeaderDirective {
  private element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      const header = this.element.querySelector<HTMLElement>('.table-header-scroll');
      const body = this.element.querySelector<HTMLElement>('.table-body-scroll');
      const grid = body?.querySelector<HTMLElement>('.pa-table-grid');
      const card = body?.querySelector<HTMLElement>('.table-card');
      if (!header || !body || !grid || !card) {
        throw new Error('Resource table requires header and body scroll containers and a body grid.');
      }

      const resize = () => {
        this.element.style.setProperty('--resource-table-width', `${card.getBoundingClientRect().width}px`);
        header.scrollLeft = body.scrollLeft;
      };
      const scrollBody = () => {
        header.scrollLeft = body.scrollLeft;
      };
      const scrollHeader = () => {
        body.scrollLeft = header.scrollLeft;
      };
      const observer = new ResizeObserver(resize);
      observer.observe(grid);
      body.addEventListener('scroll', scrollBody, { passive: true });
      header.addEventListener('scroll', scrollHeader, { passive: true });
      resize();
      this.destroyRef.onDestroy(() => {
        observer.disconnect();
        body.removeEventListener('scroll', scrollBody);
        header.removeEventListener('scroll', scrollHeader);
      });
    });
  }
}
