import { Component, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil, switchMap, tap, filter } from 'rxjs/operators';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { LabelsService } from '../../services/labels.service';
import { Sluggable } from '@flaps/common';
import { STFConfirmComponent } from '@flaps/components';
import { STFUtils } from '@flaps/core';
import { Label, Labels, LabelSetKind } from '@nuclia/core';
import { MutableLabelSet, EMTPY_LABEL_SET } from '../model';
import { LABEL_MAIN_COLORS } from '../utils';

@Component({
  selector: 'app-ontology',
  templateUrl: './ontology.component.html',
  styleUrls: ['./ontology.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OntologyComponent implements OnDestroy {
  
  ontologyForm = this.formBuilder.group({
    title: ['', [Validators.required, Sluggable()]],
    description: [''],
  });

  colors: string[] = LABEL_MAIN_COLORS;
  kinds = [
    { id: LabelSetKind.RESOURCES, name: 'ontology.resources'},
    { id: LabelSetKind.PARAGRAPHS, name: 'ontology.paragraphs'},
    { id: LabelSetKind.SENTENCES, name: 'ontology.sentences'},
  ];

  validationMessages = {
    title: {
      required: 'validation.title_required',
      sluggable: 'ontology.invalid_name',
    }
  };

  ontology?: MutableLabelSet;
  ontologySlug?: string;
  addNew: boolean = false;
  labelOrder: string[] = [];
  initialLabels?: Labels;
  hasChanges: boolean = false;
  showMultiple = false; // TODO: delete when multiple field works
  unsubscribeAll = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private labelsService: LabelsService,
    private formBuilder: UntypedFormBuilder,
    private dialog: MatDialog,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
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
        takeUntil(this.unsubscribeAll)
      )
      .subscribe((labels) => {
        this.initialLabels = labels || undefined;
        this.initState(labels!);
      });

    this.ontologyForm.valueChanges
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe((data) => {
        if (this.ontology) {
          this.ontology.title = data.title;
          // TODO: description field doesn't exist
          //this.ontology.description = data.description;
          this.hasChanges = true;
          this.cdr.markForCheck();
        }
      });
  }

  initState(labels: Labels) {
    if (this.ontologySlug) {
      this.ontology = new MutableLabelSet(labels![this.ontologySlug]);
    }
    else {
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
    }
    else {
      slug = this.ontologySlug!;
    }
    this.labelsService.saveLabelSet(slug, this.ontology!.getCopy())
      .pipe(switchMap(() => this.labelsService.refreshLabelsSets()))
      .subscribe(() => {
        this.goToOntologyList();
      });
  }

  deleteOntology(): void {
    const dialogRef = this.dialog.open(STFConfirmComponent, {
      width: '420px',
      data: {
        title: 'generic.alert',
        message: 'ontology.delete_warning_extra',
        minWidthButtons: '110px'
      }
    });
    dialogRef
      .afterClosed()
      .pipe(
        filter((result) => !!result),
        takeUntil(this.unsubscribeAll),
        switchMap(() => this.labelsService.deleteLabelSet(this.ontologySlug!)),
        switchMap(() => this.labelsService.refreshLabelsSets())
      )
      .subscribe(() => {
        this.goToOntologyList();
      });
  }

  cancelChanges(): void {
    if (this.initialLabels) {
      this.initState(this.initialLabels)
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
      }
      else {
        this.ontology.kind = this.ontology.kind.filter(item => item !== kind);
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
    this.dialog.open(STFConfirmComponent, {
      width: '420px',
      data: {
        title: 'generic.alert',
        messageHtml$: this.translate.get('ontology.duplicated_label', { title: title }),
        onlyConfirm: true,
        minWidthButtons: '110px'
      }
    });
  }

  goToOntologyList() {
    this.router.navigate(['..'], { relativeTo: this.route });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}