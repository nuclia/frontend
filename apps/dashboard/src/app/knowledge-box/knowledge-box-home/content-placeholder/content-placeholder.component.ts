import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { InfoCardComponent } from '@nuclia/sistema';

@Component({
  selector: 'app-content-placeholder',
  imports: [InfoCardComponent],
  templateUrl: './content-placeholder.component.html',
  styleUrl: './content-placeholder.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentPlaceholderComponent {
  text = input.required<string>();
}
