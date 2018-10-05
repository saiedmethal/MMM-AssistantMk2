## MMM-AssistantMk2
`MMM-AssistantMk2` is an embedded google assistant on MagicMirror. This is more improved than my last [MMM-Assistant](https://github.com/eouia/MMM-Assistant).

### What is different?
I made `MMM-Assistant` last year, But it was notorious with it's difficulty of installation and configuration. And it was based on the old APIs and dependencies. I was so disappointed with it's limitation, so I have half forgotten this module. Sorry about that to everyone.
Now, the environments are improved. Google has also released new tools and 'Assistant for device'. It means, there is no need of 'Commander' any more. Custom commands(actions) could be integrated in Assistant itself.

So, I'd made this module newly.

#### Improvements
- pure javascript, no other python program or daemon needed.
- Hotword([MMM-Hotword](https://github.com/eouia/MMM-Hotword)) and Assistant([MMM-AssistantMk2]()) are separated. Now you can wake up your Assistant with other modules. (e.g; H/W buttons or other module notifications or anything)
- Command mode is deprecated. Now Google Assistant itself has ability to react with custom action. And possible to use IFTTT or transcriptionHooking.)
  - See [MMM-NotificationTrigger](https://github.com/eouia/MMM-NotificationTrigger) for transcriptionHooking or using IFTTT.
  - See [MMM-GAction](https://github.com/eouia/MMM-GAction) for custom google action.
- Visual response!!! (like Google Home with screen or Google Assistant on your phone, but some functions are limited or missed.)
- Multi user supported.
- Auto find Youtube clip and playing.

### Screenshot
[[PlaceHolder]]

### Updates
#### [1.1.0] - 2018.10.04
- MP3 Output is supported. Now you can get more unchunky sound result.(Set `audio.encodingOut` to `MP3` // `OGG` is not yet supported.)
- `ding.wav` will be played when Assistant is ready to hear your voice.
- For update from prior version
```
sudo apt-get install mpg321
cd ~/MagicMirror/modules/MMM-AssistantMk2
git pull
npm install --save wav
```


#### [1.0.1] - 2018.07.25.
- Youtube playlist can be playable
- Some uncaught youtube videos are caught now
- On youtube player error, error code is shown
- notifyPlaying option is added.

### Installation
1. Install pre-dependencies
```sh
sudo apt-get install libasound2-dev sox libsox-fmt-all mpg321
```
- `mpg321` is mp3 player when you select `MP3` as sound output, so you can change to others or unuse.

1. Install Module
```sh
git clone https://github.com/eouia/MMM-AssistantMk2.git
cd MMM-AssistantMk2
npm install
```
There could be some warnings, but it gives no harm for using.

If your mirror is running as `SERVERONLY` mode, no other installation step is needed. But if you want to run your mirror as `KIOSK` mode, you should rebuild binaries to match with electron. You will meet this or something similar erros.
```
NODE_MODULE_VERSION 59. This version of Node.js requires
NODE_MODULE_VERSION 57. Please try re-compiling or re-installing
```
And as you know, there could be many problems or not. Wish you good luck.
(I recommend to execute this after making profiles.)

```sh
cd ~/MagicMirror/modules/MMM-AssistantMk2
npm install --save-dev electron-rebuild
./node_modules/.bin/electron-rebuild   # It could takes 10~30 minutes.
```

When you meet this kinds of errors;
```
gyp ERR! stack Error: make failed with exit code: 2
```
See this page;
https://github.com/nodejs/node-gyp/issues/809

### Get Auth and credentials to make profile.
1. Create or open a project in the [Actions Console](https://console.actions.google.com/)
2. After creation, Enable `Google Assistant API` for your project in the [Cloud Platform Console](https://console.cloud.google.com/)
3. Return to Actions Console and Follow the instructions to [register a device model](https://developers.google.com/assistant/sdk/guides/service/python/embed/register-device)<br>
(If you cannot find `Device registration` menu, you can use this URL https://console.actions.google.com/u/[0]/project/[yourprojectId]/deviceregistration/) (change [] to your project) or [Manual registration](https://developers.google.com/assistant/sdk/reference/device-registration/register-device-manual))

4. In register steps(step 2), you can download your `credentials.json` for OAuth. Carefully store it in `MMM-AssistantMk2` directory.
 - Or you can find your credentials from [Cloud Platform Console](https://console.cloud.google.com/) (Your Project > APIs & Services > Credentials)
5. In your SBC, you can run auth-tool for authentification. (not via SSH)
```sh
cd ~/MagicMirror/modules/MMM-AssistantMk2
node auth_and_test.js
```
   a. If you meet some errors related with node version, execute `npm rebuild` and try again.

   b. At first execution, this script will try opening a browser and getting permission of a specific user for using this Assistant. (So you'd better to execute this script in your RPI shell, not via SSH)

   c. After confirmation, Some code (`4/ABCD1234XXXXX....`) will appear in the browser. Copy that code and paste in your console's request (`Paste your code:`)

   d. On success, Prompt `Type your request` will be displayed. Type anything for testing assistant. (e.g; `Hello`, `How is the weather today?`)

   e. Now you can find `token.json` in your `MMM-AssistantMk2` directory. Move it under `profiles` directory with rename `default.json`. This will be used in module as `default` profile.

 ```sh
 mv token.json ./profiles/default.json
 ```
  f. If you want to make more profiles(for your family??), do the step 5 again. and move the `token.json` generated to profiles directory with another profile name, and don't forget setting your configuration.
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

### Configuration (DON'T PANIC!!)
Below values are pre-set as default values. It means, you can put even nothing in config field. (Most of belows are not needed for you.)
```javascript
  config: {
		deviceModelId: "", // (OPTIONAL for gaction)It should be described in your config.json
		deviceInstanceId: "", // (OPTIONAL for gaction)It should be described in your config.json
		deviceLocation: { // (OPTIONAL)
			coordinates: { // set the latitude and longitude of the device (rf. mygeoposition.com)
				latitude: 51.5033640, // -90.0 - +90.0
				longitude: -0.1276250, // -180.0 - +180.0
			},
		},
		useScreen: true,  // set this to true if you want to output results to a screen
		//showed contents will be hidden when new conversation starts or ASSISTANT_STOP_CONTENT is comming.

    		screenZoom: "80%",
		transcriptionHook: { //if you set hooking phrase here, this module will catch these words in your speech and emit ASSISTANT_HOOK notification.
			/*
			"SCREEN_OFF" : "screen off",
			"SCREEN_ON" : "screen on",
			"REBOOT" : "reboot",
			"SHUTDOWN" : "shut down",
			"TEST" : "test"
			*/
		},
		youtube: {
			use:true, //if you want to autoplay of youtube clip in responses of Assistance.
			height: "480", //This is not real player size. It's for ideal player size for loading video. (related to video quality somehow.)
			width: "854",
      notifyPlaying: false, // tell other modules whether youtube is playing or not.
		},
		auth: {
			keyFilePath: "./credentials.json"
		},
		audio: {
			encodingIn: "LINEAR16", // supported are LINEAR16 / FLAC (defaults to LINEAR16)
			sampleRateIn: 16000, // supported rates are between 16000-24000 (defaults to 16000)
			encodingOut: "LINEAR16", // supported are LINEAR16 / MP3 / (defaults to LINEAR16) When you select MP3, you need mp3Player option. 
			sampleRateOut: 24000, // supported are 16000 / 24000 (defaults to 24000)
			mp3Player: "mpg321" // If needed, use with options.
		},
		defaultProfile: "default", // This default profile should be in `profiles` field.
		profiles: {
			"default" : {
				profileFile: "default.json", //this path will be `~/MagicMirror/modules/MMM-AssistantMk2/profiles/default.json"
				lang: "en-US"
				//currently available (estimation, not all tested):
				//  de-DE, en-AU, en-CA, en-GB, en-US, en-IN
				// fr-CA, fr-FR, it-IT, ja-JP, es-ES, es-MX, ko-KR, pt-BR
				// https://developers.google.com/assistant/sdk/reference/rpc/languages
			},
			/* You can use multi-profile for your family.
			"kids" : {
				profileFile: "jarvis.json",
				lang: "de-DE"
			},
			"myself_korean" : {
				profileFile: "default.json",
				lang: "ko-KR"
			}
			*/
		},
		record: {
			sampleRate    : 16000,      // audio sample rate
			threshold     : 0.5,        // silence threshold (rec only)
			thresholdStart: null,       // silence threshold to start recording, overrides threshold (rec only)
			thresholdEnd  : null,       // silence threshold to end recording, overrides threshold (rec only)
			silence       : 1.0,        // seconds of silence before ending
			verbose       : false,      // log info to the console
			recordProgram : "arecord",  // Defaults to "arecord" - also supports "rec" and "sox"
			device        : null        // recording device (e.g.: "plughw:1")
		},
	},

```


If you want to use default configuration, just use like this.
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
    defaultProfile: "dad"
    profiles: {
      "dad": {
        profileFile: "dad.json"
        lang: "de-DE"
      },
      "mom": {
        profileFile: "mom.json"
        lang: "en-US"
      },
      "tommy": {
        profileFile: "tommy.json"
        lang: "en-US"
      }
    },
  }
},
```
In case of using custom action(traits), you should describe `deviceModelId` (additionally `deviceInstanceId`) in configuration file also.


### Notification
#### Incoming Notifications as ASSISTANT request.
|Notification|Payload|Description|
|---|---|---|
|ASSISTANT_ACTIVATE|{profile:`String`}|Assistant will start with this profile name.
|ASSISTANT_CLEAR|null|Current playing video or content will be disappeared. And Assistant turns to sleep mode for waiting invocation.

#### Outgoing Notifications as ASSISTANT response.
|Notification|Payload|Description|
|---|---|---|
|ASSISTANT_ACTIVATED|null|Assistant is started now.
|ASSISTANT_DEACTIVATED|null|Assistant is stopped now.
|ASSISTANT_HOOK|{hook:"`HOOKED_STRING`"}|Your defined hooking phrase is caught in your speech.
|ASSISTANT_ACTION|`FOUND_ACTION_OBJECT`|When the response is defined or customized action of Assistant.


### Recommended Usage
It's good to use this module with [`MMM-Hotword`](https://github.com/eouia/MMM-Hotword) (for waking Assistant and give a profile) and [`MMM-NotificationTrigger`](https://github.com/eouia/MMM-NotificationTrigger) (for relaying from MMM-Hotword to MMM-AssistantMk2 and also for relaying from MMM-AssistantMk2 to other module.)
Here is configuration sample.
```javascript
//MMM-NotificationTrigger
{
      module: "MMM-NotificationTrigger",
      config: {
        useWebhook:true,
        triggers:[
          { //If there is ASSISTANT_ACTION, you can control other module here. In this sample, ALERT module will show message.
            trigger: "ASSISTANT_ACTION",
            triggerSenderFilter: function(sender) {
              if (sender.name == "MMM-AssistantMk2") {
                return true;
              } else {
                return false;
              }
            },
            triggerPayloadFilter: function(payload) {
              return true;
            },
            fires: [
              {
                fire:"SHOW_ALERT",
                payload: function(payload) {
                  return {
                    type: "notification",
                    title: payload[0].execution[0].type,
                    message: payload[0].execution[0].command
                  };
                },
              },
            ],
          },
          { //If you use IFTTT for your voice command, this sample will help you.
            trigger: "IFTTT_COMMAND",
            fires: [
              {
                fire:"SHOW_ALERT",
                payload: function(payload) {
                  return payload
                },
              },
            ],
          },
          { //If you use transcriptionHook for your voice command, this sample will help you.
            trigger: "ASSISTANT_HOOK",
            fires: [
              {
                fire:"SHOW_ALERT",
                payload: function(payload) {
                  return {
                    title: "HOOK",
                    message: "Are you saying " + payload.hook +"?",
                    timer: 5000
                  }
                },
              },
            ],
          },
          { //This make your Assistant to activate with MMM-Hotword
            trigger: "HOTWORD_DETECTED",
            fires: [
	      {
                fire:"HOTWORD_PAUSE",
              },
              {
                fire:"ASSISTANT_ACTIVATE",
		delay: 200,
                payload: function(payload) {
                  return {
                    "profile": payload.hotword
                  }
                }
              },
            ]
          },
          { //This make your MMM-Hotword to listen your invocation.
            trigger: "ASSISTANT_DEACTIVATED",
            fires: [
              {
                fire:"HOTWORD_RESUME"
              }
            ]
          },
        ]
      }
    }
},
//MMM-Hotword
{ //Using MMM-Hotword for Assistant wakeup.
      module: "MMM-Hotword",
      config: {} //using default configuration.
},
///MMM-GAction
{ //Using custom action for Assistant command
      module: "MMM-GAction",
      config: {}
},
//MMM-Assistant
{
      module: "MMM-AssistantMk2",
      position: "top_center",
      config: {
        useScreen: true,
        deviceModelId: "MY_MAGIC_MIRROR_MODEL_ID",
        deviceInstanceId: "MY_MAGIC_MIRROR_IN_LIVINGROOM",
        deviceLocation: { // (optional)
          coordinates: { // set the latitude and longitude of the device (rf. mygeoposition.com)
            latitude: 50.0851200, // -90.0 - +90.0
            longitude: 8.4763300, // -180.0 - +180.0
          },
        },
        transcriptionHook: {
          "UNICORN": "unicorn" // this is just sample.
        },
        profiles: {
          "default" : {
	    profileFile: "default.json",
            lang: "en-US"
          },
        }
      }
},
```

And for who doesn't want any commands (using just pure Assistant for test). You can start from this.
```javascript
{
      module: "MMM-NotificationTrigger",
      config: {
        triggers:[
          {
            trigger: "HOTWORD_DETECTED",
            fires: [
              {
                fire:"HOTWORD_PAUSE",

              },
              {
                fire:"ASSISTANT_ACTIVATE",
		delay: 200,
                payload: function(payload) {
                  return {
                    "profile": payload.hotword
                  }
                }
              },
            ]
          },
          {
            trigger: "ASSISTANT_DEACTIVATED",
            fires: [
              {
                fire:"HOTWORD_RESUME"
              }
            ]
          },
        ]
      }
},
{
      module: "MMM-Hotword",
      config: {}
},
{
      module: "MMM-AssistantMk2",
      position: "top_center",
      config: {}
},
```

### If you have touchscreen and don't want to use snowboy to wakeup
Just click the Mic icon to activate.
(I'll provide more touchscreen-friendly functions in some days.)


### use `youtube.notifyPlaying`
If you want your player would not be interrupted by it's sound itself awakening hotword,
set `youtube.notifyPlaying` to `true`. and add this code to `notificationTrigger` section of `config.js`
```js
... other triggers ...
{
  trigger: "ASSISTANT_VIDEO_PLAYING",
  fires:[
    {fire: "HOTWORD_PAUSE"}
  ]
},
{
  trigger: "ASSISTANT_VIDEO_STOP",
  fires:[
    {fire: "HOTWORD_RESUME"}
  ]
},
... other triggers ...
```
But with this setting, you cannot stop the video paying because it will not be interrupted by even your voice also.
If you want to stop the Video, you should emit `ASSISTANT_CLEAR`.

### Tested
- MagicMirror : 2.4.1
- nodeJS : 8.11.3 & 10.0.x
- SBC : Asus TinkerBoard & Raspberry Pi 3 / Kiosk mode and Serveronly mode both work.
- on Pi Zero (or ARMv6 Architecture), You might need to rebuild modules from source. That is out of my ability, so I cannot help about that.


### Known Issues
- Invalid Parameters when youtube playing : Most of those cases, owner of video doesn't allow playing video out of youtube. try another.
- Sometimes response without voice. : Yes, Google Tech team also knows that.
- Some functions are not supported : Originally, screen output is made for REAL SMART TV (e.g. LG TV) with Google Assistant, thus REAL TV can interact the screen output with remotecontroller or something automatic processed. but we aren't.
- Result of Image search? web search? : I'm considering how it could be used. it is not easy as my expectation.
#### Some Troubleshootings
- Error: /urs/lib/arm-linux-gnueabihf/libstdc++.so.6: version 'GLIBCXX_3.4.21' not found
```
sudo apt-get update
sudo apt-get upgrade
sudo apt-get install build-essentials
sudo apt-get install gcc-5
```
- grpc Electron-rebuild issues. (until proper binaries provided)
`grpc` was updated recently, but their team havn't dispatched proper binaries for new version. So it could make problem when you try electron-rebuild.
Here are some experimental trials;
1) use `grpc-js` instead `grpc`
```
cd ~/MagicMirror/modules
rm -rf MMM-AssistantMk2/
git clone https://github.com/eouia/MMM-AssistantMk2
cd MMM-AssistantMk2
npm install
cd node_modules
rm -rf grpc
cd ..
npm install @grpc/grpc-js
npm install --save-dev electron-rebuild
./node_modules/.bin/electron-rebuild
```
2) downgrade grpc to v1.13
```
cd ~/MagicMirror/modules
rm -rf MMM-AssistantMk2/
git clone https://github.com/eouia/MMM-AssistantMk2
cd MMM-AssistantMk2
npm install
cd node_modules
rm -rf grpc
cd ..
npm install grpc@1.13
npm install --save-dev electron-rebuild
./node_modules/.bin/electron-rebuild
```


### TODO
- debugging??
- Touchscreen friendly
- If response has additional info with external web page, showing full website. (But... how to control? eg. scrolling???)
- map or carousel displaying... (screenOut for Assistant was developed for TV device, so not perfectly matched with UX on Mirror.)
