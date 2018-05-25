const fs = require('fs');
const getHttp = require('./getHttp');
const path = require('path');

const mkdirpath = (dirPath) => {
  if(!fs.existsSync(dirPath)) {
    try {
      fs.mkdirSync(dirPath);
    } catch(e) {
      mkdirpath(path.dirname(dirPath));
      mkdirpath(dirPath);
    }
  }
};

const promPipe = (response, fileName, strip) => {
  const file = fs.createWriteStream(fileName);
  return new Promise((resolve, reject) => {
    let ended = false;

    let timeout = null;

    const endOk = () => {
      if (timeout) {
        clearTimeout(timeout);
      }
      if (!ended) {
        ended = true;
        const newStrip = JSON.parse(JSON.stringify(strip));
        delete newStrip.url;
        resolve(newStrip);
      }
    }

    const endError = () => {
      if (timeout) {
        clearTimeout(timeout);
      }
      file.close();
      if (fs.existsSync(file)) {
        fs.unlinkSync(path);
      }
      if (!ended) {
        ended = true;
        reject("file error");
      }
    }

    if (response.statusCode >= 200 && response.statusCode <= 299) {
      const pipe = response.pipe(file);

      timeout = setTimeout(() => {
        if (!ended) {
          endError();
          file.close();
        }
      }, 60000); // 1 minuto

      pipe.on('finish', endOk);
      pipe.on('close', endOk);
      pipe.on('end', endOk);
      pipe.on('error', endError);
      pipe.on('aborted', endError)
    } else {
      endOk();
    }
  });
}

const MAX_OPEN_DOWNLOADS = 10;

const downloadFile = (dir, strips, i, callback) => {
  if (i > strips.length) {
    callback();
    return;
  }

  mkdirpath(dir);

  const promises = [];
  let createdProm = 0;
  for (let j = i; j < i + MAX_OPEN_DOWNLOADS; j++) {
    if (j < strips.length) {
      const strip = strips[j];
      const url = strip.url;
      const parts = url.split('/');
      const fileName = `${dir}/${strip.fileName}`;
      if(fs.existsSync(fileName)) {
        console.log(`Skipping exists: ${j+1}/${strips.length} - ${url}`);
      } else {
        console.log(`Downloading: ${j+1}/${strips.length} - ${url}`);
        createdProm++;
        getHttp(url, (response) => {
          if (strip.publishDate.startsWith('HEADER:')) {
            const headerPub = strip.publishDate.substring(7);
            const headerValue = response.headers[headerPub];
            if (headerValue) {
              const date = new Date(headerValue);
              const year = date.getFullYear();
              const month = `0${date.getMonth() + 1}`.substr(-2);
              const day = `0${date.getDate()}`.substr(-2);
              const hours = `0${date.getHours()}`.substr(-2);
              const minutes = `0${date.getMinutes()}`.substr(-2);
              strip.publishDate = `${year}-${month}-${day} ${hours}:${minutes}`;
            }
          }

          promises.push(promPipe(response, fileName, strip));
        });
      }
    }
  }

  const verify = () => {
    if (createdProm <= 0) {
      downloadFile(dir, strips, i + MAX_OPEN_DOWNLOADS, callback);
    }
    else if (promises.length < createdProm) {
      setTimeout(verify, 50);
    } else {
      Promise.all(promises)
        .then((downloadedStrips) => {
          const dataFile = `${dir}/data.json`;
          if (fs.existsSync(dataFile)) {
            fs.readFile(dataFile, 'utf8', function (err, data) {
              if (err) {
                throw err;
              } else {
                const json = JSON.parse(data);
                json.strips = [...json.strips, ...downloadedStrips];
                fs.writeFile(dataFile, JSON.stringify(json), 'utf8', (err) => {
                  if (err) {
                    throw err;
                  }
                  downloadFile(dir, strips, i + MAX_OPEN_DOWNLOADS, callback);
                });
              }
            });
          } else {
            const json = {
              strips: downloadedStrips
            };
            fs.writeFile(dataFile, JSON.stringify(json), 'utf8', (err) => {
              if (err) {
                throw err;
              }
              downloadFile(dir, strips, i + MAX_OPEN_DOWNLOADS, callback);
            });
          }
        }).catch((e) => {
          downloadFile(dir, strips, i, callback);
        }
      );
    }
  };

  verify();

};

module.exports = (dir, strips, callback) => {
  downloadFile(dir, strips, 0, () => {
    const dataFile = `${dir}/data.json`;
    if (fs.existsSync(dataFile)) {
      console.log(`Ordenando ${dataFile} por ord desc, publishDate desc, fileName desc`)
      fs.readFile(dataFile, 'utf8', function (err, data) {
        if (err) {
          throw err;
        } else {
          const json = JSON.parse(data);
          json.strips.sort((a, b) => (a.ord && b.ord) ? b.ord - a.ord : new Date(b.publishDate) - new Date(a.publishDate) || b.fileName.localeCompare(a.fileName));
          fs.writeFile(dataFile, JSON.stringify(json), 'utf8', (err) => {
            if (err) {
              throw err;
            }
            callback();
          });
        }
      });
    } else {
      callback();
    }
  });
};
