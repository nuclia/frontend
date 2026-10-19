import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ICONS } from '../../../../assets/glyphs';
import { BaseIconPageComponent } from '@guillotinaweb/pastanaga-angular/demo';
import { PaDemoModule } from '../../../../../../../libs/pastanaga-angular/projects/demo/src/app/demo/demo.module';
import { PaIconModule } from '../../../../../../../libs/pastanaga-angular/projects/pastanaga-angular/src/lib/icon/icon.module';
import { PaTextFieldModule } from '../../../../../../../libs/pastanaga-angular/projects/pastanaga-angular/src/lib/controls/textfield/text-field.module';
import { FormsModule } from '@angular/forms';
import { PaDropdownModule } from '../../../../../../../libs/pastanaga-angular/projects/pastanaga-angular/src/lib/dropdown/dropdown.module';

@Component({
    templateUrl: '../../../../../../../libs/pastanaga-angular/projects/demo/src/app/demo/pages/icon-page/icon-page.component.html',
    styleUrls: [
        '../../../../../../../libs/pastanaga-angular/projects/demo/src/app/demo/pages/icon-page/icon-page.component.scss',
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        PaDemoModule,
        PaIconModule,
        PaTextFieldModule,
        FormsModule,
        PaDropdownModule,
    ],
})
export class SistemaIconsComponent extends BaseIconPageComponent implements OnInit {
  ngOnInit(): void {
    this.icons = ICONS.toSorted((a, b) => a.localeCompare(b));
  }
}
