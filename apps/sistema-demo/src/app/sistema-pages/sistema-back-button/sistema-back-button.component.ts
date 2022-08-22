import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  templateUrl: './sistema-back-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SistemaBackButtonComponent {
  code = `<nsi-back-button link=".."></nsi-back-button>`;
}
