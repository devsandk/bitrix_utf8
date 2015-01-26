;(function(){

if (window.BX.CViewer)
	return;

BX.viewElementBind = function(div, params, isTarget, groupBy)
{
	var obElementViewer = new BX.CViewer(params);

	if(!isTarget)
		isTarget = function(node){
			return BX.type.isElementNode(node) && (node.getAttribute('data-bx-viewer') || node.tagName.toUpperCase() == 'IMG');
		}
;

	BX.ready(function(){
		_viewerElementBind(div, isTarget, groupBy, obElementViewer);
	});

	return obElementViewer;
};

function _viewerElementBind(div, isTarget, groupBy, obElementViewer)
{
	var div = BX(div);
	if (!!div)
	{
		BX.bindDelegate(div, 'click', isTarget, function(e)
		{
			//not run elementShow if click on folder
			if(this.getAttribute('data-bx-viewer') == 'folder')
				return true;

			var parent = div;
			if (!!groupBy)
			{
				parent = BX.findParent(this, groupBy, div)||parent;
			}

			obElementViewer.setList([]);
			var elementNodeList = BX.findChildren(parent, isTarget, true);
			for(var i=0; i<elementNodeList.length; i++)
			{
				var type = elementNodeList[i].getAttribute('data-bx-viewer');
				if(type == 'image' || elementNodeList[i].getAttribute('data-bx-image'))
				{
					var imageElement = new BX.CViewImageElement({
						src: elementNodeList[i].getAttribute('data-bx-src') || elementNodeList[i].getAttribute('data-bx-download') || elementNodeList[i].getAttribute('data-bx-image'),
						width: elementNodeList[i].getAttribute('data-bx-width'),
						height: elementNodeList[i].getAttribute('data-bx-height'),
						title: elementNodeList[i].getAttribute('data-bx-title')||elementNodeList[i].alt||elementNodeList[i].title,
						full: elementNodeList[i].getAttribute('data-bx-full'),
						full_width: elementNodeList[i].getAttribute('data-bx-full-width'),
						full_height: elementNodeList[i].getAttribute('data-bx-full-height'),
						full_size: elementNodeList[i].getAttribute('data-bx-full-size'),
						buttons: []
					});
					imageElement.buttons.push(imageElement.getComplexSaveButton(obElementViewer, {
						downloadUrl: elementNodeList[i].getAttribute('data-bx-download') || elementNodeList[i].getAttribute('data-bx-full') || elementNodeList[i].getAttribute('data-bx-image') || elementNodeList[i].getAttribute('data-bx-src')
					}));
					obElementViewer.add(imageElement);
				}
				else if(type == 'iframe-extlinks')
				{
					var iframeElement = new BX.CViewIframeExtLinksElement({
						title: elementNodeList[i].getAttribute('data-bx-title'),
						src: elementNodeList[i].getAttribute('data-bx-src'),
						viewerUrl: elementNodeList[i].getAttribute('data-bx-viewerUrl'),
						buttons: []
					});
					iframeElement.buttons.push(
						BX.create('a', {
							props: {
								className: 'bx-viewer-btn',
								href: elementNodeList[i].getAttribute('data-bx-src')
							},
							events: {
								click: BX.delegate(function(e)
								{
									//if click on download link, but iframe not loaded.
									if(!this.loaded)
									{
										var iframeElement = this;
										setTimeout(function(){
											obElementViewer.show(iframeElement);
										}, 50);
									}
									BX.eventCancelBubble(e);
									return false;
								}, iframeElement)
							},
							text: BX.message('JS_CORE_VIEWER_DOWNLOAD')
						}));
					obElementViewer.add(iframeElement);
				}
				else if(type == 'iframe')
				{
					var iframeElement = obElementViewer.createElementByType(elementNodeList[i]);
					obElementViewer.add(iframeElement);
				}
				else if(type == 'unknown')
				{
					var unknowElement = new BX.CViewUnknownElement({
						title: elementNodeList[i].getAttribute('data-bx-title'),
						src: elementNodeList[i].getAttribute('data-bx-src'),
						isFromUserLib: !!elementNodeList[i].getAttribute('data-bx-isFromUserLib'),
						externalId: elementNodeList[i].getAttribute('data-bx-externalId'),
						relativePath: elementNodeList[i].getAttribute('data-bx-relativePath'),
						editUrl: elementNodeList[i].getAttribute('data-bx-edit'),
						owner: elementNodeList[i].getAttribute('data-bx-owner'),
						size: elementNodeList[i].getAttribute('data-bx-size'),
						dateModify: elementNodeList[i].getAttribute('data-bx-dateModify'),
						tooBigSizeMsg: !!elementNodeList[i].getAttribute('data-bx-tooBigSizeMsg'),
						buttons: []
					});
					unknowElement.buttons.push(unknowElement.getLocalEditButton(obElementViewer, {
						enableEdit: !!unknowElement.isFromUserLib || !!unknowElement.editUrl
					}));

					unknowElement.buttons.push(unknowElement.getComplexSaveButton(obElementViewer, {
						downloadUrl: elementNodeList[i].getAttribute('data-bx-src')
					}));
					obElementViewer.add(unknowElement);
				}
				else if(type == 'onlyedit')
				{
					var nonPreviewEditableElement = obElementViewer.createElementByType(elementNodeList[i]);
					obElementViewer.add(nonPreviewEditableElement);
				}
				else if(type == 'folder')
				{
					obElementViewer.add(new BX.CViewFolderElement({
						title: elementNodeList[i].getAttribute('data-bx-title'),
						src: elementNodeList[i].getAttribute('data-bx-src'),
						owner: elementNodeList[i].getAttribute('data-bx-owner'),
						dateModify: elementNodeList[i].getAttribute('data-bx-dateModify'),
						buttons: []
					}));
				}
			}
			BX.CViewer.objNowInShow = obElementViewer;
			obElementViewer.show(this.getAttribute('data-bx-image')||this.getAttribute('data-bx-src')||this.src);

			return BX.PreventDefault(e);
		});
	}
}


BX.CViewCoreElement = function(params)
{
	params = params || {};
	this.baseElementId = params.baseElementId;
	this.id = params.id || params.src;
	this.title = params.title;
	this.text = params.text;
	this.width = params.width;
	this._minWidth = params._minWidth;
	this.height = params.height;
	this._minHeight = params._minHeight;
	this.domElement = null;
	this.titleDomElement = null;
	this.titleButtons = null;
	this.src = params.src;
	this.loaded = false;
	this.preventShow = false;
	this.listOfTimeoutIds = [];
	this.contentWrap = null;
	this.isProccessed = false;
	this.topPadding = 0;
	this.buttons = params.buttons || [];
	this.showTitle = params.showTitle || true;
	this.isHistory = false;
	this.autoReduction = false;

	if(this._minWidth === undefined)
	{
		this._minWidth = 550;
	}
	if(this._minHeight === undefined)
	{
		this._minHeight = 350;
	}

	this.isFromUserLib = params.isFromUserLib || false;
	this.externalId = params.externalId || false;
	this.relativePath = params.relativePath || false;
	this.editUrl = params.editUrl || false;
}

BX.CViewCoreElement.prototype.getDataForCommit = function()
{
	return {};
}

BX.CViewCoreElement.prototype.setContentWrap = function(contentWrap){
	this.contentWrap = contentWrap;
};

BX.CViewCoreElement.prototype.runAction = function(action, params){
	action = action.toLowerCase();
	switch(action)
	{
		case 'edit':
			if(!this.editUrl)
			{
				return false;
			}
			this.addTimeoutId(setTimeout(function(){
				BX.fireEvent(BX('bx-viewer-edit-btn'), 'click')
			}, 100));
			break;
		case 'localedit':
		case 'forceedit':
			if(!params.obElementViewer)
			{
				return false;
			}
			this.localEditProcess(params.obElementViewer);
			break;
		case 'localview':
			if(!params.obElementViewer)
			{
				return false;
			}
			this.localViewProcess(params.obElementViewer);
			break;
	}

	return;
};

BX.CViewCoreElement.prototype.localEditProcess = function(obElementViewer)
{
	var editUrl = this.editUrl;
	if(BX.CViewer.isEnableLocalEditInDesktop())
	{
		if(!this.isFromUserLib && editUrl)
		{
			if (editUrl.indexOf(window.location.hostname) === -1) {
				window.location.origin = window.location.origin || (window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: ''));
				editUrl = window.location.origin + editUrl;
			}
			//editUrl = this.addToLinkParam(editUrl, 'action', 'start');
			editUrl = CViewerUrlHelper.getUrlEditFile(editUrl, 'l');
			location.href = 'bx://editFile/url/' + encodeURIComponent(editUrl) + '/name/' + encodeURIComponent(this.title);
		}
		else if(this.relativePath && this.externalId)
		{
			location.href = 'bx://openFile/externalId/' + encodeURIComponent(this.externalId);
		}
		obElementViewer.close();
		return;
	}
	return;
};

BX.CViewCoreElement.prototype.localViewProcess = function(obElementViewer)
{
	var downloadUrl = this.downloadUrl;
	if(BX.CViewer.isEnableLocalEditInDesktop())
	{
		if(!this.isFromUserLib && downloadUrl)
		{
			if (downloadUrl.indexOf(window.location.hostname) === -1) {
				window.location.origin = window.location.origin || (window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: ''));
				downloadUrl = window.location.origin + downloadUrl;
			}
			//editUrl = this.addToLinkParam(editUrl, 'action', 'start');
			downloadUrl = CViewerUrlHelper.getUrlEditFile(downloadUrl, 'l');
			location.href = 'bx://viewFile/url/' + encodeURIComponent(downloadUrl) + '/name/' + encodeURIComponent(this.title);
		}
		else if(this.relativePath && this.externalId)
		{
			location.href = 'bx://openFile/externalId/' + encodeURIComponent(this.externalId);
		}
		obElementViewer.close();
		return;
	}
	return;
};

BX.CViewCoreElement.prototype.getTextForSave = function(){
	return '';
};

BX.CViewCoreElement.prototype.getComplexEditButton = function(selfViewer, params)
{
	var enableEdit = params.enableEdit || false;
	var initEditService = selfViewer.initEditService();
	var editBtn = BX.create('span', {
			props: {
			id: 'bx-viewer-edit-btn',
			className: 'bx-viewer-btn-split-text'
		},
		events: {
			click: BX.delegate(function(e){
				if(!this.editUrl)
				{
					return BX.PreventDefault(e);
				}
				BX.PreventDefault(e);
				selfViewer.runActionByCurrentElement('forceEdit', {obElementViewer: selfViewer});
			}, this)
		},
		children: [
			BX.create('i', {
				props: {
					id: 'bx-viewer-edit-service-txt'
				},
				text: !BX.CViewer.isLocalEditService(initEditService) /*&& !this.isFromUserLib*/? selfViewer.getNameEditService(initEditService) : selfViewer.getNameEditService()
			})
		]
	});

	editBtn.insertBefore(document.createTextNode(BX.message(BX.CViewer.isLocalEditService(initEditService)? 'JS_CORE_VIEWER_EDIT_IN_LOCAL_SERVICE_SHORT' : 'JS_CORE_VIEWER_EDIT_IN_SERVICE').replace('#SERVICE#', ' ')), editBtn.firstChild);

	return BX.create('span', {
		props: {
			className: 'bx-viewer-btn-split ' + (enableEdit? '' : 'bx-viewer-btn-split-disable'),
			title: enableEdit? '' : BX.message('JS_CORE_VIEWER_DISABLE_EDIT_BY_PERM')
		},
		children: [
			BX.create('span', {
				props: {
					className: 'bx-viewer-btn-split-l'
				},
				children: [
					editBtn,
					BX.create('span', {
						props: {
							className: 'bx-viewer-btn-split-bg'
						}
					})
				]
			}),
			BX.create('span', {
				props: {
					className: 'bx-viewer-btn-split-r'
				},
				events: {
					click: BX.delegate(function(event)
					{
						if(!this.getCurrent().editUrl)
						{
							return BX.PreventDefault(event);
						}

						var ele = event.srcElement || event.target;
						var buttonsForEdit = [
							{text: BX.message('JS_CORE_VIEWER_EDIT_IN_SERVICE').replace('#SERVICE#', this.getNameEditService('google')), className: "bx-viewer-popup-item item-gdocs", href: "#", onclick: BX.delegate(function (e) {
								this.setEditService('google');
								BX.fireEvent(BX('bx-viewer-edit-btn'), 'click');
								this.closeMenu();

								return BX.PreventDefault(e);
							}, this)},
							{text: BX.message('JS_CORE_VIEWER_EDIT_IN_SERVICE').replace('#SERVICE#', this.getNameEditService('skydrive')), className: "bx-viewer-popup-item item-office", href: "#", onclick: BX.delegate(function (e) {
								this.setEditService('skydrive');
								BX.fireEvent(BX('bx-viewer-edit-btn'), 'click');
								this.closeMenu();

								return BX.PreventDefault(e);
							}, this)}
						];
						if(/*this.getCurrent().isFromUserLib &&*/ this.getCurrent().editUrl)
						{
							buttonsForEdit.push(
								{text: BX.message('JS_CORE_VIEWER_EDIT_IN_LOCAL_SERVICE').replace('#SERVICE#', this.getNameEditService('local')), className: "bx-viewer-popup-item item-local", href: "#", onclick: BX.delegate(function (e) {

									if(BX.CViewer.isEnableLocalEditInDesktop())
									{
										this.setEditService('local');
										BX.fireEvent(BX('bx-viewer-edit-btn'), 'click');
									}
									else
									{
										selfViewer.helpDiskDialog();
									}
									this.closeMenu();
									return BX.PreventDefault(e);
								}, this)}
							);
						}

						this.openMenu('bx-viewer-popup-edit', BX(ele), buttonsForEdit, {
							offsetTop: 0,
							offsetLeft: -9
						});
					}, selfViewer)
				},
				children: [
					BX.create('span', {
						props: {
							className: 'bx-viewer-btn-split-bg'
						}
					})
				]
			})
		]
	});
}

BX.CViewCoreElement.prototype.getLocalEditButton = function(selfViewer, params)
{
	var enableEdit = params.enableEdit || false;
	if(/*!this.isFromUserLib || */!this.editUrl || !BX.CViewer.isEnableLocalEditInDesktop())
	{
		return [];
	}
	var editBtn = BX.create('span', {
			props: {
			id: 'bx-viewer-edit-btn',
			className: 'bx-viewer-btn-split-text'
		},
		events: {
			click: BX.delegate(function(e){
				if(!enableEdit)
				{
					return BX.PreventDefault(e);
				}
				BX.PreventDefault(e);
				selfViewer.runActionByCurrentElement('localEdit', {obElementViewer: selfViewer});
			}, this)
		},
		children: [
			BX.create('i', {
				props: {
					id: 'bx-viewer-edit-service-txt'
				},
				text: selfViewer.getNameEditService('local')
			})
		]
	});
	editBtn.insertBefore(document.createTextNode(BX.message('JS_CORE_VIEWER_EDIT_IN_LOCAL_SERVICE_SHORT').replace('#SERVICE#', ' ')), editBtn.firstChild);

	return BX.create('span', {
		props: {
			className: 'bx-viewer-btn-split ' + (enableEdit? '' : 'bx-viewer-btn-split-disable'),
			title: enableEdit? '' : BX.message('JS_CORE_VIEWER_DISABLE_EDIT_BY_PERM')
		},
		children: [
			BX.create('span', {
				props: {
					className: 'bx-viewer-btn-split-l'
				},
				children: [
					editBtn,
					BX.create('span', {
						props: {
							className: 'bx-viewer-btn-split-bg'
						}
					})
				]
			})
		]
	});
}

