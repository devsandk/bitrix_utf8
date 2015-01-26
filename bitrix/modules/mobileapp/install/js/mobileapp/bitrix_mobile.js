;
(function ()
{

	if (window.app) return;
	/*
	 * Event list:
	 * onOpenPageAfter
	 * onOpenPageBefore
	 * onHidePageAfter
	 * onHidePageBefore
	 * UIApplicationDidBecomeActiveNotification
	 * onInternetStatusChange
	 * onOpenPush
	 * onKeyboardWillShow
	 * onKeyboardWillHide
	 * onKeyboardDidHide
	 * onKeyboardDidShow
	 */

	/**
	 * Class for Web SQL Database
	 * @param params
	 * @constructor
	 */
	MobileDatabase = function ()
	{
		this.tableList = [];
		this.db = window.openDatabase("Database", "1.0", "Bitrix Base", 20 * 1024 * 1024);
	};

	MobileDatabase.prototype.init = function ()
	{
		ReadyDevice(BX.proxy(function ()
		{
			this.db = window.openDatabase("Database", "1.0", "Bitrix Base", 200000);
		}, this))
	};

	MobileDatabase.prototype.isTableExists = function (tableName, callback)
	{
		var that = this;
		var tableListCallback = function ()
		{
			var length = that.tableList.length;
			for (var i = 0; i < length; i++)
			{
				if (that.tableList[i].toUpperCase() == tableName.toUpperCase())
				{
					callback(true);
					return;
				}
			}

			callback(false);
		};

		if (this.tableList.length <= 0)
			this.getTableList(tableListCallback);
		else
			tableListCallback();

	};

	/**
	 * Takes the list of existing tables from the database
	 * @param callback The callback handler will be invoked with boolean parameter as a first argument
	 * @example
	 */
	MobileDatabase.prototype.getTableList = function (callback)
	{
		var that = this;
		var callbackFunc = callback;
		this.query(
			{
				query: "SELECT tbl_name from sqlite_master WHERE type = 'table'",
				values: {}
			},
			function (res)
			{
				if (res.count > 0)
				{
					for (var i = 0; i < res.items.length; i++)
						that.tableList[that.tableList.length] = res.items[i].tbl_name;
				}

				if (callbackFunc != null && typeof (callbackFunc) == "function")
					callbackFunc(that.tableList)
			}
		);
	};

	/**
	 * Creates the table in the database
	 * @param params
	 */
	MobileDatabase.prototype.createTable = function (params)
	{
		params.action = "create";
		var str = this.getQuery(params);
		this.query(str, params.success, params.fail);
	};

	/**
	 * Drops the table from the database
	 * @param params
	 */
	MobileDatabase.prototype.dropTable = function (params)
	{
		params.action = "drop";
		var str = this.getQuery(params);
		this.query(str, params.success, params);
	};

	/**
	 * Drops the table from the database
	 * @param params
	 */
	MobileDatabase.prototype.addRow = function (params)
	{
		params.action = "insert";
		this.query(
			this.getQuery(params),
			params.success,
			params.fail
		);
	};

	/**
	 * Gets the data from the table
	 * @param params
	 */
	MobileDatabase.prototype.getRows = function (params)
	{
		params.action = "select";
		this.query(
			this.getQuery(params),
			params.success,
			params.fail
		);
	};

	/**
	 * Updates the table
	 * @param params
	 */
	MobileDatabase.prototype.updateRows = function (params)
	{
		params.action = "update";
		var queryData = this.getQuery(params);
		this.query(queryData, params.success, params);
	};

	/**
	 * Deletes rows from the table
	 * @param params
	 */
	MobileDatabase.prototype.deleteRows = function (params)
	{
		params.action = "delete";
		var str = this.getQuery(params);
		this.query(str, params.success, params);
	};

	/**
	 * Builds the query string and the set of values.
	 * @param params
	 * @returns {{query: string, values: Array}}
	 */
	MobileDatabase.prototype.getQuery = function (params)
	{
		var values = [];
		var where = params.filter;
		var select = params.fields;
		var insert = params.insertFields;
		var set = params.updateFields;
		var tableName = params.tableName;
		var strQuery = "";

		switch (params.action)
		{
			case "delete":
			{
				strQuery = "DELETE FROM " + tableName.toUpperCase() + " " + this.getFilter(where);
				values = this.getValues([where]);
				break;
			}

			case "update":
			{
				strQuery = "UPDATE " + tableName.toUpperCase() + " " + this.getFieldPair(set, "SET ") + " " + this.getFilter(where);
				values = this.getValues([set, where]);
				break;
			}

			case "create":
			{
				var fieldsString = "";
				if (typeof(select) == "object")
				{
					var field = "";
					for (var j = 0; j < select.length; j++)
					{
						field = "";
						if (typeof(select[j]) == "object")
						{
							if (select[j].name)
							{

								field = select[j].name;
								if (select[j].unique && select[j].unique == true)
									field += " unique";
							}

						}
						else if (typeof(select[j]) == "string" && select[j].length > 0)
							field = select[j];

						if (field.length > 0)
						{

							if (fieldsString.length > 0)
								fieldsString += "," + field.toUpperCase();
							else
								fieldsString = field.toUpperCase();
						}
					}
				}

				strQuery = "CREATE TABLE IF NOT EXISTS " + tableName.toUpperCase() + " (" + fieldsString + ") ";
				break;
			}

			case "drop":
			{
				strQuery = "DROP TABLE IF EXISTS " + tableName.toUpperCase();
				break;
			}

			case "select":
			{
				strQuery = "SELECT " + this.getValueArrayString(select, "*") + " FROM " + tableName.toUpperCase() + " " + this.getFilter(where);
				values = this.getValues([where]);
				break;
			}

			case "insert":
			{
				values = this.getValues([insert]);
				strQuery = "INSERT INTO " + tableName.toUpperCase() + " (" + this.getKeyString(insert) + ") VALUES(%values%)";
				var valueTemplate = "";
				for (var i = 0; i < values.length; i++)
				{
					if (valueTemplate.length > 0)
						valueTemplate += ",?";
					else
						valueTemplate = "?"
				}

				strQuery = strQuery.replace("%values%", valueTemplate);

				break;
			}
		}

		return {
			query: strQuery,
			values: values
		}
	};


	/**
	 * Gets pairs for query string
	 * @param {object} fields The object with set of key-value pairs
	 * @param {string} operator The keyword that will be join on the beginning of the string
	 * @returns {string}
	 */
	MobileDatabase.prototype.getFieldPair = function (fields, operator)
	{
		var pairsRow = "";
		var keyWord = operator || "";

		if (typeof(fields) == "object")
		{
			var i = 0;
			for (var key in fields)
			{
				var pair = ((i > 0) ? ", " : "") + (key.toUpperCase() + "=" + "?");
				if (pairsRow.length == 0 && keyWord.length > 0)
					pairsRow = keyWord;
				pairsRow += pair;
				i++;
			}
		}

		return pairsRow;
	};

	MobileDatabase.prototype.getFilter = function (fields)
	{
		var pairsRow = "";
		var keyWord = "WHERE ";

		if (typeof(fields) == "object")
		{
			var i = 0;
			for (var key in fields)
			{
				var pair = "";
				var count = 1;
				if (typeof(fields[key]) == "object")
					count = fields[key].length;
				for (var j = 0; j < count; j++)
				{
					pair = ((j > 0) ? pair + " OR " : "(") + (key.toUpperCase() + "=" + "?");
					if ((j + 1) == count)
						pair += ")"
				}
				;

				pairsRow += pair;
				i++;
			}
		}
		return "WHERE " + pairsRow;
	};

	/**
	 * Gets the string with keys of fields that have splitted by commas
	 * @param fields
	 * @param defaultResult
	 * @returns {string}
	 */
	MobileDatabase.prototype.getKeyString = function (fields, defaultResult)
	{
		var result = "";
		if (!defaultResult)
			defaultResult = "";
		if (typeof(fields) == "array")
		{
			for (var i = 0; i < valuesItem.length; i++)
			{

				if (result.length > 0)
					result += "," + valuesItem[i].toUpperCase();
				else
					result = valuesItem[i].toUpperCase();
			}
		}
		else if (typeof(fields) == "object")
		{
			for (var key in fields)
			{
				if (result.length > 0)
					result += "," + key.toUpperCase();
				else
					result = key.toUpperCase();
			}
		}

		if (result.length == 0)
			result = defaultResult;

		return result;
	};

	/**
	 * Gets the string with values of the array that have splitted by commas
	 * @param fields
	 * @param defaultResult
	 * @returns {string}
	 */
	MobileDatabase.prototype.getValueArrayString = function (fields, defaultResult)
	{
		var result = "";
		if (!defaultResult)
			defaultResult = "";
		if (typeof(fields) == "object")
		{
			for (var i = 0; i < fields.length; i++)
			{

				if (result.length > 0)
					result += "," + fields[i].toUpperCase();
				else
					result = fields[i].toUpperCase();
			}
		}


		if (result.length == 0)
			result = defaultResult;

		return result;
	};

	/**
	 * Gets the array of values
	 * @param values
	 * @returns {Array}
	 */
	MobileDatabase.prototype.getValues = function (values)
	{
		var resultValues = [];
		for (var j = 0; j < values.length; j++)
		{
			var valuesItem = values[j];

			if (typeof(valuesItem) == "object")
			{
				for (var keyField in valuesItem)
				{
					if (typeof(valuesItem[keyField]) != "object")
						resultValues[resultValues.length] = valuesItem[keyField];
					else
						for (var i = 0; i < valuesItem[keyField].length; i++)
						{
							resultValues[resultValues.length] = valuesItem[keyField][i];
						}
				}
			}
			else if (typeof(valuesItem) == "array")
			{
				for (var i = 0; i < valuesItem.length; i++)
				{
					if (typeof(valuesItem[i]) != "object")
						resultValues[resultValues.length] = valuesItem[i];
				}
			}
		}


		return resultValues;
	};

	/**
	 * Executes the query
	 * @param success The success callback
	 * @param fail The failture callback
	 * @returns {string}
	 * @param query
	 */
	MobileDatabase.prototype.query = function (query, success, fail)
	{
		this.db.transaction(
			function (tx)
			{
				tx.executeSql(
					query.query,
					query.values,
					function (tx, results)
					{

						var result = {
							originalResult: results
						};

						var len = results.rows.length;
						if (len >= 0)
						{
							result.count = len;
							result.items = [];
							for (var i = 0; i < len; i++)
							{
								result.items[result.items.length] = results.rows.item(i);
							}
						}

						if (success != null)
							success(result, tx);
					},
					function (tx, res)
					{
						if (fail != null)
							fail(res, tx);
					}
				);
			}
		);
	};

	/**
	 * Gets the beautifying result from the query response
	 * @param results
	 * @returns {*}
	 */

	MobileDatabase.prototype.getResponseObject = function (results)
	{

		var len = results.rows.length;

		var result = [];
		for (var i = 0; i < len; i++)
		{
			result[result.length] = results.rows.item(i);
		}

		return result;
	};

	/**
	 * Base of Cordova Plugin
	 * @param name
	 * @constructor
	 */
	var BXCordovaPlugin = function (name)
	{
		this.pluginName = name;
		this.callbackIndex = 0;
		this.callbacks = {};
		this.callbackIndex = 0;
		this.dataBrigePath = "/mobile/";
		this.available = false;
		this.platform = null;
		this.db = null;
		this.isDatabaseSupported = true;
		if (window.openDatabase)
			this.db = new MobileDatabase();
		else
			this.isDatabaseSupported = false;
		var _that = this;
		document.addEventListener("deviceready", function ()
		{
			_that.available = true;
		}, false);
	};

	BXCordovaPlugin.prototype.RegisterCallBack = function (func)
	{

		if ((typeof func) === "function")
		{
			this.callbackIndex++;
			this.callbacks[this.callbackIndex] = func;
			return this.callbackIndex;

		}

		return false;
	};

	BXCordovaPlugin.prototype.CallBackExecute = function (index, result)
	{
		//execute callback by register index
		if (this.callbacks[index] && (typeof this.callbacks[index]) === "function")
		{
			this.callbacks[index](result);
		}
	};

	BXCordovaPlugin.prototype.prepareParams = function (params)
	{
		//prepare params
		if (typeof(params) == "object")
		{
			for (var key in params)
			{
				if (typeof(params[key]) == "object")
					params[key] = this.prepareParams(params[key]);
				if (typeof(params[key]) == "function")
					params[key] = this.RegisterCallBack(params[key]);
				else if (params[key] === true)
					params[key] = "YES";
				else if (params[key] === false)
					params[key] = "NO";
			}
		}
		else
		{
			if (typeof(params) == "function")
				params = this.RegisterCallBack(params);
			else if (params === true)
				params = "YES";
			else if (params === false)
				params = "NO";
		}

		return params;
	};

	BXCordovaPlugin.prototype.exec = function (funcName, params)
	{
		if (!this.available)
		{
			document.addEventListener("deviceready", BX.proxy(function ()
			{
				this.exec(funcName, params);
			}, this), false);
			return false;
		}


		if (typeof(params) != "undefined")
		{
			params = this.prepareParams(params);

			if (typeof(params) == "object")
				params = JSON.stringify(params);
		}
		else
		{
			params = "{}";
		}

		if (device.platform.toUpperCase() == "ANDROID" || device.cordova > '2.0.0')
		{
			return Cordova.exec(null, null, this.pluginName, funcName, [params]);
		}
		else
		{
			return Cordova.exec(this.pluginName + "." + funcName, params);
		}

	};


	//:::::::::::::::::::::::::::::
	//::::::::Mobile WebRTC::::::::
	//:::::::::::::::::::::::::::::
	var webrtc = new BXCordovaPlugin("MobileWebRTC");
	window.webrtc = webrtc;


	//UI methods
	webrtc.UI =
	{
		parent: webrtc,
		state: {
			"OUTGOING_CALL": "outgoing_call",
			"INCOMING_CALL": "incoming_call",
			"CONVERSATION": "conversation",
			"FAIL_CALL": "fail_call"
		}
	};

	webrtc.UI.exec = function (func, params)
	{
		this.parent.exec(func, params);
	};

	webrtc.UI.show = function (state, options)
	{
		var params = options || {};
		params.state = state;
		return this.exec("showUi", params);
	};

	webrtc.UI.close = function (params)
	{
		return this.exec("closeUi", params);
	};

	webrtc.UI.showLocalVideo = function (params)
	{
		return this.exec("showLocalVideo", params);
	};

	//WebRTC methods
	webrtc.createPeerConnection = function (params)
	{
		return this.exec("createPeerConnection", params);
	};

	webrtc.createOffer = function (params)
	{
		return this.exec("createOffer", params);
	};

	webrtc.createAnswer = function (params)
	{
		return this.exec("createAnswer", params);
	};

	webrtc.addIceCandidates = function (params)
	{
		return this.exec("addIceCandidates", params);
	};

	webrtc.setRemoteDescription = function (params)
	{
		return this.exec("setRemoteDescription", params);
	};

	webrtc.getUserMedia = function (params)
	{
		return this.exec("getUserMedia", params);
	};

	webrtc.onReconnect = function (params)
	{
		return this.exec("onReconnect", params);
	};

	webrtc.setEventListeners = function (params)
	{
		return this.exec("setEventListeners", params);
	};


	/**
	 * BitrixMobile
	 * @constructor
	 */

	var app = new BXCordovaPlugin("BitrixMobile");
	window.app = app;

	//#############################
	//#####--api version 9--#######
	//#############################

	//#############################
	//#####--api version 8--#######
	//#############################

	app.showSlidingPanel = function (params)
	{
		return this.exec("showSlidingPanel", params);
	};

	app.changeAccount = function ()
	{
		return this.exec("changeAccount", {});
	};

	//#############################
	//#####--api version 7--#######
	//#############################

	/**
	 * Shows cached documents.
	 * It may be used to deletion of unused documents
	 * to make up more free space on the disc
	 * @param params
	 * @returns {*}
	 */
	app.showDocumentsCache = function (params)
	{
		return this.exec("showDocumentsCache", params);
	};
	/**
	 * Shows additional white panel under navigation bar.
	 * @param params - The parameters
	 * @param params.buttons - The dictionary of buttons on the panel
	 * @param params.hidden_buttons_panel - The parameter control by visibility of the panel
	 * while scrolling down. true - by default
	 * @deprecated
	 * @returns {*}
	 */
	app.showButtonPanel = function (params)
	{
		return this.exec("showButtonPanel", params);
	};
	/**
	 * Hides additional white panel under navigation bar.
	 * @param params - The parameters
	 * @returns {*}
	 */
	app.hideButtonPanel = function (params)
	{
		return this.exec("hideButtonPanel", params);
	};
	/**
	 * Shows dialog of choosing of the values
	 * @param params - The parameters
	 * @param params.callback - The handler
	 * @param params.values - The array of values. For example - ["apple","google","bitrix"]
	 * @param params.default_value - The selected item by default. For example - "bitrix"
	 * @param params.multiselect - It enables to set multiple choice mode. false - by default
	 *
	 * @returns {*}
	 */
	app.showSelectPicker = function (params)
	{
		return this.exec("showSelectPicker", params);
	};
	/**
	 * Hides dialog of choosing of the values
	 * @param params - The parameters
	 * @returns {*}
	 */
	app.hideSelectPicker = function (params)
	{
		return this.exec("hideSelectPicker", params);
	};
	/**
	 * Shows badge with the number on the button
	 * @param params
	 * @returns {*}
	 */
	app.updateButtonBadge = function (params)
	{
		return this.exec("updateButtonBadge", params);
	};

	//#############################
	//#####--api version 6--#######
	//#############################

	/**
	 * Opens barcode scanner
	 *
	 * @example
	 * app.openBarCodeScanner({
 *     callback:function(data){
 *          //handle data (example of the data  - {type:"SSD", canceled:0, text:"8293473200"})
 *     }
 * })
	 * @param params The parameters
	 * @param params.callback The handler
	 *
	 * @returns {*}
	 */
	app.openBarCodeScanner = function (params)
	{
		return this.exec("openBarCodeScanner", params);
	};

	/**
	 * Shows photo controller
	 * @example
	 * <pre>
	 *     app.openPhotos({
 *        "photos":[
 *            {
 *                "url":"http://mysite.com/sample.jpg",
 *                "description": "description text"
 *            },
 *            {
 *                "url":"/sample2.jpg",
 *                "description": "description text 2"
 *            }
 *            ...
 *       ]
 *  });
	 *  </pre>
	 * @param params The parameters
	 * @param params.photos The array of photos
	 *
	 * @returns {*}
	 */
	app.openPhotos = function (params)
	{
		return this.exec("openPhotos", params);
	};

	/**
	 * Removes all application controller cache (iOS)
	 * @param params The parameters. Empty yet.
	 * @returns {*}
	 */
	app.removeAllCache = function (params)
	{
		return this.exec("removeAllCache", params);
	};

	/**
	 * Add the page with passed url address to navigation stack
	 * @param params  The parameters
	 * @param params.url The page url
	 * @param [params.data] The data that will be saved for the page. Use getPageParams() to get stored data.
	 * @param [params.title] The title that will be placed in the center in navigation bar
	 * @param [params.unique] The unique flag for the page. false by default.
	 * @param [params.cache] The unique flag for the page. false by default.
	 * @returns {*}
	 */
	app.loadPageBlank = function (params)
	{
		app.exec("openRight");
		return this.exec("openNewPage", params);
	};

	/**
	 * Loads the page as the first page in navigation chain.
	 * @param params The parameters
	 * @param params.url The absolute path of the page or url (http://example.com)
	 * @param [params.page_id] Identifier of the page, if this parameter will defined the page will be cached.
	 * @param [params.title] The title that will placed in the center of navigation bar
	 * @returns {*}
	 */
	app.loadPageStart = function (params)
	{
		if (params.url && !params.page_id && !params.title)
			return this.exec("loadPage", params.url);
		return this.exec("loadPage", params);
	}

	/**
	 * shows confirm alert
	 * @param params
	 */
	app.confirm = function (params)
	{
		if (!this.available)
		{
			document.addEventListener("deviceready", BX.proxy(function ()
			{
				this.confirm(params)
			}, this), false);
			return;
		}

		var confirmData = {
			callback: function ()
			{
			},
			title: "",
			text: "",
			buttons: "OK"
		};
		if (params)
		{
			if (params.title)
				confirmData.title = params.title;
			if (params.buttons && params.buttons.length > 0)
			{
				confirmData.buttons = "";
				for (var i = 0; i < params.buttons.length; i++)
				{
					if (confirmData.buttons.length > 0)
					{
						confirmData.buttons += "," + params.buttons[i];
					}
					else
						confirmData.buttons = params.buttons[i];
				}
			}
			confirmData.accept = params.accept;

			if (params.text)
				confirmData.text = params.text;
			if (params.callback && typeof(params.callback) == "function")
				confirmData.callback = params.callback;
		}

		navigator.notification.confirm(
			confirmData.text,
			confirmData.callback,
			confirmData.title,
			confirmData.buttons
		);

	};
	/**
	 * shows alert with custom title
	 * @param params
	 */
	app.alert = function (params)
	{

		if (!this.available)
		{
			document.addEventListener("deviceready", BX.proxy(function ()
			{
				this.alert(params)
			}, this), false);
			return;
		}

		var alertData = {
			callback: function ()
			{
			},
			title: "",
			button: "",
			text: ""
		};
		if (params)
		{
			if (params.title)
				alertData.title = params.title;
			if (params.button)
				alertData.button = params.button;
			if (params.text)
				alertData.text = params.text;
			if (params.callback && typeof(params.callback) == "function")
				alertData.callback = params.callback;
		}

		navigator.notification.alert(
			alertData.text,
			alertData.callback,
			alertData.title,
			alertData.button
		);

	};

	/**
	 * opens left slider
	 * @returns {*}
	 */
	app.openLeft = function ()
	{
		return this.exec("openMenu");
	};

	/**
	 * sets title of the current page
	 * @param params
	 * title - text title
	 * @returns {*}
	 */
	app.setPageTitle = function (params)
	{
		return this.exec("setPageTitle", params);
	};

	//#############################
	//#####--api version 5--#######
	//#############################
	/**
	 * removes cache of table by id
	 * in next time a table appear it will be reloaded
	 * @param tableId
	 * @returns {*}
	 */
	app.removeTableCache = function (tableId)
	{
		return this.exec("removeTableCache", {"table_id": tableId});
	};

	/** shows native datetime picker
	 * @param params
	 * @param params.format {string} date's format
	 * @param params.type {string} "datetime"|"time"|"date"
	 * @param params.callback {string}  The handler on date select event
	 * @returns {*}
	 */
	app.showDatePicker = function (params)
	{
		return this.exec("showDatePicker", params);
	};

	/**
	 * hides native datetime picker
	 * @returns {*}
	 */
	app.hideDatePicker = function ()
	{

		return this.exec("hideDatePicker");
	};

	//#############################
	//#####--api version 4--#######
	//#############################
	/**
	 * Shows native input panel
	 * @param params
	 * @param {string} params.placeholder  Text for the placeholder
	 * @param {string} params.button_name  Label of the button
	 * @param {function} params.action Onclick-handler for the button
	 * @example
	 * app.showInput({
 *				placeholder:"New message...",
 *				button_name:"Send",
 *				action:function(text)
 *				{
 *					app.clearInput();
 *					alert(text);
 *				},
 *			});
	 * @returns {*}
	 */
	app.showInput = function (params)
	{
		return this.exec("showInput", params);
	};

	/**
	 * use it to disable with activity indicator or enable button
	 * @param {boolean} loading_status
	 * @returns {*}
	 */
	app.showInputLoading = function (loading_status)
	{
		if (loading_status && loading_status !== true)
			loading_status = false;
		return this.exec("showInputLoading", {"status": loading_status});

	};

	/**
	 * clears native input
	 * @returns {*}
	 */
	app.clearInput = function ()
	{
		return this.exec("clearInput");
	};

	/**
	 * hides native input
	 * @returns {*}
	 */
	app.hideInput = function ()
	{
		return this.exec("hideInput");
	};

//#############################
//#####--api version 3--#######
//#############################

	/**
	 * reloads page
	 * @param params
	 */
	app.reload = function (params)
	{
		var params = params || {url: document.location.href};

		if (window.platform == 'android')
			this.exec('reload', params);
		else
		{
			document.location.href = params.url;
		}
	};

	/**
	 * makes flip-screen effect
	 * @returns {*}
	 */
	app.flipScreen = function ()
	{
		return this.exec("flipScreen");
	};

	/**
	 * removes buttons of the page
	 * @param params
	 * @param {string} params.position Position of button
	 * @returns {*}
	 */
	app.removeButtons = function (params)
	{
		return this.exec("removeButtons", params);
	};

	/**
	 *
	 * @param {object} params Settings of the table
	 * @param {string} params.url The url to download json-data
	 * @param {string} [params.table_id] The identifier of the table
	 * @param {boolean} [params.isroot] If true the table will be opened as first screen
	 * @param {object} [params.TABLE_SETTINGS]  Start settings of the table, it can be overwritten after download json data
	 * @param {object} [params.table_settings]  Start settings of the table, it can be overwritten after download json data
	 * @description TABLE_SETTINGS
	 *     callback: handler on ok-button tap action, it works only when 'markmode' is true
	 *     markmode: set it true to turn on mark mode, false - by default
	 *     modal: if true your table will be opened in modal dialog, false - by default
	 *     multiple: it works if 'markmode' is true, set it false to turn off multiple selection
	 *     okname - name of ok button
	 *     cancelname - name of cancel button
	 *     showtitle: true - to make title visible, false - by default
	 *     alphabet_index: if true - table will be divided on alphabetical sections
	 *     selected: this is a start selected data in a table, for example {users:[1,2,3,4],groups:[1,2,3]}
	 *     button:{
 	*                name: "name",
 	*                type: "plus",
 	*                callback:function(){
 	*                    //your code
 	*                }
 	*     };
	 * @returns {*}
	 */
	app.openBXTable = function (params)
	{
		if (typeof(params.table_settings) != "undefined")
		{
			params.TABLE_SETTINGS = params.table_settings;
			delete params.table_settings;
		}
		if (params.TABLE_SETTINGS.markmode && params.TABLE_SETTINGS.markmode == true)
		{
			if (params.TABLE_SETTINGS.callback && typeof(params.TABLE_SETTINGS.callback) == "function")
			{
				var insertCallback = params.TABLE_SETTINGS.callback;
				params.TABLE_SETTINGS.callback = function (data)
				{
					insertCallback(BitrixMobile.Utils.htmlspecialchars(data));
				}
			}
		}
		return this.exec("openBXTable", params);
	};

	/**
	 * Open document in separated window
	 * @param params
	 * @param {string} params.url  The document url
	 * @example
	 * app.openDocument({"url":"/upload/123.doc"});
	 * @returns {*}
	 */
	app.openDocument = function (params)
	{
		return this.exec("openDocument", params);
	};

	/**
	 * Shows the small loader in the center of the screen
	 * The loader will be automatically hided when "back" button pressed
	 * @param params - settings
	 * @param params.text The text of the loader
	 * @returns {*}
	 */
	app.showPopupLoader = function (params)
	{
		return this.exec("showPopupLoader", params);
	};

	/**
	 * Hides the small loader
	 * @param params The parameters
	 * @returns {*}
	 */
	app.hidePopupLoader = function (params)
	{
		return this.exec("hidePopupLoader", params);
	};

	/**
	 * Changes the parameters of the current page, that can be getted by getPageParams()
	 * @param params - The parameters
	 * @param params.data any mixed data
	 * @param {function} params.callback The callback-handler
	 * @returns {*}
	 */
	app.changeCurPageParams = function (params)
	{
		return this.exec("changeCurPageParams", params);
	};

	/**
	 * Gets the parameters of the page
	 * @param params The parameters
	 * @param {function} params.callback The handler
	 * @returns {*}
	 */
	app.getPageParams = function (params)
	{

		if (!this.enableInVersion(3))
			return false;

		return this.exec("getPageParams", params);
	};

	/**
	 * Creates the ontext menu of the page
	 * @example
	 * Parameters example:
	 * <pre>
	 *params =
	 *{
	*   			items:[
	*				{
	*					name:"Post message",
	*					action:function() { postMessage();},
	*					image: "/upload/post_message_icon.phg"
	*				},
	*				{
	*					name:"To Bitrix!",
	*					url:"http://bitrix.ru",
	*					icon: 'settings'
	*				}
	*			]
	 *}
	 *
	 * </pre>
	 * @param params The parameters
	 * @returns {*}
	 */
	app.menuCreate = function (params)
	{
		return this.exec("menuCreate", params);
	};

	/**
	 * Shows the context menu
	 * @returns {*}
	 */
	app.menuShow = function ()
	{
		return this.exec("menuShow");
	};

	/**
	 * Hides the context menu
	 * @returns {*}
	 */
	app.menuHide = function ()
	{
		return this.exec("menuHide");
	};

//#############################
//#####--api version 2--#######
//#############################

	/**
	 * Checks if it's required application version or not
	 * @param ver The version of API
	 * @param [strict]
	 * @returns {boolean}
	 */
	app.enableInVersion = function (ver, strict)
	{
		//check api version
		strict = strict == true ? true : false;

		var api_version = 1;
		try
		{
			api_version = appVersion;
		} catch (e)
		{
			//do nothing
		}

		return strict ? (parseInt(api_version) == parseInt(ver) ? true : false) : (parseInt(api_version) >= parseInt(ver) ? true : false);
	};


	/**
	 * Checks if the page is visible in this moment
	 * @param params The parameters
	 * @param params.callback The handler
	 * @returns {*}
	 */
	app.checkOpenStatus = function (params)
	{
		return this.exec("checkOpenStatus", params);
	};

	app.asyncRequest = function (params)
	{
		//native asyncRequest
		//params.url
		return this.exec("asyncRequest", params);
	};

//#############################
//#####--api version 1--#######
//#############################

	/**
	 * Opens url in external browser
	 * @param url
	 * @returns {*}
	 */
	app.openUrl = function (url)
	{
		//open url in external browser
		return this.exec("openUrl", url);
	};

	/**
	 * Register a callback
	 * @param {function} func The callback function
	 * @returns {number}
	 * @constructor
	 */
	app.RegisterCallBack = function (func)
	{
		if (typeof(func) == "function")
		{
			this.callbackIndex++;

			this.callbacks["callback" + this.callbackIndex] = func;

			return this.callbackIndex;
		}

	};

	/**
	 * Execute registered callback function by index
	 * @param index The index of callback function
	 * @param result The parameters that will be passed to callback as a first argument
	 * @constructor
	 */
	app.CallBackExecute = function (index, result)
	{
		if (this.callbacks["callback" + index] && (typeof this.callbacks["callback" + index]) === "function")
		{
			this.callbacks["callback" + index](result);
		}
	};

	/**
	 * Generates the javascript-event
	 * that can be caught by any application browsers
	 * except current browser
	 * @param eventName
	 * @param params
	 * @param where
	 * @returns {*|Array|{index: number, input: string}}
	 */
	app.onCustomEvent = function (eventName, params, where)
	{

		if (!this.available)
		{
			document.addEventListener("deviceready", BX.delegate(function ()
			{
				this.onCustomEvent(eventName, params, where);
			}, this), false);

			return;
		}

		params = this.prepareParams(params);
		if (typeof(params) == "object")
			params = JSON.stringify(params);

		if (device.platform.toUpperCase() == "ANDROID" || device.cordova > '2.0.0')
		{
			var params_pre = {
				"eventName": eventName,
				"params": params
			};
			return Cordova.exec(null, null, "BitrixMobile", "onCustomEvent", [params_pre]);
		}
		else
		{
			return Cordova.exec("BitrixMobile.onCustomEvent", eventName, params, where);
		}
	};

	/**
	 * Gets javascript variable from current and left
	 * @param params The parameters
	 * @param params.callback The handler
	 * @param params.var The variable's name
	 * @param params.from The browser ("left"|"current")
	 * @returns {*}
	 */
	app.getVar = function (params)
	{
		return this.exec("getVar", params);
	};

	/**
	 *
	 * @param variable
	 * @param key
	 * @returns {*}
	 */
	app.passVar = function (variable, key)
	{

		try
		{
			evalVar = window[variable];
			if (!evalVar)
				evalVar = "empty"
		}
		catch (e)
		{
			evalVar = ""
		}

		if (evalVar)
		{

			if (typeof(evalVar) == "object")
				evalVar = JSON.stringify(evalVar);

			if (platform.toUpperCase() == "ANDROID")
			{

				key = key || false;
				if (key)
					Bitrix24Android.receiveStringValue(JSON.stringify({variable: evalVar, key: key}));
				else
					Bitrix24Android.receiveStringValue(evalVar);
			} else
			{
				return evalVar;
			}
		}
	};


	/**
	 * Opens the camera/albums dialog
	 * @param options The parameters
	 * @param options.source  0 - albums, 1 - camera
	 * @param options.callback The event handler that will be fired when the photo will have selected. Photo will be passed into the callback in base64 as a first parameter.
	 */
	app.takePhoto = function (options)
	{
		if (!this.available)
		{
			document.addEventListener("deviceready", BX.proxy(function ()
			{
				this.takePhoto(options);
			}, this), false);
			return;
		}

		if (!options.callback)
			options.callback = function ()
			{
			};
		if (!options.fail)
			options.fail = function ()
			{
			};

		params = {
			quality: (options.quality || (this.enableInVersion(2) ? 40 : 10)),
			correctOrientation: (options.correctOrientation || false),
			targetWidth: (options.targetWidth || false),
			targetHeight: (options.targetHeight || false),
			sourceType: ((options.source !== undefined) ? options.source : 0),
			mediaType: ((options.mediaType !== undefined) ? options.mediaType : 0),
			allowEdit: true,
			//allowEdit: ((options.allowEdit !== undefined) ? options.allowEdit : false),
			saveToPhotoAlbum: ((options.saveToPhotoAlbum !== undefined) ? options.saveToPhotoAlbum : false)
		};

		if (options.destinationType !== undefined)
			params.destinationType = options.destinationType;

		navigator.camera.getPicture(options.callback, options.fail, params);


	};
	/**
	 * Opens left screen of the slider
	 * @deprecated It is deprecated. Use BitrixMobile.openLeft.
	 * @see BitrixMobile.openLeft
	 * @returns {*}
	 */
	app.openMenu = function ()
	{
		return this.exec("openMenu");
	};

	/**
	 * Opens page in modal dialog
	 * @param options The parameters
	 * @param options.url The page url
	 * @returns {*}
	 */
	app.showModalDialog = function (options)
	{
		return this.exec("showModalDialog", options);
	};

	/**
	 * Closes current modal dialog
	 * @param options
	 * @returns {*}
	 */
	app.closeModalDialog = function (options)
	{
		return this.exec("closeModalDialog", options);
	};

	/**
	 * Closes current controller
	 * @param [params] The parameters
	 * @param {boolean} [params.drop] It works on <b>Android</b> only. <u>true</u> - the controller will be dropped after it has disappeared, <u>false</u> - the controller will not be dropped after it has disappeared.
	 * @returns {*}
	 */
	app.closeController = function (params)
	{
		return this.exec("closeController", params);
	};

	/**
	 * Adds buttons to the navigation panel.
	 * @param buttons The parameters
	 * @param buttons.callback The onclick handler
	 * @param buttons.type  The type of the button (plus|back|refresh|right_text|back_text|users|cart)
	 * @param buttons.name The name of the button
	 * @param buttons.bar_type The panel type ("toolbar"|"navbar")
	 * @param buttons.position The position of the button ("left"|"right")
	 * @returns {*}
	 */
	app.addButtons = function (buttons)
	{
		return this.exec("addButtons", buttons);
	};

	/**
	 * Opens the center of the slider
	 * @returns {*}
	 */
	app.openContent = function ()
	{
		return this.exec("openContent");
	};

	/**
	 * Opens the left side of the slider
	 * @deprecated Use closeLeft()
	 * @returns {*}
	 */
	app.closeMenu = function ()
	{
		return this.exec("closeMenu");
	};

	/**
	 * Opens the page as the first page in the navigation stack
	 * @deprecated Use loadStartPage(params).
	 * @param url
	 * @param page_id
	 * @returns {*}
	 */
	app.loadPage = function (url, page_id)
	{
		//open page from menu
		if (this.enableInVersion(2) && page_id)
		{
			params = {
				url: url,
				page_id: page_id
			};
			return this.exec("loadPage", params);
		}
		this.openContent();
		return this.exec("loadPage", url);
	};

	/**
	 * Sets identifier of the page
	 * @param pageID
	 * @returns {*}
	 */
	app.setPageID = function (pageID)
	{
		return this.exec("setPageID", pageID);
	};

	/**
	 * Opens the new page with slider effect
	 * @deprecated Use loadPageBlank(params)
	 * @param url
	 * @param data
	 * @param title
	 * @returns {*}
	 */
	app.openNewPage = function (url, data, title)
	{

		if (this.enableInVersion(3))
		{
			var params = {
				url: url,
				data: data,
				title: title
			};

			return this.exec("openNewPage", params);
		}
		else
			return this.exec("openNewPage", url);
	};

	/**
	 * Loads the page into the left side of the slider using the url
	 * @deprecated
	 * @param url
	 * @returns {*}
	 */
	app.loadMenu = function (url)
	{
		return this.exec("loadMenu", url);
	};

	/**
	 * Opens the list
	 * @deprecated Use openBXTable();
	 * @returns {*}
	 * @param params
	 */
	app.openTable = function (params)
	{
		if (params.markmode && params.markmode == true)
		{
			if (params.callback && typeof(params.callback) == "function")
			{
				if (!(params.skipSpecialChars && params.skipSpecialChars === true))
				{
					var insertCallback = params.callback;

					params.callback = function (data)
					{
						insertCallback(BitrixMobile.Utils.htmlspecialchars(data));
					}
				}
			}
		}
		return this.exec("openTable", params);
	};

	/**
	 * @deprecated Use openBXTable()
	 *  <b>PLEASE, DO NOT USE IT!!!!</b>
	 * It is simple wrapper of openBXTable()
	 * @see BitrixMobile.openBXTable
	 * @param options The parameter.
	 * @returns {*}
	 */
	app.openUserList = function (options)
	{
		return this.exec("openUserList", options);
	};

	app.addUserListButton = function (options)
	{
		//open table controller
		//options.url
		return this.exec("addUserListButton", options);
	};

	app.pullDown = function (params)
	{
		//on|off pull down action on the current page
		//params.pulltext, params.downtext, params.loadtext
		//params.callback - action on pull-down-refresh
		//params.enable - true|false
		return this.exec("pullDown", params);
	};

	app.pullDownLoadingStop = function ()
	{
		return this.exec("pullDownLoadingStop");
	};

	/**
	 * Enables or disables scroll ability of the current page
	 * @param enable_status The scroll ability status
	 * @returns {*}
	 */
	app.enableScroll = function (enable_status)
	{
		//enable|disable scroll on the current page
		var enable_status = enable_status || false;
		return this.exec("enableScroll", enable_status);
	};

	/**
	 * Enables or disables firing events of  hiding/showing  of soft keyboard
	 * @param enable_status
	 * @returns {*}
	 */
	app.enableCaptureKeyboard = function (enable_status)
	{
		//enable|disable capture keyboard event on the current page
		var enable_status = enable_status || false;
		return this.exec("enableCaptureKeyboard", enable_status);
	};

	/**
	 * Enables or disables the ability of automatic showing/hiding of the loading screen at the current page
	 * when it has started or has finished loading process
	 *
	 * @param enable_status The ability status
	 * @returns {*}
	 */
	app.enableLoadingScreen = function (enable_status)
	{
		//enable|disable autoloading screen on the current page
		var enable_status = enable_status || false;
		return this.exec("enableLoadingScreen", enable_status);
	};


	/**
	 *
	 * Shows the loading screen at the page
	 * @returns {*}
	 */
	app.showLoadingScreen = function ()
	{
		//show loading screen
		return this.exec("showLoadingScreen");
	};

	/**
	 * Hides the loadding screen at the page
	 * @returns {*}
	 */
	app.hideLoadingScreen = function ()
	{
		//hide loading screen
		return this.exec("hideLoadingScreen");
	};


	/**
	 * Sets visibility status of the navigation bar
	 * @param {boolean} visible The visibility status
	 * @returns {*}
	 */
	app.visibleNavigationBar = function (visible)
	{
		//visibility status of the native navigation bar
		var visible = visible || false;
		return this.exec("visibleNavigationBar", visible);
	};

	/**
	 * Sets visibility status of the bottom bar
	 * @param {boolean} visible The visibility status
	 * @returns {*}
	 */
	app.visibleToolBar = function (visible)
	{
		//visibility status of toolbar at the bottom
		var visible = visible || false;
		return this.exec("visibleToolBar", visible);
	};

	app.enableSliderMenu = function (enable)
	{
		//lock|unlock slider menu
		var enable = enable || false;
		return this.exec("enableSliderMenu", enable);
	};

	app.setCounters = function (counters)
	{
		//set counters values on the navigation bar
		//counters.messages,counters.notifications
		return this.exec("setCounters", counters);
	};

	app.setBadge = function (number)
	{
		//application's badge number on the dashboard
		return this.exec("setBadge", number);
	};

	app.refreshPanelPage = function (pagename)
	{
		//set counters values on the navigation bar
		//counters.messages,counters.notifications

		if (!pagename)
			pagename = "";
		var options = {
			page: pagename
		};
		return this.exec("refreshPanelPage", options);
	};


	/**
	 * Sets page urls for the notify popup window and the messages popup window
	 * @param pages
	 * @returns {*}
	 */
	app.setPanelPages = function (pages)
	{
		//pages for notify panel
		//pages.messages_page, pages.notifications_page,
		//pages.messages_open_empty, pages.notifications_open_empty
		return this.exec("setPanelPages", pages);
	};

	/**
	 * Gets the token from the current device. You may use the token to send push-notifications to the device.
	 * @returns {*}
	 */
	app.getToken = function ()
	{
		//get device token
		var dt = "APPLE";
		if (platform != "ios")
			dt = "GOOGLE";
		var params = {
			callback: function (token)
			{
				BX.proxy(
					BX.ajax.post(
						app.dataBrigePath,
						{
							mobile_action: "save_device_token",
							device_name: device.name,
							uuid: device.uuid,
							device_token: token,
							device_type: dt
						},
						function (data)
						{
						}), this);
			}
		};

		return this.exec("getToken", params);
	};

	/**
	 * Executes a request by the check_url with Basic Authorization header
	 * @param params The parameters
	 * @param params.success The success javascript handler
	 * @param params.check_url The check url
	 * @returns {*}
	 * @constructor
	 */
	app.BasicAuth = function (params)
	{
		//basic autorization
		//params.success, params.check_url
		params = params || {};

		var userSuccessCallback = (params.success && typeof(params.success) == "function")
			? params.success
			: function ()
		{
		};
		var userFailCallback = (params.failture && typeof(params.failture) == "function")
			? params.failture
			: function ()
		{
		};

		var authParams = {
			check_url: params.check_url,
			success: function (data)
			{
				if (typeof data != "object")
				{
					try
					{
						data = JSON.parse(data);
					}
					catch (e)
					{
						data = {"status": "failed"}
					}
				}

				if (data.status == "success" && data.sessid_md5)
				{
					if (BX.message.bitrix_sessid != data.sessid_md5)
					{
						BX.message.bitrix_sessid = data.sessid_md5;
						app.onCustomEvent("onSessIdChanged", {sessid: data.sessid_md5});
					}

				}

				userSuccessCallback(data);
			},
			failture: function (data)
			{
				if (data.status == "failed")
					app.exec("showAuthForm");
				else
					userFailCallback();
			}

		};

		return this.exec("BasicAuth", authParams);
	};

	/**
	 * Logout
	 * @deprecated DO NOT USE IT ANY MORE!!!!
	 * @see BitrixMobile#asyncRequest
	 * @see BitrixMobile#showAuthForm
	 * @returns {*}
	 */
	app.logOut = function ()
	{
		//logout
		//request to mobile.data with mobile_action=logout
		if (this.enableInVersion(2))
		{
			this.asyncRequest({url: this.dataBrigePath + "?mobile_action=logout&uuid=" + device.uuid});
			return this.exec("showAuthForm");
		}

		var xhr = new XMLHttpRequest();
		xhr.open("GET", this.dataBrigePath + "?mobile_action=logout&uuid=" + device.uuid, true);
		xhr.onreadystatechange = function ()
		{
			if (xhr.readyState == 4 && xhr.status == "200")
			{
				return app.exec("showAuthForm");
			}

		};
		xhr.send(null);
	};
	/**
	 * Get location data
	 * @param options
	 */
	app.getCurrentLocation = function (options)
	{

		if (!this.available)
		{
			document.addEventListener("deviceready", BX.proxy(function ()
			{
				this.getCurrentLocation(options);
			}, this), false);
			return;
		}
		//get geolocation data
		var geolocationSuccess;
		var geolocationError;
		if (options)
		{
			geolocationSuccess = options.onsuccess;
			geolocationError = options.onerror;
		}
		navigator.geolocation.getCurrentPosition(
			geolocationSuccess, geolocationError);
	};

	app.setVibrate = function (ms)
	{
		// vibrate (ms)
		ms = ms || 500;
		navigator.notification.vibrate(parseInt(ms));
	};

	app.bindloadPageBlank = function ()
	{
		//Hack for Android Platform
		document.addEventListener(
			"DOMContentLoaded",
			function ()
			{
				document.body.addEventListener(
					"click",
					function (e)
					{
						var intentLink = null;
						var hash = "__bx_android_click_detect__";
						if (e.target.tagName.toUpperCase() == "A")
							intentLink = e.target;
						else
							intentLink = BX.findParent(e.target, {tagName: "A"}, 10);

						if (intentLink && intentLink.href && intentLink.href.length > 0)
						{
							if (intentLink.href.indexOf(hash) == -1 && intentLink.href.indexOf("javascript") != 0)
							{
								if (intentLink.href.indexOf("#") == -1)
									intentLink.href += "#" + hash;
								else
									intentLink.href += "&" + hash;
							}

						}

					},
					false
				);
			},
			false
		);

	};

	BitrixMobile = {};
	BitrixMobile.Utils = {

		autoResizeForm: function (textarea, pageContainer, maxHeight)
		{
			if (!textarea || !pageContainer)
				return;

			var formContainer = textarea.parentNode;
			maxHeight = maxHeight || 126;

			var origTextareaHeight = (textarea.ownerDocument || document).defaultView.getComputedStyle(textarea, null).getPropertyValue("height");
			var origFormContainerHeight = (formContainer.ownerDocument || document).defaultView.getComputedStyle(formContainer, null).getPropertyValue("height");

			origTextareaHeight = parseInt(origTextareaHeight); //23
			origFormContainerHeight = parseInt(origFormContainerHeight); //51
			textarea.setAttribute("data-orig-height", origTextareaHeight);
			formContainer.setAttribute("data-orig-height", origFormContainerHeight);

			var currentTextareaHeight = origTextareaHeight;
			var hiddenTextarea = document.createElement("textarea");
			hiddenTextarea.className = "send-message-input";
			hiddenTextarea.style.height = currentTextareaHeight + "px";
			hiddenTextarea.style.visibility = "hidden";
			hiddenTextarea.style.position = "absolute";
			hiddenTextarea.style.left = "-300px";

			document.body.appendChild(hiddenTextarea);

			textarea.addEventListener("change", resize, false);
			textarea.addEventListener("cut", resizeDelay, false);
			textarea.addEventListener("paste", resizeDelay, false);
			textarea.addEventListener("drop", resizeDelay, false);
			textarea.addEventListener("keyup", resize, false);

			if (window.platform == "android")
				textarea.addEventListener("keydown", resizeDelay, false);

			function resize()
			{
				hiddenTextarea.value = textarea.value;
				var scrollHeight = hiddenTextarea.scrollHeight;
				if (scrollHeight > maxHeight)
					scrollHeight = maxHeight;

				if (currentTextareaHeight != scrollHeight)
				{
					currentTextareaHeight = scrollHeight;
					textarea.style.height = scrollHeight + "px";
					formContainer.style.height = origFormContainerHeight + (scrollHeight - origTextareaHeight) + "px";
					pageContainer.style.bottom = origFormContainerHeight + (scrollHeight - origTextareaHeight) + "px";

					if (window.platform == "android")
						window.scrollTo(0, document.documentElement.scrollHeight);
				}
			}

			function resizeDelay()
			{
				setTimeout(resize, 0);
			}

		},

		resetAutoResize: function (textarea, pageContainer)
		{

			if (!textarea || !pageContainer)
				return;

			var formContainer = textarea.parentNode;

			var origTextareaHeight = textarea.getAttribute("data-orig-height");
			var origFormContainerHeight = formContainer.getAttribute("data-orig-height");

			textarea.style.height = origTextareaHeight + "px";
			formContainer.style.height = origFormContainerHeight + "px";
			pageContainer.style.bottom = origFormContainerHeight + "px";
		},

		showHiddenImages: function ()
		{
			var images = document.getElementsByTagName("img");
			for (var i = 0; i < images.length; i++)
			{
				var image = images[i];
				var realImage = image.getAttribute("data-src");
				if (!realImage)
					continue;

				if (BitrixMobile.Utils.isElementVisibleOnScreen(image))
				{
					image.src = realImage;
					image.setAttribute("data-src", "");
				}
			}
		},

		isElementVisibleOnScreen: function (element)
		{
			var coords = BitrixMobile.Utils.getElementCoords(element);

			var windowTop = window.pageYOffset || document.documentElement.scrollTop;
			var windowBottom = windowTop + document.documentElement.clientHeight;

			coords.bottom = coords.top + element.offsetHeight;

			var topVisible = coords.top > windowTop && coords.top < windowBottom;
			var bottomVisible = coords.bottom < windowBottom && coords.bottom > windowTop;

			return topVisible || bottomVisible;
		},

		isElementVisibleOn2Screens: function (element)
		{
			var coords = BitrixMobile.Utils.getElementCoords(element);

			var windowHeight = document.documentElement.clientHeight;
			var windowTop = window.pageYOffset || document.documentElement.scrollTop;
			var windowBottom = windowTop + windowHeight;

			coords.bottom = coords.top + element.offsetHeight;

			windowTop -= windowHeight;
			windowBottom += windowHeight;

			var topVisible = coords.top > windowTop && coords.top < windowBottom;
			var bottomVisible = coords.bottom < windowBottom && coords.bottom > windowTop;

			return topVisible || bottomVisible;

		},

		getElementCoords: function (element)
		{
			var box = element.getBoundingClientRect();

			return {
				originTop: box.top,
				originLeft: box.left,
				top: box.top + window.pageYOffset,
				left: box.left + window.pageXOffset
			};
		},

		htmlspecialchars: function (variable)
		{
			if (BX.type.isString(variable))
				return variable.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

			if (BX.type.isArray(variable))
			{
				for (var i = 0; i < variable.length; i++)
				{
					variable[i] = BitrixMobile.Utils.htmlspecialchars(variable[i]);
				}
			}
			else if (typeof(variable) == "object")
			{

				var obj = {};
				for (var key in variable)
					obj[key] = BitrixMobile.Utils.htmlspecialchars(variable[key]);
				variable = obj;
			}

			return variable;

		}
	};

	BitrixMobile.LazyLoad = {

		images: [],

		status: {
			hidden: -2,
			error: -1,
			"undefined": 0,
			inited: 1,
			loaded: 2
		},

		types: {
			image: 1,
			background: 2
		},

		clearImages: function ()
		{
			this.images = [];
		},

		showImages: function (checkOwnVisibility)
		{
			checkOwnVisibility = checkOwnVisibility === false ? false : true;
			for (var i = 0, length = this.images.length; i < length; i++)
			{
				var image = this.images[i];
				if (image.status == this.status.undefined)
				{
					this._initImage(image);
				}

				if (image.status !== this.status.inited)
				{
					continue;
				}

				if (!image.node || !image.node.parentNode)
				{
					image.node = null;
					image.status = BitrixMobile.LazyLoad.status.error;
					continue;
				}

				var isImageVisible = true;
				if (checkOwnVisibility && image.func)
				{
					isImageVisible = image.func(image);
				}

				if (isImageVisible === true && BitrixMobile.Utils.isElementVisibleOn2Screens(image.node))
				{
					if (image.type == BitrixMobile.LazyLoad.types.image)
					{
						image.node.src = image.src;
					}
					else
					{
						image.node.style.backgroundImage = "url('" + image.src + "')";
					}

					image.node.setAttribute("data-src", "");
					image.status = this.status.loaded;
				}
			}
		},

		registerImage: function (id, isImageVisibleCallback)
		{
			if (BX.type.isNotEmptyString(id))
			{
				this.images.push({
					id: id,
					node: null,
					src: null,
					type: null,
					func: BX.type.isFunction(isImageVisibleCallback) ? isImageVisibleCallback : null,
					status: this.status.undefined
				});
			}
		},

		registerImages: function (ids, isImageVisibleCallback)
		{
			if (BX.type.isArray(ids))
			{
				for (var i = 0, length = ids.length; i < length; i++)
				{
					this.registerImage(ids[i], isImageVisibleCallback);
				}
			}
		},

		_initImage: function (image)
		{
			image.status = this.status.error;
			var node = BX(image.id);
			if (node)
			{
				var src = node.getAttribute("data-src");
				if (BX.type.isNotEmptyString(src))
				{
					image.node = node;
					image.src = src;
					image.status = this.status.inited;
					image.type = image.node.tagName.toLowerCase() == "img" ?
						BitrixMobile.LazyLoad.types.image :
						BitrixMobile.LazyLoad.types.background;
				}
			}
		},

		getImageById: function (id)
		{
			for (var i = 0, length = this.images.length; i < length; i++)
			{
				if (this.images[i].id == id)
				{
					return this.images[i];
				}
			}

			return null;
		},

		removeImage: function (id)
		{
			for (var i = 0, length = this.images.length; i < length; i++)
			{
				if (this.images[i].id == id)
				{
					this.images = BX.util.deleteFromArray(this.images, i);
					break;
				}
			}

		},

		onScroll: function ()
		{
			BitrixMobile.LazyLoad.showImages();
		}

	};


	window.BitrixAnimation = {

		animate: function (options)
		{
			if (!options || !options.start || !options.finish ||
				typeof(options.start) != "object" || typeof(options.finish) != "object"
			)
				return null;

			for (var propName in options.start)
			{
				if (!options.finish[propName])
				{
					delete options.start[propName];
				}
			}

			options.progress = function (progress)
			{
				var state = {};
				for (var propName in this.start)
					state[propName] = Math.round(this.start[propName] + (this.finish[propName] - this.start[propName]) * progress);

				if (this.step)
					this.step(state);
			};

			return BitrixAnimation.animateProgress(options);
		},

		animateProgress: function (options)
		{
			var start = new Date();
			var delta = options.transition || BitrixAnimation.transitions.linear;
			var duration = options.duration || 1000;

			var timer = setInterval(function ()
			{

				var progress = (new Date() - start) / duration;
				if (progress > 1)
					progress = 1;

				options.progress(delta(progress));

				if (progress == 1)
				{
					clearInterval(timer);
					options.complete && options.complete();
				}

			}, options.delay || 13);

			return timer;
		},

		makeEaseInOut: function (delta)
		{
			return function (progress)
			{
				if (progress < 0.5)
					return delta(2 * progress) / 2;
				else
					return (2 - delta(2 * (1 - progress))) / 2;
			}
		},

		makeEaseOut: function (delta)
		{
			return function (progress)
			{
				return 1 - delta(1 - progress);
			};
		},

		transitions: {

			linear: function (progress)
			{
				return progress;
			},

			elastic: function (progress)
			{
				return Math.pow(2, 10 * (progress - 1)) * Math.cos(20 * Math.PI * 1.5 / 3 * progress);
			},

			quad: function (progress)
			{
				return Math.pow(progress, 2);
			},

			cubic: function (progress)
			{
				return Math.pow(progress, 3);
			},

			quart: function (progress)
			{
				return Math.pow(progress, 4);
			},

			quint: function (progress)
			{
				return Math.pow(progress, 5);
			},

			circ: function (progress)
			{
				return 1 - Math.sin(Math.acos(progress));
			},

			back: function (progress)
			{
				return Math.pow(progress, 2) * ((1.5 + 1) * progress - 1.5);
			},

			bounce: function (progress)
			{
				for (var a = 0, b = 1; 1; a += b, b /= 2)
				{
					if (progress >= (7 - 4 * a) / 11)
					{
						return -Math.pow((11 - 6 * a - 11 * progress) / 4, 2) + Math.pow(b, 2);
					}
				}
			}
		}
	};
//Events' handlers

	document.addEventListener('DOMContentLoaded', function ()
	{
		//if we are using framecache+appcache we should to refresh server-depended lang variables
		BX.addCustomEvent("onFrameDataReceived", function (data)
			{
				if (data.lang)
					app.onCustomEvent("onServerLangReceived", data.lang);

			}
		);

		BX.addCustomEvent("onServerLangReceived", function (lang)
			{

				if (lang)
				{
					for (var k in lang)
					{
						BX.message[k] = lang[k];
					}
				}

			}
		);
	}, false);

	document.addEventListener("deviceready", function ()
	{
		app.available = true;

		BX.addCustomEvent("onSessIdChanged", function (data)
			{
				BX.message.bitrix_sessid = data.sessid;
			}
		);
	}, false);

	MobileAjaxWrapper = function ()
	{
		this.type = null;
		this.method = null;
		this.url = null;
		this.callback = null;
		this.failure_callback = null;
		this.progress_callback = null;
		this.offline = null;
		this.processData = null;
		this.xhr = null;
	};

	MobileAjaxWrapper.prototype.Init = function (params)
	{
		if (params.type != 'json')
			params.type = 'html';

		if (params.method != 'POST')
			params.method = 'GET';

		if (params.processData == 'undefined')
			params.processData = true;

		this.type = params.type;
		this.method = params.method;
		this.url = params.url;
		this.data = params.data;
		this.processData = params.processData;
		this.callback = params.callback;

		if (params.callback_failure != 'undefined')
			this.failure_callback = params.callback_failure;
		if (params.callback_progress != 'undefined')
			this.progress_callback = params.callback_progress;
		if (params.callback_loadstart != 'undefined')
			this.loadstart_callback = params.callback_loadstart;
		if (params.callback_loadend != 'undefined')
			this.loadend_callback = params.callback_loadend;
	}

	MobileAjaxWrapper.prototype.Wrap = function (params)
	{
		this.Init(params);

		this.xhr = BX.ajax({
			'timeout': 30,
			'method': this.method,
			'dataType': this.type,
			'url': this.url,
			'data': this.data,
			'processData': this.processData,
			'onsuccess': BX.delegate(
				function (response)
				{
					if (this.xhr.status === 0)
						var bFailed = true;
					else if (this.type == 'json')
						var bFailed = (response.status == 'failed');
					else if (this.type == 'html')
						var bFailed = (response == '{"status":"failed"}');

					if (bFailed)
					{
						this.RepeatRequest();
					}
					else
					{
						this.callback(response);
					}
				},
				this
			),
			'onfailure': BX.delegate(function (errorCode, requestStatus)
			{
				if (
					errorCode !== undefined
					&& errorCode == 'status'
					&& requestStatus !== undefined
					&& requestStatus == 401
				)
				{
					this.RepeatRequest();
				}
				else
				{
					this.failure_callback();
				}
			}, this)
		});

		if (this.progress_callback != null)
			BX.bind(this.xhr, "progress", this.progress_callback);

		if (this.load_callback != null)
			BX.bind(this.xhr, "load", this.load_callback);

		if (this.loadstart_callback != null)
			BX.bind(this.xhr, "loadstart", this.loadstart_callback);

		if (this.loadend_callback != null)
			BX.bind(this.xhr, "loadend", this.loadend_callback);

		if (this.error_callback != null)
			BX.bind(this.xhr, "error", this.error_callback);

		if (this.abort_callback != null)
			BX.bind(this.xhr, "abort", this.abort_callback);
	}

	MobileAjaxWrapper.prototype.RepeatRequest = function ()
	{
		app.BasicAuth({
			'success': BX.delegate(
				function (auth_data)
				{
					this.data.sessid = auth_data.sessid_md5;
					this.xhr = BX.ajax({
						'timeout': 30,
						'method': this.method,
						'dataType': this.type,
						'url': this.url,
						'data': this.data,
						'onsuccess': BX.delegate(
							function (response_ii)
							{
								if (this.xhr.status === 0)
									var bFailed = true;
								else if (this.type == 'json')
									var bFailed = (response_ii.status == 'failed');
								else if (this.type == 'html')
									var bFailed = (response_ii == '{"status":"failed"}');

								if (bFailed)
									this.failure_callback();
								else
									this.callback(response_ii);
							},
							this
						),
						'onfailure': BX.delegate(function ()
						{
							this.failure_callback();
						}, this)
					});
				},
				this
			),
			'failture': BX.delegate(function ()
			{
				this.failure_callback();
			}, this)
		});
	}

	MobileAjaxWrapper.prototype.OfflineAlert = function (callback)
	{
		navigator.notification.alert(BX.message('MobileAppOfflineMessage'), (callback || BX.DoNothing), BX.message('MobileAppOfflineTitle'));
	}

	BMAjaxWrapper = new MobileAjaxWrapper;

	document.addEventListener("offline", function ()
	{
		BMAjaxWrapper.offline = true;
	}, false);
	document.addEventListener("online", function ()
	{
		BMAjaxWrapper.offline = false;
	}, false);

	document.addEventListener('DOMContentLoaded', function ()
	{
		BX.addCustomEvent("UIApplicationDidBecomeActiveNotification", function (params)
		{
			var networkState = navigator.network.connection.type;
			BMAjaxWrapper.offline = (networkState == Connection.UNKNOWN || networkState == Connection.NONE);
		});
	}, false);
})();


