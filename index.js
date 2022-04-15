const puppeteer = require('puppeteer');
const chalk = require('chalk');
const notifier = require('node-notifier')
const form = require('./form.json')

const SKIP_DAY = 0
const RELOAD_DELAY = 1000
const ALERT_FREQUENCY = 3000
const SHOULD_ALERT = true
const HEADLESS = false
const URL = 'https://www.consularappointment.sg/ConsularAppointment';

async function wait(duration = RELOAD_DELAY) {
  await new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, duration)
  })
} 

(async () => {
  let isSuccessful = false,
  retryCount = 1;
  const [
    skipDay = SKIP_DAY, 
    headless = HEADLESS, 
    reloadDelay = RELOAD_DELAY,
    shouldAlert = SHOULD_ALERT,
    alertFrequency = ALERT_FREQUENCY 
  ] = process.argv.slice(2);
  
  console.log('==================')
  console.log('skipDay: ', skipDay)
  console.log('headless: ', headless)
  console.log('reloadDelay: ', reloadDelay)
  console.log('shouldAlert: ', shouldAlert)
  console.log('alertFrequency: ', alertFrequency)
  console.log('==================')

  const browser = await puppeteer.launch({ headless })
  const page = await browser.newPage()
  page.exposeFunction('wait', wait)

  await page.goto(URL)
  console.log('Opening the url: ', chalk.blue(URL))
  
  /** Expose browser logs back to node env */
  page.on('console', (msg) => {
    for (let i = 0; i < msg.args().length; ++i) {
      if (msg.type() === 'debug') console.log(chalk.bgGray(msg.args()[i]));
      if (msg.type() === 'info') console.log(chalk.bgGray(chalk.green(msg.args()[i])));
    }
  });

  while(!isSuccessful) {

    /** Refresh and try to book until successful */
    isSuccessful = await page.evaluate(async (form, skipDay) => {
      let isDateAvailable = false
      let monthCounter = 0

      /** Open calendar */
      const calButton = document.getElementsByClassName('ui-datepicker-trigger')[0]
      calButton.click()

      const calendar = document.getElementById('ui-datepicker-div')
 
      /** Try until an available date is found for the current month and next month */
      while ((monthCounter < 2) && !isDateAvailable) {
        const curMonth = calendar.getElementsByClassName('ui-datepicker-month')[0].innerHTML
        const slot = getAvailableSlot(calendar, skipDay)
        if (slot) {
          /** select the date and end loop */
          const date = slot.children[0].innerHTML
          slot.click()
          isDateAvailable = true
          console.info(date + ' ' + curMonth + ' is available')
        } else {
          /** click next month and loop again */
          console.info('No available dates in ' + curMonth)
          const nextBtn = calendar.getElementsByClassName('ui-datepicker-next')[0]
          nextBtn.click()
          monthCounter++;
        }
      }

      /** Return if there is no available date */
      if (!isDateAvailable) {
        return false
      }

      /** Fill up form and submit */
      console.info('Filling up the form')
      Object.entries(form).forEach(([id, value]) => {
        const ele = document.getElementById(id)
        ele.value = value
      })

      const submitBtn = document.getElementById('ctl00_MainContent_btnSave')
      console.info('Form submitted!')
      submitBtn.click()
      return true

      function getAvailableSlot(calendar) {
        const slots = calendar.getElementsByTagName('td')

        for (let idx = 0; idx < slots.length; idx++) {
          const slot = slots[idx];
          const isInvalid = slot.className.includes('ui-datepicker-other-month')
          const isDisabled = slot.className.includes('ui-state-disabled')
          // console.debug(slot.innerHTML)
          
          if (isInvalid || isDisabled) 
            continue

          if (skipDay !== 0) {
            skipDay--;
            continue
          } 
          
          return slot
        }
      } 
    }, form, skipDay)

    /** Refresh page and startover again */
    if (!isSuccessful) {
      console.log(chalk.red('Trying again: ', retryCount++))
      await wait(reloadDelay)
      await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] })
    }
  }
  
  if (shouldAlert) {
    let alertCounter = 3
    while(alertCounter !== 0) {
      notifier.notify({
        title: 'Passport Q',
        message: 'Form is submitted successfully'
      });
      alertCounter--;         
      await wait(alertFrequency)
    }
  }
  
})();