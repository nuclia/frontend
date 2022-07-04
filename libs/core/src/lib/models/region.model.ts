export class RegionSummary {
  '@id': string;
  '@name': string;

  get url() {
    return this['@id'];
  }

  get id() {
    return this['@name'];
  }

  constructor(summary: any) {
    Object.assign(this, summary);
  }
}
