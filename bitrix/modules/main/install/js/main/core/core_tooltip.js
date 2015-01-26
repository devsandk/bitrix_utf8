(function(window) {
if (BX.tooltip) return;

var arTooltipIndex = {},
	bDisable = false;

BX.tooltip = function(user_id, anchor_name, loader, rootClassName, bForceUseLoader)
{
	if (BX.message('TOOLTIP_ENABLED') != "Y")
		return;

	if(BX.browser.IsAndroid() || BX.browser.IsIOS())
	{
		return;
	}

	BX.ready(function() {
		var anchor = BX(anchor_name);
		if (null == anchor)
			return;

		var tooltipId = user_id;
		if(bForceUseLoader && BX.type.isNotEmptyString(loader))
		{
			// prepare tooltip ID from custom loader
			var loaderHash = 0;
			for(var i = 0, len = loader.length; i < len; i++)
			{
				loaderHash = (31 * loaderHash + loader.charCodeAt(i)) << 0;
			}

			tooltipId = loaderHash + user_id;
		}

		if (null == arTooltipIndex[tooltipId])
			arTooltipIndex[tooltipId] = new BX.CTooltip(user_id, anchor, loader, rootClassName, bForceUseLoader);
		else
		{
			arTooltipIndex[tooltipId].ANCHOR = anchor;
			arTooltipIndex[tooltipId].rootClassName = rootClassName;
			arTooltipIndex[tooltipId].LOADER = (bForceUseLoader && BX.type.isNotEmptyString(loader)) ? loader : '/bitrix/tools/tooltip.php';
			arTooltipIndex[tooltipId].Create();
		}
	});
};

BX.tooltip.disable = function(){ bDisable = true; };
BX.tooltip.enable = function(){ bDisable = false; };

BX.CTooltip = function(user_id, anchor, loader, rootClassName, bForceUseLoader)
{
	this.LOADER = (bForceUseLoader && BX.type.isNotEmptyString(loader)) ? loader : '/bitrix/tools/tooltip.php';
	this.USER_ID = user_id;
	this.ANCHOR = anchor;
	this.rootClassName = '';

	if (
		rootClassName != 'undefined'
		&& rootClassName != null
		&& rootClassName.length > 0
	)
		this.rootClassName = rootClassName;

	var old = document.getElementById('user_info_' + this.USER_ID);
	if (null != old)
	{
		if (null != old.parentNode)
			old.parentNode.removeChild(old);

		old = null;
	}

	var _this = this;

	this.INFO = null;

	this.width = 393;
	this.height = 302;

	this.CoordsLeft = 0;
	this.CoordsTop = 0;
	this.AnchorRight = 0;
	this.AnchorBottom = 0;

	this.DIV = null;
	this.ROOT_DIV = null;

	if (BX.browser.IsIE())
		this.IFRAME = null;

	this.v_delta = 0;
	this.classNameAnim = false;
	this.classNameFixed = false;

	this.left = 0;
	this.top = 0;

	this.tracking = false;
	this.active = false;
	this.showed = false;

	this.Create = function()
	{
		_this.ANCHOR.onmouseover = function() {
			if (!bDisable)
			{
				_this.StartTrackMouse(this);
			}
		};

		_this.ANCHOR.onmouseout = function() {
			_this.StopTrackMouse(this);
		}
	};

	this.Create();

	this.TrackMouse = function(e)
	{
		if(!_this.tracking)
			return;

		var current;
		if(e && e.pageX)
			current = {x: e.pageX, y: e.pageY};
		else
			current = {x: e.clientX + document.body.scrollLeft, y: e.clientY + document.body.scrollTop};

		if(current.x < 0)
			current.x = 0;
		if(current.y < 0)
			current.y = 0;

		current.time = _this.tracking;

		if(!_this.active)
			_this.active = current;
		else
		{
			if(
				_this.active.x >= (current.x - 1) && _this.active.x <= (current.x + 1)
				&& _this.active.y >= (current.y - 1) && _this.active.y <= (current.y + 1)
			)
			{
				if((_this.active.time + 20/*2sec*/) <= current.time)
					_this.ShowTooltip();
			}
			else
				_this.active = current;
		}
	};

	this.ShowTooltip = function()
	{
		var old = document.getElementById('user_info_' + _this.USER_ID);
		if(bDisable || old && old.style.display == 'block')
			return;

		var bIE = (BX.browser.IsIE() && !BX.browser.IsIE10());

		if (null == _this.DIV && null == _this.ROOT_DIV)
		{
			_this.ROOT_DIV = document.body.appendChild(document.createElement('DIV'));
			_this.ROOT_DIV.style.position = 'absolute';

			_this.DIV = _this.ROOT_DIV.appendChild(document.createElement('DIV'));
			if (bIE)
				_this.DIV.className = 'bx-user-info-shadow-ie';
			else
				_this.DIV.className = 'bx-user-info-shadow';

			_this.DIV.style.width = _this.width + 'px';
			_this.DIV.style.height = _this.height + 'px';
		}

		var left = _this.CoordsLeft;
		var top = _this.CoordsTop + 30;
		var arScroll = jsUtils.GetWindowScrollPos();
		var body = document.body;

		var h_mirror = false;
		var v_mirror = false;

		if((body.clientWidth + arScroll.scrollLeft) < (left + _this.width))
		{
			left = _this.AnchorRight - _this.width;
			h_mirror = true;
		}

		if((top - arScroll.scrollTop) < 0)
		{
			top = _this.AnchorBottom - 5;
			v_mirror = true;
			_this.v_delta = 40;
		}
		else
			_this.v_delta = 0;

		_this.ROOT_DIV.style.left = parseInt(left) + "px";
		_this.ROOT_DIV.style.top = parseInt(top) + "px";
		_this.ROOT_DIV.style.zIndex = 1200;

		BX.bind(BX(_this.ROOT_DIV), "click", BX.eventCancelBubble);

		if (
			this.rootClassName != 'undefined'
			&& this.rootClassName != null
			&& this.rootClassName.length > 0
		)
			_this.ROOT_DIV.className = this.rootClassName;

		if ('' == _this.DIV.innerHTML)
		{
			var url;
			if (_this.LOADER.indexOf('?') >= 0)
			{
				url = _this.LOADER + '&MUL_MODE=INFO&USER_ID=' + _this.USER_ID + '&site=' + (BX.message('SITE_ID') || '');
			}
			else
			{
				url = _this.LOADER + '?MUL_MODE=INFO&USER_ID=' + _this.USER_ID + '&site=' + (BX.message('SITE_ID') || '');
			}

			BX.ajax.get(url, _this.InsertData);
			_this.DIV.id = 'user_info_' + _this.USER_ID;

			_this.DIV.innerHTML = '<div class="bx-user-info-wrap">'
				+ '<div class="bx-user-info-leftcolumn">'
					+ '<div class="bx-user-photo" id="user-info-photo-' + _this.USER_ID + '"><div class="bx-user-info-data-loading">' + BX.message('JS_CORE_LOADING') + '</div></div>'
					+ '<div class="bx-user-tb-control bx-user-tb-control-left" id="user-info-toolbar-' + _this.USER_ID + '"></div>'
				+ '</div>'
				+ '<div class="bx-user-info-data">'
					+ '<div id="user-info-data-card-' + _this.USER_ID + '"></div>'
					+ '<div class="bx-user-info-data-tools">'
						+ '<div class="bx-user-tb-control bx-user-tb-control-right" id="user-info-toolbar2-' + _this.USER_ID + '"></div>'
						+ '<div class="bx-user-info-data-clear"></div>'
					+ '</div>'
				+ '</div>'
				+ '</div><div class="bx-user-info-bottomarea"></div>';
		}

		if (bIE)
		{
			_this.DIV.className = 'bx-user-info-shadow-ie';
			_this.classNameAnim = 'bx-user-info-shadow-anim-ie';
			_this.classNameFixed = 'bx-user-info-shadow-ie';
		}
		else
		{
			_this.DIV.className = 'bx-user-info-shadow';
			_this.classNameAnim = 'bx-user-info-shadow-anim';
			_this.classNameFixed = 'bx-user-info-shadow';
		}

		_this.filterFixed = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='/bitrix/components/bitrix/main.user.link/templates/.default/images/cloud-left-top.png', sizingMethod = 'crop' );";

		if (h_mirror && v_mirror)
		{
			if (BX.browser.IsIE6())
			{
				_this.DIV.className = 'bx-user-info-shadow-hv-ie6';
				_this.classNameAnim = 'bx-user-info-shadow-hv-anim-ie6';
				_this.classNameFixed = 'bx-user-info-shadow-hv-ie6';
			}
			else if (bIE)
			{
				_this.DIV.className = 'bx-user-info-shadow-hv-ie';
				_this.classNameAnim = 'bx-user-info-shadow-hv-anim-ie';
				_this.classNameFixed = 'bx-user-info-shadow-hv-ie';
			}
			else
			{
				_this.DIV.className = 'bx-user-info-shadow-hv';
				_this.classNameAnim = 'bx-user-info-shadow-hv-anim';
				_this.classNameFixed = 'bx-user-info-shadow-hv';
			}

			_this.filterFixed = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='/bitrix/components/bitrix/main.user.link/templates/.default/images/cloud-right-bottom.png', sizingMethod = 'crop' );";
		}
		else
		{
			if (h_mirror)
			{
				if (bIE)
				{
					_this.DIV.className = 'bx-user-info-shadow-h-ie';
					_this.classNameAnim = 'bx-user-info-shadow-h-anim-ie';
					_this.classNameFixed = 'bx-user-info-shadow-h-ie';
				}
				else
				{
					_this.DIV.className = 'bx-user-info-shadow-h';
					_this.classNameAnim = 'bx-user-info-shadow-h-anim';
					_this.classNameFixed = 'bx-user-info-shadow-h';
				}

				_this.filterFixed = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='/bitrix/components/bitrix/main.user.link/templates/.default/images/cloud-right-top.png', sizingMethod = 'crop' );";
			}

			if (v_mirror)
			{
				if (BX.browser.IsIE6())
				{
					_this.DIV.className = 'bx-user-info-shadow-v-ie6';
					_this.classNameAnim = 'bx-user-info-shadow-v-anim-ie6';
					_this.classNameFixed = 'bx-user-info-shadow-v-ie6';
				}
				else if (bIE)
				{
					_this.DIV.className = 'bx-user-info-shadow-v-ie';
					_this.classNameAnim = 'bx-user-info-shadow-v-anim-ie';
					_this.classNameFixed = 'bx-user-info-shadow-v-ie';
				}
				else
				{
					_this.DIV.className = 'bx-user-info-shadow-v';
					_this.classNameAnim = 'bx-user-info-shadow-v-anim';
					_this.classNameFixed = 'bx-user-info-shadow-v';
				}

				_this.filterFixed = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='/bitrix/components/bitrix/main.user.link/templates/.default/images/cloud-left-bottom.png', sizingMethod = 'crop' );";
			}
		}


		if (BX.browser.IsIE() && null == _this.IFRAME)
		{
			_this.IFRAME = document.body.appendChild(document.createElement('IFRAME'));
			_this.IFRAME.id = _this.DIV.id + "_frame";
			_this.IFRAME.style.position = 'absolute';
			_this.IFRAME.style.width = (_this.width - 60) + 'px';
			_this.IFRAME.style.height = (_this.height - 100) + 'px';
			_this.IFRAME.style.borderStyle = 'solid';
			_this.IFRAME.style.borderWidth = '0px';
			_this.IFRAME.style.zIndex = 550;
			_this.IFRAME.style.display = 'none';
		}
		if (BX.browser.IsIE())
		{
			_this.IFRAME.style.left = (parseInt(left) + 25) + "px";
			_this.IFRAME.style.top = (parseInt(top) + 30 + _this.v_delta) + "px";
		}

		_this.DIV.style.display = 'none';
		_this.ShowOpacityEffect({func: _this.SetVisible, obj: _this.DIV, arParams: []}, 0);

		document.getElementById('user_info_' + _this.USER_ID).onmouseover = function() {
			_this.StartTrackMouse(this);
		};

		document.getElementById('user_info_' + _this.USER_ID).onmouseout = function() {
			_this.StopTrackMouse(this);
		}
	};

	this.InsertData = function(data)
	{
		if (null != data && data.length > 0)
		{
			eval('_this.INFO = ' + data);

			var cardEl = document.getElementById('user-info-data-card-' + _this.USER_ID);
			cardEl.innerHTML = _this.INFO.RESULT.Card;

			var photoEl = document.getElementById('user-info-photo-' + _this.USER_ID);
			photoEl.innerHTML = _this.INFO.RESULT.Photo;

			var toolbarEl = document.getElementById('user-info-toolbar-' + _this.USER_ID);
			toolbarEl.innerHTML = _this.INFO.RESULT.Toolbar;

			var toolbar2El = document.getElementById('user-info-toolbar2-' + _this.USER_ID);
			toolbar2El.innerHTML = _this.INFO.RESULT.Toolbar2;
		}
	}

};
BX.CTooltip.prototype.StartTrackMouse = function(ob)
{
	var _this = this;

	if(!this.tracking)
	{
		var elCoords = jsUtils.GetRealPos(ob);
		this.CoordsLeft = elCoords.left + 0;
		this.CoordsTop = elCoords.top - 325;
		this.AnchorRight = elCoords.right;
		this.AnchorBottom = elCoords.bottom;

		this.tracking = 1;
		jsUtils.addEvent(document, "mousemove", _this.TrackMouse);
		setTimeout(function() {_this.tickTimer()}, 500);
	}
};

