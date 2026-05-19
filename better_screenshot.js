const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      
      console.log("Navigating to dnd.rjp.digital to set storage...");
      await page.goto('https://dnd.rjp.digital', { waitUntil: 'networkidle2' });
      
      await page.evaluate(() => {
          localStorage.setItem('hud:role', 'gm');
          sessionStorage.setItem('hud:gm-verified', 'true');
      });
      
      console.log("Reloading for GM Dashboard...");
      await page.goto('https://dnd.rjp.digital', { waitUntil: 'networkidle0' });
      await new Promise(r => setTimeout(r, 2000));
      
      console.log("Saving live_gm_dashboard.png...");
      await page.screenshot({ path: '/tmp/live_gm_dashboard.png', fullPage: true });
      
  } catch (err) {
      console.error(err);
  } finally {
      await browser.close();
  }
})();
