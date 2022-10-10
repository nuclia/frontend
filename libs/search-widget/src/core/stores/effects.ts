import { getLabelSets } from '../api';
import { labelSets } from './labels.store';

export function activateEditLabelsFeature() {
  getLabelSets().subscribe((labelSetMap) => labelSets.set(labelSetMap));
}
