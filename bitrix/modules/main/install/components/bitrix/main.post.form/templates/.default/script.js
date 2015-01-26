;(function(window){
if (window.LHEPostForm)
	return;

var LHEHandlersRepo = {};
BX.addCustomEvent(window, 'OnEditorInitedBefore', function(editor) {
	if (LHEHandlersRepo[editor.id])
	{
		LHEHandlersRepo[editor.id].OnEditorInitedBefore(editor);
		if (LHEHandlersRepo[editor.id]["params"] && LHEHandlersRepo[editor.id]["params"]['LHEJsObjName']) // for custom templates
			window[LHEHandlersRepo[editor.id].params['LHEJsObjName']] = editor;
	}
});
BX.addCustomEvent(window, 'OnEditorInitedAfter', function(editor){
	if (LHEHandlersRepo[editor.id])
		LHEHandlersRepo[editor.id].OnEditorInitedAfter(editor);
});
BX.util.object_search = function(needle, haystack)
{
	for(var i in haystack)
	{
		if (haystack.hasOwnProperty(i))
		{
			if (haystack[i] == needle)
				return true;
			else if (typeof haystack[i] == "object")
			{
				var result = BX.util.object_search_key(needle, haystack[i]);
				if (result !== false)
					return result;
			}
		}
	}
	return false;
};

var parserClass = function(bxTag, tag, additionalTags)
{
	additionalTags = (additionalTags && additionalTags.length > 0 ? additionalTags : []);
	if (typeof tag == "object" && tag.length > 0)
	{
		var res;
		while((res = tag.pop()) && res && tag.length > 0)
		{
			additionalTags.push(res);
		}
		tag = res;
	}
	additionalTags.push(tag);
	this.exist = true;
	this.bxTag = bxTag;
	this.tag = tag;
	this.tags = additionalTags;
	this.regexp = new RegExp("\\[(" + additionalTags.join("|") + ")=((?:\\s|\\S)*?)(?:\\s*?WIDTH=(\\d+)\\s*?HEIGHT=(\\d+))?\\]", "ig");
	this.code = '[' + tag + '=#ID##ADDITIONAL#]';
	this.wysiwyg = '<span style="color: #2067B0; border-bottom: 1px dashed #2067B0; margin:0 2px;" id="#ID#"#ADDITIONAL#>#NAME#</span>';
};
window.LHEPostForm = function(formID, params)
{
	this.objName = 'PlEditor' + formID;
	this.params = params;

	window[this.objName] = this;

	this.formID = formID;
	this.oEditorId = params['LHEJsObjId'];
	LHEHandlersRepo[this.oEditorId] = this;
	this.oEditor = (window["BXHtmlEditor"] ? window["BXHtmlEditor"].Get(this.oEditorId) : null);
	this.arSize = params['arSize'];
	this.arSize = (typeof this.arSize == "object" && this.arSize && this.arSize.width && this.arSize.height ? this.arSize : false);

	var parsers = (params["parsers"] ? params["parsers"] : {});

	this.parser = {
		postimage : {
			exist : BX.util.object_search('UploadImage', parsers),
			bxTag : 'postimage',
			tag : "IMG ID",
			tags : ["IMG ID"],
			regexp : /\[(IMG ID)=((?:\s|\S)*?)(?:\s*?WIDTH=(\d+)\s*?HEIGHT=(\d+))?\]/ig,
			code : '[IMG ID=#ID##ADDITIONAL#]',
			wysiwyg : '<img id="#ID#" src="' + '#SRC#" lowsrc="' + '#LOWSRC#" ' +
				(this.arSize ? ' style="max-width:' + this.arSize.width + 'px;max-height:' + this.arSize.height +'px;"' : '') + ' title=""#ADDITIONAL# />'
		}
	};
	for (var ii in params["parsers"])
	{
		if (params["parsers"].hasOwnProperty(ii) && /[a-z]/gi.test(ii+''))
		{
			this.parser[ii] = new parserClass(ii, params["parsers"][ii]);
		}
	}
	this.arFiles = {};
	this.eventNode = BX('div' + params['LHEJsObjName']);
	BX.addCustomEvent(this.eventNode, 'OnShowLHE', BX.delegate(this.OnShowLHE, this));
	BX.addCustomEvent(this.eventNode, 'OnButtonClick', BX.delegate(this.OnButtonClick, this));
	BX.addCustomEvent(this.eventNode, 'OnAfterShowLHE', BX.delegate(this.InitCustomEditorEventHandlers, this));

	BX.addCustomEvent(this.eventNode, 'OnAfterShowLHE', function(status, handler) {
		if (handler.oEditor && handler.oEditor["AllowBeforeUnloadHandler"])
			handler.oEditor.AllowBeforeUnloadHandler();
	});
	BX.addCustomEvent(this.eventNode, 'OnAfterHideLHE', function(status, handler) {
		if (handler.oEditor && handler.oEditor["DenyBeforeUnloadHandler"])
			handler.oEditor.DenyBeforeUnloadHandler();
	});


	this.controllers = {'common' : {
		postfix : "",
		storage : "bfile",
		parser : "postimage",
		node : window,
		obj : null,
		init : false
	}};
	this.initFiles(formID, params);
	this.Inited = true;

	BX.onCustomEvent(this, "onInitialized", [this, formID, params, parsers]);
	BX.onCustomEvent(this.eventNode, "onInitialized", [this, formID, params, parsers]);
	if (this.oEditor)
	{
		BX.onCustomEvent(this.oEditor, "OnEditorInitedBefore", [this.oEditor]);
		BX.onCustomEvent(this.oEditor, "OnEditorInitedAfter", [this.oEditor]);
	}
};

window.LHEPostForm.prototype = {
	initFiles : function(formID, params)
	{
		var
			parser,
			cid,
			webdav = false,
			init = false,
			values,
			tmp, tmp2, tmp3 = 0;
		if (params["CID"])
		{
			for (cid in params["CID"])
			{
				if (params["CID"].hasOwnProperty(cid))
				{
					tmp3++;
					parser = params["CID"][cid]["parser"];
					this.controllers[cid] = {
						postfix : (params["CID"][cid]["postfix"] || ""),
						storage : (parser == 'webdav_element' ? 'webdav' : (parser == 'disk_file' ? 'disk' : 'bfile')),
						node : BX((parser == 'webdav_element' ? 'wduf-selectdialog-' : (parser == 'disk_file' ? 'diskuf-selectdialog-' : 'file-selectdialog-')) + cid),
						prefixNode : (parser == 'webdav_element' ? 'wd-doc' : (parser == 'disk_file' ? 'disk-edit-attach' : 'wd-doc')),
						parser : parser,
						obj : null,
						init : false,
						checked : false
					};
					if(parser == 'webdav_element')
					{
						values = BX.findChildren(this.controllers[cid].node, {className : "wd-inline-file"}, true);
					}
					else if(parser == 'disk_file')
					{
						values = BX.findChildren(this.controllers[cid].node, {className : "wd-inline-file"}, true);
					}
					else
					{
						values = BX.findChildren(this.controllers[cid].node, {className : "file-inline-file"}, true);
						if (values)
						{
							tmp2 = [];
							for (tmp in values)
							{
								if (values.hasOwnProperty(tmp) && values[tmp].id !== "file-doc")
								{
									tmp2.push(values[tmp]);
								}
							}
							values = tmp2;
						}
					}
					if (values && values.length > 0)
					{
						this.controllers[cid]["init"] = init = true;
					}
				}
			}
		}
		this.controllerInit = BX.delegate(function(status)
		{
			this.controllerInitStatus = (status == 'show' || status == 'hide' ? status : (this.controllerInitStatus == 'show' ? 'hide' : 'show'));
			BX.onCustomEvent(this.eventNode, "BFileDLoadFormController", [this.controllerInitStatus]);
			BX.onCustomEvent(this.eventNode, "WDLoadFormController", [this.controllerInitStatus]);
			BX.onCustomEvent(this.eventNode, "DiskLoadFormController", [this.controllerInitStatus]);
			if (this.controllersAllLoaded === true)
			{
				BX.onCustomEvent(this.eventNode, "onUploadControllersIsInited", [this.controllerInitStatus, this]);
			}
		}, this);
		this.controllerAdjustWithInlineTags = BX.delegate(function(obj)
		{
			var node, parser, needToReparse = false;
			if (obj.dialogName == 'AttachFileDialog')
			{
				parser = 'webdav_element';
				node = BX.findChild(BX(this.formID), {'attr': {id: 'upload-wd-cid'}}, true, false);
				if (node)
					node.value = obj.CID;
				if (obj.values && obj.urlGet)
					needToReparse = this.OnWDSelectFileDialogLoaded(obj);
			}
			else if (obj.dialogName == 'DiskFileDialog')
			{
				parser = 'disk_file';
				node = BX.findChild(BX(this.formID), {'attr': {id: 'upload-disk-cid'}}, true, false);
				if (node)
					node.value = obj.CID;
				if (obj.values)
					needToReparse = this.OnWDSelectFileDialogLoaded(obj);
			}
			else
			{
				parser = 'file';
				node = BX.findChild(BX(this.formID), {'attr': {id: 'upload-cid'}}, true, false);
				if (node)
					node.value = obj.CID;
				needToReparse = this.OnFSelectFileDialogLoaded(obj);
			}
			if (needToReparse && needToReparse.length > 0 && this.oEditor && this.parser[parser])
			{
				this.oEditor.SaveContent();
				var content = this.oEditor.GetContent(), reg, reg2;
				if (parser == 'disk_file' && obj.dataFit)
				{
					var ii;
					if (obj.dataFit['xmlId'])
					{
						for (ii in obj.dataFit['xmlId'])
						{
							if (obj.dataFit['xmlId'].hasOwnProperty(ii))
							{
								content = content.
									replace(new RegExp('\\&\\#91\\;DOCUMENT ID=(' + ii + ')([WIDTHHEIGHT=0-9 ]*)\\&\\#93\\;','gim'), '[' + this.parser[parser]["tag"] + '=' + obj.dataFit['xmlId'][ii] + "$2]").
									replace(new RegExp('\\[DOCUMENT ID=(' + ii + ')([WIDTHHEIGHT=0-9 ]*)\\]','gim'), '[' + this.parser[parser]["tag"] + '=' + obj.dataFit['xmlId'][ii] + "$2]");
							}
						}
					}
					if (obj.dataFit['fileId'])
					{
						for (ii in obj.dataFit['fileId'])
						{
							if (obj.dataFit['fileId'].hasOwnProperty(ii))
							{
								content = content.
									replace(new RegExp('\\&\\#91\\;' + this.parser[parser]["tag"] + '=(' + ii + ')([WIDTHHEIGHT=0-9 ]*)\\&\\#93\\;','gim'), '[' + this.parser[parser]["tag"] + '=' + obj.dataFit['fileId'][ii] + "$2]").
									replace(new RegExp('\\[' + this.parser[parser]["tag"] + '=(' + ii + ')([WIDTHHEIGHT=0-9 ]*)\\]','gim'), '[' + this.parser[parser]["tag"] + '=' + obj.dataFit['fileId'][ii] + "$2]");
							}
						}
					}
				}
				reg = new RegExp('(?:\\&\\#91\\;|\\[)(' + this.parser[parser]["tags"].join("|") + ')=(' + needToReparse.join("|") + ')([WIDTHHEIGHT=0-9 ]*)(?:\\&\\#93\\;|\\])','gim');
				if (reg.test(content))
				{
					content = content.replace(reg, BX.delegate(function(str, tagName, id, add) {
						this.checkFileInContent(this.checkFile(parser + id), true);
						return '[' + tagName + '=' + id + add + ']';
					}, this));
					this.oEditor.SetContent(content);
					this.oEditor.Focus();
				}
			}
			return needToReparse;
		}, this);
		this.controllerInited = BX.delegate(function(obj)
		{
			var ddContr = null;
			obj.controlID = (!obj.controlID && obj.CID ? obj.CID : obj.controlID);
			if (this.controllers[obj.controlID] && this.controllers[obj.controlID]["obj"] === null)
			{
				this.controllers[obj.controlID]["obj"] = obj;
				if (obj.dialogName == 'AttachFileDialog' || obj.dialogName == 'DiskFileDialog')
				{
					ddContr = obj;
					BX.addCustomEvent(obj.agent, "onFileIsInited", BX.delegate(function()
					{
						BX.onCustomEvent(this.eventNode, "onUploadsHasBeenChanged", arguments);
					}, this));
				}
				else
				{
					BX.addCustomEvent(obj.agent, 'ChangeFileInput', BX.delegate(function()
					{
						BX.onCustomEvent(this.eventNode, "onUploadsHasBeenChanged", arguments);
					}, this));
				}
				this.controllerAdjustWithInlineTags(obj);
				BX.onCustomEvent(this.eventNode, "onUploadControllerIsLoaded", [this.controllers[obj.controlID]["storage"], obj, this]);
			}
			var allInit = true, cid;
			for (cid in this.controllers)
			{
				if (this.controllers.hasOwnProperty(cid))
				{
					if (cid !== "common" && this.controllers[cid].obj === null)
					{
						allInit = false;
						break;
					}
				}
			}
			if (allInit === true)
			{
				BX.removeCustomEvent(this.eventNode, 'WDLoadFormControllerInit', this.controllerInited);
				BX.removeCustomEvent('WDSelectFileDialogLoaded', this.controllerInited);
				BX.removeCustomEvent(this.eventNode, 'BFileDLoadFormControllerInit', this.controllerInited);
				BX.removeCustomEvent('BFileDSelectFileDialogLoaded', this.controllerInited);
				BX.removeCustomEvent(this.eventNode, 'DiskDLoadFormControllerInit', this.controllerInited);
				this.controllersAllLoaded = true;
				if (tmp3 == 1 && ddContr !== null)
				{
					ddContr.agent.initDropZone(this.eventNode);
				}

				BX.onCustomEvent(this.eventNode, "onUploadControllersIsInited", ['show', this]);
			}
		}, this);

		BX.addCustomEvent(this.eventNode, 'WDLoadFormControllerInit', this.controllerInited);
		BX.addCustomEvent('WDSelectFileDialogLoaded', this.controllerInited);
		BX.addCustomEvent(this.eventNode, 'BFileDLoadFormControllerInit', this.controllerInited);
		BX.addCustomEvent('BFileDSelectFileDialogLoaded', this.controllerInited);
		BX.addCustomEvent(this.eventNode, 'DiskDLoadFormControllerInit', this.controllerInited);

		BX.addCustomEvent(this.eventNode, 'OnFileUploadSuccess',BX.delegate(function(result, obj)
		{
			if (this.controllers[obj.controlID])
			{
				if (obj.dialogName == 'AttachFileDialog')
					window.__mpf_wd_getinfofromnode(result, obj);
				this.OnFileUploadSuccess(result, obj);
			}
		},this));

		BX.addCustomEvent(this.eventNode, 'OnFileUploadRemove', BX.delegate(function(result, obj)
		{
			if (this.controllers[obj.controlID])
			{
				this.OnFileUploadRemove(result, obj);
			}
		}, this));

		BX.ready(
			BX.delegate(
				function()
				{
					BX.bind(BX('bx-b-uploadfile-' + formID), 'click', this.controllerInit);
					if (!webdav && this.parser['file'] && this.parser['webdav_element'])
					{
						BX.removeClass(BX('bx-b-uploadfile-' + formID), "feed-add-file");
						BX.addClass(BX('bx-b-uploadfile-' + formID), "feed-add-image");
					}
					if (init === true) // init all controllers
					{
						var f = BX.delegate(function(){
							this.controllerInit('show');
						}, this);
						for (cid in this.controllers)
						{
							if (this.controllers.hasOwnProperty(cid) && cid != "common")
							{
								BX.addCustomEvent(this.controllers[cid].node, "WDLoadFormControllerWasBound", f);
								BX.addCustomEvent(this.controllers[cid].node, "BFileDLoadFormControllerWasBound", f);
								BX.addCustomEvent(this.controllers[cid].node, "DiskLoadFormControllerWasBound", f);
							}
						}
					}
				},
				this
			)
		);
	},
	/**
	 * @return boolean
	 */
	OnFileUploadSuccess : function(result, obj)
	{
		var
			editor = this.oEditor || window["BXHtmlEditor"].Get(this.oEditorId);

		editor.SaveContent();

		result.isImage = (result.element_content_type && result.element_content_type.substr(0, 6) == 'image/');

		if (result.storage == 'bfile' && !(this.parser['postimage']['exist'] && result.isImage || this.parser['file']))
			return false;
		else if (result.storage == 'webdav' && !this.parser['webdav_element'])
			return false;
		else if (result.storage == 'disk' && !this.parser['disk_file'])
			return false;

		var id = this.checkFile(result.element_id, obj.controlID, result, true);

		if (id)
		{
			var f = this.bindToFile(id);
			this.checkFileInContent(this.checkFile(id));
			this.arFiles[id] = this.checkFile(id);
			if ((editor.insertImageAfterUpload && f.isImage) || editor["insertFileAfterUpload"])
			{
				this.insertFile(id);
			}
		}
		return true;
	},

	OnFileUploadRemove : function(id, uploader)
	{
		var c = this.controllers[uploader.controlID];
		if (c)
		{
			if (BX.findChild(BX(this.formID), { attr : {id: ( c["prefixNode"] + id) } }, true, false))
				this.deleteFile(id, null, null, uploader);
		}
	},

	OnFSelectFileDialogLoaded : function(obj)
	{
		if (!(typeof obj == "object" && obj && obj.agent && obj.agent.values) || this.controllers[obj.controlID]['checked'] === true)
			return [];
		var
			needToReparse = [],
			id = 0,
			data = {},
			node = null,
			arID = {},
			did = null,
			func = BX.delegate(function(){
					this.checkFileInContent(
						this.checkFile(BX.proxy_context.getAttribute("mpfId"), obj.controlID),
						null,
						arguments[0]
					);
				},
				this
			),
			values = obj.agent.values || [],
			url = BX.util.remove_url_param(document.location.href, ["mfi_mode", "fileID", "cid", "sessid"]);
		url = url + (url.indexOf("?") > 0 ? '&' : '?') + 'mfi_mode=down&cid='+obj.CID + '&sessid='+BX.bitrix_sessid();
		this.controllers[obj.controlID]['checked'] = true;

		for (var ii = 0; ii < values.length; ii++)
		{
			id = parseInt(values[ii].getAttribute("id").replace("wd-doc", ""));
			if (arID['id' + id])
				continue;
			arID['id' + id] = "Y";
			if (id > 0)
			{
				node = BX.findChild(values[ii], {'className': 'f-wrap'}, true, false);
				if(!node)
					continue;
				data = {
					element_id : id,
					element_name : node.innerHTML,
					parser : 'file',
					storage : 'bfile',
					element_url : (url + '&fileID=' + id)
				};
				did = this.checkFile(id, obj.controlID, data, false);
				if (did)
				{
					this.bindToFile(did);
					needToReparse.push(id);
					values[ii].setAttribute("mpfId", did);
					BX.addCustomEvent(values[ii], 'OnMkClose', func);
				}
			}
		}
		return needToReparse;
	},

	OnWDSelectFileDialogLoaded : function(obj)
	{
		var
			needToReparse = [],
			id = 0,
			xmlID = 0, fileID = 0,
			data = {},
			node = null,
			arID = {},
			did = null,
			c = this.controllers[obj.controlID],
			parser = this.parser[c["parser"]],
			func = BX.delegate(function(){
					this.checkFileInContent(
						this.checkFile(BX.proxy_context.getAttribute("mpfId"), obj.controlID),
						null,
						arguments[0]
					);
				},
				this
			);

		for (var ii = 0; ii < obj.values.length; ii++)
		{
			id = obj.values[ii].getAttribute("id").replace(c["prefixNode"], "");
			xmlID = obj.values[ii].getAttribute("bx-attach-xml-id");
			fileID = obj.values[ii].getAttribute("bx-attach-file-id");
			if (arID['id' + id])
				continue;
			arID['id' + id] = "Y";
			if (id > 0)
			{
				node = BX.findChild(obj.values[ii], {'className': 'f-wrap'}, true, false);
				if(!node)
					continue;
				data = {
					element_id : id,
					element_name : node.innerHTML,
					parser : c["parser"],
					storage : c["storage"],
					prefixNode : c["prefixNode"],
					xmlID : xmlID,
					fileID : fileID
				};
				window.__mpf_wd_getinfofromnode(data, obj);
				did = this.checkFile(id, obj.controlID, data, false);
				if (did)
				{
					if (parser)
					{
						if (xmlID)
						{
							obj.dataFit = (obj.dataFit || {});
							obj.dataFit['xmlId'] = (obj.dataFit['xmlId'] || {});
							obj.dataFit['xmlId'][xmlID + ''] = id;
						}
						if (fileID)
						{
							obj.dataFit = (obj.dataFit || {});
							obj.dataFit['fileId'] = (obj.dataFit['fileId'] || {});
							obj.dataFit['fileId'][fileID + ''] = id;
						}
						this.bindToFile(did);
						needToReparse.push(id);
						obj.values[ii].setAttribute("mpfId", did);
					}
					BX.addCustomEvent(obj.values[ii], 'OnMkClose', func);
				}
			}
		}
		return needToReparse;
	},

	showPanelEditor : function(show)
	{
		if (!this.oEditor)
			this.oEditor = window["BXHtmlEditor"].Get(this.oEditorId);

		if (show == undefined)
			show = !this.oEditor.toolbar.IsShown();

		this.params.showEditor = show;
		var
			button = BX('lhe_button_editor_' + this.formID),
			panelClose = BX('panel-close' + this.params['LHEJsObjName']);

		if (panelClose)
		{
			this.oEditor.dom.cont.appendChild(panelClose);
		}

		if(show)
		{
			this.oEditor.dom.toolbarCont.style.opacity ='inherit';
			this.oEditor.toolbar.Show();

			if (button)
				BX.addClass(button, 'feed-add-post-form-btn-active');

			if (panelClose)
				panelClose.style.display = '';
		}
		else
		{
			this.oEditor.toolbar.Hide();

			if (button)
				BX.removeClass(button, 'feed-add-post-form-btn-active');

			if (panelClose)
				panelClose.style.display = 'none';
		}

		BX.userOptions.save('main.post.form', 'postEdit', 'showBBCode', show ? "Y" : "N");
	},

	bindToFile : function(id)
	{
		var
			f = this.checkFile(id),
			intId = id.replace(/\D+/gi, ''),
			img_wrap,
			c = this.controllers[f.cid],
			node = BX.findChild((c ? c.node : window), {attr : { id : c["prefixNode"] + (c.storage == "bfile" ? intId : id) }}, true);
		if (f && node)
		{
			if (f.isImage && c.storage == 'bfile')
			{
				var
					img = BX.findChild(node, {tagName: 'img'}, true, false),
					img_title = BX.findChild(node, {className: 'feed-add-img-title'}, true, false);

				img_wrap = BX.findChild(node, {}, true, false);
				if (img_wrap && !img_wrap.hasAttribute("bx-mpf-bound-to-" + this.oEditorId))
				{
					img_wrap.setAttribute("bx-mpf-bound-to-" + this.oEditorId, "Y");
					BX.bind(img_wrap, "click", BX.delegate(function(){this.insertFile(id);}, this));
					img_wrap.style.cursor = "pointer";
					img_wrap.title = BX.message('MPF_IMAGE');
				}
				if (img_title && !img_title.hasAttribute("bx-mpf-bound-to-" + this.oEditorId))
				{
					img_title.setAttribute("bx-mpf-bound-to-" + this.oEditorId, "Y");
					BX.bind(img_title, "click", BX.delegate(function(){this.insertFile(id);}, this));
					img_title.style.cursor = "pointer";
					img_title.title = BX.message('MPF_IMAGE');
				}
			}
			else
			{
				var name_wrap = BX.findChild(node, {className: 'f-wrap'}, true, false);
				img_wrap = BX.findChild(node, {className: 'files-preview'}, true, false);
				if (name_wrap && !name_wrap.hasAttribute("bx-mpf-bound-to-" + this.oEditorId))
				{
					name_wrap.setAttribute("bx-mpf-bound-to-" + this.oEditorId, "Y");
					BX.bind(name_wrap, "click", BX.delegate(function(){this.insertFile(id);}, this));
					name_wrap.style.cursor = "pointer";
					name_wrap.title = BX.message('MPF_FILE');
				}
				if (img_wrap && !img_wrap.hasAttribute("bx-mpf-bound-to-" + this.oEditorId))
				{
					img_wrap.setAttribute("bx-mpf-bound-to-" + this.oEditorId, "Y");
					BX.bind(img_wrap, "click", BX.delegate(function(){this.insertFile(id);}, this));
				}
			}
		}
		return f;
	},

	startMonitoring : function(start)
	{
		start = (start === false ? false : start === true ? true : "Y");
		if (start)
		{
			if (start === true || !this.startMonitoringStatus)
			{
				if (this.startMonitoringStatus)
					clearTimeout(this.startMonitoringStatus);
				this.startMonitoringStatus = setTimeout(BX.delegate(function() {this.checkFilesInText();}, this), 1000);
			}
		}
		else if (this.startMonitoringStatus)
		{
			clearTimeout(this.startMonitoringStatus);
			this.startMonitoringStatus = null;
		}
	},

	checkFilesInText: function()
	{
		var
			id,
			result = false;

		for (id in this.arFiles)
		{
			if (this.arFiles.hasOwnProperty(id) && this.checkFileInContent(this.arFiles[id]))
			{
				result = true;
				break;
			}
		}

		this.startMonitoring(result);
	},

	checkFileInContent : function(file, fileInContent, parent)
	{
		if (!file || !this.parser[file["parser"]])
			return null;

		var c = this.controllers[file["cid"]];
		parent = BX.findChild((parent ? parent : BX(c["prefixNode"] + file["id"])), {'className': 'files-info'}, true, false);

		if (!this.oEditor)
			this.oEditor = window["BXHtmlEditor"].Get(this.oEditorId);

		if (fileInContent !== true && this.parser[file["parser"]])
		{
			this.oEditor.SaveContent();
			var content = this.oEditor.GetContent();
			content.replace(
				this.parser[file["parser"]]["regexp"],
				function(str, tagName, id)
				{
					if (file["id"] == id)
					{
						fileInContent = true;
					}
					return str;
				}
			);
		}

		fileInContent = (fileInContent === true || fileInContent === false ? fileInContent : false);

		if (BX.type.isDomNode(parent))
		{
			var
				insertBtn = BX.findChild(parent, {className: 'insert-btn'}, true, false),
				insertText = BX.findChild(parent, {className: 'insert-text'}, true, false);

			if (fileInContent)
			{
				parent.setAttribute("tagInText", "Y");
				if (!insertText)
				{
					parent.appendChild(
						BX.create('SPAN', {
								props : {
									className : 'insert-text'
								},
								html : '<span class="insert-btn-text">' + BX.message("MPF_FILE_IN_TEXT") + '</span>'
							}
						)
					);
				}
				if (insertBtn)
					BX.remove(insertBtn);
			}
			else
			{
				parent.setAttribute("tagInText", "N");
				if (!insertBtn)
				{
					parent.appendChild(
						BX.create('SPAN', {
								props : {
									className : 'insert-btn'
								},
								html : '<span class="insert-btn-text">' + BX.message("MPF_FILE_INSERT_IN_TEXT") + '</span>',
								events : {
									click : BX.delegate(function(){this.insertFile(file["~id"]);}, this)
								}
							}
						)
					);
				}
				if (insertText)
					BX.remove(insertText);
			}
		}

		if (fileInContent)
			this.startMonitoring();

		return fileInContent;
	},

	checkFile : function(id, cid, result, isNew)
	{
		isNew = (!!isNew);
		if (typeof result == "object" && result !== null)
		{
			id = (id + '').replace(/[^a-z0-9]/gi, "");

			if (!result.element_content_type && result.element_name)
			{
				result.element_content_type = (/(\.png|\.jpg|\.jpeg|\.gif|\.bmp)$/i.test(result.element_name) ? 'image/xyz' : 'isnotimage/xyz');
			}

			if (isNew === true)
				id += (!!cid ? this.controllers[cid]["postfix"] : "");

			result.isImage = (result.isImage ? result.isImage : (result.element_content_type ? (result.element_content_type.indexOf('image') === 0) : false));
			if (!result.element_thumbnail && !result.element_url && result.src)
				result.element_thumbnail = result.src;
			if (result.isImage && result.storage != 'bfile' && this.arSize && result.element_thumbnail)
			{
				result.element_thumbnail = result.element_thumbnail + (result.element_thumbnail.indexOf("?") < 0 ? "?" : "&") +
					"width=" + this.arSize.width + "&height=" + this.arSize.height;
			}
			if (!result.element_image && result.thumbnail)
				result.element_image = result.thumbnail;

			var res = {
				id : id,
				name : (result.element_name ? result.element_name : 'noname'),
				size: result.element_size,
				url: result.element_url,
				parser: (result['parser'] ? result['parser'] : false),
				type: result.element_content_type,
				src: (result.element_thumbnail ? result.element_thumbnail : result.element_url),
				lowsrc: (result.lowsrc ? result.lowsrc : ''),
				thumbnail: result.element_image,
				isImage: result.isImage,
				storage: result.storage,
				cid : (cid || '')
			};
			if (res.isImage && parseInt(result.width) > 0 && parseInt(result.height) > 0)
			{
				res.width = parseInt(result.width);
				res.height = parseInt(result.height);
				if (this.arSize)
				{
					var width = res.width, height = res.height,
						ResizeCoeff = {
							width : (this.arSize["width"] > 0 ? this.arSize["width"] / width : 1),
							height : (this.arSize["height"] > 0 ? this.arSize["height"] / height : 1)
						},
						iResizeCoeff = Math.min(ResizeCoeff["width"], ResizeCoeff["height"]);

					iResizeCoeff = ((0 < iResizeCoeff) && (iResizeCoeff < 1) ? iResizeCoeff : 1);
					res.width = Math.max(1, parseInt(iResizeCoeff * res.width));
					res.height = Math.max(1, parseInt(iResizeCoeff * res.height));
				}
			}

			if (res['isImage'] && !res['src'])
			{
				res = false;
			}
			else if (!res['parser'])
			{
				if (res.storage == 'disk' && this.parser['disk_file'])
				{
					res['parser'] = 'disk_file';
				}
				if (res.storage == 'webdav' && this.parser['webdav_element'])
				{
					res['parser'] = 'webdav_element';
				}
				else if (res['storage'] == 'bfile' || !res['storage'])
				{
					res['storage'] = 'bfile';
					res['parser'] = ((res['isImage'] && this.parser['postimage']['exist']) ? 'postimage' : (this.parser['file'] ? 'file' : false));
				}
			}
			else if (!this.parser[res['parser']])
				res['parser'] = false;

			if (res && res["parser"])
			{
				if (res.storage == 'bfile')
				{
					this.arFiles['' + id] = res;
					this.arFiles['' + id]["~id"] = '' + id;
				}
				this.arFiles[res['parser'] + id] = res;
				this.arFiles[res['parser'] + id]["~id"] = res['parser'] + id;
				return (res['parser'] + id);
			}
		}
		return (typeof this.arFiles[id] == "object" && this.arFiles[id] !== null ? this.arFiles[id] : false);
	},

	insertFile : function(id, width)
	{
		var
			editor = this.oEditor || LHEPostForm.getEditor(this.oEditorId),
			file = this.checkFile(id);

		if (editor && file)
		{
			var
				fileID = file['id'],
				params = '',
				editorMode = editor.GetViewMode(),
				pattern = this.parser[file['parser']][editorMode];

			if (file['isImage'])
			{
				pattern = (editorMode == "wysiwyg" ? this.parser["postimage"][editorMode] : pattern);
				if (file.width > 0 && file.height > 0 && this.oEditor.sEditorMode == "html" )
				{
					params = ' style="width:' + file.width + 'px;height:' + file.height + 'px;" onload="this.style=\' \'"';
				}
			}

			if(editorMode == 'wysiwyg') // WYSIWYG
			{
				editor.InsertHtml(pattern.
					replace("#ID#", editor.SetBxTag(false, {'tag': file.parser, params: {'value' : fileID}})).
					replace("#SRC#", file.src).replace("#URL#", file.url).
					replace("#LOWSRC#", (file.lowsrc ? file.lowsrc : '')).
					replace("#NAME#", file.name).replace("#ADDITIONAL#", params) + '<span>&nbsp;</span>'
				);

				setTimeout(BX.delegate(editor.AutoResizeSceleton, editor), 500);
				setTimeout(BX.delegate(editor.AutoResizeSceleton, editor), 1000);
			}
			else if (editorMode == 'code' && editor.bbCode) // BB Codes
			{
				editor.textareaView.Focus();
				editor.textareaView.WrapWith(false, false, pattern.replace("#ID#", fileID).replace("#ADDITIONAL#", ""));
			}

			this.checkFileInContent(file, true);
		}
	},

	deleteFile: function(id, url, el, uploader)
	{
		var
			editor = this.oEditor || LHEPostForm.getEditor(this.oEditorId),
			c = this.controllers[uploader.controlID];
		id  = id + '';

		if (typeof url == "string")
		{
			BX.remove(el.parentNode);
			BX.ajax.get(url, function(data){});
		}
		editor.SaveContent();
		var content = editor.GetContent();

		if (c && new RegExp('ID='+ id,'g').test(content))
		{
			var file = (this.checkFile(id) || this.checkFile(c['parser'] + id));
			if(editor.GetViewMode() == 'wysiwyg' && file) // WYSIWYG
			{
				var doc = editor.GetIframeDoc(), ii, n;
				for (ii in editor.bxTags)
				{
					if (editor.bxTags.hasOwnProperty(ii))
					{
						if (typeof editor.bxTags[ii] == "object" &&
							editor.bxTags[ii]["params"] &&
							editor.bxTags[ii]["params"]["value"] == file.id)
						{
							n = doc.getElementById(ii);
							if (n)
								n.parentNode.removeChild(n);
						}
					}
				}
				editor.SaveContent();
			}
			else
			{
				if (c["parser"] == 'disk_file')
				{
					var node = BX(c["prefixNode"] + id),
						xmlID = (node && node.hasAttribute("bx-attach-xml-id") ? node.getAttribute("bx-attach-xml-id") : "");
					content = content.replace(new RegExp('\\[(' + this.parser[c["parser"]].tag + ')='+ id +'\\]','g'), '');
					if (xmlID)
					{
						content = content.replace(new RegExp('\\[(' + this.parser[c["parser"]].tags.join("|") + ')='+ xmlID +'\\]','g'), '');
					}
				}
				else if (c["parser"] == 'webdav_element')
				{
					content = content.replace(new RegExp('\\[DOCUMENT ID='+ id +'\\]','g'), '');
				}
				else if (this.parser[c["parser"]])
				{
					content = content.
						replace(new RegExp('\\[IMG ID='+ id +'\\]','g'), '').
						replace(new RegExp('\\[FILE ID='+ id +'\\]','g'), '').
						replace(new RegExp('\\[IMG ID='+ id + this.parser[c["parser"]]["postfix"] +'\\]','g'), '').
						replace(new RegExp('\\[FILE ID='+ id + this.parser[c["parser"]]["postfix"] +'\\]','g'), '');
				}
				this.oEditor.SetContent(content);
				this.oEditor.Focus();
			}
			this.arFiles[id] = false;
		}
	},

	Parse : function(parser, content, editor)
	{
		var
			arParser = this.parser[parser],
			obj = this;

		if (arParser)
		{
			content = content.replace(
				arParser.regexp,
				function(str, tagName, id, width, height)
				{
					var
						strAdditional = "",
						file = obj.checkFile(parser + id),
						template = (file.isImage ? obj.parser.postimage.wysiwyg : arParser.wysiwyg);
					if (file)
					{
						if (file.isImage)
						{
							width = parseInt(width);
							height = parseInt(height);

							strAdditional = ((width && height) ?
								(" width=\"" + width + "\" height=\"" + height + "\"") : "");

							if (strAdditional === "" && file["width"] > 0 && file["height"] > 0)
							{
								strAdditional = ' style="width:' + file["width"] + 'px;height:' + file["height"] + 'px;" onload="this.style=\' \'"';
							}
						}

						return template.
							replace("#ID#", editor.SetBxTag(false, {tag: parser, params: {value : id}})).
							replace("#NAME#", file.name).
							replace("#SRC#", file.src).
							replace("#LOWSRC#", file.lowsrc).
							replace("#ADDITIONAL#", strAdditional).
							replace("#WIDTH#", parseInt(width)).
							replace("#HEIGHT#", parseInt(height));
					}
					return str;
				}
			)
		}
		return content;
	},

	/**
	 * @return {string}
	 */
	Unparse: function(bxTag, oNode/*, editor*/)
	{
		var res = "", parser = bxTag.tag;
		if (this.parser[parser])
		{
			var
				width = parseInt(oNode.node.hasAttribute("width") ? oNode.node.getAttribute("width") : 0),
				height = parseInt(oNode.node.hasAttribute("height") ? oNode.node.getAttribute("height") : 0),
				strSize = "";

			if (width > 0 && height > 0)
			{
				strSize = ' WIDTH=' + width + ' HEIGHT=' + height;
			}

			res = this.parser[parser]["code"].
				replace("#ID#", bxTag.params.value).
				replace("#ADDITIONAL#", strSize).
				replace("#WIDTH#", width).
				replace("#HEIGHT#", height);
		}

		return res;
	},

	OnShowLHE : function(show, editor)
	{
		var lheName = this.params['LHEJsObjName'];

		show = (show === false ? false : (show === 'hide' ? 'hide' : (show === 'justShow' ? 'justShow' : true)));

		if (!this.oEditor)
			this.oEditor = editor || window["BXHtmlEditor"].Get(this.oEditorId);

		if (!this.oEditor)
			return;

		var
			micro = BX('micro' + lheName),
			div = this.eventNode;

		if (micro)
		{
			micro.style.display = ((show === true || show === 'justShow') ? "none" : "block");
		}

		if (show == 'hide')
		{
			BX.onCustomEvent(this.eventNode, 'OnBeforeHideLHE', [show, this]);
			if (this.eventNode.style.display == "none")
			{
				BX.onCustomEvent(this.eventNode, 'OnAfterHideLHE', [show, this]);
			}
			else
			{
				(new BX.easing({
					duration : 200,
					start : { opacity: 100, height : this.eventNode.scrollHeight},
					finish : { opacity : 0, height : 20},
					transition : BX.easing.makeEaseOut(BX.easing.transitions.quad),
					step : function(state)
					{
						div.style.height = state.height + "px";
						div.style.opacity = state.opacity / 100;
					},
					complete : BX.proxy(function()
					{
						this.eventNode.style.cssText = "";
						this.eventNode.style.display = "none";
						BX.onCustomEvent(div, 'OnAfterHideLHE', [show, this]);
					}, this)
				})).animate();
			}
		}
		else if (show)
		{
			BX.onCustomEvent(this.eventNode, 'OnBeforeShowLHE', [show, this]);
			if (show == "justShow")
			{
				this.eventNode.style.display = "block";
				BX.onCustomEvent(this.eventNode, 'OnAfterShowLHE', [show, this]);
				this.oEditor.Focus();
			}
			else if (this.eventNode.style.display == "block")
			{
				BX.onCustomEvent(this.eventNode, 'OnAfterShowLHE', [show, this]);
				this.oEditor.Focus();
			}
			else
			{
				BX.adjust(this.eventNode, {style:{display:"block", overflow:"hidden", height:"20px", opacity:0.1}});
				(new BX.easing({
					duration : 200,
					start : { opacity : 10, height : 20 },
					finish : { opacity: 100, height : div.scrollHeight},
					transition : BX.easing.makeEaseOut(BX.easing.transitions.quad),
					step : function(state)
					{
						div.style.height = state.height + "px";
						div.style.opacity = state.opacity / 100;
					},
					complete : BX.proxy(function()
					{
						BX.onCustomEvent(div, 'OnAfterShowLHE', [show, this]);
						this.oEditor.Focus();
						this.eventNode.style.cssText = "";
					}, this)
				})).animate();
			}
		}
		else
		{
			BX.onCustomEvent(this.eventNode, 'OnBeforeHideLHE', [show, this]);
			this.eventNode.style.display = "none";
			BX.onCustomEvent(this.eventNode, 'OnAfterHideLHE', [show, this]);
		}
	},

	OnButtonClick : function(type)
	{
		if (type == 'cancel')
		{
			BX.onCustomEvent(this.eventNode, 'OnClickCancel', [this]);
			BX.onCustomEvent(this.eventNode, 'OnShowLHE', ['hide']);
		}
		else
		{
			BX.onCustomEvent(this.eventNode, 'OnClickSubmit', [this]);
		}
	},
	OnEditorInitedBefore : function(editor)
	{
		var _this = this;
		this.oEditor = editor;
		editor.formID = this.formID;
		if (this.params)
			this.params["~height"] = editor.config["height"];
		if (this.params && this.params['ctrlEnterHandler'])
		{
			BX.addCustomEvent(editor, 'OnCtrlEnter', function() {
				editor.SaveContent();
				if (typeof window[_this.params['ctrlEnterHandler']] == 'function')
					window[_this.params['ctrlEnterHandler']]();
				else
					BX.submit(BX(_this.formID));
			});
		}
		var parsers = (this.params.parsers ? this.params.parsers : []);

		if (BX.util.object_search('Spoiler', parsers))
		{
			editor.AddButton({
				id : 'spoiler',
				name : BX.message('spoilerText'),
				iconClassName : 'spoiler',
				disabledForTextarea : false,
				src : BX.message('MPF_TEMPLATE_FOLDER') + '/images/lhespoiler.png',
				toolbarSort : 205,
				handler : function()
				{
					var
						_this = this,
						res = false;

					// Iframe
					if (!_this.editor.bbCode || !_this.editor.synchro.IsFocusedOnTextarea())
					{
						res = _this.editor.action.actions.formatBlock.exec('formatBlock', 'blockquote', 'bx-spoiler', false, {bxTagParams : {tag: "spoiler"}});
					}
					else // bbcode + textarea
					{
						res = _this.editor.action.actions.formatBbCode.exec('quote', {tag: 'SPOILER'});
					}
					return res;
				}
			});
			editor.AddParser({
				name : 'spoiler',
				obj : {
					Parse: function(sName, content, pLEditor)
					{
						if (/\[(cut|spoiler)(([^\]])*)\]/gi.test(content))
						{
							content = content.
								replace(/[\001-\006]/gi, '').
								replace(/\[cut(((?:=)[^\]]*)|)\]/gi, '\001$1\001').
								replace(/\[\/cut]/gi, '\002').
								replace(/\[spoiler([^\]]*)\]/gi, '\003$1\003').
								replace(/\[\/spoiler]/gi, '\004');
							var
								reg1 = /(?:\001([^\001]*)\001)([^\001-\004]+)\002/gi,
								reg2 = /(?:\003([^\003]*)\003)([^\001-\004]+)\004/gi,
								__replace_reg = function(title, body){
									title = title.replace(/^(="|='|=)/gi, '').replace(/("|')?$/gi, '');
									return '<blockquote class="bx-spoiler" id="' + pLEditor.SetBxTag(false, {tag: "spoiler"}) + '" title="' + title + '">' + body + '</blockquote>';
								},
								func = function(str, title, body){return __replace_reg(title, body);};
							while (content.match(reg1) || content.match(reg2))
							{
								content = content.
									replace(reg1, func).
									replace(reg2, func);
							}
						}
						content = content.
							replace(/\001([^\001]*)\001/gi, '[cut$1]').
							replace(/\003([^\003]*)\003/gi, '[spoiler$1]').
							replace(/\002/gi, '[/cut]').
							replace(/\004/gi, '[/spoiler]');
						return content;
					},
					/**
					 * @return {string}
					 */
					UnParse: function(bxTag, oNode)
					{
						if (bxTag.tag == 'spoiler')
						{
							var name = '', i;
							// Handle childs
							for (i = 0; i < oNode.node.childNodes.length; i++)
							{
								name += editor.bbParser.GetNodeHtml(oNode.node.childNodes[i]);
							}
							name = BX.util.trim(name);
							if (name != '')
								return "[SPOILER" + (oNode.node.hasAttribute("title") ? '=' + oNode.node.getAttribute("title") : '')+ "]" + name +"[/SPOILER]";
						}
						return "";
					}
				}
			});
		}
		if (BX.util.object_search('MentionUser', parsers))
		{
			editor.AddParser(
				{
					name: 'postuser',
					obj: {
						Parse: function(parserName, content)
						{
							content = content.replace(/\[USER\s*=\s*(\d+)\]((?:\s|\S)*?)\[\/USER\]/ig,
								function(str, id, name)
								{
									name = BX.util.trim(name);
									if (name == '')
										return '';
									return '<span id="' + editor.SetBxTag(false, {tag: "postuser", params: {value : parseInt(id)}}) + '" class="bxhtmled-metion">' + name + '</span>';
								});
							return content;
						},
						/**
						 * @return {string}
						 */
						UnParse: function(bxTag, oNode)
						{
							if (bxTag.tag == 'postuser')
							{
								var name = '', i;
								// Handle childs
								for (i = 0; i < oNode.node.childNodes.length; i++)
								{
									name += editor.bbParser.GetNodeHtml(oNode.node.childNodes[i]);
								}
								name = BX.util.trim(name);
								if (name != '')
									return "[USER=" + bxTag.params.value + "]" + name +"[/USER]";
							}
							return "";
						}
					}
				}
			);
		}
		var funcParse = function(parserName, content) {
				return _this.Parse(parserName, content, editor);
			},
			funcUnparse = function(bxTag, oNode) {
				return _this.Unparse(bxTag, oNode/*, editor*/);
			};
		for (var parser in this.parser)
		{
			if (this.parser.hasOwnProperty(parser))
			{
				editor.AddParser({
					name: parser,
					obj: {
						Parse: funcParse,
						UnParse: funcUnparse
					}
				});
			}
		}
	},
	OnEditorInitedAfter : function(editor)
	{
		// Contextmenu changing for images/files
		editor.contextMenu.items['postimage'] =
			editor.contextMenu.items['postdocument'] =
				editor.contextMenu.items['postfile'] =
					[
						{
							text: BX.message('BXEdDelFromText'),
							bbMode: true,
							onclick: function()
							{
								var node = editor.contextMenu.GetTargetItem('postimage');
								if (!node)
									node = editor.contextMenu.GetTargetItem('postdocument');
								if (!node)
									node = editor.contextMenu.GetTargetItem('postfile');

								if (node && node.element)
								{
									editor.selection.RemoveNode(node.element);
								}
								editor.contextMenu.Hide();
							}
						}
					];
		if (!this.params["bInitByJS"])
		{
			BX.onCustomEvent(this.eventNode, 'OnShowLHE', [true, editor])
		}

		if (editor.toolbar.controls && editor.toolbar.controls.FontSelector)
		{
			editor.toolbar.controls.FontSelector.SetWidth(45);
		}

		BX.addCustomEvent(BX(this.formID), 'onAutoSavePrepare', BX.proxy(function (ob, h) {
			_ob=ob;
			setTimeout(function() {
				BX.addCustomEvent(editor, 'OnContentChanged', BX.proxy(function(text) {
					this.mpfTextContent = text;
					this.Init();
				}, _ob));
			},1500);
		}));
		BX.addCustomEvent(BX(this.formID), 'onAutoSave', BX.proxy(function(ob, form_data)
		{
			if (ob.mpfTextContent)
				form_data['text' + this.formID] = ob.mpfTextContent;
		}, this));
		BX.addCustomEvent(BX(this.formID), 'onAutoSaveRestore', BX.proxy(function(ob, form_data)
		{
			if (form_data['text' + this.formID])
			{
				editor.CheckAndReInit(form_data['text' + this.formID]);
			}
		}, this));

	},
	InitCustomEditorEventHandlers: function()
	{
		var
			formID = this.formID,
			editor = this.oEditor || LHEPostForm.getEditor(this.oEditorId),
			settings = this.params;

		this.showPanelEditor(settings.showEditor);

		if (!editor.mainPostFormCustomized)
		{
			editor.mainPostFormCustomized = true;

			BX.addCustomEvent(
				editor,
				'OnIframeKeydown',
				function(e)
				{
					if (window.onKeyDownHandler)
					{
						window.onKeyDownHandler(e, editor, formID);
					}
				}
			);

			BX.addCustomEvent(
				editor,
				'OnIframeKeyup',
				function(e)
				{
					if (window.onKeyUpHandler)
					{
						window.onKeyUpHandler(e, editor, formID);
					}
				}
			);

			if (window['BXfpdStopMent' + formID])
			{
				BX.addCustomEvent(
					editor,
					'OnIframeClick',
					function(e)
					{
						window['BXfpdStopMent' + formID]();
					}
				);
			}
		}
		editor.CheckAndReInit();
	}
};

window.LHEPostForm.getEditor = function(editor)
{
	return (window["BXHtmlEditor"] ? window["BXHtmlEditor"].Get((typeof editor == "object" ? editor.id : editor)) : null);
};
window.LHEPostForm.getHandler = function(editor)
{
	return LHEHandlersRepo[(typeof editor == "object" ? editor.id : editor)];
};
window.LHEPostForm.reinitDataData = {};
var tmpData = {};
window.LHEPostForm.reinitData = function(editorID, text, data, controller)
{
	var
		editor = LHEPostForm.getEditor(editorID),
		mpFormObj = LHEPostForm.getHandler(editorID);
	if (!mpFormObj)
		return;
	else if (!editor)
	{
		setTimeout(function() { window.LHEPostForm.reinitData(editorID, text, data) }, 100);
		return;
	}
	var ii, id, dialogName, storage, ccid, j,
		node,
		res,
		tmp,
		node1,
		allControllersAreInited = true, jj;
	if (!controller)
	{
		editor.CheckAndReInit(text || '');
		if (mpFormObj.params["~height"])
		{
			editor.SetConfigHeight(mpFormObj.params["~height"]);
			editor.ResizeSceleton();
		}
		mpFormObj.arFiles = {};
		LHEPostForm.reinitDataBefore(editorID);
		if (data)
		{
			window.LHEPostForm.reinitDataData[editor.id] = [];
			for (ii in data)
			{
				if (!data.hasOwnProperty(ii) || !data[ii]["VALUE"] || data[ii]["VALUE"].length <= 0 || !data[ii]["FIELD_NAME"])
				{
					continue;
				}
				else if (BX.util.in_array("0", data[ii]["VALUE"]))
				{
					tmp = [];
					for (j = 0; j < data[ii]["VALUE"].length; j++)
					{
						if (data[ii]["VALUE"][j] + '' !== '0' && data[ii]["VALUE"][j] + '' !== '' && data[ii]["VALUE"][j] + '' !== 'undefined')
						{
							tmp.push(data[ii]["VALUE"][j]);
						}
					}
					if (tmp.length <= 0)
					{
						continue;
					}
					data[ii]["VALUE"] = tmp;
				}

				if (data[ii]["USER_TYPE_ID"] == "webdav_element" || data[ii]["USER_TYPE_ID"] == "disk_file")
				{
					dialogName = (data[ii]["USER_TYPE_ID"] == "webdav_element" ? 'AttachFileDialog' : 'DiskFileDialog');
					storage = (data[ii]["USER_TYPE_ID"] == "webdav_element" ? 'webdav' : 'disk');
					id = data[ii]["USER_TYPE_ID"];
					ccid = data[ii]["CID"];
				}
				else
				{
					dialogName = 'AttachmentsDialog';
					storage = 'bfile';
					id = 'file';
					ccid = '';
				}

				window.LHEPostForm.reinitDataData[editor.id].push({
					parser : data[ii]["USER_TYPE_ID"],
					userTypeId : data[ii]["USER_TYPE_ID"],
					fieldName : data[ii]["FIELD_NAME"].replace("[]", ""),
					dialogName : dialogName,
					obj : null,
					arguments : data[ii]["VALUE"],
					storage : storage,
					cid : ccid
				});
			}
			if (!mpFormObj.eventNode.hasAttribute("bx-onUploadControllerIsLoaded"))
			{
				mpFormObj.eventNode.setAttribute("bx-onUploadControllerIsLoaded", "Y");
				BX.addCustomEvent(mpFormObj.eventNode, 'onUploadControllerIsLoaded', function(storage, controller1) {
					window.LHEPostForm.reinitData(editorID, text, data, controller1);
				});
			}
		}
	}
	if (!window.LHEPostForm.reinitDataData[editor.id] || window.LHEPostForm.reinitDataData[editor.id].length <= 0)
		return;
	var
		isThereAnythingToWork = false,
		cObjS = window.LHEPostForm.reinitDataData[editor.id],
		cObj;
	for (ii = 0; ii <= cObjS.length; ii++)
	{
		cObj = cObjS[ii];
		if (cObj && cObj["obj"] === null)
		{
			for (jj in mpFormObj.controllers)
			{
				if (mpFormObj.controllers.hasOwnProperty(jj) &&
					mpFormObj.controllers[jj]["parser"] == cObj["userTypeId"])
				{
					if (!mpFormObj.controllers[jj]["obj"])
					{
						allControllersAreInited = false;
					}
					else if (cObj["userTypeId"] == "file" && cObj["fieldName"] == (mpFormObj.controllers[jj]["obj"].agent.inputName.replace("[]", "")))
					{
						cObjS[ii]["obj"] = mpFormObj.controllers[jj]["obj"];
						isThereAnythingToWork = true;
						break;
					}
					else if (cObj["userTypeId"] !== "file" && cObj["fieldName"] == (mpFormObj.controllers[jj]["obj"].params.controlName.replace("[]", "")))
					{
						cObjS[ii]["obj"] = mpFormObj.controllers[jj]["obj"];
						isThereAnythingToWork = true;
						break;
					}
				}
			}
		}
	}
	mpFormObj.controllerInit('show');
	if (!isThereAnythingToWork)
		return;
	tmpData[editor.id] = (tmpData[editor.id] || {});
	tmpData[editor.id]["data"] = (tmpData[editor.id]["data"] || {});
	var cObjS1 = [], dataC, dataD, dataE, dataF, dataG, defFun = [], ready = cObjS.length, needReparce = false,
		closureWd = function(a,b){ return function() { a.WDFD_SelectFile({}, {}, b) }},
		closureDisk = function(a,b){ return function() { a.selectFile({}, {}, b) }},
		closureFile = function(a,b){ return function() {
			for (var ij = 0; ij < b.length; ij++)
			{
				a.agent.values.push(b[ij]);
				a.agent.ShowAttachedFiles();
			}
		}};

	for (ii = 0; ii < cObjS.length; ii++)
	{
		cObj = cObjS[ii];
		if (!cObj)
		{
			BX.DoNothing();
		}
		else if (cObj["obj"] === null)
		{
			ready--;
			cObjS1.push(cObj);
		}
		else if (cObj["userTypeId"] == "webdav_element")
		{
			if (cObj["arguments"].length > 0)
			{
				cObj["obj"].values = [];
				dataC = {};
				while ((res = cObj["arguments"].pop()) && !!res)
				{
					node1 = BX('wdif-doc-' + res);
					node = (!!node1 ? (node1.tagName == "A" ? node1 : BX.findChild(node1, {'tagName' : "IMG"}, true)) : null);
					if (!!node)
					{
						dataC['E' + res] = {
							type: 'file',
							id: res,
							name: node.getAttribute("alt"),
							storage: 'webdav',
							size: node.getAttribute("data-bx-size"),
							sizeInt: 1,
							ext: '',
							link: node.getAttribute("data-bx-document")
						};
						tmpData[editor.id]["data"][cObj["obj"].controlID] = (
							tmpData[editor.id]["data"][cObj["obj"].controlID] || []);
						tmpData[editor.id]["data"][cObj["obj"].controlID]['E' + res] = 'E' + res;
					}
				}
				defFun.push(closureWd(cObj["obj"], dataC));
			}
		}
		else if (cObj["userTypeId"] == "disk_file")
		{
			if (cObj["arguments"].length > 0)
			{
				dataD = {}; dataG = {};
				cObj["obj"].values = [];

				while ((res = cObj["arguments"].pop()) && !!res)
				{
					node1 = BX('disk-attach-' + res);
					node = (!!node1 ? (node1.tagName == "A" ? node1 : BX.findChild(node1, {'tagName' : "IMG"}, true)) : null);
					if (node)
					{
						dataD['E' + res] = {
							type: 'file',
							id: res,
							name: node.getAttribute("data-bx-title"),
							size: node.getAttribute("data-bx-size"),
							sizeInt: node.getAttribute("data-bx-size"),
							previewUrl: (node1.tagName == "A" ? '' : node.getAttribute("data-bx-src"))
						};
						if (node.hasAttribute("bx-attach-xml-id"))
						{
							dataD['E' + res]["xmlId"] = node.getAttribute("bx-attach-xml-id");
							dataG['xmlId'] = (dataG['xmlId'] || {});
							dataG['xmlId'][dataD['E' + res]["xmlId"] + ''] = res;
							needReparce = (needReparce || /DOCUMENT\sID=\d+/.test(text));
						}
						if (node.hasAttribute("bx-attach-file-id"))
						{
							dataG['fileId'] = (dataG['fileId'] || {});
							dataG['fileId'][node.getAttribute("bx-attach-file-id") + ''] = res;
							needReparce = (needReparce || /DISK\sFILE\sID=\w\d+/.test(text));
						}
						tmpData[editor.id]["data"][cObj["obj"].controlID] = (
							tmpData[editor.id]["data"][cObj["obj"].controlID] || {});
						tmpData[editor.id]["data"][cObj["obj"].controlID]['E' + res] = 'E' + res;
					}
				}
				defFun.push(closureDisk(cObj["obj"], dataD));
			}
		}
		else if (cObj["arguments"] && cObj["arguments"] !== null && typeof cObj["arguments"] == "object")
		{
			cObj["obj"].agent.values = [];
			dataE = cObj["arguments"];
			cObj["arguments"] = null;
			dataF = [];
			for (ii in dataE)
			{
				if (dataE.hasOwnProperty(ii))
				{
					tmp = {
						id : dataE[ii]["FILE_ID"],
						element_id : dataE[ii]["FILE_ID"],
						element_name : dataE[ii]["FILE_NAME"],
						element_size : dataE[ii]["FILE_SIZE"],
						element_content_type: dataE[ii]["CONTENT_TYPE"],
						element_url: dataE[ii]["SRC"],
						element_thumbnail: dataE[ii]["SRC"],
						element_image: dataE[ii]["THUMBNAIL"],
						parser: 'file',
						storage : 'bfile' };
					dataF.push(tmp);
					tmpData[editor.id]["data"][cObj["obj"].controlID] = (
						tmpData[editor.id]["data"][cObj["obj"].controlID] || {});
					tmpData[editor.id]["data"][cObj["obj"].controlID]['E' + tmp.id] = 'E' + tmp.id;
				}
			}
			if (cObj["cid"])
				cObj["obj"].CID = cObj["cid"];

			defFun.push(closureFile(cObj["obj"], dataF));
		}
	}

	window.LHEPostForm.reinitDataData[editor.id] = cObjS1;

	if (defFun.length > 0)
	{
		if (!tmpData[editor.id]["func"])
		{
			tmpData[editor.id]["loaded"] = {};
			tmpData[editor.id]["func"] = function(res1, obj1) {
				var i, j, data = tmpData[editor.id]["data"][obj1.controlID];
				if (data !== null)
				{
					data['E' + res1.element_id] = null;
					tmpData[editor.id]["loaded"][obj1.controlID] = (tmpData[editor.id]["loaded"][obj1.controlID] || []);
					tmpData[editor.id]["loaded"][obj1.controlID].push(res1.element_id);
					j = 0;
					for (i in data)
					{
						if (data.hasOwnProperty(i) && data[i])
						{
							j++;
						}
					}
					if (j <= 0)
					{
						tmpData[editor.id]["data"][obj1.controlID] = null;
					}
				}
				j = 0;
				data = tmpData[editor.id]["data"];
				for (i in data)
				{
					if (data.hasOwnProperty(i) && data[i])
					{
						j++;
					}
				}
				if (j <= 0)
				{
					BX.removeCustomEvent(mpFormObj.eventNode, 'OnFileUploadSuccess', tmpData[editor.id]["func"]);
					tmpData[editor.id]["data"] = null;
					tmpData[editor.id]["func"] = null;


					editor.SaveContent();
					var
						handler = LHEPostForm.getHandler(editor.id),
						content = editor.GetContent(),
						contentCopy = content,
						reg, ii,
						parser;
					for (i in tmpData[editor.id]["loaded"])
					{
						if (tmpData[editor.id]["loaded"].hasOwnProperty(i) && handler.controllers[i])
						{
							parser = handler.controllers[i]["parser"];
							data = tmpData[editor.id]["loaded"][i];
							if (handler.parser[parser])
							{
								if (parser == 'disk_file')
								{
									if (dataG['xmlId'])
									{
										for (ii in dataG['xmlId'])
										{
											if (dataG['xmlId'].hasOwnProperty(ii))
											{
												content = content.
													replace(new RegExp('\\&\\#91\\;DOCUMENT ID=(' + ii + ')([WIDTHHEIGHT=0-9 ]*)\\&\\#93\\;','gim'), '[' + handler.parser[parser]["tag"] + '=' + dataG['xmlId'][ii] + "$2]").
													replace(new RegExp('\\[DOCUMENT ID=(' + ii + ')([WIDTHHEIGHT=0-9 ]*)\\]','gim'), '[' + handler.parser[parser]["tag"] + '=' + dataG['xmlId'][ii] + "$2]");
											}
										}
									}
									if (dataG['fileId'])
									{
										for (ii in dataG['fileId'])
										{
											if (dataG['fileId'].hasOwnProperty(ii))
											{
												content = content.
													replace(new RegExp('\\&\\#91\\;' + handler.parser[parser]["tag"] + '=\\D+(' + ii + ')([WIDTHHEIGHT=0-9 ]*)\\&\\#93\\;','gim'), '[' + handler.parser[parser]["tag"] + '=' + dataG['fileId'][ii] + "$2]").
													replace(new RegExp('\\[' + handler.parser[parser]["tag"] + '=\\D+(' + ii + ')([WIDTHHEIGHT=0-9 ]*)\\]','gim'), '[' + handler.parser[parser]["tag"] + '=' + dataG['fileId'][ii] + "$2]");
											}
										}
									}
								}

								reg = new RegExp('(?:\\&\\#91\\;|\\[)(' + handler.parser[parser]["tags"].join("|") + ')=(' + data.join("|") + ')([WIDTHHEIGHT=0-9 ]*)(?:\\&\\#93\\;|\\])','gim');
								if (reg.test(content))
								{
									content = content.replace(reg, BX.delegate(function(str, tagName, id, add) {
										this.checkFileInContent(this.checkFile(parser + id), true);
										return '[' + tagName + '=' + id + add + ']';
									}, handler));
								}
							}

						}
					}
					tmpData[editor.id] = null;
					if (contentCopy != content)
					{
						editor.SetContent(content);
						editor.Focus();
					}
				}
			};
			BX.addCustomEvent(mpFormObj.eventNode, 'OnFileUploadSuccess', tmpData[editor.id]["func"]);
		}
		for (ii = 0; ii < defFun.length; ii++)
			defFun[ii]()
	}
};
window.LHEPostForm.reinitDataBefore = function(editorID)
{
	var handler = LHEPostForm.getHandler(editorID), name, ii, file, end, files,
		form = BX((handler ? handler.formID : '')), res;
//	if (handler.controllersAllLoaded)
//		handler.controllerInit('hide');
	for (ii in handler.controllers)
	{
		if (handler.controllers.hasOwnProperty(ii) && handler.controllers[ii]["obj"] && ii !== "common")
		{
			if (handler.controllers[ii]["parser"] == 'webdav_element' || handler.controllers[ii]["parser"] == 'disk_file')
			{
				while ((res = handler.controllers[ii]["obj"].values.pop()) && res)
				{
					BX.remove(res);
				}
				files = BX.findChildren(form, {tagName : "INPUT", attribute : {name : handler.controllers[ii]["obj"].params.controlName}}, true);
				if (files)
				{
					for (ii = 0; ii < files.length; ii++)
					{
						BX.remove(files[ii]);
					}
				}
			}
			else if (handler.controllers[ii]["obj"].agent && handler.controllers[ii]["obj"].agent.inputName)
			{
				files = BX.findChildren(form, {tagName : "INPUT", attribute : {name : handler.controllers[ii]["obj"].agent.inputName + '[]'}}, true);
				if (files)
				{
					for (ii = 0; ii < files.length; ii++)
					{
						while(BX('wd-doc' + files[ii].value))
							BX.remove(BX('wd-doc' + files[ii].value));
						BX.remove(files[ii]);
					}
				}
			}
		}
	}
};
window.BXPostFormTags = function(formID, buttonID)
{
	this.popup = null;
	this.formID = formID;
	this.buttonID = buttonID;
	this.sharpButton = null;
	this.addNewLink = null;
	this.tagsArea = null;
	this.hiddenField = null;
	this.popupContent = null;

	BX.ready(BX.proxy(this.init, this));
};

window.BXPostFormTags.prototype.init = function()
{
	this.sharpButton = BX(this.buttonID);
	this.addNewLink = BX("post-tags-add-new-" + this.formID);
	this.tagsArea = BX("post-tags-block-" + this.formID);
	this.tagsContainer = BX("post-tags-container-" + this.formID);
	this.hiddenField = BX("post-tags-hidden-" + this.formID);
	this.popupContent = BX("post-tags-popup-content-" + this.formID);
	this.popupInput = BX.findChild(this.popupContent, { tag : "input" });

	var tags = BX.findChildren(this.tagsContainer, { className : "feed-add-post-del-but" }, true);
	for (var i = 0, cnt = tags.length; i < cnt; i++ )
	{
		BX.bind(tags[i], "click", BX.proxy(this.onTagDelete, {
			obj : this,
			tagBox : tags[i].parentNode,
			tagValue : tags[i].parentNode.getAttribute("data-tag")
		}));
	}

	BX.bind(this.sharpButton, "click", BX.proxy(this.onButtonClick, this));
	BX.bind(this.addNewLink, "click", BX.proxy(this.onAddNewClick, this));
};

window.BXPostFormTags.prototype.onTagDelete = function()
{
	BX.remove(this.tagBox);
	this.obj.hiddenField.value = this.obj.hiddenField.value.replace(this.tagValue + ',', '').replace('  ', ' ');
};

window.BXPostFormTags.prototype.show = function()
{
	if (this.popup === null)
	{
		this.popup = new BX.PopupWindow("bx-post-tag-popup", this.addNewLink, {
			content : this.popupContent,
			lightShadow : false,
			offsetTop: 8,
			offsetLeft: 10,
			autoHide: true,
			angle : true,
			closeByEsc: true,
			zIndex: -910,
			buttons: [
				new BX.PopupWindowButton({
					text : BX.message("TAG_ADD"),
					events : {
						click : BX.proxy(this.onTagAdd, this)
					}
				})
			]
		});

		BX.bind(this.popupInput, "keydown", BX.proxy(this.onKeyPress, this));
		BX.bind(this.popupInput, "keyup", BX.proxy(this.onKeyPress, this));
	}

	this.popup.show();
	BX.focus(this.popupInput);
};

window.BXPostFormTags.prototype.addTag = function(tagStr)
{
	var tags = BX.type.isNotEmptyString(tagStr) ? tagStr.split(",") : this.popupInput.value.split(",");
	var result = [];
	for (var i = 0; i < tags.length; i++ )
	{
		var tag = BX.util.trim(tags[i]);
		if(tag.length > 0)
		{
			var allTags = this.hiddenField.value.split(",");
			if(!BX.util.in_array(tag, allTags))
			{
				var newTagDelete;
				var newTag = BX.create("span", {
					children : [
						(newTagDelete = BX.create("span", { attrs : { "class": "feed-add-post-del-but" }}))
					],
					attrs : { "class": "feed-add-post-tags" }
				});

				newTag.insertBefore(document.createTextNode(tag), newTagDelete);
				this.tagsContainer.insertBefore(newTag, this.addNewLink);

				BX.bind(newTagDelete, "click", BX.proxy(this.onTagDelete, {
					obj : this,
					tagBox : newTag,
					tagValue : tag
				}));

				this.hiddenField.value += tag + ',';

				result.push(tag);
			}
		}
	}

	return result;
};

window.BXPostFormTags.prototype.onTagAdd = function(event)
{
	this.addTag();
	this.popupInput.value = "";
	this.popup.close();
};

window.BXPostFormTags.prototype.onAddNewClick = function(event)
{
	event = event || window.event;
	this.show();
	BX.PreventDefault(event);
};

window.BXPostFormTags.prototype.onButtonClick = function(event)
{
	event = event || window.event;
	BX.show(this.tagsArea);
	this.show();
	BX.PreventDefault(event);
};

window.BXPostFormTags.prototype.onKeyPress = function(event)
{
	event = event || window.event;
	var key = (event.keyCode ? event.keyCode : (event.which ? event.which : null));
	if (key == 13)
	{
		setTimeout(BX.proxy(this.onTagAdd, this), 0);
	}
};

var lastWaitElement = null;
window.MPFbuttonShowWait = function(el)
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
};