BX.CViewCoreElement.prototype.getComplexSaveButton = function(selfViewer, params)
{
	var downloadUrl = params.downloadUrl;
	params.reloadAfterDownload = params.reloadAfterDownload || false;
	return (
		BX.create('a', {
			props: {
				className: 'bx-viewer-btn bx-viewer-btn-save',
				href: downloadUrl
			},
			events: {
				click: BX.delegate(function(event)
				{
					var ele = event.srcElement || event.target;
					selfViewer.openMenu('bx-viewer-popup-down', BX(ele), [
						{text: BX.message('JS_CORE_VIEWER_SAVE_TO_OWN_FILES'), className: "bx-viewer-popup-item item-b24", href: '#', onclick: BX.delegate(function(e){
							var link = this.addToLinkParam(this.src, 'saveToDisk', 1);
							link = this.addToLinkParam(link, 'toWDController', 1);
							link = BX.util.remove_url_param(link, 'showInViewer');
							link = BX.util.remove_url_param(link, 'document_action');
							link = BX.util.remove_url_param(link, 'primaryAction');
							link = CViewerUrlHelper.getUrlCopyToMe(link);
							selfViewer.closeMenu();

							BX.CViewer.getWindowCopyToDisk({link: link, selfViewer: selfViewer, title: this.title, showEdit: params.showEdit});

							BX.PreventDefault(e);
							return false;
						}, this)},
						{text: BX.message('JS_CORE_VIEWER_DOWNLOAD_TO_PC'), className: "bx-viewer-popup-item item-download", href: downloadUrl, onclick: BX.delegate(function(e){
							selfViewer.closeMenu();
							//if click on download link, but iframe not loaded.
							if(params.reloadAfterDownload && !this.loaded)
							{
								setTimeout(BX.delegate(function(){
									selfViewer.show(this, true);
								}, 1000), this);
							}
							BX.eventCancelBubble(e);
							return false;
						}, this)}
					], {
						offsetTop: 0,
						offsetLeft: -9
					});

					return BX.PreventDefault(event);
				}, this)
			},
			text: BX.message('JS_CORE_VIEWER_SAVE')
	}));
}

BX.CViewCoreElement.prototype.getExtension = function(filename)
{
	filename = filename || '';

	return  filename.split('.').pop();
}

BX.CViewCoreElement.prototype.getIconClassByName = function(filename)
{
	var extension = this.getExtension(filename);
	var className = '';
	switch(extension.toLowerCase())
	{
		case 'txt':
			className = 'bx-viewer-icon-txt';
			break;
		case 'archive':
		case 'gz':
		case 'bz2':
		case 'tar':
			className = 'bx-viewer-icon-archive';
			break;
		case 'zip':
			className = 'bx-viewer-icon-zip';
			break;
		case 'rar':
			className = 'bx-viewer-icon-rar';
			break;
		case 'pdf':
			className = 'bx-viewer-icon-pdf';
			break;
		case 'ppt':
		case 'pptx':
			className = 'bx-viewer-icon-ppt';
			break;
		case 'doc':
		case 'docx':
			className = 'bx-viewer-icon-doc';
			break;
		case 'xls':
		case 'xlsx':
			className = 'bx-viewer-icon-xls';
			break;
		default:
			className = 'bx-viewer-icon';
			break;
	}
	return className;
}

BX.CViewCoreElement.prototype.load = function(successLoadCallback, errorLoadCallback)
{
}
BX.CViewCoreElement.prototype.preload = function(successLoadCallback)
{
}
BX.CViewCoreElement.prototype.hide = function(isCloseElement)
{
	isCloseElement = isCloseElement || false;
	this.preventTimeout();
	this.preventShow = true;
}

BX.CViewCoreElement.prototype.show = function()
{
	this.preventShow = false;
}

BX.CViewCoreElement.prototype.successLoad = function(self)
{}

BX.CViewCoreElement.prototype.onLoad = function()
{
}

BX.CViewCoreElement.prototype.getTitle = function()
{
	return this.title;
}
BX.CViewCoreElement.prototype.getSize = function()
{
	return {
		width: this.width,
		height: this.height
	};
}
BX.CViewCoreElement.prototype.resize = function(w, h)
{
	this.width = w;
	this.height = h;
}
BX.CViewCoreElement.prototype.addTimeoutId = function(id)
{
	this.listOfTimeoutIds.push(id);
}
BX.CViewCoreElement.prototype.preventTimeout = function()
{
	if(!BX.type.isArray(this.listOfTimeoutIds))
	{
		return;
	}
	for (var i in this.listOfTimeoutIds)
	{
		if (this.listOfTimeoutIds.hasOwnProperty(i))
		{
			clearTimeout(this.listOfTimeoutIds[i]);
		}
	}
	this.listOfTimeoutIds = [];
}
BX.CViewCoreElement.prototype.addToLinkSessid = function(link)
{
	return this.addToLinkParam(link, 'sessid', BX.bitrix_sessid());
}
BX.CViewCoreElement.prototype.addToLinkParam = function(link, name, value)
{
	if(!link.length)
	{
		return '?' + name + '=' + value;
	}
	link = BX.util.remove_url_param(link, name);
	if(link.indexOf('?') != -1)
	{
		return link + '&' + name + '=' + value;
	}
	return link + '?' + name + '=' + value;
}
//##############################################################################

BX.CViewImageElement = function(params)
{
	params = params || {};
	BX.CViewIframeElement.superclass.constructor.apply(this, arguments);
	this.image = null;
	this.width = params.width || 200;
	this.height = params.height || 200;
	this.full = params.full;
	this.full_width = params.full_width;
	this.full_height = params.full_height;
	this.full_size = params.full_size;
	this.topPadding = 43;
}

BX.extend(BX.CViewImageElement, BX.CViewCoreElement);

BX.CViewImageElement.prototype.setContentWrap = function(contentWrap){
	this.contentWrap = contentWrap;
};
BX.CViewImageElement.prototype.load = function(successLoadCallback)
{
	successLoadCallback = successLoadCallback || BX.CViewImageElement.prototype.successLoad;
	if(!this.loaded)
	{
		this.preload(function(self){
			successLoadCallback(self);
			self.contentWrap.appendChild(self.domElement);
		});
	}
	else
	{
		(function(self){
			successLoadCallback(self);
			self.contentWrap.appendChild(self.domElement);
		})(this);
	}
	//buildDomElement
	//this.contentWrap.appendChild(this.domElement);
	//this.show();
}
BX.CViewImageElement.prototype.preload = function(successLoadCallback)
{
	if(this.isProccessed)
	{
		return false;
	}
	this.successLoad = successLoadCallback || BX.CViewImageElement.prototype.successLoad;
	if(!this.loaded)
	{
		this.titleDomElement = BX.create('span', {
			props: {
				className: 'bx-viewer-file-name-block bx-viewer-file-center',
				title: this.title
			},
			children: [
				BX.create('span', {
					props: {
						className: 'bx-viewer-file-name',
						title: this.title
					},
					text: this.title
				}),
				BX.create('span', {
					props: {
						className: 'bx-viewer-file-last-v',
						title: this.title
					}
				})
			]
		});

		this.titleButtons = BX.create('span', {
			props: {
				className: 'bx-viewer-top-right'
			},
			style: {
				display: 'none'
			},
			children: this.buttons
		});

		this.image = new Image();
		this.image.onload = BX.proxy(this.onLoad, this);
		this.image.src = this.src;
		this.image.className = 'bx-viewer-image';
		this.image.style.opacity = 0;

		this.isProccessed = true;
		this.domElement = BX.create('div', {
			props: {
				className:'bx-viewer-cap-wrap'
			},
			children: [
			]
		});
	}

	return this.domElement;
}
BX.CViewImageElement.prototype.hide = function(isCloseElement)
{
	isCloseElement = isCloseElement || false;
	this.image.style.opacity = 0;
	this.titleButtons.style.display = 'none';
	this.preventTimeout();
	this.preventShow = isCloseElement? false : true;
}

BX.CViewImageElement.prototype.show = function()
{
	if(!this.domElement)
	{
		return;
	}
	var visibleHeight = this.height;
	if(this.image && this.image.style.height)
	{
		visibleHeight = parseInt(this.image.style.height);
	}
	//vertical align
	if(visibleHeight < this._minHeight)
	{
		BX.adjust(this.domElement, {
			style: {
				paddingTop: (this._minHeight - visibleHeight)/2 + 'px'
			}
		});
	}

	this.titleButtons.style.display = 'block';
	this.image.style.opacity = 1;
	this.preventShow = false;
}

BX.CViewImageElement.prototype.successLoad = function(self)
{}

BX.CViewImageElement.prototype.onLoad = function()
{
	this.isProccessed = false;
	setTimeout(BX.delegate(function(){
		this.loaded = true;
		this.height = this.image.height;
		this.width = this.image.width;
		this.image.style.maxWidth = this.width + "px";
		this.image.style.maxHeight = this.height  + "px";
		this.domElement.appendChild(this.image);
		this.successLoad(this);
	}, this), 150);
}

//##############################################################################
BX.CViewEditableElement = function(params)
{
	BX.CViewEditableElement.superclass.constructor.apply(this, arguments);
	this.askConvert = !!params.askConvert;
	this.editUrl = params.editUrl? this.addToLinkSessid(params.editUrl) : '';
	this.historyPageUrl = params.historyPageUrl || '';
	this.downloadUrl = params.downloadUrl || '';
	this.dataForCommit = {};
	this.urlToPost = params.urlToPost || '';
	this.idToPost = params.idToPost || '';
	this.isNowConverted = false;
	this.version = parseInt(params.version) || 0;
	this.currentModalWindow = params.currentModalWindow || false;
}

BX.extend(BX.CViewEditableElement, BX.CViewCoreElement);

BX.CViewEditableElement.prototype.runAction = function(action, params){

	//todo normalize this! check params, add action class. Return result action.
	action = action.toLowerCase();
	switch(action)
	{
		case 'discard':
			this.discardFile(params);
			break;
		case 'edit':
			if(!this.editUrl)
			{
				return false;
			}
			this.addTimeoutId(setTimeout(function(){
				BX.fireEvent(BX('bx-viewer-edit-btn'), 'click')
			}, 100));
			break;
		case 'forceedit':
			if(!this.editUrl || !params.obElementViewer)
			{
				return false;
			}
//			this.addTimeoutId(setTimeout(BX.delegate(function(){
				this.editFile(params.obElementViewer);
//			}, this), 100));
			break;
		case 'localedit':
			this.localEditProcess(params.obElementViewer);
			break;
		case 'localview':
			if(!params.obElementViewer)
			{
				return false;
			}
			this.localViewProcess(params.obElementViewer);
			break;
		case 'commit':
			this.commitFile(params);
			break;
		case 'create':
			if(!params.obElementViewer)
			{
				return false;
			}

			this.createFile(params.obElementViewer);
			break;
		case 'saveas':
		case 'save':
			if(!params.obElementViewer)
			{
				return false;
			}

			this.saveFile(params);
			break;
		case 'pasteinform':
			this.pasteInForm(params);
			break;
		case 'rename':
			this.renameFile(params);
			break;
		case 'submit':
			this.submitAction(params);
			break;
	}

	return;
};

BX.CViewEditableElement.prototype.createFile = function(obElementViewer)
{
	return;
}
BX.CViewEditableElement.prototype.submitAction = function(params)
{
	return;
}
BX.CViewEditableElement.prototype.renameFile = function(params)
{
	return;
}
BX.CViewEditableElement.prototype.pasteInForm = function(params)
{
	return;
}

BX.CViewEditableElement.prototype.discardFile = function(parameters)
{
	var uriToDoc = parameters.uriToDoc || CViewerUrlHelper.getUrlDiscardFile(this.src);
	var idDoc = parameters.idDoc || parameters.id;
	if(!uriToDoc || !idDoc)
	{
		return false;
	}

	BX.ajax({
		method: 'POST',
		dataType: 'json',
		url: uriToDoc,
		data:  {
			discard: 1,
			editSessionId: parameters.editSessionId,
			id: idDoc,
			sessid: BX.bitrix_sessid()
		},
		onsuccess: function(){}
	});
};

BX.CViewEditableElement.prototype.getTextForSave = function(){
	return BX.message('JS_CORE_VIEWER_IFRAME_PROCESS_SAVE_DOC');
};

BX.CViewEditableElement.prototype.isConverted = function(){

	if(this.isNowConverted)
	{
		return true;
	}
	return !!BX.CViewer._convertElementsMatch[this.src];
};

BX.CViewEditableElement.prototype.getExtensionAfterConvert = function()
{
	var extension = this.getExtension(this.title);
	var newExtension = '';
	switch(extension.toLowerCase())
	{
		case 'ppt':
		case 'pptx':
			newExtension = 'pptx';
			break;
		case 'doc':
		case 'docx':
			newExtension = 'docx';
			break;
		case 'xls':
		case 'xlsx':
			newExtension = 'xlsx';
			break;
	}
	return newExtension;
}

BX.CViewEditableElement.prototype.editFile = function(obElementViewer)
{
	if((/*!this.isFromUserLib || */!BX.CViewer.isLocalEditService(obElementViewer.initEditService())) && this.askConvert)
	{
		var convertDialog = BX.create('div', {
			props: {
				className: 'bx-viewer-confirm'
			},
			children: [
				BX.create('div', {
					props: {
						className: 'bx-viewer-confirm-title'
					},
					text: BX.message('JS_CORE_VIEWER_CONVERT_TITLE').replace('#NEW_FORMAT#', this.getExtensionAfterConvert()),
					children: []
				}),
				BX.create('div', {
					props: {
						className: 'bx-viewer-confirm-text-wrap'
					},
					children: [
						BX.create('span', {
							props: {
								className: 'bx-viewer-confirm-text-alignment'
							}
						}),
						BX.create('span', {
							props: {
								className: 'bx-viewer-confirm-text'
							},
							text: BX.message('JS_CORE_VIEWER_IFRAME_CONVERT_TO_NEW_FORMAT_EX').replace('#NEW_FORMAT#', this.getExtensionAfterConvert()).replace('#OLD_FORMAT#', this.getExtension(this.title))
						})
					]
				})
			]
		});

		obElementViewer.openConfirm(convertDialog, [
			new BX.PopupWindowButton({
				text : BX.message('JS_CORE_VIEWER_IFRAME_CONVERT_ACCEPT'),
				className : "popup-window-button-accept",
				events : { click : BX.delegate(function() {
						this.editFileProcess(obElementViewer);
					}, this
				)}
			}),
			new BX.PopupWindowButton({
				text : BX.message('JS_CORE_VIEWER_IFRAME_CONVERT_DECLINE'),
				events : { click : BX.delegate(function() {
						this.closeConfirm();
					}, obElementViewer
				)}
			})
		], true);
	}
	else
	{
		this.editFileProcess(obElementViewer);
	}
}

BX.CViewEditableElement.prototype.getCurrentModalWindow = function()
{
	return this.currentModalWindow;
}

