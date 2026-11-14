const {defineConfig}=require('@playwright/test');
const path=require('node:path');

module.exports=defineConfig({
  testDir:__dirname,
  testMatch:'guided-tour.browser.spec.cjs',
  timeout:90000,
  expect:{timeout:10000},
  workers:1,
  reporter:'list',
  outputDir:path.resolve(__dirname,'../../test-results/green-park'),
  use:{
    baseURL:'http://127.0.0.1:4173/green-little-world/dist/',
    launchOptions:{
      executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',
      args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']
    },
    trace:'retain-on-failure'
  },
  webServer:{
    command:'python3 -m http.server 4173 --bind 127.0.0.1',
    cwd:path.resolve(__dirname,'../..'),
    url:'http://127.0.0.1:4173',
    reuseExistingServer:true,
    timeout:15000
  }
});
