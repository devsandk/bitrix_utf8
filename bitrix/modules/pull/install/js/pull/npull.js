/* NPULL manager JS class */

;(function(window)
{
	if (!window.BX)
	{
		if (typeof(console) == 'object') console.log('PULL notice: bitrix core not loaded');
		return;
	}
	if (window.BX.NPULL)
	{
		if (typeof(console) == 'object') console.log('PULL notice: script is already loaded');
		return;
	}

	var BX = window.BX,
	_updateStateVeryFastCount = 0,
	_updateStateFastCount = 0,
	_updateStateStep = 60,
	_updateStateTimeout = null,
	_updateStateSend = false,
	_pullTryConnect = false,
	_pullPath = null,
	_pullMethod = 'PULL',
	_pullTimeConfig = 0,
	_pullTimeConst = (new Date(2022, 2, 19)).toUTCString(),
	_pullTime = _pullTimeConst,
	_pullTag = 1,
	_pullTimeout = 60,
	_watchTag = {},
	_watchTimeout = null,
	_channelID = null,
	_channelClearReason = 0,
	_channelClear = null,
	_channelLastID = 0,
	_channelStack = {},
	_WS = null,
	_wsPath = '',
	_wsSupport = false,
	_wsConnected = false,
	_wsTryReconnect = 0,
	_mobileMode = false,
	_lsSupport = false,
	_escStatus = false,
	_sendAjaxTry = 0,
	_revision = 8,
	_confirm = null;

	BX.NPULL = function() {};

	BX.NPULL.start = function(params)
	{
		_pullTryConnect = true;

		_mobileMode = false;
		if (typeof(params) == "object" && params.MOBILE == 'Y')
			_mobileMode = true;

		_lsSupport = true;
		if (typeof(params) == "object" && params.LOCAL_STORAGE == 'N')
			_lsSupport = false;

		_wsSupport = true;
		if (typeof(params) == "object" && params.WEBSOCKET == 'N')
			_wsSupport = false;

		BX.bind(window, "offline", function(){
			_pullTryConnect = false;
			if (_WS) _WS.close();
		});

		BX.bind(window, "online", function(){
			if (!BX.NPULL.tryConnect())
				BX.NPULL.updateState('10', true);
		});

		if (BX.browser.IsFirefox())
		{
			BX.bind(window, "keypress", function(event){
				if (event.keyCode == 27)
					_escStatus = true;
			});
		}

		if (_wsSupport && !BX.NPULL.supportWebSocket())
			_wsSupport = false;

		if (typeof(params) == "object" && params.CHANNEL_ID)
		{
			_channelID = params.CHANNEL_ID;
			_pullPath = params.PATH;
			_wsPath = params.PATH_WS;
			_pullMethod = params.METHOD;
			_pullTimeConfig = parseInt(params.CHANNEL_DT)+parseInt(BX.message('SERVER_TZ_OFFSET'))+parseInt(BX.message('USER_TZ_OFFSET'));
			_channelLastID = parseInt(params.LAST_ID);
		}

		if (!BX.browser.SupportLocalStorage())
			_lsSupport = false;

		if (_lsSupport)
		{
			BX.addCustomEvent(window, "onLocalStorageSet", BX.NPULL.storageSet);
			BX.localStorage.set('npset', {'CHANNEL_ID': _channelID, 'LAST_ID': _channelLastID, 'PATH': _pullPath, 'PATH_WS': _wsPath, 'TIME_LAST_GET': _pullTimeConfig, 'METHOD': _pullMethod}, 5);
		}

		BX.bind(window, "beforeunload", BX.proxy(function(){
			_pullTryConnect = false;
			if (_WS) _WS.close();
		}, this));

		BX.addCustomEvent("onImError", function(error) {
			if (error == 'AUTHORIZE_ERROR')
				_sendAjaxTry++;
		});

		if (BX.desktop)
		{
			BX.desktop.addCustomEvent("BXLoginSuccess", function (){
				if (_WS) _WS.close();
			});
		}

		BX.onCustomEvent(window, 'onPullInit', []);

		BX.NPULL.expireConfig();
		BX.NPULL.init();
	}

	BX.NPULL.init = function()
	{
		BX.NPULL.updateState('init');
	}

	BX.NPULL.expireConfig = function()
	{
		if (!_channelID)
			return false;

		clearTimeout(_channelClear);
		_channelClear = setTimeout(BX.NPULL.expireConfig, 60000);

		if (_channelID && _pullMethod!='PULL' && _pullTimeConfig+43200 < Math.round(+(new Date)/1000)+parseInt(BX.message('SERVER_TZ_OFFSET'))+parseInt(BX.message('USER_TZ_OFFSET')))
		{
			_channelClearReason = 1;
			_channelID = null;
			if (_WS) _WS.close();
		}
	}

	BX.NPULL.tryConnect = function()
	{
		if (_pullTryConnect)
			return false;

		_pullTryConnect = true;
		BX.NPULL.init();

		return true;
	}

	BX.NPULL.getChannelID = function(code, withoutCache, send)
	{
		if (!_pullTryConnect)
			return false;

		send = send == false? false: true;
		withoutCache = withoutCache == true? true: false;
		code = typeof(code) == 'undefined'? '0': code;

		BX.ajax({
			url: '/bitrix/components/bitrix/pull.request/najax.php?GET_CHANNEL&V='+_revision+'&CR='+_channelClearReason+'&CODE='+code.toUpperCase()+(_mobileMode? '&MOBILE':''),
			method: 'POST',
			dataType: 'json',
			lsId: 'NPULL_GET_CHANNEL',
			lsTimeout: 1,
			timeout: 30,
			data: {'PULL_GET_CHANNEL' : 'Y', 'SITE_ID': (BX.message.SITE_ID? BX.message('SITE_ID'): ''), 'MOBILE': _mobileMode? 'Y':'N', 'CACHE': withoutCache? 'N': 'Y', 'NPULL_AJAX_CALL' : 'Y', 'sessid': BX.bitrix_sessid()},
			onsuccess: BX.delegate(function(data)
			{
				_channelClearReason = 0;
				if (send && BX.localStorage.get('npgc') === null)
					BX.localStorage.set('npgc', withoutCache, 1);

				if (typeof(data) == 'object' && data.ERROR == '')
				{
					if (data.REVISION && !BX.NPULL.checkRevision(data.REVISION))
						return false;

					if (data.COUNTERS && BXIM && BXIM.network)
					{
						BXIM.network.setCounter('notify', data.COUNTERS.notify);
						BXIM.network.setCounter('message', data.COUNTERS.message);
					}

					var ieVersion = BX.browser.DetectIeVersion();
					if (ieVersion > 0 && ieVersion <= 10)
						return false;

					_channelID = data.CHANNEL_ID;
					_pullPath = data.PATH;
					_wsPath = data.PATH_WS;
					_pullMethod = data.METHOD;
					_pullTimeConfig = parseInt(data.CHANNEL_DT)+parseInt(BX.message('SERVER_TZ_OFFSET'))+parseInt(BX.message('USER_TZ_OFFSET'));
					_channelLastID = _pullMethod=='PULL'? data.LAST_ID: _channelLastID;
					data.TIME_LAST_GET = _pullTimeConfig;
					BX.NPULL.updateState('11');
					BX.NPULL.expireConfig();
					if (_lsSupport)
						BX.localStorage.set('npset', data, 600);
				}
				else
				{
					_sendAjaxTry++;
					_channelClearReason = 2;
					_channelID = null;
					BX.onCustomEvent(window, 'onPullStatus', ['offline']);
					if (typeof(data) == 'object' && data.ERROR == 'SESSION_ERROR')
					{
						BX.message({'bitrix_sessid': data.BITRIX_SESSID});
						clearTimeout(_updateStateTimeout);
						_updateStateTimeout = setTimeout(function(){BX.NPULL.updateState('12', true)}, (_sendAjaxTry < 2? 2000: BX.NPULL.tryConnectTimeout()));
						BX.onCustomEvent(window, 'onPullError', [data.ERROR, data.BITRIX_SESSID]);
					}
					else if (typeof(data) == 'object' && data.ERROR == 'SOCSERV_AUTHORIZE_ERROR')
					{
						_pullTryConnect = false;
						if (_WS) _WS.close();
					}
					else if (typeof(data) == 'object' && data.ERROR == 'AUTHORIZE_ERROR')
					{
						var setNextCheck = true;
						if (_sendAjaxTry >= 2 && BXIM && !BXIM.desktop.ready())
							setNextCheck = false;

						if (setNextCheck)
						{
							clearTimeout(_updateStateTimeout);
							_updateStateTimeout = setTimeout(function(){BX.NPULL.updateState('13', true)}, BX.NPULL.tryConnectTimeout());
						}
						BX.onCustomEvent(window, 'onPullError', [data.ERROR]);
					}
					else
					{
						clearTimeout(_updateStateTimeout);
						_updateStateTimeout = setTimeout(function(){BX.NPULL.updateState('31', true)}, BX.NPULL.tryConnectTimeout());
						BX.onCustomEvent(window, 'onPullError', ['NO_DATA']);
					}
					if (send && typeof(console) == 'object')
					{
						var text = "\n========= PULL ERROR ===========\n"+
									"Error type: getChannel error\n"+
									"Error: "+data.ERROR+"\n"+
									"\n"+
									"Data array: "+JSON.stringify(data)+"\n"+
									"================================\n\n";
						console.log(text);
					}
				}
			}, this),
			onfailure: BX.delegate(function(data)
			{
				_sendAjaxTry++;
				_channelClearReason = 3;
				_channelID = null;
				BX.onCustomEvent(window, 'onPullStatus', ['offline']);
				if (data == "timeout")
				{
					clearTimeout(_updateStateTimeout);
					_updateStateTimeout = setTimeout(function(){
						BX.NPULL.updateState('1')
					}, 10000);
				}
				else
				{
					if (typeof(console) == 'object')
					{
						var text = "\n========= PULL ERROR ===========\n"+
									"Error type: getChannel onfailure\n"+
									"Error: "+data.ERROR+"\n"+
									"\n"+
									"Data array: "+JSON.stringify(data)+"\n"+
									"================================\n\n";
						console.log(text);
					}
					clearTimeout(_updateStateTimeout);
					_updateStateTimeout = setTimeout(function(){BX.NPULL.updateState('14', true)}, BX.NPULL.tryConnectTimeout());
				}
			}, this)
		});
	};

	BX.NPULL.updateState = function(code, force)
	{
		if (!_pullTryConnect || _updateStateSend)
			return false;

		code = typeof(code) == 'undefined'? '': code;
		if (_channelID == null || _pullPath == null || _wsSupport && _wsPath === null)
		{
			clearTimeout(_updateStateTimeout);
			_updateStateTimeout = setTimeout(function(){
				if (code.length>0)
					BX.NPULL.getChannelID(code+(_channelID == null? '-02': '-03'));
				else
					BX.NPULL.getChannelID(_channelID == null? '2': '3');
			}, Math.floor(Math.random() * (151)) + 50)
		}
		else
		{
			if (_wsSupport && _wsPath && _wsPath.length > 1 && _pullMethod != 'PULL')
				BX.NPULL.connectWebSocket();
			else
				BX.NPULL.connectPull(force);
		}
	};

	BX.NPULL.connectWebSocket = function()
	{
		if (!_wsSupport)
			return false;

		_updateStateSend = true;

		var wsPath = _wsPath.replace('#DOMAIN#', location.hostname);
		var _wsServer = wsPath+(_pullTag != null? "&tag="+_pullTag:"")+(_pullTime != null? "&time="+_pullTime:"");
		try
		{
			_WS = new WebSocket(_wsServer);
		}
		catch(e)
		{
			_wsPath = null;
			_updateStateSend = false;
			clearTimeout(_updateStateTimeout);
			_updateStateTimeout = setTimeout(function(){
				BX.NPULL.updateState('33');
			}, BX.NPULL.tryConnectTimeout());
			return false;
		}

		_WS.onopen = function() {
			_wsConnected = true;
			_wsTryReconnect = 0;
			_sendAjaxTry = 0;
			BX.onCustomEvent(window, 'onPullStatus', ['online']);
		};
		_WS.onclose = function(data)
		{
			var code = typeof(data.code) != 'undefined'? data.code: 'NA';
			var neverConnect = false;
			_updateStateSend = false;
			// if user never connected
			if (!_wsConnected)
			{
				neverConnect = true;
				_channelID = null;
				if (_wsTryReconnect == 1)
				{
					BX.NPULL.updateState('ws-'+code+'-1');
				}
				else if (_wsTryReconnect < 3)
				{
					clearTimeout(_updateStateTimeout);
					_updateStateTimeout = setTimeout(function(){
						BX.NPULL.updateState('ws-'+code+'-2');
					}, 10000);
				}
				else
				{
					if (code == 1006 || code == 1008)
					{
						BX.localStorage.set('npbws', true, 86400);
						_wsSupport = false;
					}
					clearTimeout(_updateStateTimeout);
					_updateStateTimeout = setTimeout(function(){
						BX.NPULL.updateState('ws-'+code+'-3');
					}, BX.NPULL.tryConnectTimeout());
				}
			}
			else
			{
				_wsConnected = false;

				// if user press ESC button (FF bug)
				if (data.wasClean && (_escStatus || data.code == 1005))
				{
					BX.NPULL.updateState('ws-'+code+'4');
				}
				else if (!data.wasClean)
				{
					BX.NPULL.updateState('ws-'+code+'5');
				}
			}

			if (typeof(console) == 'object')
			{
				var text = "\n========= PULL INFO ===========\n"+
							"type: websocket close\n"+
							"code: "+data.code+"\n"+
							"clean: "+(data.wasClean?'Y':'N')+"\n"+
							"never connect: "+(neverConnect?'Y':'N')+"\n"+
							"\n"+
							"Data array: "+JSON.stringify(data)+"\n"+
							"================================\n\n";
				console.log(text);
			}
		};
		_WS.onmessage = function(event)
		{
			var messageCount = 0;
			var dataArray = event.data.match(/#!NGINXNMS!#(.*?)#!NGINXNME!#/gm);
			if (dataArray != null)
			{
				for (var i = 0; i < dataArray.length; i++)
				{
					dataArray[i] = dataArray[i].substring(12, dataArray[i].length-12);
					if (dataArray[i].length <= 0)
						continue;

					var message = BX.parseJSON(dataArray[i]);
					var data = null;
					if (message && message.text)
						data = message.text;
					if (data !== null && typeof (data) == "object")
					{
						if (data && data.ERROR == "")
						{
							if (message.id)
							{
								message.id = parseInt(message.id);
								message.channel = message.channel? message.channel: (data.CHANNEL_ID? data.CHANNEL_ID: message.time);
								if (!_channelStack[''+message.channel+message.id])
								{
									_channelStack[''+message.channel+message.id] = message.id;

									if (_channelLastID < message.id)
										_channelLastID = message.id;

									BX.NPULL.executeMessages(data.MESSAGE);
								}
							}
						}
						else
						{
							BX.onCustomEvent(window, 'onPullStatus', ['offline']);
							if (typeof(console) == 'object')
							{
								var text = "\n========= PULL ERROR ===========\n"+
											"Error type: updateState fetch\n"+
											"Error: "+data.ERROR+"\n"+
											"\n"+
											"Connect CHANNEL_ID: "+_channelID+"\n"+
											"Connect WS_PATH: "+_wsPath+"\n"+
											"\n"+
											"Data array: "+JSON.stringify(data)+"\n"+
											"================================\n\n";
								console.log(text);
							}
							_channelClearReason = 4;
							_channelID = null;
						}
					}
					if (message.tag)
						_pullTag = message.tag;
					if (message.time)
						_pullTime = message.time;
					messageCount++;
				}
			}
			if (_channelID == null)
			{
				if (_WS) _WS.close();
			}
		};
		_WS.onerror = function() {
			_wsTryReconnect++;
		};
	}

	BX.NPULL.connectPull = function(force)
	{
		force = force == true? true: false;
		clearTimeout(_updateStateTimeout);
		_updateStateTimeout = setTimeout(function(){
			if (!_pullPath || typeof(_pullPath) != "string" || _pullPath.length <= 32)
			{
				_pullPath = null;

				clearTimeout(_updateStateTimeout);
				_updateStateTimeout = setTimeout(function(){
					BX.NPULL.updateState('17');
				}, 10000);

				return false;
			}

			BX.onCustomEvent(window, 'onPullStatus', ['online']);
			_updateStateSend = true;


			var pullPath = _pullPath.replace('#DOMAIN#', location.hostname);
			var _ajax = BX.ajax({
				url: _pullMethod=='PULL'? pullPath: (pullPath+(_pullTag != null? "&tag="+_pullTag:"")+"&rnd="+(+new Date)),
				skipAuthCheck: _pullMethod=='PULL'? false: true,
				skipBxHeader: _pullMethod=='PULL'? false: true,
				method: _pullMethod=='PULL'?'POST':'GET',
				dataType: _pullMethod=='PULL'?'json':'html',
				timeout: _pullTimeout,
				headers: [
					{'name':'If-Modified-Since', 'value':_pullTime},
					{'name':'If-None-Match', 'value':'0'}
				],
				data: _pullMethod=='PULL'? {'PULL_UPDATE_STATE' : 'Y', 'CHANNEL_ID': _channelID, 'CHANNEL_LAST_ID': _channelLastID, 'SITE_ID': (BX.message.SITE_ID? BX.message('SITE_ID'): ''), 'NPULL_AJAX_CALL' : 'Y', 'sessid': BX.bitrix_sessid()}: {},
				onsuccess: function(data)
				{
					_updateStateSend = false;
					if (_WS) _WS.close();

					if (_pullMethod=='PULL' && typeof(data) == "object")
					{
						if (data.ERROR == "")
						{
							_sendAjaxTry = 0;
							BX.NPULL.executeMessages(data.MESSAGE);
							if (_lsSupport)
								BX.localStorage.set('npus', {'TAG':null, 'TIME':null, 'MESSAGE':data.MESSAGE}, 5);
						}
						else
						{
							BX.onCustomEvent(window, 'onPullStatus', ['offline']);
							if (data.ERROR == 'SESSION_ERROR')
							{
								BX.message({'bitrix_sessid': data.BITRIX_SESSID});
								BX.onCustomEvent(window, 'onPullError', [data.ERROR, data.BITRIX_SESSID]);
							}
							else
							{
								BX.onCustomEvent(window, 'onPullError', [data.ERROR]);
							}
							if (typeof(console) == 'object')
							{
								var text = "\n========= PULL ERROR ===========\n"+
											"Error type: updateState error\n"+
											"Error: "+data.ERROR+"\n"+
											"\n"+
											"Connect CHANNEL_ID: "+_channelID+"\n"+
											"Connect PULL_PATH: "+_pullPath+"\n"+
											"\n"+
											"Data array: "+JSON.stringify(data)+"\n"+
											"================================\n\n";
								console.log(text);
							}
							_channelClearReason = 5;
							_channelID = null;
						}
						if (_channelID != null && _lsSupport)
							BX.localStorage.set('npset', {'CHANNEL_ID': _channelID, 'LAST_ID': _channelLastID, 'PATH': _pullPath, 'PATH_WS': _wsPath, 'TAG': _pullTag, 'TIME': _pullTime, 'TIME_LAST_GET': _pullTimeConfig, 'METHOD': _pullMethod}, 600);

						BX.NPULL.setUpdateStateStep();
					}
					else
					{
						if (data.length > 0)
						{
							var messageCount = 0;
							_sendAjaxTry = 0;

							var dataArray = data.match(/#!NGINXNMS!#(.*?)#!NGINXNME!#/gm);
							if (dataArray != null)
							{
								for (var i = 0; i < dataArray.length; i++)
								{
									dataArray[i] = dataArray[i].substring(12, dataArray[i].length-12);
									if (dataArray[i].length <= 0)
										continue;

									var message = BX.parseJSON(dataArray[i]);
									var data = null;
									if (message && message.text)
										data = message.text;
									if (data !== null && typeof (data) == "object")
									{
										if (data && data.ERROR == "")
										{
											if (message.id)
											{
												message.id = parseInt(message.id);
												message.channel = message.channel? message.channel: (data.CHANNEL_ID? data.CHANNEL_ID: message.time);
												if (!_channelStack[''+message.channel+message.id])
												{
													_channelStack[''+message.channel+message.id] = message.id;

													if (_channelLastID < message.id)
														_channelLastID = message.id;

													BX.NPULL.executeMessages(data.MESSAGE);
												}
											}
										}
										else
										{
											if (typeof(console) == 'object')
											{
												var text = "\n========= PULL ERROR ===========\n"+
															"Error type: updateState fetch\n"+
															"Error: "+data.ERROR+"\n"+
															"\n"+
															"Connect CHANNEL_ID: "+_channelID+"\n"+
															"Connect PULL_PATH: "+_pullPath+"\n"+
															"\n"+
															"Data array: "+JSON.stringify(data)+"\n"+
															"================================\n\n";
												console.log(text);
											}
											_channelClearReason = 6;
											_channelID = null;
											BX.onCustomEvent(window, 'onPullStatus', ['offline']);
										}
									}
									else
									{
										if (typeof(console) == 'object')
										{
											var text = "\n========= PULL ERROR ===========\n"+
														"Error type: updateState parse\n"+
														"\n"+
														"Connect CHANNEL_ID: "+_channelID+"\n"+
														"Connect PULL_PATH: "+_pullPath+"\n"+
														"\n"+
														"Data string: "+dataArray[i]+"\n"+
														"================================\n\n";
											console.log(text);
										}
										_channelClearReason = 7;
										_channelID = null;
										BX.onCustomEvent(window, 'onPullStatus', ['offline']);
									}
									if (message.tag)
										_pullTag = message.tag;
									if (message.time)
										_pullTime = message.time;
									messageCount++;
								}
							}
							else
							{
								if (typeof(console) == 'object')
								{
									var text = "\n========= PULL ERROR ===========\n"+
												"Error type: updateState error getting message\n"+
												"\n"+
												"Connect CHANNEL_ID: "+_channelID+"\n"+
												"Connect PULL_PATH: "+_pullPath+"\n"+
												"\n"+
												"Data string: "+data+"\n"+
												"================================\n\n";
									console.log(text);
								}
								_channelClearReason = 8;
								_channelID = null;
								BX.onCustomEvent(window, 'onPullStatus', ['offline']);
							}
							if (messageCount > 0 || _ajax && _ajax.status == 0)
							{
								BX.NPULL.updateState(messageCount > 0? '19': '20');
							}
							else
							{
								_channelClearReason = 9;
								_channelID = null;
								clearTimeout(_updateStateTimeout);
								_updateStateTimeout = setTimeout(function(){BX.NPULL.updateState('21')}, 10000);
							}
						}
						else
						{
							if (_ajax && (_ajax.status == 304 || _ajax.status == 0))
							{
								if (_ajax.status == 0)
								{
									if (_escStatus)
									{
										_escStatus = false;
										BX.NPULL.updateState('22-3');
									}
									else
									{
										_updateStateTimeout = setTimeout(function(){
											BX.NPULL.updateState('22-2');
										}, 30000);
									}
								}
								else
								{
									BX.NPULL.updateState('22-1');
								}
							}
							else if (_ajax && (_ajax.status == 502 || _ajax.status == 500))
							{
								BX.onCustomEvent(window, 'onPullStatus', ['offline']);
								_sendAjaxTry++;
								_channelClearReason = 10;
								_channelID = null;
								clearTimeout(_updateStateTimeout);
								_updateStateTimeout = setTimeout(function(){
									BX.NPULL.updateState('23');
								}, BX.NPULL.tryConnectTimeout());
							}
							else
							{
								BX.onCustomEvent(window, 'onPullStatus', ['offline']);

								_sendAjaxTry++;
								_channelClearReason = 11;
								_channelID = null;
								var timeout = BX.NPULL.tryConnectTimeout();
								var code = (_ajax && typeof(_ajax.status) != 'undefined'? _ajax.status: 'NaN');
								clearTimeout(_updateStateTimeout);
								_updateStateTimeout = setTimeout(function(){
									BX.NPULL.updateState('24-'+code+'-'+(timeout/1000));
								}, timeout);
							}
						}
					}
				},
				onfailure: function(data)
				{
					BX.onCustomEvent(window, 'onPullStatus', ['offline']);
					_updateStateSend = false;
					_sendAjaxTry++;
					if (_WS) _WS.close();
					if (data == "timeout")
					{
						if (_pullMethod=='PULL')
							BX.NPULL.setUpdateStateStep();
						else
							BX.NPULL.updateState('25');
					}
					else if (_ajax && (_ajax.status == 403 || _ajax.status == 404 || _ajax.status == 400))
					{
						_channelClearReason = 12;
						_channelID = null;
						clearTimeout(_updateStateTimeout);
						_updateStateTimeout = setTimeout(function(){
							BX.NPULL.getChannelID('7-'+_ajax.status, _ajax.status == 403? true: false)
						}, (_sendAjaxTry < 2? 50: BX.NPULL.tryConnectTimeout()));
					}
					else if (_ajax && (_ajax.status == 500 || _ajax.status == 502))
					{
						_channelClearReason = 13;
						_channelID = null;
						clearTimeout(_updateStateTimeout);
						_updateStateTimeout = setTimeout(function(){
							BX.NPULL.getChannelID('8-'+_ajax.status)
						}, (_sendAjaxTry < 2? 50: BX.NPULL.tryConnectTimeout()));
					}
					else
					{
						if (typeof(console) == 'object')
						{
							var text = "\n========= PULL ERROR ===========\n"+
										"Error type: updateState onfailure\n"+
										"\n"+
										"Connect CHANNEL_ID: "+_channelID+"\n"+
										"Connect PULL_PATH: "+_pullPath+"\n"+
										"\n"+
										"Data array: "+JSON.stringify(data)+"\n"+
										"================================\n\n";
							console.log(text);
						}
						clearTimeout(_updateStateTimeout);
						if (_pullMethod=='PULL')
							_updateStateTimeout = setTimeout(BX.NPULL.setUpdateStateStep, 10000);
						else
							_updateStateTimeout = setTimeout(function(){BX.NPULL.updateState('26');}, 10000);
					}
				}
			});
		}, force? 150: (_pullMethod == 'PULL'? _updateStateStep: 0.3)*1000);
	}

	BX.NPULL.executeMessages = function(message, pull)
	{
		pull = pull == false? false: true;
		for (var i = 0; i < message.length; i++)
		{
			message[i].module_id = message[i].module_id.toLowerCase();

			if (message[i].id)
			{
				message[i].id = parseInt(message[i].id);
				if (_channelStack[''+_channelID+message[i].id])
					continue;
				else
					_channelStack[''+_channelID+message[i].id] = message[i].id;

				if (_channelLastID < message[i].id)
					_channelLastID = message[i].id;
			}
			if (message[i].module_id == 'pull')
			{
				if (pull)
				{
					if (message[i].command == 'channel_die' || message[i].command == 'config_die')
					{
						_channelClearReason = 14;
						_channelID = null;
						_pullPath = null;
						if (_wsPath) _wsPath = null;
						if (_WS) _WS.close();
					}
				}
			}
			else
			{
				if (!(message[i].module_id == 'main' && message[i].command == 'user_counter'))
					BX.NPULL.setUpdateStateStepCount(1,4);

				try
				{
					if (message[i].module_id == 'main' && (message[i].command == 'user_authorize' || message[i].command == 'user_logout' || message[i].command == 'online_list'))
					{
						BX.onCustomEvent(window, 'onPullOnlineEvent', [message[i].command, message[i].params], true);
					}
					else
					{
						BX.onCustomEvent(window, 'onPullEvent-'+message[i].module_id, [message[i].command, message[i].params], true);
						BX.onCustomEvent(window, 'onPullEvent', [message[i].module_id, message[i].command, message[i].params], true);
					}
				}
				catch(e)
				{
					if (typeof(console) == 'object')
					{
						var text = "\n========= PULL ERROR ===========\n"+
									"Error type: onPullEvent onfailure\n"+
									"Error event: "+JSON.stringify(e)+"\n"+
									"\n"+
									"Message MODULE_ID: "+message[i].module_id+"\n"+
									"Message COMMAND: "+message[i].command+"\n"+
									"Message PARAMS: "+message[i].params+"\n"+
									"\n"+
									"Message array: "+JSON.stringify(message[i])+"\n"+
									"================================\n";
						console.log(text);
						BX.debug(e);
					}
				}
			}
		}
	}

	BX.NPULL.setUpdateStateStep = function(send)
	{
		var send = send == false? false: true;
		var step = 60;

		if (_updateStateVeryFastCount > 0)
		{
			step = 10;
			_updateStateVeryFastCount--;
		}
		else if (_updateStateFastCount > 0)
		{
			step = 20;
			_updateStateFastCount--;
		}

		_updateStateStep = parseInt(step);

		BX.NPULL.updateState('27');

		if (send && _lsSupport)
			BX.localStorage.set('npuss', _updateStateStep, 5);
	}

	BX.NPULL.setUpdateStateStepCount = function(veryFastCount, fastCount)
	{
		_updateStateVeryFastCount = parseInt(veryFastCount);
		_updateStateFastCount = parseInt(fastCount);
	}

	BX.NPULL.storageSet = function(params)
	{
		if (params.key == 'npus')
		{
			if (params.value.TAG != null)
				_pullTag = params.value.TAG;

			if (params.value.TIME != null)
				_pullTime = params.value.TIME;

			BX.NPULL.executeMessages(params.value.MESSAGE, false);
		}
		else if (params.key == 'npgc')
		{
			BX.NPULL.getChannelID('9', params.value, false);
		}
		else if (params.key == 'npuss')
		{
			_updateStateStep = 70;
			BX.NPULL.updateState('28');
		}
		else if (params.key == 'npset')
		{
			_channelID = params.value.CHANNEL_ID;
			_channelLastID = params.value.LAST_ID;
			_pullPath = params.value.PATH;
			_wsPath = params.value.PATH_WS;
			_pullMethod = params.value.METHOD;
			if (params.value.TIME)
				_pullTime = params.value.TIME;
			if (params.value.TAG)
				_pullTag = params.value.TAG;
			if (params.value.TIME_LAST_GET)
				_pullTimeConfig = params.value.TIME_LAST_GET;

			if (_channelID != null)
			{
				if (!BX.NPULL.tryConnect())
					BX.NPULL.updateState('29', true);
			}
		}
	}

	BX.NPULL.updateChannelID = function(params)
	{
		if (typeof(params) != 'object')
			return false;

		var method = params.METHOD;
		var channelID = params.CHANNEL_ID;
		var channelDie = params.CHANNEL_DT;
		var pullPath = params.PATH;
		var lastId = params.LAST_ID;
		var wsPath = params.PATH_WS;

		if (typeof(channelID) == 'undefined' || typeof(pullPath) == 'undefined')
			return false;

		if (channelID == _channelID && pullPath == _pullPath && wsPath == _wsPath)
			return false;

		_channelID = channelID;
		_pullTimeConfig = parseInt(channelDie)+parseInt(BX.message('SERVER_TZ_OFFSET'))+parseInt(BX.message('USER_TZ_OFFSET'));
		_pullPath = pullPath;
		_wsPath = wsPath;
		_channelLastID = _pullMethod=='PULL' && typeof(lastId) == 'number'? lastId: _channelLastID;
		if (typeof(method) == 'string')
			_pullMethod = method;

		if (_lsSupport)
			BX.localStorage.set('npset', {'CHANNEL_ID': _channelID, 'LAST_ID': _channelLastID, 'PATH': _pullPath, 'PATH_WS': _wsPath, 'TAG': _pullTag, 'TIME': _pullTime, 'TIME_LAST_GET': _pullTimeConfig, 'METHOD': _pullMethod}, 600);

		if (_WS) _WS.close();

		return true;
	}

	BX.NPULL.tryConnectTimeout = function()
	{
		var timeout = 0;
		if (_sendAjaxTry <= 2)
			timeout = 15000;
		else if (_sendAjaxTry > 2 && _sendAjaxTry <= 5)
			timeout = 45000;
		else if (_sendAjaxTry > 5 && _sendAjaxTry <= 10)
			timeout = 600000;
		else if (_sendAjaxTry > 10)
		{
			_pullTryConnect = false;
			timeout = 3600000;
		}

		return timeout;
	}

	/* DEBUG commands */
	BX.NPULL.tryConnectSet = function(sendAjaxTry, pullTryConnect)
	{
		if (typeof(sendAjaxTry) == 'number')
			_sendAjaxTry = parseInt(sendAjaxTry);

		if (typeof(pullTryConnect) == 'boolean')
			_pullTryConnect = pullTryConnect;
	}

	BX.NPULL.getPullServerStatus = function()
	{
		return _pullMethod == 'PULL'? false: true;
	}

	BX.NPULL.capturePullEvent = function()
	{
		BX.addCustomEvent("onPullEvent", function(module_id,command,params) { console.log(module_id,command,params); });
		return 'Capture "Pull Event" started.';
	}
	BX.NPULL.getDebugInfo = function()
	{
		if (!console || !console.log || !JSON || !JSON.stringify)
			return false;

		var textWT = JSON.stringify(_watchTag);
		var text = "\n========= PULL DEBUG ===========\n"+
					"Connect: "+(_updateStateSend? 'Y': 'N')+"\n"+
					"WebSocket connect: "+(_wsConnected? 'Y': 'N')+"\n"+
					"LocalStorage status: "+(_lsSupport? 'Y': 'N')+"\n"+
					"WebSocket support: "+(_wsSupport && _wsPath.length > 0? 'Y': 'N')+"\n"+
					"Queue Server: "+(_pullMethod == 'PULL'? 'N': 'Y')+"\n"+
					"Try connect: "+(_pullTryConnect? 'Y': 'N')+"\n"+
					"Try number: "+(_sendAjaxTry)+"\n"+
					"\n"+
					"Path: "+_pullPath+"\n"+
					(_wsPath.length > 0? "WebSocket Path: "+_wsPath+"\n": '')+
					"ChannelID: "+_channelID+"\n"+
					"ChannelDie: "+(parseInt(_pullTimeConfig))+"\n"+
					"\n"+
					"Last message: "+(_channelLastID > 0? _channelLastID: '-')+"\n"+
					"Time init connect: "+(_pullTimeConst)+"\n"+
					"Time last connect: "+(_pullTime == _pullTimeConst? '-': _pullTime)+"\n"+
					"Watch tags: "+(textWT == '{}'? '-': textWT)+"\n"+
					"================================\n";

		return console.log(text);
	}

	BX.NPULL.clearChannelId = function(send)
	{
		send = send == false? false: true;

		_channelClearReason = 15;
		_channelID = null;
		_pullPath = null;

		if (_wsPath) _wsPath = null;
		if (_WS) _WS.close();

		_updateStateSend = false;
		clearTimeout(_updateStateTimeout);

		if (send)
			BX.NPULL.updateState('30');
	}

	BX.NPULL.supportWebSocket = function()
	{
		var result = false;
		if (typeof(WebSocket) == 'function' && !BX.localStorage.get('npbws'))
		{
			if (BX.browser.IsFirefox() || BX.browser.IsChrome() || BX.browser.IsOpera() || BX.browser.IsSafari())
			{
				if (BX.browser.IsFirefox() && navigator.userAgent.substr(navigator.userAgent.indexOf('Firefox/')+8, 2) >= 25)
					result = true;
				else if (BX.browser.IsChrome() && navigator.appVersion.substr(navigator.appVersion.indexOf('Chrome/')+7, 2) >= 28)
					result = true;
				else if (!BX.browser.IsChrome() && BX.browser.IsSafari() && navigator.appVersion.substr(navigator.appVersion.indexOf('Version/')+8, 1) >= 6)
					result = true;
			}
			else if (BX.browser.DetectIeVersion() >= 10)
			{
				result = true;
			}

		}
		return result;
	}

	BX.NPULL.getRevision = function()
	{
		return _revision;
	}

	BX.NPULL.checkRevision = function(revision)
	{
		revision = parseInt(revision);
		if (typeof(revision) == "number" && _revision < revision)
		{
			if (BXIM && BXIM.desktop.run())
			{
				console.log('NOTICE: Window reload, becouse PULL REVISION UP ('+this.revision+' -> '+revision+')');
				location.reload();
			}
			else
			{
				BX.NPULL.openConfirm(BX.message('PULL_OLD_REVISION'));
				_pullTryConnect = false;
				if (_WS) _WS.close();
			}
			return false;
		}
		return true;
	};

	BX.NPULL.returnPrivateVar = function(v)
	{
		return eval(v);
	}

	BX.NPULL.openConfirm = function(text, buttons, modal)
	{
		if (_confirm != null)
			_confirm.destroy();

		modal = modal !== false;
		if (typeof(buttons) == "undefined" || typeof(buttons) == "object" && buttons.length <= 0)
		{
			buttons = [new BX.PopupWindowButton({
				text : BX.message('IM_NOTIFY_CONFIRM_CLOSE'),
				className : "popup-window-button-decline",
				events : { click : function(e) { this.popupWindow.close(); BX.PreventDefault(e) } }
			})];
		}
		_confirm = new BX.PopupWindow('bx-notifier-popup-confirm', null, {
			zIndex: 200,
			autoHide: buttons === false,
			buttons : buttons,
			closeByEsc: buttons === false,
			overlay : modal,
			events : { onPopupClose : function() { this.destroy() }, onPopupDestroy : BX.delegate(function() { _confirm = null }, this)},
			content : BX.create("div", { props : { className : (buttons === false? " bx-messenger-confirm-without-buttons": "bx-messenger-confirm") }, html: text})
		});
		_confirm.show();
		BX.bind(_confirm.popupContainer, "click", BX.IM.preventDefault);
		BX.bind(_confirm.contentContainer, "click", BX.PreventDefault);
		BX.bind(_confirm.overlay.element, "click", BX.PreventDefault);
	};
	BX.NPULL();
})(window);