window.MPFbuttonCloseWait = function(el)
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

window.__mpf_wd_getinfofromnode = function(result, obj)
{
	var preview = BX.findChild(BX((result["prefixNode"] || 'wd-doc') + result.element_id), {'className': 'files-preview', 'tagName' : 'IMG'}, true, false);
	if (preview)
	{
		result.lowsrc = preview.src;
		result.element_url = preview.src.replace(/\Wwidth\=(\d+)/, '').replace(/\Wheight\=(\d+)/, '');
		result.width = parseInt(preview.getAttribute("data-bx-full-width"));
		result.height = parseInt(preview.getAttribute("data-bx-full-height"));
	}
	else if (obj.urlGet)
	{
		result.element_url = obj.urlGet.
			replace("#element_id#", result.element_id).
			replace("#ELEMENT_ID#", result.element_id).
			replace("#element_name#", result.element_name).
			replace("#ELEMENT_NAME#", result.element_name);
	}
};

var MPFMention = {listen: false, plus : false, text : ''};

window.BXfpdSetLinkName = function(name)
{
	if (BX.SocNetLogDestination.getSelectedCount(name) <= 0)
		BX('bx-destination-tag').innerHTML = BX.message("BX_FPD_LINK_1");
	else
		BX('bx-destination-tag').innerHTML = BX.message("BX_FPD_LINK_2");
};

