const Crawler = require('./Crawler');

module.exports = {
  run: (callback) => {
    const options = {
      dirName: 'usq',
      startPage: 1,
      warnLessThan: 6,
      getFileNameRegex: () => /^(tirinhas|charge)?[0-9|\-|x|\.]+\.(jpg|png|gif)/gi,
      getPageUrl: (page) => ((page == 1) ? 'https://www.umsabadoqualquer.com/' : `https://www.umsabadoqualquer.com/page/${page}/`),
      getStrips: ($, page) => {
        const strips = [];
        $('article').each((i, post) => {
          $('.post-content img', post).each((i, img) => {
            const url = $(img).attr('src');
            const title = $('.entry-title a', post).text();
            const anoMesUrlMatch = url.match('\/[0-9][0-9][0-9][0-9]\/[0-9][0-9]/');
            const anoMes = (anoMesUrlMatch) ? url.match('\/[0-9][0-9][0-9][0-9]\/[0-9][0-9]/')[0] : '';
            const publishDate = formatPublishDate($('.posted-at', post).attr('title'), anoMes);

            const num = title.split('-')[0].trim();
            if (/^[0-9]+$/.test(num)) {
              strips.push({ url, title, publishDate, ord: +num });
            } else {
              strips.push({ url, title, publishDate });
            }
          });
        });

        return strips;
      },
      onEnd: () => {
        console.log('Teminou um sábado qualquer.');
        callback();
      }
    };

    Crawler.run(options);
  }
};

const mesExtenso = {
  'janeiro': '01'
  , 'fevereiro': '02'
  , 'março': '03'
  , 'abril': '04'
  , 'maio': '05'
  , 'junho': '06'
  , 'julho': '07'
  , 'agosto': '08'
  , 'setembro': '09'
  , 'outubro': '10'
  , 'novembro': '11'
  , 'dezembro': '12'
};

const formatPublishDate = (publishDate, anoMes) => { // publishDate = 'segunda-feira, 01 de dezembro de 2008 às 19:08' => '2008-12-01 19:08' :: anoMes = '/2008/12/'
  if (!publishDate) {
    const vals = anoMes.split('/');
    const day = '01';
    const month = vals[2];
    const year = vals[1];
    return `${year}-${month}-${day}`;
  }
  const vals = publishDate.toLowerCase().split(',')[1].split(' às ');
  const valsDate = vals[0].split(' de ');
  const valsTime = (vals.length > 1) ? vals[1].split(':') : ['00', '00'];

  const day = `0${valsDate[0]}`.substr(-2);
  const month = mesExtenso[valsDate[1]];
  const year = valsDate[2];
  const hours = `0${valsTime[0]}`.substr(-2);
  const minutes = `0${valsTime[1]}`.substr(-2);
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};