BX.CTooltip.prototype.StopTrackMouse = function()
{
	var _this = this;
	if(this.tracking)
	{
		jsUtils.removeEvent(document, "mousemove", _this.TrackMouse);
		this.active = false;
		setTimeout(function() {_this.HideTooltip()}, 500);
		this.tracking = false;
	}
};

BX.CTooltip.prototype.tickTimer = function()
{
	var _this = this;

	if(this.tracking)
	{
		this.tracking++;
		if(this.active)
		{
			if( (this.active.time + 5/*0.5sec*/)  <= this.tracking)
				this.ShowTooltip();
		}
		setTimeout(function() {_this.tickTimer()}, 100);
	}
};

BX.CTooltip.prototype.HideTooltip = function()
{
	if(!this.tracking)
		this.ShowOpacityEffect({func: this.SetInVisible, obj: this.DIV, arParams: []}, 1);
};

BX.CTooltip.prototype.ShowOpacityEffect = function(oCallback, bFade)
{
	var steps = 3;
	var period = 1;
	var delta = 1 / steps;
	var i = 0, op, _this = this;

	if(BX.browser.IsIE() && _this.DIV)
		_this.DIV.className = _this.classNameAnim;

	var show = function()
	{
		i++;
		if (i > steps)
		{
			clearInterval(intId);
			if (!oCallback.arParams)
				oCallback.arParams = [];
			if (oCallback.func && oCallback.obj)
				oCallback.func.apply(oCallback.obj, oCallback.arParams);
			return;
		}
		op = bFade ? 1 - i * delta : i * delta;

		if (_this.DIV != null)
		{
			try{
				_this.DIV.style.filter = 'progid:DXImageTransform.Microsoft.Alpha(opacity=' + (op * 100) + ')';
				_this.DIV.style.opacity = op;
				_this.DIV.style.MozOpacity = op;
				_this.DIV.style.KhtmlOpacity = op;
			}
			catch(e){
			}
			finally{
				if (!bFade && i == 1)
					_this.DIV.style.display = 'block';

				if (bFade && i == steps && _this.DIV)
					_this.DIV.style.display = 'none';


				if (jsUtils.IsIE() && i == 1 && bFade && _this.IFRAME)
					_this.IFRAME.style.display = 'none';


				if (jsUtils.IsIE() && i == steps && _this.DIV)
				{
					if (!bFade)
						_this.IFRAME.style.display = 'block';

					_this.DIV.style.filter = _this.filterFixed;
					_this.DIV.className = _this.classNameFixed;
					_this.DIV.innerHTML = ''+_this.DIV.innerHTML;
				}
			}
		}

	};
	var intId = setInterval(show, period);

}

})(window);