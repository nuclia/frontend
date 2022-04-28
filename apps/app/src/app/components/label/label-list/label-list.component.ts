import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { TagSize } from '@flaps/components';
import { LabelValue } from '@nuclia/core';

@Component({
  selector: 'app-label-list',
  templateUrl: './label-list.component.html',
  styleUrls: ['./label-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelListComponent {
  @Input() labels: LabelValue[] = [];
  @Input() size: TagSize = 'normal';
}
