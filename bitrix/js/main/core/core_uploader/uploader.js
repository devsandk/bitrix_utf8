;(function(window){
	if (window.BX["Uploader"])
		return false;
	var
		BX = window.BX,
		statuses = { "new" : 0, ready : 1, preparing : 2, inprogress : 3, done : 4, failed : 5, stopped : 6, changed : 7, uploaded : 8},
		repo = {};
	/**
	 * @return {BX.Uploader} || bool
	 * @params array
	 * @params[input] - BX(id).
	 *  DOM-node with id="uploader_somehash" should exist and will be replaced	 *
	 * @params[dropZone] - DOM node to drag&drop
	 * @params[placeHolder] - DOM node to append files
	 *
	 */
	BX.Uploader = function(params)
	{
		var ii;
		if (!(typeof params == "object" && !!params && BX(params["input"])))
		{
			BX.debug(BX.message("UPLOADER_INPUT_IS_NOT_DEFINED"));
			return false;
		}
		this.fileInput = BX(params["input"]);
		this.controlID = this.controlId = (params["controlId"] || "bitrixUploader");

		this.dialogName = "BX.Uploader";
		this.id = (!!params["id"] ? params["id"] : Math.random());
		this.CID = (!!params["CID"] ? !!params["CID"] : ("CID" + BX.UploaderUtils.getId()));
		this.streams = new BX.UploaderStreams(params['streams']);

		// Limits
		this.limits = {
			phpMaxFileUploads : parseInt(BX.message('phpMaxFileUploads')),
			phpPostMaxSize : parseInt(BX.message('phpPostMaxSize')),
			phpUploadMaxFilesize : parseInt(BX.message('phpUploadMaxFilesize')),
			uploadMaxFilesize : (params["uploadMaxFilesize"] > 0 ? params["uploadMaxFilesize"] : 0),
			uploadFileWidth : (params["uploadFileWidth"] > 0 ? params["uploadFileWidth"] : 0),
			uploadFileHeight : (params["uploadFileHeight"] > 0 ? params["uploadFileHeight"] : 0),
			allowUpload : ((params["allowUpload"] == "A" || params["allowUpload"] == "I" || params["allowUpload"] == "F") ? params["allowUpload"] : "A"),
			allowUploadExt : (typeof params["allowUploadExt"] === "string" ? params["allowUploadExt"] : "")};
		var keys = ["phpMaxFileUploads", "phpPostMaxSize", "phpUploadMaxFilesize"];
		for (ii = 0; ii < keys.length; ii++)
		{
			this.limits[keys[ii]] = (typeof params[keys[ii]] == "number" && params[keys[ii]] < this.limits[keys[ii]] ? params[keys[ii]] : this.limits[keys[ii]]);
		}
		this.CEF = !!window["BXDesktopSystem"];
		if (this.CEF)
		{
			this.limits["phpUploadMaxFilesize"] = (this.limits["phpUploadMaxFilesize"] > 100*1024*1024 ? 100*1024*1024 : this.limits["phpUploadMaxFilesize"]);
			this.limits["phpPostMaxSize"] = (this.limits["phpPostMaxSize"] > 110*1024*1024 ? 110*1024*1024 : this.limits["phpPostMaxSize"]);
			this.limits["uploadMaxFilesize"] = this.limits["phpUploadMaxFilesize"];
		}
		else
		{
			this.limits["phpUploadMaxFilesize"] = (this.limits["phpUploadMaxFilesize"] > 10*1024*1024 ? 10*1024*1024 : this.limits["phpUploadMaxFilesize"]);
			this.limits["phpPostMaxSize"] = (this.limits["phpPostMaxSize"] > 50*1024*1024 ? 50*1024*1024 : this.limits["phpPostMaxSize"]);
		}

// ALLOW_UPLOAD = 'A'll files | 'I'mages | 'F'iles with selected extensions
// ALLOW_UPLOAD_EXT = comma-separated list of allowed file extensions (ALLOW_UPLOAD='F')
		this.limits["uploadFile"] = (params["allowUpload"] == "I" ? "image/*" : "");
		this.limits["uploadFileExt"] = this.limits["allowUploadExt"];

		if (this.limits["uploadFileExt"].length > 0)
		{
			var ext = this.limits["uploadFileExt"].split(this.limits["uploadFileExt"].indexOf(",") >= 0 ? "," : " ");
			for (ii = 0; ii < ext.length; ii++)
				ext[ii] = (ext[ii].charAt(0) == "." ? ext[ii].substr(1) : ext[ii]);
			this.limits["uploadFileExt"] = ext.join(",");
		}
		this.params = params;

		this.params["filesInputName"] = (!!this.fileInput["name"] ? this.fileInput["name"] : "FILES");
		this.params["filesInputMultiple"] = (!!this.fileInput["multiple"] || this.params["filesInputMultiple"] ? "multiple" : false);
		this.params["uploadFormData"] = (this.params["uploadFormData"] == "N" ? "N" : "Y");
		this.params["uploadMethod"] = (this.params["uploadMethod"] == "immediate" ? "immediate" : "deferred"); // Should we start upload immediately or by event
		this.params["uploadFilesForPackage"] = parseInt(this.params["uploadFilesForPackage"] > 0 ? this.params["uploadFilesForPackage"] : 0);
		this.params["imageExt"] = "jpg,bmp,jpeg,jpe,gif,png";
		this.params["uploadInputName"] = (!!this.params["uploadInputName"] ? this.params["uploadInputName"] : "bxu_files");
		this.params["uploadInputInfoName"] = (!!this.params["uploadInputInfoName"] ? this.params["uploadInputInfoName"] : "bxu_info");
		this.params["deleteFileOnServer"] = !(this.params["deleteFileOnServer"] === false || this.params["deleteFileOnServer"] === "N");
		this.params["pasteFileHashInForm"] = !(this.params["pasteFileHashInForm"] === false || this.params["pasteFileHashInForm"] === "N");


		repo[this.id] = this;
		if (this.init(this.fileInput)) // init fileInput
		{
			if (!!params["dropZone"])
				this.initDropZone(BX(params["dropZone"]));

			this.form = this.fileInput.form;
			if (!!params["events"])
			{
				for(ii in params["events"])
				{
					if (params["events"].hasOwnProperty(ii))
					{
						BX.UploaderUtils.bindEvents(this, ii, params["events"][ii]);
					}
				}
			}

			this.uploadFileUrl = (!!params["uploadFileUrl"] ? params["uploadFileUrl"] : (this.form ? this.form.getAttribute("action") : ""));
			if (!this.uploadFileUrl || this.uploadFileUrl.length <= 0)
			{
				BX.debug(BX.message("UPLOADER_ACTION_URL_NOT_DEFINED"));
			}
			this.status = statuses.ready;


			/* This params only for files. They are here for easy way to change them */
			this.fileFields = params["fields"];
			this.fileCopies = params["copies"];
			var queueFields = (!!params["queueFields"] ? params["queueFields"] : {});
			queueFields["placeHolder"] = BX(queueFields["placeHolder"] || params["placeHolder"]);
			queueFields["showImage"] = (queueFields["showImage"] || params["showImage"]);
			queueFields["thumb"] = (queueFields["thumb"] || params["thumb"]);
			this.queue = new BX.UploaderQueue(queueFields, this.limits, this);

			this.params["doWeHaveStorage"] = true;
			BX.addCustomEvent(this, 'onDone', BX.delegate(function(){
				this.init(this.fileInput);
			}, this));
			if (!!this.params["filesInputName"] && this.params["pasteFileHashInForm"])
			{
				BX.addCustomEvent(this, 'onFileIsUploaded', BX.delegate(function(id, item){
					var node = BX.create("INPUT", {props : { type : "hidden", name : this.params["filesInputName"] + '[]', value : item.hash }});
					if (BX(params["placeHolder"]) && BX(id + 'Item'))
						BX(id + 'Item').appendChild(node);
					else
						this.fileInput.parentNode.insertBefore(node, this.fileInput);
				}, this));
			}
			if (this.params["deleteFileOnServer"])
			{
				BX.addCustomEvent(this, 'onFileIsDeleted', BX.delegate(function(id, file){
					if (!!file && !!file.hash)
					{
						var data = this.preparePost({mode : "delete", hash : file.hash}, false);
						BX.ajax.get(
							this.uploadFileUrl,
							data.data
						);
					}
				}, this));
			}
			BX.onCustomEvent(window, "onUploaderIsInited", [this.id, this]);
			this.uploads = new BX.UploaderUtils.Hash();
			this.upload = null;
			return this;
		}
	};

	BX.Uploader.prototype = {
		init : function(fileInput)
		{
			this.log('Initialized');
			if (fileInput == this.fileInput)
				fileInput = this.fileInput = this.mkFileInput(fileInput);
			else
				fileInput = this.mkFileInput(fileInput);

			BX.onCustomEvent(this, "onFileinputIsReinited", [fileInput, this]);

			if (fileInput)
			{
				BX.bind(fileInput, "change", BX.delegate(this.onChange, this));
				return true;
			}
			return false;
		},
		log : function(text)
		{
			BX.UploaderUtils.log('uploader', text);
		},
		initDropZone : function(node)
		{
			var dropZone = null;
			if (!!BX.DD && BX.type.isDomNode(node) && node.parentNode)
			{
				dropZone = new BX.DD.dropFiles(node);
				if (dropZone && dropZone.supported() && BX.ajax.FormData.isSupported()) {
					dropZone.f = {
						dropFiles : BX.delegate(this.onChange, this),
						dragEnter : function() { BX.addClass(dropZone.DIV, "bxu-file-input-over"); },
						dragLeave : function() { BX.removeClass(dropZone.DIV, "bxu-file-input-over"); }
					};
					BX.addCustomEvent(dropZone, 'dropFiles', dropZone.f.dropFiles);
					BX.addCustomEvent(dropZone, 'dragEnter', dropZone.f.dragEnter);
					BX.addCustomEvent(dropZone, 'dragLeave' , dropZone.f.dragLeave);
				}
				if (this.params["dropZone"] == node)
				{
					this.dropZone = dropZone;
				}
			}
			return dropZone;
		},
		onAttach : function(files, nodes)
		{
			if (typeof files !== "undefined" && files.length > 0)
			{
				if (!this.params["doWeHaveStorage"])
					this.queue.clear();

				var added = false, ext;
				nodes = (typeof nodes == "object" && !!nodes && nodes.length > 0 ? nodes : []);
				for (var i=0, f; i < files.length; i++)
				{
					f = files[i];
					if (f.type === "")
					{
						BX.DoNothing();
					}
					else if (this.limits["uploadFileExt"].length > 0)
					{
						ext = (f.name || '').split('.').pop();
						if (this.limits["uploadFileExt"].indexOf(ext) < 0)
							continue;
					}
					BX.onCustomEvent(this, "onItemIsAdded", [f, nodes[i], this]);
					added = true;
				}
				if (added)
				{
					BX.onCustomEvent(this, "onItemsAreAdded", [this]);
				}
			}
			return false;
		},
		onChange : function(fileInput)
		{
			var files = fileInput, ext;
			if (!!fileInput && !!fileInput.target)
				files = fileInput.target.files;
			else if (!fileInput)
				files = this.fileInput.files;

			if (this.fileInput.disabled)
			{
				BX.PreventDefault(fileInput);
				return false;
			}

			if (typeof files !== "undefined" && files.length > 0)
			{
				BX.PreventDefault(fileInput);
				this.init(fileInput);
				if (!this.params["doWeHaveStorage"])
					this.queue.clear();

				var added = false;
				for (var i=0, f; i < files.length; i++)
				{
					f = files[i];
					if (f.type === "")
					{
						BX.DoNothing();
					}
					else if (this.limits["uploadFileExt"].length > 0)
					{
						ext = (f.name || '').split('.').pop();
						if (this.limits["uploadFileExt"].indexOf(ext) < 0)
							continue;
					}
					BX.onCustomEvent(this, "onItemIsAdded", [f, null, this]);
					added = true;
				}
				if (added)
				{
					BX.onCustomEvent(this, "onItemsAreAdded", [this]);
					if (this.params["uploadMethod"] == "immediate")
						this.submit();
				}
			}
			return false;
		},
		mkFileInput : function(oldNode)
		{
			if (!BX(oldNode))
				return false;
			BX.unbindAll(oldNode);
			var node = oldNode.cloneNode(true);
			BX.adjust(node, {
				props : {
					value : ""
				},
				attrs: {
					name: (this.params["uploadInputName"] + '[]'),
					multiple : this.params["filesInputMultiple"],
					accept : this.limits["uploadFile"],
					value : ""
			}});
			oldNode.parentNode.insertBefore(node, oldNode);
			oldNode.parentNode.removeChild(oldNode);
			return node;
		},
		checkFile : function(item)
		{
			var error = "";
			if (this.limits["uploadMaxFilesize"] > 0 && item.file && item.file.size > this.limits["uploadMaxFilesize"])
			{
				error = BX.message('FILE_BAD_SIZE') + '(' + BX.UploaderUtils.getFormattedSize(this.limits["uploadMaxFilesize"], 2) + ')';
			}
			return error;
		},
		appendToForm : function(fd, key, val)
		{
			if (!!val && typeof val == "object")
			{
				for (var ii in val)
				{
					if (val.hasOwnProperty(ii))
					{
						this.appendToForm(fd, key + '[' + ii + ']', val[ii]);
					}
				}
			}
			else
				fd.append(key, (!!val ? val : ''));
		},
		prepareData : function(arData)
		{
			var data = {};
			if (null != arData)
			{
				if(typeof arData == 'object')
				{
					for(var i in arData)
					{
						if (arData.hasOwnProperty(i))
						{
							var name = BX.util.urlencode(i);
							if(typeof arData[i] == 'object')
								data[name] = this.prepareData(arData[i]);
							else
								data[name] = BX.util.urlencode(arData[i]);
						}
					}
				}
				else
					data = BX.util.urlencode(arData);
			}
			return data;
		},
		preparePost : function(data, prepareForm)
		{
			if (prepareForm === true && this.params["uploadFormData"] == "Y" && !this.post)
			{
				var post2 = {"AJAX_POST" : "Y", "sessid" : BX.bitrix_sessid()};
				post2 = (this.form ? BX.UploaderUtils.FormToArray(this.form, post2) : post2);
				if (!!post2.data[this.params["filesInputName"]])
				{
					post2.data[this.params["filesInputName"]] = null;
					delete post2.data[this.params["filesInputName"]];
				}
				if (!!post2.data[this.params["uploadInputInfoName"]])
				{
					post2.data[this.params["uploadInputInfoName"]] = null;
					delete post2.data[this.params["uploadInputInfoName"]];
				}
				if (!!post2.data[this.params["uploadInputName"]])
				{
					post2.data[this.params["uploadInputName"]] = null;
					delete post2.data[this.params["uploadInputName"]];
				}
				post2.size = BX.UploaderUtils.sizeof(post2.data);
				this.post = post2;
			}
			var post = (prepareForm === true && this.params["uploadFormData"] == "Y" ? this.post : {data : {"AJAX_POST" : "Y", "sessid" : BX.bitrix_sessid()}, size : 48}), size = 0;
			if (!!data)
			{
				post.data[this.params["uploadInputInfoName"]] = {
					controlId : this.controlId,
					CID : this.CID
				};
				for (var ii in data)
				{
					if (data.hasOwnProperty(ii))
					{
						post.data[this.params["uploadInputInfoName"]][ii] = data[ii];
					}
				}
				size = BX.UploaderUtils.sizeof(this.params["uploadInputInfoName"]) + BX.UploaderUtils.sizeof(post.data[this.params["uploadInputInfoName"]]);
			}
			post.length = post.size + size;
			return post;
		},
		FormData : window.FormData,
		preparePackage : function(packageIndex, files, formData)
		{
			var fd = new this.FormData(), item, data = formData, res;
			for (item in data)
			{
				if (data.hasOwnProperty(item))
				{
					this.appendToForm(fd, item, data[item]);
				}
			}
			for (var id in files)
			{
				if (files.hasOwnProperty(id))
				{
					data = files[id];

					if (!!data.props)
					{
						res = this.prepareData(data.props);
						for (item in res)
						{
							if (res.hasOwnProperty(item))
							{
								this.appendToForm(fd, this.params["uploadInputName"] + '[' + id + '][' + item + ']', res[item]);
							}
						}
					}
					if (!!data.files)
					{
						for (var ii = 0; ii < data.files.length; ii++)
						{
							item = data.files[ii];
							files[id].files[ii].postName = item.postName =
								item.name + (!!item.thumb ? ('\\' + item.thumb + '\\') : (item.packages > 0 ? ('/' + item.packages + '/' + item.package + '/') : ''));
							fd.append((this.params["uploadInputName"] + '[' + id + '][' + this.prepareData(item.postName) + ']'), item, this.prepareData(item.postName));
						}
					}
				}
			}
			return fd;
		},
		sendPackage : function(stream, packageIndex, files, formData)
		{
			var fd = this.preparePackage(packageIndex, files, formData);
			this.onStartPackage(stream, packageIndex, files);
			this.send(stream, packageIndex, fd);
		},
		send : function(stream, packageIndex, fd)
		{
			this.xhr = BX.ajax({
				'method': 'POST',
				'dataType': 'json',
				'data' : fd,
				'url': this.uploadFileUrl,
				'onsuccess': BX.proxy(function(data){this.onDonePackage(stream, packageIndex, data);}, this),
				'onfailure': BX.proxy(function(){this.onErrorPackage(stream, packageIndex, arguments);}, this),
				'start': false,
				'preparePost':false,
				'processData':true
			});
			this.xhr.upload.addEventListener(
				'progress',
				BX.proxy(function(e){this.onProcessPackage(stream, packageIndex, e);}, this),
				false
			);
			this.xhr.send(fd);
		},
		submit : function()
		{
			this.onStart();
		},
		stop : function()
		{
			this.onTerminate();
		},
		adjustProcess : function(streamId, item, status, params, pIndex)
		{
			var text = '', percent = 0;
			if (this.queue.itFailed.hasItem(item.id))
			{
				text = 'response [we do not work with errors]';
			}
			else if (status == statuses.error)
			{
				delete item.progress;
				this.queue.itFailed.setItem(item.id, item);
				this.queue.itForUpload.removeItem(item.id);

				BX.onCustomEvent(this, "onFileIsUploadedWithError", [item.id, item, params, this, pIndex]);
				BX.onCustomEvent(item, "onUploadError", [item, params, this, pIndex]);
				text = 'response [error]';
			}
			else if (status == statuses.uploaded)
			{
				delete item.progress;
				this.queue.itUploaded.setItem(item.id, item);
				this.queue.itForUpload.removeItem(item.id);

				BX.onCustomEvent(this, "onFileIsUploaded", [item.id, item, params, this, pIndex]);
				BX.onCustomEvent(item, "onUploadDone", [item, params, this, pIndex]);
				text = 'response [uploaded]';
			}
			else if (status == statuses.inprogress)
			{
				if (typeof params == "number")
				{
					if (params == 0 && item.progress.status == statuses["new"])
					{
						BX.onCustomEvent(item, "onUploadStart", [item, 0, this, pIndex]);
						item.progress.status = statuses.inprogress;
					}

					percent = item.progress.uploaded + (item.progress.streams[streamId] * params) / 100;
				}
				else
				{
					item.progress.uploaded += item.progress.streams[streamId];
					item.progress.streams[streamId] = 0;
					percent = item.progress.uploaded;
				}
				text = 'response [uploading]. Uploaded: ' + percent;
				BX.onCustomEvent(item, "onUploadProgress", [item, percent, this, pIndex]);
			}
			else if (status == statuses.failed)
			{
				if (item.progress.streams[streamId] == item.progress.percentPerChunk)
				{
					item.progress = null;
					delete item.progress;
				}
				else
				{
					item.progress.streams[streamId] -= item.progress.percentPerChunk / params.packages;
					item.progress.streams[streamId] = (item.progress.streams[streamId] > 0 ? item.progress.streams[streamId] : 0);
				}
			}
			else
			{
				if (status == statuses["new"])
				{
					var chunks = (item.getThumbs("getCount") > 0 ? item.getThumbs("getCount") : 0)
						+ 2;// props + (default canvas || file)

					item.progress = {
						percentPerChunk : (100 / chunks),
						streams : {},
						uploaded : 0,
						status : statuses["new"]
					};
					item.progress.streams[streamId] = item.progress.percentPerChunk;
					text = 'request preparing [start]. Prepared: ' + item.progress.streams[streamId];
				}
				else if (status == statuses.preparing)
				{
					item.progress.streams[streamId] = (item.progress.streams[streamId] > 0 ? item.progress.streams[streamId] : 0);
					item.progress.streams[streamId] += item.progress.percentPerChunk / params.packages;
					text += 'request preparing [cont]. Prepared: ' + item.progress.streams[streamId];
				}
				else
				{
					text = 'request preparing [finish]. ';
				}
				BX.onCustomEvent(item, "onUploadPrepared", [item, params, this, pIndex]);
			}
			this.log(item.name + ': ' + text);
		},
		onTerminate : function(pIndex)
		{
			var packageFormer;
			if (!!pIndex && this.uploads.hasItem(pIndex))
			{
				if (this.upload.pIndex == pIndex)
					this.upload = null;
				this.log(pIndex + ' Uploading is canceled');
				packageFormer = this.uploads.removeItem(pIndex);
				this.queue.restoreFiles(packageFormer.dataId);
				BX.onCustomEvent(this, 'onTerminated', [pIndex]);
				this.checkUploads(null);
			}
			else if (!pIndex)
			{
				while ((packageFormer = this.uploads.getFirst()) && !!packageFormer)
				{
					this.uploads.removeItem(packageFormer.pIndex);
					packageFormer.stop();
					this.log(packageFormer.pIndex + ' Uploading is canceled');
					this.queue.restoreFiles(packageFormer.dataId);
					BX.onCustomEvent(this, 'onTerminate', [pIndex, packageFormer]);
				}
				this.upload = null;
			}
		},
		onStart : function()
		{

			var pIndex = 'pIndex' + BX.UploaderUtils.getId(), queue = this.queue.itForUpload;
			this.queue.itForUpload = new BX.UploaderUtils.Hash();
			this.log(pIndex + ' Uploading is started');
			this.post = false;
			var packageFormer = new BX.UploaderPackage(queue);
			BX.onCustomEvent(this, 'onStart', [pIndex, packageFormer, this]);
			packageFormer.pIndex = pIndex;
			if (packageFormer.length > 0)
				this.uploads.setItem(pIndex, packageFormer);
			this.checkUploads(null);
		},
		addFile : function(id, packageIndex)
		{
		},
		packFiles : function(item, pack)
		{
			var stream = this.streams.get(pack, this.preparePost( { packageIndex : pack.pIndex, filesCount : pack.filesCount, mode : "upload" }, true));
			if (!!stream)
			{
				if (item === statuses.inprogress) // if file still has not initialised
				{
					setTimeout(BX.proxy(function(){ this.checkUploads(pack.pIndex); }, this), 500);
					return statuses.inprogress;
				}
				else if (typeof item == "object" && item.uploadStatus == statuses.done)
				{
					// in case of using several streams to release current stream
				}
				else if (item !== statuses.done) // if pack has not been sent
				{
					var count = (this.limits["phpMaxFileUploads"] - stream.filesCount),
						size = (this.limits["phpPostMaxSize"] - stream.postSize),
						blob, file, data = {files : []}, tmp, error, callback;

					while (!!item && size > 0 && count > 0)
					{
						file = null; blob = null; error = ''; callback = null;
						if (item.uploadStatus != statuses.preparing)
						{
							error = this.checkFile(item);
							if (error === '')
							{
								data.props = item.getProps();
								callback = BX.proxy(function() {
									item.uploadStatus = statuses.preparing;
									this.adjustProcess(stream.id, item, statuses["new"], {}, pack.pIndex);
									pack.checkedFilesCount = (pack.checkedFilesCount > 0 ? pack.checkedFilesCount : 0) + 1;
								}, this);
							}
							else
							{
								data.props = {name : item.name, error : true};
								this.adjustProcess(stream.id, item, statuses.error, {error : error}, pack.pIndex);
								item.uploadStatus = statuses.error;
								pack.notCheckedFiles = (!!pack.notCheckedFiles ? pack.notCheckedFiles : []);
								pack.notCheckedFiles.push(item.id);
							}
						}
						else
						{
							if (!item["file"])
							{
								file = null;
							}
							else if (item.file.uploadStatus != statuses.done)
							{
								file = item.file;
							}
							else if (item.thumb !== null && !!item.thumb)
							{
								file = item.thumb;
							}
							else
							{
								item.thumb = file = item.getThumbs(null);
							}
							if (file === null)
							{
								item.uploadStatus = statuses.done;
								this.adjustProcess(stream.id, item, statuses.done, {}, pack.pIndex);
								item.file.uploadStatus = statuses.done;
								item.thumb = null;
							}
							else
							{
								blob = BX.UploaderUtils.getFilePart(file, (size - 1), this.limits["phpUploadMaxFilesize"]);
								if (!blob)
								{
									data.props = "error";
									this.adjustProcess(stream.id, item, statuses.error, {error : BX.message('FILE_BAD_SIZE')}, pack.pIndex);
									item.uploadStatus = statuses.error;
								}
								else
								{
									data.files.push(blob);
									callback = BX.proxy(function(file, blob) {
										BX.UploaderUtils.applyFilePart(file, blob);
										if (item.file == file && blob == file)
										{
											this.adjustProcess(stream.id, item, statuses.preparing, {canvas : "default", package : 1, packages : 1}, pack.pIndex);
										}
										else if (item.file == file)
										{
											this.adjustProcess(stream.id, item, statuses.preparing, {canvas : "default", package : (blob.package + 1), packages : blob.packages, blob : blob}, pack.pIndex);
										}
										else if (blob == file)
										{
											this.adjustProcess(stream.id, item, statuses.preparing, {canvas : item.thumb.thumb, package : 1, packages : 1, blob : blob}, pack.pIndex);
											item.thumb = null;
										}
										else
										{
											this.adjustProcess(stream.id, item, statuses.preparing,
												{canvas : item.thumb.thumb, package : (blob.package + 1), packages : blob.packages, blob : blob}, pack.pIndex);
											if (item.thumb.uploadStatus == statuses.done)
												item.thumb = null;
										}
									}, this);
								}
							}
						}
						if (data.files.length > 0 || !!data["props"])
						{
							tmp = BX.UploaderUtils.sizeof(data.files) + (!!data["props"] ? BX.UploaderUtils.sizeof(data.props) : 0);
							size -= tmp;
							if (size >= 0)
							{
								if (callback !== null)
									callback(file, blob, error);
								stream.postSize += tmp;
								stream.files[item.id] = BX.UploaderUtils.makeAnArray(stream.files[item.id], data);
								if (data.files.length) { count--; stream.filesCount++;}
							}
							data = {files : []};
						}
						if (item.uploadStatus !== statuses.preparing)
						{
							break;
						}
					}
					if (!!item && size > 0 && count > 0) // if we can do another step we should tell about this for packageFormer
					{
						return ((item.uploadStatus !== statuses.preparing) ? statuses.done : statuses.inprogress);
					}
				}

				var needToCancelUploading = (BX.util._array_keys_ob(stream.files).length <= 0 || (pack.sended !== true && !!pack.notCheckedFiles && pack.notCheckedFiles.length >= pack.filesCount)),
					result;
				this.streams.release();
				if (needToCancelUploading === false) // if stream is filled
				{
					pack.sended = true;
					this.sendPackage(stream, pack.pIndex, stream.files, stream.post);
					result = (item.uploadStatus === statuses.preparing ? statuses.inprogress : statuses.done);
					if (item.uploadStatus === statuses.preparing)
						BX.defer_proxy(function(){ this.checkUploads(pack.pIndex); }, this)();
				}
				else // if there is nothing to send
				{
					this.onDonePackage(stream, pack.pIndex, true);
					result = statuses.done;
				}

				return result;
			}
			return statuses.inprogress;
		},
		checkUploads : function(pIndex)
		{
			var upload = null;
			if (!!pIndex)
				upload = this.uploads.getItem(pIndex);
			else if (this.upload === null)
				upload = this.upload = this.uploads.getFirst();
			if (!!upload)
			{
				if (typeof upload.uNumber == 'undefined')
					upload.uNumber = 0;
				else
					upload.uNumber++;
				this.onContinue(upload.pIndex, upload.uNumber);

				this._packFiles = (!!this._packFiles ? this._packFiles : BX.delegate(this.packFiles, this));
				upload.checkIfFileIsInitialised(this._packFiles);
				return true;
			}
			return false;
		},
		onContinue : function(pIndex)
		{
			this.log(pIndex + ' Uploading is continued');
			BX.onCustomEvent(this, 'onContinue', [pIndex]);
		},
		onDone : function(stream, pIndex, files)
		{
			var res = (this.uploads.removeItem(pIndex) || { pIndex : pIndex, postSize : 0, filesCount : 0 } );
			this.log(pIndex + ' Uploading is done');
			BX.onCustomEvent(this, 'onDone', [stream, pIndex, res, files]);
			this.upload = null;
			BX.defer_proxy(function(){ this.checkUploads(null); }, this)();
		},
		onError : function(stream, pIndex, data)
		{
			this.log(JSON.stringify(data) + ' Uploading is failed');
			BX.debug('Download Error: ' + JSON.stringify(data));

			stream.files = (stream.files || {});
			var item;
			for (var id in stream.files)
			{
				if (stream.files.hasOwnProperty(id))
				{
					this.adjustProcess(stream.id, this.queue.items.getItem(id), statuses.error, {error : data}, pIndex);
				}
			}

			this.errorOccured = true;
			BX.onCustomEvent(this, 'error', [stream, pIndex, data]);
			BX.onCustomEvent(this, 'onError', [stream, pIndex, data]);

			if (this.uploads.hasItem(pIndex))
			{
				if (this.upload.pIndex == pIndex)
					this.upload = null;
				this.uploads.removeItem(pIndex);
				this.checkUploads(null);
			}
		},
		onStartPackage : function(stream, pIndex, data)
		{
			this.log(pIndex + ' package is started');
			var upload = this.uploads.getItem(pIndex);
			if (!!upload)
			{
				var item, id;
				for (id in stream.files)
				{
					if (stream.files.hasOwnProperty(id))
					{
						item = upload.data.getItem(id);
						if (!!item)
						{
							this.adjustProcess(stream.id, item, statuses.inprogress, 0, pIndex);
						}
					}
				}
			}
			BX.onCustomEvent(this, 'startPackage', [stream, pIndex, data]);
		},
		onProcessPackage : function(stream, pIndex, e) {
			var procent = 15,
				upload = this.uploads.getItem(pIndex);
			if(e.lengthComputable) {
				procent = e.loaded * 100 / (e.total || e.totalSize);
			}
			else if (e > procent)
				procent = e;
			procent = (procent > 5 ? procent : 5);

			if (!!upload)
			{
				var item, id;
				for (id in stream.files)
				{
					if (stream.files.hasOwnProperty(id))
					{
						item = upload.data.getItem(id);
						if (!!item)
						{
							this.adjustProcess(stream.id, item, statuses.inprogress, procent, pIndex);
						}
					}
				}
			}
			BX.onCustomEvent(this, 'processPackage', [stream, pIndex, procent]);
			return procent;
		},
		onDonePackage : function(stream, pIndex, data)
		{
			this.log(pIndex + ' package is done');
			this.streams.restore(stream);
			var data1 = (this.streams.packages.getItem(pIndex) || {});

			var merge = function(ar1, ar2)
				{
					for (var jj in ar2)
					{
						if (ar2.hasOwnProperty(jj) && !ar1[jj])
						{
							ar1[jj] = ar2[jj]
						}
						else if ((typeof ar2[jj] == typeof ar1[jj] == "object") && ar2[jj] !== null && ar1[jj] !== null)
						{
							ar1[jj] = merge(ar1[jj], ar2[jj]);
						}
					}
					return ar1;
				};
			data1['response'] = merge((data1['response'] || {}), data);
			if (data === true)
			{
				this.onDone(stream, pIndex, data);
			}
			else if (!!data && typeof data == "object" && data["files"] && data["status"] !== "error")
			{
				var item, id, file;
				stream.files = (stream.files || {});
				for (id in stream.files)
				{
					if (stream.files.hasOwnProperty(id))
					{
						item = this.queue.items.getItem(id);
						if (!!item)
						{
							file = data.files[id];
							item.hash = file.hash;
							if (file.status == "error")
							{
								this.adjustProcess(stream.id, item, statuses.error, file, pIndex);
							}
							else if (file.status == "uploaded")
							{
								this.adjustProcess(stream.id, item, statuses.uploaded, file, pIndex);
							}
							else // chunks
							{
								this.adjustProcess(stream.id, item, statuses.inprogress, file, pIndex);
							}
						}
					}
				}
				BX.onCustomEvent(this, 'donePackage', [stream, pIndex, data]);
				if (data["status"] == "done")
				{
					this.onDone(stream, pIndex, data);
				}
				else
				{
					BX.defer_proxy(function(){ this.checkUploads(pIndex); }, this)();
				}
			}
			else
			{
				this.onErrorPackage(stream, pIndex, data);
			}
		},
		onErrorPackage : function(stream, packageIndex, data)
		{
			stream = !!stream ? stream : {};
			stream["try"] = (!!stream["try"] && stream["try"] > 0 ? stream["try"] : 0);
			stream["try"]++;
			if (stream["try"] > 2)
			{
				this.streams.restore(stream);
				this.onError(stream, packageIndex, data);
			}
			else
			{
				this.sendPackage(stream, packageIndex, stream.files, stream.post);
			}
		},


		// public functions
		getItem : function(id)
		{
			return this.queue.getItem(id);
		}
	};

	BX.UploaderSimple = function(params)
	{
		BX.UploaderSimple.superclass.constructor.apply(this, arguments);
		this.dialogName = "BX.UploaderSimple";
		BX.addCustomEvent(this, "onFileNeedsPreview", BX.delegate(function(id, item) {
			this.previews = (!!this.previews ? this.previews : new BX.UploaderUtils.Hash());
			this.previews.setItem(item.id, item);
			this.previewsQueue = (!!this.previewsQueue ? this.previewsQueue : new BX.UploaderUtils.Hash());
			setTimeout(BX.delegate(this.onFileNeedsPreview, this), 500);
		}, this));
		this.streams = new BX.UploaderStreams(1);
		return this;
	};
	BX.extend(BX.UploaderSimple, BX.Uploader);

	BX.UploaderSimple.prototype.onFileNeedsPreviewCallback = function(packageIndex, data)
	{
		this.log('onFileNeedsPreviewCallback');
		var queue = this.previewsQueue.removeItem(packageIndex);
		this.onFileNeedsPreview();
		data = (typeof data == "object" && !!data ? data : {});
		data["files"] = (!!data["files"] ? data["files"] : {});
		if (!!queue)
		{
			var item, file, checked = false;
			while((item = queue.getFirst()) && !!item)
			{
				queue.removeItem(item.id);
				checked = false;
				try
				{
					if (!!data["files"][item.id])
					{
						if (data["files"][item.id]["status"] == "uploaded" && !!data["files"][item.id]["hash"])
						{
							file = data.files[item.id]["file"]["files"]["default"];
							item.file = {
								hash : data["files"][item.id]["hash"],
								copy : "default",
								id : item.id,
								"name" : file["name"],
								"~name" : file["~name"],
								size : parseInt(file["size"]),
								type : file["type"],
								url : file["url"]
							};
							checked = true;
							BX.onCustomEvent(item, "onFileHasGotPreview", [item.id, item]);
							continue;
						}
					}
				}
				catch(e) {
					checked = null
				}
				BX.onCustomEvent(item, "onFileHasNotGotPreview", [item.id, item]);
				if (checked === null)
					this.adjustProcess(null, item, statuses.error, {error : BX.message('UPLOADER_UPLOADING_ERROR')}, packageIndex);
				else
					this.adjustProcess(null, item, statuses.error, {error : data["files"][item.id]["error"]}, packageIndex);
			}
		}
	};
	BX.UploaderSimple.prototype.onFileNeedsPreview = function()
	{
		var packageIndex = 'preview' + BX.UploaderUtils.getId(),
			post = this.preparePost({packageIndex : packageIndex, filesCount : this.limits["phpMaxFileUploads"], mode : "upload", type : "brief"}, true),
			count = this.limits["phpMaxFileUploads"],
			item, files = false, items = new BX.UploaderUtils.Hash();

		while (count > 0 && this.previews.length > 0 && (item = this.previews.getFirst()) && !!item && item !== null)
		{
			this.previews.removeItem(item.id);
			files = (files === false ? {} : files);
			files[item.id] = {files : [item.file], props : {name : item.name}};
			count--;
			items.setItem(item.id, item);
		}
		if (files !== false)
		{
			post = this.preparePost({packageIndex : packageIndex, filesCount : (this.limits["phpMaxFileUploads"]-count), mode : "upload", type : "brief"}, true);
			this.previewsQueue.setItem(packageIndex, items);
			var fd = this.preparePackage(packageIndex, files, post.data, (this.limits["phpMaxFileUploads"] - count));
			this.send(null, packageIndex, fd, BX.proxy(function(data) { this.onFileNeedsPreviewCallback(packageIndex, data); }, this));
		}
	};
	BX.UploaderSimple.prototype.init = function(fileInput, del)
	{
		this.log('Initialized: ' + (del !== false ? 'drop' : ' does not drop'));
		if (fileInput == this.fileInput)
			this.fileInput = fileInput = this.mkFileInput(fileInput, del);
		else
			fileInput = this.mkFileInput(fileInput, del);
		if (fileInput)
		{
			BX.bind(fileInput, "change", BX.delegate(this.onChange, this));
			return true;
		}
		return false;
	};
	BX.UploaderSimple.prototype.log = function(text) { BX.UploaderUtils.log('simpleup', text); };
	BX.UploaderSimple.prototype.mkFileInput = function(oldNode, del)
	{
		if (!BX(oldNode))
			return false;
		BX.unbindAll(oldNode);
		var node = oldNode.cloneNode(true);
		BX.adjust(node, {
			attrs: {
				id : "",
				name: (this.params["uploadInputName"] + '[file' + BX.UploaderUtils.getId() + ']'),
				multiple : false,
				accept : this.limits["uploadFile"]
		}});
		oldNode.parentNode.insertBefore(node, oldNode);
		if (del !== false)
			oldNode.parentNode.removeChild(oldNode);

		return node;
	};
	BX.UploaderSimple.prototype.onChange = function(fileInput)
	{
		fileInput = (fileInput.target || fileInput.srcElement || this.fileInput);

		BX.PreventDefault(fileInput);
		if (!!(fileInput.value))
		{
			if (this.params["doWeHaveStorage"])
				this.init(fileInput, false);
			else
				this.queue.clear();
			var ext = (fileInput.value.name || '').split('.').pop(), err = false;

			if (this.limits["uploadFileExt"].length > 0)
			{
				err = (this.limits["uploadFileExt"].indexOf(ext) < 0);
			}
			else if (this.limits["uploadFile"] == "image/*")
			{
				err = (this.params["imageExt"].indexOf(ext) < 0);
			}
			if (!err)
			{
				if (this.params["imageExt"].indexOf(ext) >= 0)
					fileInput.fileType = "image/xyz";
				BX.onCustomEvent(this, "onItemIsAdded", [fileInput, null, this]);
				BX.onCustomEvent(this, "onItemsAreAdded", [this]);

				if (this.params["uploadMethod"] == "immediate")
					this.submit();
			}
		}
		return false;
	};
	BX.UploaderSimple.prototype.appendToForm = function(fd, key, val)
	{
		if (!!val && typeof val == "object")
		{
			for (var ii in val)
			{
				if (val.hasOwnProperty(ii))
				{
					this.appendToForm(fd, key + '[' + ii + ']', val[ii]);
				}
			}
		}
		else
			fd.append(key, (!!val ? val : ''));
	};
	BX.UploaderSimple.prototype.FormData = function()
	{
		var uniqueID;
		do {
			uniqueID = Math.floor(Math.random() * 99999);
		} while(BX("form-" + uniqueID));

		this.form = BX.create("FORM", {
			props: {
				id: "form-" + uniqueID,
				method: "POST",
				enctype: "multipart/form-data",
				encoding: "multipart/form-data"
			},
			style: {display: "none"}
		});
		document.body.appendChild(this.form);
	};
	BX.UploaderSimple.prototype.FormData.prototype = {
		append : function(name, val)
		{
			if (BX.type.isDomNode(val))
			{
				this.form.appendChild(val);
			}
			else
			{
				this.form.appendChild(
					BX.create("INPUT", {
							props : {
								type : "hidden",
								name : name,
								value : val
							}
						}
					)
				);
			}
		}
	};
	BX.UploaderSimple.prototype.send = function(stream, packageIndex, fd, callback)
	{
		if(!this.onBeforeUnload)
			this.onBeforeUnload = BX.delegate(this.beforeunload, this);
		BX.bind(window, 'beforeunload', this.onBeforeUnload);

		BX.adjust(fd.form, { attrs : { action: this.uploadFileUrl } } );
		BX.ajax.submit(fd.form, BX.proxy(function(innerHTML){this.aftersubmit(stream, packageIndex, innerHTML, callback)}, this));
		if (!callback)
			this.onProcessPackage(stream, packageIndex, 90);
	};

	BX.UploaderSimple.prototype.aftersubmit = function(stream,packageIndex, data, callback)
	{
		BX.unbind(window, 'beforeunload',this.onBeforeUnload);
		data = BX.util.htmlspecialcharsback(data);
		while (/^<(.*?)>(.*?)<(.*?)>$/gi.test(data))
			data = data.replace(/^<(.*?)>(.*?)<(.*?)>$/gi, "$2");
		while (/^<([^<>]+)>(.*?)/gi.test(data))
			data = data.replace(/^<(.*?)>(.*?)/gi, "$2");
		while (/(.+?)<([^<>]+)>$/gi.test(data))
			data = data.replace(/(.+?)<([^<>]+)>$/gi, "$1");

		var res = BX.parseJSON(data, {});

		if (!!callback)
		{
			callback(res);
		}
		else if (!!res)
		{
			this.onDonePackage(stream, packageIndex, res);
		}
		else
		{
			this.onErrorPackage(stream, packageIndex, data);
		}
	};
	BX.UploaderSimple.prototype.beforeunload = function()
	{
		this.stop();
	};
	BX.Uploader.isSupported = function()
	{
		return (window.Blob || window["MozBlobBuilder"] || window["WebKitBlobBuilder"] || window["BlobBuilder"]);
	};
	BX.Uploader.getInstance = function(params)
	{
		var objName = "BX.UploaderSimple";
		if (BX.Uploader.isSupported())
			objName = "BX.Uploader";
		BX.onCustomEvent(window, "onUploaderIsAlmostInited", [objName, params]);
		return eval("new " + objName + "(params);");
	};

	BX.UploaderPackage = function(raw)
	{
		this.filesCount = 0;
		this.length = 0;
		if (!!raw && raw.length > 0)
		{
			/**
			 * this.length integer
			 * this.raw BX.UploaderUtils.Hash()
			 * this.data BX.UploaderUtils.Hash()
			 */
			this.length = raw.length;
			this.filesCount = raw.length;
			this.raw = raw;
			this.dataId = raw.order.join(",").split(",");
			this.data = new BX.UploaderUtils.Hash();
			this.init();
		}
	};

	BX.UploaderPackage.prototype = {
		stop: function()
		{
			this.status = statuses.terminate;
		},
		log : function(text)
		{
			BX.UploaderUtils.log('package', text);
		},
		init : function()
		{
			var item, callback = BX.proxy(function(id, item) {
				if (this.raw.removeItem(id))
				{
					this.data.setItem(id, item);
					BX.onCustomEvent(item, "onFileHasToBePrepared", [item.id, item]);
					this.init();
				}
			} , this);

			while ((item = this.raw.getFirst()) && !!item)
			{
				BX.addCustomEvent(item, "onFileIsDeleted", BX.delegate(function(item){
					this.data.removeItem(item.id);
					this.length--;
					this.filesCount--;
				}, this));
				if (item.status === statuses["new"])
				{
					BX.addCustomEvent(item, "onFileIsInited", callback);
					break;
				}
				else
				{
					callback(item.id, item);
				}
			}
		},
		checkIfFileIsInitialised : function(callback)
		{
			if (!this.callback)
				this.callback = callback;
			var item, res;
			while ((item = this.data.getNext()) && !!item)
			{
				if (item.preparationStatus != statuses.done) // if file is not initialized
				{
					this.data.pointer--;
					callback(statuses.inprogress, this);
					return statuses.inprogress;
				}
				else if ((res = callback(item, this)) && res != statuses.done) // if file is not fitted into package
				{
					this.data.pointer--;
					return statuses.inprogress;
				}
			}
			if (!item && this.data.length < this.filesCount)
			{
				callback(statuses.inprogress, this);
				return statuses.inprogress;
			}
			callback(statuses.done, this);
			return statuses.done;
		}
	};

	BX.UploaderStream = function(_id)
	{
		this.id = 'stream' + _id;
		this._id = _id;
	};
	BX.UploaderStream.prototype =
	{
		init : function(packageIndex, post)
		{
			this.pIndex = packageIndex;
			this.post = post.data;
			this.files = {};
			this.postSize = post.length;
			this.filesCount = 0;
			return this;
		}
	};

	BX.UploaderStreams = function(count)
	{
		this.streams = new BX.UploaderUtils.Hash();
		count = (5 < count ? 5 : ( count > 1 ? count : 1));
		var stream;
		while (count-- > 0)
		{
			stream = new BX.UploaderStream(count);
			this.streams.setItem(stream.id, stream);
		}
		this.packages = new BX.UploaderUtils.Hash();
		this.stream = null;
	};
	BX.UploaderStreams.prototype = {
		get : function(pack, post)
		{
			if (!this.stream && (this.stream = this.streams.getFirst()) && !!this.stream)
			{
				this.streams.removeItem(this.stream.id);
				this.packages.setItem(pack.pIndex, post);
				this.stream.init(pack.pIndex, this.packages.getItem(pack.pIndex));
			}
			return this.stream;
		},
		release : function()
		{
			this.stream = null;
		},
		restore : function(stream)
		{
			if (!!stream)
			{
				stream = new BX.UploaderStream(stream._id);
				this.streams.setItem(stream.id, stream);
			}
		}
	};
	BX.Uploader.info = function()
	{
		//if (key)
		{
			return repo;
		}
	};
	return true;
}(window));