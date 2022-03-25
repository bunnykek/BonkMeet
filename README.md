![BonkMeet](https://github.com/bunnykek/BonkMeet/blob/main/logoM.svg)
# BonkMeet
Telegram bot to attend Google Meet sessions on behalf of you :D    

## How to use?
You will need these two tokens:
1. Bot Token from [BotFather](https://telegram.me/BotFather)
2. Go to meet.google.com and export the cookie using [Cookies for puppeteer chrome extension](https://chrome.google.com/webstore/detail/%E3%82%AF%E3%83%83%E3%82%AD%E3%83%BCjson%E3%83%95%E3%82%A1%E3%82%A4%E3%83%AB%E5%87%BA%E5%8A%9B-for-puppet/nmckokihipjgplolmcmjakknndddifde)    

### For VPS/RDP users:   
First install node.js and set these two environment variables:
```
bot_token="XXXXXXX:AAAAAAAAAAAAAAAAAAAAAAAa"  //bot token from botfather
cookie =                                      //exported cookie
```
then clone this repo and move into its directory.   
`npm install`     
`node main.js`    

### Heroku Deploy
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/bunnykek/BonkMeet)    
Make sure to go to the deployed application's `Resources` tab and disable the `web` and enable the `worker`.     
    
<img src="https://user-images.githubusercontent.com/67633271/159228071-af14ac62-b867-4271-83c8-1a075bf2bab7.png" width="1000">   

### Bot commands:
```
/join {gmeet_link}    
/status (shows the ongoing meet current status)     
/leave (leaves the current gmeet session)      
/help
```