window.BXfpdSelectCallback = function(item, type, search, bUndeleted)
{
	if(!BX.findChild(BX('feed-add-post-destination-item'), { attr : { 'data-id' : item.id }}, false, false))
	{
		var type1 = type;
		var prefix = 'S';

		if (type == 'groups')
		{
			type1 = 'all-users';
		}
		else if (BX.util.in_array(type, ['contacts', 'companies', 'leads', 'deals']))
		{
			type1 = 'crm';
		}

		if (type == 'sonetgroups')
		{
			prefix = 'SG';
		}
		else if (type == 'groups')
		{
			prefix = 'UA';
		}
		else if (type == 'users')
		{
			prefix = 'U';
		}
		else if (type == 'department')
		{
			prefix = 'DR';
		}
		else if (type == 'contacts')
		{
			prefix = 'CRMCONTACT';
		}
		else if (type == 'companies')
		{
			prefix = 'CRMCOMPANY';
		}
		else if (type == 'leads')
		{
			prefix = 'CRMLEAD';
		}
		else if (type == 'deals')
		{
			prefix = 'CRMDEAL';
		}

		var stl = (bUndeleted ? ' feed-add-post-destination-undelete' : '');
		stl += (type == 'sonetgroups' && typeof window['arExtranetGroupID'] != 'undefined' && BX.util.in_array(item.entityId, window['arExtranetGroupID']) ? ' feed-add-post-destination-extranet' : '');

		var el = BX.create("span", {
			attrs : {
				'data-id' : item.id
			},
			props : {
				className : "feed-add-post-destination feed-add-post-destination-"+type1+stl
			},
			children: [
				BX.create("input", {
					attrs : {
						'type' : 'hidden',
						'name' : 'SPERM[' + prefix + '][]',
						'value' : item.id
					}
				}),
				BX.create("span", {
					props : {
						'className' : "feed-add-post-destination-text"
					},
					html : item.name
				})
			]
		});

		if(!bUndeleted)
		{
			el.appendChild(BX.create("span", {
				props : {
					'className' : "feed-add-post-del-but"
				},
				events : {
					'click' : function(e){
						BX.SocNetLogDestination.deleteItem(item.id, type, window.BXSocNetLogDestinationFormName);
						BX.PreventDefault(e)
					},
					'mouseover' : function(){
						BX.addClass(this.parentNode, 'feed-add-post-destination-hover');
					},
					'mouseout' : function(){
						BX.removeClass(this.parentNode, 'feed-add-post-destination-hover');
					}
				}
			}));
		}
		BX('feed-add-post-destination-item').appendChild(el);
	}

	BX('feed-add-post-destination-input').value = '';
	window.BXfpdSetLinkName(window.BXSocNetLogDestinationFormName);
};

