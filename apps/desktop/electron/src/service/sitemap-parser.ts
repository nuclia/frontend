import axios from 'axios';
import cheerio from 'cheerio';
import { from, Observable } from 'rxjs';

export function fetchSitemap(url: string): Observable<string> {
  //TODO control wether it is zipped or plain
  return from(
    axios.get(url).then((response) => {
      return response.data;
    }),
  );
}

export function parseSitemap(sitemapContent: string): [string, string][] {
  const urls: [string, string][] = [];
  const $ = cheerio.load(sitemapContent, { xmlMode: true });

  $('url').each((_, element) => {
    const loc = $(element).find('loc').text();
    const lastmod = $(element).find('lastmod').text();
    urls.push([loc, lastmod]);
  });

  return urls;
}