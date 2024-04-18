import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'nsy-sync-details-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sync-details-page.component.html',
  styleUrl: './sync-details-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyncDetailsPageComponent {}
