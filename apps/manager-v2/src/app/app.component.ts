import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { AppInitService } from '@flaps/core';

@Component({
  selector: 'nma-root',
  template: '@if (ready) {<nma-main></nma-main>} @else {Loading…}',
  standalone: false,
})
export class AppComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private init = inject(AppInitService);

  ready = false;
  ngOnInit(): void {
    this.init.ready.subscribe(() => {
      this.ready = true;
      this.cdr.markForCheck();
    });
  }
}
