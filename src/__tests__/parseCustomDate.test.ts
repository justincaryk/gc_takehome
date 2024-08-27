const { parseCustomDate } = require('../utils'); // Adjust the path as necessary

describe('parseCustomDate', () => {
  const num = 1723821134;
  const yyMmDd = '2024-08-16';
  const time = '15:12:14';
  const stdDateString = 'Thursday, August 8, 2024 1:40:40 AM';

  it(`should parse date from string format "${num} (${yyMmDd} ${time})"`, () => {
    const dateString = `${num} (${yyMmDd} ${time})`;
    const result = parseCustomDate(dateString);
    expect(result).toEqual(new Date(`${yyMmDd}T${time}`));
  });

  it(`should parse valid date string format "${stdDateString}"`, () => {
    const result = parseCustomDate(stdDateString);
    expect(result).toEqual(new Date(stdDateString));
  });

  it('should throw error for invalid date string', () => {
    const dateString = 'Invalid date string';
    expect(() => parseCustomDate(dateString)).toThrow();
  });

  it('should throw error for empty string', () => {
    const dateString = '';
    expect(() => parseCustomDate(dateString)).toThrow();
  });
});
