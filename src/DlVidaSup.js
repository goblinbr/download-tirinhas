const Crawler = require('./Crawler');

module.exports = {
  run: (callback) => {
    const options = {
      dirName: 'vdsup',
      startPage: 1,
      warnLessThan: 6,
      getFileNameRegex: () => /^suporte_[0-9]+\.(jpg|png|gif)/gi,
      getPageUrl: (page) => ((page == 1) ? 'https://vidadesuporte.com.br/' : `https://vidadesuporte.com.br/page/${page}/`),
      getStrips: ($) => {
        const strips = [];

        $('.post').each((i, post) => {
          const publishDate = formatPublishDate($('.infopost', post).text());
          const title = $('.titulopost a', post).text();

          $('.content img', post).each((i, img) => {
            const url = $(img).attr('src');
            strips.push({ url, title, publishDate });
          });
        });

        return strips;
      },

      onEnd: () => {
        console.log('Teminou vida de suporte.');
        callback();
      }
    };

    Crawler.run(options);
  }
};

const formatPublishDate = (infopost) => { // infopost = '  publicado em 23/01/2018 em xxx' => '2018-01-23'
  const ixPub = infopost.toLowerCase().indexOf('publicado em') + 13;
  const publishDate = infopost.substring(ixPub, ixPub + 10);
  const valsDate = publishDate.split('/');

  const day = `0${valsDate[0]}`.substr(-2);
  const month = `0${valsDate[1]}`.substr(-2);
  const year = valsDate[2];
  return `${year}-${month}-${day}`;
};
