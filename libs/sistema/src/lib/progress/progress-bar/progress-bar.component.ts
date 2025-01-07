import { booleanAttribute, ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'nsi-progress-bar',
  imports: [CommonModule],
  templateUrl: './progress-bar.component.html',
  styleUrl: './progress-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressBarComponent {
  @Input() progress: number | null | undefined = 0;
  @Input({ transform: booleanAttribute }) greyTrack = false;
  @Input({ transform: booleanAttribute }) greyBar = false;

  get isIndeterminate() {
    return this.progress === null || this.progress === undefined;
  }
}