(function ()
{

	function addListener(el, type, listener, useCapture)
	{
		if (el.addEventListener)
		{
			el.addEventListener(type, listener, useCapture);
			return {
				destroy: function ()
				{
					el.removeEventListener(type, listener, useCapture);
				}
			};
		} else
		{
			var handler = function (e)
			{
				listener.handleEvent(window.event, listener);
			}
			el.attachEvent('on' + type, handler);

			return {
				destroy: function ()
				{
					el.detachEvent('on' + type, handler);
				}
			};
		}
	}

	var isTouch = true;

	/* Construct the FastButton with a reference to the element and click handler. */
	this.FastButton = function (element, handler, useCapture)
	{
		// collect functions to call to cleanup events
		this.events = [];
		this.touchEvents = [];
		this.element = element;
		this.handler = handler;
		this.useCapture = useCapture;
		if (isTouch)
			this.events.push(addListener(element, 'touchstart', this, this.useCapture));
		this.events.push(addListener(element, 'click', this, this.useCapture));
	};

	/* Remove event handling when no longer needed for this button */
	this.FastButton.prototype.destroy = function ()
	{
		for (i = this.events.length - 1; i >= 0; i -= 1)
			this.events[i].destroy();
		this.events = this.touchEvents = this.element = this.handler = this.fastButton = null;
	};

	/* acts as an event dispatcher */
	this.FastButton.prototype.handleEvent = function (event)
	{
		switch (event.type)
		{
			case 'touchstart':
				this.onTouchStart(event);
				break;
			case 'touchmove':
				this.onTouchMove(event);
				break;
			case 'touchend':
				this.onClick(event);
				break;
			case 'click':
				this.onClick(event);
				break;
		}
	};


	this.FastButton.prototype.onTouchStart = function (event)
	{
		event.stopPropagation ? event.stopPropagation() : (event.cancelBubble = true);
		this.touchEvents.push(addListener(this.element, 'touchend', this, this.useCapture));
		this.touchEvents.push(addListener(document.body, 'touchmove', this, this.useCapture));
		this.startX = event.touches[0].clientX;
		this.startY = event.touches[0].clientY;
	};


	this.FastButton.prototype.onTouchMove = function (event)
	{
		if (Math.abs(event.touches[0].clientX - this.startX) > 10 || Math.abs(event.touches[0].clientY - this.startY) > 10)
		{
			this.reset(); //if he did, then cancel the touch event
		}
	};


	this.FastButton.prototype.onClick = function (event)
	{
		event.stopPropagation ? event.stopPropagation() : (event.cancelBubble = true);
		this.reset();

		var result = this.handler.call(this.element, event);
		if (event.type == 'touchend')
			clickbuster.preventGhostClick(this.startX, this.startY);
		return result;
	};

	this.FastButton.prototype.reset = function ()
	{
		for (i = this.touchEvents.length - 1; i >= 0; i -= 1)
			this.touchEvents[i].destroy();
		this.touchEvents = [];
	};

	this.clickbuster = function ()
	{
	}

	this.clickbuster.preventGhostClick = function (x, y)
	{
		clickbuster.coordinates.push(x, y);
		window.setTimeout(clickbuster.pop, 2500);
	};

	this.clickbuster.pop = function ()
	{
		clickbuster.coordinates.splice(0, 2);
	};


	this.clickbuster.onClick = function (event)
	{
		for (var i = 0; i < clickbuster.coordinates.length; i += 2)
		{
			var x = clickbuster.coordinates[i];
			var y = clickbuster.coordinates[i + 1];
			if (Math.abs(event.clientX - x) < 25 && Math.abs(event.clientY - y) < 25)
			{
				event.stopPropagation ? event.stopPropagation() : (event.cancelBubble = true);
				event.preventDefault ? event.preventDefault() : (event.returnValue = false);
			}
		}
	};

	if (isTouch)
	{
		document.addEventListener('click', clickbuster.onClick, true);
		clickbuster.coordinates = [];
	}
})(this);


function ReadyDevice(func)
{
	document.addEventListener("deviceready", func, false);
}
