import { booleanAttribute, ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { filter, switchMap } from 'rxjs/operators';
import { LabelSet } from '@nuclia/core';
import { SisModalService } from '@nuclia/sistema';
import { TranslateService } from '@ngx-translate/core';
import { LabelsService } from '../../labels.service';
import { LabelSetDisplay } from '../model';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-label-set-list',
  templateUrl: './label-set-list.component.html',
  styleUrls: ['./label-set-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class LabelSetListComponent {
  @Input() labelSets: LabelSetDisplay[] = [];
  @Input({ transform: booleanAttribute }) isAdmin = false;

  constructor(
    private modalService: SisModalService,
    private translate: TranslateService,
    private labelsService: LabelsService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  delete(setId: string, labelSet: LabelSet, isActive: boolean) {
    this.modalService
      .openConfirm({
        title: this.translate.instant('label-set.delete.confirm-title', { labelset: labelSet.title }),
        description: 'label-set.delete.confirm-description',
        isDestructive: true,
      })
      .onClose.pipe(
        filter((confirm) => !!confirm),
        switchMap(() => this.labelsService.deleteLabelSet(setId)),
        switchMap(() => this.labelsService.refreshLabelsSets()),
      )
      .subscribe(() => {
        if (isActive) {
          this.router.navigate(['.'], { relativeTo: this.route, onSameUrlNavigation: 'reload' });
        }
      });
  }
}
