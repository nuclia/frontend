import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { data } from './token-consumption.mock';
import { PaDropdownModule, PaTableModule } from '@guillotinaweb/pastanaga-angular';
import { DropdownButtonComponent } from '@nuclia/sistema';

@Component({
  selector: 'nma-token-consumption',
  standalone: true,
  imports: [CommonModule, PaTableModule, DropdownButtonComponent, PaDropdownModule],
  templateUrl: './token-consumption.component.html',
  styleUrl: './token-consumption.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenConsumptionComponent {
  data = data;
}
