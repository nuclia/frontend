import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { SDKService } from '@flaps/core';
import { map } from 'rxjs';

@Component({
  selector: 'app-simple-page',
  standalone: false,
  template: `
    @if (isReader()) {
      <app-reader-experience></app-reader-experience>
    } @else {
      <app-simple-kb></app-simple-kb>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimplePageComponent {
  private sdk = inject(SDKService);
  isReader = toSignal(this.sdk.currentKb.pipe(map((kb) => !kb.admin && !kb.contrib)), { initialValue: true });
}
