const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  try {
      const page = await browser.newPage();
      await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
      await page.goto('https://dnd.rjp.digital', { waitUntil: 'networkidle0' });
      await page.evaluate(() => localStorage.clear());
      await page.reload({ waitUntil: 'networkidle0' });
      
      await page.screenshot({ path: '/tmp/test_role_selector_mobile.png', fullPage: true });

  } catch (err) {
      console.error(err);
  } finally {
      await browser.close();
  }
})();
