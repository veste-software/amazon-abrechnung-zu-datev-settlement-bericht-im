import { describe, expect, it } from 'vitest';
import { joinBase } from './url';

describe('joinBase', () => {
  it('keeps paths at the root when the base is /', () => {
    expect(joinBase('/', '/')).toBe('/');
    expect(joinBase('/', '/preise/')).toBe('/preise/');
  });

  it('prefixes the sub-path of a preview build', () => {
    expect(joinBase('/preview', '/preise/')).toBe('/preview/preise/');
    expect(joinBase('/preview/', 'impressum/')).toBe('/preview/impressum/');
    expect(joinBase('/preview', '/')).toBe('/preview/');
  });

  it('leaves external links and anchors alone', () => {
    expect(joinBase('/preview', 'https://www.datev.de/')).toBe('https://www.datev.de/');
    expect(joinBase('/preview', '#faq')).toBe('#faq');
  });
});
