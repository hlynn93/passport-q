const puppeteer = require('puppeteer');
const chalk = require('chalk');
const notifier = require('node-notifier')
const form = require('./form.json')

const RELOAD_DELAY = 5000
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
  let isSuccessful = false
  const browser = await puppeteer.launch({ headless: HEADLESS })
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
    isSuccessful = await page.evaluate(async (form) => {
      let isDateAvailable = false
      let counter = 0

      /** Open calendar */
      const calButton = document.getElementsByClassName('ui-datepicker-trigger')[0]
      calButton.click()

      const calendar = document.getElementById('ui-datepicker-div')

      /** Try until an available date is found for the current month and next month */
      while ((counter < 2) && !isDateAvailable) {
        const curMonth = calendar.getElementsByClassName('ui-datepicker-month')[0].innerHTML
        const slot = getAvailableSlot(calendar)
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
          counter++;
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

          return slot
        }
      } 
    }, form)

    /** Refresh page and startover again */
    if (!isSuccessful) {
      console.log(chalk.red('Trying again'))
      await wait(RELOAD_DELAY)
      await page.reload({ waitUntil: ["networkidle0", "domcontentloaded"] })
    }
  }
  
  if (SHOULD_ALERT) {
    while(true) {
      notifier.notify({
        title: 'Passport Q',
        message: 'Form is submitted successfully'
      });
      await wait(ALERT_FREQUENCY)
    }
  }
  
})();