// remove block
window.BXfpdUnSelectCallback = function(item, type, search)
{
	var elements = BX.findChildren(BX('feed-add-post-destination-item'), {attribute: {'data-id': ''+item.id+''}}, true);
	if (elements !== null)
	{
		for (var j = 0; j < elements.length; j++)
			BX.remove(elements[j]);
	}
	BX('feed-add-post-destination-input').value = '';
	window.BXfpdSetLinkName(window.BXSocNetLogDestinationFormName);
};
window.BXfpdOpenDialogCallback = function()
{
	BX.style(BX('feed-add-post-destination-input-box'), 'display', 'inline-block');
	BX.style(BX('bx-destination-tag'), 'display', 'none');
	BX.focus(BX('feed-add-post-destination-input'));
};

window.BXfpdCloseDialogCallback = function()
{
	if (!BX.SocNetLogDestination.isOpenSearch() && BX('feed-add-post-destination-input').value.length <= 0)
	{
		BX.style(BX('feed-add-post-destination-input-box'), 'display', 'none');
		BX.style(BX('bx-destination-tag'), 'display', 'inline-block');
		window.BXfpdDisableBackspace();
	}
};

window.BXfpdCloseSearchCallback = function()
{
	if (!BX.SocNetLogDestination.isOpenSearch() && BX('feed-add-post-destination-input').value.length > 0)
	{
		BX.style(BX('feed-add-post-destination-input-box'), 'display', 'none');
		BX.style(BX('bx-destination-tag'), 'display', 'inline-block');
		BX('feed-add-post-destination-input').value = '';
		window.BXfpdDisableBackspace();
	}

};
window.BXfpdDisableBackspace = function(event)
{
	if (BX.SocNetLogDestination.backspaceDisable || BX.SocNetLogDestination.backspaceDisable !== null)
		BX.unbind(window, 'keydown', BX.SocNetLogDestination.backspaceDisable);

	BX.bind(window, 'keydown', BX.SocNetLogDestination.backspaceDisable = function(event){
		if (event.keyCode == 8)
		{
			BX.PreventDefault(event);
			return false;
		}
	});
	setTimeout(function(){
		BX.unbind(window, 'keydown', BX.SocNetLogDestination.backspaceDisable);
		BX.SocNetLogDestination.backspaceDisable = null;
	}, 5000);
};

