import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { LabelSet, LabelSets } from '@nuclia/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SDKService } from '@flaps/core';
import { SisModalService } from '@nuclia/sistema';
import { TranslateService } from '@ngx-translate/core';
import { LabelsService } from '../../labels.service';

@Component({
  selector: 'app-label-set-list',
  templateUrl: './label-set-list.component.html',
  styleUrls: ['./label-set-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelSetListComponent {
  isAdminOrContrib: Observable<boolean> = this.sdk.currentKb.pipe(
    map((kb) => this.sdk.nuclia.options.standalone || !!kb.admin || !!kb.contrib),
  );
  labelSets: Observable<LabelSets> = this.labelsService.labelSets.pipe(
    filter((labelSets) => !!labelSets),
    map((labelSets) => labelSets as LabelSets),
  );

  expandedLabelSetIds: string[] = [];

  constructor(
    private sdk: SDKService,
    private route: ActivatedRoute,
    private router: Router,
    private labelsService: LabelsService,
    private modalService: SisModalService,
    private translate: TranslateService,
  ) {}

  addLabelSet() {
    this.router.navigate(['../add'], { relativeTo: this.route });
  }

  selectLabelSet(labelSetId: string) {
    if (this.expandedLabelSetIds.includes(labelSetId)) {
      this.expandedLabelSetIds = this.expandedLabelSetIds.filter((id) => id !== labelSetId);
    } else {
      this.expandedLabelSetIds.push(labelSetId);
    }
  }

  delete(setId: string, labelSet: LabelSet) {
    this.modalService
      .openConfirm({
        title: this.translate.instant('label-set.delete.confirm-title', { labelset: labelSet.title }),
        description: 'label-set.delete.confirm-description',
        isDestructive: true,
      })
      .onClose.pipe(
        filter((confirm) => confirm),
        switchMap(() => this.labelsService.deleteLabelSet(setId)),
        switchMap(() => this.labelsService.refreshLabelsSets()),
      )
      .subscribe();
  }
}
