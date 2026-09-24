import { DatePipe } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { MetricsPageComponent } from './metrics-page.component';
import { MetricsPageService } from './metrics-page.service';

describe('MetricsPageComponent', () => {
  let component: MetricsPageComponent;
  let fixture: ComponentFixture<MetricsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), MetricsPageComponent],
      providers: [
        DatePipe,
        {
          provide: SvgIconRegistryService,
          useValue: {
            loadSvg: () => {
              /* empty */
            },
          },
        },
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
