# passport-q
Automate booking an appointment at Myanmar Embassy in Singapore to renew passport with Puppeteer

## Prereq
- NodeJS

## Usage

- Fill up `form-sample.json` with your own particulars and rename it to `form.json`
- `npm install`
- `node index.js` from the root level

In `index.js`, you can adjust the following variables
- `HEADLESS` to `false` to run the script in headless mode
- `RELOAD_DELAY` to change the page retry rate in milliseconds