BX.CViewEditableElement.prototype.setCurrentModalWindow = function(window)
{
	this.currentModalWindow = window;
}
BX.CViewEditableElement.prototype.openEditConfirm = function(obElementViewer)
{
	var saveDialog = BX.create('div', {
		props: {
			className: 'bx-viewer-confirm'
		},
		children: [
			BX.create('div', {
				props: {
					className: 'bx-viewer-confirm-title'
				},
				text: BX.message('JS_CORE_VIEWER_NOW_EDITING_IN_SERVICE').replace('#SERVICE#', obElementViewer.getNameEditService()),
				children: []
			}),
			BX.create('div', {
				props: {
					className: 'bx-viewer-confirm-text-wrap'
				},
				children: [
					BX.create('span', {
						props: {
							className: 'bx-viewer-confirm-text-alignment'
						}
					}),
					BX.create('span', {
						props: {
							className: 'bx-viewer-confirm-text'
						},
						text: BX.message('JS_CORE_VIEWER_IFRAME_DESCR_SAVE_DOC_F').replace('#SAVE_DOC#', BX.message('JS_CORE_VIEWER_IFRAME_SAVE_DOC'))
					})
				]
			})
		]
	});

	obElementViewer.openConfirm(saveDialog, [
		new BX.PopupWindowButton({
			text : BX.message('JS_CORE_VIEWER_IFRAME_SAVE_DOC'),
			className : "popup-window-button-accept",
			events : { click : BX.delegate(function() {

					this.showLoading({text: this.getCurrent().getTextForSave()});

					var dataForCommit = this.getCurrent().getDataForCommit();
					dataForCommit.obElementViewer = this;
					dataForCommit.success = BX.delegate(function(element, response){
						if(this.bVisible && this.isCurrent(element))
						{
							var elementId = response.elementId;
							var cid = response.cid;
							if(element.urlToPost && response.serialize /*&& fileId*/)
							{
								BX.ajax({
									'method': 'POST',
									'dataType': 'html',
									'url': element.urlToPost,
									'data':  {
										sessid: BX.bitrix_sessid(),
										comment_post_id: element.idToPost,
										ENTITY_XML_ID:'BLOG_' + element.idToPost,
										ENTITY_TYPE:'BG',
										ENTITY_ID:element.idToPost,
										NOREDIRECT:'Y',
										AJAX_POST:'Y',
										MODE:'RECORD',
										act: 'add',
										post: 'Y',
										save: 'Y',
										webdav_history: 'Y',
										'UF_BLOG_COMMENT_FH': response.serialize,
										blog_upload_cid: cid,
										comment: BX.CViewer.getMsgAfterUploadNewVersionByUser()
									},
									'onsuccess': function(data){},
									processData: false
								});
								element.isHistory = true;
							}
							if(element.isHistory && element.baseElementId)
							{
								//set version to last. Keep it simple
								this.setCurrent(this.createElementByType(BX(element.baseElementId), {version: 0}));
								this.show();
							}
							else
							{
								this.show(element, true);
							}
						}
					}, this);

					this.runActionByCurrentElement('commit', dataForCommit);
					this.closeConfirm();
					try{
						this.getCurrent().getCurrentModalWindow().close();
					}catch(e){}
				}, obElementViewer
			)}
		}),
		new BX.PopupWindowButton({
			text : BX.message('JS_CORE_VIEWER_IFRAME_CANCEL'),
			events : { click : BX.delegate(function() {
					this.runActionByCurrentElement('discard', this.getCurrent().getDataForCommit());
					this.closeConfirm();
					try{
						this.getCurrent().getCurrentModalWindow().close();
					}catch(e){}
				}, obElementViewer
			)}
		})
	], true);
}
BX.CViewEditableElement.prototype.editFileProcess = function(obElementViewer)
{
	var editUrl = this.editUrl;
	if(BX.CViewer.temporaryServiceEditDoc)
	{
		editUrl = this.addToLinkParam(this.editUrl, 'editIn', BX.CViewer.temporaryServiceEditDoc);
		if(/*this.isFromUserLib && */BX.CViewer.isLocalEditService(BX.CViewer.temporaryServiceEditDoc))
		{
			this.localEditProcess(obElementViewer);
			BX.CViewer.temporaryServiceEditDoc = '';
			return false;
		}
		editUrl = CViewerUrlHelper.getUrlEditFile(editUrl, BX.CViewer.temporaryServiceEditDoc);
		BX.CViewer.temporaryServiceEditDoc = '';
	}
	else if(/*this.isFromUserLib && */BX.CViewer.isLocalEditService(obElementViewer.initEditService()))
	{
		this.localEditProcess(obElementViewer);
		return false;
	}
	else if(!this.isFromUserLib && BX.CViewer.isLocalEditService(obElementViewer.initEditService()))
	{
		obElementViewer.setEditService('g');
		editUrl = this.addToLinkParam(this.editUrl, 'editIn', 'g');
	}

	this.setCurrentModalWindow(obElementViewer.openModal(
		editUrl,
		this.title
	));
	this.openEditConfirm(obElementViewer);

	return false;
}

BX.CViewEditableElement.prototype.setDataForCommit = function(data)
{
	if(data && arguments.length == 1)
	{
		this.dataForCommit = data;
	}
	else if((BX.browser.IsIE() || BX.browser.IsIE11()))
	{
		//IE and garbage collector delete all objects (from modal window). This is half-hack.
		for(var key in arguments)
		{
			if(!arguments.hasOwnProperty(key))
			{
				continue;
			}
			switch(key)
			{
				case 0:
				case '0':
					this.dataForCommit['iframeSrc'] = arguments[key];
					break;
				case 1:
				case '1':
					this.dataForCommit['uriToDoc'] = arguments[key];
					break;
				case 3:
				case '3':
					this.dataForCommit['editSessionId'] = arguments[key];
					break;
				case 4:
				case '4':
					this.dataForCommit['id'] = arguments[key];
					break;
				case 5:
				case '5':
					this.dataForCommit['link'] = arguments[key];
					break;
			}
		}

	}

	return;
}

BX.CViewEditableElement.prototype.getDataForCommit = function()
{
	return this.dataForCommit;
}

BX.CViewEditableElement.prototype.commitFile = function(parameters)
{
	parameters = parameters || {};
	if(!parameters || !parameters.obElementViewer)
	{
		return false;
	}

	var uriToDoc = parameters.uriToDoc || CViewerUrlHelper.getUrlCommitFile(this.src);
	var idDoc = parameters.idDoc || parameters.id;
	if(!uriToDoc || !idDoc)
	{
		return false;
	}

	BX.ajax({
	method: 'POST',
	dataType: 'json',
	url: uriToDoc,
	data:  {
		commit: 1,
		editSessionId: parameters.editSessionId,
		id: idDoc,
		sessid: BX.bitrix_sessid()
	},
	onsuccess: BX.delegate(function(result){
		var newName = result.newName;
		var oldName = result.oldName;
		if(newName)
		{
			BX.CViewer._convertElementsMatch[this.src] = {
				src: this.src.replace(oldName, newName),
				editUrl: this.editUrl.replace(oldName, newName),
				title: this.title.replace(oldName, newName)
			};
			this.title = BX.CViewer._convertElementsMatch[this.src].title;
			this.editUrl = BX.CViewer._convertElementsMatch[this.src].editUrl;
			this.src = BX.CViewer._convertElementsMatch[this.src].src;
			this.isNowConverted = true;
		}
		if(BX.type.isFunction(parameters.success))
		{
			parameters.success(this, result);
		}
	}, this)});

	return false;
}
//##############################################################################
BX.CViewBlankElement = function(params)
{
	BX.CViewBlankElement.superclass.constructor.apply(this, arguments);
	this.id = 'blank_file';
	this.editUrl = params.editUrl;
	this.renameUrl = params.renameUrl;
	this.docType = params.docType;
	this.elementId = false;
	this.sectionId = false;
	this.objectId = false;
	this.targetFolderId = params.targetFolderId || false;
	this.idDoc = '';
	this.uriToDoc = '';
	this.oldName = '';
	this.newName = '';
	this.docService = 'g';
    this.afterSuccessCreate = function(){};
}

BX.extend(BX.CViewBlankElement, BX.CViewEditableElement);

BX.CViewBlankElement.prototype.discardFile = function(parameters)
{
	var uriToDoc = parameters.editUrl ;
	if(this.editUrl)
	{
		uriToDoc = CViewerUrlHelper.getUrlDiscardFile(this.editUrl);
	}
	else
	{
		uriToDoc = parameters.uriToDoc;
		uriToDoc = this.addToLinkParam(uriToDoc, 'createDoc', 1);
		uriToDoc = this.addToLinkParam(uriToDoc, 'discard', 1);
	}

	var idDoc = parameters.idDoc || parameters.id;
	if(!uriToDoc || !idDoc)
	{
		return false;
	}

	BX.ajax({
		method: 'POST',
		dataType: 'json',
		url: uriToDoc,
		data:  {
			discard: 1,
			editSessionId: parameters.editSessionId,
			id: idDoc,
			sessid: BX.bitrix_sessid()
		},
		onsuccess: function(){}
	});
}

BX.CViewBlankElement.prototype.submitAction = function(params)
{
	if(BX('wd-btn-save-blank-with-new-name'))
	{
		BX.fireEvent(BX('wd-btn-save-blank-with-new-name'), 'click');
	}
	return;
}

BX.CViewBlankElement.prototype.createFile = function(obElementViewer)
{
	var editUrl;
	this.docService = obElementViewer.initEditService();
	if(this.editUrl)
	{
		editUrl = CViewerUrlHelper.getUrlStartPublishBlank(this.editUrl, this.docService, this.docType);

		if(BX.CViewer.isLocalEditService(this.docService))
		{
			BX.ajax({
				method: 'POST',
				dataType: 'json',
				url: editUrl,
				data: {
					targetFolderId: this.targetFolderId || '',
					sessid: BX.bitrix_sessid()
				},
				onsuccess: BX.delegate(function (response)
				{
					if (!response) {
						return;
					}
					try
					{
						var formattedResponse = {
							status: 'success',
							objectId: response.object.id,
							name: response.object.name,
							folderName: response.folderName,
							size: response.object.size,
							sizeInt: response.object.sizeInt,
							extension: response.object.extension,
							ext: response.object.extension,
							link: response.link
						};
						//obElementViewer.runActionByCurrentElement('pasteInForm', {response: formattedResponse});
					}
					catch (e)
					{}

					this.title = response.object.name;
					this.editUrl = response.link;
					obElementViewer.runActionByCurrentElement('localedit', {obElementViewer: obElementViewer});
					this.afterSuccessCreate(formattedResponse);

				}, this)
			});
			return;
		}

	}
	else
	{
		editUrl = this.addToLinkParam('/company/personal/user/' + BX.message('USER_ID') + '/files/lib/', 'createIn', obElementViewer.initEditService());
		editUrl = this.addToLinkParam(editUrl, 'toWDController', 1);
		editUrl = this.addToLinkParam(editUrl, 'type', this.docType);
		editUrl = this.addToLinkParam(editUrl, 'createDoc', '1');
		editUrl = this.addToLinkSessid(editUrl);
	}


	var modalWindow = obElementViewer.openModal(
		editUrl,
		this.title
	);

	var createDialog = BX.create('div', {
		props: {
			className: 'bx-viewer-confirm'
		},
		children: [
			BX.create('div', {
				props: {
					className: 'bx-viewer-confirm-title'
				},
				text: BX.message('JS_CORE_VIEWER_NOW_CREATING_IN_SERVICE').replace('#SERVICE#', obElementViewer.getNameEditService()),
				children: []
			}),
			BX.create('div', {
				props: {
					className: 'bx-viewer-confirm-text-wrap'
				},
				children: [
					BX.create('span', {
						props: {
							className: 'bx-viewer-confirm-text-alignment'
						}
					}),
					BX.create('span', {
						props: {
							className: 'bx-viewer-confirm-text'
						},
						text: BX.message('JS_CORE_VIEWER_CREATE_DESCR_SAVE_DOC_F').replace('#SAVE_AS_DOC#', BX.message('JS_CORE_VIEWER_SAVE_AS'))
					})
				]
			})
		]
	});

	BX.CViewer.lockScroll();
	obElementViewer.openConfirm(createDialog, [
		new BX.PopupWindowButton({
			text : BX.message('JS_CORE_VIEWER_SAVE_AS'),
			className : "popup-window-button-accept",
			events : { click : BX.delegate(function() {
					BX.CViewer.showLoading(BX.findChild(createDialog, {className: 'bx-viewer-confirm-text-wrap'}, true), {className: 'bx-viewer-wrap-loading-modal', notAddClassLoadingToObj: true});
					if(BX.proxy_context && BX.is_subclass_of(BX.proxy_context, BX.PopupWindowButton))
					{
						BX.proxy_context.setClassName('bx-viewer-save-disable-button popup-window-button-accept');
					}
					var titleNodeText = BX.findChild(createDialog, {className: 'bx-viewer-confirm-title'}, true);
					if(titleNodeText)
					{
						BX.adjust(titleNodeText, {text: BX.message('JS_CORE_VIEWER_NOW_DOWNLOAD_FROM_SERVICE').replace('#SERVICE#', this.getNameEditService())});
					}
					var dataForCommit = this.getCurrent().getDataForCommit();
					if(BX.CViewer.isEmptyObject(dataForCommit))
					{
						this.closeConfirm();
						BX.CViewer.unlockScroll();
					}
					else
					{
						this.getCurrent().idDoc = dataForCommit.idDoc || dataForCommit.id;
						dataForCommit.obElementViewer = this;
						dataForCommit.success = BX.delegate(function(element, response){
							this.closeConfirm();
						}, this);

						this.runActionByCurrentElement('saveAs', dataForCommit);
					}

					try{
						modalWindow.close();
					}catch(e){}
				}, obElementViewer
			)}
		}),
		new BX.PopupWindowButton({
			text : BX.message('JS_CORE_VIEWER_IFRAME_CANCEL'),
			events : { click : BX.delegate(function() {
					this.runActionByCurrentElement('discard', this.getCurrent().getDataForCommit());
					this.closeConfirm();
                    BX.CViewer.unlockScroll();
					try{
						modalWindow.close();
					}catch(e){}
				}, obElementViewer
			)}
		})
	], true);

	return false;
}

