import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'nsi-sticky-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sticky-footer.component.html',
  styleUrl: './sticky-footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StickyFooterComponent {}
