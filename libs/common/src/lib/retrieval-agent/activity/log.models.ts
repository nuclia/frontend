const maxLines = 6;
const maxCharacters = 300;

export interface LogValueString {
  type: 'string';
  value: string;
  displayedValue: string;
  showMore: boolean;
}
export interface LogValueObject {
  type: 'object';
  value: any;
  displayedValue: string;
  showMore: boolean;
}

export class LogEntry {
  data: [string, LogValueString | LogValueObject][];

  constructor(dataStr: string) {
    try {
      const data = JSON.parse(dataStr);
      this.data = Object.entries(data).map(([key, value]) => {
        if (typeof value === 'string') {
          let displayedValue = value;
          let showMore = false;
          if (value.length > maxCharacters) {
            displayedValue = value.slice(0, maxCharacters) + '…';
            showMore = true;
          }
          return [key, { type: 'string', value, displayedValue, showMore }];
        } else {
          let displayedValue = JSON.stringify(value, null, 2);
          let showMore = false;
          const lines = displayedValue.split('\n');
          if (lines.length > maxLines) {
            displayedValue = lines.slice(0, maxLines).join('\n') + '…';
            showMore = true;
          }
          return [key, { type: 'object', value, displayedValue, showMore }];
        }
      });
    } catch (e) {
      this.data = [];
    }
  }
}
