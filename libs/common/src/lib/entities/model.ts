import { BaseEntitiesGroup } from '@nuclia/core';
import { TranslateService } from '@ngx-translate/core';

export const generatedEntitiesColor: { [key: string]: string } = {
  DATE: '#FF8989',
  EVENT: '#CBA2DA',
  FAC: '#81D8AC',
  GPE: '#6EB0EC',
  LANGUAGE: '#D1D3FF',
  LAW: '#9295E7',
  LOC: '#D1BEA9',
  MAIL: '#D2F1E1',
  MONEY: '#FF8C4B',
  NORP: '#CFE8FF',
  ORG: '#A0E3FF',
  PERCENT: '#FBDBB9',
  PERSON: '#FFDA69',
  PRODUCT: '#FF6363',
  QUANTITY: '#E7D2EF',
  TIME: '#21B8A6',
  WORK_OF_ART: '#ffc7c7',
};

export interface Entity {
  value: string;
  merged?: boolean;
  represents?: string[];
}

export interface NerFamily {
  key: string;
  title: string;
  color?: string;
  entities?: { [entityName: string]: Entity };
  custom?: boolean;
}

export function getNerFamilyTitle(familyId: string, family: BaseEntitiesGroup, translate: TranslateService): string {
  return generatedEntitiesColor[familyId]
    ? translate.instant(`resource.entities.${familyId.toLowerCase()}`)
    : family.title || familyId.toLowerCase();
}
