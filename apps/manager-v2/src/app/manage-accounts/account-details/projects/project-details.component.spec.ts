import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { UiToastService } from '@nuclia/ui/toast';
import { MockProvider } from 'ng-mocks';
import { ManagerStore } from '../../../manager.store';
import { AccountService } from '../../account.service';
import { ACCOUNT_DETAILS } from '../../test-utils';
import { ProjectDetailsComponent } from './project-details.component';

describe('ProjectDetailsComponent', () => {
  let component: ProjectDetailsComponent;
  let fixture: ComponentFixture<ProjectDetailsComponent>;
  const canEdit = signal(true);

  beforeEach(async () => {
    canEdit.set(true);
    await TestBed.configureTestingModule({
      imports: [ProjectDetailsComponent, RouterModule.forRoot([])],
      providers: [
        MockProvider(AccountService),
        MockProvider(UiToastService),
        MockProvider(ManagerStore, {
          canEdit,
          accountDetails: signal(ACCOUNT_DETAILS),
          projectDetails: signal(null),
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should enable and disable the form when edit permission changes', () => {
    expect(component.form.enabled).toBe(true);

    canEdit.set(false);
    fixture.detectChanges();
    expect(component.form.disabled).toBe(true);

    canEdit.set(true);
    fixture.detectChanges();
    expect(component.form.controls.name.enabled).toBe(true);
    expect(component.form.controls.description.enabled).toBe(true);
  });
});
