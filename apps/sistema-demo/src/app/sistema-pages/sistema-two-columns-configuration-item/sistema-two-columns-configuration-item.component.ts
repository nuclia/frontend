
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import { PaDemoModule } from '../../../../../../libs/pastanaga-angular/projects/demo/src';

@Component({
  selector: 'nsd-sistema-two-columns-configuration-item',
  imports: [PaDemoModule, TwoColumnsConfigurationItemComponent, PaTogglesModule],
  templateUrl: './sistema-two-columns-configuration-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SistemaTwoColumnsConfigurationItemComponent {
  code = `<nsi-two-columns-configuration-item
    itemTitle="Here is the item title"
    badge="optional label"
    description="and here the item description">
    In here you can put whatever content you need, it will be displayed on the second column.
</nsi-two-columns-configuration-item>`;
}
