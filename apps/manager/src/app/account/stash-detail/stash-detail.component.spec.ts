import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { StashDetailComponent } from './stash-detail.component';

describe('StashDetailComponent', () => {
  let component: StashDetailComponent;
  let fixture: ComponentFixture<StashDetailComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ StashDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StashDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
