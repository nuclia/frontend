import type { Classification } from '@nuclia/core';
import { closeAll } from '../../core/stores/modal.store';

export function searchBy(label: Classification) {
  closeAll.set();
  console.log(`Search for`, label);
}