window.BXfpdSearchBefore = function(event)
{
	if (event.keyCode == 8 && BX('feed-add-post-destination-input').value.length <= 0)
	{
		BX.SocNetLogDestination.sendEvent = false;
		BX.SocNetLogDestination.deleteLastItem(window.BXSocNetLogDestinationFormName);
	}

	return true;
};
window.BXfpdSearch = function(event)
{
	if (event.keyCode == 16 || event.keyCode == 17 || event.keyCode == 18 || event.keyCode == 20 || event.keyCode == 244 || event.keyCode == 224 || event.keyCode == 91)
		return false;

	if (event.keyCode == 13)
	{
		BX.SocNetLogDestination.selectFirstSearchItem(window.BXSocNetLogDestinationFormName);
		return true;
	}
	if (event.keyCode == 27)
	{
		BX('feed-add-post-destination-input').value = '';
		BX.style(BX('bx-destination-tag'), 'display', 'inline');
	}
	else
	{
		BX.SocNetLogDestination.search(BX('feed-add-post-destination-input').value, true, window.BXSocNetLogDestinationFormName);
	}

	if (!BX.SocNetLogDestination.isOpenDialog() && BX('feed-add-post-destination-input').value.length <= 0)
	{
		BX.SocNetLogDestination.openDialog(window.BXSocNetLogDestinationFormName);
	}
	else
	{
		if (BX.SocNetLogDestination.sendEvent && BX.SocNetLogDestination.isOpenDialog())
			BX.SocNetLogDestination.closeDialog();
	}
	if (event.keyCode == 8)
	{
		BX.SocNetLogDestination.sendEvent = true;
	}
	return true;
};

