import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ModalRef, PaModalModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-features',
  templateUrl: './features.component.html',
  styleUrls: ['./features.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaModalModule, TranslatePipe],
})
export class FeaturesComponent {
  features = [
    'thumbnails',
    'indexing',
    'trend',
    'videos',
    'url',
    'multilang',
    'rank',
    'usage',
    'widget',
    'typo',
    'ner',
    'boost',
    'apikey',
    'extension',
    'desktop',
    'anon',
  ];

  constructor(
    public modal: ModalRef,
    private cdr: ChangeDetectorRef,
  ) {}
}
