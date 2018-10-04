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
		//useWeb: true, // set this to true if you want to see the referenced webpage in mirror. (Reserved for next update)
		//showed contents will be hidden when new conversation starts or interface.stopContentNotification is comming.
		screenZoom: "80%",
		transcriptionHook: {
			//"SCREEN_OFF" : "screen off",
			//"SCREEN_ON" : "screen on",
			//"REBOOT" : "reboot",
			//"SHUTDOWN" : "shut down",
			//"TEST" : "test"
		},
		youtube: {
			use:true,
			height: "480",
			width: "854",
			notifyPlaying: false, // tell other modules whether youtube is playing or not.
		},
		auth: {
			keyFilePath: "./credentials.json"
		},
		audio: {
			encodingIn: "LINEAR16", // supported are LINEAR16 / FLAC (defaults to LINEAR16)
			sampleRateIn: 16000, // supported rates are between 16000-24000 (defaults to 16000)
			encodingOut: "LINEAR16", // supported are LINEAR16 / MP3 / OPUS_IN_OGG (defaults to LINEAR16)
			sampleRateOut: 24000, // supported are 16000 / 24000 (defaults to 24000)
			mp3Player: "mpg321" //mp3 player. if needed, give the proper options.
		},
		defaultProfile: "default",
		profiles: {
			"default" : {
				profileFile: "default.json",
				lang: "en-US"
				//currently available (estimation, not all tested):
				//  de-DE, en-AU, en-CA, en-GB, en-US, en-IN
				// fr-CA, fr-FR, it-IT, ja-JP, es-ES, es-MX, ko-KR, pt-BR
				// https://developers.google.com/assistant/sdk/reference/rpc/languages
			},

			//"kids" : {
			//	profileFile: "jarvis.json",
			//	lang: "de-DE"
			//},
			//"myself_korean" : {
			//	profileFile: "default.json",
			//	lang: "ko-KR"
			//}
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
		this.videoPlaying = false
		console.log("start")
	},

	getDom : function() {
		var wrapper = document.createElement("div")
		wrapper.className = "sleeping"
		wrapper.id = "ASSISTANT"
		wrapper.onclick = ()=> {
			if (wrapper.className == "sleeping") {
				this.sendSocketNotification("START", this.config.profiles[this.config.defaultProfile])
			}
		}
		var micImg = document.createElement("div")


		micImg.id = "ASSISTANT_MIC"
		var message = document.createElement("div")
		message.id = "ASSISTANT_MESSAGE"
		wrapper.appendChild(micImg)
		wrapper.appendChild(message)
		return wrapper
	},

	prepareScreen: function() {
		var web = document.createElement("iframe")
		web.id = "ASSISTANT_WEB"
		document.body.appendChild(web)
		var screen = document.createElement("iframe")
		screen.id = "ASSISTANT_SCREEN"
		document.body.appendChild(screen)
		var video = document.createElement("div")
		video.id = "ASSISTANT_VIDEO"
		var videoWrapper = document.createElement("div")
		videoWrapper.id = "ASSISTANT_VIDEO_WRAPPER"
		videoWrapper.appendChild(video)
		var videoError = document.createElement("div")
		videoError.id = "ASSISTANT_VIDEO_ERROR"
		videoWrapper.appendChild(videoError)
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
								self.hideVideo()
							}, 1000)

						}
					},
					"onError": (event)=> {
						console.log("youtube error:", event.data)
						var er = document.getElementById("ASSISTANT_VIDEO_ERROR")
						er.innerHTML = "Youtube error: " + event.data
						setTimeout(()=>{
							self.hideVideo()
						}, 5000)
					}
				}
			})
		}
	},

	showContent: function(url) {
		var screen = document.getElementById("ASSISTANT_WEB")
		screen.src = url
		setTimeout(()=>{
			screen.className = "show"
		},500)
	},

	hideContent: function() {
		var screen = document.getElementById("ASSISTANT_WEB")
		screen.className = "hide"
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

	showVideo: function(id, type="video") {
		if (type == "video") {
			this.ytp.loadVideoById(id, 0, "default")
		} else {
			this.ytp.loadPlaylist({
				"list":id,
				"listType":"playlist",
				"index":0
			})
		}
		if (this.config.youtube.notifyPlaying == true) {
			this.videoPlaying = true
			this.sendNotification("ASSISTANT_VIDEO_PLAYING")
		}
		this.ytp.playVideo()
		var wrapper = document.getElementById("ASSISTANT_VIDEO_WRAPPER")
		wrapper.className = "show"
	},

	hideVideo: function() {
		var wrapper = document.getElementById("ASSISTANT_VIDEO_WRAPPER")
		var er = document.getElementById("ASSISTANT_VIDEO_ERROR")
		er.innerHTML = ""
		this.ytp.stopVideo()
		if (this.config.youtube.notifyPlaying == true && this.videoPlaying) {
			this.sendNotification("ASSISTANT_VIDEO_STOP")
			this.videoPlaying = false
		}
		wrapper.className = "hide"
	},



	displayStatus: function(mode, text) {
		var wrapper = document.getElementById("ASSISTANT")
		wrapper.className = mode
		var message = document.getElementById("ASSISTANT_MESSAGE")
		message.innerHTML = text
	},

	notificationReceived: function (notification, payload, sender) {
		switch(notification) {
		case "ALL_MODULES_STARTED":
			//do nothing
			break
		case "DOM_OBJECTS_CREATED":
			this.prepareScreen()
			break
		case "ASSISTANT_ACTIVATE":
			var profileKey = ""
			var profile = {}
			if (payload.profile in this.config.profiles) {
				profileKey = payload.profile
			} else {
				profileKey = this.config.defaultProfile
			}
			profile = this.config.profiles[profileKey]
			this.sendSocketNotification("START", profile)
			break
		case "ASSISTANT_CLEAR":
			this.hideScreen()
			this.hideVideo()
			this.hideContent()
			break
		}
	},


	socketNotificationReceived: function (notification, payload) {
		switch(notification) {
		case "INITIALIZED":
			//do nothing
			break

		case "STARTED":
			this.displayStatus("waiting", "")
			this.hideVideo()
			this.hideContent()
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
						this.hideContent()
						this.showVideo(payload.foundVideo, "video")
					}, 1500)
				}
				if (payload.foundVideoList) {
					console.log ("Video Playlist:", payload.foundVideoList)
					setTimeout(()=>{
						this.hideScreen()
						this.hideContent()
						this.showVideo(payload.foundVideoList, "playlist")
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
				if (payload.foundWeb) {
					setTimeout(()=>{
						this.hideScreen()
						this.hideVideo()
						this.showContent(payload.foundContent)
					}, 1500)
				}
				if (payload.continue != true) {
					setTimeout(()=>{
						this.displayStatus("sleeping", "")
						this.sendNotification("ASSISTANT_DEACTIVATED", null)
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
				this.sendNotification("ASSISTANT_DEACTIVATED", null)
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
				this.sendNotification("ASSISTANT_DEACTIVATED", null)
			}, 3000)
			break
		case "AUDIO_ERROR": //this is not your fault... sometimes google assistant lost her voice.. Even google staffs can't help this currently.
			this.displayStatus("error", "AUDIO OUT ERROR")
			setTimeout(()=>{
				this.displayStatus("sleeping", "")
				this.sendNotification("ASSISTANT_DEACTIVATED", null)
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
	}
})
