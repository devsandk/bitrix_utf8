;(function(window){
	if (window.BX["UploaderQueue"])
		return false;
	var
		BX = window.BX,
		statuses = { "new" : 0, ready : 1, preparing : 2, inprogress : 3, done : 4, failed : 5, stopped : 6, changed : 7, uploaded : 8};
	/**
	 * @return {BX.UploaderQueue}
	 * @params array
	 * @params[placeHolder] - DOM node to append files /OL or UL/
	 */
	BX.UploaderQueue = function (params, limits, caller)
	{
		this.dialogName = "BX.UploaderQueue";
		limits = (!!limits ? limits : {});

		this.limits = {
			phpPostMaxSize : limits["phpPostMaxSize"],
			phpUploadMaxFilesize : limits["phpUploadMaxFilesize"],
			uploadMaxFilesize : (limits["uploadMaxFilesize"] > 0 ? limits["uploadMaxFilesize"] : 0),
			uploadFileWidth : (limits["uploadFileWidth"] > 0 ? limits["uploadFileWidth"] : 0),
			uploadFileHeight : (limits["uploadFileHeight"] > 0 ? limits["uploadFileHeight"] : 0)};

		this.placeHolder = BX(params["placeHolder"]);
		this.showImage = (params["showImage"] !== false);

		this.uploader = caller;
		this.itForUpload = new BX.UploaderUtils.Hash();
		this.items = new BX.UploaderUtils.Hash();
		this.itUploaded = new BX.UploaderUtils.Hash();
		this.itFailed = new BX.UploaderUtils.Hash();
		this.thumb = { tagName : "LI", className : "bx-bxu-thumb-thumb"};
		if (!!params["thumb"])
		{
			for (var ii in params["thumb"])
			{
				if (params["thumb"].hasOwnProperty(ii) && this.thumb.hasOwnProperty(ii))
				{
					this.thumb[ii] = params["thumb"][ii];
				}
			}
		}

		BX.addCustomEvent(caller, "onItemIsAdded", BX.delegate(this.addItem, this));
		BX.addCustomEvent(caller, "onItemsAreAdded", BX.delegate(this.finishQueue, this));

		BX.addCustomEvent(caller, "onFileIsDeleted", BX.delegate(this.deleteItem, this));
		this.log('Initialized');
		return this;
	};
	BX.UploaderQueue.prototype = {
		showError : function(text) { this.log('Error! ' + text); },
		log : function(text)
		{
			BX.UploaderUtils.log('queue', text);
		},
		addItem : function (file, being) {
			var params = {copies : this.uploader.fileCopies, fields : this.uploader.fileFields},
				res = (this.showImage && (!!file["type"] && file.type.indexOf("image/") === 0 || !!file["fileType"] && file.fileType.indexOf("image/") === 0) ?
					new BX.UploaderImage(file, params, this.limits, this.uploader) :
					new BX.UploaderFile(file, params, this.limits, this.uploader)),
					children, node;

			this.items.setItem(res.id, res);
			if (!!being)
			{
				this.itUploaded.setItem(res.id, res);
			}
			else
			{
				this.itForUpload.setItem(res.id, res);
			}
			if (!!this.placeHolder)
			{
				if (BX(being))
				{
					res.thumbNode = node = BX(being);
				}
				else
				{
					children = res.makeThumb();
					node = BX.create(this.thumb.tagName, {
						attrs : {
							id : res.id + 'Item',
							'bx-bxu-item-id' : res.id,
							className : this.thumb.className}
					});
					if (BX.type.isNotEmptyString(children))
					{
						if (this.thumb.tagName == 'TR')
						{
							children = children.replace(/[\n\t]/gi, "").replace(/^(\s+)(.*?)/gi, "$2").replace(/(.*?)(\s+)$/gi, "$1");
							if (!!children["trim"])
								children = children.trim();
							var replaceFunction = function(str, tdParams, tdInnerHTML)
							{
								var td = node.insertCell(-1),
									attrs = {
										colspan : true,
										headers : true,
										accesskey : true,
										"class" : true,
										contenteditable : true,
										contextmenu : true,
										dir : true,
										hidden : true,
										id : true,
										lang : true,
										spellcheck : true,
										style : true,
										tabindex : true,
										title : true,
										translate : true
									}, param;
								td.innerHTML = tdInnerHTML;
								tdParams = tdParams.split(" ");
								while ((param = tdParams.pop()) && param)
								{
									param = param.split("=");
									if (param.length == 2)
									{
										param[0] = param[0].replace(/^(\s+)(.*?)/gi, "$2").replace(/(.*?)(\s+)$/gi, "$1").replace(/^["'](.*?)["']$/gi, "$1");
										param[1] = param[1].replace(/^(\s+)(.*?)/gi, "$2").replace(/(.*?)(\s+)$/gi, "$1").replace(/^["'](.*?)["']$/gi, "$1");
										if (attrs[param[0]] === true)
											td.setAttribute(param[0], param[1]);
										else
											td[param[0]] = param[1];
									}
								}
								return "";
							}, regex = /^<td(.*?)>(.*?)<\/td>/i;
							window.data1 = children;
							while (regex.test(children))
								children = children.replace(regex, replaceFunction);
						}
						else
						{
							node.innerHTML = children;
						}
					}
					else if (BX.type.isDomNode(children))
					{
						BX.adjust(node, { children : [children] } );
					}
				}

				if (!!window["jsDD"])
				{
					if (!this._onbxdragstart)
					{
						this._onbxdragstart = BX.delegate(this.onbxdragstart, this);
						this._onbxdragstop = BX.delegate(this.onbxdragstop, this);
						this._onbxdrag = BX.delegate(this.onbxdrag, this);
						this._onbxdraghout = BX.delegate(this.onbxdraghout, this);
						this._onbxdestdraghover = BX.delegate(this.onbxdestdraghover, this);
						this._onbxdestdraghout = BX.delegate(this.onbxdestdraghout, this);
						this._onbxdestdragfinish = BX.delegate(this.onbxdestdragfinish, this);
					}
					BX.addClass(node, "bx-drag-draggable");
					node.onbxdragstart = this._onbxdragstart;
					node.onbxdragstop = this._onbxdragstop;
					node.onbxdrag = this._onbxdrag;
					node.onbxdraghout = this._onbxdraghout;
					window.jsDD.registerObject(node);

					node.onbxdestdraghover = this._onbxdestdraghover;
					node.onbxdestdraghout = this._onbxdestdraghout;
					node.onbxdestdragfinish = this._onbxdestdragfinish;
					window.jsDD.registerDest(node);
				}
				if (BX(being))
				{
					BX.onCustomEvent(this.uploader, "onFileIsBound", [res.id, res, this.caller, being]);
					BX.onCustomEvent(res, "onFileIsBound", [res.id, res, this.caller, being]);
				}
				else if (!!being)
				{
					this.placeHolder.appendChild(node);
					BX.onCustomEvent(this.uploader, "onFileIsAttached", [res.id, res, this.caller, being]);
					BX.onCustomEvent(res, "onFileIsAttached", [res.id, res, this.caller, being]);
				}
				else
				{
					this.placeHolder.appendChild(node);
					BX.onCustomEvent(this.uploader, "onFileIsAppended", [res.id, res, this.caller]);
					BX.onCustomEvent(res, "onFileIsAppended", [res.id, res, this.caller]);
				}
			}
			BX.onCustomEvent(this.uploader, "onQueueIsChanged", [this, "add", res.id, res]);
		},
		getItem : function(id)
		{
			var item = this.items.getItem(id);
			return {item : item, node : (item.thumbNode || BX(id + 'Item'))};
		},
		onbxdragstart : function() {
			var item = BX.proxy_context;
			item.__dragCopyDiv = BX.create('DIV', {
				attrs : {
					className : "bx-drag-object"
				},
				style : {
					position : "absolute",
					zIndex : 10,
					width : item.clientWidth + 'px'
				},
				html : item.innerHTML
			});

			document.body.appendChild(item.__dragCopyDiv);
			BX.addClass(item, "bx-drag-source");
			return true;
		},
		onbxdragstop : function() {
			var item = BX.proxy_context;
			BX.removeClass(item, "bx-drag-source");
			if (!!item.__dragCopyDiv)
			{
				item.__dragCopyDiv.parentNode.removeChild(item.__dragCopyDiv);
				item.__dragCopyDiv = null;
			}
			return true;
		},
		onbxdrag : function(x, y) {
			var item = BX.proxy_context, div = item.__dragCopyDiv;
			div.style.left = x + 'px';
			div.style.top = y + 'px';
		},
		onbxdraghout : function(currentNode, x, y) {
		},
		onbxdestdraghover : function() {
			var item = BX.proxy_context;
			BX.addClass(item, "bx-drag-over");
			return true;
		},
		onbxdestdraghout : function() {
			var item = BX.proxy_context;
			BX.removeClass(item, "bx-drag-over");
			return true;
		},
		onbxdestdragfinish : function(currentNode) {
			var item = BX.proxy_context;
			BX.removeClass(item, "bx-drag-over");
			if(item == currentNode)
				return true;
			else
			{
				var obj = item.parentNode,
					n = obj.childNodes.length;

				for (var j=0; j<n; j++)
				{
					if (obj.childNodes[j] == item)
						item.number = j;
					else if (obj.childNodes[j] == currentNode)
						currentNode.number = j;

					if (currentNode.number > 0 && item.number > 0)
						break;
				}
				if (this.itForUpload.hasItem(currentNode.getAttribute("bx-bxu-item-id")))
				{
					var act = (item.number <= currentNode.number ? "beforeItem" : (
						item.nextSibling ? "afterItem" : "inTheEnd")), it = null;
					if (act != "inTheEnd")
					{
						for (j = item.number + (act == "beforeItem" ? 0 : 1); j < n; j++)
						{
							if (this.itForUpload.hasItem(obj.childNodes[j].getAttribute("bx-bxu-item-id")))
							{
								it = obj.childNodes[j].getAttribute("bx-bxu-item-id");
								break;
							}
						}
						if (it === null)
							act = "inTheEnd";
					}
					var buff = this.itForUpload.removeItem(currentNode.getAttribute("bx-bxu-item-id"));
					if (act != "inTheEnd")
						this.itForUpload.insertBeforeItem(buff.id, buff, it);
					else
						this.itForUpload.setItem(buff.id, buff);
				}

				currentNode.parentNode.removeChild(currentNode);
				if (item.number <= currentNode.number)
				{
					item.parentNode.insertBefore(currentNode, item);
				}
				else if (item.nextSibling)
				{
					item.parentNode.insertBefore(currentNode, item.nextSibling);
				}
				else
				{
					item.parentNode.appendChild(currentNode);
				}

			}
			return true;
		},
		deleteItem : function (id, item) {
			if (this.items.hasItem(id))
			{
				var node = BX(id + 'Item');
				if (!!node)
				{
					if (!!window["jsDD"])
					{
						node.onmousedown = null;
						node.onbxdragstart = null;
						node.onbxdragstop = null;
						node.onbxdrag = null;
						node.onbxdraghout = null;
						node.onbxdestdraghover = null;
						node.onbxdestdraghout = null;
						node.onbxdestdragfinish = null;
						node.__bxpos = null;

						window.jsDD.arObjects[node.__bxddid] = null;
						delete window.jsDD.arObjects[node.__bxddid];

						window.jsDD.arDestinations[node.__bxddeid] = null;
						delete window.jsDD.arDestinations[node.__bxddeid];
					}
					BX.unbindAll(node);
					node.parentNode.removeChild(node);
				}

				this.items.removeItem(id);
				this.itUploaded.removeItem(id);
				this.itFailed.removeItem(id);
				this.itForUpload.removeItem(id);
				BX.onCustomEvent(this.uploader, "onQueueIsChanged", [this, "add", id, item]);
				return true;
			}
			return false;
		},
		finishQueue : function()
		{
		},
		clear : function()
		{
			var item;
			while ((item = this.items.getFirst()) && !!item)
				this.deleteItem(item.id, item);
		},
		restoreFiles : function(IDs, restoreError)
		{
			restoreError = (restoreError === true);

			var item, tmp = {}, id, ii;
			for (ii = 0; ii < IDs.length; ii++)
			{
				id = IDs[ii];
				if (this.items.hasItem(id) && (item = this.items.getItem(id)) && !!item &&
					!this.itUploaded.hasItem(item.id) &&
					(!restoreError && !this.itFailed.hasItem(item.id) || restoreError))
				{
					tmp[item.id] = (tmp[item.id] > 0 ? tmp[item.id] : 0);
					tmp[item.id]++;
					if (this.itFailed.hasItem(item.id))
					{
						delete item.uploadStatus;
						delete item.file.uploadStatus;
					}
					this.itFailed.removeItem(item.id);
					this.itForUpload.setItem(item.id, item);
					BX.onCustomEvent(item, "onUploadRestore", [item]);
				}
			}
		}
	};
	return statuses;
}(window));