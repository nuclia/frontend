import { ChangeDetectionStrategy, Component } from '@angular/core';


@Component({
  selector: 'nsi-sticky-footer',
  standalone: true,
  imports: [],
  templateUrl: './sticky-footer.component.html',
  styleUrl: './sticky-footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StickyFooterComponent {}