window.onKeyDownHandler = function(e, editor, formID)
{
	var keyCode = e.keyCode;

	if (!window['BXfpdStopMent' + formID])
		return true;

	if (keyCode == 107 || (e.shiftKey || e.modifiers > 3) &&
		BX.util.in_array(keyCode, [187, 50, 107, 43, 61]))
	{
		setTimeout(function()
		{
			var
				range = editor.selection.GetRange(),
				doc = editor.GetIframeDoc(),
				txt = (range ? range.endContainer.textContent : ''),
				determiner = (txt ? txt.slice(range.endOffset - 1, range.endOffset) : ''),
				prevS = (txt ? txt.slice(range.endOffset - 2, range.endOffset-1) : '');

			if ((determiner == "@" || determiner == "+")
				&&
				(!prevS || BX.util.in_array(prevS, ["+", "@", ",", "("]) || (prevS.length == 1 && BX.util.trim(prevS) === "")))
			{
				MPFMention.listen = true;
				MPFMention.text = '';
				MPFMention.leaveContent = true;

				range.setStart(range.endContainer, range.endOffset - 1);
				range.setEnd(range.endContainer, range.endOffset);
				editor.selection.SetSelection(range);
				var mentNode = BX.create("SPAN", {props: {id: "bx-mention-node"}}, doc);
				editor.selection.Surround(mentNode, range);
				range.setStart(mentNode, 1);
				range.setEnd(mentNode, 1);
				editor.selection.SetSelection(range);

				if(!BX.SocNetLogDestination.isOpenDialog())
				{
					BX.SocNetLogDestination.openDialog(window['BXSocNetLogDestinationFormNameMent' + formID],
						{
							bindNode: getMentionNodePosition(mentNode, editor)
						}
					);
				}
			}
		}, 10);
	}

	if(MPFMention.listen && keyCode == 13)
	{
		BX.SocNetLogDestination.selectFirstSearchItem(window['BXSocNetLogDestinationFormNameMent' + formID]);
		editor.iframeKeyDownPreventDefault = true;
		BX.PreventDefault(e);
	}

	if (!MPFMention.listen && keyCode === editor.KEY_CODES["enter"])
	{
		var range = editor.selection.GetRange();
		if (range.collapsed)
		{
			var
				node = range.endContainer,
				doc = editor.GetIframeDoc();

			if (node)
			{
				if (node.className !== 'bxhtmled-metion')
				{
					node = BX.findParent(node, function(n)
					{
						return n.className == 'bxhtmled-metion';
					}, doc.body);
				}

				if (node && node.className == 'bxhtmled-metion')
				{
					editor.selection.SetAfter(node);
				}
			}
		}
	}
};

