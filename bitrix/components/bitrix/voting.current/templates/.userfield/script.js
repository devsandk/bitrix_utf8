;(function(window)
{
if (top.BVotedUser)
	return true;

	top.voteGetID = function()
	{
		return 'vote' + new Date().getTime();
	};

	top.FormToArray = function(form, data)
	{
		data = (!!data ? data : []);
		if(!!form)
		{
			var
				i,
				_data = [],
				n = form.elements.length;

			for(i=0; i<n; i++)
			{
				var el = form.elements[i];
				if (el.disabled)
					continue;
				switch(el.type.toLowerCase())
				{
					case 'text':
					case 'textarea':
					case 'password':
					case 'hidden':
					case 'select-one':
						_data.push({name: el.name, value: el.value});
						break;
					case 'radio':
					case 'checkbox':
						if(el.checked)
							_data.push({name: el.name, value: el.value});
						break;
					case 'select-multiple':
						for (var j = 0; j < el.options.length; j++)
						{
							if (el.options[j].selected)
								_data.push({name : el.name, value : el.options[j].value});
						}
						break;
					default:
						break;
				}
			}

			var current = data;
			i = 0;
			while(i < _data.length)
			{
				var p = _data[i].name.indexOf('[');
				if (p == -1)
				{
					current[_data[i].name] = _data[i].value;
					current = data;
					i++;
				}
				else
				{
					var name = _data[i].name.substring(0, p);
					var rest = _data[i].name.substring(p+1);
					if(!current[name])
						current[name] = [];

					var pp = rest.indexOf(']');
					if(pp == -1)
					{
						current = data;
						i++;
					}
					else if(pp == 0)
					{
						//No index specified - so take the next integer
						current = current[name];
						_data[i].name = '' + current.length;
					}
					else
					{
						//Now index name becomes and name and we go deeper into the array
						current = current[name];
						_data[i].name = rest.substring(0, pp) + rest.substring(pp+1);
					}
				}
			}
		}
		return data;
	};

	var lastWaitElement = null;
	/**
	 * @return {boolean || node}
	 */
	top.VCButtonShowWait = function(el)
	{
		if (el.disabled !== true)
		{
			if (el && !BX.type.isElementNode(el))
				el = null;
			el = el || this;
			el = (el ? (el.tagName == "A" ? el : el.parentNode) : el);
			if (el)
			{
				BX.addClass(el, "feed-add-button-load");
				lastWaitElement = el;
				BX.defer(function(){el.disabled = true})();
			}
		}
	};

	/**
	 * @return {boolean}
	 */
	top.VCButtonCloseWait = function(el)
	{
		if (el && !BX.type.isElementNode(el))
			el = null;
		el = el || lastWaitElement || this;
		if (el)
		{
			el.disabled = false ;
			BX.removeClass(el, 'feed-add-button-load');
			lastWaitElement = null;
		}
	};

	top.VCLinkCloseWait = function(el)
	{
		if (top.VCButtonCloseWait(el) === false)
		{
			if (el && !BX.type.isElementNode(el))
				el = null;
			el = el || this;

			if (BX.type.isElementNode(el))
			{
				el.disabled = false;
				el.setAttribute("href", el.getAttribute("rel"));
				BX.removeClass(el, 'bx-vote-loading');
			}
		}
	};

	top.VCLinkShowWait = function(el)
	{
		if (top.VCButtonShowWait(el) === false && el.disabled !== true)
		{
			if (el && !BX.type.isElementNode(el))
				el = null;
			el = el || this;

			if (BX.type.isElementNode(el))
			{
				el.disabled = true;
				BX.defer(function()
				{
					el.setAttribute("rel", el.getAttribute("href"));
					el.setAttribute("href", "javascript:void(0);");
				})();
				BX.addClass(el, 'bx-vote-loading');
			}
		}
	};

	top.voteSendForm = function(link, form, CID)
	{
		if (!!form)
		{
			top.voteAJAX(
				link,
				CID,
				form.action,
				top.FormToArray(form, {'AJAX_POST' : 'Y'}));
		}
	};

	top.voteGetForm = function (link, VOTE_ID, CID)
	{
		var
			url = link.getAttribute('href').
				replace(/.AJAX_RESULT=Y/g,'').
				replace(/.AJAX_POST=Y/g,'').
				replace(/.sessid=[^&]*/g, '').
				replace(/.VOTE_ID=([\d]+)/,'').
				replace(/.view_form=Y/g, '').
				replace(/.view_result=Y/g, ''),
			data = {
				'view_form' : 'Y',
				'VOTE_ID' : VOTE_ID,
				'AJAX_POST' : 'Y',
				'sessid': BX.bitrix_sessid()};
		top.voteAJAX(link, CID, url, data);
		return false;
	};

	top.voteAJAX = function(link, CID, url, data)
	{
		if (link.disabled === true)
			return false;
		top.VCLinkShowWait(link);
		BX.ajax({
			'method': 'POST',
			'processData': false,
			'url': url,
			'data': data,
			'onsuccess': function(result)
			{
				top.VCLinkCloseWait(link);

				var
					ob = BX.processHTML(result, false),
					res = BX.findParent(link, {"className" : "bx-vote-block"});

				if (!!res)
				{
					res.innerHTML = ob.HTML;

					BX.removeClass(res, "bx-vote-block-result");
					BX.removeClass(res, "bx-vote-block-result-view");

					if (ob.HTML.indexOf('<form') < 0)
					{
						BX.addClass(res, "bx-vote-block-result");
					}
					BX.defer(function()
					{
						BX.ajax.processScripts(ob.SCRIPT);
					})();
				}
				if (!!window['BVote' + CID])
				{
					window['BVote' + CID].__destruct();
					window['BVote' + CID] = null;
				}
			}
		});
		return true;
	};

	top.voteGetResult = function (controller, uid, link)
	{
		top.VCLinkShowWait(link);

		BX.addCustomEvent(
			controller,
			'OnBeforeChangeData',
			function()
			{
				var res = BX.findParent(controller, {"className" : "bx-vote-block"});
				BX.addClass(res, "bx-vote-block-result");
				top.VCLinkCloseWait(link);
			}
		);

		BX.addCustomEvent(
			controller,
			'OnAfterChangeData',
			function()
			{
				if (!!link)
					BX.hide(link);
			}
		);

		window['BVote' + uid].send(true);

		return false;
	};

	top.BVotedUser = function(params)
	{
		this.CID = params["CID"];
		this.url = params["url"];
		this.urlTemplate = params["urlTemplate"];
		this.nameTemplate = params["nameTemplate"];
		this.dateTemplate = params["dateTemplate"];
		this.data = {};
		this.popup = null;
		this.controller = params["controller"];
		this.startCheck = (!!params["startCheck"] ? parseInt(params["startCheck"]) : false);
		this.voteId = params["voteId"];
		this.status = "ready";
		this.__construct();
	};

	top.BVotedUser.prototype.__construct = function()
	{
		var res = BX.findChildren(this.controller, {"tagName" : "A", "className" : "bx-vote-voted-users"}, true), ii,
			f = BX.delegate(function() { this.get(); }, this);
		for (ii in res)
		{
			if (res.hasOwnProperty(ii))
			{
				BX.bind(res[ii], "click", f);
				//BX.bind(res[ii], "mouseover", BX.proxy(function(e) { this.init(e); }, this));
				//BX.bind(res[ii], "mouseout", BX.proxy(function(e) { this.init(e); }, this));
			}
		}

		this.onPullEvent = BX.delegate(function(command, params)
		{
			if (command == 'voting' && !!params && params["VOTE_ID"] == this.voteId)
			{
				var res = BX.findParent(this.controller, {"className" : "bx-vote-block"});
				if (!!res && BX.hasClass(res, "bx-vote-block-result"))
					this.send();
			}
		}, this);
		BX.addCustomEvent("onPullEvent-vote", this.onPullEvent);
	};

	top.BVotedUser.prototype.__destruct = function()
	{
		var res = BX.findChildren(this.controller, {"tagName" : "A", "className" : "bx-vote-voted-users"}, true), ii;
		if (!!res)
		{
			for (ii in res)
			{
				if (res.hasOwnProperty(ii))
				{
					BX.unbindAll(res[ii]);
				}
			}
		}
		BX.removeCustomEvent("onPullEvent", this.onPullEvent);
	};

	top.BVotedUser.prototype.init = function(e)
	{
		var node = BX.proxy_context;
		if (!!node.timeoutOver)
		{
			clearTimeout(node.timeoutOver);
			node.timeoutOver = false;
		}
		if (e.type == 'mouseover')
		{
			node.timeoutOver = setTimeout(BX.proxy(function()
			{
				this.get(node);
				if (this.popup)
				{
					BX.bind(
						this.popup.popupContainer,
						'mouseout',
						BX.proxy(
							function()
							{
								this.popup.timeoutOut = setTimeout(
									BX.proxy(
										function()
										{
											if (this.node == node && !!this.popup)
											{
												this.popup.close();
											}
										}, this),
									400
								);
							},
							this
						)
					);
					BX.bind(
						this.popup.popupContainer,
						'mouseover' ,
						BX.proxy(
							function()
							{
								if (this.popup.timeoutOut)
									clearTimeout(this.popup.timeoutOut);
							},
							this
						)
					);
				}
			}, this), 400);
		}
	};

	top.BVotedUser.prototype.getID = function()
	{
		return 'vote' + new Date().getTime();
	};

	top.BVotedUser.prototype.make = function(data, needToCheckData)
	{
		if (!this.popup)
			return true;
		needToCheckData = (needToCheckData === false);
		var
			res1 = (this.popup && this.popup.contentContainer ? this.popup.contentContainer : BX('popup-window-content-bx-vote-popup-cont-' + this.CID)),
			node = false, res = false, i;
		if (this.popup.isNew)
		{
			node = BX.create("SPAN", {
					props : {className : "bx-ilike-popup"},
					children : [
						BX.create("SPAN", {
							props : {className: "bx-ilike-bottom_scroll"}
						})
					]
				}
			);
			res = BX.create("SPAN", {
				props : {className : "bx-ilike-wrap-block"},
				children : [
					node
				]
			});
		}
		else
		{
			node = BX.findChild(this.popup.contentContainer, {className : "bx-ilike-popup"}, true);
		}
		if (!!node && typeof data.items == "object")
		{
			for (i in data.items)
			{
				if (data.items.hasOwnProperty(i) && !BX.findChild(node, {tag : "A", attr : {id : ("a" + data["answer_id"] + "u" + data.items[i]['ID'])}}, true))
				{
					node.appendChild(
						BX.create("A", {
							attrs : {id : ("a" + data["answer_id"] + "u" + data.items[i]['ID'])},
							props: {href:data.items[i]['URL'], target: "_blank", className: "bx-ilike-popup-img"},
							text: "",
							children: [
								BX.create("SPAN", {
										props: {className: "bx-ilike-popup-avatar"},
										html : data.items[i]['PHOTO']
									}
								),
								BX.create("SPAN", {
										props: {className: "bx-ilike-popup-name"},
										html : data.items[i]['FULL_NAME']
									}
								)
							]
						})
					);
				}
			}
		}
		if (this.popup.isNew)
		{
			this.popup.isNew = false;
			if (!!res1)
			{
				try
				{
					res1.removeChild(res1.firstChild);
				}
				catch(e)
				{

				}
				res1.appendChild(res);
			}
		}

		this.adjustWindow();
		if (needToCheckData)
			this.popupScroll();
		return true;
	};

	top.BVotedUser.prototype.show = function()
	{
		if (this.popup != null && this.node.id != this.popup.nodeID)
			this.popup.close();

		if (this.popup == null)
		{
			this.popup = new BX.PopupWindow('bx-vote-popup-cont-' + this.CID, this.node, {
				lightShadow : true,
				offsetTop: -2,
				offsetLeft: 3,
				autoHide: true,
				closeByEsc: true,
				bindOptions: {position: "top"},
				events : {
					onPopupClose : function() { this.destroy() },
					onPopupDestroy : BX.proxy(function() { this.popup = null; }, this)
				},
				content : BX.create("SPAN", { props: {className: "bx-ilike-wait"}})
			});

			this.popup.nodeID = this.node.id;
			this.popup.isNew = true;
			this.popup.show();
		}
		this.popup.setAngle({position:'bottom'});
		this.adjustWindow();
	};

	top.BVotedUser.prototype.adjustWindow = function()
	{
		if (this.popup != null)
		{
			this.popup.bindOptions.forceBindPosition = true;
			this.popup.adjustPosition();
			this.popup.bindOptions.forceBindPosition = false;
		}
	};
	top.BVotedUser.prototype.popupScroll = function()
	{
		if (this.popup)
		{
			var res = BX.findChild(this.popup.contentContainer, {"className" : "bx-ilike-popup"}, true);
			BX.bind(res, 'scroll' , BX.proxy(this.popupScrollCheck, this));
		}
	};

	top.BVotedUser.prototype.popupScrollCheck = function()
	{
		var res = BX.proxy_context;
		if (res.scrollTop > (res.scrollHeight - res.offsetHeight) / 1.5)
		{
			BX.unbind(res, 'scroll' , BX.proxy(this.popupScrollCheck, this));
			this.get(this.popup.bindElement);
		}
	};

	top.BVotedUser.prototype.get = function(node)
	{
		this.node = (!!node ? node : BX.proxy_context);
		if (!this.node)
			return false;
		if (!this.node.getAttribute("id"))
			this.node.setAttribute("id", this.getID());
		if ((!this.node.getAttribute("rel") && !this.node.getAttribute("rev")) || parseInt(this.node.innerHTML) <= 0)
			return false;

		if (this.node.getAttribute("status") === "busy")
			return false;
		if (!this.node.getAttribute("inumpage"))
			this.node.setAttribute("inumpage", "1");
		else if (this.node.getAttribute("inumpage") != "done")
			this.node.setAttribute("inumpage", (parseInt(this.node.getAttribute("inumpage")) + 1) + "");

		this.show();

		if (this.data[this.node.getAttribute("id")])
			this.make(this.data[this.node.getAttribute("id")], (this.node.getAttribute("inumpage") != "done"));

		if (this.node.getAttribute("inumpage") != "done")
		{
			this.node.setAttribute("status", "busy");
			BX.ajax({
				url: "/bitrix/components/bitrix/voting.current/templates/.userfield/users.php",
				method: 'POST',
				dataType: 'json',
				data: {
					'ID' : this.node.getAttribute("rel"),
					'answer_id'  : this.node.getAttribute("rev"),
					'request_id' : this.node.getAttribute("id"),
					'iNumPage' : this.node.getAttribute("inumpage"),
					'URL_TEMPLATE' : this.urlTemplate,
					'NAME_TEMPLATE' : this.nameTemplate,
					'sessid': BX.bitrix_sessid()
				},
				onsuccess: BX.proxy(function(data) {
					if (!!data && !!data.items)
					{
						data["StatusPage"] = (!!data["StatusPage"] ? data["StatusPage"] : false);
						if (data.StatusPage == "done" || data.items.length <= 0)
							this.node.setAttribute("inumpage", "done");
						var res, items = (this.data[this.node.getAttribute("id")] ? this.data[this.node.getAttribute("id")]["items"] : []);
						for (res=0; res<data.items.length; res++)
						{
							items.push(data.items[res]);
						}

						this.data[this.node.getAttribute("id")] = data;
						this.data[this.node.getAttribute("id")]["items"] = items;

						this.make(this.data[this.node.getAttribute("id")], (this.node.getAttribute("inumpage") != "done"));
					}
					this.node.setAttribute("status", "ready");
				}, this),
				onfailure: BX.proxy(function() { this.node.setAttribute("status", "ready"); }, this)
			});
		}
		return true;
	};
	top.BVotedUser.prototype.send = function()
	{
		if (this.status === "ready")
		{
			this.status = "busy";
			BX.ajax({
				url: this.url.replace(/.AJAX_RESULT=Y/g,'').
					replace(/.AJAX_POST=Y/g,'').
					replace(/.sessid=[^&]*/g, '').
					replace(/.VOTE_ID=([\d]+)/,'').
					replace(/.view_form=Y/g, '').
					replace(/.view_result=Y/g, ''),
				method: 'POST',
				dataType: 'json',
				data: {
					'VOTE_ID' : this.voteId,
					'AJAX_RESULT' : 'Y',
					'view_result' : 'Y',
					'sessid': BX.bitrix_sessid()
				},
				onsuccess: BX.proxy(function(data) { this.changeData(data);this.status = "ready"; }, this),
				onfailure: BX.proxy(function() { this.status = "ready"; }, this)
			});
		}
	};
	top.BVotedUser.prototype.changeData = function(data)
	{
		data = data["QUESTIONS"];
		BX.onCustomEvent(this.controller, 'OnBeforeChangeData');
		var question, answer, i, q, per;
		for (q in data)
		{
			if (data.hasOwnProperty(q))
			{
				question = BX.findChild(this.controller, {"attr" : {"id" : "question" + q}}, true);
				if (!!question)
				{
					for (i in data[q])
					{
						if (data[q].hasOwnProperty(i))
						{
							answer = BX.findChild(question, {"attr" : {"id" : ("answer" + i)}}, true);
							if (!!answer)
							{
								per = parseInt(data[q][i]["PERCENT"]);
								per = (isNaN(per) ? 0 : per);
								BX.adjust(BX.findChild(answer, {"tagName" : "A", "className" : "bx-vote-voted-users"}, true),
									{"attrs" : {"id" : "", "rel" : data[q][i]["USERS"], "rev" : i, "inumpage" : false},
										"html" : data[q][i]["COUNTER"]});
								BX.adjust(BX.findChild(answer, {"tagName" : "SPAN", "className" : "bx-vote-data-percent"}, true),
									{"html" : per + '%'});
								BX.adjust(BX.findChild(answer, {"tagName" : "DIV", "className" : "bx-vote-result-bar"}, true),
									{"style" : {"width" : per + '%'}});
							}
						}
					}
				}
			}
		}
		BX.onCustomEvent(this.controller, 'OnAfterChangeData');
	};
})(window);