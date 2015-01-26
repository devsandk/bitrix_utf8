MobileWebrtc = function ()
{
	this.signalingLink = '/mobile/ajax.php?mobile_action=calls&';
	this.initiator = false;
	this.callUserId = 0;
	this.eventTimeRange = 30;
	this.incomingCallTimeOut = 2;
	this.delayedIncomingCall = {};
	this.incomingCallTimeOutId = false;
	this.callBackUserId = 0;
	this.callChatId = 0;
	this.callToGroup = false;
	this.waitTimeout = false;
	this.callGroupUsers = [];
	this.callInit = false;
	this.callActive = false;
	this.ready = false;
	this.pcStart = {};
	this.connected = {};
	this.sessionDescription = {};
	this.remoteSessionDescription = {};
	this.iceCandidates = [];
	this.iceCandidatesToSend = [];
	this.iceCandidateTimeout = 0;
	this.peerConnectionInited = false;
	this.userId = BX.message('USER_ID');
	this.utcOffest = ((BX.localStorage.get("bxUtcOffset") != null)? BX.localStorage.get("bxUtcOffset"):0);
	BX.ajax({
		url: "/mobile/?mobile_action=service&service_id=server_utc",
		method: 'GET',
		dataType: 'json',
		timeout: 30,
		async: true,
		onsuccess: BX.proxy(function(json){
			if(json)
			{
				var localUtcTimeStamp = Math.round((new Date).getTime() / 1000);
				this.utcOffest = json.server_utc_time - localUtcTimeStamp;
				BX.localStorage.set("bxUtcOffset", this.utcOffest);
			}
		},this),
		onfailure: function(){}
	});

	webrtc.setEventListeners(
		{
			//UI callbacks
			"onAnswer": BX.proxy(this.onAnswer, this),
			"onDecline": BX.proxy(this.onDecline, this),
			"onCallback": BX.proxy(this.onCallback, this),
			"onClose": BX.proxy(this.onClose, this),
			//WebRTC callbacks
			"onUserMediaSuccess": BX.proxy(this.onUserMediaSuccess, this),
			"onDisconnect": BX.proxy(this.onDisconnect, this),
			"onPeerConnectionCreated": BX.proxy(this.onPeerConnectionCreated, this),
			"onIceCandidateDiscovered": BX.proxy(this.onIceCandidateDiscovered, this),
			"onLocalSessionDescriptionCreated": BX.proxy(this.onLocalSessionDescriptionCreated, this),
			"onIceConnectionStateChanged": BX.proxy(this.onIceConnectionStateChanged, this),
			"onIceGatheringStateChanged": BX.proxy(this.onIceGatheringStateChanged, this),
			"onSignalingStateChanged": BX.proxy(this.onSignalingStateChanged, this),
			"onError": BX.proxy(this.onError, this)
		}
	);
};


/**
 * Invites user
 * @param userId
 * @param video
 */
MobileWebrtc.prototype.callInvite = function (userId, video, repeat)
{

	if (userId == this.userId || this.callInit)
		return;

	if (this.delayedIncomingCall.chatId && this.delayedIncomingCall.senderId == userId)
	{
		this.clearDelayedCallData();
	}

	var callVideo = !(typeof video != "undefined" && video === false);
	var isRepeatCall = (repeat === true);
	this.callInit = true;
	this.ajaxCall("CALL_INVITE", {
			'COMMAND': 'invite',
			'CHAT_ID': userId,
			'CHAT': 'N',
			'VIDEO': (callVideo?"Y":"N")
		},
		BX.delegate(function (params)
		{
			if(params.ERROR)
			{
				if(isRepeatCall)
				{
					this.resetState();
					this.callInit = false;
					this.finishDialog();
				}
				else if(params.ERROR == "SESSION_ERROR")
				{
					BX.message.bitrix_sessid = params.BITRIX_SESSID;
					this.callInit = false;
					this.callInvite(userId, video, true);
				}
				return;
			}
			this.initiator = true;
			this.callChatId = params.CHAT_ID;
			this.callToGroup = params.CALL_TO_GROUP;
			this.callUserId = userId;
			webrtc.UI.show(
				webrtc.UI.state.OUTGOING_CALL,
				{
					"data": params,
					"video": callVideo,
					"recipient": {
						"avatar": params["HR_PHOTO"][this.callUserId],
						"name": params["USERS"][this.callUserId]["name"]
					},
					"caller":
					{
						"avatar": params["HR_PHOTO"][this.userId],
						"name": params["USERS"][this.userId]["name"]
					}
				}
			);


		}, this),
		BX.delegate(function (params)
		{
			//TODO error handling
			this.resetState();
			this.callInit = false;
			this.finishDialog();
		}, this)
	);


};

