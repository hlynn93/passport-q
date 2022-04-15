# passport-q
Automate booking an appointment at Myanmar Embassy in Singapore to renew passport with Puppeteer

## Prereq
- NodeJS

## Usage

- Fill up `form-sample.json` with your own particulars and rename it to `form.json`
- `npm install`
- `node index.js` from the root level

additional command line arguments

```
node index.js [skipDay] [reloadDelay] [headless] [shouldAlert] 
```

|  Name  | Type | Default Value | Description |
|--------| ---- | ------------- | ----------- |
| skipDay|Number| 0             | If you want to book several days later than the first available date 
| reloadDelay|Number| 1000             | Retry interval in milliseconds 
| headless|Boolean| false             | Running the script in headless mode (Not recommended as it might require manual input down the line) 
| shouldAlert|Boolean| true             | Sends out notifications once the form is submitted
