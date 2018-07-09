//
// Module : MMM-AssistantMk2
//

'use strict'

//const stringDecoder = require('string_decoder')
const path = require('path')
const record = require('node-record-lpcm16')
const Speaker = require('speaker')
const GoogleAssistant = require('google-assistant')
const speakerHelper = require('./speaker-helper')
const exec = require('child_process').exec;

var NodeHelper = require("node_helper")

module.exports = NodeHelper.create({
  start: function () {
    console.log(this.name + " started");
    this.config = {}
  },

  initializeAfterLoading: function (config) {
    this.config = config
  },

  socketNotificationReceived: function (notification, payload) {
    switch(notification) {
      case 'INIT':
        this.initializeAfterLoading(payload)
        this.sendSocketNotification('INITIALIZED')
        break
      case 'START':
        this.activate(payload)
        this.sendSocketNotification('STARTED')
        break
    }
  },

  activate: function(payload) {
    var profile = payload.profile
    var profileConfig = payload.config
    var transcriptionHook = this.config.transcriptionHook

    var cfgInstance = {
      auth:{
        keyFilePath : path.resolve(__dirname, this.config.auth.keyFilePath),
        savedTokensPath : path.resolve(__dirname, "profiles/" + profile + ".json"),
      },
      conversation : {
        audio : this.config.audio,
        lang : profileConfig.lang,
        deviceModelId : this.config.deviceModelId,
        deviceId : this.config.deviceInstanceId,
        deviceLocation : this.config.deviceLocation,
        screen : {
          isOn: this.config.useScreen
        }
      },
    }


    var assistant = new GoogleAssistant(cfgInstance.auth)

    var startConversation = (conversation) => {
      var hooked = false
      let openMicAgain = false
      let saying = 0
      let answering = 0
      let notsupport = 0
      let checkTimer = null
      let ended = 0

      var selfConv = conversation


      // setup the conversation
      conversation
      // send the audio buffer to the speaker
      .on('audio-data', (data) => {
        answering = 1
        clearTimeout(checkTimer)
        if (hooked == true) {
          //exec(this.config.speakerOffScript, (e,so,se)=>{})
          //speakerHelper.update(data)
        } else {
          try {
            speakerHelper.update(data)
          } catch (error) {
            conversation.end()
            this.sendSocketNotification("CONVERSATION_ENDED", error)
          }

        }
      })
      // done speaking, close the mic
      .on('end-of-utterance', () => {
        console.log('end-of-utterance')
        record.stop()

      })
      // just to spit out to the console what was said (as we say it)
      .on('transcription', (data) => {
        console.log('Transcription:', data.transcription, ' --- Done:', data.done)
        saying = data.transcription.length
        this.sendSocketNotification('TRANSCRIPTION', data)
        hooked = false
        if (data.done) {
          for (var k in transcriptionHook) {
            if (transcriptionHook.hasOwnProperty(k)) {
               var v = transcriptionHook[k];
               var found = data.transcription.match(new RegExp(v, "ig"))
               if (found !== null) {
                 hooked = true
                 this.sendSocketNotification("HOOK", k)
               }
            }
          }
        }
      })

      // what the assistant said back. But currently, GAS doesn't return text response with screenOut at same time (maybe.)
      .on('response', text => {
        console.log('Assistant Text Response:', text)
      })
      // if we've requested a volume level change, get the percentage of the new level
      // But I'll not support this feature.
      .on('volume-percent', (percent) => {
        notsupport = 1
        record.stop()
        conversation.end()
      })
      // the device needs to complete an action
      .on('device-action', (action) => {
        console.log('Device Action:', action)
        if (typeof action["inputs"] !== 'undefined') {
          //this.sendSocketNotification('NOT_SUPPORTED')
          var intent = action.inputs[0].payload.commands
          console.log("execution", action.inputs[0].payload.commands[0].execution[0])
          this.sendSocketNotification('DEVICE_ACTION', action.inputs[0].payload.commands[0].execution[0])
          record.stop()
          conversation.end()
        }
        checkTimer = setTimeout(()=>{
          if (answering == 0 && saying !== 0) {
            console.log("AUGH!, voice response is not comming for a long time")
            conversation.end()
            this.sendSocketNotification("CONVERSATION_ENDED", "No Response")
            this.sendSocketNotification("ASSISTANT_ENDED", null)
          }
        }, 10000)

      })
      // once the conversation is ended, see if we need to follow up
      .on('ended', (error, continueConversation) => {
        ended = 0
        console.log("ended")
        if (error) {
          console.log('Conversation Ended Error:', error)
          record.stop()
          conversation.end()
          this.sendSocketNotification("CONVERSATION_ENDED", error)
          this.sendSocketNotification("ASSISTANT_ENDED", null)
        } else {
          if (continueConversation) {
            openMicAgain = true
            ended = 1
          } else if (saying == 0) {
            console.log('You are saying no words....')
            this.sendSocketNotification("ASSISTANT_ENDED", null)
            openMicAgain = false
          } else if (notsupport == 1) {
            openMicAgain = false
            this.sendSocketNotification("CONVERSATION_ENDED", 'notsupported')
            this.sendSocketNotification("ASSISTANT_ENDED", null)
          } else {
            this.sendSocketNotification("CONVERSATION_ENDED", null)
            this.sendSocketNotification("ASSISTANT_ENDED", null)
          }
        }
      })
      .on('screen-data', (screen) => {
        if (hooked !== true) {
          var self = this
          var file = require('fs')
          var filePath = path.resolve(__dirname,"temp_screen.html")
          var str = screen.data.toString('utf8')
          str = str.replace("html,body{", "html,body{zoom:" + this.config.screenZoom + ";")
          var re = new RegExp("v\=([0-9a-zA-Z]+)", "ig")
          var youtube = re.exec(str)

          if (youtube && this.config.youtube.use) {
            console.log('video found:', youtube[1])
            this.sendSocketNotification("VIDEO", youtube[1])
          } else {
            var contents = file.writeFile(filePath, str,
              (error) => {
                if (error) {
                 console.log('Error:- ' + error);
                }
                this.sendSocketNotification("SCREEN", str)
              }
            )
          }
        }
      })
      // catch any errors
      .on('error', (error) => {
        console.log('Conversation Error:', error)
        record.stop()
        conversation.end()
        this.sendSocketNotification("CONVERSATION_ENDED", error)
      })

      var mic = record.start(this.config.record)
      mic.on('data', (data) => {
        if (ended == 0) {
          try {
            conversation.write(data)
          } catch (err) {
            record.stop()
            conversation.end()
            this.sendSocketNotification("CONVERSATION_ENDED", err)
          }
        }
      })

      // setup the speaker
      var speaker = new Speaker({
       channels: 1,
       sampleRate: cfgInstance.conversation.audio.sampleRateOut,
      });
      speakerHelper.init(speaker)
      speaker
        .on('open', () => {
          this.sendSocketNotification("SPEAKING_START")
          speakerHelper.open()
        })
        .on('close', () => {
          this.sendSocketNotification("SPEAKING_END")
          //if (hooked) {
          //  exec(this.config.speakerOnScript, (e,so,se)=>{})
          //}
          if (openMicAgain) {
            assistant.start(cfgInstance.conversation)
          } else {
            // do nothing
          }
        })
    }

    assistant
    .on('ready', () => {
      // start a conversation!
      console.log('assistant ready')
      this.sendSocketNotification("READY")
      assistant.start(cfgInstance.conversation)
    })
    .on('started', startConversation)
    .on('error', (error) => {
      console.log('Assistant Error:', error)
      this.sendSocketNotification("ERROR", error)
    })
  },

})
