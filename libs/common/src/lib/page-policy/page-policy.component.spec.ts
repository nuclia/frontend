import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PagePolicyComponent } from './page-policy.component';

describe('PagePolicyComponent', () => {
  let component: PagePolicyComponent;
  let fixture: ComponentFixture<PagePolicyComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [PagePolicyComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PagePolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
