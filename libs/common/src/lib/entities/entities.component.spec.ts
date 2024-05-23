import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { NerService } from './ner.service';

import { EntitiesComponent } from './entities.component';
import { MockModule, MockProvider } from 'ng-mocks';
import { ModalService, PaButtonModule, PaModalModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FeaturesService } from '@flaps/core';

describe('EntitiesComponent', () => {
  let component: EntitiesComponent;
  let fixture: ComponentFixture<EntitiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MockModule(TranslateModule),
        MockModule(PaModalModule),
        MockModule(PaTextFieldModule),
        MockModule(PaButtonModule),
        MockModule(ReactiveFormsModule),
      ],
      declarations: [EntitiesComponent],
      providers: [
        MockProvider(TranslateService),
        MockProvider(ModalService),
        MockProvider(NerService, {
          entities: of({}),
        }),
        MockProvider(FeaturesService, {
          unstable: { customNer: of(true) },
        } as FeaturesService),
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
