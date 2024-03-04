import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Observable, Subject, switchMap, tap } from 'rxjs';
import { debounceTime, filter, map, takeUntil } from 'rxjs/operators';
import { Entities } from '@nuclia/core';
import { Entity, generatedEntitiesColor, getNerFamilyTitle, NerFamily } from './model';
import { EntitiesService } from './entities.service';
import { NerFamilyDialogComponent } from './ner-family-dialog/ner-family-dialog.component';
import { ModalConfig, ModalService } from '@guillotinaweb/pastanaga-angular';
import { TranslateService } from '@ngx-translate/core';
import { AddNerDialogComponent } from './add-ner-dialog';

@Component({
  selector: 'app-entities',
  templateUrl: './entities.component.html',
  styleUrls: ['./entities.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntitiesComponent implements OnInit, OnDestroy {
  @ViewChild('entityInput') entityInput?: ElementRef;

  unsubscribeAll = new Subject<void>();
  familyColors = generatedEntitiesColor;
  nerFamilies: Observable<NerFamily[]> = this.entitiesService.entities.pipe(
    filter((entities): entities is Entities => !!entities),
    tap((entities) => this.updateSelectedFamilyEntities(entities)),
    map((entities) =>
      Object.entries(entities)
        .map(([familyKey, family]) => ({
          ...family,
          key: familyKey,
          title: getNerFamilyTitle(familyKey, family, this.translate),
        }))
        .sort((a, b) => (a.title || '').localeCompare(b.title || '')),
    ),
  );
  isAdminOrContrib = this.entitiesService.isAdminOrContrib;

  selectedFamily?: NerFamily;
  selectedNer: Entity[] = [];
  selectedIds: string[] = [];
  matchingEntities: Entity[] = [];
  nerQueryDebounce = new Subject<string>();
  nerQuery = '';

  constructor(
    private translate: TranslateService,
    private entitiesService: EntitiesService,
    private modalService: ModalService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.nerQueryDebounce.pipe(debounceTime(200), takeUntil(this.unsubscribeAll)).subscribe((query) => {
      this.nerQuery = query;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  onNerQueryChange(newQuery: string) {
    this.nerQueryDebounce.next(newQuery);
  }

  trackByFamily(index: number, family: NerFamily) {
    return family.key;
  }

  addFamily() {
    this.modalService.openModal(NerFamilyDialogComponent).onClose.subscribe();
  }

  selectFamily(family: NerFamily) {
    this.selectedFamily = family;
    this.cdr.markForCheck();
    if (Object.keys(family.entities).length === 0) {
      this.entitiesService.refreshFamily(family.key).subscribe(() => {
        this.cdr.markForCheck();
      });
    }
  }

  addEntity() {
    if (this.selectedFamily) {
      const family = this.selectedFamily;
      this.modalService
        .openModal(AddNerDialogComponent)
        .onClose.pipe(
          filter((entities) => !!entities && entities.length > 0),
          map((entities) => entities as string[]),
          switchMap((entities) => this.entitiesService.addEntitiesToFamily(family.key, entities)),
        )
        .subscribe();
    }
  }

  updateFamily(family: NerFamily) {
    if (family.custom) {
      this.modalService.openModal(NerFamilyDialogComponent, new ModalConfig({ data: family })).onClose.subscribe();
    }
  }

  removeFamily(family: NerFamily) {
    this.modalService
      .openConfirm({
        title: this.translate.instant('ner-remove-family-dialog.title', { familyName: family.title }),
        description: 'ner-remove-family-dialog.description',
        confirmLabel: 'generic.delete',
        isDestructive: true,
      })
      .onClose.pipe(
        filter((confirm) => confirm),
        switchMap(() => this.entitiesService.deleteFamily(family.key)),
      )
      .subscribe({
        next: () => {
          this.selectedFamily = undefined;
          this.cdr.markForCheck();
        },
      });
  }

  deleteEntities() {
    if (this.selectedFamily && this.selectedNer.length > 0) {
      this.entitiesService
        .deleteEntities(this.selectedFamily.key, this.selectedNer)
        .subscribe(() => this.selectEntities([]));
    }
  }

  openDuplicatesOfPopup() {
    if (this.entityInput) {
      const inputElement: HTMLInputElement = this.entityInput.nativeElement;
      setTimeout(() => {
        inputElement.focus();
        this.cdr.markForCheck();
      });
    }
  }

  getMatchingEntities(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    if (this.selectedFamily && value.length > 2) {
      const entities = Object.values(this.selectedFamily.entities || {})
        .filter((entity) => !entity.merged)
        .sort((a, b) => a.value.localeCompare(b.value));
      this.matchingEntities = entities.filter((entity) => entity.value.startsWith(value));
    }
  }

  addDuplicateOf(entity: Entity) {
    if (this.selectedFamily && this.selectedNer.length > 0) {
      this.entitiesService.addDuplicate(this.selectedFamily.key, this.selectedNer, entity).subscribe(() => {
        this.matchingEntities = [];
        this.selectEntities([]);
      });
    }
  }

  selectEntities(ids: string[]) {
    if (this.selectedFamily) {
      this.selectedIds = ids;
      this.selectedNer = Object.values(this.selectedFamily.entities).filter((entity) => ids.includes(entity.value));
      this.cdr.markForCheck();
    }
  }

  private updateSelectedFamilyEntities(families: Entities) {
    if (this.selectedFamily) {
      const updatedFamily = families[this.selectedFamily.key];
      if (updatedFamily) {
        this.selectedFamily = {
          ...this.selectedFamily,
          title: updatedFamily.title || this.selectedFamily.title,
          entities: updatedFamily.entities,
        };
        this.cdr.markForCheck();
      }
    }
  }
}
