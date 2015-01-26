;(function(window){
	if (window.BX["UploaderUtils"])
		return false;
	var BX = window.BX;
	BX.UploaderLog = [];
	var statuses = { "new" : 0, ready : 1, preparing : 2, inprogress : 3, done : 4, failed : 5, stopped : 6, changed : 7, uploaded : 8};
	BX.UploaderUtils = {
		statuses : statuses,
		getId : function() { return (new Date().valueOf() + Math.round(Math.random() * 1000000)); },
		log : function(res, val){ if (window.BXDEBUG === true) { BX.UploaderLog.push(res + ': ' + val); }},
		Hash : function()
		{
			this.length = 0;
			this.items = {};
			this.order = [];

			for (var i = 0; i < arguments.length; i += 2)
				this.setItem(arguments[i], arguments[i + 1]);
		},
		scaleImage : function(arSourceSize, arSize, resizeType)
		{
			var sourceImageWidth = parseInt(arSourceSize["width"]), sourceImageHeight = parseInt(arSourceSize["height"]);
			resizeType = (!resizeType && !!arSize["type"] ? arSize["type"] : resizeType);
			arSize = (!!arSize ? arSize : {});
			arSize.width = parseInt(!!arSize.width ? arSize.width : 0);
			arSize.height = parseInt(!!arSize.height ? arSize.height : 0);

			var res = {
					bNeedCreatePicture : false,
					source : {x : 0, y : 0, width : 0, height : 0},
					destin : {x : 0, y : 0, width : 0, height : 0}
			}, width, height;

			if (!(sourceImageWidth > 0 || sourceImageHeight > 0))
			{
				BX.DoNothing();
			}
			else
			{
				resizeType = (sourceImageWidth > 0 && sourceImageHeight > 0 ? resizeType : "inscribed");
				if (resizeType == "circumscribed")
				{
					BX.DoNothing(); // TODO other scale types
				}
				else
				{
					if (resizeType == "proportional")
					{
						width = Math.max(sourceImageWidth, sourceImageHeight);
						height = Math.min(sourceImageWidth, sourceImageHeight);
					}
					else
					{
						width = sourceImageWidth;
						height = sourceImageHeight;
					}

					var ResizeCoeff = {
						width : (width > 0 ? arSize["width"] / width : 1),
						height: (height > 0 ? arSize["height"] / height : 1)},
						iResizeCoeff = Math.min(ResizeCoeff["width"], ResizeCoeff["height"]);
					iResizeCoeff = ((0 < iResizeCoeff) && (iResizeCoeff < 1) ? iResizeCoeff : 1);
					res.bNeedCreatePicture = (iResizeCoeff != 1);
					res.coeff = iResizeCoeff;
					res.destin["width"] = Math.max(1, parseInt(iResizeCoeff * sourceImageWidth));
					res.destin["height"] = Math.max(1, parseInt(iResizeCoeff * sourceImageHeight));

					res.source["x"] = 0;
					res.source["y"] = 0;
					res.source["width"] = sourceImageWidth;
					res.source["height"] = sourceImageHeight;
				}
			}
			return res;
		},
		dataURLToBlob : function(dataURL)
		{
			var marker = ';base64,', parts, contentType, raw, rawLength;
			if(dataURL.indexOf(marker) == -1) {
				parts = dataURL.split(',');
				contentType = parts[0].split(':')[1];
				raw = parts[1];
				return new Blob([raw], {type: contentType});
			}

			parts = dataURL.split(marker);
			contentType = parts[0].split(':')[1];
			raw = window.atob(parts[1]);
			rawLength = raw.length;

			var uInt8Array = new Uint8Array(rawLength);

			for(var i = 0; i < rawLength; ++i) {
				uInt8Array[i] = raw.charCodeAt(i);
			}

			return new Blob([uInt8Array], {type: contentType});
		},
		sizeof : function(obj) {
			var size = 0, key;
			for (key in obj) {
				if (obj.hasOwnProperty(key))
				{
					size += key.length;
					if (typeof obj[key] == "object")
					{
						if (obj[key] === null)
							BX.DoNothing();
						else if (obj[key]["size"] > 0)
							size += obj[key].size;
						else
							size += BX.UploaderUtils.sizeof(obj[key]);
					}
					else if (typeof obj[key] == "number")
					{
						size += obj[key].toString().length;
					}
					else if (!!obj[key] && obj[key].length > 0)
					{
						size += obj[key].length;
					}
				}
			}
			return size;
		},
		FormToArray : function(form, data)
		{
			return BX.ajax.prepareForm(form, data);
		},
		getFormattedSize : function (size, precision)
		{
			var a = ["b", "Kb", "Mb", "Gb", "Tb"], pos = 0;
			while(size >= 1024 && pos < 4)
			{
				size /= 1024;
				pos++;
			}
			return (Math.round(size * (precision > 0 ? precision * 10 : 1) ) / (precision > 0 ? precision * 10 : 1)) +
				" " + BX.message("FILE_SIZE_" + a[pos]);
		},
		bindEvents : function(obj, event, func)
		{
			var funcs = [], ii;
			if (typeof func == "string")
			{
				eval('funcs.push(' + func + ');');
			}
			else if (!!func["length"] && func["length"] > 0)
			{
				for(ii = 0; ii < func.length; ii++)
				{
					if (typeof func[ii] == "string")
						eval('funcs.push(' + func[ii] + ');');
					else
						funcs.push(func[ii]);
				}
			}
			else
				funcs.push(func);
			if (funcs.length > 0)
			{
				for (ii = 0; ii < funcs.length; ii++)
				{
					BX.addCustomEvent(obj, event, funcs[ii]);
				}
			}

		},
		applyFilePart : function(file, blob)
		{
			if (BX.type.isDomNode(file))
			{
				file.uploadStatus = statuses.done;
			}
			else if (file == blob)
			{
				file.uploadStatus = statuses.done;
			}
			else if (file.blobed === true)
			{
				file.uploadStatus = ((file.package + 1) >= file.packages ? statuses.done : statuses.inprogress);
				if (file.uploadStatus == statuses.inprogress)
					file.package++;
			}
			return true;
		},
		getFilePart : function(file, firstChunk, MaxFilesize)
		{
			var blob, chunkSize = MaxFilesize, start, end, chunk = null;
			if (BX.type.isDomNode(file))
			{
				file.uploadStatus = statuses.done;
				blob = file;
			}
			else if (!(MaxFilesize > 0 && file.size > MaxFilesize))
			{
				file.uploadStatus = statuses.done;
				blob = file;
			}
			else if (window.Blob || window.MozBlobBuilder || window.WebKitBlobBuilder || window.BlobBuilder)
			{
				file.blobed = true;
				if (file.uploadStatus == statuses.inprogress)
				{
					start = file.firstChunk + (file.package - 1) * chunkSize;
					end = start + chunkSize;
				}
				else
				{
					firstChunk = (0 < firstChunk && firstChunk < chunkSize ? firstChunk : chunkSize);
					file.firstChunk = firstChunk;
					file.packages = 1 + Math.ceil((file.size-file.firstChunk) / chunkSize);
					file.package = 0;
					start = 0;
					end = file.firstChunk;
				}

				if('mozSlice' in file)
					blob = file.mozSlice(start, end);
				else if ('webkitSlice' in file)
					blob = file.webkitSlice(start, end);
				else if ('slice' in file)
					blob = file.slice(start, end);
				else
					blob = file.Slice(start, end, file.type);

				for (var ii in file)
				{
					if (file.hasOwnProperty(ii))
					{
						blob[ii] = file[ii];
					}
				}
				blob["name"] = file["name"];
			}
			return blob;
		},
		makeAnArray : function(file, data)
		{
			file = (!!file ? file : {files : [], props : {}});
			var ii;
			for (var jj in data)
			{
				if (data.hasOwnProperty(jj))
				{
					if (typeof data[jj] == "object" && data[jj].length > 0)
					{
						file[jj] = (!!file[jj] ? file[jj] : []);
						for (ii=0; ii<data[jj].length; ii++)
						{
							file[jj].push(data[jj][ii]);
						}
					}
					else
					{

						for (ii in data[jj])
						{
							if (data[jj].hasOwnProperty(ii))
							{
								file[jj] = (!!file[jj] ? file[jj] : {});
								file[jj][ii] = data[jj][ii];
							}
						}
					}
				}
			}
			return file;
		}
	};
	BX.UploaderUtils.Hash.prototype = {
		getQueue : function(id)
		{
			return BX.util.array_search(id, this.order);
		},
		removeItem : function(in_key)
		{
			var tmp_value, number;
			if (typeof(this.items[in_key]) != 'undefined') {
				tmp_value = this.items[in_key];
				number = this.getQueue(in_key);
				this.pointer -= (this.pointer >= number ? 1 : 0);
				delete this.items[in_key];
				this.order = BX.util.deleteFromArray(this.order, number);
				this.length = this.order.length;

			}
			return tmp_value;
		},

		getItem : function(in_key) {
			return this.items[in_key];
		},

		unshiftItem : function(in_key, in_value)
		{
			if (typeof(in_value) != 'undefined')
			{
				if (typeof(this.items[in_key]) == 'undefined')
				{
					this.order.unshift(in_key);
					this.length = this.order.length;
				}
				this.items[in_key] = in_value;
			}
			return in_value;
		},
		setItem : function(in_key, in_value)
		{
			if (typeof(in_value) != 'undefined')
			{
				if (typeof(this.items[in_key]) == 'undefined')
				{
					this.order.push(in_key);
					this.length = this.order.length;
				}
				this.items[in_key] = in_value;
			}
			return in_value;
		},

		hasItem : function(in_key)
		{
			return typeof(this.items[in_key]) != 'undefined';
		},
		insertBeforeItem : function(in_key, in_value, after_key)
		{
			if (typeof(in_value) != 'undefined')
			{
				if (typeof(this.items[in_key]) == 'undefined')
				{
					this.order.splice(this.getQueue(after_key), 0, in_key);
					this.length = this.order.length;
				}
				this.items[in_key] = in_value;
			}
			return in_value;
		},
		getFirst : function()
		{
			var in_key, item = null;
			for (var ii = 0; ii < this.order.length; ii++)
			{
				in_key = this.order[ii];
				if (!!in_key && this.hasItem(in_key))
				{
					item = this.getItem(in_key);
					break;
				}
			}
			return item;
		},
		getNext : function()
		{
			this.pointer = (0 <= this.pointer && this.pointer < this.order.length ? this.pointer : -1);
			var res = this.getItem(this.order[this.pointer + 1]);
			if (!!res)
				this.pointer++;
			else
				this.pointer = -1;
			return res;
		},
		getPrev : function()
		{
			this.pointer = (0 <= this.pointer && this.pointer < this.order.length ? this.pointer : 0);
			var res = this.getItem(this.order[this.pointer - 1]);
			if (!!res)
				this.pointer--;
			return res;
		},
		reset : function()
		{
			this.pointer = -1;
		},
		setPointer : function(in_key)
		{
			this.pointer = this.getQueue(in_key);
			return this.pointer;
		},
		getLast : function()
		{
			var in_key, item = null;
			for (var ii = this.order.length; ii >=0; ii--)
			{
				in_key = this.order[ii];
				if (!!in_key && this.hasItem(in_key))
				{
					item = this.getItem(in_key);
					break;
				}
			}
			return item;
		}
	};

}(window));