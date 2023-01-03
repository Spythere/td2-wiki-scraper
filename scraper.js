import puppeteer from 'puppeteer';

export const WikiScraper = {
  async run() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    console.log('Ładowanie strony...');
    await page.goto('https://wiki.td2.info.pl/index.php?title=Sklady');

    // Wait for the results page to load and display the results.
    const tablesSelector = '.wikitable';
    await page.waitForSelector(tablesSelector);

    // Extract the results from the page.
    const scrapedData = await page.evaluate((tablesSelector) => {
      const imagesToDownload = [];

      function getLocoType(name) {
        if (/^(EP|EU|ET)/g.test(name)) return 'loco-e';
        if (/^(SM)/g.test(name)) return 'loco-s';
        if (/^(SN)/g.test(name)) return 'loco-szt';
        if (/^(2EN|EN)/g.test(name)) return 'loco-ezt';
        return null;
      }

      const stockTables = document.querySelectorAll(tablesSelector);
      const vehiclesTable = stockTables[0];
      const carriagesTable = stockTables[1];

      // Pojazdy (lokomotywy)
      const locoList = [...vehiclesTable.querySelectorAll('tbody > tr')].reduce(
        (list, row) => {
          const isHeader = row.querySelector('th') !== null || row.querySelectorAll('td').length == 1;
          if (isHeader) return list;

          const [name, constructionType, cabinType, maxSpeed, availability, image] = row.querySelectorAll('td');
          if (!name) return list;

          const locoType = getLocoType(name.textContent);
          if (!locoType) return list;

          const imageSrc = image.querySelector('img').src;

          imagesToDownload.push({
            type: name.textContent.trim(),
            src: imageSrc,
          });

          const sponsorOnly = availability.textContent == 'Sponsor';

          list[locoType].push([
            name.textContent.trim(),
            constructionType.textContent.trim(),
            cabinType.textContent.trim(),
            maxSpeed.textContent.trim(),
            sponsorOnly,
          ]);

          return list;
        },
        { 'loco-e': [], 'loco-s': [], 'loco-szt': [], 'loco-ezt': [] }
      );

      // Wagony
      let carriageType = 'car-passenger';
      const carriageList = [...carriagesTable.querySelectorAll('tbody > tr')].reduce(
        (list, row) => {
          const isHeader = row.querySelector('th') !== null || row.querySelectorAll('td').length == 1;
          if (isHeader) {
            if (row.textContent.trim() == 'Wagony towarowe') carriageType = 'car-cargo';
            return list;
          }

          const [name, constructionType, cargo, maxSpeed, availability, image] = row.querySelectorAll('td');
          if (!name) return list;

          const sponsorOnly = availability.textContent.trim() == 'Sponsor';
          const imageSrc = image.querySelector('img').src;

          imagesToDownload.push({
            type: name.textContent.trim(),
            src: imageSrc,
          });

          list[carriageType].push([
            name.textContent.trim(),
            constructionType.textContent.trim(),
            cargo.textContent.trim() != 'Nie',
            sponsorOnly,
            maxSpeed.textContent.trim(),
          ]);

          return list;
        },
        { 'car-passenger': [], 'car-cargo': [] }
      );

      return { vehiclesInfo: { ...locoList, ...carriageList }, imagesToDownload };
    }, tablesSelector);

    await browser.close();

    return scrapedData;
  },
};
