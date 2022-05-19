import nock from 'nock';
import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';

import loadPage from '../src/index.js';
import { createLinkPath, linkTypesMapping } from '../src/utils.js';

const getFixturePath = (filepath) => path.join('__fixtures__', filepath);
let tempDirectory = '';
const hostname = 'hexlet.io';
const pathname = '/courses';
const pageFilename = 'site-com-blog-about.html';
const requestUrl = `https://${path.join(hostname, pathname)}`;

nock.disableNetConnect();

describe('page-loader', () => {
  beforeEach(async () => {
    tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
    nock.cleanAll();
  });

  afterAll(async () => {
    await fs.rmdir(tempDirectory, { recursive: true });
    nock.enableNetConnect();
  });

  test('should load page with resources', async () => {
    const expectedHTML = await fs.readFile(getFixturePath('updatedTest.html'), 'utf-8');
    const responsedHtml = await fs.readFile(getFixturePath('test.html'), 'utf-8');
    const responseJs = await fs.readFile(getFixturePath('js/index.js'), 'utf-8');
    const responseCss = await fs.readFile(getFixturePath('css/index.css'), 'utf-8');
    const responseImg = await fs.readFile(getFixturePath('images/img.png'), 'utf-8');

    nock(/hexlet/)
      .get(pathname)
      .reply(200, responsedHtml)
      .get('/js/index.js')
      .reply(200, responseJs)
      .get('/css/index.css')
      .reply(200, responseCss)
      .get('/images/img.png')
      .reply(200, responseImg);

    await loadPage(requestUrl, tempDirectory);

    const resourcesDirectory = createLinkPath(requestUrl, linkTypesMapping.directory);
    const resultHtmlPath = path.join(
      tempDirectory,
      createLinkPath(requestUrl, linkTypesMapping.html),
    );
    const resultJsPath = path.join(tempDirectory, resourcesDirectory, 'hexlet-io-js-index.js');
    const resultCssPath = path.join(tempDirectory, resourcesDirectory, 'hexlet-io-css-index.css');
    const resultImgPath = path.join(tempDirectory, resourcesDirectory, 'hexlet-io-images-img.png');

    const loadedHtml = await fs.readFile(resultHtmlPath, 'utf-8');
    const loadedJs = await fs.readFile(resultJsPath, 'utf-8');
    const loadedCss = await fs.readFile(resultCssPath, 'utf-8');
    const loadedImg = await fs.readFile(resultImgPath, 'utf-8');

    expect(loadedHtml.trim()).toEqual(expectedHTML.trim());
    expect(loadedJs).toBe(responseJs);
    expect(loadedCss).toBe(responseCss);
    expect(loadedImg).toBe(responseImg);
  });

  test.each([404, 500])('load page: status code %s', async (code) => {
    nock(/hexlet/)
      .get('/profile')
      .reply(code, '');
    await expect(
      loadPage(`https://${path.join(hostname, '/profile')}`, tempDirectory),
    ).rejects.toThrow(new RegExp(code));
  });

  test('should throw exception about unknown file system', async () => {
    const rootDirPath = '/sys';
    await expect(loadPage(requestUrl, rootDirPath))
      .rejects.toThrow();

    nock(/hexlet/)
      .get(pathname)
      .reply(200, '');
    await expect(loadPage(requestUrl, `${path.join(tempDirectory, '/unknown')}`)).rejects.toThrow(
      /ENOENT/,
    );
  });

  test('load page: no response', async () => {
    await expect(fs.access(path.join(tempDirectory, pageFilename))).rejects.toThrow(/ENOENT/);

    const invalidBaseUrl = 'https://hexkel.com';
    const expectedError = `getaddrinfo ENOTFOUND ${invalidBaseUrl}`;
    nock(invalidBaseUrl).persist().get('/').replyWithError(expectedError);

    await expect(loadPage(invalidBaseUrl, tempDirectory)).rejects.toThrow(expectedError);
    await expect(fs.access(path.join(tempDirectory, pageFilename))).rejects.toThrow(/ENOENT/);
  });
});
