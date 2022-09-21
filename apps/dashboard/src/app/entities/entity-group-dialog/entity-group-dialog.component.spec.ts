import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityGroupDialogComponent } from './entity-group-dialog.component';

describe('EntityGroupDialogComponent', () => {
  let component: EntityGroupDialogComponent;
  let fixture: ComponentFixture<EntityGroupDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EntityGroupDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityGroupDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
