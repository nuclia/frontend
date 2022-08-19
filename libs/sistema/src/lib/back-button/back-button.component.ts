import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaButtonModule, PaTranslateModule } from '@guillotinaweb/pastanaga-angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'nsi-back-button',
  standalone: true,
  imports: [CommonModule, RouterModule, PaTranslateModule, PaButtonModule],
  templateUrl: './back-button.component.html',
  styleUrls: ['./back-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackButtonComponent {
  @Input() link?: string;
}
