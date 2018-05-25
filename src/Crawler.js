const cheerio = require('cheerio')
const getHttp = require('./getHttp');
const download = require('./download');

const CRAWLER_OPTIONS = {
  dirName: '',
  startPage: 1,
  getFileNameRegex: () => /0/gi,
  getPageUrl: (page) => {},
  getStrips: ($) => {
    return { url: '', fileName: '', title: '', publishDate: '' };
  },
  onEnd: () => {}
};

const MAX_OPEN_CONNECTIONS = 10;

const Crawler = {
  run: (options = CRAWLER_OPTIONS) => {
    let procPages = 0;
    let totalPages = 0;
    const strips = [];

    let breakFor = false;
    let connections = 0;
    const onEnd = () => {
      connections--;
      procPages++;
      if (procPages === totalPages && breakFor) {
        download(`./tirinhas/${options.dirName}`, strips, options.onEnd);
      }
    };

    const addStrip = (strip) => {
      const url = strip.url;
      const vals = url.split('/');
      let name = vals[vals.length - 1].toLowerCase();
      if (options.getFileNameRegex().test(name)) {
        const pd = strip.publishDate.replace(/\D/g, '');
        const stripOnArray = strips.filter(t => t.url == url)[0];
        if (!stripOnArray) {
          if (strips.filter(s => s.fileName === name && s.publishDate !== strip.publishDate).length > 0) {
            const ns = name.split('.');
            name = ns[0] + '-' + pd + '.' + ns[1];
          }
          strip.fileName = name;

          strips.push(strip);
        }
      }
    };

    const next = (page) => {
      const url = options.getPageUrl(page);
      if (url) {
        totalPages++;
        connections++;

        const retry = (c = 1) => {
          getHttp(url, (res) => {
            const pageUrl = url;
            console.log(pageUrl, res.statusCode);
            if (res.statusCode >= 200 && res.statusCode <= 299) {
              var html = '';
              res.on('data', (data) => {
                html += data;
              }).on('end', () => {
                const $ = cheerio.load(html);

                let countStrips = strips.length;

                const pageImgUrls = options.getStrips($, page);
                pageImgUrls.forEach(strip => {
                  let url = strip.url;
                  if (url.startsWith('//')) {
                    const protocol = pageUrl.split('//')[0];
                    url = `${protocol}${url}`;
                    strip.url = url;
                  }
                  if (!url.startsWith('/')) {
                    addStrip(strip);
                  }
                });

                countStrips = strips.length - countStrips;
                if (countStrips < options.warnLessThan) {
                  console.warn(`WARN: ${url} - tirinhas: ${countStrips}`);
                }

                onEnd();
             }).on('error', (e) => {
               if (c > 10) {
                 throw Error('Max retry limit 10');
               }
               console.error(e);
               retry(c + 1);
             });
           } else {
             breakFor = true;
             onEnd();
           }
          });
        };

        retry();
      }

      const runNextPage = () => {
        setTimeout(() => {
          if (!breakFor && page < 10000000) {
            if (connections >= MAX_OPEN_CONNECTIONS) {
              runNextPage();
            }
            else {
              next(page + 1);
            }
          }
        }, 100);
      };
      runNextPage();

    };

    next(options.startPage);
  }
};

module.exports = Crawler;
