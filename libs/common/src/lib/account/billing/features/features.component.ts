import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ModalRef } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'app-features',
  templateUrl: './features.component.html',
  styleUrls: ['./features.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
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

  constructor(public modal: ModalRef, private cdr: ChangeDetectorRef) {}
}
