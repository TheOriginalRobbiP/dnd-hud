const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      await page.goto('https://dnd.rjp.digital/display', { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: '/tmp/live_display_screen.png', fullPage: true });
      console.log('Saved /tmp/live_display_screen.png');
  } catch (err) {
      console.error(err);
  } finally {
      await browser.close();
  }
})();
