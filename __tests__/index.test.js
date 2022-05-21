import nock from 'nock';
import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';
import prettifyHtml from 'prettify-html';

import loadPage from '../src/index.js';

const buildFixturesPath = (...paths) => path.join(__dirname, '..', '__fixtures__', ...paths);
const readFile = (dirpath, filename) => fs.readFile(path.join(dirpath, filename), 'utf-8');

const pageDirname = 'hexlet-io-courses_files';
const pageFilename = 'hexlet-io-courses.html';
const baseUrl = 'https://hexlet.io';
const pagePath = '/courses';
const pageUrl = new URL(pagePath, baseUrl);

let expectedPageContent = '';
let resources = [
  {
    format: 'css',
    urlPath: '/index.css',
    filename: path.join(
      pageDirname,
      'hexlet-io-index.css',
    ),
  },
  {
    format: 'js',
    urlPath: '/index.js',
    filename: path.join(
      pageDirname,
      'hexlet-io-index.js',
    ),
  },
  {
    format: 'png',
    urlPath: '/img.png',
    filename: path.join(
      pageDirname,
      'hexlet-io-img.png',
    ),
  },
];

const formats = resources.map(({ format }) => format);
const scope = nock(baseUrl).persist();

nock.disableNetConnect();

beforeAll(async () => {
  const sourcePageContent = await readFile(buildFixturesPath('.'), pageFilename);
  const promises = resources.map((info) => readFile(buildFixturesPath('expected'), info.filename)
    .then((data) => ({ ...info, data })));

  expectedPageContent = await readFile(buildFixturesPath('expected'), pageFilename);
  resources = await Promise.all(promises);

  scope.get(pagePath).reply(200, sourcePageContent);
  resources.forEach(({ urlPath, data }) => scope.get(urlPath).reply(200, data));
});

describe('positive cases', () => {
  let tmpDirPath = '';
  beforeAll(async () => {
    tmpDirPath = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
    await loadPage(pageUrl.toString(), tmpDirPath);
  });

  test('check HTML-page', async () => {
    await expect(fs.access(path.join(tmpDirPath, pageFilename)))
      .resolves.not.toThrow();

    const actualContent = await readFile(tmpDirPath, pageFilename);
    expect(prettifyHtml(actualContent)).toBe(prettifyHtml(expectedPageContent));
  });

  test.each(formats)('check .%s-resource', async (format) => {
    const { filename, data } = resources.find((content) => content.format === format);

    await expect(fs.access(path.join(tmpDirPath, pageFilename)))
      .resolves.not.toThrow();

    const actualContent = await readFile(tmpDirPath, filename);
    expect(actualContent).toBe(data);
  });
});

describe('negative cases', () => {
  let tmpDirPath = '';
  beforeEach(async () => {
    tmpDirPath = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  });

  test('load page: no response', async () => {
    await expect(fs.access(path.join(tmpDirPath, pageFilename)))
      .rejects.toThrow(/ENOENT/);

    const invalidBaseUrl = 'https://hexkel.com';
    const expectedError = `getaddrinfo ENOTFOUND ${invalidBaseUrl}`;
    nock(invalidBaseUrl).persist().get('/').replyWithError(expectedError);
    await expect(loadPage(invalidBaseUrl, tmpDirPath))
      .rejects.toThrow(expectedError);

    await expect(fs.access(path.join(tmpDirPath, pageFilename)))
      .rejects.toThrow(/ENOENT/);
  });

  test.each([404, 500])('load page: status code %s', async (code) => {
    scope.get(`/${code}`).reply(code, '');
    const url = new URL(`/${code}`, baseUrl).toString();
    await expect(loadPage(url, tmpDirPath))
      .rejects.toThrow(new RegExp(code));
  });

  test('load page: file system errors', async () => {
    const rootDirPath = '/not-exist';
    await expect(loadPage(pageUrl.toString(), rootDirPath))
      .rejects.toThrow();

    const filepath = buildFixturesPath(pageFilename);
    await expect(loadPage(pageUrl.toString(), filepath))
      .rejects.toThrow(/ENOTDIR/);

    await expect(loadPage(pageUrl.toString(), path.join(tmpDirPath, 'notExistsPath')))
      .rejects.toThrow(/ENOENT/);
  });
});

afterAll(async () => {
  nock.enableNetConnect();
});
