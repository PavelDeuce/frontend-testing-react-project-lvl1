import path from 'path';
import cheerio from 'cheerio';
import entires from 'lodash/entries.js';

import { linkTypesMapping, createLinkPath } from './utils.js';

const tagsMapping = {
  img: 'src',
  link: 'href',
  script: 'src',
};

const changeLinksToRelative = (html, requestPath) => {
  const $ = cheerio.load(html);
  const { origin, host } = new URL(requestPath);
  const fileDirectoryPath = createLinkPath(requestPath, linkTypesMapping.directory);
  const links = [];

  entires(tagsMapping).forEach(([tag, attribute]) => {
    $(tag).each((i, el) => {
      const attr = $(el).attr(attribute);
      if (!attr) return;

      const link = new URL(attr, origin);
      if (link.host !== host) return;
      links.push(link.toString());

      const newPath = path.join(fileDirectoryPath, createLinkPath(link.toString()));
      $(el).attr(attribute, newPath);
    });
  });

  return { links, updatedHtml: $.html() };
};

export default changeLinksToRelative;