/**
 * Shows incomming call screen
 * @param params
 */
MobileWebrtc.prototype.showIncomingCall = function (params)
{
	this.callChatId = params.chatId;
	this.callToGroup = false;
	this.callUserId = params.senderId;
	this.initiator = false;
	this.callInit = true;
	this.callCommand(this.callChatId, 'wait');
	webrtc.UI.show(
		webrtc.UI.state.INCOMING_CALL,
		{
			"data": params,
			"video":params.video,
			"caller": {
				"name": params["users"][params.senderId]["name"],
				"avatar": params["hrphoto"][params.senderId]
			}
		}
	);
};

/**
 * Clears data for delayed incoming call
 */
MobileWebrtc.prototype.clearDelayedCallData = function ()
{
	clearTimeout(this.incomingCallTimeOutId);
	this.incomingCallTimeOutId = false;
	this.delayedIncomingCall = {};
};

/**
 * Resets all variables, connection data and states
 */
MobileWebrtc.prototype.resetState = function ()
{
	this.connected = {};
	this.initiator = false;
	this.callInit = false;
	this.callActive = false;
	this.callChatId = 0;
	this.callUserId = 0;
	this.isMobile = false;
	this.peerConnectionInited = false;
	this.iceCandidates = [];
	this.iceCandidatesToSend = [];
};

/**
 * Signaling
 * Sends signals to user with passed commands and params
 * @param userID
 * @param params
 */
MobileWebrtc.prototype.callSignaling = function (userID, params)
{
	this.ajaxCall("CALL_SIGNALING",{
		'COMMAND': 'signaling',
		'CHAT_ID': this.callChatId,
		'RECIPIENT_ID': userID,
		'PEER': JSON.stringify(params)
	});
};

/**
 * Send command to chat with chatId
 *
 * Available commands and them meaning:
 * <pre>
 * busy - you are already have the conversation with someone and can't pick up the phone
 * busy_self - informs the partner that you already have the conversation with him
 * ready - informs the partner you have front camera and microphone, local video stream is created and you are ready for the peerdata exchange
 * wait - informs the partner to keep waiting for the answer for the 30 seconds
 * decline - informs the partner that you've declined his incoming call or hung up while the call was active
 * </pre>
 * @param chatId
 * @param command
 * @param params
 * @param async
 */
MobileWebrtc.prototype.callCommand = function (chatId, command, params, async)
{
	chatId = parseInt(chatId);
	params = typeof(params) == 'object' ? params : {};

	if (chatId > 0)
	{

		this.ajaxCall(
			"CALL_SHARED",
			{'COMMAND': command,'CHAT_ID': chatId ,'RECIPIENT_ID': this.callUserId ,'PARAMS': JSON.stringify(params)}
		);
	}
};

/**
 * Finishes the conversation with closing UI
 */
MobileWebrtc.prototype.finishDialog = function ()
{
	webrtc.UI.close();
};


/**
 * Handles peer data signals
 *
 * @param userId
 * @param peerData
 */
MobileWebrtc.prototype.signalingPeerData = function (userId, peerData)
{
	var signal = JSON.parse(peerData);

	if (signal.type === 'offer')
	{
		this.remoteSessionDescription = signal["sdp"];
		webrtc.createPeerConnection();
	}
	else if (signal.type === 'answer')
	{
		webrtc.setRemoteDescription(signal);
	}
	else if (signal.type === 'candidate')
	{
		if (this.peerConnectionInited)
		{
			webrtc.addIceCandidates(signal.candidates);
		}
		else
		{
			for (var i = 0; i < signal.candidates.length; i++)
				this.iceCandidates.push(signal.candidates[i]);
		}
	}
};

/**
 * @param reqParam - request param for the ajax request
 * @param reqData - post data
 * @param onfailure - failure callback function
 * @param onsuccess - success callback function
 */
MobileWebrtc.prototype.ajaxCall = function (reqParam, reqData, onsuccess, onfailure)
{

	var data = reqData;
	data["MOBILE"] = "Y";
	data["IS_MOBILE"] = "Y";
	data["IM_CALL"] = "Y";
	data["IM_AJAX_CALL"] = "Y";
	data["sessid"] = BX.bitrix_sessid();

	BX.ajax({
		url: this.signalingLink + reqParam,
		method: 'POST',
		dataType: 'json',
		timeout: 30,
		async: true,
		data: data,
		onsuccess: onsuccess,
		onfailure: onfailure
	});
};

