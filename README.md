## MMM-AssistantMk2
`MMM-AssistantMk2` is an embedded google assistant on MagicMirror. This is more improved than my last `MMM-Assistant`.

### What is different?
I made `MMM-Assistant` last year, But it was notorious with it's difficulty of installation and configuration. And it was based on the old APIs and dependencies. I was so disappointed with it's limitation, so I have half forgotten this module. Sorry about that to everyone.
Now, the environments are improved. Google has also released new tools and 'Assistant for device'. It means, there is no need of 'Commander' any more. Custom commands(actions) could be integrated in Assistant itself.

So, I'd made this module newly.

#### Improvements
- pure javascript, no other python program or daemon needed.
- Hotword([MMM-Hotword](https://github.com/eouia/MMM-Hotword)) and Assistant([MMM-AssistantMk2]()) are separated. Now you can wake up your Assistant with other methods. (e.g; H/W buttons or other module notifications or anything)
- Command mode is deprecated. Now Google Assistant itself has ability to react with custom action. (But I recommend to use IFTTT or transcriptionHooking)
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
(I recommend to execute this after making profiles.)

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
> If you are not an expereienced developer or don't need `gactions` implements, pass this section.

If you want not only pure Assistant embeding but also customized gactions for device, you should get `deviceModelId` and `deviceInstanceId`. To help understanding, 'deviceModel' is something like `Volkswagen Golf` or `MagicMirror` and 'deviceInstance' is something like `mom's car` or `mirror in living room`.

#### For `deviceModelId`
You can get `deviceModelId` as a result of previous [register a device model](https://developers.google.com/assistant/sdk/guides/service/python/embed/register-device) step. In `Device registration` menu in `Actions Console`, you can find it.

#### For `deviceInstanceId`
You need additional `google-assistant-sdk` library. See [
Manually Register a Device with the REST API](https://developers.google.com/assistant/sdk/reference/device-registration/register-device-manual#get-access-token) page.
(I think if your mirror is only one, there is no need for deviceInstanceId)

### Configuration
Below values are pre-set as default values. It means, you can put even nothing in config field. (Don't be panic. most of belows are not needed for you.)
```javascript
  config: {
    deviceModelId: '', // (optional) It should be described in your config.json to use.
    deviceInstanceId: '', // (optional) It should be described in your config.json to use.
    deviceLocation: { // (optional)
      coordinates: { // set the latitude and longitude of the device (rf. mygeoposition.com)
        latitude: 51.5033640, // -90.0 - +90.0
        longitude: -0.1276250, // -180.0 - +180.0
      },
    },
    useScreen: true,  // set this to true if you want to output results to a screen
    screenZoom: '80%',
    transcriptionHook: { // When you say these words, this module pass the result and your hooking notification(interface.actionNotification will be broadcasted.
      "SCREEN_OFF" : "screen off",
      "SCREEN_ON" : "screen on",
      "REBOOT" : "reboot",
      "SHUTDOWN" : "shut down",
      "TEST" : "test"
    },
    youtube: {
      use:true,
      height: "720",
      width: "1280"
    },
    auth: {
      keyFilePath: './credentials.json'
    },
    audio: {
        encodingIn: 'LINEAR16', // supported are LINEAR16 / FLAC (defaults to LINEAR16)
        sampleRateIn: 16000, // supported rates are between 16000-24000 (defaults to 16000)
        encodingOut: 'LINEAR16', // supported are LINEAR16 / MP3 / OPUS_IN_OGG (defaults to LINEAR16)
        sampleRateOut: 24000, // supported are 16000 / 24000 (defaults to 24000)
    },
    profiles: {
      "default" : {
        lang: "en-US"
        //currently available (estimation, not all tested):
        //  de-DE, en-AU, en-CA, en-GB, en-US, en-IN
        // fr-CA, fr-FR, it-IT, ja-JP, es-ES, es-MX, ko-KR, pt-BR
        // https://developers.google.com/assistant/sdk/reference/rpc/languages
      },
      /* For multi profiles or languages.
      "jarvis" : {
        lang: "de-DE"
      },
      "snowboy" : {
        lang: "ko-KR"
      }
      */
    },
    interface: {
      activateNotification: 'HOTWORD_DETECTED', // Which Notification be used for wakeup.
      // (`HOTWORD_DETECTED` is used by `MMM-Hotword` module, but you can set this for your other module(e.g; buttons or timer...))
      selectPayloadProfile: 'hotword', // And which payload field will be used for selecting profile.
      defaultPayloadProfile: 'default', //When `selectPayloadProfile` value would not be found in `profiles`.
      finishedNotification: 'HOTWORD_RESUME', //When Assistant answer your question, this notification will be sent and stop itself.
      actionNotification: 'ASSISTANT_ACTION', //When Assistant catch `trait actions` to execute,
    },
    record: {
      sampleRate    : 16000,      // audio sample rate
      threshold     : 0.5,        // silence threshold (rec only)
      thresholdStart: null,       // silence threshold to start recording, overrides threshold (rec only)
      thresholdEnd  : null,       // silence threshold to end recording, overrides threshold (rec only)
      silence       : 1.0,        // seconds of silence before ending
      verbose       : false,      // log info to the console
      recordProgram : 'arecord',  // Defaults to 'arecord' - also supports 'rec' and 'sox'
      device        : null        // recording device (e.g.: 'plughw:1')
    },
  },

```


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
      selectPayloadProfile: 'button_type',
      defaultPayloadProfile: 'dad',
    }
  }
},
```
In case of using custom action(traits), you should describe `deviceModelId` (additionally `deviceInstanceId`)
