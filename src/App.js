const DlVidaProg = require('./DlVidaProg');
const DlVidaSup = require('./DlVidaSup');
const DlUmSabQq = require('./DlUmSabQq');
const DlXkcd = require('./DlXkcd');

const params = [];
process.argv.forEach(function (val, index, array) {
  if (index > 1) {
    params.push(val);
  }
});

module.exports = {
  run: () => {

    const toRun = [];
    if (params.length == 0 || params.indexOf('--vidaprog') >= 0) {
      toRun.push(DlVidaProg);
    }
    if (params.length == 0 || params.indexOf('--vidasup') >= 0) {
      toRun.push(DlVidaSup);
    }
    if (params.length == 0 || params.indexOf('--usq') >= 0) {
      toRun.push(DlUmSabQq);
    }
    if (params.length == 0 || params.indexOf('--xkcd') >= 0) {
      toRun.push(DlXkcd);
    }

    const proximo = (n) => {
      if (n < toRun.length) {
        toRun[n].run(() => {
          proximo(n + 1);
        });
      }
    };

    proximo(0);
  }
};