/**
 * Returns absolute diff between incoming date (in UTC) an
 * @param utcDate
 * @returns {number}
 */
MobileWebrtc.prototype.getUTCoffset = function ()
{
	return this.utcOffest*1000;
};

MobileWebrtc.prototype.getTimeDiff = function (utcDate)
{

	var localTimestamp = (new Date).getTime() + this.getUTCoffset();
	var incomingTimestamp = Date.parse(utcDate);

	return Math.abs((localTimestamp - incomingTimestamp) / 1000);
};

MobileWebrtc.prototype.timesUp = function (utcDate)
{
	return ((Math.abs((new Date).getTime()+this.getUTCoffset() - utcDate) / 1000) >= this.eventTimeRange);
};


MobileWebrtc.prototype.onDecline = function (params)
{
	this.callCommand(this.callChatId, 'decline', {
		"ACTIVE": (this.callActive) ? "Y" : "N",
		"INITIATOR": (this.initiator) ? "Y" : "N"
	});
	this.resetState();
};

MobileWebrtc.prototype.onAnswer = function (params)
{

	webrtc.UI.show(
		webrtc.UI.state.CONVERSATION
	);
	webrtc.getUserMedia({video: params.video});
	this.waitTimeout = false;
	this.callToGroup = false;
	this.callChatId = params.chatId;
	this.callUserId = params.senderId;
	this.callActive = true;
	this.initiator = false;
	this.ajaxCall(
		"CALL_ANSWER",
		{
			'COMMAND': 'answer',
			'CHAT_ID': this.callChatId,
			'CALL_TO_GROUP': this.callToGroup ? 'Y' : 'N',
			'RECIPIENT_ID': this.callUserId
		}
	);
};

MobileWebrtc.prototype.onCallback = function ()
{
	if (this.callBackUserId > 0)
		this.callInvite(this.callBackUserId);
};

MobileWebrtc.prototype.onClose = function ()
{
	this.callBackUserId = 0;
	this.resetState();
};

MobileWebrtc.prototype.onDisconnect = function ()
{
	this.peerConnectionInited = false;
};

MobileWebrtc.prototype.onIceCandidateDiscovered = function (params)
{
	this.iceCandidatesToSend.push({
		type: 'candidate',
		label: params.candidate.sdpMLineIndex,
		id: params.candidate.sdpMid,
		candidate: params.candidate.candidate
	});

	clearTimeout(this.iceCandidateTimeout);
	this.iceCandidateTimeout = setTimeout(BX.delegate(function ()
	{
		if (this.iceCandidatesToSend.length === 0)
			return false;

		this.onIceCandidate(this.callUserId, {'type': 'candidate', 'candidates': this.iceCandidatesToSend});
		this.iceCandidatesToSend = [];
	}, this), 250);
};

MobileWebrtc.prototype.onPeerConnectionCreated = function ()
{
	this.peerConnectionInited = true;
	if (this.initiator)
	{
		webrtc.createOffer();
	}
	else
	{
		webrtc.createAnswer({
			"sdp": this.remoteSessionDescription
		});
	}
};

MobileWebrtc.prototype.onIceCandidate = function (userID, candidates)
{
	this.callSignaling(userID, candidates);
};

MobileWebrtc.prototype.onIceConnectionStateChanged = function (params)
{
	//TODO to do something
};

MobileWebrtc.prototype.onIceGatheringStateChanged = function (params)
{
	//TODO to do something
};

MobileWebrtc.prototype.onSignalingStateChanged = function (params)
{
	//TODO to do something
};

MobileWebrtc.prototype.onLocalSessionDescriptionCreated = function (params)
{
	this.sessionDescription = params;
	if (this.iceCandidates.length > 0)
	{
		webrtc.addIceCandidates(this.iceCandidates);
		this.iceCandidates = [];
	}

	this.callSignaling(this.callUserId, this.sessionDescription);
};

MobileWebrtc.prototype.onUserMediaSuccess = function (params)
{
	webrtc.UI.showLocalVideo();
	this.connected[this.userId] = true;
	this.callCommand(this.callChatId, "ready");
	if (this.connected[this.callUserId] && this.initiator)
	{
		webrtc.createPeerConnection();
	}
};

MobileWebrtc.prototype.onError = function (errorData)
{
	//TODO handle error
	this.resetState();
};


window.mwebrtc = new MobileWebrtc();

