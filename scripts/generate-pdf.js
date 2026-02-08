const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

const PORT = 37542;
const OUTPUT_PATH = path.join(__dirname, '..', 'files', 'cv_igor_razumny.pdf');

function waitForServer(port, maxAttempts = 30) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      attempts++;
      const req = http.get(`http://127.0.0.1:${port}`, (res) => {
        req.destroy();
        resolve();
      });
      req.on('error', () => {
        if (attempts >= maxAttempts) reject(new Error('Server did not start'));
        else setTimeout(check, 200);
      });
    };
    check();
  });
}

async function main() {
  const server = spawn('npx', ['serve', path.join(__dirname, '..'), '-l', String(PORT)], {
    stdio: 'ignore',
    cwd: path.join(__dirname, '..'),
  });

  try {
    await waitForServer(PORT);
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: OUTPUT_PATH,
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
    });
    await browser.close();
  } finally {
    server.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
