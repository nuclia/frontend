import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { shareReplay, take } from 'rxjs';
import { BillingService } from '../billing.service';

@Component({
  selector: 'app-usage',
  templateUrl: './usage.component.html',
  styleUrls: ['./usage.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsageComponent {
  usage = this.billing.getAccountUsage().pipe(shareReplay());
  budget = new FormControl<number>(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] });

  constructor(private billing: BillingService) {
    this.usage.pipe(take(1)).subscribe((usage) => {
      this.budget.setValue(usage.budget);
    });
  }

  save() {
    // TODO: save budget
  }
}
