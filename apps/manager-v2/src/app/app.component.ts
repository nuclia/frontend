import { ChangeDetectorRef, Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { AppInitService } from '@flaps/core';
import { MainComponent } from './main.component';

@Component({
    selector: 'nma-root',
    template: '@if (ready) {<nma-main></nma-main>} @else {Loading…}',
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [MainComponent],
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