BX.CViewBlankElement.prototype.saveFile = function(parameters)
{
	parameters = parameters || {};
	if(!parameters || !parameters.obElementViewer)
	{
		return false;
	}

	var uriToDoc;
	var idDoc = parameters.idDoc || parameters.id;
	if(this.editUrl)
	{
		uriToDoc = CViewerUrlHelper.getUrlCommitBlank(this.editUrl, this.docType, this.targetFolderId);
	}
	else
	{
		uriToDoc = BX.util.remove_url_param(parameters.uriToDoc, 'editIn');
		if (!uriToDoc || !idDoc)
		{
			return false;
		}
		uriToDoc = this.addToLinkParam(uriToDoc, 'proccess', '1');
		uriToDoc = this.addToLinkParam(uriToDoc, 'toWDController', '1');
		uriToDoc = this.addToLinkParam(uriToDoc, 'type', this.docType);
		uriToDoc = this.addToLinkParam(uriToDoc, 'createIn', parameters.obElementViewer.initEditService());
		uriToDoc = this.addToLinkParam(uriToDoc, 'createDoc', '1');
		uriToDoc = this.addToLinkParam(uriToDoc, 'commit', '1');
		uriToDoc = this.addToLinkParam(uriToDoc, 'id', idDoc);
		uriToDoc = this.addToLinkParam(uriToDoc, 'sessid', BX.bitrix_sessid());
	}

	BX.ajax({
		method: 'POST',
		dataType: 'json',
		url: uriToDoc,
		data: {
			editSessionId: parameters.editSessionId,
			id: idDoc,
			sessid: BX.bitrix_sessid()
		},
		onsuccess: BX.delegate(function (response) {
			this.oldName = response.name;
			this.sectionId = response.sectionId;
			this.elementId = response.elementId;
			this.elementId = response.elementId;
			this.objectId = response.objectId;
			var saveDialog = BX.create('div', {
				props: {
					className: 'bx-viewer-confirm'
				},
				children: [
					BX.create('div', {
						props: {
							className: 'bx-viewer-confirm-title'
						},
						text: BX.message('JS_CORE_VIEWER_NOW_CREATING_IN_SERVICE').replace('#SERVICE#', parameters.obElementViewer.getNameEditService()),
						children: []
					}),
					BX.create('div', {
						props: {
							className: 'bx-viewer-confirm-text-wrap bx-viewer-confirm-center'
						},
						children: [
							BX.create('input', {
								props: {
									id: 'wd-new-create-filename',
									className: 'bx-viewer-inp',
									type: 'text',
									value: response.nameWithoutExtension
								}
							}),
							BX.create('span', {
								props: {
									className: 'bx-viewer-confirm-extension'
								},
								text: this.docType
							})
						]
					})
				]
			});

			BX.CViewer.lockScroll();
			parameters.obElementViewer.params.keyMap = {
				13: 'submitCurrentElement', // enter
				27: 'close' // esc
			};

			parameters.obElementViewer._bindEvents();
			parameters.obElementViewer.openConfirm(saveDialog, [
				new BX.PopupWindowButton({
					id: 'wd-btn-save-blank-with-new-name',
					text: BX.message('JS_CORE_VIEWER_SAVE'),
					className: "popup-window-button-accept",
					events: {
						click: BX.delegate(function () {
								var newName = BX('wd-new-create-filename').value;
								if (!newName) {
									BX.focus(BX('wd-new-create-filename'));
									return;
								}
								BX.CViewer.showLoading(BX.findChild(saveDialog, {className: 'bx-viewer-confirm-text-wrap'}, true), {
									className: 'bx-viewer-wrap-loading-modal',
									notAddClassLoadingToObj: true
								});

								this.runActionByCurrentElement('rename', {
									newName: newName,
									data: response,
									success: BX.delegate(function (data, response) {
										if(response && response.newName && response.newName != data.name)
										{
											data.name = response.newName;
											data.nameWithoutExtension = response.newName.split('.').pop();
										}
										this.runActionByCurrentElement('pasteInForm', {response: data});
										BX.CViewer.unlockScroll();
										parameters.obElementViewer._unbindEvents();
										this.closeConfirm();
									}, this)
								});

								try {
									modalWindow.close();
								} catch (e) {
								}
							}, parameters.obElementViewer
						)
					}
				}),
				new BX.PopupWindowButton({
					text: BX.message('JS_CORE_VIEWER_IFRAME_CANCEL'),
					events: {
						click: BX.delegate(function () {
								this.runActionByCurrentElement('discard', this.getCurrent().getDataForCommit());
								BX.CViewer.unlockScroll();
								parameters.obElementViewer._unbindEvents();
								this.closeConfirm();
							}, parameters.obElementViewer
						)
					}
				})
			], true);


		}, this)
	});

	return false;
}

BX.CViewBlankElement.prototype.renameFile = function(params)
{
	params = params || {};
	if(!params.newName || !this.oldName)
	{
		return false;
	}
	if(params.newName == this.oldName || params.newName + '.' + this.docType == this.oldName)
	{
		if(BX.type.isFunction(params.success))
		{
			params.success(params.data, {status: 'success'});
		}
		return true;
	}

	var uri;
	if(this.renameUrl)
	{
		uri = CViewerUrlHelper.getUrlRenameFile(this.renameUrl)
	}
	else
	{
		if(this.uriToDoc)
		{
			uri = this.addToLinkParam(this.uriToDoc, 'action', 'rename');
		}
		else
		{
			uri = this.addToLinkParam(params.data.link, 'action', 'rename');
		}
		uri = this.addToLinkParam(uri, 'proccess', '1');
		uri = this.addToLinkParam(uri, 'createDoc', '1');
		uri = this.addToLinkParam(uri, 'createIn', this.docService);
		uri = this.addToLinkParam(uri, 'elementId', this.elementId);
		uri = this.addToLinkParam(uri, 'sectionId', this.sectionId);
		uri = this.addToLinkParam(uri, 'rename', 1);
		uri = this.addToLinkParam(uri, 'toWDController', 1);
		uri = this.addToLinkParam(uri, 'newName', params.newName + '.' + this.docType);
		uri = this.addToLinkParam(uri, 'sessid', BX.bitrix_sessid());
	}

	BX.ajax({
		method: 'POST',
		dataType: 'json',
		url: uri,
		data: {
			objectId: this.objectId,
			newName: params.newName + '.' + this.docType,
			sessid: BX.bitrix_sessid()
		},
		onsuccess: BX.delegate(function (response) {
			if (BX.type.isFunction(params.success)) {
				params.success(params.data, response);
			}
		}, this)
	});

	return true;
};

BX.CViewBlankElement.prototype.pasteInForm = function(params)
{
    params = params || {};
    this.afterSuccessCreate(params.response);
    return;
}

//##############################################################################
BX.CViewIframeElement = function(params)
{
	BX.CViewIframeElement.superclass.constructor.apply(this, arguments);
	this.width = 850;
	this._minWidth = 850;
	this.height = 700;
	this._minHeight = 700;
	this.topPadding = 43;
	this.viewerUrl = '';
	this.autoReduction = true;
	this.autoReductionWidth = 350;
}

BX.extend(BX.CViewIframeElement, BX.CViewEditableElement);

BX.CViewIframeElement.prototype.load = function(successLoadCallback, errorLoadCallback)
{
	var self = this;
	if(!this.loaded)
	{
		BX.ajax({
			'method': 'POST',
			'dataType': 'json',
			'url': self.src,
			'data':  {
				sessid: BX.bitrix_sessid(),
				json: 1
			},
			'onsuccess': BX.delegate(function(data){
				if(data && data.error)
				{
					if(BX.type.isFunction(errorLoadCallback))
					{
						errorLoadCallback(this, data);
					}
					return;
				}

				var checkIframeError = function(){};
				if(data.neededCheckView !== undefined && data.neededCheckView)
				{
					checkIframeError = BX.delegate(function(){
						if(BX.localStorage.get('iframe_options_error'))
						{
							BX.onCustomEvent(this, 'onIframeDocError', [this]);
							return;
						}
						if(BX.localStorage.get('iframe_options_error') !== null)
						{
							return;
						}
						BX.ajax({
							'method': 'POST',
							'dataType': 'json',
							'url': CViewerUrlHelper.getUrlCheckView(this.src),
							'data':  {
								extLink: data.file,
								sessid: BX.bitrix_sessid(),
								checkViewByGoogle: 1,
								id: data.id
							},
							'onsuccess': BX.delegate(function(data){
								if(!data || (data.viewed === undefined && !data.viewByGoogle || data.viewByGoogle === undefined && !data.viewed) )
								{
									BX.onCustomEvent(this, 'onIframeDocError', [this]);
								}
								else
								{
									BX.onCustomEvent(this, 'onIframeDocSuccess', [this]);
								}
							}, this)
						});
					}, this);
				}

				this.domElement = BX.create('iframe', {
					props: {
						className: 'bx-viewer-image',
						src: data.viewUrl || data.viewerUrl
					},
					events: {
						load: !BX.CViewer.browserWithDeferredCheckIframeError()? BX.proxy(function(){
							BX.proxy(this.onLoad, this);
							checkIframeError();
						}, this) : BX.proxy(this.onLoad, this)
					},
					style: {
						border: 'none'
					}
				});
				this.contentWrap.appendChild(this.domElement);

				this.viewUrl = data.viewUrl || data.viewerUrl;
				if(BX.localStorage.get('iframe_options_error'))
				{
					BX.onCustomEvent(this, 'onIframeDocError', [this]);
				}
				else if(BX.CViewer.browserWithDeferredCheckIframeError() && BX.localStorage.get('iframe_options_error') === null)
				{
					this.addTimeoutId(setTimeout(checkIframeError, 15000));
				}

			}, this)
		});

		this.titleDomElement = BX.create('span', {
			props: {
				className: 'bx-viewer-file-name-block',
				title: this.title
			},
			children: [
				BX.create('span', {
					props: {
						className: 'bx-viewer-file-name',
						title: this.title
					},
					text: this.title
				}),
				BX.create('a', {
					props: {
						className: 'bx-viewer-file-last-v',
						title: this.title,
						alt: this.title,
						href: this.historyPageUrl,
						target: '_blank'
					},
					text: this.version?
						BX.message('JS_CORE_VIEWER_THROUGH_VERSION').replace('#NUMBER#', this.version > 0? this.version : ''):
						BX.message('JS_CORE_VIEWER_THROUGH_LAST_VERSION')
				})
			]
		});

		this.titleButtons = BX.create('span', {
			props: {
				className: 'bx-viewer-top-right'
			},
			style: {
				//display: 'none'
			},
			children: this.buttons
		});

		this.successLoad = successLoadCallback || BX.CViewIframeElement.prototype.successLoad;
		this.isProccessed = true;
	}
}

BX.CViewIframeElement.prototype.preload = function(successLoadCallback)
{
	return false;
}
BX.CViewIframeElement.prototype.onLoad = function()
{
	if(this.loaded)
	{
		return;
	}
	this.loaded = true;
	this.successLoad(this);
}
BX.CViewIframeElement.prototype.show = function()
{
	this.domElement.style.opacity = 1;
	this.domElement.style.display = 'block';
	//this.titleButtons.style.display = 'block';
	this.preventShow = false;
}
BX.CViewIframeElement.prototype.hide = function(isCloseElement)
{
	isCloseElement = isCloseElement || false;
	if(this.domElement)
	{
		this.domElement.style.opacity = 0;
		//this.titleButtons.style.display = 'none';
		BX.unbind(this.domElement, 'load', BX.proxy(this.onLoad, this));
	}
	//this.domElement.style.display = 'none';
	this.preventTimeout();
	this.loaded = false;
	this.preventShow = false;
	this.isProccessed = false;
}

//##############################################################################
BX.CViewWithoutPreviewEditableElement = function(params)
{
	BX.CViewWithoutPreviewEditableElement.superclass.constructor.apply(this, arguments);
	this.width = 600;
	this._minWidth = 600;
	this.height = 350;
	this._minHeight = 350;
	this.owner = params.owner;
	this.dateModify = params.dateModify;
	this.size = params.size;
	this.topPadding = 43;
	this.tooBigSizeMsg = !!params.tooBigSizeMsg;
	this.autoReduction = true;
    this.autoReductionWidth = 175;
}

BX.extend(BX.CViewWithoutPreviewEditableElement, BX.CViewEditableElement);

BX.CViewWithoutPreviewEditableElement.prototype.load = function(successLoadCallback)
{
	if(this.loaded)
	{
		return;
	}

	this.titleDomElement = BX.create('span', {
		props: {
			className: 'bx-viewer-file-name-block',
			title: this.title
		},
		children: [
			BX.create('span', {
				props: {
					className: 'bx-viewer-file-name',
					title: this.title
				},
				text: this.title
			}),
			BX.create('a', {
				props: {
					className: 'bx-viewer-file-last-v',
					title: this.title,
					alt: this.title,
					href: this.historyPageUrl,
					target: '_blank'
				},
				text: this.version?
					BX.message('JS_CORE_VIEWER_THROUGH_VERSION').replace('#NUMBER#', this.version > 0? this.version : ''):
					BX.message('JS_CORE_VIEWER_THROUGH_LAST_VERSION')
			})
		]
	});

	this.titleButtons = BX.create('span', {
		props: {
			className: 'bx-viewer-top-right'
		},
		children: this.buttons
	});

	var srcLink = this.src;
	this.domElement = BX.create('div', {
		props: {
			className: 'bx-viewer-cap-wrap bx-viewer-cap-file'
		},
		children: [
			(BX.create('div', {
					props: {
					},
					children: [
						(BX.create('div', {
							props: {
								className: 'bx-viewer-icon ' + this.getIconClassByName(this.title)
							}
						})),
						(BX.create('div', {
							props: {
								className: 'bx-viewer-cap-text-block'
							},
							children: [
								(BX.create('div', {
									props: {
										className: 'bx-viewer-cap-title',
										title: this.title
									},
									text: this.title
								})),
								(BX.create('div', {
									props: {
										className: 'bx-viewer-too-big-title'
									},
									style: {
										display: this.tooBigSizeMsg? '' : 'none'
									},
									text: BX.message('JS_CORE_VIEWER_TOO_BIG_FOR_VIEW')
								})),
								(BX.create('div', {
									props: {
										className: 'bx-viewer-cap-text'
									},
									html:'<span class="bx-viewer-cap-text-title">' + BX.message('JS_CORE_VIEWER_DESCR_AUTHOR') + ': </span> ' + BX.util.htmlspecialchars(this.owner) + '<br/>' + '<span class="bx-viewer-cap-text-title">' + BX.message('JS_CORE_VIEWER_DESCR_LAST_MODIFY') + ': </span> ' + BX.util.htmlspecialchars(this.dateModify) + '<br/>' + this.size
								})),
								(BX.create('span', {
									props: {
										className: 'bx-viewer-btn'
									},
									events: {
										click: BX.delegate(function(e){
											document.location.href = this.downloadUrl;
											return false;
										}, this)
									},
									text: BX.message('JS_CORE_VIEWER_DOWNLOAD')
								}))
							]
						}))
					]
			}))
		]
	});
	this.successLoad = successLoadCallback || BX.CViewUnknownElement.prototype.successLoad;
	this.contentWrap.appendChild(this.domElement);
	this.loaded = true;
	this.successLoad(this);
}
BX.CViewWithoutPreviewEditableElement.prototype.preload = function(successLoadCallback)
{
}
BX.CViewWithoutPreviewEditableElement.prototype.onLoad = function()
{
}
BX.CViewWithoutPreviewEditableElement.prototype.show = function()
{
	this.domElement.style.opacity = 1;
	this.domElement.style.display = 'block';
	this.titleButtons.style.display = 'block';
	this.preventShow = false;
}
BX.CViewWithoutPreviewEditableElement.prototype.hide = function(isCloseElement)
{
	isCloseElement = isCloseElement || false;
	this.domElement.style.opacity = 0;
	this.titleButtons.style.display = 'none';
	//this.domElement.style.display = 'none';
	this.preventTimeout();
	this.loaded = false;
	this.preventShow = false;
	this.isProccessed = false;
}

//##############################################################################
BX.CViewIframeExtLinksElement = function(params)
{
	BX.CViewIframeExtLinksElement.superclass.constructor.apply(this, arguments);
	this.width = 800;
	this._minWidth = 800;
	this.height = 600;
	this._minHeight = 600;
	this.topPadding = 43;
	this.viewerUrl = params.viewerUrl;
	this.askConvert = false;
	this.editUrl = false;
}

BX.extend(BX.CViewIframeExtLinksElement, BX.CViewIframeElement);

BX.CViewIframeExtLinksElement.prototype.load = function(successLoadCallback)
{
	var self = this;
	if(!this.loaded)
	{
		var checkIframeError = function(){
			if(BX.localStorage.get('iframe_options_error'))
			{
				BX.onCustomEvent(self, 'onIframeDocError', [self]);
				return;
			}
			if(BX.localStorage.get('iframe_options_error') !== null)
			{
				return;
			}
			BX.ajax({
				'method': 'POST',
				'dataType': 'json',
				'url': self.src,
				'data':  {
					sessid: BX.bitrix_sessid(),
					checkViewByGoogle: 1
				},
				'onsuccess': function(data){
					if(!data || !data.viewByGoogle)
					{
						BX.onCustomEvent(self, 'onIframeDocError', [self]);
					}
					else
					{
						BX.onCustomEvent(self, 'onIframeDocSuccess', [self]);
					}
				}
			});
		};

		this.domElement = BX.create('iframe', {
			props: {
				className: 'bx-viewer-image',
				src: this.viewerUrl
			},
			events: {
				load: !BX.CViewer.browserWithDeferredCheckIframeError()? BX.proxy(function(){
					BX.proxy(this.onLoad, this);
					checkIframeError();
				}, self) : BX.proxy(self.onLoad, self)
			},
			style: {
				border: 'none'
			}
		});
		this.contentWrap.appendChild(this.domElement);

		if(BX.localStorage.get('iframe_options_error'))
		{
			BX.onCustomEvent(this, 'onIframeDocError', [this]);
		}
		else if(BX.CViewer.browserWithDeferredCheckIframeError() && BX.localStorage.get('iframe_options_error') === null)
		{
			this.addTimeoutId(setTimeout(checkIframeError, 15000));
		}

		this.titleDomElement = BX.create('span', {
			props: {
				className: 'bx-viewer-file-name-block',
				title: this.title
			},
			children: [
				BX.create('span', {
					props: {
						className: 'bx-viewer-file-name',
						title: this.title
					},
					text: this.title
				}),
				BX.create('span', {
					props: {
						className: 'bx-viewer-file-last-v',
						title: this.title
					}
				})
			]
		});

		this.titleButtons = BX.create('span', {
			props: {
				className: 'bx-viewer-top-right'
			},
			style: {
				//display: 'none'
			},
			children: this.buttons
		});

		this.successLoad = successLoadCallback || BX.CViewIframeExtLinksElement.prototype.successLoad;
		this.isProccessed = true;
	}
}
BX.CViewIframeExtLinksElement.prototype.commitFile = function(parameters)
{
	return false;
}

