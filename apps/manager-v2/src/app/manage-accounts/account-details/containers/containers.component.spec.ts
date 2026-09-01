import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContainersComponent } from './containers.component';
import { MockModule, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { PaTableModule } from '@guillotinaweb/pastanaga-angular';
import { ManagerStore } from '../../../manager.store';
import { AccountDetails } from '../../account-ui.models';
import { AccountService } from '../../account.service';

describe('ContainersComponent', () => {
  let component: ContainersComponent;
  let fixture: ComponentFixture<ContainersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MockModule(PaTableModule)],
      declarations: [ContainersComponent],
      providers: [
        MockProvider(ManagerStore, {
          accountDetails: of({} as AccountDetails),
          kbList: of([]),
        }),
        MockProvider(AccountService),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { data: { mode: 'kb' } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContainersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
