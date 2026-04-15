import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'nsi-skeleton',
  templateUrl: './skeleton.component.html',
  styleUrl: './skeleton.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NsiSkeletonComponent {
  width = input<string>('100%');
  height = input<string>('1rem');
  borderRadius = input<'small' | 'medium' | 'round'>('small');
}