//##############################################################################
BX.CViewErrorIframeElement = function(params)
{
	BX.CViewErrorIframeElement.superclass.constructor.apply(this, arguments);
	this.width = 600;
	this._minWidth = 600;
	this.height = 350;
	this._minHeight = 350;
	this.topPadding = 43;
	this.buttonUrl = params.buttonUrl;
	this.autoReduction = true;
    this.autoReductionWidth = 175;
}

BX.extend(BX.CViewErrorIframeElement, BX.CViewEditableElement);

BX.CViewErrorIframeElement.prototype.load = function(successLoadCallback)
{
	this.titleDomElement = BX.create('span', {
		props: {
			className: 'bx-viewer-file-name-block',
			title: this.title
		},
		children: [
			BX.create('span', {
				props: {
					className: 'bx-viewer-file-name',
					title: this.title
				},
				text: this.title
			}),
			BX.create('a', {
				props: {
					className: 'bx-viewer-file-last-v',
					title: this.title,
					alt: this.title,
					href: this.historyPageUrl,
					target: '_blank'
				},
				text: this.version?
					BX.message('JS_CORE_VIEWER_THROUGH_VERSION').replace('#NUMBER#', this.version > 0? this.version : ''):
					BX.message('JS_CORE_VIEWER_THROUGH_LAST_VERSION')
			})
		]
	});

	this.titleButtons = BX.create('span', {
		props: {
			className: 'bx-viewer-top-right'
		},
		children: this.buttons
	});

	this.domElement = BX.create('div', {
		props: {
			className: 'bx-viewer-cap-wrap bx-viewer-cap-file'
		},
		children: [
			(BX.create('div', {
					props: {
					},
					children: [
						(BX.create('div', {
							props: {
								className: 'bx-viewer-icon ' + this.getIconClassByName(this.title)
							}
						})),
						(BX.create('div', {
							props: {
								className: 'bx-viewer-cap-text-block'
							},
							children: [
								(BX.create('div', {
									props: {
										className: 'bx-viewer-cap-title',
										title: this.title
									},
									text: this.title
								})),
								(BX.create('div', {
									props: {
										className: 'bx-viewer-too-big-title'
									},
									text: BX.message('JS_CORE_VIEWER_IFRAME_DESCR_ERROR')
								})),
								(BX.create('a', {
									props: {
										className: 'bx-viewer-btn',
										target: '_blank',
										href: this.buttonUrl
									},
									events: {
										click: BX.eventCancelBubble
									},
									text: BX.message('JS_CORE_VIEWER_OPEN_WITH_GVIEWER')
								}))
							]
						}))
					]
			}))
		]
	});

	this.successLoad = successLoadCallback || BX.CViewUnknownElement.prototype.successLoad;
	this.contentWrap.appendChild(this.domElement);
	this.loaded = true;
	this.successLoad(this);

}

BX.CViewErrorIframeElement.prototype.show = function()
{
	this.domElement.style.opacity = 1;
	this.domElement.style.display = 'block';
	this.titleButtons.style.display = 'block';
	this.preventShow = false;
}
BX.CViewErrorIframeElement.prototype.hide = function()
{
	this.domElement.style.opacity = 0;
	this.preventTimeout();
	this.loaded = false;
	this.preventShow = false;
	this.isProccessed = false;
}


//##############################################################################
BX.CViewUnknownElement = function(params)
{
	BX.CViewUnknownElement.superclass.constructor.apply(this, arguments);
	this.width = 600;
	this._minWidth = 600;
	this.height = 350;
	this._minHeight = 350;
	this.owner = params.owner;
	this.dateModify = params.dateModify;
	this.size = params.size;
	this.topPadding = 43;
	this.tooBigSizeMsg = !!params.tooBigSizeMsg;
}

BX.extend(BX.CViewUnknownElement, BX.CViewCoreElement);

BX.CViewUnknownElement.prototype.load = function(successLoadCallback)
{
	if(this.loaded)
	{
		return;
	}

	this.titleDomElement = BX.create('span', {
		props: {
			className: 'bx-viewer-file-name-block bx-viewer-file-center',
			title: this.title
		},
		children: [
			BX.create('span', {
				props: {
					className: 'bx-viewer-file-name',
					title: this.title
				},
				text: this.title
			}),
			BX.create('span', {
				props: {
					className: 'bx-viewer-file-last-v',
					title: this.title
				}
			})
		]
	});

	this.titleButtons = BX.create('span', {
		props: {
			className: 'bx-viewer-top-right'
		},
		children: this.buttons
	});

	var srcLink = this.src;
	this.domElement = BX.create('div', {
		props: {
			className: 'bx-viewer-cap-wrap bx-viewer-cap-file'
		},
		children: [
			(BX.create('div', {
					props: {
					},
					children: [
						(BX.create('div', {
							props: {
								className: 'bx-viewer-icon ' + this.getIconClassByName(this.title)
							}
						})),
						(BX.create('div', {
							props: {
								className: 'bx-viewer-cap-text-block'
							},
							children: [
								(BX.create('div', {
									props: {
										className: 'bx-viewer-cap-title',
										title: this.title
									},
									text: this.title
								})),
								(BX.create('div', {
									props: {
										className: 'bx-viewer-too-big-title'
									},
									style: {
										display: this.tooBigSizeMsg? '' : 'none'
									},
									text: BX.message('JS_CORE_VIEWER_TOO_BIG_FOR_VIEW')
								})),
								(BX.create('div', {
									props: {
										className: 'bx-viewer-cap-text'
									},
									html:'<span class="bx-viewer-cap-text-title">' + BX.message('JS_CORE_VIEWER_DESCR_AUTHOR') + ': </span> ' + BX.util.htmlspecialchars(this.owner) + '<br/>' + '<span class="bx-viewer-cap-text-title">' + BX.message('JS_CORE_VIEWER_DESCR_LAST_MODIFY') + ': </span> ' + BX.util.htmlspecialchars(this.dateModify) + '<br/>' + this.size
								})),
								(BX.create('span', {
									props: {
										className: 'bx-viewer-btn'
									},
									events: {
										click: function(e){
											document.location.href = srcLink;
											return false;
										}
									},
									text: BX.message('JS_CORE_VIEWER_DOWNLOAD')
								}))
							]
						}))
					]
			}))
		]
	});
	this.successLoad = successLoadCallback || BX.CViewUnknownElement.prototype.successLoad;
	this.contentWrap.appendChild(this.domElement);
	this.loaded = true;
	this.successLoad(this);
}
BX.CViewUnknownElement.prototype.preload = function(successLoadCallback)
{
}
BX.CViewUnknownElement.prototype.onLoad = function()
{
}
BX.CViewUnknownElement.prototype.show = function()
{
	this.domElement.style.opacity = 1;
	this.domElement.style.display = 'block';
	this.titleButtons.style.display = 'block';
	this.preventShow = false;
}
BX.CViewUnknownElement.prototype.hide = function(isCloseElement)
{
	isCloseElement = isCloseElement || false;
	this.domElement.style.opacity = 0;
	this.titleButtons.style.display = 'none';
	//this.domElement.style.display = 'none';
	this.preventTimeout();
	this.loaded = false;
	this.preventShow = false;
	this.isProccessed = false;
}
//##############################################################################
BX.CViewFolderElement = function(params)
{
	BX.CViewFolderElement.superclass.constructor.apply(this, arguments);
	this.width = 600;
	this._minWidth = 600;
	this.height = 350;
	this._minHeight = 350;
	this.owner = params.owner;
	this.dateModify = params.dateModify;
	this.size = params.size;
	this.topPadding = 0;
	this.showTitle = false;
}

BX.extend(BX.CViewFolderElement, BX.CViewCoreElement);

BX.CViewFolderElement.prototype.load = function(successLoadCallback)
{
	if(this.loaded)
	{
		return;
	}

	this.titleDomElement = null;
	this.titleButtons = null;

	this.domElement = BX.create('div', {
		props: {
			className: 'bx-viewer-cap-wrap bx-viewer-folder'
		},
		children: [
			(BX.create('div', {
					props: {
						className: 'bx-viewer-cap'
					},
					children: [
						(BX.create('div', {
							props: {
								className: 'bx-viewer-icon'
							}
						})),
						(BX.create('div', {
							props: {
								className: 'bx-viewer-cap-text-block'
							},
							children: [
								(BX.create('div', {
									props: {
										className: 'bx-viewer-cap-title',
										title: this.title
									},
									text: this.title
								})),
								(BX.create('div', {
									props: {
										className: 'bx-viewer-cap-text'
									},
									html: BX.message('JS_CORE_VIEWER_DESCR_AUTHOR') + ': ' + BX.util.htmlspecialchars(this.owner) + '<br/>' + BX.message('JS_CORE_VIEWER_DESCR_LAST_MODIFY') + ': ' + BX.util.htmlspecialchars(this.dateModify) + '<br/>'
								}))
							]
						}))
					]
			}))
		]
	});
	this.contentWrap.appendChild(this.domElement);
	this.loaded = true;
}
BX.CViewFolderElement.prototype.preload = function(successLoadCallback)
{
}
BX.CViewFolderElement.prototype.onLoad = function()
{
}
BX.CViewFolderElement.prototype.show = function()
{
	this.domElement.style.opacity = 1;
	this.domElement.style.display = 'block';
	this.preventShow = false;
}
BX.CViewFolderElement.prototype.hide = function(isCloseElement)
{
	isCloseElement = isCloseElement || false;
	this.domElement.style.opacity = 0;
	//this.domElement.style.display = 'none';
	this.preventTimeout();
	this.loaded = false;
	this.preventShow = false;
	this.isProccessed = false;
}


BX.CViewer = function(params)
{
	this.params = BX.clone(BX.CViewer.defaultSettings);
	for(var i in params)
	{
		this.params[i] = params[i];
	}

	this.DIV = null;
	this.OVERLAY = null;
	this.CONTENT_WRAP = null;

	this.list = this.params.list;
	this._current = 0;
	this._currentEl = null;
	this.FULL_TITLE = null;
	this.bVisible = false;
	this.createDoc = this.params.createDoc || false;
	this.preload = 0; //todo preload don't working! We set to 0;
	this.currentElement = null; //if this not set current element get from this.list
	this.popupConfirm = null;
	this.popupMenu = null;
};

BX.CViewer.temporaryServiceEditDoc = '';
BX.CViewer._convertElementsMatch = {};
//todo refactor! globals....
BX.CViewer.rightNowRunActionAfterShow = '';
BX.CViewer.objNowInShow = false;
BX.CViewer.localChangeServiceEdit = false;
BX.CViewer.listPopupId = [];

BX.CViewer.defaultSettings = {
	list: [],
	cycle: true, // whether to cycle element list - go to first after last
	resize: 'WH', //'W' - resize element to fit width, 'H' - resize element to fit height, 'WH' - W&H , ''||false => show original element size without resizing
	resizeToggle: false,
	showTitle: true, // whether to show element title
	preload: 0, // number of list element to be preloaded !!!!!don't working!
	minMargin: 20, //minimal margin
	minPadding: 11, // minimal padding
	lockScroll: true,
	keyMap: {
		13: 'submitCurrentElement', // enter
		27: 'close', // esc
		33: 'prev', // pgup
		37: 'prev', // left
		38: 'prev', // up
		34: 'next', // pgdn
		39: 'next', // right
		40: 'next', // down
		32: 'next' // space
	}
};

BX.CViewer.browserWithDeferredCheckIframeError = function()
{
	if(BX.browser.IsFirefox())
	{
		return false;
	}
	if(BX.browser.IsChrome() && window.navigator && window.navigator.appVersion)
	{
		//in new version chrome fix error with not fire onLoad event in iframe
		return parseInt(window.navigator.appVersion.match(/Chrome\/(\d+)\./)[1], 10) < 28;
	}
	return true;
};

BX.CViewer.enableInVersionDesktop = function(version)
{
	return BXIM && !BXIM.desktop.ready() && BXIM.desktopVersion >= parseInt(version);
};

BX.CViewer.enableInVersionDisk = function(version)
{
	var revisionApi = BX.message('disk_revision_api');
	if(!revisionApi)
	{
		revisionApi = 0;
	}
	revisionApi = parseInt(revisionApi, 10);
	return revisionApi >= parseInt(version, 10);
};

BX.CViewer.isEnableLocalEditInDesktop = function()
{
	//desktop is installed and disk enabled.
	return BX.CViewer.enableInVersionDesktop(21) && (!!BX.message('wd_desktop_disk_is_installed') || BXIM.desktopStatus);
};

BX.CViewer.lockScroll = function()
{
	BX.addClass(document.body, 'bx-viewer-lock-scroll');
};

BX.CViewer.unlockScroll = function()
{
	BX.removeClass(document.body, 'bx-viewer-lock-scroll');
};

BX.CViewer.getMsgAfterUploadNewVersionByUser = function()
{
	var gender = BX.message('wd_gender_current_user');
	switch(gender)
	{
		case 'f':
		case 'F':
			return BX.message('JS_CORE_VIEWER_IFRAME_UPLOAD_NEW_VERSION_IN_COMMENT_F')
			break;
		case 'm':
		case 'M':
			return BX.message('JS_CORE_VIEWER_IFRAME_UPLOAD_NEW_VERSION_IN_COMMENT_M')
			break;
	}
	return BX.message('JS_CORE_VIEWER_IFRAME_UPLOAD_NEW_VERSION_IN_COMMENT');
};

