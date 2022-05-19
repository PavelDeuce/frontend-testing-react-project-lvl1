import { createLinkPath, transformToKebabNotation, linkTypesMapping } from '../src/utils.js';

describe('transformToKebabNotation', () => {
  test('should transform', () => {
    const kebabLink = transformToKebabNotation('https://hexlet.io/courses');
    expect(kebabLink).toEqual('hexlet-io-courses');
  });

  test('empty string case', () => {
    const emptyString = transformToKebabNotation('');
    expect(emptyString).toEqual('');
  });
});

describe('createLinkPath', () => {
  test.each([
    [linkTypesMapping.html, 'https://hexlet.io/courses', 'hexlet-io-courses.html'],
    [linkTypesMapping.file, 'https://hexlet.io/diamond_pp.jpeg', 'hexlet-io-diamond-pp.jpeg'],
    [linkTypesMapping.directory, 'https://hexlet.io/resources', 'hexlet-io-resources_files'],
  ])('should create', (type, link, result) => {
    expect(createLinkPath(link, type)).toBe(result);
  });

  test('should return file by default', () => {
    expect(createLinkPath('https://hexlet.io/courses')).toBe('hexlet-io-courses.html');
  });

  test('should throw error', () => {
    expect(() => createLinkPath('https://hexlet.io/courses', 'url')).toThrowError(
      'Unknown type - url',
    );
  });
});
