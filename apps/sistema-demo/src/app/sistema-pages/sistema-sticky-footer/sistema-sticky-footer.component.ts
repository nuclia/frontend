import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaDemoModule } from '../../../../../../libs/pastanaga-angular/projects/demo/src';
import { StickyFooterComponent } from '@nuclia/sistema';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'nsd-sistema-sticky-footer',
  imports: [CommonModule, PaDemoModule, StickyFooterComponent, PaButtonModule],
  templateUrl: './sistema-sticky-footer.component.html',
  styleUrl: './sistema-sticky-footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SistemaStickyFooterComponent {
  code = `<nsi-sticky-footer>
  <span footerNote>You can display a note on the left side</span>
  <pa-button aspect="basic">cancel</pa-button>
  <pa-button kind="primary">save</pa-button>
</nsi-sticky-footer>`;
}
