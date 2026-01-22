import { parseCsv } from './csv-parser';

describe('csv-parser', () => {
  describe('parseCsv', () => {
    it('should parse simple csv string into a string[][]', () => {
      const simpleCsv = `row1 column1,row1 column2\nrow2 column1,row2 column2`;
      const simpleCsvParsed = [
        ['row1 column1', 'row1 column2'],
        ['row2 column1', 'row2 column2'],
      ];
      expect(parseCsv(simpleCsv)).toEqual(simpleCsvParsed);
    });

    it('should parse csv with quotes (quotes are doubled: "")', () => {
      const csvWithQuotes = `"row1 ""column1""",row1 column2\n"row2 ""column1""",row2 column2`;
      const csvWithQuotesParsed = [
        ['row1 "column1"', 'row1 column2'],
        ['row2 "column1"', 'row2 column2'],
      ];
      expect(parseCsv(csvWithQuotes)).toEqual(csvWithQuotesParsed);
    });

    it('should parse csv with special characters (cell containing comma or line breaks are wrapped into double quotes)', () => {
      const csvWithSpecialChars = `"row1, column1","row1\ncolumn2"\n"row2, column1","row2\ncolumn2"`;
      const csvWithSpecialCharsParsed = [
        ['row1, column1', 'row1\ncolumn2'],
        ['row2, column1', 'row2\ncolumn2'],
      ];
      expect(parseCsv(csvWithSpecialChars)).toEqual(csvWithSpecialCharsParsed);
    });

    it('should parse csv where a cell is entirely wrapped into quotes (in that case double quotes are tripled)', () => {
      const csvWrappedInQuotes = `row1 column1,"""row1 column2"""\nrow2 column1,row2 column2`;
      const csvWrappedInQuotesParsed = [
        ['row1 column1', '"row1 column2"'],
        ['row2 column1', 'row2 column2'],
      ];
      expect(parseCsv(csvWrappedInQuotes)).toEqual(csvWrappedInQuotesParsed);
    });
  });
});
