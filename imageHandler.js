import jimp from 'jimp';
import fs from 'fs';
import axios from 'axios';

export function compressImage(name, path, quality) {
  jimp.read(path, function (err, image) {
    if (err) return console.log(err);

    image.quality(quality).write(`output/compressed/${name}.jpg`);
  });
}

export async function downloadImage(url, filepath) {
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });

  return new Promise((resolve, reject) => {
    response.data
      .pipe(fs.createWriteStream(filepath))
      .on('error', reject)
      .once('close', () => resolve(filepath));
  });
}
