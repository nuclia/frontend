import axios from 'axios';
import cheerio from 'cheerio';

export async function fetchSitemap(url: string): Promise<string> {
  const response = await axios.get(url);
  // todo: control wether it is zipped or plain
  return response.data;
}

function parseSitemap(sitemapContent) {
  return new Promise((resolve, reject) => {
    let urls = [];
    const $ = cheerio.load(sitemapContent, { xml: true });

    $('url').each((_, element) => {
      const loc = $(element).find('loc').text();
      const lastmod = $(element).find('lastmod').text();
      urls.push({loc, lastmod});
    });

    let sitemaps = $('sitemap').map((_, element) => {
      const url = $(element).find('loc').text()
      return fetchSitemap(url).then(parseSitemap)
    })

    Promise.all(sitemaps).then((sitemaps) => {
      resolve([...urls, ...sitemaps.flat()])
    })
  })

}

const sitemapUrl = 'https://nuclia.com/sitemap.xml';
(async () => {
  try {
    let sitemapContent = await fetchSitemap(sitemapUrl)
    console.log(sitemapContent)
    let parsedUrls = await parseSitemap(sitemapContent);

    console.log('parsedUrls', parsedUrls)
  } catch (error) {
    console.error('Error retrieving or parsing the sitemap:', error);
  }
})();