BX.CViewer.getWindowCopyToDisk = function(params)
{
	var link = params.link;
//params.title;
//params.showEdit
//params.selfViewer

	var waiterBox = BX.create('div', {
		props: {
			className: 'bx-viewer-alert'
		},
		children: [
			BX.create('span', {
				props: {
					className: 'bx-viewer-alert-icon'
				},
				children: [
					BX.create('img', {
						props: {
							src: '/bitrix/js/main/core/images/yell-waiter.gif'
						}
					})
				]
			}),
			BX.create('span', {
				props: {
					className: 'bx-viewer-aligner'
				}
			}),
			BX.create('span', {
				props: {
					className: 'bx-viewer-alert-text'
				},
				html: BX.message('JS_CORE_VIEWER_DESCR_PROCESS_SAVE_FILE_TO_OWN_FILES').replace('#NAME#', '<a href="#" class="bx-viewer-file-link">' + params.title +'</a>')
			}),
			BX.create('a', {
				props: {
					className: 'bx-viewer-alert-close-icon',
					href: '#'
				},
				events: {
					click: function(e)
					{
						if(params.selfViewer)
						{
							params.selfViewer.closeConfirm();
						}
						else
						{
							BX.CViewer.unlockScroll();
							BX.PopupWindowManager.getCurrentPopup().destroy();
						}
						BX.PreventDefault(e);
						return false;
					}
				}
			})
		]
	});
	BX.CViewer.lockScroll();
	if(params.selfViewer)
	{
		params.selfViewer.openConfirm(waiterBox, [], true, null, {windowName: '-copy', className:'bx-viewer-alert-popup'});
	}
	else
	{
		var paramsWindow = {
			content: waiterBox,
			onPopupClose : function() { this.destroy() },
			closeByEsc: params.closeByEsc || false,
			autoHide: params.autoHide || false,
			overlay: true,
			zIndex: 10200,
			className: 'bx-viewer-alert-popup'
		};

		var popupConfirm = BX.PopupWindowManager.create('bx-gedit-convert-confirm-copy', null, paramsWindow);
		popupConfirm.show();
	}

	BX.ajax.loadJSON(link, {sessid: BX.bitrix_sessid()}, function(response){
		if(typeof (item) == "object" && response.status != 'success')
		{
			return;
		}

		var messageBox = BX.create('div', {
			props: {
				className: 'bx-viewer-alert'
			},
			children: [
				BX.create('span', {
					props: {
						className: 'bx-viewer-alert-icon'
					},
					children: [
						BX.create('img', {
							props: {
								src: '/bitrix/js/main/core/images/viewer-tick.png'
							}
						})
					]
				}),
				BX.create('span', {
					props: {
						className: 'bx-viewer-aligner'
					}
				}),
				BX.create('span', {
					props: {
						className: 'bx-viewer-alert-text'
					},
					html: BX.message('JS_CORE_VIEWER_DESCR_SAVE_FILE_TO_OWN_FILES').replace('#NAME#', '<a target="_blank" href="' + response.viewUrl + '" class="bx-viewer-file-link">' + params.title +'</a>')
				}),
				BX.create('div', {
					props: {
						className: 'bx-viewer-alert-footer'
					},
					children: [
						BX.create('a', {
							props: {
								className: 'bx-viewer-btn-link',
								target: '_blank',
								href: response.viewUrl
							},
							text: BX.message('JS_CORE_VIEWER_GO_TO_FILE')
						}),
						(params.showEdit? BX.create('a', {
							props: {
								className: 'bx-viewer-btn-link',
								target: '_blank',
								href: response.viewUrl + '#showInViewer'
							},
							text: BX.message('JS_CORE_VIEWER_EDIT')
						}) : null)
					]
				}),
				BX.create('a', {
					props: {
						className: 'bx-viewer-alert-close-icon',
						href: '#'
					},
					events: {
						click: function(e)
						{
							if(params.selfViewer)
							{
								params.selfViewer.closeConfirm();
							}
							else
							{
								BX.PopupWindowManager.getCurrentPopup().destroy();
							}
							BX.PreventDefault(e);
							return false;
						}
					}
				})
			]
		});

		if(params.selfViewer)
		{
			params.selfViewer.openConfirm(messageBox, [], false, null, {windowName: '-copy', className:'bx-viewer-alert-popup'});
		}
		else
		{
			//if not from viewer
			BX.CViewer.unlockScroll();
			var paramsWindow = {
				content: messageBox,
				onPopupClose : function() { this.destroy() },
				closeByEsc: params.closeByEsc || false,
				autoHide: params.autoHide || false,
				zIndex: 10200,
				className: 'bx-viewer-alert-popup'
			};
			BX.PopupWindowManager.getCurrentPopup().destroy();
			var popupConfirm = BX.PopupWindowManager.create('bx-gedit-convert-confirm-copy', null, paramsWindow);
			popupConfirm.show();
		}

		var idTimeout = setTimeout(function(){
			var w = BX.PopupWindowManager.getCurrentPopup();
			w.close();
			w.destroy();
		}, 3000);

		BX('bx-gedit-convert-confirm-copy').onmouseover = function(e){
			clearTimeout(idTimeout);
		};

		BX('bx-gedit-convert-confirm-copy').onmouseout = function(e){
			idTimeout = setTimeout(function(){
				var w = BX.PopupWindowManager.getCurrentPopup();
				w.close();
				w.destroy();
			}, 3000);
		};

	});
}

BX.CViewer.isEmptyObject = function(obj)
{
	if (obj == null) return true;
	if (obj.length && obj.length > 0)
		return false;
	if (obj.length === 0)
		return true;

	for (var key in obj) {
	    if (hasOwnProperty.call(obj, key))
			return false;
	}

	return true;
}

BX.CViewer.showLoading = function(obj, params)
{
	params = params || {};
	params.notAddClassLoadingToObj = !!params.notAddClassLoadingToObj || false;
	if(!(obj = BX(obj)))
	{
		return false;
	}
	if(!params.notAddClassLoadingToObj)
	{
		BX.addClass(obj, 'bx-viewer-wrap-loading');
	}
	BX.cleanNode(obj);
	BX.adjust(obj, {
		children: [
			BX.create('div', {
					style: {
						display: 'table',
						width: '100%',
						height: '100%'
					},
					children: [
						BX.create('div', {
							style: {
								display: 'table-cell',
								verticalAlign: 'middle',
								textAlign: 'center'
							},
							children: [
								BX.create('div', {
									props: {
										className: params.className || 'bx-viewer-wrap-loading'
									}
								}),
								BX.create('span', {
									text: params.text || ''
								})
							]
						})
					]
				}
			)]
	});

	return true;
}

BX.CViewer.showError = function(obj, params)
{
	params = params || {};
	if(!(obj = BX(obj)))
	{
		return false;
	}
	BX.cleanNode(obj);
	BX.adjust(obj, {
		children: [
			BX.create('div', {
					style: {
						display: 'table',
						width: '100%',
						height: '100%'
					},
					children: [
						BX.create('div', {
							style: {
								display: 'table-cell',
								verticalAlign: 'middle',
								textAlign: 'center'
							},
							children: [
								BX.create('div', {
									props: {}
								}),
								BX.create('span', {
									text: params.text || ''
								})
							]
						})
					]
				}
			)]
	});

	return true;
}

BX.CViewer.prototype._create = function()
{
	if (!this.DIV)
	{
		var specTag = BX.browser.IsIE() && !BX.browser.IsDoctype() ? 'A' : 'SPAN',
			specHref = specTag == 'A' ? 'javascript:void(0)' : null;

		this.OVERLAY = document.body.appendChild(BX.create('DIV', {
			props: {className: 'bx-viewer-overlay'}
		}));

		this.OVERLAY.appendChild(
			(this.PREV_LINK = BX.create(specTag, {
				props: {
					className: 'bx-viewer-prev-outer',
					href: specHref
				},
				events: {
					click: BX.proxy(this.prev, this)
				},
				html: '<span class="bx-viewer-prev"></span>'
			}))
		);
		this.OVERLAY.appendChild(
			(this.NEXT_LINK = BX.create(specTag, {
				props: {
					className: 'bx-viewer-next-outer',
					href: specHref
				},
				events: {
					click: BX.proxy(this.next, this)
				},
				html: '<span class="bx-viewer-next"></span>'
			}))
		);

		this.DIV = this.OVERLAY.appendChild(BX.create('DIV', {
			props: {className: 'bx-viewer-wrap-outer'},
			events: {
				click: BX.eventCancelBubble
			},
			children: [
				BX.create('DIV', {
					props: {className: 'bx-viewer-wrap-inner'},
					//style: {padding:padding},
					children: [
						(this.CONTENT_WRAP = BX.create('DIV', {
							props: {className: 'bx-viewer-wrap bx-viewer-cap'}
						}))
					]
				}),
				(this.CONTENT_TITLE = BX.create('DIV', {
					style: {bottom: '0'},
					props: {className: 'bx-viewer-title'}
				})),
				(this.FULL_TITLE = BX.create('DIV', {
					style: {bottom: '-32px'},
					props: {className: 'bx-viewer-full-title'}
				})),
				BX.create(specTag, {
					props: {
						className: 'bx-viewer-close',
						href: specHref
					},
					events: {click: BX.proxy(this._hide, this)},
					html: '<span class="bx-viewer-close-inner"></span>'
				})
			]
		}));

		if (!!this.params.resizeToggle)
		{
			this.CONTENT_WRAP.appendChild(BX.create('SPAN', {
				props: {className: 'bx-viewer-size-toggle'},
				style: {
					right: this.params.minPadding + 'px',
					bottom: this.params.minPadding + 'px'
				},
				events: {
					click: BX.proxy(this._toggle_resize, this)
				}
			}))
		}
	}

	//from N
	var padding;
	if (this.params.topPadding) {
		padding = this.params.topPadding + 'px ' + this.params.minPadding + 'px ' + this.params.minPadding + 'px'
	} else {
		padding = this.params.minPadding + 'px'
	}
	this.CONTENT_WRAP.parentNode.style.padding = padding;
	//end from N

};

BX.CViewer.prototype.setCurrent = function(element)
{
	if(!BX.is_subclass_of(element, BX.CViewCoreElement))
	{
		BX.debug('current element not instance of BX.CViewCoreElement');
		return;
	}

	this.currentElement = element;
}

BX.CViewer.prototype.isCurrent = function(element)
{
	if(typeof(element) == 'object')
	{
		element = (element.id||element.image||element.thumb||element.src);
	}
	else
	{
		return false;
	}

	var current = this.getCurrent();
	if(!current)
	{
		return false;
	}
	current = (current.id||current.image||current.thumb||current.src||false);
	if(!current)
	{
		return false;
	}

	return current == element;
}

BX.CViewer.prototype.getCurrent = function()
{
	if(!BX.is_subclass_of((this.currentElement || this.list[this._current]), BX.CViewCoreElement))
	{
		BX.debug('current element not instance of BX.CViewCoreElement');
		return false;
	}
	else
	{
		BX.addCustomEvent((this.currentElement || this.list[this._current]), 'onIframeDocSuccess', BX.delegate(function (elementWithError) {
			BX.localStorage.set('iframe_options_error', false, 60);
		}, this));
		BX.addCustomEvent((this.currentElement || this.list[this._current]), 'onIframeDocError', BX.delegate(function (elementWithError) {
			if((!elementWithError.id || this.getCurrent().id != elementWithError.id) && this.getCurrent().src != elementWithError.src)
			{
				return;
			}
			var errorElement = this.createErrorIframeElementFromEditable(elementWithError);
			var runEditAction = false;
			if(!BX.CViewer.isEmptyObject(elementWithError.getDataForCommit()))
			{
				runEditAction = true;
				errorElement.setDataForCommit(elementWithError.getDataForCommit());
			}
			errorElement.setCurrentModalWindow(elementWithError.getCurrentModalWindow());
			this.getCurrent().hide();
			this.setCurrent(errorElement);
			this.show();
			if(runEditAction)
			{
				errorElement.openEditConfirm(this);
			}

			BX.localStorage.set('iframe_options_error', true, 60);
		}, this));

	}
	return (this.currentElement || this.list[this._current]);
}

BX.CViewer.prototype._keypress = function(e)
{
	var key = (e||window.event).keyCode || (e||window.event).charCode;
	if (!!this.params.keyMap && !!this.params.keyMap[key] && !!this[this.params.keyMap[key]])
	{
		this[this.params.keyMap[key]].apply(this);
		return BX.PreventDefault(e);
	}
};

BX.CViewer.prototype._toggle_resize = function()
{
	var tmp = this.params.resize;
	this.params.resize = this.params.resizeToggle;
	this.params.resizeToggle = tmp;

	if (this.params.resize != 'WH')
	{
		this.params.lockScroll = true;
		this._lock_scroll();
	}
	else
	{
		this.params.lockScroll = false;
		this._unlock_scroll();
	}

	this.adjustSize();
	this.adjustPos();
};

BX.CViewer.prototype.adjustPos = function()
{
	if (this.getCurrent().height > 0 && this.getCurrent().width > 0)
	{
		this._adjustPosByElement();
	}
	else
	{
		if (!this.CONTENT_WRAP.style.height)
			this.CONTENT_WRAP.style.height = "100px";
		if (!this.CONTENT_WRAP.style.width)
			this.CONTENT_WRAP.style.width = "100px";

		//this._adjustPosByElement();
		this.getCurrent().addTimeoutId(
			setTimeout(BX.proxy(this._adjustPosByElement, this), 250)
		);
	}
};

BX.CViewer.prototype._adjustPosByElement = function()
{
	if (this.bVisible)
	{
		var wndSize = BX.GetWindowSize(),
			top = parseInt((wndSize.innerHeight - parseInt(this.CONTENT_WRAP.style.height) - 2 * this.params.minPadding - this.params.topPadding)/2),
			left = parseInt((wndSize.innerWidth - parseInt(this.CONTENT_WRAP.style.width) - 2 * this.params.minPadding)/2);

		if (!this.params.lockScroll && wndSize.innerWidth < wndSize.scrollHeight)
			left -= 20;

		if (top < this.params.minMargin)
			top = this.params.minMargin;
		if (left < this.params.minMargin + Math.min(70, this.PREV_LINK.offsetWidth))
			left = this.params.minMargin + Math.min(70, this.PREV_LINK.offsetWidth);

		if (this.params.showTitle && !!this.getCurrent().title)
		{
			top -= 20;
		}

		this.DIV.style.top = top + 'px';
		this.DIV.style.left = left + 'px';
	}
};

BX.CViewer.prototype.adjustSizeTitle = function()
{
	if(!this.getCurrent().titleButtons || !this.getCurrent().titleDomElement)
	{
		return false;
	}

	var autoReduction = this.getCurrent().autoReduction;
	function reductionText(textBlock, maxWidth)
	{
		textBlock = BX(textBlock);
		if(textBlock.offsetWidth < maxWidth)
		{
			//this is correct width. But we set maxWidth
			BX.adjust(textBlock, {style: {
				maxWidth: maxWidth + 'px'
			}});
			return;
		}

		if(!BX.hasClass(textBlock, 'bx-viewer-file-name'))
		{
			textBlock = BX.findChild(textBlock, {className: 'bx-viewer-file-name'}, true)
		}
		var text = textBlock.innerHTML;
		var pointIndex = text.lastIndexOf('.');
		var ext = text.substring(pointIndex);
		var name = text.substring(0, pointIndex);
		var shortName = text.substring(0, 7) + '...' + name.substring(name.length-3) + ext;

		textBlock.innerHTML = shortName;
	}
	if(autoReduction)
	{
		reductionText(this.getCurrent().titleDomElement, this.getCurrent().autoReductionWidth);
		return;
	}

	var textBlock = BX.findChild(this.getCurrent().titleDomElement, {className: 'bx-viewer-file-name'}, true);
	if(!textBlock)
	{
		return false;
	}

	if(this.getCurrent().titleButtons.offsetLeft + this.getCurrent().titleButtons.offsetWidth + 10 > this.getCurrent().titleDomElement.offsetLeft)
	{
		BX.removeClass(this.getCurrent().titleDomElement, 'bx-viewer-file-center');
		BX.addClass(this.getCurrent().titleDomElement, 'bx-viewer-file-right');
		BX.adjust(textBlock, {
			style: {
				overflow:'hidden',
				textOverflow:'ellipsis',
				whiteSpace: 'nowrap',
				marginLeft: (this.getCurrent().titleButtons.offsetLeft + this.getCurrent().titleButtons.offsetWidth)  + 'px'
				//maxWidth: (1+this.CONTENT_TITLE.offsetWidth - 2*(this.getCurrent().titleButtons.offsetLeft + this.getCurrent().titleButtons.offsetWidth)) + 'px'
			}
		});
		return true;
	}
	else
	{
		BX.removeClass(this.getCurrent().titleDomElement, 'bx-viewer-file-right');
		BX.addClass(this.getCurrent().titleDomElement, 'bx-viewer-file-center');
		BX.adjust(textBlock, {
			style: {}
		});
	}
	return false;
}
	
