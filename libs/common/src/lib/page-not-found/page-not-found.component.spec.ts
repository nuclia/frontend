import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PageNotFoundComponent } from './page-not-found.component';
import { MockProvider } from 'ng-mocks';
import { BrandService } from '@flaps/core';

describe('PageNotFoundComponent', () => {
  let component: PageNotFoundComponent;
  let fixture: ComponentFixture<PageNotFoundComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [PageNotFoundComponent],
      providers: [MockProvider(BrandService)],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PageNotFoundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => {
    fixture.destroy();
  });
});
