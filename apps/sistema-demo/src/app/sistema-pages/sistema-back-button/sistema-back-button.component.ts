import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  templateUrl: './sistema-back-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SistemaBackButtonComponent {
  code = `<nsi-back-button link="..">Back</nsi-back-button>`;
}
