import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MockModule } from 'ng-mocks';
import { TranslateModule } from '@ngx-translate/core';
import { MetricsFiltersComponent } from './metrics-filters.component';
import { MetricsFiltersService } from './metrics-filters.service';

describe('MetricsFiltersComponent', () => {
  let component: MetricsFiltersComponent;
  let fixture: ComponentFixture<MetricsFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetricsFiltersComponent],
    })
      .overrideComponent(MetricsFiltersComponent, {
        set: {
          imports: [MockModule(TranslateModule)],
          schemas: [CUSTOM_ELEMENTS_SCHEMA],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(MetricsFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('injects MetricsFiltersService', () => {
    expect(component['service']).toBeInstanceOf(MetricsFiltersService);
  });

  it('starts with the sidebar closed', () => {
    expect(component.isOpen()).toBe(false);
  });
});