window.onKeyUpHandler = function(e, editor, formID)
{
	var
		keyCode = e.keyCode,
		doc, range;

	if (!window['BXfpdStopMent' + formID])
		return true;

	if(MPFMention.listen === true)
	{
		if(keyCode == 27) //ESC
		{
			window['BXfpdStopMent' + formID]();
		}
		else if(keyCode !== 13)
		{
			doc = editor.GetIframeDoc();
			var mentNode = doc.getElementById('bx-mention-node');

			if (mentNode)
			{
				var
					mentText = BX.util.trim(editor.util.GetTextContent(mentNode)),
					mentTextOrig = mentText;

				mentText = mentText.replace(/^[\+@]*/, '');
				BX.SocNetLogDestination.search(mentText, true, window['BXSocNetLogDestinationFormNameMent' + formID], BX.message("MPF_NAME_TEMPLATE"), {bindNode: getMentionNodePosition(mentNode, editor)});

				if (MPFMention.leaveContent && MPFMention._lastText && mentTextOrig === '')
				{
					window['BXfpdStopMent' + formID]();
				}
				else if (MPFMention.leaveContent && MPFMention.lastText && mentTextOrig !== '' && mentText === '')
				{
					window['BXfpdStopMent' + formID]();
					BX.SocNetLogDestination.openDialog(window['BXSocNetLogDestinationFormNameMent' + formID],
						{
							bindNode: getMentionNodePosition(mentNode, editor)
						}
					);
				}

				MPFMention.lastText = mentText;
				MPFMention._lastText = mentTextOrig;
			}
		}
	}
	else
	{
		if (
			!e.shiftKey &&
			(keyCode === editor.KEY_CODES["space"] ||
			keyCode === editor.KEY_CODES["escape"] ||
			keyCode === 188 ||
			keyCode === 190
			))
		{
			range = editor.selection.GetRange();
			if (range.collapsed)
			{
				var node = range.endContainer;
				doc = editor.GetIframeDoc();

				if (node)
				{
					if (node.className !== 'bxhtmled-metion')
					{
						node = BX.findParent(node, function(n)
						{
							return n.className == 'bxhtmled-metion';
						}, doc.body);
					}

					if (node && node.className == 'bxhtmled-metion')
					{
						mentText = editor.util.GetTextContent(node);
						var matchSep = mentText.match(/[\s\.\,]$/);
						if (matchSep || keyCode === editor.KEY_CODES["escape"])
						{
							node.innerHTML = mentText.replace(/[\s\.\,]$/, '');
							var sepNode = BX.create('SPAN', {html: matchSep || editor.INVISIBLE_SPACE}, doc);
							editor.util.InsertAfter(sepNode, node);
							editor.selection.SetAfter(sepNode);
						}
					}
				}
			}
		}
	}
}

