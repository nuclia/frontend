import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'stf-check-mail',
  templateUrl: './check-mail.component.html',
  styleUrls: ['./check-mail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class CheckMailComponent {
  email: string;

  constructor(private route: ActivatedRoute) {
    this.email = this.route.snapshot.queryParams['email'];
  }
}
