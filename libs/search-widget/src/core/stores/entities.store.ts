import { SvelteState } from '../state-lib';
import type { EntityGroup } from '../models';
import { getFamilyEntities } from '../api';

interface EntitiesState {
  entities: EntityGroup[];
}

export const entitiesState = new SvelteState<EntitiesState>({
  entities: [],
});

export const entities = entitiesState.writer<EntityGroup[]>(
  (state) => state.entities,
  (state, entities) => ({
    ...state,
    entities,
  }),
);

export const refreshFamily = function (familyId: string) {
  const newEntities = entities.getValue();
  const index = entities.getValue().findIndex((family) => family.id === familyId);
  if (index >= 0) {
    getFamilyEntities(familyId).subscribe((familyEntities) => {
      newEntities[index] = { ...newEntities[index], entities: familyEntities };
      entities.set(newEntities);
    });
  }
};
