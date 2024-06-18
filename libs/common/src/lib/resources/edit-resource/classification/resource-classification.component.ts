import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Classification, LabelSetKind, LabelSets, Resource } from '@nuclia/core';
import { BehaviorSubject, combineLatest, map, Observable, Subject, tap } from 'rxjs';
import { filter, switchMap, takeUntil } from 'rxjs/operators';
import { LabelsService } from '@flaps/core';
import { getClassificationFromSelection, getSelectionFromClassification } from '@nuclia/sistema';
import { EditResourceService } from '../edit-resource.service';

@Component({
  templateUrl: './resource-classification.component.html',
  styleUrls: ['../common-page-layout.scss', './resource-classification.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceClassificationComponent implements OnInit, OnDestroy {
  backupLabels: Classification[] = [];
  isModified = false;
  kbUrl = this.editResource.kbUrl;
  isAdminOrContrib = this.editResource.isAdminOrContrib;
  unsubscribeAll = new Subject<void>();

  currentSelection: { [id: string]: boolean } = {};

  private _resourceLabelSets = this.labelsService.resourceLabelSets.pipe(tap(() => this._hasLabelLoaded.next(true)));

  resourceLabelSets = this._resourceLabelSets.pipe(
    filter((labelset) => !!labelset && Object.keys(labelset).length > 0),
    map((labelset) => labelset as LabelSets),
    switchMap((labelSets) =>
      this.currentLabels.pipe(
        map((selection) => {
          // add missing labels
          // (the resources may have labels that are not defined in the kb's LabelSets)
          selection.forEach((label) => {
            if (!labelSets[label.labelset]) {
              labelSets[label.labelset] = {
                multiple: true,
                labels: [],
                title: label.labelset,
                color: '',
                kind: [LabelSetKind.RESOURCES],
              };
            }
            if (!labelSets[label.labelset].labels.find((item) => item.title === label.label)) {
              labelSets[label.labelset].labels.push({ title: label.label });
            }
          });
          return labelSets;
        }),
      ),
    ),
  );
  currentLabels: BehaviorSubject<Classification[]> = new BehaviorSubject<Classification[]>([]);
  hasLabels: Observable<boolean> = this._resourceLabelSets.pipe(
    map((labelSets) => !!labelSets && Object.keys(labelSets).length > 0),
  );

  private _hasLabelLoaded = new BehaviorSubject(false);
  private _resourceClassificationLoaded = new BehaviorSubject(false);
  isReady = combineLatest([this._hasLabelLoaded, this._resourceClassificationLoaded]).pipe(
    map(([hasLabelLoaded, resourceClassificationLoaded]) => hasLabelLoaded && resourceClassificationLoaded),
  );

  constructor(
    private cdr: ChangeDetectorRef,
    private labelsService: LabelsService,
    private editResource: EditResourceService,
  ) {}

  ngOnInit(): void {
    this.editResource.setCurrentView('classification');
    this.editResource.resource
      .pipe(
        filter((resource) => !!resource),
        map((resource) => (resource as Resource).getClassifications() || []),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe((labels) => {
        this.backupLabels = labels;
        this.currentLabels.next(labels);
        this.isModified = false;
        this._resourceClassificationLoaded.next(true);
        this.cdr.detectChanges();
      });
    combineLatest([this.resourceLabelSets, this.currentLabels])
      .pipe(
        tap(([labelSets, labels]) => {
          this.currentSelection = getSelectionFromClassification(labelSets, labels);
          this.cdr.detectChanges();
        }),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  updateLabels(labels: Classification[]) {
    this.currentLabels.next(labels);
    this.updateIsModified();
    this.cdr.detectChanges();
  }

  cancel() {
    this.currentLabels.next([...this.backupLabels]);
    this.isModified = false;
    this.cdr.markForCheck();
  }

  save() {
    const partial: Partial<Resource> = {
      usermetadata: {
        classifications: this.editResource.getClassificationsPayload(this.currentLabels.value),
      },
    };
    this.editResource.savePartialResource(partial).subscribe();
  }

  updateLabel(newSelection: { [id: string]: boolean }) {
    this.currentLabels.next(getClassificationFromSelection(newSelection));
    this.updateIsModified();
  }

  private updateIsModified() {
    const current = this.currentLabels.value;
    this.isModified =
      current.length !== this.backupLabels.length ||
      !current.every(
        (classification) =>
          !!this.backupLabels.find(
            (item) => item.labelset === classification.labelset && item.label === classification.label,
          ),
      );
    this.cdr.markForCheck();
  }
}
