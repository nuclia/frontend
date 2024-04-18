import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'nsy-folder-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './folder-selection.component.html',
  styleUrl: './folder-selection.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FolderSelectionComponent {}
