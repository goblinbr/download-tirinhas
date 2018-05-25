const Crawler = require('./Crawler');

module.exports = {
  run: (callback) => {
    const options = {
      dirName: 'vdprog',
      startPage: 1,
      warnLessThan: 6,
      getFileNameRegex: () => /^tirinha[0-9]+\.(jpg|png|gif)/gi,
      getPageUrl: (page) => ((page == 1) ? 'https://vidadeprogramador.com.br' : `https://vidadeprogramador.com.br/index-${page}.html`),
      getStrips: ($) => {
        const strips = [];

        $('.post').each((i, post) => {
          const publishDate = formatPublishDate($('.publishdate-home', post).text());
          const title = $('h2 a', post).text();

          $('.tirinha img', post).not('.subtirinha img').not('.embed-code img').each((i, img) => {
            const url = $(img).attr('src');
            strips.push({ url, title, publishDate });
          });

          $('.entry img', post).each((i, img) => {
            const url = $(img).attr('src');
            strips.push({ url, title, publishDate });
          });
        });

        return strips;
      },
      onEnd: () => {
        console.log('Teminou vida de programador.');
        callback();
      }
    };

    Crawler.run(options);
  }
};

const formatPublishDate = (publishDate) => { // publishDate = '23/01/2018 23:54' => '2018-01-23 23:54'
  const vals = publishDate.split(' ');
  const valsDate = vals[0].split('/');
  const valsTime = vals[1].split(':');

  const day = `0${valsDate[0]}`.substr(-2);
  const month = `0${valsDate[1]}`.substr(-2);
  const year = valsDate[2];
  const hours = `0${valsTime[0]}`.substr(-2);
  const minutes = `0${valsTime[1]}`.substr(-2);
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};
