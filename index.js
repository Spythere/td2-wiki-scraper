import fs from 'fs';
import { WikiScraper } from './scraper.js';
import { compressImage, downloadImage } from './imageHandler.js';

async function downloadAndCompress(imagesToDownload) {
  return imagesToDownload.reduce(async (acc, { type, src }) => {
    console.log(`Przetwarzanie ${type}...`);

    await downloadImage(src, `output/images/${type}--300px.png`);
    await downloadImage(src.replace('300px', '800px'), `output/images/${type}--800px.png`);
    compressImage(`${type}--300px`, `output/images/${type}--300px.png`, 80);
    compressImage(`${type}--800px`, `output/images/${type}--800px.png`, 80);
    console.log(`Pobrano i skompresowano ${type}!`);

    (await acc).push(type);
    return acc;
  }, Promise.resolve([]));
}

WikiScraper.run().then(async (data) => {
  const saveObj = JSON.stringify(data.vehiclesInfo, null, 1);

  fs.writeFileSync('output/data/vehiclesInfo.json', saveObj, 'utf8', (err) => {
    if (err) console.error(err);
  });
  console.log('Zapisano do pliku JSON!');

  await downloadAndCompress(data.imagesToDownload);

  console.log('Pobrano i skompresowano zdjęcia do folderu output/compressed!');
  console.log('Zakończono scraping!');
});