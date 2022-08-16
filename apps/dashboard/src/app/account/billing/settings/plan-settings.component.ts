import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, Validators } from '@angular/forms';
import { filter } from 'rxjs';
import { SisModalService } from '@nuclia/sistema';

@Component({
  selector: 'app-plans-settings',
  templateUrl: './plan-settings.component.html',
  styleUrls: ['./plan-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlansSettingsComponent {
  budget = new FormControl('', [Validators.required, Validators.min(0)]);

  constructor(private router: Router, private route: ActivatedRoute, private modalService: SisModalService) {}

  upgrade() {
    this.router.navigate(['settings'], { relativeTo: this.route });
  }

  skip() {
    this.modalService
      .openConfirm({
        title: 'billing.no_limit',
        description: 'billing.no_limit_description',
        confirmLabel: 'billing.add_limit',
        cancelLabel: 'generic.skip',
      })
      .onClose.pipe(filter((confirm) => confirm === false))
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
