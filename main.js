const puppeteer = require('puppeteer');
const TelegramBot = require('node-telegram-bot-api');
var fs = require('fs');
require('dotenv').config()

const logo =
  `\n
 /$$$$$$$                      /$$       /$$       /$$      /$$                       /$$    
| $$__  $$                    | $$      | $$      | $$$    /$$$                      | $$    
| $$  \\ $$  /$$$$$$  /$$$$$$$ | $$   /$$| $$      | $$$$  /$$$$  /$$$$$$   /$$$$$$  /$$$$$$  
| $$$$$$$  /$$__  $$| $$__  $$| $$  /$$/| $$      | $$ $$/$$ $$ /$$__  $$ /$$__  $$|_  $$_/  
| $$__  $$| $$  \\ $$| $$  \\ $$| $$$$$$/ |__/      | $$  $$$| $$| $$$$$$$$| $$$$$$$$  | $$    
| $$  \\ $$| $$  | $$| $$  | $$| $$_  $$           | $$\\  $ | $$| $$_____/| $$_____/  | $$ /$$
| $$$$$$$/|  $$$$$$/| $$  | $$| $$ \\  $$ /$$      | $$ \\/  | $$|  $$$$$$$|  $$$$$$$  |  $$$$/
|_______/  \\______/ |__/  |__/|__/  \\__/|__/      |__/     |__/ \\_______/ \\_______/   \\___/ 
                              bot for attending your Gmeet sessions                      --by bunny \n`
console.log(logo);
console.log('Send /help to the bot...');

const token = process.env.bot_token;
const Cookie = JSON.parse(process.env.cookie);
const user_id = process.env.user_id;
const threshold = parseInt(process.env.threshold);
var InterVar = null;
var lastIndex = 0;

