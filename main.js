const puppeteer = require('puppeteer');
const TelegramBot = require('node-telegram-bot-api');
var fs = require('fs');

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

async function main() {

  const browser = await puppeteer.launch({
    headless: true,
    ignoreDefaultArgs: ['--enable-automation'],
    args: ['--start-maximized','--no-sandbox'],
    defaultViewport: { width: 1280 , height: 720 }
  });
  const context = browser.defaultBrowserContext();
  await context.overridePermissions('https://meet.google.com', []);
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(0);
  await page.setCookie(...Cookie);

  // Create a bot that uses 'polling' to fetch new updates
  const bot = new TelegramBot(token, { polling: true });

  //bot.on("polling_error", console.log);

  // Matches "/echo [whatever]"
  bot.onText(/\/join (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const resp = match[1]; // the captured "whatever"
    let classCode = ''
    try{
      classCode = resp.match(/\w+-\w+-\w+/)[0];
    } catch{
      await bot.sendMessage(chatId, 'Check your meeting code.\nMake sure that you have used the correct meet url.', { reply_to_message_id: msg.message_id })
      return null;
    }
      console.log('Classroom link : ', `https://meet.google.com/${classCode}`);
      await page.goto(`https://meet.google.com/${classCode}`);
      await bot.sendMessage(chatId, 'Please wait...', { reply_to_message_id: msg.message_id })
      
    let [button] = await page.$x("//button[contains(., 'Dismiss')]");
    if (button) {
      await button.click();
    }

    [button] = await page.$x("//button[contains(., 'Return to home screen')]");
    if (button) {
      await bot.sendMessage(chatId, 'Check your meeting code.\nMake sure that you have used the correct meet url.', { reply_to_message_id: msg.message_id })
    }

    else {
      xpath = '//*[@id="yDmH0d"]/c-wiz/div/div/div[9]/div[3]/div/div/div[3]/div/div/div[2]/div/div[2]/div/div[1]/div[1]/span/span'
      await page.waitForXPath(xpath)
      await page.waitForTimeout(1000)
      elements = await page.$x(xpath)
      await elements[0].click()
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.waitForTimeout(5000)
      await page.screenshot({ path: 'example.png' });
      let stream = await fs.createReadStream('./example.png');
      bot.sendMessage(chatId, 'Requested/joined the class!', { reply_to_message_id: msg.message_id })
      bot.sendPhoto(chatId, stream);
    }
  });

  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    if (msg.text == '\/status') {
      console.log(msg.text);
      await page.screenshot({ path: 'example.png' });
      let stream = await fs.createReadStream('./example.png');
      bot.sendPhoto(chatId, stream);
    }
    else if (msg.text == '\/leave') {
      console.log(msg.text);
      let xpath = '//*[@id="ow3"]/div[1]/div/div[9]/div[3]/div[10]/div[2]/div/div[7]/span/button'
      await page.waitForTimeout(1000)
      let elements = await page.$x(xpath)
      if (elements.length != 0) {
        await elements[0].click()
        console.log('meet left');
        await page.waitForTimeout(2000)
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
/status (shows the ongoing meet current status)
/leave (leaves the current gmeet session)
/help`
      bot.sendMessage(chatId, help, { reply_to_message_id: msg.message_id })
    }

    else if (msg.text == '\/start') {
      bot.sendMessage(chatId, 'Yo! send /help', { reply_to_message_id: msg.message_id })
    }
  });
}

main()
