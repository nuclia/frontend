import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { NerService } from './ner.service';

import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { MockModule, MockProvider } from 'ng-mocks';
import { EntitiesComponent } from './entities.component';

describe('EntitiesComponent', () => {
  let component: EntitiesComponent;
  let fixture: ComponentFixture<EntitiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), MockModule(ReactiveFormsModule), EntitiesComponent],
      providers: [
        MockProvider(NerService, {
          entities: of({}),
        }),
        {
          provide: SvgIconRegistryService,
          useValue: {
            loadSvg: () => {
              /* empty */
            },
          },
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EntitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
