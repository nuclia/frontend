import { TestBed, waitForAsync } from '@angular/core/testing';

import { SynonymsService } from './synonyms.service';
import { MockProvider } from 'ng-mocks';
import { SisToastService } from '@nuclia/sistema';
import { SDKService } from '@flaps/core';
import { WritableKnowledgeBox } from '@nuclia/core';
import { of, skip, take } from 'rxjs';

describe('SynonymsService', () => {
  let service: SynonymsService;
  let toast: SisToastService;
  let kb: WritableKnowledgeBox;

  const synonymsLoaded = { main: ['synonym1', 'synonym2'] };

  beforeEach(() => {
    kb = {
      getSynonyms: jest.fn(() => of(synonymsLoaded)),
      setSynonyms: jest.fn(() => of(null)),
    } as unknown as WritableKnowledgeBox;
    TestBed.configureTestingModule({
      providers: [
        MockProvider(SDKService, {
          currentKb: of(kb),
        }),
        MockProvider(SisToastService, { error: jest.fn() }),
      ],
    });
    service = TestBed.inject(SynonymsService);
    toast = TestBed.inject(SisToastService);
  });

  describe('loadSynonyms', () => {
    it('should call getSynonyms and update synonyms subject', waitForAsync(() => {
      service.synonyms.pipe(skip(1), take(1)).subscribe((synonyms) => {
        expect(synonyms).toBe(synonymsLoaded);
      });

      service.loadSynonyms();
      expect(kb.getSynonyms).toHaveBeenCalled();
    }));
  });

  describe('isUnique', () => {
    it('should return true when synonyms does not contain provided main word', () => {
      expect(service.isUnique('main')).toBe(true);
    });

    it('should return false when main word provided already used as synonym entry', () => {
      // @ts-ignore access to private member
      service._synonyms.next(synonymsLoaded);
      expect(service.isUnique('main')).toBe(false);
    });
  });

  describe('addSynonym', () => {
    const synonymAdded = { added: ['addition', 'ajouté'] };

    it('should call setSynonyms with the new synonym and update synonyms subject on success', waitForAsync(() => {
      service.synonyms.pipe(skip(1), take(1)).subscribe((synonyms) => {
        // Check the first addition
        expect(synonyms).toEqual(synonymAdded);
      });
      service.synonyms.pipe(skip(2), take(1)).subscribe((synonyms) => {
        // Check the second addition
        expect(synonyms).toEqual({ ...synonymAdded, added2: ['another'] });
      });

      service.addSynonym('added', 'addition, ajouté');
      expect(kb.setSynonyms).toHaveBeenCalledWith(synonymAdded);

      service.addSynonym('added2', 'another');
      expect(kb.setSynonyms).toHaveBeenCalledWith({ ...synonymAdded, added2: ['another'] });
    }));

    it('should prevent to add twice the same synonym', waitForAsync(() => {
      service.synonyms.pipe(skip(1), take(1)).subscribe((synonyms) => {
        expect(synonyms).toEqual(synonymAdded);
      });

      service.addSynonym('added', 'addition, ajouté');
      service.addSynonym('added', 'something,else');

      expect(toast.error).toHaveBeenCalledWith(`"added" already exists as a synonym entry`);
      expect(kb.setSynonyms).toHaveBeenCalledTimes(1);
    }));
  });

  describe('editSynonym', () => {
    beforeEach(() => {
      // @ts-ignore access to private member
      service._synonyms.next(synonymsLoaded);
    });

    it('should call setSynonyms with updated synonym entry and update synonyms subject on success', waitForAsync(() => {
      service.synonyms.pipe(skip(2), take(1)).subscribe((synonyms) => {
        expect(synonyms).toEqual({ main: ['new synonym 1', 'new synonym 2'] });
      });

      service.editSynonym('main', 'new synonym 1, new synonym 2');
      expect(kb.setSynonyms).toHaveBeenCalledWith({ main: ['new synonym 1', 'new synonym 2'] });
    }));
  });

  describe('deleteSynonym', () => {
    beforeEach(() => {
      // @ts-ignore access to private member
      service._synonyms.next({ ...synonymsLoaded, another: ['other'] });
    });

    it('should call setSynonyms with synonyms map without the deleted one and update synonyms subject on success', waitForAsync(() => {
      service.synonyms.pipe(skip(1), take(1)).subscribe((synonyms) => {
        expect(synonyms).toEqual(synonymsLoaded);
      });
      service.synonyms.pipe(skip(2), take(1)).subscribe((synonyms) => {
        expect(synonyms).toEqual({});
      });

      service.deleteSynonym('another');
      expect(kb.setSynonyms).toHaveBeenCalledWith(synonymsLoaded);

      service.deleteSynonym('main');
      expect(kb.setSynonyms).toHaveBeenCalledWith({});
    }));
  });
});