async function main() {

  const browser = await puppeteer.launch({
    headless: true,
    ignoreDefaultArgs: ['--enable-automation'],
    args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = browser.defaultBrowserContext();
  await context.overridePermissions('https://meet.google.com/', []);

  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(0);
  await page.setCookie(...Cookie);
  await page.setViewport({ width: 1366, height: 768 });
  let restrict = 0;

  // Create a bot that uses 'polling' to fetch new updates
  const bot = new TelegramBot(token, { polling: true });

  async function checking() {
    //console.log("cycled");
    try {
      //Checks if the chat is being spammed
      console.log("checking the chat");
      let count = 0;
      const arr = await page.evaluate(() => [...document.querySelectorAll("[data-formatted-timestamp]")].map(elem => elem.attributes[9].nodeValue))
      if (arr.length - lastIndex >= 15) {
        console.log("The class chatbox is being spammed!");
        bot.sendMessage(user_id, 'The class chatbox is being spammed!')
        bot.sendMessage(user_id, 'The class chatbox is being spammed!!')
      }
      lastIndex = arr.length - 1;
      //console.log("checked the chat");

      //Checks the class strength 
      //console.log("checking the class strength");
      await page.waitForSelector('.uGOf1d')
      let element = await page.$('.uGOf1d')
      let value = await page.evaluate(el => el.textContent, element)
      if (parseInt(value) < threshold) {
        await bot.sendMessage(user_id, 'Meet strength has become less than the threshold strength.');
        clearInterval(InterVar)
        await page.screenshot({ path: 'example.png' });
        let stream = await fs.createReadStream('./example.png');
        bot.sendPhoto(user_id, stream);

        await bot.sendMessage(user_id, 'Leaving the meet...');
        let _class = '.VfPpkd-Bz112c-LgbsSe.yHy1rc.eT1oJ.tWDL4c.jh0Tpd.Gt6sbf.QQrMi'
        await page.waitForTimeout(1000)
        let elements = await page.$$(_class)
        if (elements.length != 0) {
          await elements[0].click()
          console.log('meet left');
          await page.waitForTimeout(2000)
          await page.screenshot({ path: 'example.png' });
          let stream = await fs.createReadStream('./example.png');
          bot.sendPhoto(user_id, stream);
        }
      }
      //console.log("checked the class strength");
    } catch {
      return null;
    }
  }

  bot.onText(/\/join (.+)/, async (msg, match) => {
    if (msg.from.id != user_id) {
      return null;
    }

    if (restrict == 1) {
      return null;
    }
    else {
      restrict = 1;
    }
    lastIndex = 0;
    const chatId = msg.chat.id;
    const resp = match[1]; // the captured "whatever"

    if (InterVar != null) {
      clearInterval(InterVar)
    }

    let classCode = ''
    try {
      classCode = resp.match(/\w+-\w+-\w+/)[0];
    } catch {
      await bot.sendMessage(chatId, 'Check your meeting code.\nMake sure that you have used the correct meet url.', { reply_to_message_id: msg.message_id })
      return null;
    }
    console.log('Meet link : ', `https://meet.google.com/${classCode}`);
    await page.goto(`https://meet.google.com/${classCode}`);
    await bot.sendMessage(chatId, 'Please wait...', { reply_to_message_id: msg.message_id })


    let [button] = await page.$x("//button[contains(., 'Return to home screen')]");
    if (button) {
      await bot.sendMessage(chatId, 'Check your meeting code.\nMake sure that you have used the correct meet url.', { reply_to_message_id: msg.message_id })
    }

    else {

      //dismiss button 1
      try {
        let _class = '.VfPpkd-LgbsSe.VfPpkd-LgbsSe-OWXEXe-dgl2Hf.ksBjEc.lKxP2d.qfvgSe.AjXHhf'
        await page.waitForTimeout(2000)
        await page.keyboard.press('Enter')
      } catch { }

      await page.waitForTimeout(1500)

      //dismiss button 2
      try {
        xpath = '//*[@id="yDmH0d"]/div[3]/div[2]/div/div[2]/button'
        await page.waitForTimeout(2000)
        await page.keyboard.press('Enter')
      } catch { }

      console.log("2nd dismiss button clicked")

      //Join button
      let _class = '#yDmH0d > c-wiz > div > div > div:nth-child(13) > div.crqnQb > div > div.gAGjv > div.vgJExf > div > div > div.d7iDfe.NONs6c > div > div.Sla0Yd > div > div.XCoPyb > div > button'
      await page.waitForSelector(_class)
      await page.waitForTimeout(1000)
      elements = await page.$$(_class)
      await elements[0].click()

      console.log("Join button clicked")


      await page.keyboard.press('Tab', { delay: 5000 })
      await page.keyboard.press('Tab')
      // await page.keyboard.press('Tab')
      // await page.keyboard.press('Tab')
      // await page.keyboard.press('Tab')

      await page.waitForTimeout(1000)
      await page.screenshot({ path: 'example.png' });
      // let stream = await fs.createReadStream('./example.png');
      bot.sendMessage(chatId, 'Requested/joined the class!', { reply_to_message_id: msg.message_id })
      bot.sendPhoto(chatId, 'example.png');

      //toggle chatbox
      _class = '.VfPpkd-Bz112c-LgbsSe.yHy1rc.eT1oJ.JsuyRc.boDUxc'
      await page.waitForTimeout(1000)
      elements = await page.$$(_class)
      if (elements.length != 0) {
        await elements[2].click()
        await page.waitForTimeout(1000)
      }

      InterVar = setInterval(checking, 60000);
    }

    restrict = 0;
  });

  bot.onText(/\/message (.+)/, async (msg, match) => {
    if (msg.from.id != user_id) {
      return null;
    }

    const chatId = msg.chat.id;
    const resp = match[1];  // the captured "whatever"

    try {
      await page.type("#bfTqV", ' ', { delay: 200 });
      await page.waitForTimeout(2000);
      await page.keyboard.press('Backspace');
      await page.type("#bfTqV", resp, { delay: 300 });

      _class = '.VfPpkd-Bz112c-LgbsSe.yHy1rc.eT1oJ.QDwDD.tWDL4c.Cs0vCd';
      await page.waitForSelector(_class)
      elements = await page.$$(_class)
      await elements[0].click()

      //await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'example.png' });
      let stream = await fs.createReadStream('./example.png');
      bot.sendPhoto(chatId, stream);
    }
    catch {
      bot.sendMessage(chatId, 'Send /chatbox first.', { reply_to_message_id: msg.message_id });
    }
  })

  bot.on('message', async (msg) => {
    if (msg.from.id != user_id) {
      return null;
    }
    const chatId = msg.chat.id;
    if (msg.text == '\/status') {
      console.log(msg.text);
      await page.screenshot({ path: 'example.png' });
      let stream = await fs.createReadStream('./example.png');
      bot.sendPhoto(chatId, stream);
    }
    else if (msg.text == '\/leave') {
      console.log(msg.text);
      //leave button
      let _class = '.VfPpkd-Bz112c-LgbsSe.yHy1rc.eT1oJ.tWDL4c.jh0Tpd.Gt6sbf.QQrMi'
      await page.waitForTimeout(1000)
      let elements = await page.$$(_class)
      if (elements.length != 0) {
        await elements[0].click()
        console.log('meet left');
        await page.waitForTimeout(2000)
        clearInterval(InterVar)
        bot.sendMessage(chatId, 'Left the meet!', { reply_to_message_id: msg.message_id })
        await page.screenshot({ path: 'example.png' });
        let stream = await fs.createReadStream('./example.png');
        bot.sendPhoto(chatId, stream);
      }
      else {
        bot.sendMessage(chatId, 'You are not attending any gmeet session currently', { reply_to_message_id: msg.message_id })
      }
    }

    else if (msg.text == '\/help') {
      let help = `List of available commands:
/join {gmeet_link}
/message {test message} (sends message to chatbox)
/status (shows the ongoing meet current status)
/leave (leaves the current gmeet session)
/help

bonkMeet by @pseudoboi🧪
`
      bot.sendMessage(chatId, help, { reply_to_message_id: msg.message_id })
    }

    else if (msg.text == '\/start') {
      bot.sendMessage(chatId, 'Yo! send /help', { reply_to_message_id: msg.message_id })
    }
  });
}

main()
