import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KnowledgeBoxesComponent } from './knowledge-boxes.component';
import { MockModule, MockProvider } from 'ng-mocks';
import { AccountDetailsStore } from '../account-details.store';
import { SDKService } from '@flaps/core';
import { of } from 'rxjs';
import { ExtendedAccount } from '../../account.models';
import { PaTableModule } from '@guillotinaweb/pastanaga-angular';

describe('KnowledgeBoxesComponent', () => {
  let component: KnowledgeBoxesComponent;
  let fixture: ComponentFixture<KnowledgeBoxesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MockModule(PaTableModule)],
      declarations: [KnowledgeBoxesComponent],
      providers: [
        MockProvider(AccountDetailsStore, {
          getAccount: jest.fn(() => of({} as ExtendedAccount)),
          zones: of([]),
        }),
        MockProvider(SDKService),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(KnowledgeBoxesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
