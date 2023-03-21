import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SynonymsComponent } from './synonyms.component';
import { MockModule, MockProvider } from 'ng-mocks';
import { SynonymsService } from './synonyms.service';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';

describe('SynonymsComponent', () => {
  let component: SynonymsComponent;
  let fixture: ComponentFixture<SynonymsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MockModule(TranslateModule),
        MockModule(PaTextFieldModule),
        MockModule(PaTogglesModule),
        MockModule(PaButtonModule),
        MockModule(ReactiveFormsModule),
      ],
      declarations: [SynonymsComponent],
      providers: [MockProvider(SynonymsService)],
    }).compileComponents();

    fixture = TestBed.createComponent(SynonymsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
