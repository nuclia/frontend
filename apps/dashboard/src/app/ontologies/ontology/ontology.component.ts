import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { filter, switchMap, takeUntil, tap } from 'rxjs/operators';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { LabelsService } from '../../services/labels.service';
import { Sluggable } from '@flaps/common';
import { STFUtils } from '@flaps/core';
import { Label, LabelSetKind, LabelSets } from '@nuclia/core';
import { EMTPY_LABEL_SET, MutableLabelSet } from '../model';
import { LABEL_MAIN_COLORS } from '../utils';
import { IErrorMessages } from '@guillotinaweb/pastanaga-angular';
import { SisModalService } from '@nuclia/sistema';

interface OntologyTitleError extends IErrorMessages {
  required: string;
  sluggable: string;
}

@Component({
  selector: 'app-ontology',
  templateUrl: './ontology.component.html',
  styleUrls: ['./ontology.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OntologyComponent implements OnDestroy {
  ontologyForm = this.formBuilder.group({
    title: ['', [Validators.required, Sluggable()]],
    description: [''],
  });

  colors: string[] = LABEL_MAIN_COLORS;
  kinds = [
    { id: LabelSetKind.RESOURCES, name: 'ontology.resources' },
    { id: LabelSetKind.PARAGRAPHS, name: 'ontology.paragraphs' },
    { id: LabelSetKind.SENTENCES, name: 'ontology.sentences' },
  ];

  validationMessages: { [key: string]: OntologyTitleError } = {
    title: {
      required: 'validation.title_required',
      sluggable: 'ontology.invalid_name',
    },
  };

  ontology?: MutableLabelSet;
  ontologySlug?: string;
  addNew: boolean = false;
  labelOrder: string[] = [];
  initialLabels?: LabelSets;
  hasChanges: boolean = false;
  showMultiple = false; // TODO: delete when multiple field works
  unsubscribeAll = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private labelsService: LabelsService,
    private formBuilder: UntypedFormBuilder,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private modalService: SisModalService,
  ) {
    this.route.params
      .pipe(
        tap((params) => {
          this.ontologySlug = params.ontology;
          this.addNew = params.ontology === undefined;
        }),
        switchMap(() => this.labelsService.labels),
        filter((labels) => !!labels),
        filter((labels) => !this.ontologySlug || !!(this.ontologySlug && labels![this.ontologySlug])),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe((labels) => {
        this.initialLabels = labels || undefined;
        this.initState(labels!);
      });

    this.ontologyForm.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe((data) => {
      if (this.ontology) {
        this.ontology.title = data.title;
        // TODO: description field doesn't exist
        //this.ontology.description = data.description;
        this.hasChanges = true;
        this.cdr.markForCheck();
      }
    });
  }

  initState(labels: LabelSets) {
    if (this.ontologySlug) {
      this.ontology = new MutableLabelSet(labels![this.ontologySlug]);
    } else {
      this.ontology = new MutableLabelSet(EMTPY_LABEL_SET);
    }
    this.ontologyForm.get('title')?.patchValue(this.ontology.title);
    // TODO: description field doesn't exist
    //this.ontologyForm.get('description')?.patchValue(this.ontology.description);
    this.labelOrder = this.getLabelOrder();
    this.hasChanges = false;
    this.cdr.markForCheck();
  }

  getLabelOrder(): string[] {
    return this.ontology?.labels ? this.ontology.labels.map((label) => label.title) : [];
  }

  setColor(color: string) {
    if (this.ontology) {
      this.ontology.color = color;
      this.hasChanges = true;
      this.cdr.markForCheck();
    }
  }

  addLabel(title: string) {
    if (this.isDuplicatedLabel(title)) {
      this.showDuplicationWarning(title);
      return;
    }
    this.ontology?.addLabel(title);
    this.labelOrder = this.getLabelOrder();
    this.hasChanges = true;
    this.cdr.markForCheck();
  }

  modifyLabel(title: string, changes: Partial<Label>) {
    if (changes.title && this.isDuplicatedLabel(changes.title)) {
      this.showDuplicationWarning(changes.title);
      return;
    }
    this.ontology?.modifyLabel(title, changes);
    this.labelOrder = this.getLabelOrder();
    this.hasChanges = true;
    this.cdr.markForCheck();
  }

  deleteLabel(title: string) {
    this.ontology?.deleteLabel(title);
    this.labelOrder = this.getLabelOrder();
    this.hasChanges = true;
    this.cdr.markForCheck();
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.labelOrder, event.previousIndex, event.currentIndex);
    this.ontology?.setLabelOrder(this.labelOrder);
    this.hasChanges = true;
    this.cdr.markForCheck();
  }

  saveOntology(): void {
    if (!this.ontologyForm.valid) return;
    let slug: string;
    if (this.addNew) {
      const slugs = Object.keys(this.initialLabels!);
      slug = STFUtils.generateUniqueSlug(this.ontologyForm.value.title, slugs);
    } else {
      slug = this.ontologySlug!;
    }
    this.labelsService
      .saveLabelSet(slug, this.ontology!.getCopy())
      .pipe(
        switchMap(() => this.labelsService.refreshLabelsSets()),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe(() => {
        this.goToOntologyList();
      });
  }

  deleteOntology(): void {
    this.modalService
      .openConfirm({
        title: 'ontology.delete_confirm_title',
        description: 'ontology.delete_warning_extra',
        isDestructive: true,
      })
      .onClose.pipe(
        filter((confirm) => !!confirm),
        switchMap(() => this.labelsService.deleteLabelSet(this.ontologySlug!)),
        switchMap(() => this.labelsService.refreshLabelsSets()),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe(() => {
        this.goToOntologyList();
      });
  }

  cancelChanges(): void {
    if (this.initialLabels) {
      this.initState(this.initialLabels);
    }
  }

  isDuplicatedLabel(title: string): boolean {
    return !!this.ontology?.labels?.find((label) => label.title === title);
  }

  isSelectedKind(kind: LabelSetKind): boolean {
    return !!this.ontology?.kind.includes(kind);
  }

  setKind(kind: LabelSetKind, selected: boolean) {
    if (this.ontology) {
      if (selected) {
        this.ontology.kind = this.ontology.kind.concat([kind]);
      } else {
        this.ontology.kind = this.ontology.kind.filter((item) => item !== kind);
      }
      this.hasChanges = true;
      this.cdr.markForCheck();
    }
  }

  setMultiple(selected: boolean) {
    if (this.ontology) {
      this.ontology.multiple = selected;
      this.hasChanges = true;
      this.cdr.markForCheck();
    }
  }

  showDuplicationWarning(title: string) {
    this.translate
      .get('ontology.duplicated_label', { title: title })
      .pipe(
        switchMap(
          (message) =>
            this.modalService.openConfirm({
              title: message,
              onlyConfirm: true,
              confirmLabel: 'OK',
            }).onClose,
        ),
      )
      .subscribe();
  }

  goToOntologyList() {
    this.router.navigate(['..'], { relativeTo: this.route });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
