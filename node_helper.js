//
// Module : MMM-AssistantMk2
//

"use strict"

const path = require("path")
const record = require("node-record-lpcm16")
const Speaker = require("speaker")
const GoogleAssistant = require("google-assistant")
const exec = require("child_process").exec
const fs = require("fs")
const wav = require("wav")


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
		case "INIT":
			this.initializeAfterLoading(payload)
			this.sendSocketNotification("INITIALIZED")
			break
		case "START":
			this.activate(payload)
			this.sendSocketNotification("STARTED")
			break
		}
	},

	activate: function(payload) {
		var transcriptionHook = this.config.transcriptionHook

		var cfgInstance = {
			auth:{
				keyFilePath : path.resolve(__dirname, this.config.auth.keyFilePath),
				savedTokensPath : path.resolve(__dirname, "profiles/" + payload.profileFile),
			},
			conversation : {
				audio : this.config.audio,
				lang : payload.lang,
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
			let openMicAgain = false
			let foundHook = []
			let foundAction = null
			let foundVideo = null
			let foundVideoList = null
			let audioError = 0

			if (this.config.audio.encodingOut == "MP3") {
				var mp3File = path.resolve(__dirname, "temp.mp3")
				var wstream = fs.createWriteStream(mp3File)
			}
			// setup the conversation
			conversation
				// send the audio buffer to the speaker
				.on("audio-data", (data) => {
					if (this.config.audio.encodingOut == "MP3") {
						wstream.on('finish', ()=>{
						 	//console.log('file has been written')
					 		wstream.end()
						})
						try {
							wstream.write(data)
							//console.log("writing")
						} catch (error) {
							//wstream.end()
							//console.log(error)
							console.log("Some error happens. Try again.")
							this.sendSocketNotification("ERROR", "AUDIO_ERROR")
						}
					} else {
						try {
						  speaker.write(data)
						} catch (error) {
							if (audioError == 0) {
								speaker.end() //
								//console.log(error)
								console.log("Some error happens. Try again.")
								this.sendSocketNotification("ERROR", "AUDIO_ERROR")
							}
							audioError++
						}
					}

    			})
				// done speaking, close the mic
				.on("end-of-utterance", () => {
					console.log("end-of-utterance")
					record.stop()
				})
				// just to spit out to the console what was said (as we say it)
				.on("transcription", (data) => {
					console.log("Transcription:", data.transcription, " --- Done:", data.done)
					this.sendSocketNotification("TRANSCRIPTION", data)
					if (data.done) {
						for (var k in transcriptionHook) {
							if (transcriptionHook.hasOwnProperty(k)) {
								 var v = transcriptionHook[k];
								 var found = data.transcription.match(new RegExp(v, "ig"))
								 if (found !== null) {
									 foundHook.push(k)
								 }
							}
						}
					}
				})

				// what the assistant said back. But currently, GAS doesn"t return text response with screenOut at same time (maybe.)
				.on("response", text => {
					console.log("Assistant Text Response:", text)
				})
				// if we"ve requested a volume level change, get the percentage of the new level
				// But I"ll not support this feature.
				.on("volume-percent", (percent) => {
					console.log("Volume control... Not yet supported")
				})
				// the device needs to complete an action
				.on("device-action", (action) => {
					console.log("Device Action:", action)
					if (typeof action["inputs"] !== "undefined") {
						//this.sendSocketNotification("NOT_SUPPORTED")
						var intent = action.inputs[0].payload.commands
						console.log("execution", action.inputs[0].payload.commands[0].execution[0])
						foundAction = action.inputs[0].payload.commands
					}
				})
				// once the conversation is ended, see if we need to follow up
				.on("ended", (error, continueConversation) => {

					var payload = {
						"foundHook": foundHook,
						"foundAction": foundAction,
						"foundVideo": foundVideo,
						"foundVideoList": foundVideoList,
						"error": null,
						"continue": false
					}

					if (error) {
						console.log("Conversation Ended Error:", error)
						payload.error = error
					} else if (continueConversation) {
						openMicAgain = true
						payload.continue = true
					} else {
						console.log("Conversation Completed")
					}

					speaker.end() //
					if (this.config.audio.encodingOut == "MP3") {
						wstream.end()
						exec(this.config.audio.mp3Player + ' ' + mp3File, (err, stdout, stderr) => {
							//console.log(err, stdout, stderr)

							this.sendSocketNotification("TURN_OVER", payload)
						})
					} else {
						this.sendSocketNotification("TURN_OVER", payload)
					}


				})

				.on("screen-data", (screen) => {
					var self = this
					var file = require("fs")
					var filePath = path.resolve(__dirname,"temp_screen.html")
					var str = screen.data.toString("utf8")
					str = str.replace("html,body{", "html,body{zoom:" + this.config.screenZoom + ";")

					// TODO:I'll put some code here for web scrapping for contents reading.

					//For Image Search
					//https://www.google.com/search?tbm=isch

					var re = new RegExp("(tbm=isch[^<]*)", "ig")
					var isch = re.exec(str)
					//console.log("image:", isch)

					var contents = file.writeFile(filePath, str,
						(error) => {
							if (error) {
							 console.log("Error:- " + error);
							}
							this.sendSocketNotification("SCREEN", str)
						}
					)
					//www.youtube.com/watch?v=8O5pkFdi93k
					var re = new RegExp("youtube\.com\/watch\\?v\=([0-9a-zA-Z\-\_]+)", "ig")
					var youtubeVideo = re.exec(str)
					if (youtubeVideo) {
						console.log("video found:", youtubeVideo[1])
						foundVideo = youtubeVideo[1]
					}

					//(m.youtube.com - https://m.youtube.com/playlist?list=PLCdlJaCXfCUC30qzcup9L2DO9mv703eox)
					var re = new RegExp("youtube\.com\/playlist\\?list\=([a-zA-Z0-9\-\_]+)", "ig")
					var youtubeList = re.exec(str)
					if (youtubeList) {
						console.log("video list found:", youtubeList[1])
						foundVideoList = youtubeList[1]
					}


				})
				// catch any errors
				.on("error", (error) => {
					speaker.end() //
					console.log("Conversation Error:", error)
					this.sendSocketNotification("CONVERSATION_ERROR", error)
				})

			var mic = record.start(this.config.record)
			mic.on("data", (data) => {
				try {
					conversation.write(data)
				} catch (err) {
					console.log("mic error:", err)
				}
			})

			// setup the speaker
			var speaker = new Speaker({
			 channels: 1,
			 sampleRate: cfgInstance.conversation.audio.sampleRateOut,
			});
			speaker
				.on("open", () => {
					this.sendSocketNotification("SPEAKING_START")
				})
				.on("close", () => {
					this.sendSocketNotification("SPEAKING_END")
					if (openMicAgain) {
						this.sendSocketNotification("CONTINUOUS_TURN")
						assistant.start(cfgInstance.conversation)
					} else {
						// do nothing
					}
				})
		}

		assistant
			.on("ready", () => {
			// start a conversation!
				console.log("assistant ready")
				this.sendSocketNotification("ASSISTANT_READY")

				var wavReader = fs.createReadStream(path.resolve(__dirname, "resources/ding.wav")).pipe(wav.Reader())
				var buffer = null;

				wavReader.on('format', (format) => {
				    //console.log("Playing wav.", format)
				    wavReader.on('data', (chunk) => {
				        if(buffer)
				            buffer = Buffer.concat([buffer, chunk])
				        else
				            buffer = chunk
				    } )
				    .on( 'end', function() {
				    	var s = new Speaker(format)
							try {
								s.write(buffer)
					    	setTimeout(()=>{
					    		s.end()
					    		assistant.start(cfgInstance.conversation)
					    	}, 500)
							} catch (error) {
								s.end()
								console.log(error)
								console.log("Some error happens. Try again.")
								
							}


				    } )
				} )
				//assistant.start(cfgInstance.conversation)
			})
			.on("started", startConversation)
			.on("error", (error) => {
				console.log("Assistant Error:", error)
				this.sendSocketNotification("ASSISTANT_ERROR", error)
			})
	},

})
