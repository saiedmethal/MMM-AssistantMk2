//
// Module : MMM-Hotword
//


Module.register("MMM-AssistantMk2", {
  defaults: {
    deviceModelId: '', // It should be described in your config.json
    deviceInstanceId: '', // It should be described in your config.json
    deviceLocation: { // (optional)
      coordinates: { // set the latitude and longitude of the device (rf. mygeoposition.com)
        latitude: 51.5033640, // -90.0 - +90.0
        longitude: -0.1276250, // -180.0 - +180.0
      },
    },
    useScreen: true,  // set this to true if you want to output results to a screen
    screenZoom: '80%',
    transcriptionHook: {
      "SCREEN_OFF" : "screen off",
      "SCREEN_ON" : "screen on",
      "REBOOT" : "reboot",
      "SHUTDOWN" : "shut down",
      "TEST" : "test"
    },
    speakerOffScript: "pactl set-sink-volume 5 0",
    speakerOnScript: "pactl set-sink-volume 5 100%", // These scripts are used for transcription hooking
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
      "jarvis" : {
        lang: "de-DE"
      },
      "snowboy" : {
        lang: "ko-KR"
      }
    },
    interface: {
      activateNotification: 'HOTWORD_DETECTED', // Which Notification be used for wakeup.
      // (`HOTWORD_DETECTED` is used by `MMM-Hotword` module, but you can adjust this for your other module(e.g; buttons or timer...))
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

  getStyles: function () {
    return ["MMM-AssistantMk2.css"]
  },

  start: function () {
    this.isInitialized = 0
    this.config = this.configAssignment({}, this.defaults, this.config)
    this.sendSocketNotification('INIT', this.config)
    this.headerContent = ''
    this.screenContent = null
    this.ytp = null
  },

  getDom : function() {
    var wrapper = document.createElement("div")
    wrapper.className = "sleeping"
    wrapper.id = "ASSISTANT"
    var micImg = document.createElement("div")
    micImg.id = "ASSISTANT_MIC"
    var message = document.createElement("div")
    message.id = "ASSISTANT_MESSAGE"
    wrapper.appendChild(micImg)
    wrapper.appendChild(message)
    return wrapper
  },

  prepareScreen: function() {
    var screen = document.createElement("iframe")
    screen.id = "ASSISTANT_SCREEN"
    document.body.appendChild(screen)
    var video = document.createElement("div")
    video.id = "ASSISTANT_VIDEO"
    var video_wrapper = document.createElement("div")
    video_wrapper.id = "ASSISTANT_VIDEO_WRAPPER"
    video_wrapper.appendChild(video)
    document.body.appendChild(video_wrapper)


    var tag = document.createElement('script')
    tag.src = "https://www.youtube.com/iframe_api"
    var firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)

    var self = this
    window.onYouTubeIframeAPIReady = () => {
      self.ytp = new YT.Player('ASSISTANT_VIDEO', {
        height: this.config.youtube.height,
        width: this.config.youtube.height,
        playerVars: {
          'autoplay': 1,
          'controls': 0,
          'loop': 1,
          'rel': 0,
        },
        events: {
          'onReady': (event)=>{
            event.target.playVideo()
          },
          'onStateChange': (event)=>{
            if (event.data == 0) {
              setTimeout(()=>{
                event.target.stopVideo()
                var wrapper = document.getElementById("ASSISTANT_VIDEO_WRAPPER")
                wrapper.className = "hide"
              }, 1000)
            }
          },
          'onError': (event)=> {
            console.log("youtube error:", event.data)
            setTimeout(()=>{
              event.target.stopVideo()
              var wrapper = document.getElementById("ASSISTANT_VIDEO_WRAPPER")
              wrapper.className = "hide"
            }, 5000)
          }
        }
      })
    }


  },
  showScreen: function() {
    var screen = document.getElementById("ASSISTANT_SCREEN")
    screen.src = this.data.path + "/temp_screen.html"
    setTimeout(()=>{
      screen.className = "show"
    },500)

  },
  hideScreen: function() {
    var screen = document.getElementById("ASSISTANT_SCREEN")
    screen.className = "hide"
  },
  showVideo: function(id) {
    this.ytp.loadVideoById(id, 0, "default")
    this.ytp.playVideo()
    var wrapper = document.getElementById("ASSISTANT_VIDEO_WRAPPER")
    wrapper.className = "show"
  },

  hideVideo: function() {
    var wrapper = document.getElementById("ASSISTANT_VIDEO_WRAPPER")
    this.ytp.stopVideo()
    wrapper.className = "hide"
  },
  displayStatus: function(mode, text) {
    var wrapper = document.getElementById("ASSISTANT")
    wrapper.className = mode
    var message = document.getElementById("ASSISTANT_MESSAGE")
    message.innerHTML = text
  },

  filterNotification: function(payload) {
    var selector = this.config.defaultPayloadProfile
    var value = null

    if (typeof payload[this.config.interface.selectPayloadProfile] !== 'undefined') {
      selector = payload[this.config.interface.selectPayloadProfile]
    }

    if (typeof this.config.profiles[selector] == 'undefined') {
      selector = this.config.interface.defaultPayloadProfile
    }
    value = this.config.profiles[selector]

    return {profile:selector, config:value}
  },

  notificationReceived: function (notification, payload, sender) {
    switch(notification) {
      case 'ALL_MODULES_STARTED':
        //do nothing
        break
      case 'DOM_OBJECTS_CREATED':
        this.prepareScreen()
        break
      case this.config.interface.activateNotification:
        var cfg = this.filterNotification(payload)

        if (cfg.profile == null) {
          this.sendNotification('ASSTNT_ERROR_NOT_FOUND_PROFILE')
          break
        }
        this.sendSocketNotification('START', cfg)
        break
    }
  },


  socketNotificationReceived: function (notification, payload) {
    console.log("@@", notification)
    switch(notification) {
      case 'INITIALIZED':
        //do nothing
        break

/*
      case 'ERROR':
        this.sendNotification('HOTWORD_ERROR', payload)
        console.log('[HOTWORD] Error: ', payload)
        this.displayStatus('error', "Error found.")
        break
*/
      case 'STARTED':
        this.displayStatus('waiting', "")
        this.hideVideo()
        this.hideScreen()
        break
      case 'CONVERSATION_ENDED':
        if (payload == null) {
          this.displayStatus('waiting', '')
        } else {
          this.hideScreen()
          this.displayStatus('error', payload)

          setTimeout(()=>{
            this.hideScreen()
            this.sendNotification(this.config.interface.finishedNotification, null)
          }, 1000)

        }
        break
      case 'ASSISTANT_ENDED':
        setTimeout(()=>{
          this.displayStatus('sleeping', '')
          this.sendNotification(this.config.interface.finishedNotification, null)
        }, 1000)
        break

      case 'NOT_SUPPORTED':
        console.log("not supported")
        this.hideScreen()
        this.displayStatus('error', 'NOT_SUPPORTED')
        var timer = setTimeout(()=>{
          this.displayStatus('sleeping', '')
          this.sendNotification(this.config.interface.finishedNotification, null)
        }, 3000)
        break
      case 'DEVICE_ACTION':
        console.log("device action", payload)

        if (payload.command == 'action.devices.commands.EXCEPTION') {
          var status = JSON.parse(payload.params.status)
          this.hideScreen()
          this.displayStatus('error', status.description)
          var timer = setTimeout(()=>{
            this.displayStatus('sleeping', '')
            this.sendNotification(this.config.interface.finishedNotification, null)
          }, 3000)
        } else {
          this.sendNotification(this.config.interface.actionNotification, {
            'type': 'trait',
            'command': payload.command,
            'params': payload.params
          })
          var timer = setTimeout(()=>{
            this.displayStatus('sleeping', '')
            this.sendNotification(this.config.interface.finishedNotification, null)
          }, 3000)
        }
        break
      case 'SCREEN':
        this.showScreen()
        break
      case 'VIDEO':
        this.showVideo(payload)
        break
      case 'TRANSCRIPTION':
        if(payload.done == true) {
          this.displayStatus("understanding", payload.transcription)
        } else {
          this.displayStatus("listening", payload.transcription)
        }
        break
      case 'HOOK':
        this.sendNotification(this.config.interface.actionNotification, {
          'type': 'hook',
          'command': payload,
          'params': null
        })
        break
    }
  },



  configAssignment : function (result) {
    var stack = Array.prototype.slice.call(arguments, 1);
    var item;
    var key;
    while (stack.length) {
      item = stack.shift();
      for (key in item) {
        if (item.hasOwnProperty(key)) {
          if (
            typeof result[key] === 'object'
            && result[key]
            && Object.prototype.toString.call(result[key]) !== '[object Array]'
          ) {
            if (typeof item[key] === 'object' && item[key] !== null) {
              result[key] = this.configAssignment({}, result[key], item[key]);
            } else {
              result[key] = item[key];
            }
          } else {
            result[key] = item[key];
          }
        }
      }
    }
    return result;
  },
})
