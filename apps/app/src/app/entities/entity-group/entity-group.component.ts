import { Component, Input, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Subject, Observable, merge } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { STFConfirmComponent } from '@flaps/components';
import { EntityDialogComponent, EntityDialogData, EntityDialogResponse } from '../entity-dialog/entity-dialog.component';
import { AppEntitiesGroup } from '../model';
import { EntitiesEditService } from '../entities-edit.service';
import { EntitiesSearchService } from '../entities-search.service';
import { EntitiesService } from '../../services/entities.service';

@Component({
  selector: 'app-entity-group',
  templateUrl: './entity-group.component.html',
  styleUrls: ['./entity-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntityGroupComponent implements OnInit, OnDestroy {
  @Input() groupKey: string  = '';
  @Input() searchTerm: string  = '';

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
  unsubscribeAll = new Subject<void>();

  constructor(
    private entitiesService: EntitiesService,
    private editService: EntitiesEditService,
    private searchService: EntitiesSearchService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog) {}

  ngOnInit(): void {
    this.searchResults$ = this.searchService.getSearchResults(this.groupKey);

    this.editService.isEditMode(this.groupKey)
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe((editMode) => {
        this.editMode = editMode;
        if (editMode && !this.expanded) {
          this.expanded = true;
        }
        this.cdr.markForCheck();
      });

    merge(this.searchResults$, this.editService.getGroup(this.groupKey))
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(() => {
        this.updateExpander++;
        this.cdr.markForCheck();
      });

    this.searchService.getSearchTerm()
      .pipe(
        switchMap(() => this.searchResults$!),
        takeUntil(this.unsubscribeAll)
      )
      .subscribe((searchResults) => {
        if (searchResults !== null && searchResults.length > 0) {
          this.expanded = true;
        }
        else {
          this.expanded = this.editMode;
        }
        this.cdr.markForCheck();
      });
  }

  toggleExpanded(event: MouseEvent): void {
    // If the user clicks a button, do nothing
    const target = event.target as Element;
    if (target?.closest('app-button-action')) return;

    this.expanded = !this.expanded;
    this.cdr.markForCheck();
  }

  toggleEditMode(): void {
    if (this.editMode) {
      this.editService.clearGroup(this.groupKey);
    }
    else {
      this.editService.initGroup(this.groupKey, this.group!);
    }
  }

  addEntity() {
    const dialogRef = this.dialog.open<
      EntityDialogComponent,
      EntityDialogData,
      EntityDialogResponse>
      (EntityDialogComponent, {
        width: '630px',
        data: { mode: 'add', group: this.groupKey }
      });
      
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
    const dialogRef = this.dialog.open(STFConfirmComponent, {
      width: '420px',
      data: {
        title: 'generic.alert',
        message: 'entity.delete_entities_warning',
        minWidthButtons: '110px'
      }
    });
    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe((result) => {
        if (result) {
          this.entitiesService.deleteGroup(this.groupKey);
        }
      });
  }

  saveGroup() {
    this.editService.saveGroup(this.groupKey).subscribe(() => {
      this.toggleEditMode();
    });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
