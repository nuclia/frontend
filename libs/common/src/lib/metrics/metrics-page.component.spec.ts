import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MockModule, MockProvider } from 'ng-mocks';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MetricsPageComponent } from './metrics-page.component';
import { MetricsPageService } from './metrics-page.service';

describe('MetricsPageComponent', () => {
  let component: MetricsPageComponent;
  let fixture: ComponentFixture<MetricsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MetricsPageComponent],
      imports: [MockModule(TranslateModule)],
      providers: [
        DatePipe,
        MockProvider(TranslateService, { instant: (key: string) => key }),
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(MetricsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('provides MetricsPageService', () => {
    expect(component.service).toBeInstanceOf(MetricsPageService);
  });
});
