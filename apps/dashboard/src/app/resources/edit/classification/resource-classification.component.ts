import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { EditResourceService } from '../edit-resource.service';
import { Classification, Resource } from '@nuclia/core';
import { map, Subject } from 'rxjs';

@Component({
  templateUrl: './resource-classification.component.html',
  styleUrls: ['./resource-classification.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceClassificationComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();
  private resourceLabels: Classification[] = [];
  currentLabels: Classification[] = [];
  isModified = false;
  noLabels = false;
  kbUrl = this.editResource.kbUrl;

  constructor(private editResource: EditResourceService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.editResource.setCurrentView('classification');
    this.editResource.resource.pipe(map((resource) => resource?.getClassifications() || [])).subscribe((labels) => {
      this.resourceLabels = labels;
      this.currentLabels = labels;
      this.isModified = false;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  updateLabels(labels: Classification[]) {
    this.currentLabels = labels;
    this.isModified = true;
  }

  cancel() {
    this.currentLabels = [...this.resourceLabels];
    this.isModified = false;
  }

  save() {
    const partial: Partial<Resource> = {
      usermetadata: {
        classifications: this.editResource.getClassificationsPayload(this.currentLabels),
      },
    };
    this.editResource.savePartialResource(partial).subscribe();
  }
}
