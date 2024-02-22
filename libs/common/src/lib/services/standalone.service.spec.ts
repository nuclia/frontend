import { MockProvider } from 'ng-mocks';
import { SDKService } from '@flaps/core';
import { TranslateService } from '@ngx-translate/core';
import { SisToastService } from '@nuclia/sistema';

import { StandaloneService } from './standalone.service';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { Nuclia } from '@nuclia/core';
import { of, take } from 'rxjs';

describe('Standalone service', () => {
  let service: StandaloneService;
  let toast: SisToastService;
  let mockGet: jest.Mock = jest.fn();

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MockProvider(SDKService, {
          nuclia: {
            options: {},
            rest: {
              get: mockGet,
            },
          } as unknown as Nuclia,
        }),
        MockProvider(SisToastService, { warning: jest.fn() }),
        MockProvider(TranslateService, { instant: jest.fn((key) => `translate--${key}`) }),
      ],
    });
    service = TestBed.inject(StandaloneService);
    toast = TestBed.inject(SisToastService);
  });

  describe('checkVersions', () => {
    it('should set version with what the backend is sending', waitForAsync(() => {
      const versionReceived = {
        nucliadb: { installed: '2.43.1.post240', latest: '2.43.1.post240' },
        'nucliadb-admin-assets': { installed: '1.0.0.post1341', latest: '1.0.0.post1341' },
      };
      mockGet.mockReturnValueOnce(of(versionReceived));
      service.version.pipe(take(1)).subscribe((version) => expect(version).toBe(versionReceived));
      service.checkVersions();
    }));

    it('should not display a toast when the installed and latest versions are the same', () => {
      mockGet.mockReturnValueOnce(
        of({
          nucliadb: { installed: '2.43.1.post240', latest: '2.43.1.post240' },
          'nucliadb-admin-assets': { installed: '1.0.0.post1341', latest: '1.0.0.post1341' },
        }),
      );
      service.checkVersions();
      expect(toast.warning).not.toHaveBeenCalled();
    });

    it('should not display a warning when post suffix of latest nucliadb is greater than post suffix installed', () => {
      mockGet.mockReturnValueOnce(
        of({
          nucliadb: { installed: '2.43.1.post240', latest: '2.43.1.post243' },
          'nucliadb-admin-assets': { installed: '1.0.0.post1341', latest: '1.0.0.post1341' },
        }),
      );
      service.checkVersions();
      expect(toast.warning).not.toHaveBeenCalled();
    });

    it('should not display a warning when post suffix of latest nucliaDB admin is greater than post suffix installed', () => {
      mockGet.mockReturnValueOnce(
        of({
          nucliadb: { installed: '2.43.1.post240', latest: '2.43.1.post240' },
          'nucliadb-admin-assets': { installed: '1.0.0.post1341', latest: '1.0.0.post1345' },
        }),
      );
      service.checkVersions();
      expect(toast.warning).not.toHaveBeenCalled();
    });

    it('should not display a warning when patch version of latest nucliadb is greater than patch version installed', () => {
      mockGet.mockReturnValueOnce(
        of({
          nucliadb: { installed: '2.43.1.post240', latest: '2.43.3.post240' },
          'nucliadb-admin-assets': { installed: '1.0.0.post1341', latest: '1.0.0.post1341' },
        }),
      );
      service.checkVersions();
      expect(toast.warning).not.toHaveBeenCalled();
    });

    it('should not display a warning when patch version of latest nucliaDB admin is greater than patch version installed', () => {
      mockGet.mockReturnValueOnce(
        of({
          nucliadb: { installed: '2.43.1.post240', latest: '2.43.1.post240' },
          'nucliadb-admin-assets': { installed: '1.0.0.post1341', latest: '1.0.1.post1341' },
        }),
      );
      service.checkVersions();
      expect(toast.warning).not.toHaveBeenCalled();
    });

    it('should display a warning when minor version of latest nucliadb is greater than minor version installed', () => {
      mockGet.mockReturnValueOnce(
        of({
          nucliadb: { installed: '2.43.1.post240', latest: '2.44.1.post240' },
          'nucliadb-admin-assets': { installed: '1.0.0.post1341', latest: '1.0.0.post1341' },
        }),
      );
      service.checkVersions();
      expect(toast.warning).toHaveBeenCalled();
    });

    it('should display a warning when minor version of latest nucliaDB admin is greater than minor version installed', () => {
      mockGet.mockReturnValueOnce(
        of({
          nucliadb: { installed: '2.43.1.post240', latest: '2.43.1.post240' },
          'nucliadb-admin-assets': { installed: '1.0.0.post1341', latest: '1.1.0.post1341' },
        }),
      );
      service.checkVersions();
      expect(toast.warning).toHaveBeenCalled();
    });

    it('should display a warning when major version of latest nucliadb is greater than major version installed', () => {
      mockGet.mockReturnValueOnce(
        of({
          nucliadb: { installed: '2.43.1.post240', latest: '3.0.0.post240' },
          'nucliadb-admin-assets': { installed: '1.0.0.post1341', latest: '1.0.0.post1341' },
        }),
      );
      service.checkVersions();
      expect(toast.warning).toHaveBeenCalled();
    });

    it('should display a warning when major version of latest nucliaDB admin is greater than major version installed', () => {
      mockGet.mockReturnValueOnce(
        of({
          nucliadb: { installed: '2.43.1.post240', latest: '2.43.1.post240' },
          'nucliadb-admin-assets': { installed: '1.0.0.post1341', latest: '2.0.0.post1341' },
        }),
      );
      service.checkVersions();
      expect(toast.warning).toHaveBeenCalled();
    });
  });
});