BX.addCustomEvent("onPullEvent-im", BX.proxy(function (command, params)
{

	var isTooLate = this.getTimeDiff(params.SERVER_TIME) >= this.eventTimeRange;

	if (command == 'call')
	{
		if (params.command == 'ready')
		{
			this.connected[this.callUserId] = true;

			if (this.connected[this.userId] && this.initiator == true)
			{
				webrtc.createPeerConnection();
			}
		}
		else if (params.command == 'decline' || params.command == 'end_call')
		{
			if (this.callInit)
			{
				if (this.callChatId == params.chatId)
				{
					if (this.initiator && !this.connected[this.callUserId])
					{
						this.callBackUserId = this.callUserId;
						webrtc.UI.show(
							webrtc.UI.state.FAIL_CALL,
							{
								'message': BX.message("MOBILEAPP_CALL_DECLINE")
							}
						);
					}
					else
					{
						webrtc.UI.close();
					}

					this.resetState()
				}
			}
			else if (this.delayedIncomingCall.chatId == params.chatId)
			{
				this.clearDelayedCallData();
			}

		}
		else if (params.command == 'end_call')
		{
			if ((this.delayedIncomingCall.chatId && this.delayedIncomingCall.chatId == params.chatId))
			{
				if (this.delayedIncomingCall.chatId == params.chatId)
				{
					clearTimeout(this.incomingCallTimeOutId);
					this.incomingCallTimeOutId = false;
					this.delayedIncomingCall = {};
				}
			}
		}
		else if (params.command == 'waitTimeout')
		{
			if (this.callChatId == params.chatId)
			{
				this.resetState();
				this.finishDialog();
			}

		}
		else if (!isTooLate && (params.command == 'invite' || params.command == 'invite_join'))
		{
			if (!this.callInit)
			{
				if (this.incomingCallTimeOutId == false)
				{
					this.delayedIncomingCall = params;
					this.incomingCallTimeOutId = setTimeout(BX.proxy(function ()
					{
						this.showIncomingCall(this.delayedIncomingCall);
						this.delayedIncomingCall = {};
						this.incomingCallTimeOutId = false;
					}, this), this.incomingCallTimeOut * 1000);
				}
			}
			else if (params.command == 'invite')
			{
				if (this.callChatId == params.chatId)
				{
					this.callCommand(params.chatId, 'busy_self');
				}
				else
				{
					this.ajaxCall("CALL_BUSY",{
						'COMMAND': 'busy',
						'CHAT_ID': params.chatId,
						'RECIPIENT_ID': params.senderId,
						'VIDEO': params.video ? 'Y' : 'N'
					});
				}
			}
			else if (this.initiator && this.callChatId == params.chatId && !this.callActive)
			{
				this.onAnswer(params);
			}
		}
		else if (params.command == 'answer' && this.initiator == true)
		{
			if (this.callInit)
			{
				this.initiator = true;
				this.callActive = true;
				webrtc.UI.show(
					webrtc.UI.state.CONVERSATION
				);
				webrtc.getUserMedia({video: params.video});
			}

		}
		else if (params.command == 'decline_self' && this.callChatId == params.chatId || params.command == 'answer_self' && !this.callActive)
		{
			if (this.delayedIncomingCall.chatId == params.chatId)
			{
				this.clearDelayedCallData();
			}

			this.resetState();
			this.finishDialog();
		}
		else if (this.callInit && this.callChatId == params.chatId)
		{
			if (params.command == 'signaling' && this.connected[this.userId])
			{
				if (this.callInit && this.callChatId == params.chatId)
					this.signalingPeerData(params.senderId, params.peer);
			}
			else if (params.command == 'busy')
			{

				if (this.callInit && this.callChatId == params.chatId)
				{
					this.callBackUserId = this.callUserId;
					webrtc.UI.show(
						webrtc.UI.state.FAIL_CALL,
						{
							'message': BX.message("MOBILEAPP_CALL_BUSY")
						}
					);
					this.resetState();
				}
			}
			else if (params.command == 'errorAccess')
			{
				if (this.callInit && this.callChatId == params.chatId)
				{
					this.callBackUserId = this.callUserId;
					webrtc.UI.show(
						webrtc.UI.state.FAIL_CALL,
						{
							'message': BX.message('MOBILEAPP_CALL_NO_ACCESS')
						}
					);
					this.callInit = false;
				}
			}
			else if (params.command == 'reconnect')
			{
				this.initiator = false;
				webrtc.onReconnect();
			}
		}

	}
}, mwebrtc));

