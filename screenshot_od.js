const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      
      await page.goto('file:///tmp/od_display.html', { waitUntil: 'networkidle2' });
      await page.screenshot({ path: '/tmp/od_display_screen.png', fullPage: true });
      console.log('Saved /tmp/od_display_screen.png');
      
      await page.goto('file:///tmp/od_gm.html', { waitUntil: 'networkidle2' });
      await page.screenshot({ path: '/tmp/od_gm_dashboard.png', fullPage: true });
      console.log('Saved /tmp/od_gm_dashboard.png');
  } catch (err) {
      console.error(err);
  } finally {
      await browser.close();
  }
})();