BX.CViewer.prototype.adjustSize = function()
{
	var wndSize = BX.GetWindowSize(), currentElement = this.getCurrent();

	if (!!currentElement.height && !!currentElement.width)
	{
		if (!this.params.lockScroll && wndSize.innerWidth < wndSize.scrollHeight)
			wndSize.innerWidth -= 20;

		wndSize.innerWidth -= this.params.minMargin * 2 + this.params.minPadding * 2 + Math.min(140, this.PREV_LINK.offsetWidth + this.NEXT_LINK.offsetWidth);
		wndSize.innerHeight -= this.params.topPadding + this.params.minMargin * 2 + this.params.minPadding * 2;

		if (this.params.showTitle && !!currentElement.title)
		{
			wndSize.innerHeight -= 40;
		}

		var height = currentElement.height,
			width = currentElement.width,
			ratio = [1];

		if (this.params.resize)
		{
			if(this.params.resize.indexOf('W') >= 0)
				ratio.push(wndSize.innerWidth/width);
			if (this.params.resize.indexOf('H') >= 0)
				ratio.push(wndSize.innerHeight/height);
		}

		ratio = Math.min.apply(window, ratio);

		height *= ratio;
		width *= ratio;
		if(currentElement.image)
		{
			currentElement.image.style.height = parseInt(height) + 'px';
			currentElement.image.style.width = parseInt(width) + 'px';
		}
		if(currentElement._minWidth && currentElement._minWidth > width)
		{
			width = currentElement._minWidth;
		}
		if(currentElement._minHeight && currentElement._minHeight > height)
		{
			height = currentElement._minHeight;
		}

		this.CONTENT_WRAP.style.height = parseInt(height) + 'px';
		this.CONTENT_WRAP.style.width = parseInt(width) + 'px';

		this.getCurrent().addTimeoutId(
			setTimeout(BX.proxy(this.adjustSizeTitle, this), 100)
		);

		if (BX.browser.IsIE())
		{
			var h = parseInt(this.CONTENT_WRAP.style.height) + this.params.minPadding * 2;

			this.PREV_LINK.style.height = this.NEXT_LINK.style.height = h + 'px';
			this.PREV_LINK.firstChild.style.top = this.NEXT_LINK.firstChild.style.top = parseInt(h/2-20) + 'px';
		}
	}
};

BX.CViewer.prototype._lock_scroll = function()
{
	if (this.params.lockScroll)
		BX.CViewer.lockScroll();
};

BX.CViewer.prototype._unlock_scroll = function()
{
	if (this.params.lockScroll)
		BX.CViewer.unlockScroll();
};

BX.CViewer.prototype._unhide = function()
{
	this.bVisible = true;

	this.DIV.style.display = 'block';
	this.OVERLAY.style.display = 'block';

	this.PREV_LINK.style.display = this.NEXT_LINK.style.display = 'none';
	if(this.list.length > 1 && (this.params.cycle || this._current > 0))
	{
		this.PREV_LINK.style.display = 'block';
		this.PREV_LINK.style.opacity = '0.2';
	}
	if(this.list.length > 1 && (this.params.cycle || this._current < this.list.length-1))
	{
		this.NEXT_LINK.style.display = 'block';
		this.NEXT_LINK.style.opacity = '0.2';
	}

	this.adjustPos();

	this._unbindEvents();
	this._bindEvents();
	this._lock_scroll();
};

BX.CViewer.prototype._bindEvents = function()
{
	BX.bind(document, 'keydown', BX.proxy(this._keypress, this));
	BX.bind(window, 'resize', BX.proxy(this.adjustSize, this));
	BX.bind(window, 'resize', BX.proxy(this.adjustPos, this));
}

BX.CViewer.prototype._unbindEvents = function()
{
	BX.unbind(document, 'keydown', BX.proxy(this._keypress, this));
	BX.unbind(window, 'resize', BX.proxy(this.adjustSize, this));
	BX.unbind(window, 'resize', BX.proxy(this.adjustPos, this));
}

BX.CViewer.prototype._hide = function()
{
	if(this.isOpenedConfirm())
	{
		return false;
	}
	this.bVisible = false;

	if(!this.DIV)
	{
		return;
	}

	this.DIV.style.display = 'none';
	this.OVERLAY.style.display = 'none';

	this._unbindEvents();
	this._unlock_scroll();
	//todo may set PreventShow = false  to all element in cycle
	this.getCurrent().hide(true);
	this.currentElement = null;
	this.closeConfirm();
	this.destroyMenu();
	BX.onCustomEvent(this, 'onElementViewClose', [this.getCurrent()]);
};

BX.CViewer.prototype.add = function(data)
{
	this.list.push(data);
};

BX.CViewer.prototype.setList = function(list)
{
	this.list = [];

	if (!!list && BX.type.isArray(list))
	{
		for(var i=0; i<list.length; i++)
		{
			if(!BX.is_subclass_of(list[i], BX.CViewCoreElement))
			{
				this.add(new BX.CViewCoreElement(list[i]));
			}
			else
			{
				this.add(list[i]);
			}
		}
	}

	if (this.bVisible)
	{
		if (this.list.length > 0)
			this.show();
		else
			this.close();
	}
};

BX.CViewer.prototype.show = function(element, force)
{	
	BX.CViewer.temporaryServiceEditDoc = '';
	this.closeConfirm();
	if(BX.PopupWindowManager.getCurrentPopup())
	{
		BX.PopupWindowManager.getCurrentPopup().destroy();
	}
	force = force || false;
	BX.browser.addGlobalClass();

	var _current = this._current;
	var self = this;

	if(typeof(element) == 'object' && (!!element.image || !!element.thumb))
		element = (element.id||element.image||element.thumb||element.src);

	if (BX.type.isString(element))
	{
		for(var i=0; i < this.list.length; i++)
		{
			if(this.list[i].image == element || this.list[i].thumb == element || this.list[i].src == element || this.list[i].id == element)
			{
				_current = i;
				break;
			}
		}
	}
	if(!this.currentElement)
	{
		var currentElement = this.list[_current];

		if (!currentElement)
			return;
		this._current = _current;
	}
	else
	{
		//this is current not from list of elements
		var currentElement = this.currentElement;
	}
	this._currentEl = currentElement;
	//BX.is_subclass_of(currentElement, BX.CViewImageElement) doesn't work ^(
	if(
		BX.CViewer.enableInVersionDisk(2) &&
		!currentElement.hasOwnProperty('image')
	)
	{
		//first run. We have to show setting window.
		if(!BX.message('disk_document_service'))
		{
			this.openWindowForSelectDocumentService();
			return;
		}
		else
		{
			if(BX.CViewer.isLocalEditService(this.initEditService()))
			{
				if(!currentElement.editUrl)
				{
					this.runActionByCurrentElement('localview', {obElementViewer: this});

				}
				else
				{
					this.runActionByCurrentElement('forceedit', {obElementViewer: this});
				}
				return;
			}
			else
			{}
		}
	}

	this.params.topPadding = 0;
	if(currentElement.showTitle && currentElement.title)
	{
		this.params.topPadding = currentElement.topPadding || 0;
	}

	this._create();
	currentElement.setContentWrap(this.CONTENT_WRAP);
	BX.cleanNode(this.CONTENT_WRAP);
	this.adjustSize();
	if(force)
	{
		currentElement.hide();
		currentElement.loaded = false;
		currentElement.hide();
	}
	if(!currentElement.loaded)
	{
		BX.addClass(this.CONTENT_WRAP, 'bx-viewer-wrap-loading');
		currentElement.load(BX.delegate(function (element) {
			BX.removeClass(this.CONTENT_WRAP, 'bx-viewer-wrap-loading');
			//if(!element.preventShow)
				element.show();
			this.adjustSize();
			this.adjustPos();
			this._preload();
		}, this), BX.delegate(function(element, dataError){
			BX.removeClass(this.CONTENT_WRAP, 'bx-viewer-wrap-loading');
			if(dataError && dataError.error == 'access_denied')
			{
				this.showError({text: dataError.message});
				if(element.titleButtons)
				{
					BX.remove(element.titleButtons);
				}
			}
		}, this));
		this.getCurrent().addTimeoutId(
			setTimeout(BX.proxy(this.adjustSizeTitle, this), 100)
		);
	}
	else
	{
		currentElement.load(BX.delegate(function (element) {
			BX.removeClass(this.CONTENT_WRAP, 'bx-viewer-wrap-loading');
			//self.adjustSize();
			this.adjustPos();
			element.addTimeoutId(setTimeout(BX.delegate(function(){
				//if(!element.preventShow)
					element.show();
					this.adjustSize();
			}, this), 200));
			this._preload();
		}, this));
		this.adjustSizeTitle();
	}
	if(BX.CViewer.rightNowRunActionAfterShow)
	{
		this.runActionByCurrentElement(BX.CViewer.rightNowRunActionAfterShow);
		BX.CViewer.rightNowRunActionAfterShow = false;
	}

	//this._check_title()
	this.getCurrent().addTimeoutId(
		setTimeout(BX.proxy(this._check_title, this), 10)
	);
	this._unhide();

	BX.onCustomEvent(this, 'onElementViewShow', [currentElement]);
};

BX.CViewer.prototype.showLoading = function(params)
{
	this.getCurrent().hide();
	return BX.CViewer.showLoading(this.CONTENT_WRAP, params);
}

BX.CViewer.prototype.showError = function(params)
{
	this.getCurrent().hide();
	return BX.CViewer.showError(this.CONTENT_WRAP, params);
}

BX.CViewer.prototype._check_title = function()
{
	BX.cleanNode(this.CONTENT_TITLE);
	BX.cleanNode(this.FULL_TITLE);
	if (this.params.showTitle)
	{
		if(this.getCurrent().showTitle && this.getCurrent().title)
		{
			if(BX.type.isDomNode(this.getCurrent().titleDomElement))
			{
				if(BX.type.isDomNode(this.getCurrent().titleButtons))
				{
					this.CONTENT_TITLE.appendChild(this.getCurrent().titleButtons);
				}

				this.CONTENT_TITLE.appendChild(this.getCurrent().titleDomElement);
			}
			else if(BX.type.isNotEmptyString(this.getCurrent().title))
			{
				BX.adjust(this.CONTENT_TITLE, {
					text: this.getCurrent().title
				});
			}
			else
			{
				this.CONTENT_TITLE.style.opacity = '0';
				this.CONTENT_TITLE.style.bottom = '0';
			}
		}
		else
		{
			//so bad...
			this.params.topPadding = 0;
		}
		if(this.getCurrent().full)
		{
			BX.cleanNode(this.FULL_TITLE);

			var p = [];
			if(this.getCurrent().full_height && this.getCurrent().full_width)
			{
				p.push(this.getCurrent().full_width+'x'+this.getCurrent().full_height);
			}

			if(this.getCurrent().full_size)
			{
				p.push(this.getCurrent().full_size);
			}

			var html = '<a href="'+this.getCurrent().full+'" class="bx-viewer-full-link" target="_blank">' + BX.message('JS_CORE_IMAGE_FULL') + (p.length > 0 ? (' ('+p.join(', ')+')') : '') + '</a>';
			BX.adjust(this.FULL_TITLE, {
				style: {
					opacity: '1'
				},
				children: [BX.create('div', {props: {className: 'bx-viewer-full-item '}, html: html})]
			});
		}
	}
	else
	{
		this.CONTENT_TITLE.style.opacity = '0';
		this.CONTENT_TITLE.style.bottom = '0';
		BX.cleanNode(this.CONTENT_TITLE);
	}
}

BX.CViewer.prototype._preload = function()
{
	if (this.params.preload > 0)
	{
		var finish = Math.max(this._current-this.params.preload, this.params.cycle ? -1000 : 0),
			start = Math.min(this._current+this.params.preload, this.params.cycle ? this.list.length + 1000 : this.list.length-1);

		if (finish < start)
		{
			for (var i=start; i>=finish; i--)
			{
				var ix = i;
				if (ix < 0)
					ix += this.list.length;
				else if (ix >= this.list.length)
					ix -= this.list.length;

				if (!this.list[ix].isProccessed)
				{
					this.list[ix].preload();
				}
			}
		}

	}
};

BX.CViewer.prototype.next = function()
{
	if (this.list.length > 1)
	{
		this.destroyMenu();
		this.getCurrent().hide();
		this.currentElement = null;
		this._current++;
		if(this._current >= this.list.length)
		{
			if(!!this.params.cycle)
				this._current = 0;
			else
				this._current--;

			BX.onCustomEvent(this, 'onElementViewFinishList', [this.getCurrent(), 1]);
		}
		this.getCurrent().preventShow = false;
		this.show();
	}
};

BX.CViewer.prototype.prev = function()
{
	if (this.list.length > 1)
	{
		this.destroyMenu();
		this.getCurrent().hide();
		this.currentElement = null;
		this._current--;
		if(this._current < 0)
		{
			if(!!this.params.cycle)
				this._current = this.list.length-1;
			else
				this._current++;

			BX.onCustomEvent(this, 'onElementViewFinishList', [this.getCurrent(), -1]);
		}
		this.getCurrent().preventShow = false;
		this.show();
	}
};

BX.CViewer.prototype.close = function()
{
	this._hide();
};

BX.CViewer.prototype.submitCurrentElement = function()
{
	this.runActionByCurrentElement('submit', {});
};

BX.CViewer.prototype.runActionByCurrentElement = function(action, params)
{
	params = params || {};
	if(this.getCurrent())
	{
		this.getCurrent().runAction(action, params);
	}
}

BX.CViewer.prototype.openModal = function(link, title, width, height)
{
	width = width || 1030;
	height = height || 700;

	var modalWindow = BX.util.popup(link, width, height);
	modalWindow.elementViewer = this;
	modalWindow.currentElement = this.getCurrent();
	window._ie_elementViewer = this;
	window._ie_currentElement = this.getCurrent();

	return modalWindow;
};

BX.CViewer.prototype.isOpenedConfirm = function()
{
	if (this.popupConfirm != null)
	{
		return this.popupConfirm.isShown();
	}
	return false;
};
BX.CViewer.prototype.closeConfirm = function()
{
	if (this.popupConfirm != null)
	{
		this.popupConfirm.close();
		this.popupConfirm.destroy();
	}
};
BX.CViewer.prototype.openConfirm = function(content, buttons, modal, bindElement, params)
{
	if (this.popupConfirm != null)
		this.popupConfirm.destroy();

	params = params || {};
	params.windowName = params.windowName || '';
	bindElement = bindElement || null;

	if(typeof(content) == "object")
	{
	}
	else
	{
		content = BX.create("div", { props : { className : "bx-gedit-convert-confirm-cont" }, html: content});
	}

	modal = modal === true? true: false;
	buttons = typeof(buttons) == "object"? buttons : false;

	if(!params.autoHide)
	{
		params.autoHide = buttons === false? true: false;
	}
	//params.closeByEsc = buttons === false? true: false;
	//todo catch event close by esc and run close event
	params.closeByEsc = params.closeByEsc || false;
	params.zIndex = 10200;
	if(params.overlay)
	{
		params.overlay = params.overlay;
	}
	else
	{
		params.overlay = modal;
	}
	params.content = content;
	params.buttons = buttons;
	params.events = { onPopupClose : function() { this.destroy() }};
	if(params.shown)
	{
		params.events.onPopupShow = params.shown;
	}

	this.popupConfirm = BX.PopupWindowManager.create('bx-gedit-convert-confirm' + params.windowName, bindElement, params);
	this.popupConfirm.show();
	//BX.bind(this.popupConfirm.popupContainer, "click", BX.PreventDefault);
};

