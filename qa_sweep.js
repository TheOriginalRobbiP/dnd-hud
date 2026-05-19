const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  try {
      const page = await browser.newPage();
      
      // 1. Mobile Player HUD QA
      await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
      await page.goto('https://dnd.rjp.digital', { waitUntil: 'networkidle0' });
      await page.evaluate(() => localStorage.clear());
      await page.reload({ waitUntil: 'networkidle0' });
      
      // Click PLAYER 1
      console.log("Mobile: Logging in as Player 1");
      let btns = await page.$$('div');
      for (const b of btns) {
          const text = await page.evaluate(el => el.textContent, b);
          if (text && text.includes('PLAYER 1')) {
              await b.click();
              break;
          }
      }
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: '/tmp/qa_mobile_player.png', fullPage: true });

      // Click Inventory tab
      btns = await page.$$('button');
      for (const b of btns) {
          const text = await page.evaluate(el => el.textContent, b);
          if (text && text.trim() === 'INVENTORY') {
              await b.click();
              break;
          }
      }
      await new Promise(r => setTimeout(r, 1000));
      await page.screenshot({ path: '/tmp/qa_mobile_player_inventory.png', fullPage: true });

      // Click Fame tab
      for (const b of btns) {
          const text = await page.evaluate(el => el.textContent, b);
          if (text && text.trim() === 'FAME') {
              await b.click();
              break;
          }
      }
      await new Promise(r => setTimeout(r, 1000));
      await page.screenshot({ path: '/tmp/qa_mobile_player_fame.png', fullPage: true });

      // 2. Mobile GM Dashboard QA
      console.log("Mobile: Logging in as GM");
      await page.evaluate(() => {
          localStorage.setItem('hud:role', 'gm');
          sessionStorage.setItem('hud:gm-verified', 'true');
      });
      await page.reload({ waitUntil: 'networkidle0' });
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: '/tmp/qa_mobile_gm.png', fullPage: true });

      // 3. Desktop GM Dashboard QA
      console.log("Desktop: Logging in as GM");
      await page.setViewport({ width: 1440, height: 900 });
      await page.reload({ waitUntil: 'networkidle0' });
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: '/tmp/qa_desktop_gm.png', fullPage: true });

  } catch (err) {
      console.error(err);
  } finally {
      await browser.close();
      console.log("QA sweep complete");
  }
})();
