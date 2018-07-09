## MMM-AssistantMk2
`MMM-AssistantMk2` is an embedded google assistant on MagicMirror. This is more improved than my last `MMM-Assistant`.

### What is different?
I made `MMM-Assistant` last year, But it was notorious with it's difficulty of installation and configuration. And it was based on the old APIs and dependencies. I was so disappointed with it's limitation, so I have half forgotten this module. Sorry about that to everyone.
Now, the environments are improved. Google has also released new tools and 'Assistant for device'. It means, there is no need of 'Commander' any more. Custom commands(actions) could be integrated in Assistant itself.

So, I'd made this module newly.

#### Improvements
- Hotword(MMM-Hotword) and Assistant(MMM-AssistantMk2) are separated. Now you can wake up your Assistant with other methods. (e.g; H/W buttons or other module notifications or anything)
- Command mode is deprecated. Now Google Assistant itself has ability to react with custom action.
- Visual response!!! (like Google Home with screen or Google Assistant on your phone, but some functions are limited or missed.)
- Multi user supported.

### Screenshot
[[PlaceHolder]]

### Installation
1. Install pre-dependencies
```sh
sudo apt-get install libasound2-dev sox libsox-fmt-all
```
1. Install Module
```sh
git clone https://github.com/eouia/MMM-AssistantMk2.git
cd MMM-AssistantMk2
npm install
```
There could be some warnings, but it gives no harm for using.

If your mirror is running as `SERVERONLY` mode, no other installation step is needed. But if you want to run your mirror as `KIOSK` mode, you should rebuild binaries to match with electron. And as you know, there could be many problems or not. Wish you good luck.

```sh
npm install --save-dev electron-rebuild
./node_modules/.bin/electron-rebuild   # It could takes dozens sec.
```

