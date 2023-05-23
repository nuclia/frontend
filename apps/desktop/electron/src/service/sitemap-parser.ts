import axios from 'axios';
import cheerio from 'cheerio';
import { from, Observable, switchMap } from 'rxjs';

interface SiteMapModel {
  loc: string;
  lastmod: string;
}

async function fetchSitemap(url: string): Promise<string> {
  const response = await axios.get(url);
  // todo: control whether it is zipped or plain
  return response.data;
}
function parseSitemap(sitemapContent: string): Promise<SiteMapModel[]> {
  return new Promise((resolve) => {
    const urls: SiteMapModel[] = [];
    const $ = cheerio.load(sitemapContent, { xml: true });

    $('url').each((_, element) => {
      const loc = $(element).find('loc').text();
      const lastmod = $(element).find('lastmod').text();
      urls.push({ loc, lastmod });
    });

    const sitemaps = $('sitemap').map((_, element) => {
      const url = $(element).find('loc').text();
      return fetchSitemap(url).then(parseSitemap);
    });

    Promise.all(sitemaps).then((sitemaps) => {
      resolve([...urls, ...sitemaps.flat()]);
    });
  });
}

export function getSiteMap(url: string): Observable<SiteMapModel[]> {
  return from(fetchSitemap(url)).pipe(switchMap((content) => from(parseSitemap(content))));
}

// const sitemapUrl = 'https://nuclia.com/sitemap.xml';
// (async () => {
//   try {
//     let sitemapContent = await fetchSitemap(sitemapUrl)
//     console.log(sitemapContent)
//     let parsedUrls = await parseSitemap(sitemapContent);
//
//     console.log('parsedUrls', parsedUrls)
//   } catch (error) {
//     console.error('Error retrieving or parsing the sitemap:', error);
//   }
// })();
