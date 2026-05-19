const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  try {
      const page = await browser.newPage();
      await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
      
      await page.goto('https://dnd.rjp.digital', { waitUntil: 'networkidle0' });
      await page.evaluate(() => localStorage.clear());
      await page.reload({ waitUntil: 'networkidle0' });
      
      // Select Doris
      const playerCard = await page.$('.aspect-\\[3\\/4\\]');
      if (playerCard) {
          await playerCard.click();
          await new Promise(r => setTimeout(r, 1000));
          
          // Click ENTER AS DORIS
          const enterBtns = await page.$$('button');
          for (const b of enterBtns) {
              const text = await page.evaluate(el => el.textContent, b);
              if (text && text.includes('ENTER AS')) {
                  await b.click();
                  break;
              }
          }
      }
      
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: '/tmp/test_mobile_1.png', fullPage: true });

      // Click Fame tab
      const btns = await page.$$('button');
      for (const b of btns) {
          const text = await page.evaluate(el => el.textContent, b);
          if (text && text.trim() === 'FAME') {
              await b.click();
              break;
          }
      }
      await new Promise(r => setTimeout(r, 1000));
      await page.screenshot({ path: '/tmp/test_mobile_2.png', fullPage: true });
      
  } catch (err) {
      console.error(err);
  } finally {
      await browser.close();
  }
})();
