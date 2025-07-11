
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { StickyFooterComponent } from '@nuclia/sistema';
import { PaDemoModule } from '../../../../../../libs/pastanaga-angular/projects/demo/src';

@Component({
  selector: 'nsd-sistema-sticky-footer',
  imports: [PaDemoModule, StickyFooterComponent, PaButtonModule],
  templateUrl: './sistema-sticky-footer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SistemaStickyFooterComponent {
  code = `<nsi-sticky-footer>
  <span footerNote>You can display a note on the left side</span>
  <pa-button aspect="basic">cancel</pa-button>
  <pa-button kind="primary">save</pa-button>
</nsi-sticky-footer>`;
}