BX.CViewer.prototype.destroyMenu = function()
{
	if (this.popupMenu != null && this.popupMenu.menu && this.popupMenu.menu.popupWindow)
	{
		this.popupMenu.menu.popupWindow.close();
		this.popupMenu.menu.popupWindow.destroy();
		//todo solve this problem later
		if(!BX.type.isArray(BX.CViewer.listPopupId))
		{
			return;
		}
		for (var i in BX.CViewer.listPopupId)
		{
			if (BX.CViewer.listPopupId.hasOwnProperty(i))
			{
				if(BX.PopupMenu.Data[BX.CViewer.listPopupId[i]] && BX.PopupMenu.Data[BX.CViewer.listPopupId[i]].popupWindow)
				{
					BX.PopupMenu.Data[BX.CViewer.listPopupId[i]].popupWindow.destroy();
				}
				BX.PopupMenu.Data[BX.CViewer.listPopupId[i]] = undefined;
			}
		}
		BX.CViewer.listPopupId = [];
	}
}

BX.CViewer.prototype.closeMenu = function()
{
	if (this.popupMenu != null && this.popupMenu.menu && this.popupMenu.menu.popupWindow)
	{
		this.popupMenu.menu.popupWindow.close();
		//this.popupMenu.destroy();
	}
}

BX.CViewer.prototype.openMenu = function(id, bindElement, items, params)
{
	BX.CViewer.listPopupId.push(id);
	params = params || {};
	BX.PopupMenu.show(id, BX(bindElement), items,
		{   offsetTop: params.offsetTop,
			offsetLeft: params.offsetLeft,
			angle: {
				position: 'top',
				offset: 45
			},
			autoHide: params.autoHide || true,
			zIndex: params.zIndex || 10000,
			overlay: {
				opacity: 0.01
			}
			//events : { onPopupClose : function() { this.destroy(); }}
		}
	);
	this.popupMenu = {
		id: id,
		menu: BX.PopupMenu.currentItem
	};

	return ;
};

BX.CViewer.prototype.initEditService = function()
{
	var service;
	if(BX.CViewer.enableInVersionDisk(2))
	{
		service = BX.message('disk_document_service');
	}
	else
	{
		service = BX.message('wd_service_edit_doc_default');
	}

	//now not set local (in browser) edit service, then we use global setting.
	if(BX.CViewer.localChangeServiceEdit && BX.localStorage.get('wd_service_edit_doc_default'))
	{
		service = BX.localStorage.get('wd_service_edit_doc_default');
	}
	//for webdav
	if(!BX.CViewer.enableInVersionDisk(2))
	{
		service = service || 'g';
	}
	this.setEditService(service);
	return service;
}

BX.CViewer.prototype.getNameEditService = function(service)
{
	service = service || this.initEditService();
	service = CViewerUrlHelper.normalizeServiceName(service);
	switch(service)
	{
		case 'gdrive':
			return BX.message('JS_CORE_VIEWER_SERVICE_GOOGLE_DRIVE');
		case 'onedrive':
			return BX.message('JS_CORE_VIEWER_SERVICE_SKYDRIVE');
		case 'l':
		case 'local':
			return BX.message('JS_CORE_VIEWER_SERVICE_LOCAL');
	}
	return '';
}

BX.CViewer.prototype.setEditService = function(service)
{
	if(service && BX.CViewer.enableInVersionDisk(2))
	{
		service = CViewerUrlHelper.normalizeServiceName(service);
		BX.userOptions.save('disk', 'doc_service', 'default', service);

		if(BX('bx-viewer-edit-service-txt'))
		{
			BX.adjust(BX('bx-viewer-edit-service-txt'), {text: this.getNameEditService(service)});
		}
		BX.CViewer.temporaryServiceEditDoc = service;
		return true;
	}
	else if(!BX.CViewer.enableInVersionDisk(2))
	{
		service = CViewerUrlHelper.normalizeServiceName(service);
		if(service)
		{
			if(BX.CViewer.isLocalEditService(service) && !BX.CViewer.isEnableLocalEditInDesktop())
			{
				service = 'g';
			}
			BX.userOptions.save('webdav', 'user_settings', 'service_edit_doc_default', service);
			BX.localStorage.set('wd_service_edit_doc_default', service, 60*2);
			BX.CViewer.localChangeServiceEdit = true;

			BX.CViewer.temporaryServiceEditDoc = service;

			if(BX('bx-viewer-edit-service-txt'))
			{
				BX.adjust(BX('bx-viewer-edit-service-txt'), {text: this.getNameEditService(service)});
			}

			return true;
		}

		return false;
	}
	return false;
};

BX.CViewer.isLocalEditService = function(service)
{
	service = service.toLowerCase();
	switch(service)
	{
		case 'l':
		case 'local':
			return true;
	}
	return false;
};

BX.CViewer.prototype.openWindowForSelectDocumentService = function()
{
		this.openConfirm('Which way to work with documents?', [
			new BX.PopupWindowButton({
			text : 'Local',
				className : "popup-window-button-accept",
				events : { click : BX.delegate(function() {
						if(!BX.CViewer.isEnableLocalEditInDesktop())
						{
							this.helpDiskDialog();
							return;
						}
						BX.message({disk_document_service: 'l'});
						this.closeConfirm();
						BX.CViewer.unlockScroll();
						if(this._currentEl)
						{
							this.show(this._currentEl);
						}
					}, this
				)}
			}),
			new BX.PopupWindowButton({
				text : 'Cloud',
				events : { click : BX.delegate(function() {
						BX.message({disk_document_service: 'gdrive'});
						this.closeConfirm();
						BX.CViewer.unlockScroll();
						if(this._currentEl)
						{
							this.show(this._currentEl);
						}
					}, this
				)}
			})
		], true, null, {
			closeByEsc: true
		});
};

BX.CViewer.prototype.helpDiskDialog = function(){
	var helpDiskDialog = BX.create('div', {
		props: {
			className: 'bx-viewer-confirm'
		},
		children: [
			BX.create('div', {
				props: {
					className: 'bx-viewer-confirm-title'
				},
				text: BX.message('JS_CORE_VIEWER_EDIT_IN_LOCAL_SERVICE'),
				children: []
			}),
			BX.create('div', {
				props: {
					className: 'bx-viewer-confirm-text-wrap'
				},
				children: [
					BX.create('span', {
						props: {
							className: 'bx-viewer-confirm-text-alignment'
						}
					}),
					BX.create('span', {
						props: {
							className: 'bx-viewer-confirm-text'
						},
						html: BX.message('JS_CORE_VIEWER_SERVICE_LOCAL_INSTALL_DESKTOP')
					})
				]
			})
		]
	});

	BX.CViewer.lockScroll();
	this.openConfirm(helpDiskDialog, [
		new BX.PopupWindowButton({
			text : BX.message('JS_CORE_VIEWER_DOWNLOAD_B24_DESKTOP'),
			className : "popup-window-button-accept",
			events : { click : BX.delegate(function() {
					document.location.href = (BX.browser.IsMac()? "http://dl.bitrix24.com/b24/bitrix24_desktop.dmg": "http://dl.bitrix24.com/b24/bitrix24_desktop.exe");
				}, this
			)}
		}),
		new BX.PopupWindowButton({
			text : BX.message('JS_CORE_VIEWER_IFRAME_CANCEL'),
			events : { click : BX.delegate(function() {
					this.closeConfirm();
					BX.CViewer.unlockScroll();
				}, this
			)}
		})
	], true);
};

BX.CViewer.prototype.createElementByType = function(element, params)
{
	var type = element.getAttribute('data-bx-viewer');
	params = params || {};
	switch(type)
	{
		case 'onlyedit':
			return this.createWithoutPreviewEditableElement(element, params);
			break;
		case 'iframe':
			return this.createIframeElement(element, params);
			break;
	}
}

BX.CViewer.prototype.createErrorIframeElementFromEditable = function(editableElement)
{
	var errorElement = new BX.CViewErrorIframeElement({
		id: editableElement.id,
		baseElementId: editableElement.baseElementId,
		title: editableElement.title,
		src: editableElement.src,
		owner: editableElement.owner,
		size: editableElement.size,
		dateModify: editableElement.dateModify,
		tooBigSizeMsg: editableElement.tooBigSizeMsg,

		buttonUrl: editableElement.viewerUrl || editableElement.viewUrl,

		isFromUserLib: editableElement.isFromUserLib,
		relativePath: editableElement.relativePath,
		externalId: editableElement.externalId,

		editUrl: editableElement.editUrl,
		urlToPost: editableElement.urlToPost,
		idToPost: editableElement.idToPost,
		downloadUrl: editableElement.downloadUrl,
		historyPageUrl: editableElement.historyPageUrl,
		askConvert: editableElement.askConvert,
		version: editableElement.version,

		buttons: []
	});
	errorElement.buttons.push(errorElement.getComplexEditButton(this, {
		enableEdit: !!errorElement.editUrl
	}));
	errorElement.buttons.push(errorElement.getComplexSaveButton(this, {
		downloadUrl: errorElement.downloadUrl
	}));

	return errorElement;
}

BX.CViewer.prototype.createBlankElementByParams = function(params)
{
	params.docType = params.docType || 'docx';
	return new BX.CViewBlankElement(params);
}

BX.CViewer.prototype.createWithoutPreviewEditableElement = function(element, params)
{
	var nonPreviewEditableElement = new BX.CViewWithoutPreviewEditableElement({
		baseElementId: element.getAttribute('data-bx-baseElementId'),
		title: element.getAttribute('data-bx-title'),
		src: element.getAttribute('data-bx-src'),
		owner: element.getAttribute('data-bx-owner'),
		size: element.getAttribute('data-bx-size'),
		dateModify: element.getAttribute('data-bx-dateModify'),
		tooBigSizeMsg: !!element.getAttribute('data-bx-tooBigSizeMsg'),

		isFromUserLib: !!element.getAttribute('data-bx-isFromUserLib'),
		externalId: element.getAttribute('data-bx-externalId'),
		relativePath: element.getAttribute('data-bx-relativePath'),

		editUrl: element.getAttribute('data-bx-edit'),
		urlToPost: element.getAttribute('data-bx-urlToPost'),
		idToPost: element.getAttribute('data-bx-idToPost'),
		downloadUrl: element.getAttribute('data-bx-download'),
		historyPageUrl: element.getAttribute('data-bx-historyPage'),
		askConvert: element.getAttribute('data-bx-askConvert'),
		version: params.version >= 0? params.version : element.getAttribute('data-bx-version'),

		buttons: []
	});
	if(nonPreviewEditableElement.isConverted())
	{
		var afterConvert = BX.CViewer._convertElementsMatch[nonPreviewEditableElement.src];
		nonPreviewEditableElement.src = afterConvert.src;
		nonPreviewEditableElement.title = afterConvert.title;
		nonPreviewEditableElement.editUrl = afterConvert.editUrl;
		nonPreviewEditableElement.askConvert = false;
	}

	nonPreviewEditableElement.buttons.push(nonPreviewEditableElement.getComplexEditButton(this, {
		enableEdit: !!nonPreviewEditableElement.editUrl
	}));
	nonPreviewEditableElement.buttons.push(nonPreviewEditableElement.getComplexSaveButton(this, {
		downloadUrl: nonPreviewEditableElement.downloadUrl
	}));
	
	return nonPreviewEditableElement;
}

BX.CViewer.prototype.createIframeElement = function(element, params)
{
	var iframeElement = new BX.CViewIframeElement({
		baseElementId: element.getAttribute('data-bx-baseElementId'),
		title: element.getAttribute('data-bx-title'),

		isFromUserLib: !!element.getAttribute('data-bx-isFromUserLib'),
		externalId: element.getAttribute('data-bx-externalId'),
		relativePath: element.getAttribute('data-bx-relativePath'),

		editUrl: element.getAttribute('data-bx-edit'),
		urlToPost: element.getAttribute('data-bx-urlToPost'),
		idToPost: element.getAttribute('data-bx-idToPost'),
		downloadUrl: element.getAttribute('data-bx-download'),
		historyPageUrl: element.getAttribute('data-bx-historyPage'),
		src: element.getAttribute('data-bx-src'),
		askConvert: element.getAttribute('data-bx-askConvert'),
		version: params.version >= 0? params.version : element.getAttribute('data-bx-version'),
		buttons: []
	});
	if(iframeElement.isConverted())
	{
		var afterConvert = BX.CViewer._convertElementsMatch[iframeElement.src];
		iframeElement.src = afterConvert.src;
		iframeElement.title = afterConvert.title;
		iframeElement.editUrl = afterConvert.editUrl;
		iframeElement.askConvert = false;
	}

	iframeElement.buttons.push(iframeElement.getComplexEditButton(this, {
		enableEdit: !!iframeElement.editUrl
	}));
	iframeElement.buttons.push(iframeElement.getComplexSaveButton(this, {
		downloadUrl: iframeElement.downloadUrl,
		reloadAfterDownload: true,
		showEdit: true
	}));

	return iframeElement;
};

var CViewerUrlHelper = {
	lastService: null,
	ajaxDocUrl: '/bitrix/tools/disk/document.php',
	ajaxUfDocUrl: '/bitrix/tools/disk/uf.php',

	normalizeServiceName: function(service)
	{
		switch(service.toLowerCase())
		{
			case 'g':
			case 'google':
			case 'gdrive':
				service = 'gdrive';
				break;
			case 's':
			case 'skydrive':
			case 'sky-drive':
			case 'onedrive':
				service = 'onedrive';
				break;
			case 'l':
			case 'local':
				service = 'l';
				break;
			default:
				service = 'gdrive';
				break;
		}
		return service;
	},

	getUrlViewFile: function(url)
	{
		url = this.addToLinkParam(url, 'service', 'gvdrive');
		url = this.addToLinkParam(url, 'document_action', 'show');
		return url;
	},

	getUrlCheckView: function(url)
	{
		url = this.addToLinkParam(url, 'service', 'gvdrive');
		url = this.addToLinkParam(url, 'document_action', 'checkView');
		return url;
	},

	getUrlStartPublishBlank: function(url, service, type)
	{
		service = this.normalizeServiceName(service);
		this.lastService = service;

		url = this.addToLinkParam(url, 'service', service);
		url = this.addToLinkParam(url, 'type', type);
		return url;
	},


	getUrlCommitBlank: function(url, type, targetFolderId)
	{
		url = this.addToLinkParam(url, 'service', this.lastService);
		url = this.addToLinkParam(url, 'document_action', 'saveBlank');
		url = this.addToLinkParam(url, 'type', type);
		if(targetFolderId)
		{
			url = this.addToLinkParam(url, 'targetFolderId', targetFolderId);
		}
		return url;
	},

	getUrlRenameFile: function(url)
	{
		url = this.addToLinkParam(url, 'service', this.lastService);
		url = this.addToLinkParam(url, 'document_action', 'rename');
		return url;
	},

	getUrlCopyToMe: function(url)
	{
		url = this.addToLinkParam(url, 'action', 'copyToMe');
		return url;
	},

	getUrlEditFile: function(url, service)
	{
		service = this.normalizeServiceName(service);
		this.lastService = service;
		url = this.addToLinkParam(url, 'service', service);
		return url;
	},

	getUrlCommitFile: function(url)
	{
		url = this.addToLinkParam(url, 'service', this.lastService);
		url = this.addToLinkParam(url, 'document_action', 'commit');
		return url;
	},

	getUrlDiscardFile: function(url)
	{
		url = this.addToLinkParam(url, 'service', this.lastService);
		url = this.addToLinkParam(url, 'document_action', 'discard');
		return url;
	},

	addToLinkParam: function(link, name, value)
	{
		if(!link.length)
		{
			return '?' + name + '=' + value;
		}
		link = BX.util.remove_url_param(link, name);
		if(link.indexOf('?') != -1)
		{
			return link + '&' + name + '=' + value;
		}
		return link + '?' + name + '=' + value;
	}

};

})(window);