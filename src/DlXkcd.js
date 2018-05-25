const Crawler = require('./Crawler');

module.exports = {
  run: (callback) => {
    const options = {
      dirName: 'xkcd',
      startPage: 1,
      warnLessThan: 1,
      getFileNameRegex: () => /\.(jpg|png|gif)/gi,
      getPageUrl: (page) => (page == 404) ? null : `https://xkcd.com/${page}/`,
      getStrips: ($, page) => {
        const strips = [];
        $('#comic img').each((i, img) => {
          const url = $(img).attr('src');
          const title = $(img).attr('alt');
          strips.push({ url, title, publishDate: 'HEADER:last-modified', ord: page });
        });

        return strips;
      },
      onEnd: () => {
        console.log('Teminou xkcd.');
        callback();
      }
    };

    Crawler.run(options);
  }
};
