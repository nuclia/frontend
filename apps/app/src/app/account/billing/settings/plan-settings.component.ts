import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { STFConfirmComponent } from '@flaps/components';
import { filter } from 'rxjs';

@Component({
  selector: 'app-plans-settings',
  templateUrl: './plan-settings.component.html',
  styleUrls: ['./plan-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlansSettingsComponent {
  budget = new FormControl('', [Validators.required, Validators.min(0)]);

  constructor(private router: Router, private route: ActivatedRoute, private dialog: MatDialog) {}

  upgrade() {
    this.router.navigate(['settings'], { relativeTo: this.route });
  }

  skip() {
    this.dialog
      .open(STFConfirmComponent, {
        width: '540px',
        data: {
          title: 'billing.no_limit',
          message: 'billing.no_limit_description',
          confirmText: 'billing.add_limit',
          cancelText: 'generic.skip',
          minWidthButtons: '120px',
        },
      })
      .afterClosed()
      .pipe(filter((result) => result === false))
      .subscribe(() => {
        // TODO: save bugdet
        this.router.navigate(['../payment'], { relativeTo: this.route });
      });
  }

  save() {
    // TODO: save bugdet
    this.router.navigate(['../payment'], { relativeTo: this.route });
  }
}
