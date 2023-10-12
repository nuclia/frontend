import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KnowledgeBoxesComponent } from './knowledge-boxes.component';
import { MockModule, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { PaTableModule } from '@guillotinaweb/pastanaga-angular';
import { ManagerStore } from '../../../manager.store';
import { AccountDetails } from '../../account-ui.models';
import { AccountService } from '../../account.service';

describe('KnowledgeBoxesComponent', () => {
  let component: KnowledgeBoxesComponent;
  let fixture: ComponentFixture<KnowledgeBoxesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MockModule(PaTableModule)],
      declarations: [KnowledgeBoxesComponent],
      providers: [
        MockProvider(ManagerStore, {
          accountDetails: of({} as AccountDetails),
          kbList: of([]),
        }),
        MockProvider(AccountService),
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
