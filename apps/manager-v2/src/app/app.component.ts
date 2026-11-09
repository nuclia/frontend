import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AppInitService } from '@flaps/core';
import { map } from 'rxjs';
import { MainComponent } from './main.component';

@Component({
  selector: 'nma-root',
  template: '@if (ready()) {<nma-main></nma-main>} @else {Loading…}',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [MainComponent],
})
export class AppComponent {
  private init = inject(AppInitService);

  ready = toSignal(this.init.ready.pipe(map(() => true)), { initialValue: false });
}
