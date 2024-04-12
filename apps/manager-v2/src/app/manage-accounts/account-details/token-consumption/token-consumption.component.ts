import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'nma-token-consumption',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './token-consumption.component.html',
  styleUrl: './token-consumption.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenConsumptionComponent {}
