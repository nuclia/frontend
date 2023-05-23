import axios from 'axios';
import cheerio from 'cheerio';

export async function fetchSitemap(url: string): Promise<string> {
  const response = await axios.get(url);
  // todo: control wether it is zipped or plain
  return response.data;
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

//const sitemapUrl = 'https://nuclia.com/sitemap.xml';
/*export async function(sitemapUrl) {
  try {
    const sitemapContent = await fetchSitemap(sitemapUrl);
    const parsedUrls = parseSitemap(sitemapContent);

    return parsedUrls;
    console.log('Parsed URLs:');
    for (const [url, lastmod] of parsedUrls) {
      console.log('URL:', url);
      console.log('Last Modified:', lastmod);
      console.log();
    }
  } catch (error) {
    console.error('Error retrieving or parsing the sitemap:', error);
  }
}
*/