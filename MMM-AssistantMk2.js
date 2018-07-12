//
// Module : MMM-Hotword
//


Module.register("MMM-AssistantMk2", {
	defaults: {
		deviceModelId: "", // It should be described in your config.json
		deviceInstanceId: "", // It should be described in your config.json
		deviceLocation: { // (optional)
			coordinates: { // set the latitude and longitude of the device (rf. mygeoposition.com)
				latitude: 51.5033640, // -90.0 - +90.0
				longitude: -0.1276250, // -180.0 - +180.0
			},
		},
		useScreen: true,  // set this to true if you want to output results to a screen
		screenZoom: "80%",
		transcriptionHook: {
			/*
			"SCREEN_OFF" : "screen off",
			"SCREEN_ON" : "screen on",
			"REBOOT" : "reboot",
			"SHUTDOWN" : "shut down",
			"TEST" : "test"
			*/
		},
		youtube: {
			use:true,
			height: "480",
			width: "854"
		},
		auth: {
			keyFilePath: "./credentials.json"
		},
		audio: {
			encodingIn: "LINEAR16", // supported are LINEAR16 / FLAC (defaults to LINEAR16)
			sampleRateIn: 16000, // supported rates are between 16000-24000 (defaults to 16000)
			encodingOut: "LINEAR16", // supported are LINEAR16 / MP3 / OPUS_IN_OGG (defaults to LINEAR16)
			sampleRateOut: 16000, // supported are 16000 / 24000 (defaults to 24000)
		},
		profiles: {
			"default" : {
				lang: "en-US"
				//currently available (estimation, not all tested):
				//  de-DE, en-AU, en-CA, en-GB, en-US, en-IN
				// fr-CA, fr-FR, it-IT, ja-JP, es-ES, es-MX, ko-KR, pt-BR
				// https://developers.google.com/assistant/sdk/reference/rpc/languages
			},
			/*
			"jarvis" : {
				lang: "de-DE"
			},
			"snowboy" : {
				lang: "ko-KR"
			}
			*/
		},
		interface: {
			activateNotification: "HOTWORD_DETECTED", // Which Notification be used for wakeup.
			// (`HOTWORD_DETECTED` is used by `MMM-Hotword` module, but you can adjust this for your other module(e.g; buttons or timer...))
			selectPayloadProfile: "hotword", // And which payload field will be used for selecting profile.
			defaultPayloadProfile: "default", //When `selectPayloadProfile` value would not be found in `profiles`.
			finishedNotification: "HOTWORD_RESUME", //When Assistant answer your question, this notification will be sent and stop itself.
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

	getStyles: function () {
		return ["MMM-AssistantMk2.css"]
	},

	start: function () {
		this.isInitialized = 0
		this.config = this.configAssignment({}, this.defaults, this.config)
		this.sendSocketNotification("INIT", this.config)
		this.headerContent = ""
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
		var videoWrapper = document.createElement("div")
		videoWrapper.id = "ASSISTANT_VIDEO_WRAPPER"
		videoWrapper.appendChild(video)
		document.body.appendChild(videoWrapper)


		var tag = document.createElement("script")
		tag.src = "https://www.youtube.com/iframe_api"
		var firstScriptTag = document.getElementsByTagName("script")[0]
		firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)

		var self = this
		window.onYouTubeIframeAPIReady = () => {
			self.ytp = new YT.Player("ASSISTANT_VIDEO", {
				height: this.config.youtube.height,
				width: this.config.youtube.height,
				playerVars: {
					"autoplay": 1,
					"controls": 0,
					"loop": 1,
					"rel": 0,
				},
				events: {
					"onReady": (event)=>{
						event.target.playVideo()
					},
					"onStateChange": (event)=>{
						if (event.data == 0) {
							setTimeout(()=>{
								event.target.stopVideo()
								var wrapper = document.getElementById("ASSISTANT_VIDEO_WRAPPER")
								wrapper.className = "hide"
							}, 1000)
						}
					},
					"onError": (event)=> {
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

		if (typeof payload[this.config.interface.selectPayloadProfile] !== "undefined") {
			selector = payload[this.config.interface.selectPayloadProfile]
		}
		if (typeof this.config.profiles[selector] == "undefined") {
			selector = this.config.interface.defaultPayloadProfile
		}
		value = this.config.profiles[selector]
		return {profile:selector, config:value}
	},

	notificationReceived: function (notification, payload, sender) {
		switch(notification) {
		case "ALL_MODULES_STARTED":
			//do nothing
			break
		case "DOM_OBJECTS_CREATED":
			this.prepareScreen()
			break
		case this.config.interface.activateNotification:
			var cfg = this.filterNotification(payload)

			if (cfg.profile == null) {
				this.sendNotification("ASSISTANT_ERROR_NOT_FOUND_PROFILE")
				break
			}
			this.sendSocketNotification("START", cfg)
			break
		}
	},


	socketNotificationReceived: function (notification, payload) {
		console.log("AT_NOTI:", notification)
		switch(notification) {
		case "INITIALIZED":
			//do nothing
			break

		case "STARTED":
			this.displayStatus("waiting", "")
			this.hideVideo()
			this.hideScreen()
			break
		case "TRANSCRIPTION":
			if(payload.done == true) {
				this.displayStatus("understanding", payload.transcription)
			} else {
				this.displayStatus("listening", payload.transcription)
			}
			break
		case "TURN_OVER":
			if (payload.error !== null) {
				console.log("TURN_OVER_ERROR:", payload.error)
				this.displayStatu("error", "ERROR")
			} else {
				if (payload.foundHook) {
					console.log ("Hook:", payload.foundHook)
					for(i in payload.foundHook) {
						var hook = payload.foundHook[i]
						this.sendNotification("ASSISTANT_HOOK", {"hook":hook})
					}
				}
				if (payload.foundVideo) {
					console.log ("Video:", payload.foundVideo)
					setTimeout(()=>{
						this.hideScreen()
						this.showVideo(payload.foundVideo)
					}, 1500)
				}
				if (payload.foundAction) {
					console.log ("Action", payload.foundAction)
					if (payload.foundAction.command !== "action.devices.commands.EXCEPTION") {
						this.sendNotification("ASSISTANT_ACTION", payload.foundAction)
					} else {
						var status = JSON.parse(payload.foundAction.params.status)
						this.displayStatus("error", status.description)
					}
				}
				if (payload.continue != true) {
					setTimeout(()=>{
						this.displayStatus("sleeping", "")
						this.sendNotification(this.config.interface.finishedNotification, null)
					}, 1000)
				}
			}
			break
		case "SCREEN":
			this.showScreen()
			break
		case "CONVERSATION_ERROR":
			this.displayStatus("error", "CONVERSATION ERROR")
			setTimeout(()=>{
				this.displayStatus("sleeping", "")
				this.sendNotification(this.config.interface.finishedNotification, null)
			}, 3000)
			break
		case "SPEAKING_START":
			break
		case "SPEAKING_END":
			break
		case "CONTINUOUS_TURN":
			break
		case "ASSISTANT_READY":
			break
		case "ASSISTANT_ERROR":
			this.displayStatus("error", "CONVERSATION ERROR")
			setTimeout(()=>{
				this.displayStatus("sleeping", "")
				this.sendNotification(this.config.interface.finishedNotification, null)
			}, 3000)
			break
		case "AUDIO_ERROR": //this is not your fault... sometimes google assistant lost her voice.. Even google staffs can't help this currently.
			this.displayStatus("error", "AUDIO OUT ERROR")
			setTimeout(()=>{
				this.displayStatus("sleeping", "")
				this.sendNotification(this.config.interface.finishedNotification, null)
			}, 3000)
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
						typeof result[key] === "object"
						&& result[key]
						&& Object.prototype.toString.call(result[key]) !== "[object Array]"
					) {
						if (typeof item[key] === "object" && item[key] !== null) {
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
