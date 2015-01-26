;(function(window){
	window["UC"] = (!!window["UC"] ? window["UC"] : {});
	if (!!window["FCList"])
		return;
	var safeEditing = true, safeEditingCurrentObj = null, quoteData = null;

	window.FCList = function (params, add) {
		this.CID = params["CID"];
		this.ENTITY_XML_ID = params["ENTITY_XML_ID"];
		this.container = params["container"];
		this.nav = params["nav"];
		this.mid = params["mid"];
		this.order = params["order"];
		this.status = "ready";
		this.msg = (!!this.nav ? this.nav.innerHTML : '');
		this.params = (!!add ? add : {});
		this.pullNewRecords = {};
		this.rights = params["rights"];
		// only for small informer at the left bottom screens part
		if (!!params["params"]["NOTIFY_TAG"] && !!params["params"]["NOTIFY_TEXT"] && !!window["UC"]["Informer"])
		{
			BX.addCustomEvent(window, 'OnUCCommentWasPulled', BX.delegate(function(id, data) {
				if (this.ENTITY_XML_ID == id[0]) { window["UC"]["Informer"].check(id, data, params["params"]["NOTIFY_TAG"], params["params"]["NOTIFY_TEXT"]) } }, this));
			window["UC"]["InformerTags"][params["params"]["NOTIFY_TAG"]] = (!!window["UC"]["InformerTags"][params["params"]["NOTIFY_TAG"]] ?
				window["UC"]["InformerTags"][params["params"]["NOTIFY_TAG"]] : []);
		}
		BX.bind(this.nav, "click", BX.proxy(function (e) {
			BX.PreventDefault(e);
			this.get();
			return false;
		}, this));
		BX.addCustomEvent(window, 'OnUCUserIsWriting', BX.delegate(function(ENTITY_XML_ID, id) {
			if (this.ENTITY_XML_ID == ENTITY_XML_ID) {
				BX.ajax({
					url: '/bitrix/components/bitrix/main.post.list/templates/.default/activity.php',
					method: 'POST',
					dataType: 'json',
					data: {
						AJAX_POST : "Y",
						ENTITY_XML_ID : this.ENTITY_XML_ID,
						MODE : "PUSH&PULL",
						sessid : BX.bitrix_sessid(),
						"PATH_TO_USER" : params["params"]["PATH_TO_USER"],
						"AVATAR_SIZE" : params["params"]["AVATAR_SIZE"],
						"NAME_TEMPLATE" : params["params"]["NAME_TEMPLATE"],
						"SHOW_LOGIN" : params["params"]["SHOW_LOGIN"]
					}
				});
			}
		}, this));
		BX.addCustomEvent(window, 'OnUCAfterRecordAdd', BX.delegate(function(ENTITY_XML_ID, data) {
			if (this.ENTITY_XML_ID == ENTITY_XML_ID) { this.add(data["messageId"], data, true, "simple"); } }, this));
		BX.addCustomEvent(window, 'OnUCFormSubmit', BX.delegate(function(ENTITY_XML_ID, ENTITY_ID, obj, data) {
			if (this.ENTITY_XML_ID == ENTITY_XML_ID) { this.pullNewRecords[ENTITY_XML_ID + '-0'] = "busy"; } }, this));
		BX.addCustomEvent(window, 'OnUCFormResponse', BX.delegate(function(ENTITY_XML_ID, ENTITY_ID, obj, data) {
			if (this.ENTITY_XML_ID == ENTITY_XML_ID) {
				this.pullNewRecords[ENTITY_XML_ID + '-0'] = "ready";
				this.pullNewRecords[ENTITY_XML_ID + '-' + ENTITY_ID] = "done";
			} }, this));
		BX.addCustomEvent(window, 'OnUCUserQuote', BX.delegate(function(ENTITY_XML_ID) {
			if (this.ENTITY_XML_ID == ENTITY_XML_ID && this.quote && this.quote.popup) {
				this.quote.popup.hide();
			}
		}, this));

		if (location.hash && parseInt(location.hash.replace("#com", "")) > 0)
			this.checkHash(parseInt(location.hash.replace("#com", "")));

		if (params["params"]["SHOW_FORM"] == "Y")
		{
			this.quote.show = BX.delegate(function(e, params) {
					setTimeout(BX.delegate( function() { this.quoteShow(e, params); }, this ), 50);
				}, this
			);
			var res = BX('record-' + this.ENTITY_XML_ID + '-new'),
				nodes = BX.findChildren(res.parentNode, {"tagName" : "DIV", "className" : "feed-com-block-cover"}, false);
			nodes = (!!nodes ? nodes : []);
			nodes.push(res);
			if (!!this.container)
				nodes.push(this.container);

			for (var ii = 0; ii < nodes.length; ii++)
			{
				BX.bind(nodes[ii], "mouseup", this.quote.show);
			}
		}

		BX.addCustomEvent(window, "onQuote"+this.ENTITY_XML_ID, this.quote.show);

	};
	window.FCList.prototype = {
		quote : {
			show : BX.DoNothing(),
			popup : null
		},
		quoteCheck : function() {
			var text = '', range, author = null;
			if (window.getSelection) {
				range = window.getSelection();
				text = range.toString();
			} else if (document.selection) {
				range = document.selection;
				text = range.createRange().text;
			}
			if (text != "")
			{
				var parent = BX('record-' + this.ENTITY_XML_ID + '-new'),
					endParent = BX.findParent(range.focusNode, {"tagName" : "DIV", "className" : "feed-com-block-cover"}, parent.parentNode),
					startParent = BX.findParent(range.anchorNode, {"tagName" : "DIV", "className" : "feed-com-block-cover"}, parent.parentNode);
				if (endParent != startParent || (!!endParent && !endParent.hasAttribute("id")))
				{
					text = "";
				}
				else
				{
					var node = BX(endParent.getAttribute("id").replace(/\-cover$/, "-actions-reply"));
					if (node)
					{
						author = {
							id : parseInt(node.getAttribute("bx-mpl-author-id")),
							name : node.getAttribute("bx-mpl-author-name")
						};
					}
				}
			}
			if (text == "") {
				if (!!this.quote.popup)
					this.quote.popup.hide();
				return false;
			}
			return {text : text, author : author};
		},
		quoteShow : function(e, params) {
			params = (!!params ? params : this.quoteCheck());

			if (!params || !params['text'])
			{
				quoteData = null;
				return false;
			}
			quoteData = params;

			if (this.quote.popup == null)
			{
				this.quote.popup = new MPLQuote({
					id : this.ENTITY_XML_ID,
					closeByEsc : true,
					autoHide : true,
					autoHideTimeout : 2500,
					events : {
						click : BX.delegate(function(e) {
							BX.PreventDefault(e);
							safeEditingCurrentObj = safeEditing;
							BX.onCustomEvent(window, "OnUCUserQuote", [this.ENTITY_XML_ID, params['author'], params['text'], safeEditingCurrentObj]);
							this.quote.popup.hide();
						}, this)
					},
					classEvents : {
						onQuoteHide : BX.proxy(function() { quoteData = null; this.quote.popup = null; }, this)
					}
				});
			}
			this.quote.popup.show(e);
		},
		display : function(status, startHeight)
		{
			var fxStart = 0, fxFinish = 0,
				time = 0,
				el = this.container;
			status = (status == "hide" ? "hide" : "show");
			if (status == "hide")
			{
				fxStart = this.container.offsetHeight;
				time = 1.0 * fxStart / 2000;

				time = (time < 0.3 ? 0.3 : (time > 0.5 ? 0.5 : time));
				el.style.overflow = 'hidden';

				(new BX.easing({
					duration : time*1000,
					start : {height:fxStart, opacity:100},
					finish : {height:fxFinish, opacity:0},
					transition : BX.easing.makeEaseOut(BX.easing.transitions.quart),
					step : function(state){
						el.style.maxHeight = state.height + "px";
						el.style.opacity = state.opacity / 100;
					},
					complete : function(){
						el.style.cssText = '';
						el.style.display = "none";
					}
				})).animate();
			}
			else
			{
				fxStart = (!! startHeight ? startHeight : 20);

				el.style.display = "block";
				el.style.overflow = 'hidden';
				el.style.maxHeight = fxStart;

				fxFinish = this.container.offsetHeight;
				time = 1.0 * (fxFinish - fxStart) / (2000 - fxStart);
				time = (time < 0.3 ? 0.3 : (time > 0.8 ? 0.8 : time));
				(new BX.easing({
					duration : time*1000,
					start : {height:fxStart, opacity:(fxStart > 0 ? 100 : 0)},
					finish : {height:fxFinish, opacity:100},
					transition : BX.easing.makeEaseOut(BX.easing.transitions.quart),
					step : function(state){
						el.style.maxHeight = state.height + "px";
						el.style.opacity = state.opacity / 100;
					},
					complete : function(){
						el.style.cssText = '';
						el.style.maxHeight = 'none';
					}
				})).animate();
			}
		},
		get : function()
		{
			if (this.status == "done")
			{
				if (this.nav.getAttribute("bx-visibility-status") == "visible") {
					this.display("hide");
					BX.adjust(this.nav, {attrs : {"bx-visibility-status" : "none"}, html : this.msg});
				} else {
					this.display("show");
					BX.adjust(this.nav, {attrs : {"bx-visibility-status" : "visible"}, html : BX.message("BLOG_C_HIDE")});
				}
			}
			else if (this.status == "ready")
			{
				this.send();
			}
			return false;
		},
		send : function() {
			this.status = "busy";
			BX.addClass(this.nav, "feed-com-all-hover");
			var data = BX.ajax.prepareData({
					AJAX_POST : "Y",
					ENTITY_XML_ID : this.ENTITY_XML_ID,
					MODE : "LIST",
					FILTER : (this.order == "ASC" ? {">ID" : this.mid} : {"<ID" : this.mid}),
					sessid : BX.bitrix_sessid() } ),
				url = BX.util.htmlspecialcharsback(this.nav.getAttribute("href"));
				url = (url.indexOf('#') !== -1 ? url.substr(0, url.indexOf('#')) : url);

			BX.ajax({
				url: (url + (url.indexOf('?') !== -1 ? "&" : "?") + data),
				method: 'GET',
				dataType: 'json',
				data: '',
				onsuccess: BX.proxy(this.build, this),
				onfailure: BX.proxy(function(){ this.status = "done"; this.wait("hide");}, this)
			});
		},
		build : function(data) {
			this.status = "ready";
			this.wait("hide");
			BX.removeClass(this.nav, "feed-com-all-hover");
			if (!!data && data["status"] == true)
			{
				var res = (!!data["navigation"] ? BX.create('DIV', {html : data["navigation"]}) : null),
					ob = BX.processHTML(data["messageList"], false);

				var offsetHeight = this.container.offsetHeight;
				if (this.order == "ASC")
					this.container.innerHTML = this.container.innerHTML + ob.HTML;
				else
					this.container.innerHTML = ob.HTML + this.container.innerHTML;
				BX.onCustomEvent(window, "OnUCFeedChanged", [[this.ENTITY_XML_ID, this.mid]]);

				this.display('show', offsetHeight);
				if (!!res)
					res = res.firstChild;
				if (!!res)
					BX.adjust(this.nav, {attrs : {href : res.getAttribute("href")}, html : res.innerHTML});
				else {
					BX.adjust(this.nav, {attrs : {href : "javascript:void(0);", "bx-visibility-status" : "visible"}, html : BX.message("BLOG_C_HIDE")});
					this.status = "done";
				}
				BX.defer(function(){
					BX.ajax.processScripts(ob.SCRIPT);
				})();
			}
		},
		wait : function(status)
		{
			status = (status == "show" ? "show" : "hide");
		},
		reply : function(node)
		{
			safeEditingCurrentObj = safeEditing;
			if (!!node)
				BX.onCustomEvent(window, 'OnUCUserReply', [this.ENTITY_XML_ID, node.getAttribute("bx-mpl-author-id"), node.getAttribute("bx-mpl-author-name"), safeEditingCurrentObj]);
			else
				BX.onCustomEvent(window, 'OnUCUserReply', [this.ENTITY_XML_ID, undefined, undefined, safeEditingCurrentObj]);
		},
		/*
		* @params array array(
		 'errorMessage' => $arParams["ERROR_MESSAGE"],
		 'okMessage' => $arParams["OK_MESSAGE"],
		 'status' => true,
		 'message' => html text ,
		 'messageBBCode' => bbcode text,
		 'messageId' => array($arParams["ENTITY_XML_ID"], $arParams["RESULT"]),
		 'messageFields' => total data array
		 )
		*
		* */
 		add : function(id, data, edit, animation) {
			if (!(!!data && !!id && parseInt(id[1]) > 0))
				return false;
			var
				container = BX('record-' + id.join('-') + '-cover'),
				html = (!!data["message"] ? data["message"] :  fcParseTemplate(
					{ messageFields : data["messageFields"] },
					{ DATA_TIME_FORMAT : this.DATA_TIME_FORMAT, RIGHTS : this.rights } )),
				ob = BX.processHTML(html, false),
				results;

			if (!!container)
			{
				if (!!edit)
				{
					container.parentNode.insertBefore(
						BX.create("DIV", {attrs : {id : ("record-" + id.join('-') + '-cover'), className : "feed-com-block-cover"}, html : ob.HTML}),
						container );
					BX.remove(container);
				}
			}
			else
			{
				container = BX('record-' + id[0] + '-new');
				var
					acts = ["MODERATE", "EDIT", "DELETE"],
					needToCheck = false;
				for (var ii in acts)
				{
					if (this.rights[acts[ii]] == "OWNLAST") {
						needToCheck = true;
						break;
					}
				}
				if (needToCheck)
				{
					results = (!!container.lastChild && container.lastChild.className == "feed-com-block-cover" ? [container.lastChild] : []);
					if (this.addCheckPreviousNodes !== true)
					{
						results = BX.findChildren(container.parentNode, {tagName : "DIV", "className" : "feed-com-block-cover"}, false);
						var results2 = BX.findChildren(container, {tagName : "DIV",  "className" : "feed-com-block-cover"}, false),
							res, res2;
						results = (!!results ? results : []); results2 = (!!results2 ? results2 : []);
						while (results2.length > 0 && (res = results2.pop()) && !!res)
							results.push(res);
						this.addCheckPreviousNodes = true;
					}
					while (res = results.pop()) {
						res2 = BX(res.id.replace("-cover", "-actions"));
						if (!!res2)
						{
							if (this.rights["EDIT"] == "OWNLAST")
								res2.setAttribute("bx-mpl-edit-show", "N");
							if (this.rights["MODERATE"] == "OWNLAST")
								res2.setAttribute("bx-mpl-moderate-show", "N");
							if (this.rights["DELETE"] == "OWNLAST")
								res2.setAttribute("bx-mpl-delete-show", "N");
						}
					}
				}
				container.appendChild(
					BX.create("DIV", {
						attrs : {id : ("record-" + id.join('-') + '-cover'), "className" : "feed-com-block-cover"},
						style : {opacity : 0, height : 0, overflow: "hidden"},
						html : ob.HTML})
				);
				var node = BX('record-' + id.join('-') + '-cover');
				if (!!node)
				{
					if (animation !== "simple") {
						var curPos = BX.pos(node),
							scroll = BX.GetWindowScrollPos(),
							size = BX.GetWindowInnerSize();
						(new BX.easing({
							duration : 1000,
							start : { opacity : 0, height : 0},
							finish : { opacity: 100, height : node.scrollHeight},
							transition : BX.easing.makeEaseOut(BX.easing.transitions.quart),
							step : function(state){
								node.style.height = state.height + "px";
								node.style.opacity = state.opacity / 100;
								if (scroll.scrollTop > 0 && curPos.top < (scroll.scrollTop + size.innerHeight))
									window.scrollTo(0, scroll.scrollTop + state.height);
							},

							complete : function(){
								node.style.cssText = '';
							}
						})).animate();
					}
					else
					{
						(new BX.easing({
							duration : 500,
							start : { height : 0, opacity : 0},
							finish : { height : node.scrollHeight, opacity : 100},
							transition : BX.easing.makeEaseOut(BX.easing.transitions.cubic),
							step : function(state) {
								node.style.height = state.height + "px";
								node.style.opacity = state.opacity / 100;
							},
							complete : function() {
								node.style.cssText = '';
							}
						})).animate();
					}
				}
			}
			BX.defer(function(){
				BX.ajax.processScripts(ob.SCRIPT);
			})();
			BX.onCustomEvent(window, 'OnUCRecordHaveDrawn', [this.ENTITY_XML_ID, data]);
			BX.onCustomEvent(window, "OnUCFeedChanged", [id]);
			return true;
		},
		pullNewAuthor : function(authorId, authorName, authorAvatar) {
			BX.onCustomEvent(window, 'OnUCUsersAreWriting', [this.ENTITY_XML_ID, authorId, authorName, authorAvatar]);
		},
		pullNewRecord : function(params) {
			var id = [this.ENTITY_XML_ID, parseInt(params["ID"])];
			if (!!BX('record-' + id.join('-') + '-cover'))
				return true;
			else if (!!this.pullNewRecords[id.join('-')] && this.pullNewRecords[id.join('-')] == "busy")
				return true;
			else if (!!this.pullNewRecords[id[0] + '-0'] && this.pullNewRecords[id[0] + '-0'] == "busy")
				return setTimeout(BX.proxy(function () {this.pullNewRecord(params)}, this), 100);

			BX.onCustomEvent(window, "OnUCBeforeCommentWillBePulled", [id, params]);
			var ajaxSend = (!!params['URL'] && !!params['URL']['LINK']);

			if (ajaxSend && !!this.rights) {
				ajaxSend = false;
				if (params["APPROVED"] != "Y") {
					if (this.rights["MODERATE"] == "Y")
						ajaxSend = true;
					else
						return false;
				}
			}

			if(params["NEED_REQUEST"] == "Y")
				ajaxSend = true;

			if (ajaxSend)
			{
				if (
					params['URL']['LINK'].indexOf('#GROUPS_PATH#') >= 0
					&& !!BX.message('MPL_WORKGROUPS_PATH')
				)
					params['URL']['LINK'] = params['URL']['LINK'].replace('#GROUPS_PATH#', BX.message('MPL_WORKGROUPS_PATH'));

				this.pullNewRecords[id.join('-')] = "busy";
				var data = BX.ajax.prepareData( {
					AJAX_POST : "Y",
					ENTITY_XML_ID : this.ENTITY_XML_ID,
					MODE : "RECORD",
					FILTER : {"ID" : params["ID"]},
					sessid : BX.bitrix_sessid() }),
					url = params['URL']['LINK'];
					url = (url.indexOf('#') !== -1 ? url.substr(0, url.indexOf('#')) : url);
				BX.ajax({
					url: (url + (url.indexOf('?') !== -1 ? "&" : "?") + data),
					method: 'GET',
					dataType: 'json',
					data: '',
					onsuccess: BX.delegate(function(data){
						if (!!BX('record-' + id.join('-') + '-cover'))
							return;
						this.add([this.ENTITY_XML_ID, parseInt(params["ID"])], data);
						var node = BX('record-' + id.join('-') + '-cover'),
							node1 = BX.findChild(node, {className: 'feed-com-block'}, true, false);
						node1.style.backgroundColor = '#fbf2c8';
						BX.addClass(node, 'comment-new-answer');
						this.pullNewRecords[id.join('-')] = "done";
						if (BX('record-' + id[0] + '-corner'))
						{
							BX.addClass(BX('record-' + id[0] + '-corner'), (BX.hasClass(node1, "feed-com-block-new") ? "feed-post-block-yellow-corner" :""));
							BX('record-' + id[0] + '-corner').removeAttribute("id");
						}
						BX.onCustomEvent(window, "OnUCCommentWasPulled", [id, data]);
					}, this)
				});
			}
			else
			{
				if (params && !(params["AUTHOR"] && (params["AUTHOR"]["ID"] + '') == (BX.message("USER_ID") + '')))
					params["NEW"] = "Y";
				this.add(id, {"messageFields" : params});
				var node = BX('record-' + id.join('-') + '-cover'),
					node1 = BX.findChild(node, {className: 'feed-com-block'}, true, false);
				if (BX('record-' + id[0] + '-corner'))
				{
					BX.addClass(BX('record-' + id[0] + '-corner'), (params["NEW"] == "Y" ? "feed-post-block-yellow-corner" :""));
					BX('record-' + id[0] + '-corner').removeAttribute("id");
				}
				if (params["NEW"] == "Y")
					node1.style.backgroundColor = '#fbf2c8';
				BX.addClass(node, 'comment-new-answer');
				this.pullNewRecords[id.join('-')] = "done";
				BX.onCustomEvent(window, "OnUCCommentWasPulled", [id, {"messageFields" : params}])
			}
			return true;
		},
		act : function(url, id, act) {
			if (url.substr(0, 1) != '/')
			{
				try { eval(url); return false; }
				catch(e) {}
				if (BX.type.isFunction(url)) {
					url(this, id, act);
					return false;
				}
			}
			fcShowWait(BX('record-' + this.ENTITY_XML_ID + '-' + id + '-actions'));
			act = (act === "EDIT" ? "EDIT" : (act === "DELETE" ? "DELETE" : "MODERATE"));
			id = parseInt(id);
			var data = BX.ajax.prepareData( {
				sessid : BX.bitrix_sessid(),
				MODE : "RECORD",
				NOREDIRECT : "Y",
				AJAX_POST : "Y",
				FILTER : {"ID" : id},
				ENTITY_XML_ID : this.ENTITY_XML_ID } );
			url = (url.indexOf('#') !== -1 ? url.substr(0, url.indexOf('#')) : url);

 			BX.ajax({
				'method': 'GET',
				'url': (url + (url.indexOf('?') !== -1 ? "&" : "?") + data),
				'data': '',
				dataType: 'json',
				onsuccess: BX.proxy(function(data) {
					fcCloseWait(BX('record-' + this.ENTITY_XML_ID + '-' + id).firstChild);
					if (!!data && typeof data == "object" && data['status'])
					{
						if (act !== "EDIT")
						{
							var container = BX('record-' + this.ENTITY_XML_ID + '-' + id + '-cover');
							if (!!data['message'] && !!container)
							{
								var ob = BX.processHTML(data["message"], false);
								container.innerHTML = ob.HTML;
								BX.defer(function(){
									BX.ajax.processScripts(ob.SCRIPT);
								})();
								data['okMessage'] = '';
							}
							else if (act == "DELETE" && !!data['okMessage'])
							{
								BX.hide(BX('record-' + this.ENTITY_XML_ID + '-' + id));
							}
						}
						BX.onCustomEvent(window, 'OnUCAfterRecordEdit', [this.ENTITY_XML_ID, id, data, act]);
						BX.onCustomEvent(window, "OnUCFeedChanged", [id]);
					}
					this.busy = false;
				}, this),
				onfailure: BX.delegate(function(){fcCloseWait();}, this)
			});
			return false;
		},
		checkHash : function(ENTITY_ID)
		{
			var id = [this.ENTITY_XML_ID, ENTITY_ID],
				node = BX('record-' + id.join('-') + '-cover');
			if (!!node)
			{
				var curPos = BX.pos(node);
				window.scrollTo(0, curPos["top"]);
				BX.fx.colorAnimate.addRule('animationRule4',"#fbf2c8","#ffffff", "background-color", 150, 20, false);
				BX.fx.colorAnimate(BX.findChild(node, {className: 'feed-com-block'}, true, false), 'animationRule4');
				BX.removeClass(node, 'comment-new-answer');
			}
		}
	};
	window.FCList.getQuoteData = function(){ return quoteData; }

	window["fcExpandComment"] = function(id, source)
	{
		if (!BX('record-' + id + '-text')) {
			return false;
		}

		var el2 = BX('record-' + id + '-text'),
			el = el2.parentNode,
			fxStart = 200,
			fxFinish = el2.offsetHeight,
			start1 = {height:fxStart},
			finish1 = {height:fxFinish};
		if (!!source)
			BX.remove(source);

		var time = 1.0 * (fxFinish - fxStart) / (2000 - fxStart);
		time = (time < 0.3 ? 0.3 : (time > 0.8 ? 0.8 : time));

		el.style.maxHeight = start1.height+'px';
		el.style.overflow = 'hidden';

		(new BX.easing({
			duration : time*1000,
			start : start1,
			finish : finish1,
			transition : BX.easing.makeEaseOut(BX.easing.transitions.quart),
			step : function(state){
				el.style.maxHeight = state.height + "px";
				el.style.opacity = state.opacity / 100;
			},
			complete : function(){
				el.style.cssText = '';
				el.style.maxHeight = 'none';
			}
		})).animate();

		BX.onCustomEvent(window, "OnUCFeedChanged", [id.split('-')]);
	};

	var lastWaitElement = null;
	window["fcShowWait"] = function(el) {
		if (el && !BX.type.isElementNode(el))
			el = null;
		el = el || this;

		if (BX.type.isElementNode(el))
		{
			BX.defer(function(){el.disabled = true})();
			var waiter_parent = BX.findParent(el, BX.is_relative);

			el.bxwaiter = (waiter_parent || document.body).appendChild(BX.create('DIV', {
				props: {className: 'feed-com-loader'},
				style: {position: 'absolute'}
			}));
			lastWaitElement = el;

			return el.bxwaiter;
		}
		return true;
	};

	window["fcCloseWait"] = function(el) {
		if (el && !BX.type.isElementNode(el))
			el = null;
		el = el || lastWaitElement || this;

		if (BX.type.isElementNode(el))
		{
			if (el.bxwaiter && el.bxwaiter.parentNode)
			{
				el.bxwaiter.parentNode.removeChild(el.bxwaiter);
				el.bxwaiter = null;
			}

			el.disabled = false;
			if (lastWaitElement == el)
				lastWaitElement = null;
		}
	};

	window["fcShowActions"] = function(ENTITY_XML_ID, ID, el)
	{
		var panels = [];
		if (el.getAttribute('bx-mpl-view-show') == 'Y')
		{
			panels.push({
				text : BX.message("MPL_MES_HREF"),
				href : el.getAttribute('bx-mpl-view-url').replace(/\#(.+)$/gi, "") + "#com" + ID
			});
			panels.push({
				text : '<span id="record-popup-' + ENTITY_XML_ID + '-' + ID + '-link-text">' + BX.message("B_B_MS_LINK") + '</span>',
				onclick : function() {
					var
						id = 'record-popup-' + ENTITY_XML_ID + '-' + ID + '-link',
						it = BX.proxy_context,
						height = parseInt(!!it.getAttribute("bx-height") ? it.getAttribute("bx-height") : it.offsetHeight);

					if (it.getAttribute("bx-status") != "shown")
					{
						it.setAttribute("bx-status", "shown");
						if (!BX(id) && !!BX(id + '-text'))
						{
							var
								node = BX(id + '-text'),
								pos = BX.pos(node),
								pos2 = BX.pos(node.parentNode),
								nodes = BX.findChildren(node.parentNode.parentNode.parentNode, {className : "menu-popup-item-text"}, true),
								urlView = el.getAttribute('bx-mpl-view-url').replace(/\#(.+)$/gi, "") + "#com" + ID;
							pos["height"] = pos2["height"] - 1;
							if (nodes)
							{
								var width = 0, pos3;
								for (var ii = 0; ii < nodes.length; ii++)
								{
									pos3 = BX.pos(nodes[ii]);
									width = Math.max(width, pos3["width"]);
								}
								pos2["width"] = width;
							}
							BX.adjust(it, {
								attrs : {"bx-height" : it.offsetHeight},
								style : { overflow : "hidden", display : 'block'},
								children : [
									BX.create('BR'),
									BX.create('DIV', { attrs : {id : id},
										children : [
											BX.create('SPAN', {attrs : {"className" : "menu-popup-item-left"}}),
											BX.create('SPAN', {attrs : {"className" : "menu-popup-item-icon"}}),
											BX.create('SPAN', {attrs : {"className" : "menu-popup-item-text"},
												children : [
													BX.create('INPUT', {
															attrs : {
																id : id + '-input',
																type : "text",
																value : (urlView.indexOf('http') < 0 ? (location.protocol + '//' + location.host) : '') + urlView} ,
															style : {
																height : pos2["height"] + 'px',
																width : pos2["width"] + 'px'
															},
															events : { click : function(e){ this.select(); BX.PreventDefault(e);} }
														}
													)
												]
											})
										]
									}),
									BX.create('SPAN', {"className" : "menu-popup-item-right"})
								]
							});
						}
						(new BX.fx({
							time: 0.2,
							step: 0.05,
							type: 'linear',
							start: height,
							finish: height * 2,
							callback: BX.delegate(function(height) {this.style.height = height + 'px';}, it)
						})).start();
						BX.fx.show(BX(id), 0.2);
						BX(id + '-input').select();
					}
					else
					{
						it.setAttribute("bx-status", "hidden");
						(new BX.fx({
							time: 0.2,
							step: 0.05,
							type: 'linear',
							start: it.offsetHeight,
							finish: height,
							callback: BX.delegate(function(height) {this.style.height = height + 'px';}, it)
						})).start();
						BX.fx.hide(BX(id), 0.2);
					}
				}
			});
		}
		if (el.getAttribute('bx-mpl-edit-show') == 'Y')
			panels.push({
				text : BX.message("BPC_MES_EDIT"),
				onclick : function() { window['UC'][ENTITY_XML_ID].act(el.getAttribute('bx-mpl-edit-url'), ID, 'EDIT'); this.popupWindow.close(); return false;}
			});
		if (el.getAttribute('bx-mpl-moderate-show') == 'Y')
			panels.push({
				text : (el.getAttribute('bx-mpl-moderate-approved') == 'hidden' ? BX.message("BPC_MES_SHOW") : BX.message("BPC_MES_HIDE")),
				onclick : function() { window['UC'][ENTITY_XML_ID].act(el.getAttribute('bx-mpl-moderate-url'), ID, 'MODERATE'); this.popupWindow.close();}
			});

		if (el.getAttribute('bx-mpl-delete-show') == 'Y')
			panels.push({
				text : BX.message("BPC_MES_DELETE"),
				onclick : function() {
					if(confirm(BX.message("BPC_MES_DELETE_POST_CONFIRM")))
						window['UC'][ENTITY_XML_ID].act(el.getAttribute('bx-mpl-delete-url'), ID, 'DELETE');
					this.popupWindow.close(); return false;
				}
			});

		if (panels.length > 0) {
			for (var ii in panels)
				panels[ii]['className'] = 'blog-comment-popup-menu';
			BX.PopupMenu.show('action-' + ENTITY_XML_ID + '-' + ID, el,
				panels,
				{
					offsetLeft: -18,
					offsetTop: 2,
					lightShadow: false,
					angle: {position: 'top', offset: 50},
					events : {
						onPopupClose : function(popupWindow) {this.destroy();BX.PopupMenu.Data['action-' + ENTITY_XML_ID + '-' + ID] = null; }
					}
				}
			);
		}
	};

	/**
	 * Parse template with params
	 * @param array array(
	 *     "messageFields" => array(
			 "ID" => $res["ID"], // integer
			 "NEW" => $res["NEW"], //"Y" | "N"
			 "APPROVED" => $res["APPROVED"], //"Y" | "N"
			 "POST_TIMESTAMP" => $res["POST_TIMESTAMP"] - CTimeZone::GetOffset(),
			 "POST_TIME" => $res["POST_TIME"],
			 "POST_DATE" => $res["POST_DATE"],
			 "~POST_MESSAGE_TEXT" => $res["~POST_MESSAGE_TEXT"],
			 "POST_MESSAGE_TEXT" => $res["POST_MESSAGE_TEXT"],
			 "CLASSNAME" => (isset($res["CLASSNAME"]) ? " ".$res["CLASSNAME"] : ""),
			 "PANELS" => array(
				 "EDIT" => $res["PANELS"]["EDIT"], //"Y" | "N"
				 "MODERATE" => $res["PANELS"]["MODERATE"],//"Y" | "N"
				 "DELETE" => $res["PANELS"]["DELETE"]//"Y" | "N"
			 ),
			 "URL" => array(
				 "LINK" => $res["URL"]["LINK"],
				 "EDIT" => $res["URL"]["EDIT"],
				 "MODERATE" => $res["URL"]["MODERATE"],
				 "DELETE" => $res["URL"]["DELETE"]
			 ),
			 "AUTHOR" => array(
			 "ID" => $res["AUTHOR"]["ID"],
			 "NAME" => $res["AUTHOR"]["NAME"],
			 "URL" => $res["AUTHOR"]["URL"],
			 "AVATAR" => $res["AUTHOR"]["AVATAR"]),
			 "BEFORE_HEADER" => $APPLICATION->GetViewContent(implode('_', array($arParams["TEMPLATE_ID"], 'ID', $res['ID'], 'BEFORE_HEADER'))),
			 "BEFORE_ACTIONS" => $APPLICATION->GetViewContent(implode('_', array($arParams["TEMPLATE_ID"], 'ID', $res['ID'], 'BEFORE_ACTIONS'))),
			 "AFTER_ACTIONS" => $APPLICATION->GetViewContent(implode('_', array($arParams["TEMPLATE_ID"], 'ID', $res['ID'], 'AFTER_ACTIONS'))),
			 "AFTER_HEADER" => $APPLICATION->GetViewContent(implode('_', array($arParams["TEMPLATE_ID"], 'ID', $res['ID'], 'AFTER_HEADER'))),
			 "BEFORE" => $APPLICATION->GetViewContent(implode('_', array($arParams["TEMPLATE_ID"], 'ID', $res['ID'], 'BEFORE'))),
			 "AFTER" => $uf.$APPLICATION->GetViewContent(implode('_', array($arParams["TEMPLATE_ID"], 'ID', $res['ID'], 'AFTER')))
			 "BEFORE_RECORD" => $APPLICATION->GetViewContent(implode('_', array($arParams["TEMPLATE_ID"], 'ID', $res['ID'], 'BEFORE_RECORD'))),
			 "AFTER_RECORD" => $uf.$APPLICATION->GetViewContent(implode('_', array($arParams["TEMPLATE_ID"], 'ID', $res['ID'], 'AFTER_RECORD')))
	 *     )
	 * )
	 * @return string
	 */
	window["fcParseTemplate"] = function(data, params)
	{
		params = (!!params ? params : {});
		params["DATE_TIME_FORMAT"] = (!!params["DATE_TIME_FORMAT"] ? params["DATE_TIME_FORMAT"] : 'd F Y G:i');
		params["TIME_FORMAT"] = (!!params["DATE_TIME_FORMAT"] && params["DATE_TIME_FORMAT"].indexOf('a') >= 0 ? 'g:i a' : 'G:i');
		var ii = 0, res = (!!data && !!data["messageFields"] ? data["messageFields"] : data),
			replacement = {
				"ID" : '',
				"FULL_ID" : '',
				"ENTITY_XML_ID" : '',
				"NEW" : "old",
				"APPROVED" : 'Y',
				"DATE" : '',
				"TEXT" : '',
				"CLASSNAME" : '',
				"VIEW_URL" : '',
				"VIEW_SHOW" : 'N',
				"EDIT_URL" : '',
				"EDIT_SHOW" : 'N',
				"MODERATE_URL" : '',
				"MODERATE_SHOW" : 'N',
				"DELETE_URL" : '',
				"DELETE_SHOW" : 'N',
				"BEFORE_HEADER" : '',
				"BEFORE_ACTIONS" : '',
				"AFTER_ACTIONS" : '',
				"AFTER_HEADER" : '',
				"BEFORE" : '',
				"AFTER" : '',
				"AUTHOR_ID" : 0,
				"AUTHOR_AVATAR_IS" : 'N',
				"AUTHOR_AVATAR" : '',
				"AUTHOR_URL" : '',
				"AUTHOR_NAME" : '',
				"BEFORE_RECORD" : '',
				"AFTER_RECORD" : '',
				"AUTHOR_EXTRANET_STYLE" : ''
			},
			txt = BX.message("MPL_RECORD_TEMPLATE");
		if (!!res && !!data["messageFields"])
		{
			res["URL"] = (!!res["URL"] ? res["URL"] : {});
			res["AUTHOR"] = (!!res["AUTHOR"] ? res["AUTHOR"] : {});
			res["PANELS"] = (!!res["PANELS"] ? res["PANELS"] : {});
			replacement = {
				"ID" : res["ID"],
				"FULL_ID" : res["FULL_ID"].join('-'),
				"ENTITY_XML_ID" : res["ENTITY_XML_ID"],
				"NEW" : res["NEW"] == "Y" ? "new" : "old",
				"APPROVED" : (res["APPROVED"] != "Y" ? "hidden" : "approved"),
				"DATE" : res["POST_DATE"],
				"TEXT" : res["POST_MESSAGE_TEXT"],
				"CLASSNAME" : (res["CLASSNAME"] ? " " + res["CLASSNAME"] : ""),
				"VIEW_URL" : res["URL"]["LINK"],
				"VIEW_SHOW" : (!!res["URL"]["LINK"] ? "Y" : "N"),
				"EDIT_URL" : res["URL"]["EDIT"],
				"EDIT_SHOW" : (!!res["PANELS"]["EDIT"] && !!res["URL"]["EDIT"] ? res["PANELS"]["EDIT"] : "N"),
				"MODERATE_URL" : res["URL"]["MODERATE"],
				"MODERATE_SHOW" : (!!res["PANELS"]["MODERATE"] && !!res["URL"]["MODERATE"] ? res["PANELS"]["MODERATE"] : "N"),
				"DELETE_URL" : res["URL"]["DELETE"],
				"DELETE_SHOW" : (!!res["PANELS"]["DELETE"] && !!res["URL"]["DELETE"] ? res["PANELS"]["DELETE"] : "N"),
				"BEFORE_HEADER" : res['BEFORE_HEADER'],
				"BEFORE_ACTIONS" : res['BEFORE_ACTIONS'],
				"AFTER_ACTIONS" : res['AFTER_ACTIONS'],
				"AFTER_HEADER" : res['AFTER_HEADER'],
				"BEFORE" : res['BEFORE'],
				"AFTER" : res['AFTER'],
				"BEFORE_RECORD" : res['BEFORE_RECORD'],
				"AFTER_RECORD" : res['AFTER_RECORD'],
				"AUTHOR_ID" : res["AUTHOR"]["ID"],
				"AUTHOR_AVATAR_IS" : (!!res["AUTHOR"]["AVATAR"] ? "Y" : "N"),
				"AUTHOR_AVATAR" : (!!res["AUTHOR"]["AVATAR"] ? res["AUTHOR"]["AVATAR"] : '/bitrix/images/1.gif'),
				"AUTHOR_URL" : window.mplReplaceUserPath(res["AUTHOR"]["URL"]),
				"AUTHOR_NAME" : res["AUTHOR"]["NAME"],
				"AUTHOR_EXTRANET_STYLE" : (!!res["AUTHOR"]["IS_EXTRANET"] ? ' feed-com-name-extranet' : '')
			};
			if (!!res["POST_TIMESTAMP"])
			{
				res["POST_TIMESTAMP"] = parseInt(res["POST_TIMESTAMP"]) + parseInt(BX.message('USER_TZ_OFFSET')) + parseInt(BX.message('SERVER_TZ_OFFSET'));
				if (BX.date.format("d F Y", res["POST_TIMESTAMP"]) == BX.date.format("d F Y"))
					replacement["DATE"] = BX.date.format(params["TIME_FORMAT"], res["POST_TIMESTAMP"], false, true);
				else
					replacement["DATE"] = BX.date.format(params["DATE_TIME_FORMAT"], res["POST_TIMESTAMP"], false, true);
			}
			if (!!params["RIGHTS"])
			{
				var acts = ["MODERATE", "EDIT", "DELETE"], act = '';
				for (ii in acts)
				{
					act = acts[ii];
					if (!!params["RIGHTS"][act] && params["RIGHTS"][act] != "N" && !!replacement[act + "_URL"]) {
						if ((params["RIGHTS"][act] == "OWN" || params["RIGHTS"][act] == "OWNLAST") &&
							parseInt(BX.message("USER_ID")) > 0 && BX.message("USER_ID") == res["AUTHOR"]["ID"]
							|| params["RIGHTS"][act] == "ALL" || params["RIGHTS"][act] == "Y")
						{
							replacement[act + "_SHOW"] = "Y";
						}
					}
				}
			}
		}
		else
		{
			for (ii in replacement)
			{
				replacement[ii] = (!!data[ii] ? data[ii] : replacement[ii]);
			}
		}
		for (ii in replacement)
		{
			replacement[ii] = (!!replacement[ii] ? replacement[ii] : '');
		}
		replacement["SHOW_POST_FORM"] = (!!BX('record-' + replacement["ENTITY_XML_ID"] + '-0-placeholder') ? "Y" : "N");
		for (var ij in replacement)
		{
			eval('txt = txt.replace(/\#' + ij + '\#/g, replacement[ij])');
		}
		return txt;
	};
	window["fcPull"] = function(ENTITY_XML_ID, data) {
		BX.ajax({
			url: '/bitrix/components/bitrix/main.post.list/templates/.default/component_epilog.php',
			method: 'POST',
			data: {
				AJAX_POST :  "Y",
				ENTITY_XML_ID : ENTITY_XML_ID,
				MODE : "PUSH&PULL",
				sessid : BX.bitrix_sessid(),
				DATA : data
			}
		});
	};

	BX.addCustomEvent(window, 'OnUCCommentWasPulled', function(id) {
		window["UC"]["PULLED"] = (!!window["UC"]["PULLED"] ? window["UC"]["PULLED"] : []);
		window["UC"]["PULLED"].push(id);
		if (!window["UC"]["PULLEDScreenData"]) {
			var scroll = BX.GetWindowScrollPos();
			window["UC"]["PULLEDScreenData"] = {
				scrollTop : scroll.scrollTop,
				time : new Date().getTime()
			};
		}
		window["UC"]["PULLEDScreenData"]["checked"] = false;
		window["UC"]["PULLEDTimeout"] = (!!window["UC"]["PULLEDTimeout"] ? window["UC"]["PULLEDTimeout"] : 0);
		if (window["UC"]["PULLEDTimeout"] <= 0)
			window["UC"]["PULLEDTimeout"] = setTimeout(markReadComments, 1000);
	});
	window.markReadComments = function() {
		var scroll = BX.GetWindowScrollPos();
		if(scroll.scrollTop != window["UC"]["PULLEDScreenData"]["scrollTop"])
		{
			window["UC"]["PULLEDScreenData"]["time"] = new Date().getTime();
			window["UC"]["PULLEDScreenData"]["scrollTop"] = scroll.scrollTop;
			window["UC"]["PULLEDScreenData"]["checked"] = false;
		}
		else if(!window["UC"]["PULLEDScreenData"]["checked"] &&
			(new Date().getTime() - window["UC"]["PULLEDScreenData"]["time"] > 3000))
		{
			window["UC"]["PULLEDScreenData"]["time"] = new Date().getTime();
			window["UC"]["PULLEDScreenData"]["checked"] = true;

			var commentsReadToCounter = 0,
				size = BX.GetWindowInnerSize(),
				res = [];
			for(var i = 0; i < window["UC"]["PULLED"].length; i++)
			{
				var
					node = BX('record-' + window["UC"]["PULLED"][i].join('-') + '-cover'),
					pos = BX.pos(node);
				if (pos.top >= scroll.scrollTop && pos.top <= (scroll.scrollTop +size.innerHeight - 20))
				{
					BX.fx.colorAnimate.addRule('animationRule3',"#fbf2c8","#fdf9e5", "background-color", 50, 20, false);
					BX.fx.colorAnimate(BX.findChild(node, {className: 'feed-com-block'}, true, false), 'animationRule3');
					BX.removeClass(node, 'comment-new-answer');
					commentsReadToCounter++;
				}
				else
				{
					res.push(window["UC"]["PULLED"][i]);
				}
			}
			window["UC"]["PULLED"] = res;
			if(commentsReadToCounter > 0)
				BX.onCustomEvent(window, 'onCounterDecrement', [commentsReadToCounter]);
		}

		if (window["UC"]["PULLED"].length > 0)
			window["UC"]["PULLEDTimeout"] = setTimeout(markReadComments, 1000);
		else
			window["UC"]["PULLEDTimeout"] = 0;
	};
	var MPLQuote = function(params) {
		this.params = params;
		this.id = params["id"];
		this.closeByEsc = !!params["closeByEsc"];
		this.autoHide = !!params["autoHide"];
		this.autoHideTimeout = (!!params["autoHideTimeout"] ? parseInt(params["autoHideTimeout"]) : 0);

		if (this.params.classEvents)
		{
			for (var eventName in this.params.classEvents)
				if (this.params.classEvents.hasOwnProperty(eventName))
					BX.addCustomEvent(this, eventName, this.params.classEvents[eventName]);
		}

		this.node = document.createElement("A");
		BX.adjust(this.node, {
			props : {
				id : this.id
			},
			style : {
				zIndex: BX.PopupWindow.getOption("popupZindex") + this.params.zIndex,
				position: "absolute",
				display: "none",
				top: "0px",
				left: "0px"
			},
			attrs : {
				"className" : "mpl-quote-block",
				href : "javascript:void(0);"
			},
			events : this.params.events
		});

		document.body.appendChild(this.node);
	};

	MPLQuote.prototype = {
		show : function(e){
			var pos = this.getPosition(this.node, e);
			BX.adjust(this.node, {style : {top : pos.y + 'px', left : pos.x + 'px', display : 'block'}});
			BX.addClass(this.node, "mpl-quote-block-show");
			if (this.closeByEsc && !this.isCloseByEscBinded)
			{
				this.isCloseByEscBinded = BX.delegate(this._onKeyUp, this);
				BX.bind(document, "keyup", this.isCloseByEscBinded);
			}

			if (this.params.autoHide && !this.isAutoHideBinded)
			{
				setTimeout(
					BX.proxy(function() {
						BX.bind(this.node, "click", this.cancelBubble);
						this.isAutoHideBinded = BX.delegate(this.hide, this);
						BX.bind(document, "click", this.isAutoHideBinded);
					}, this), 0
				);
			}

			if (this.autoHideTimeout > 0 && this.autoHideTimeoutInt <= 0)
			{
				if (!this.autoHideTimeoutBinded)
					this.autoHideTimeoutBinded = BX.delegate(this.hide, this);
				this.autoHideTimeoutInt = setTimeout(this.autoHideTimeoutBinded, this.autoHideTimeout);
			}
		},
		hide : function(event) {
			if (!this.isShown())
				return;

			if (event && !(BX.getEventButton(event)&BX.MSLEFT))
				return true;

			this.node.style.display = "none";

			if (this.isCloseByEscBinded)
			{
				BX.unbind(document, "keyup", this.isCloseByEscBinded);
				this.isCloseByEscBinded = false;
			}

			if (this.autoHideTimeout > 0)
			{
				clearTimeout(this.autoHideTimeoutInt);
				this.autoHideTimeoutInt = 0;
			}
			setTimeout(BX.proxy(this._hide, this), 0);
		},
		_hide : function()
		{
			BX.onCustomEvent(this, "onQuoteHide", [this]);
			if (this.params.autoHide && this.isAutoHideBinded)
			{
				BX.unbind(this.node, "click", this.cancelBubble);
				BX.unbind(document, "click", this.isAutoHideBinded);
				this.isAutoHideBinded = false;
			}
			BX.remove(this.node);
		},
		getPosition : function(node, e) {
			var nodePos;
			if (e.pageX == null) {
				var doc = document.documentElement, body = document.body;
				var x = e.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc.clientLeft || 0);
				var y = e.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc.clientTop || 0);
				nodePos = {x: x, y: y};
			} else {
				nodePos = {x: e.pageX, y: e.pageY};
			}
			return {'x': nodePos.x + 5, 'y':nodePos.y - 16};
		},
		isShown : function()
		{
			return this.node.style.display == "block";
		},
		cancelBubble : function(event)
		{
			if(!event)
				event = window.event;

			if (event.stopPropagation)
				event.stopPropagation();
			else
				event.cancelBubble = true;
		},
		_onKeyUp : function(event)
		{
			event = event || window.event;
			if (event.keyCode == 27)
				this.hide(event);
		}
	}

	window.mplCheckForQuote = function(e, node, ENTITY_XML_ID, author_id) {
		e = (document.all ? window.event : e);
		var text = '', range, author = null;

		if (window.getSelection) {
			range = window.getSelection();
			text = range.toString();
		} else if (document.selection) {
			range = document.selection;
			text = range.createRange().text;
		}
		if (text != "")
		{
			var endParent = BX.findParent(range.focusNode, {"tagName" : node.tagName, "className" : node.className}, node),
				startParent = BX.findParent(range.anchorNode, {"tagName" : node.tagName, "className" : node.className}, node);
			if (endParent != startParent || endParent != node) {
				text = "";
			} else {
				if (!!author_id && BX(author_id, true))
				{
					var tmp = BX(author_id, true);
					if (!!tmp && tmp.hasAttribute("bx-post-author-id"))
					{
						author = {
							id : parseInt(tmp.getAttribute("bx-post-author-id")),
							name : tmp.innerHTML
						}
					}
				}
			}
		}
		if (text != "") {
			BX.onCustomEvent(window, "onQuote" + ENTITY_XML_ID, [e, {text : text, author : author}]);
			return true;
		}
		return false;
	};

	window.mplReplaceUserPath = function(text) {
		if (
			typeof text != 'string'
			|| text.length <= 0
		)
		{
			return '';
		}

		if (BX('MPL_IS_EXTRANET_SITE') == 'Y')
		{
			text = text.replace('/company/personal/user/', '/extranet/contacts/personal/user/');
		}
		else
		{
			text = text.replace('/extranet/contacts/personal/user/', '/company/personal/user/');
		}

		text = text.replace(
			new RegExp("[\\w\/]*\/mobile\/users\/\\?user_id=(\\d+)", 'igm'), 
			(
				BX('MPL_IS_EXTRANET_SITE') == 'Y' 
					? '/extranet/contacts/personal/user/$1/' 
					: '/company/personal/user/$1/'
			)
		);

		return text;
	};

})(window);