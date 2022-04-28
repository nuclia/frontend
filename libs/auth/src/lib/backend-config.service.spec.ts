import { TestBed } from '@angular/core/testing';

import { BackendConfigurationService } from './backend-config.service';

describe('BackendConfigurationService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: BackendConfigurationService = TestBed.get(BackendConfigurationService);
    expect(service).toBeTruthy();
  });
});
