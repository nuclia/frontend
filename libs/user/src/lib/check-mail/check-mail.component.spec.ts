import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MockComponent } from 'ng-mocks';
import { UserContainerComponent } from '../user-container';
import { CheckMailComponent } from './check-mail.component';

describe('CheckMailComponent', () => {
  let component: CheckMailComponent;
  let fixture: ComponentFixture<CheckMailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckMailComponent, TranslateModule.forRoot(), RouterModule.forRoot([]), MockComponent(UserContainerComponent)],
    }).compileComponents();

    fixture = TestBed.createComponent(CheckMailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