window.getMentionNodePosition = function(mention, editor)
{
	var
		mentPos = BX.pos(mention),
		editorPos = BX.pos(editor.dom.areaCont),
		editorDocScroll = BX.GetWindowScrollPos(editor.GetIframeDoc()),
		top = editorPos.top + mentPos.bottom - editorDocScroll.scrollTop + 2,
		left = editorPos.left + mentPos.right - editorDocScroll.scrollLeft;

	return {top: top, left: left};
};

window.BxInsertMention = function (params)
{
	var
		item = params.item,
		type = params.type,
		formID = params.formID,
		editorId = params.editorId,
		bNeedComa = params.bNeedComa,
		editor = window.BXHtmlEditor.Get(editorId);

	if(type == 'users' && item && item.entityId > 0 && editor)
	{
		if(editor.GetViewMode() == 'wysiwyg') // WYSIWYG
		{
			var
				doc = editor.GetIframeDoc(),
				range = editor.selection.GetRange(),
				mentNode = doc.getElementById('bx-mention-node'),
				mention = BX.create('SPAN',
					{
						props: {className: 'bxhtmled-metion'},
						text: item.name
					}, doc),
				// &nbsp; - for chrome
				spaceNode = BX.create('SPAN', {html: (bNeedComa ? ',&nbsp;' : '&nbsp;')}, doc);

			editor.SetBxTag(mention, {tag: "postuser", params: {value : item.entityId}});

			if (mentNode)
			{
				editor.util.ReplaceNode(mentNode, mention);
			}
			else
			{
				editor.selection.InsertNode(mention, range);
			}

			if (mention && mention.parentNode)
			{
				editor.util.InsertAfter(spaceNode, mention);
				editor.selection.SetAfter(spaceNode);
			}
		}
		else if (editor.GetViewMode() == 'code' && editor.bbCode) // BB Codes
		{
			editor.textareaView.Focus();
			editor.textareaView.WrapWith(false, false, "[USER=" + item.entityId + "]" + item.name + "[/USER]" + (bNeedComa ? ', ' : ' '));
		}

		delete BX.SocNetLogDestination.obItemsSelected[window['BXSocNetLogDestinationFormNameMent' + formID]][item.id];
		window['BXfpdStopMent' + formID]();
		MPFMention["text"] = '';

		if(editor.GetViewMode() == 'wysiwyg') // WYSIWYG
		{
			editor.Focus();
			editor.selection.SetAfter(spaceNode);
		}
	}
};

window.buildDepartmentRelation = function(department)
{
	var relation = {};
	for(var iid in department)
	{
		var p = department[iid]['parent'];
		if (!relation[p])
			relation[p] = [];
		relation[p][relation[p].length] = iid;
	}
	function makeDepartmentTree(id, relation)
	{
		var arRelations = {};
		if (relation[id])
		{
			for (var x in relation[id])
			{
				var relId = relation[id][x];
				var arItems = [];
				if (relation[relId] && relation[relId].length > 0)
					arItems = makeDepartmentTree(relId, relation);

				arRelations[relId] = {
					id: relId,
					type: 'category',
					items: arItems
				};
			}
		}

		return arRelations;
	}
	return makeDepartmentTree('DR0', relation);
};

window.MPFMentionInit = function(formId, params)
{
	if (!params["items"]["departmentRelation"])
		params["items"]["departmentRelation"] = window.buildDepartmentRelation(params["items"]["department"]);

	window["departmentRelation"] = params["items"]["departmentRelation"]; // for calendar - do not remove

	if (params["initDestination"] === true)
	{
		window.BXSocNetLogDestinationFormName = 'destination' + ('' + new Date().getTime()).substr(6);
		window.BXSocNetLogDestinationDisableBackspace = null;
		BX.SocNetLogDestination.init({
			name : window.BXSocNetLogDestinationFormName,
			searchInput : BX('feed-add-post-destination-input'),
			extranetUser :  params["extranetUser"],
			bindMainPopup : {
				node: BX('feed-add-post-destination-container'),
				offsetTop: '5px',
				offsetLeft: '15px'
			},
			bindSearchPopup : {
				node : BX('feed-add-post-destination-container'),
				offsetTop : '5px',
				offsetLeft: '15px'
			},
			callback : {
				select : window["BXfpdSelectCallback"],
				unSelect : window["BXfpdUnSelectCallback"],
				openDialog : window["BXfpdOpenDialogCallback"],
				closeDialog : window["BXfpdCloseDialogCallback"],
				openSearch : window["BXfpdOpenDialogCallback"],
				closeSearch : window["BXfpdCloseSearchCallback"]
			},
			items : params["items"],
			itemsLast : params["itemsLast"],
			itemsSelected : params["itemsSelected"],
			isCrmFeed : params["isCrmFeed"]
		});
		BX.bind(BX('feed-add-post-destination-input'), 'keyup', window["BXfpdSearch"]);
		BX.bind(BX('feed-add-post-destination-input'), 'keydown', window["BXfpdSearchBefore"]);
		BX.bind(BX('bx-destination-tag'), 'click', function(e){BX.SocNetLogDestination.openDialog(window.BXSocNetLogDestinationFormName); BX.PreventDefault(e); });
		BX.bind(BX('feed-add-post-destination-container'), 'click', function(e){BX.SocNetLogDestination.openDialog(window.BXSocNetLogDestinationFormName); BX.PreventDefault(e); });
		if (params["itemsHidden"])
		{
			for (var ii in params["itemsHidden"])
			{
				window.BXfpdSelectCallback({id:('SG'+params["itemsHidden"][ii]["ID"]), name:params["itemsHidden"][ii]["NAME"]}, 'sonetgroups', '', true);
			}
		}
		window.BXfpdSetLinkName(window.BXSocNetLogDestinationFormName);
	};
	window["BXfpdSelectCallbackMent" + formId] = function(item, type, search)
	{
		window.BxInsertMention({item: item, type: type, formID: formId, editorId: params["editorId"]});
	};

	window["BXfpdStopMent" + formId] = function ()
	{
		BX.SocNetLogDestination.closeDialog();
		BX.SocNetLogDestination.closeSearch();
		clearTimeout(BX.SocNetLogDestination.searchTimeout);
		BX.SocNetLogDestination.searchOnSuccessHandle = false;
	};

	window["BXfpdOnDialogOpen" + formId] = function ()
	{
		MPFMention.listen = true;
	};

	window["BXfpdOnDialogClose" + formId] = function ()
	{
		MPFMention.listen = false;
		setTimeout(function()
		{
			if (!MPFMention.listen)
			{
				var editor = window.BXHtmlEditor.Get(params.editorId);
				if(editor)
				{
					var
						doc = editor.GetIframeDoc(),
						mentNode = doc.getElementById('bx-mention-node');

					if (mentNode)
					{
						editor.selection.SetAfter(mentNode);
						if (MPFMention.leaveContent)
						{
							editor.util.ReplaceWithOwnChildren(mentNode);
						}
						else
						{
							BX.remove(mentNode);
						}
					}
					editor.Focus();
				}
			}
		}, 100);
	};

	window["BXSocNetLogDestinationFormNameMent" + formId] = 'mention' + ('' + new Date().getTime()).substr(5);
	window["BXSocNetLogDestinationDisableBackspace"] = null;
	var bxBMent = BX('bx-b-mention-' + formId);

	BX.SocNetLogDestination.init({
		name : window["BXSocNetLogDestinationFormNameMent" + formId],
		searchInput : bxBMent,
		extranetUser : params["extranetUser"],
		bindMainPopup :  {
			node : bxBMent,
			offsetTop : '1px',
			offsetLeft: '12px'
		},
		bindSearchPopup : {
			node : bxBMent,
			offsetTop : '1px',
			offsetLeft: '12px'
		},
		callback : {
			select : window["BXfpdSelectCallbackMent" + formId],
			openDialog : window["BXfpdOnDialogOpen" + formId],
			closeDialog : window["BXfpdOnDialogClose" + formId],
			openSearch : window["BXfpdOnDialogOpen" + formId],
			closeSearch : window["BXfpdOnDialogClose" + formId]
		},
		items : {
			users : params["items"]["users"],
			groups : {},
			sonetgroups : {},
			department : params["items"]["department"],
			departmentRelation : params["items"]["departmentRelation"]
		},
		itemsLast : {
			users : window["lastUsers"],
			sonetgroups : {},
			department : {},
			groups : {}
		},
		itemsSelected : params["itemsSelected"],
		departmentSelectDisable : true,
		obWindowClass : 'bx-lm-mention',
		obWindowCloseIcon : false
	});

	BX.ready(function() {
			var ment = BX('bx-b-mention-' + formId);
			if(BX.browser.IsIE() && !BX.browser.IsIE9())
			{
				ment.style.width = '1px';
				ment.style.marginRight = '0';
			}

			BX.bind(
				ment,
				"mousedown",
				function(e)
				{
					if(MPFMention.listen !== true)
					{
						var
							editor = window.BXHtmlEditor.Get(params.editorId),
							range = editor.selection.GetRange(),
							doc = editor.GetIframeDoc();

						MPFMention.listen = true;
						MPFMention.text = '';
						MPFMention.leaveContent = false;

						if(editor.GetViewMode() == 'wysiwyg' && doc)
						{
							var mentNode = doc.getElementById('bx-mention-node');
							if (mentNode)
							{
								BX.remove(mentNode);
							}
							editor.InsertHtml('<span id="bx-mention-node">' + editor.INVISIBLE_SPACE + '</span>', range);
						}

						setTimeout(function()
						{
							if(!BX.SocNetLogDestination.isOpenDialog())
							{
								BX.SocNetLogDestination.openDialog(window["BXSocNetLogDestinationFormNameMent" + formId], {bindNode: ment});
							}

							var mentionNode = doc.getElementById('bx-mention-node');
							if (mentionNode)
							{
								range.setStart(mentionNode, 0);
								if (mentionNode.firstChild && mentionNode.firstChild.nodeType == 3 && mentionNode.firstChild.nodeValue.length > 0)
								{
									range.setEnd(mentionNode, 1);
								}
								else
								{
									range.setEnd(mentionNode, 0);
								}
								editor.selection.SetSelection(range);
							}
							editor.Focus();
						}, 100);

						BX.onCustomEvent(ment, 'mentionClick');
					}
				}
			);
		}
	);
}
})(window);