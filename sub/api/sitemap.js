const { SitemapStream, streamToPromise } = require('sitemap');
const { createGzip } = require('zlib');
const { Readable } = require('stream');

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Content-Encoding', 'gzip');

  try {
    const smStream = new SitemapStream({ hostname: 'https://www.polomaps.com/' });
    const pipeline = smStream.pipe(createGzip());

    // Voeg hier je sitemap items toe
    smStream.write({ url: '/page-1/', changefreq: 'daily', priority: 0.3 });
    smStream.write({ url: '/page-2/', changefreq: 'monthly', priority: 0.7 });
    smStream.write({ url: '/page-3/', changefreq: 'weekly', priority: 0.5 });
    smStream.write({ url: '/page-4/', img: 'http://urlTest.com' });
    // Voeg meer URL's toe zoals nodig

    smStream.end();

    const sitemap = await streamToPromise(pipeline);
    res.send(sitemap);
  } catch (e) {
    console.error(e);
    res.status(500).end();
  }
}