### Get Auth and credentials to make profile.
1. Create or open a project in the [Actions Console](https://console.actions.google.com/)
1. After creation, Enable `Google Assistant API` for your project in the [Cloud Platform Console](https://console.cloud.google.com/)
1. Return to Actions Console and Follow the instructions to [register a device model](https://developers.google.com/assistant/sdk/guides/service/python/embed/register-device)<br>
(If you cannot find `Device registration` menu, you can use this URL https://console.actions.google.com/u/[0]/project/[yourprojectId]/deviceregistration/) (change [] to your project) or [Manual registration](https://developers.google.com/assistant/sdk/reference/device-registration/register-device-manual))
(Device Type: phone is recommended. And in`Surface capabiliites`, turn all stuffs on.)

1. In register steps(step 2), you can download your `credentials.json` for OAuth. Carefully store it in `MMM-AssistantMk2` directory.
 - Or you can find your credentials from [Cloud Platform Console](https://console.cloud.google.com/) (Your Project > APIs & Services > Credentials)
1. In your SBC, you can run auth-tool for authentification. (not via SSH)
```sh
cd ~/MagicMirror/modules/MMM-AssistantMk2
node auth_and_test.js
```
 0. If you meet some errors related with node version, execute `npm rebuild` and try again.
 1. At first execution, this script will try opening a browser and getting permission of a specific user for using this Assistant.
 1. After confirmation, Some code (`4/ABCD1234XXXXX....`) will appear in the browser. Copy that code and paste in your console's request (`Paste your code:`)
 1. On success, Prompt `Type your request` will be displayed. Type anything for testing assistant. (e.g; `Hello`, `How is the weather today?`)
 1. Everything OK?
 1. Now you can find `token.json` in your `MMM-AssistantMk2` directory. Move it under `profiles` directory with rename `default.json`.
 ```sh
 mv token.json ./profiles/default.json
 ```
 1. If you want to make more profiles(for your family??), do the step 4 again. and move the `token.json` generated to profiles directory with another profile name, and don't forget setting your configuration.
```sh
mv token.json ./profiles/mom.json
```

### Get `deviceModelId` and `deviceInstanceId`
If you want not only pure Assistant embeding but also customized actions for device, you should get `deviceModelId` and `deviceInstanceId`. To help understanding, 'deviceModel' is something like `Volkswagen Golf` or `MagicMirror` and 'deviceInstance' is something like `mom's car` or `mirror in living room`.

#### For `deviceModelId`
You can get `deviceModelId` as a result of previous [register a device model](https://developers.google.com/assistant/sdk/guides/service/python/embed/register-device) step. In `Device registration` menu in `Actions Console`, you can find it.

#### For `deviceInstanceId`
You need additional `google-assistant-sdk` library. See [
Manually Register a Device with the REST API](https://developers.google.com/assistant/sdk/reference/device-registration/register-device-manual#get-access-token) page.
(I think if your mirror is only one, there is no need for deviceInstanceId)

### Configuration
Below values are pre-set as default values. It means, you can put even nothing in config field.
```javascript
  config: {
    auth: {
      keyFilePath: './credentials.json' //It will be 'MMM-AssistantMk2/credentials.json'
    }
    conversation: {
      audio: {
        encodingIn: 'LINEAR16', // supported are LINEAR16 / FLAC (defaults to LINEAR16)
        sampleRateIn: 16000, // supported rates are between 16000-24000 (defaults to 16000)
        encodingOut: 'LINEAR16', // supported are LINEAR16 / MP3 / OPUS_IN_OGG (defaults to LINEAR16)
        sampleRateOut: 24000, // supported are 16000 / 24000 (defaults to 24000)
      },
      deviceModelId: '', // It should be described in your config.js
      deviceInstanceId: '', // It should be described in your config.js
      deviceLocation: { // (optional)
        coordinates: { // set the latitude and longitude of the device (rf. mygeoposition.com)
          latitude: 51.5033640, // -90.0 - +90.0
          longitude: -0.1276250, // -180.0 - +180.0
        },
      },
      screen: {
        isOn: true, // set this to true if you want to output results to a screen
      },
    },
    profiles: {
      "default" : {
        lang: "en-US"
        //currently available (estimation, not all tested):
        //  en-US, en-GB, en-AU, en-SG, en-CA,
        //  de-DE, fr-FR, fr-CA, ja-JP, ko-KR,
        //  es-ES, es-419, pt-BR, it-IT, ru-RU,
        //  hi-IN, th-TH, id-ID, da-DK, no-NO,
        //  nl-NL, sv-SE,
      },
      "jarvis" : {
        lang: "de-DE"
      }
    },
    interface: {
      activateNotification: 'HOTWORD_DETECTED', // Which Notification be used for wakeup.
      // (`HOTWORD_DETECTED` is used by `MMM-Hotword` module, but you can adjust this for your other module(e.g; buttons or timer...))
      selectPayloadProfile: 'hotword', // And which payload field will be used for selecting profile.
      defaultPayloadProfile: 'default', //When `selectPayloadProfile` value would not be found in `profiles`.
      finishedNotification: 'HOTWORD_RESUME', //When Assistant answer your question, this notification will be sent and stop itself.
      findishedPayload: 'result' //And the result will be atattched to the notification as payload.
    }
  },

```
- Details for language supports: https://developers.google.com/actions/localization/languages-locales

If you want to use default configuration, just use like this. (When you use with `MMM-Hotword`)
```javascript
{
  module: "MMM-AssistantMk2",
  position: "top_left",
  config: {}
},
```

In case of multi-users, use like this.
```javascript
{
  module: "MMM-AssistantMk2",
  position: "top_left",
  config: {
    profiles: [
      "dad": {
        lang: "de-DE" //`profiles/dad.json` is needed.
      },
      "mom": {
        lang: "en-US" //`profiles/mom.json` is needed.
      },
      "tommy": {
        lang: "en-US" //`profiles/tommy.json` is needed.
      }
    ],
    interface: { //Assuming using several H/W buttons to activate assistant per user.
      activateNotification: "BUTTON_PRESSED",
      selectPayloadProfile: 'button',
      defaultPayloadProfile: 'dad',
    }
  }
},
```
In case of using custom action(traits), you should describe `deviceModelId` (additionally `deviceInstanceId`)

### Usage

#### 1. Commands
Other modules can order to start or stop hotwords detection by notifications.

|Notification| payload| description
|---|---|---|
|HOTWORD_RESUME | null | Let this module try to listen sounds until detecting hotwords or interrupted.
|HOTWORD_PAUSE | null | Let this module stop to listen sounds.

#### 2. Results
This module might broadcast some notification as results.

|Notification|payload|description
|---|---|---|
|HOTWORD_ERROR | error | When error is occurred.
|HOTWORD_LISTENING | null | When this module start listening. (normally instant answer for the 'HOTWORD_RESUME')
|HOTWORD_SLEEPING | null | When this module stop listening. (normally instant answer for the 'HOTWORD_PAUSE')
|HOTWORD_DETECTED | {index: `int`, hotword: `string`} | When a hotword is detected, this notification will be casted. <br> In default configuration values;<br>{1, 'SMARTMIRROR'}<br>{2, 'SNOWBOY'}<br>{3, 'JARVIS'}<br>{4, 'JARVIS'}

#### 3. Common usage flow
1. If `autostart` is set as 'true', Your mirror is ready to catch hotwords after the mirror is on. (See 5. for `autostart` is 'false')
2. Say the hotword. (e.g; 'Jarvis' or 'Smart mirror')
3. If detection is success, `HOTWORD_DETECTED`notification will be broadcasted with `{index:n, hotword:'something'}`.
4. Now, you can make your other modules receive that notification and do something.
5. After `HOTWORD_DETECTED` notification is sent, `MMM-Hotword` stops listening hotword(unless `autorestart` is `true`), so, your other modules should reactivate `MMM-HOTWORD` with `HOTWORD_RESUME` notification. (If your module uses microphone, should release mic for hotword listening before notification)
6. Don't set `autorestart` as 'true' when you combine this with other voice related modules. (But if you have 2 mics, It could be OK.)

### Next...(maybe)
- Custom notifications. (I doubt it will be needed. I believe it's better to make `Notification Converter` between modules.)
