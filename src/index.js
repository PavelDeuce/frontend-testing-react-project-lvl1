import path from 'path';
import axios from 'axios';
import debug from 'debug';
import { promises as fs } from 'fs';

import changeLinksToRelative from './parser.js';
import { createLinkPath, linkTypesMapping } from './utils.js';

const log = debug('page-loader');

export default (requestUrl, outputPath = process.cwd()) => {
  const resourcesDirectory = path.join(
    outputPath,
    createLinkPath(requestUrl, linkTypesMapping.directory),
  );

  const loadResource = (link) => {
    const responseType = 'arraybuffer';
    return axios
      .get(link, { responseType })
      .then(({ data }) => {
        const fileName = createLinkPath(link);
        log(`The file ${fileName} was successfully loaded to ${resourcesDirectory}`);
        return fs.writeFile(path.join(resourcesDirectory, fileName), data);
      })
      .catch((error) => {
        log(`Fetch resource ${link} failed with message: ${error.message}`);
        throw error;
      });
  };

  const loadAllResources = (links) => {
    log('Start resources loading...');
    return fs
      .mkdir(resourcesDirectory)
      .then(() => {
        return links.map((link) => {
          log(`Loading ${link}`);
          return loadResource(link);
        });
      })
      .then((links) => Promise.all(links))
      .catch((error) => {
        log(`Folder creating ${resourcesDirectory} failed with message: ${error.message}`);
        throw error;
      });
  };

  return axios.get(requestUrl).then((res) => {
    log(`Loading the page ${requestUrl} to ${outputPath}`);
    const htmlPath = path.join(outputPath, createLinkPath(requestUrl, linkTypesMapping.html));
    const { links, updatedHtml } = changeLinksToRelative(res.data, requestUrl);
    return fs
      .writeFile(htmlPath, updatedHtml)
      .then(() => loadAllResources(links))
      .then(() => ({ filepath: outputPath }))
      .catch((error) => {
        log(error.message);
        throw error;
      });
  });
};
