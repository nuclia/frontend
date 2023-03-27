import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingResourcesTableComponent } from './pending-resources-table.component';

describe('PendingResourcesTableComponent', () => {
  let component: PendingResourcesTableComponent;
  let fixture: ComponentFixture<PendingResourcesTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PendingResourcesTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PendingResourcesTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
