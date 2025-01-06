import { booleanAttribute, ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'nus-user-container',
  templateUrl: './user-container.component.html',
  styleUrls: ['./user-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class UserContainerComponent {
  @Input({ transform: booleanAttribute }) alignLeft = false;
}
