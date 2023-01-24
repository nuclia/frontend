import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { filter, merge, Observable, Subject } from 'rxjs';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import {
  EntityDialogComponent,
  EntityDialogData,
  EntityDialogResponse,
} from '../entity-dialog/entity-dialog.component';
import { AppEntitiesGroup, generatedEntitiesColor } from '../model';
import { EntitiesEditService } from '../entities-edit.service';
import { EntitiesSearchService } from '../entities-search.service';
import { EntitiesService } from '../../services/entities.service';
import { SDKService } from '@flaps/core';
import { SisModalService } from '@nuclia/sistema';

@Component({
  selector: 'app-entity-group',
  templateUrl: './entity-group.component.html',
  styleUrls: ['./entity-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityGroupComponent implements OnInit, OnDestroy {
  @Input() searchTerm: string = '';

  @Input()
  set group(group: AppEntitiesGroup | undefined) {
    this._group = group;
    this.updateExpander++;
  }
  get group(): AppEntitiesGroup | undefined {
    return this._group;
  }
  private _group: AppEntitiesGroup | undefined;

  expanded: boolean = false;
  editMode: boolean = false;
  searchResults$?: Observable<string[] | null>;
  updateExpander: number = 1;
  colors = generatedEntitiesColor;
  unsubscribeAll = new Subject<void>();
  isAdminOrContrib = this.sdk.currentKb.pipe(map((kb) => !!kb.admin || !!kb.contrib));

  constructor(
    private entitiesService: EntitiesService,
    private editService: EntitiesEditService,
    private searchService: EntitiesSearchService,
    private cdr: ChangeDetectorRef,
    private sdk: SDKService,
    private dialog: MatDialog,
    private modalService: SisModalService,
  ) {}

  ngOnInit(): void {
    this.searchResults$ = this.searchService.getSearchResults(this.group!.key);

    this.editService
      .isEditMode(this.group!.key)
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe((editMode) => {
        this.editMode = editMode;
        if (editMode && !this.expanded) {
          this.expanded = true;
        }
        this.cdr.markForCheck();
      });

    merge(this.searchResults$, this.editService.getGroup(this.group!.key))
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(() => {
        this.updateExpander++;
        this.cdr.markForCheck();
      });

    this.searchService
      .getSearchTerm()
      .pipe(
        switchMap(() => this.searchResults$!),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe((searchResults) => {
        if (searchResults !== null && searchResults.length > 0) {
          this.expanded = true;
        } else {
          this.expanded = this.editMode;
        }
        this.cdr.markForCheck();
      });
  }

  toggleExpanded(event: MouseEvent): void {
    // If the user clicks a button, do nothing
    const target = event.target as Element;
    if (target?.closest('pa-button')) return;

    this.expanded = !this.expanded;
    this.cdr.markForCheck();
  }

  toggleEditMode(): void {
    if (this.editMode) {
      this.editService.clearGroup(this.group!.key);
    } else {
      this.editService.initGroup(this.group!.key, this.group!);
    }
  }

  addEntity() {
    const dialogRef = this.dialog.open<EntityDialogComponent, EntityDialogData, EntityDialogResponse>(
      EntityDialogComponent,
      {
        width: '630px',
        data: { mode: 'add', group: this.group!.key },
      },
    );

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe((result) => {
        if (result) {
          this.editService.addEntity(result.group, result.name);
        }
      });
  }

  deleteGroup() {
    this.modalService
      .openConfirm({
        title: 'entity.delete_entity',
        description: 'entity.delete_entities_warning',
        isDestructive: true,
      })
      .onClose.pipe(
        filter((confirm) => !!confirm),
        switchMap(() => this.entitiesService.deleteGroup(this.group!.key)),
      )
      .subscribe();
  }

  saveGroup() {
    this.editService.saveGroup(this.group!.key).subscribe(() => {
      this.toggleEditMode();
    });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
