import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { ManagerStore } from '../../../manager.store';
import { AccountDetails } from '../../account-ui.models';
import { AccountService } from '../../account.service';
import { ContainersComponent } from './containers.component';

describe('ContainersComponent', () => {
  let component: ContainersComponent;
  let fixture: ComponentFixture<ContainersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContainersComponent, RouterModule.forRoot([])],
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
