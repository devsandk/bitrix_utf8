/**
 * Bitrix Component Param Manager
 * Date: 26.11.13
 * Time: 4:23
 *
 * ParamsManager
 */

;(function() {
	function ParamsManager(config)
	{
		this.config = config;
		this.id = this.config.id;
		this.searchIndex = [];
		this._searchResult = [];
		this._searchResultSect = [];
		this._searchResultLabel = [];
		this.paramsCache = {};

		this.Init();
	}

	ParamsManager.prototype = {
		Init: function()
		{
			var _this = this;
			window.__bxResult = window.__bxResult || {};
			this.params = {};

			BX.addCustomEvent(this, 'OnComponentParamsDisplay', function(params)
			{
				_this.params = params;
				_this.GetComponentParams(params);
			});

			BX.addCustomEvent(this, 'OnComponentParamsResize', function(width, height)
			{
				_this.Resize(width, height);
				//_this.params = params;
				//_this.GetComponentParams(params);
			});
		},

		/*
		* params = {
		*	siteTemplate - site template id
		*	name - name of the component
		*	template - template of the component ('' by default)
		*	currentValues - array of current values
		*	callback - callback function to display parameters
		*}
		* */
		GetComponentParams: function(params)
		{
			var
				_this = this,
				data = this.GetCachedParams(params);

			if (data)
			{
				callback(data);
			}
			else
			{
				var
					url = this.config.requestUrl,
					reqId = Math.round(Math.random() * 1000000),
					postData = {
						component_params_manager: reqId,
						sessid: BX.bitrix_sessid(),
						site_template: params.siteTemplate || '',
						component_name: params.name,
						component_template: params.template,
						current_values: params.currentValues
					};

				window.__bxResult[reqId] = null;
				BX.ajax.post(url, postData, function(){setTimeout(function()
					{
						callback(window.__bxResult[reqId]);
						_this.SetCachedParams(params, window.__bxResult[reqId]);
					}, 100);});
			}

			function callback(data)
			{
				var cnt = _this.BuildComponentParams(data, params);
				if (params.callback && typeof params.callback == 'function')
				{
					params.callback({}, cnt);
				}
			}
		},

		LoadComponentParams: function(params)
		{
			var data = this.GetCachedParams(params);
			if (data)
			{
				if (params.callback && typeof params.callback == 'function')
				{
					params.callback();
				}
			}
			else
			{
				var
					_this = this,
					url = this.config.requestUrl,
					reqId = Math.round(Math.random() * 1000000),
					postData = {
						component_params_manager: reqId,
						sessid: BX.bitrix_sessid(),
						site_template: params.siteTemplate || '',
						component_name: params.name,
						component_template: params.template,
						current_values: params.currentValues
					};

				window.__bxResult[reqId] = null;
				BX.ajax.post(url, postData, function(){
					setTimeout(function()
					{
						_this.SetCachedParams(params, window.__bxResult[reqId]);
					}, 10);}
				);
			}
		},

		GetCachedParams: function(data)
		{
			if (this.IsEmpty(data.currentValues) && this.paramsCache[data.name] && this.paramsCache[data.name][this.GetCacheId(data)])
			{
				return this.paramsCache[data.name][this.GetCacheId(data)];
			}
			else
			{
				return false;
			}
		},

		SetCachedParams: function(data, params)
		{
			if (!this.paramsCache[data.name])
			{
				this.paramsCache[data.name] = {};
			}

			if (this.IsEmpty(data.currentValues))
			{
				this.paramsCache[data.name][this.GetCacheId(data)] = params;
			}
		},

		GetCacheId: function(data)
		{
			return data.name + '|' + data.siteTemplate + '|' + data.template;
		},

		IsEmpty: function(ob)
		{
			for (var i in ob)
			{
				if (ob.hasOwnProperty(i))
				{
					return false;
				}
			}
			return true;
		},

		BuildComponentParams: function(data, params)
		{
			var
				container = params.container,
				_this = this,
				paramsIndex = {},
				i, group, cont, param, value, headerRow;

			this.groupIndex = {};

			this.searchIndex = [];
			BX.cleanNode(container);
			BX.addClass(container, 'bxcompprop-wrap');

			var scrollPos = BX.GetWindowScrollPos();

			this.pContainer = container;
			// Build groups
			this.pLeftSide = container.appendChild(BX.create("DIV", {props: {className: 'bxcompprop-left'}}));

			var pSearchCont = this.pLeftSide.appendChild(BX.create("DIV", {props: {className: 'bxcompprop-l-top'}}));
			this.pSearchInput = pSearchCont.appendChild(BX.create("INPUT", {props: {type: 'text', className: 'bxcompprop-search', placeholder: BX.message('CompParManSearch')}}));
			BX.bind(this.pSearchInput, 'keyup', BX.proxy(this.SearchCheck, this));

			this.pGroupsIndex = this.pLeftSide.appendChild(BX.create("DIV", {props: {className: 'bxcompprop-items-block'}}));

			BX.bind(this.pGroupsIndex, 'click', BX.proxy(this.GoToGroup, this));
			this.pParamsCont = container.appendChild(BX.create("DIV", {props: {className: 'bxcompprop-right'}}));

			// Display title
			var pTitleCont = this.pParamsCont.appendChild(BX.create("DIV", {props: {className: 'bxcompprop-title'}}));
			var pTitleWrap = pTitleCont.appendChild(BX.create("SPAN", {props: {className: 'bxcompprop-title-text'}}));
			this.pTitle = pTitleWrap.appendChild(BX.create("SPAN", {props: {className: "bxcompprop-title-text-lbl"}, text: data.description.NAME}));
			this.pHelpIcon = pTitleWrap.appendChild(BX.create("SPAN", {props: {className: 'bxcompprop-title-info-btn'}}));
			this.pHelpIcon.title = data.description.DESCRIPTION;
			this.pName = pTitleWrap.appendChild(BX.create("SPAN", {props: {className: "bxcompprop-title-description"}, text: params.name}));

			var pParamsWrap = this.pParamsCont.appendChild(BX.create("DIV", {props: {className: 'bxcompprop-content'}}));
			pParamsWrap.appendChild(BX.create("DIV", {props: {className: 'bxcompprop-nothing-found'}, text: BX.message('NoSearchResults')}));

			this.pParamsTable = pParamsWrap.appendChild(BX.create("TABLE", {props: {className: 'bxcompprop-content-table'}}));
			this.pParamsWrap = pParamsWrap;
			BX.bind(this.pParamsWrap, 'scroll', BX.proxy(this.CheckActiveGroup, this));

			var
				pGroup,
				td, tr,
				frag;

			// Add template group to the beginning
			if (!this.groupIndex["COMPONENT_TEMPLATE"] && data.templates.length > 0)
			{
				data.groups = [{ID: "COMPONENT_TEMPLATE", NAME: BX.message('TemplateGroup'), SORT: 0}].concat(data.groups);
			}

			for (i = 0; i < data.groups.length; i++)
			{
				group = data.groups[i];

				// 1. Create label on the left side
				pGroup = BX.create("DIV", {props: {className: 'bxcompprop-item'}, attrs: {'data-bx-comp-group-id': group.ID}, html: '<span class="bxcompprop-item-alignment"></span><span class="bxcompprop-item-text">' + BX.util.htmlspecialchars(group.NAME) + '</span>'});

				this.pGroupsIndex.appendChild(pGroup);

				frag = document.createDocumentFragment();
				// 2. Create section in params container
				tr = BX.adjust(frag.appendChild(BX.create("TR")), {props: {className: 'bxcompprop-prop-tr'}});
				td = BX.adjust(tr.insertCell(-1), {props: {className: 'bxcompprop-cont-table-title', colSpan: 2}, text: group.NAME});

				this.groupIndex[group.ID] = {
					group: group,
					frag: frag,
					leftIndex: pGroup,
					titleCell: td,
					titleRow: tr,
					empty: group.ID != 'COMPONENT_TEMPLATE'
				};

				if (i === 0)
				{
					this.SetActiveGroup(group.ID);
				}
			}

			// Display template
			if (data.templates.length > 0)
			{
				this.DisplayTemplateSelector(data.templates, params.template);
			}

			var k, str, arSut, arVa;
			//Handling SEF_URL_TEMPLATES
			if (params.currentValues["SEF_URL_TEMPLATES"])
			{
				str = params.currentValues["SEF_URL_TEMPLATES"];
				arSut = this.GetArray((str.substr(0,8).toLowerCase() == "={array(") ? str.substr(2, str.length - 3) : str);

				for (k in arSut)
				{
					if (arSut.hasOwnProperty(k))
					{
						params.currentValues["SEF_URL_TEMPLATES_" + k] = arSut[k];
					}
				}
				delete params.currentValues["SEF_URL_TEMPLATES"];
			}

			if (params.currentValues["VARIABLE_ALIASES"] && params.currentValues["SEF_MODE"] == "N")
			{
				str = params.currentValues["VARIABLE_ALIASES"];
				arVa = this.GetArray((str.substr(0, 8).toLowerCase() == "={array(") ? str.substr(2, str.length - 3) : str);

				for (k in arVa)
				{
					if (arVa.hasOwnProperty(k))
					{
						params.currentValues["VARIABLE_ALIASES_" + k] = arVa[k];
					}
				}
				delete params.currentValues["VARIABLE_ALIASES"];
			}

			// 3. Display properties
			for (i = 0; i < data.parameters.length; i++)
			{
				param = data.parameters[i];
				value = params.currentValues[param.ID];

				paramsIndex[param.ID] = {
					param: param,
					value: value
				};
			}
			this.paramsIndex = paramsIndex;

			// 3. Display properties
			for (i = 0; i < data.parameters.length; i++)
			{
				param = data.parameters[i];
				value = params.currentValues[param.ID];

				param.TOOLTIP = data.tooltips[param.ID + '_TIP'] || '';

				if (!this.groupIndex[param.PARENT])
				{
					if (this.groupIndex['ADDITIONAL_SETTINGS'])
					{
						param.PARENT = 'ADDITIONAL_SETTINGS';
					}
					else if (this.groupIndex['BASE'])
					{
						param.PARENT = 'BASE';
					}
				}

				if (this.BuildComponentParameter(param, value, this.groupIndex[param.PARENT].frag))
				{
					this.groupIndex[param.PARENT].empty = false;
				}
			}

			for (i = 0; i < data.groups.length; i++)
			{
				group = data.groups[i];
				if (this.groupIndex[group.ID].empty)
				{
					this.groupIndex[group.ID].leftIndex.style.display = 'none';
					this.groupIndex[group.ID].titleRow.style.display = 'none';
				}
				else
				{
					this.pParamsTable.appendChild(this.groupIndex[group.ID].frag);
					this.lastTitle = this.groupIndex[group.ID].titleCell;
				}
			}

			this.lastCell = BX.adjust(this.pParamsTable.appendChild(BX.create("TR")).insertCell(-1), {props: {className: 'bxcompprop-last-empty-cell'}, attrs: {colSpan: 2}});

			window.scrollTo(scrollPos.scrollLeft, scrollPos.scrollTop);
			// Restore scroll top
			setTimeout(
				function()
				{
					window.scrollTo(scrollPos.scrollLeft, scrollPos.scrollTop);
					if (_this.savedScrollTop)
					{
						_this.pParamsWrap.scrollTop = _this.savedScrollTop;
						_this.savedScrollTop = 0;
					}
				}, 50
			);

			return container;
		},

		GoToGroup: function(e)
		{
			var
				target = e.target || e.srcElement,
				groupId = (target && target.getAttribute) ? target.getAttribute('data-bx-comp-group-id') : null;

			if (!groupId)
			{
				target = BX.findParent(target, function(node)
				{
					return node.getAttribute && node.getAttribute('data-bx-comp-group-id');
				}, this.pGroupsIndex);
				groupId = (target && target.getAttribute) ? target.getAttribute('data-bx-comp-group-id') : null;
			}

			if (groupId)
			{
				this.pParamsWrap.scrollTop = this.groupIndex[groupId].titleCell.offsetTop;
				this.CheckActiveGroup(groupId);
			}
		},

		CheckActiveGroup: function(groupId)
		{
			if (groupId && this.groupIndex.hasOwnProperty(groupId))
			{
				this.SetActiveGroup(groupId);
			}
			else
			{
				var groupOffset, id, scrollTop = this.pParamsWrap.scrollTop;
				for (id in this.groupIndex)
				{
					if (this.groupIndex.hasOwnProperty(id) && !this.groupIndex[id].empty)
					{
						groupOffset = this.groupIndex[id].titleCell.offsetTop;
						if (scrollTop >= groupOffset - 10)
						{
							this.SetActiveGroup(id);
						}
					}
				}
			}
		},

		SetActiveGroup: function(groupId)
		{
			if (this.activeGroupId && this.groupIndex[this.activeGroupId])
			{
				BX.removeClass(this.groupIndex[this.activeGroupId].leftIndex, 'bxcompprop-item-active');
			}

			this.activeGroupId = groupId;
			BX.addClass(this.groupIndex[groupId].leftIndex, 'bxcompprop-item-active');

			var
				deltaTop = this.groupIndex[groupId].leftIndex.offsetHeight + 10,
				wrapScrollTop = this.pGroupsIndex.scrollTop,
				wrapHeight = this.pGroupsIndex.offsetHeight,
				titleTop = this.groupIndex[groupId].leftIndex.offsetTop ;

			if (wrapScrollTop + wrapHeight < titleTop + deltaTop)
			{
				this.pGroupsIndex.scrollTop = titleTop + deltaTop - wrapHeight;
			}
			else if (titleTop < wrapScrollTop)
			{
				this.pGroupsIndex.scrollTop = titleTop;
			}
		},

		CheckLastCell: function()
		{
			if (this.lastCell)
			{
				var
					wrapHeight = this.pParamsWrap.offsetHeight,
					lastGroupHeight = this.lastCell.offsetTop - this.lastTitle.offsetTop + 10;
				this.lastCell.style.height = Math.max((wrapHeight - lastGroupHeight), 0) + 'px';
			}
		},

		Resize: function(w, h)
		{
			var
				leftW = this.pLeftSide.offsetWidth,
				rightW = w - leftW - 40;

			this.pContainer.style.width = w + 'px';
			this.pContainer.style.height = h + 'px';

			this.pParamsCont.style.width = rightW + 'px';
			this.pParamsCont.style.height = (h - 12) + 'px';
			this.pParamsWrap.style.height = (h - 98) + 'px';
			this.pGroupsIndex.style.height = (h - 100) + 'px';

			this.pLeftSide.style.height = (h - 50) + 'px';

			this.CheckLastCell();
		},

		BuildComponentParameter: function(param, value, frag)
		{
			if(!param.TYPE)
			{
				param.TYPE = "STRING";
			}
			if (param.ID == "SEF_MODE")
			{
				param.TYPE = "CHECKBOX";
			}

			param.TYPE = param.TYPE.toUpperCase();
			if(!param.ROWS)
			{
				param.ROWS = 0;
			}

			param.MULTIPLE = (param.MULTIPLE && param.MULTIPLE.toUpperCase()) == "Y" ? "Y" : "N";

			var _value = value;
			if (typeof value == 'string')
			{
				if (this.IsPHPBracket(value))
				{
					value = this.TrimPHPBracket(value);
				}

				if (value.substr(0, 6).toLowerCase() == 'array(')
				{
					value = this.ConvertStringToArray(value, true);
				}
				else if (param.TYPE == "LIST")
				{
					value = [value];
				}
				else if (this.IsNum(value)) // If it's number - remove PHP brackets
				{
					value = parseFloat(value);
				}
				else
				{
					value = _value;
				}
			}

			if(param.MULTIPLE == "Y")
			{
				param.CNT = parseInt(param.CNT, 10);
				if (param.CNT < 1)
				{
					param.CNT = 1;
				}
			}

			// Hidden;
			if (param.HIDDEN && param.HIDDEN.toString().toUpperCase() == "Y")
				return false;

			// SEF
			var
				bSefMode = this.GetParamValueById("SEF_MODE");
			bSefMode = bSefMode && bSefMode.toUpperCase() == "Y";
			// If SEF = ON : show SEF_URL_TEMPLATES and SEF_FOLDER
			//  SEF = OFF: show VARIABLE_ALIASES
			if (
				((param.ID.substr(0, 17) == "SEF_URL_TEMPLATES" || param.ID == "SEF_FOLDER") && !bSefMode)
				||
				(param.ID.substr(0, 16) == "VARIABLE_ALIASES" && bSefMode)
				)
			{
				return false;
			}

			// Display
			param._propId = BX.util.htmlspecialchars(param.ID || Math.round(Math.random() * 10000)) + '_' + this.id;

			var
				tr = BX.adjust(frag.appendChild(BX.create("TR")), {props: {className: 'bxcompprop-prop-tr'}}),
				pLabelTd = BX.adjust(tr.insertCell(-1), {props: {className: 'bxcompprop-cont-table-l'}, html: '<label class="bxcompprop-label" for="' + param._propId + '">' + BX.util.htmlspecialchars(param.NAME || '') + ':</label>'}),
				paramContainer = BX.adjust(tr.insertCell(-1), {props: {className: 'bxcompprop-cont-table-r'}});

			switch(param.TYPE)
			{
				case "LIST":
					this.DisplayParamList(param, value, paramContainer);
					break;
				case "CHECKBOX":
					this.DisplayParamCheckbox(param, value, paramContainer);
					break;
				case "COLORPICKER":
					this.DisplayParamColorpicker(param, value, paramContainer);
					break;
				case "FILE":
					this.DisplayParamFile(param, value, paramContainer);
					break;
				case "CUSTOM":
					this.DisplayParamCustom(param, value, paramContainer);
					break;
				default:
					this.DisplayParamString(param, value, paramContainer);
					break;
			}

			// Tooltip
			if (param.TOOLTIP)
			{
				new BX.CHint(
				{
					hint: param.TOOLTIP,
					parent: paramContainer.appendChild(BX.create("I", {props: {className: "bxcompprop-info-btn"}}))
				});
			}

			this.searchIndex.push({
				content: param.ID.toLowerCase() + ' ' + (param.NAME || '').toLowerCase(),
				elementWrap: tr,
				label: pLabelTd.firstChild,
				name: param.NAME || '',
				groupId: param.PARENT || ''
			});

			return true;
		},

		DisplayParamList: function(param, value, container)
		{
			param.SIZE = parseInt(param.SIZE, 10);
			if (!param.SIZE)
			{
				param.SIZE = param.MULTIPLE == "Y" ? 3 : 1;
			}

			param.COLS = parseInt(param.COLS, 10) || 20;
			param.CNT = Math.max(parseInt(param.CNT), 1) || 1;

			if (value == undefined)
			{
				value = param.DEFAULT;
			}

			if(!param.VALUES)
			{
				param.VALUES = [];
			}

			param.ADDITIONAL_VALUES = (param.ADDITIONAL_VALUES && param.ADDITIONAL_VALUES.toUpperCase()) == "Y" ? "Y" : "N";

			var
				propId = param._propId,
				_this = this,
				bFound = false,
				arUsedValues = {},
				val, key, opt, i,
				name = param.ID + (param.MULTIPLE == 'Y' ? '[]' : ''),
				pSelect = BX.create("SELECT", {
					props: {size: param.SIZE, name: name, multiple: param.MULTIPLE == 'Y', id: propId},
					attrs: {'data-bx-property-id' : param.ID, 'data-bx-comp-prop' : true}
				});
			pSelect.onchange = BX.proxy(this.OnChageParams, this);

			for(key in param.VALUES)
			{
				if (param.VALUES.hasOwnProperty(key))
				{
					val = param.VALUES[key].toString();
					opt = new Option(val, key, false, false);
					pSelect.options.add(opt);

					// Only for template selectors
					if (param.ID == 'COMPONENT_TEMPLATE' &&
						(
							key == value ||
							key == '.default' && value == '' ||
							key == '' && value == '.default'
							)
						)
					{
						this.SetOptionSelected(opt, true);
						arUsedValues[key] = true;
						bFound = true;
					}
					else if (typeof value == 'object' && BX.util.in_array(key, value))
					{
						this.SetOptionSelected(opt, true);
						arUsedValues[key] = true;
						bFound = true;
					}
					else if(typeof value == 'string' && key == value)
					{
						this.SetOptionSelected(opt, true);
						arUsedValues[key] = true;
						bFound = true;
					}
				}
			}

			container.appendChild(pSelect);

			// Additional values
			if(param.ADDITIONAL_VALUES == 'Y')
			{
				opt = new Option(param.MULTIPLE == 'Y' ? BX.message('CompParManNoValue') : BX.message('CompParManSelectOther'), '', !bFound, !bFound);
				pSelect.options.add(opt, 0);

				if(param.MULTIPLE == 'Y')
				{
					// Additional values
					for(key in value)
					{
						if (!value.hasOwnProperty(key) || arUsedValues[value[key]] || value[key] == '')
						{
							continue;
						}
						container.appendChild(BX.create("BR"));
						if(param.ROWS > 1)
						{
							container.appendChild(BX.create("TEXTAREA", {
								props: {cols: param.COLS,name: name, value: value[key]},
								attrs: {'data-bx-property-id' : param.ID, 'data-bx-comp-prop' : true}
							})).onchange = BX.proxy(this.OnChageParams, this);
						}
						else
						{
							container.appendChild(BX.create("INPUT", {
								props: {size: param.COLS,name: name, value: value[key], type: 'text'},
								attrs: {'data-bx-property-id' : param.ID, 'data-bx-comp-prop' : true}
							})).onchange = BX.proxy(this.OnChageParams, this);
						}
					}

					// Empty values
					for(i = 0; i < param.CNT; i++)
					{
						container.appendChild(BX.create("BR"));
						if(param.ROWS > 1)
						{
							container.appendChild(BX.create("TEXTAREA", {
								props: {cols: param.COLS,name: name, value: ''},
								attrs: {'data-bx-property-id' : param.ID, 'data-bx-comp-prop' : true}
							})).onchange = BX.proxy(this.OnChageParams, this);
						}
						else
						{
							container.appendChild(BX.create("INPUT", {
								props: {size: param.COLS,name: name, value: '', type: 'text'},
								attrs: {'data-bx-property-id' : param.ID, 'data-bx-comp-prop' : true}
							})).onchange = BX.proxy(this.OnChageParams, this);
						}
					}

					var pAddItemInput = container.appendChild(BX.create("INPUT", {
						props: {type: 'button', value: '+'},
						attrs: {'data-bx-property-id' : param.ID},
						events: {click: function()
							{
								if(param.ROWS > 1)
								{
									container.appendChild(BX.create("TEXTAREA", {
										props: {cols: param.COLS,name: name, value: ''},
										attrs: {'data-bx-property-id' : param.ID, 'data-bx-comp-prop' : true}
									})).onchange = BX.proxy(_this.OnChageParams, _this);
								}
								else
								{
									container.appendChild(BX.create("INPUT", {
										props: {size: param.COLS,name: name, value: '', type: 'text'},
										attrs: {'data-bx-property-id' : param.ID, 'data-bx-comp-prop' : true}
									})).onchange = BX.proxy(_this.OnChageParams, _this);
								}
								// Put button to the end
								container.appendChild(pAddItemInput);
							}
						}
					}));
				}
				else
				{
					// Additional values
					var pInput;
					for(key in value)
					{
						if (!value.hasOwnProperty(key) || arUsedValues[value[key]])
						{
							continue;
						}

						container.appendChild(BX.create("BR"));
						if(param.ROWS > 1)
						{
							pInput = container.appendChild(BX.create("TEXTAREA", {
								props: {cols: param.COLS, name: name + '_alt', value: value[key], disabled: bFound},
								attrs: {'data-bx-property-id' : param.ID, 'data-bx-comp-prop' : true}
							}));
							pInput.onchange = BX.proxy(this.OnChageParams, this);
						}
						else
						{
							pInput = container.appendChild(BX.create("INPUT", {
								props: {size: param.COLS, name: name + '_alt', value: value[key], disabled: bFound, type: 'text'},
								attrs: {'data-bx-property-id' : param.ID, 'data-bx-comp-prop' : true}
							}));
							pInput.onchange = BX.proxy(this.OnChageParams, this);
						}
					}

					if (pInput)
					{
						BX.bind(pSelect, 'change', function()
						{
							pInput.disabled = pSelect.value != '';
						});
					}
				}

				if (param.REFRESH == 'Y')
				{
					container.appendChild(BX.create("INPUT", {props: {type: 'button', value: 'ok', className: 'bxcompprop-ok-btn'}, events: {click: BX.proxy(this.DoRefreshParams, this)}}));
					BX.addClass(container, 'bxcompprop-cont-table-r-refreshed');
				}
			}
		},

		DisplayParamCheckbox: function(param, value, container)
		{
			if (value != undefined)
			{
				value = value && value.toUpperCase() == 'Y' ? 'Y' : 'N';
			}
			else if(param.DEFAULT)
			{
				value = param.DEFAULT.toUpperCase() == 'Y' ? 'Y' : 'N';
			}
			else
			{
				value = 'N';
			}

			var
				propId = param._propId,
				name = param.ID + (param.MULTIPLE == 'Y' ? '[]' : ''),
				pCheckbox = BX.create("INPUT", {
					props: {type: 'checkbox', name: name, checked: value == 'Y', id: propId},
					attrs: {'data-bx-property-id' : param.ID, 'data-bx-comp-prop' : true}
				});

			pCheckbox.onchange = BX.proxy(this.OnChageParams, this);

			container.appendChild(pCheckbox);
			if (param.ID == "SEF_MODE")
			{
				param.REFRESH = 'Y';
			}
		},

		DisplayParamColorpicker: function(param, value, container)
		{
			param.COLS = parseInt(param.COLS, 10) || 20;
			if (value == undefined)
			{
				value = param.DEFAULT || '';
			}

			var
				propId = param._propId,
				_this = this,
				pInput = container.appendChild(BX.create("INPUT", {
					props: {size: param.COLS, name: param.ID, value: value, type: 'text', id: propId},
					attrs: {'data-bx-property-id' : param.ID, 'data-bx-comp-prop' : true},
					style: {minWidth: '100px'}
				}));

			pInput.onchange = BX.proxy(this.OnChageParams, this);

			// **** Customize BXColorPicker for our needs *****
			if (!this.Colorpicker)
			{
				function Colorpicker(oPar)
				{
					// Call parrent constructor
					Colorpicker.superclass.constructor.apply(this, arguments);
				}
				BX.extend(Colorpicker, BXColorPicker);
				Colorpicker.prototype.BeforeCreate = function()
				{
					if (this.oPar.input)
					{
						this.pWnd = this.oPar.input;
						BX.bind(this.oPar.input, 'click', BX.proxy(this.OnClick, this));
					}
				};
				this.Colorpicker = Colorpicker;
			}

			var oColorPicker = new this.Colorpicker({
				id: param.ID + '_colorpicker',
				input: pInput,
				OnSelect: function(color)
				{
					pInput.value = color;
					_this.OnChageParams(false, param.ID);
				}
			});
		},

		DisplayParamFile: function(param, value, container)
		{
			param.COLS = parseInt(param.COLS, 10) || 20;
			if (value == undefined)
			{
				value = param.DEFAULT || '';
			}

			var
				propId = param._propId,
				_this = this,
				pInput = container.appendChild(BX.create("INPUT", {
					props: {size: param.COLS, name: param.ID, value: value, type: 'text', id: propId},
					attrs: {'data-bx-property-id' : param.ID, 'data-bx-comp-prop' : true},
					style: {minWidth: '80%'}
				}));

			pInput.onchange = BX.proxy(this.OnChageParams, this);

			if (param.FD_USE_MEDIALIB)
			{
				// Replace id, and increase "curCount"
				var html = window['_bxMlBrowseButton_' + param.ID.toLowerCase()];

				var oML = BX.processHTML(html);
				setTimeout(function()
				{
					if (oML.SCRIPT && oML.SCRIPT.length > 0)
					{
						var sc, scriptsInt = '';
						for (var i = 0; i < oML.SCRIPT.length; i++)
						{
							sc = oML.SCRIPT[i];
							if (sc.isInternal)
							{
								scriptsInt += ';' + sc.JS;
							}
						}
						BX.evalGlobal(scriptsInt);
					}
				}, 100);

				container.appendChild(BX.create("DIV", {props: {className: 'bxcompprop-file-dialog-wrap'}, html: oML.HTML}));
				var fdInputBut = BX("bx_fd_input_" + param.ID.toLowerCase());
				if (fdInputBut)
				{
					fdInputBut.onclick = window['BX_FD_' + param.ID];
				}

				/*
				if(BX.browser.IsIE() && !this.bxAppendedCSSForML)
				{
					var
						s1 = html.indexOf('<' + 'style>'),
						s2 = html.indexOf('</' + 'style>'),
						css = html.substr(s1 + 7, s2 - s1 - 7);

					document.styleSheets[0].cssText += css;
					this.bxAppendedCSSForML = true;
				}
				*/
			}
			else
			{
				container.appendChild(BX.create("INPUT", {
					props: {type: 'button', value: '...'},
					events: {click: window['BX_FD_' + param.ID]}
				}));
			}

			// Result of selecting file
			window['BX_FD_ONRESULT_' + param.ID] = function(filename, filepath)
			{
				if (typeof filename == 'object')
				{
					pInput.value = filename.src; // From medialibrary
				}
				else
				{
					pInput.value = (filepath + "/" + filename).replace(/\/\//ig, '/');
				}
				_this.OnChageParams(false, param.ID);
			};

			if (param.REFRESH == 'Y')
			{
				container.appendChild(BX.create("INPUT", {props: {type: 'button', value: 'ok', className: 'bxcompprop-ok-btn'}, events: {click: BX.proxy(this.DoRefreshParams, this)}}));
				BX.addClass(container, 'bxcompprop-cont-table-r-refreshed');
			}
		},

		DisplayParamString: function(param, value, container)
		{
			param.COLS = parseInt(param.COLS, 10) || 20;
			param.CNT = Math.max(parseInt(param.CNT), 1) || 1;

			var
				key, i,
				_this = this,
				propId = param._propId,
				name = param.ID + (param.MULTIPLE == 'Y' ? '[]' : '');

			if (value == undefined)
			{
				value = param.DEFAULT || '';
			}

			if(param.MULTIPLE != 'Y')
			{
				if(param.ROWS > 1)
				{
					container.appendChild(BX.create("TEXTAREA", {
						props: {cols: param.COLS,name: name, value: value, id: propId},
						attrs: {'data-bx-property-id' : param.ID, 'data-bx-comp-prop' : true}
					})).onchange = BX.proxy(this.OnChageParams, this);
				}
				else
				{
					container.appendChild(BX.create("INPUT", {
						props: {size: param.COLS,name: name, value: value, type: 'text', id: propId},
						attrs: {'data-bx-property-id' : param.ID, 'data-bx-comp-prop' : true}
					})).onchange = BX.proxy(this.OnChageParams, this);
				}
			}
			else
			{
				// Additional values
				for(key in value)
				{
					if (!value.hasOwnProperty(key) || value[key] == '')
					{
						continue;
					}

					container.appendChild(BX.create("BR"));
					if(param.ROWS > 1)
					{
						container.appendChild(BX.create("TEXTAREA", {
							props: {cols: param.COLS,name: name, value: value[key]},
							attrs: {'data-bx-property-id' : param.ID, 'data-bx-comp-prop' : true}
						})).onchange = BX.proxy(this.OnChageParams, this);
					}
					else
					{
						container.appendChild(BX.create("INPUT", {
							props: {size: param.COLS,name: name, value: value[key], type: 'text'},
							attrs: {'data-bx-property-id' : param.ID, 'data-bx-comp-prop' : true}
						})).onchange = BX.proxy(this.OnChageParams, this);
					}
				}

				// Empty values
				for(i = 0; i < param.CNT; i++)
				{
					container.appendChild(BX.create("BR"));
					if(param.ROWS > 1)
					{
						container.appendChild(BX.create("TEXTAREA", {
							props: {cols: param.COLS,name: name, value: ''},
							attrs: {'data-bx-property-id' : param.ID, 'data-bx-comp-prop' : true}
						})).onchange = BX.proxy(this.OnChageParams, this);
					}
					else
					{
						container.appendChild(BX.create("INPUT", {
							props: {size: param.COLS,name: name, value: '', type: 'text'},
							attrs: {'data-bx-property-id' : param.ID, 'data-bx-comp-prop' : true}
						})).onchange = BX.proxy(this.OnChageParams, this);
					}
				}

				var pAddItemInput = container.appendChild(BX.create("INPUT", {
					props: {type: 'button', value: '+'},
					attrs: {'data-bx-property-id' : param.ID},
					events: {click: function()
					{
						if(param.ROWS > 1)
						{
							container.appendChild(BX.create("TEXTAREA", {
								props: {cols: param.COLS,name: name, value: ''},
								attrs: {'data-bx-property-id' : param.ID, 'data-bx-comp-prop' : true}
							})).onchange = BX.proxy(_this.OnChageParams, _this);
						}
						else
						{
							container.appendChild(BX.create("INPUT", {
								props: {size: param.COLS,name: name, value: '', type: 'text'},
								attrs: {'data-bx-property-id' : param.ID, 'data-bx-comp-prop' : true}
							})).onchange = BX.proxy(_this.OnChageParams, _this);
						}
						// Put button to the end
						container.appendChild(pAddItemInput);
					}}
				}));
			}

			if (param.REFRESH == 'Y')
			{
				container.appendChild(BX.create("INPUT", {props: {type: 'button', value: 'ok', className: 'bxcompprop-ok-btn'}, events: {click: BX.proxy(this.DoRefreshParams, this)}}));
				BX.addClass(container, 'bxcompprop-cont-table-r-refreshed');
			}
		},

		DisplayParamCustom: function(param, value, container)
		{
			if (!param.JS_FILE || !param.JS_EVENT)
			{
				return;
			}

			if (value == undefined)
			{
				value = param.DEFAULT || '';
			}

			var
				name = param.ID + (param.MULTIPLE == 'Y' ? '[]' : ''),
				pInput = container.appendChild(BX.create("INPUT",
					{
						props: {type: 'hidden', name: name, value: value, id: param._propId},
						attrs: {'data-bx-property-id' : param.ID, 'data-bx-comp-prop' : true}
					}));

			pInput.onchange = BX.proxy(this.OnChageParams, this);

			function getFunction(params)
			{
				return function()
				{
					if (window[params.propertyParams.JS_EVENT] && typeof window[params.propertyParams.JS_EVENT] == 'function')
					{
						window[params.propertyParams.JS_EVENT](params);
					}
				};
			}

			var oCallBack = getFunction({
				popertyID : param.ID,
				propertyParams: param,
				getElements : BX.proxy(this.GetNamedControls, this),
				oInput : pInput,
				oCont : container,
				data : param.JS_DATA || '',
				fChange: BX.proxy(this.OnChageParams, this)
			});

			BX.loadScript(param.JS_FILE, oCallBack);
		},

		DisplayTemplateSelector: function(templates, value)
		{
			var i, vals = {};
			for (i = 0; i < templates.length; i++)
			{
				vals[templates[i].NAME] = templates[i].NAME + (templates[i].NAME == '.default' ? ' (' + BX.message('DefTemplate') + ')' : '');
			}

			var
				propId = 'TEMPLATE_' + this.id,
				param = {
					ID: 'COMPONENT_TEMPLATE',
					_propId: propId,
					NAME: BX.message('TemplateGroup'),
					VALUES: vals,
					REFRESH: 'Y'
				},
				frag = this.groupIndex['COMPONENT_TEMPLATE'].frag,
				tr = BX.adjust(frag.appendChild(BX.create("TR")), {props: {className: 'bxcompprop-prop-tr'}}),
				pLabelTd = BX.adjust(tr.insertCell(-1), {props: {className: 'bxcompprop-cont-table-l'}, html: '<label class="bxcompprop-label" for="' + propId + '">' + (param.NAME || '') + ':</label>'}),
				paramContainer = BX.adjust(tr.insertCell(-1), {props: {className: 'bxcompprop-cont-table-r'}});

			this.DisplayParamList(param, value, paramContainer);

			this.searchIndex.push({
				content: 'template ' + (param.NAME || '').toLowerCase(),
				elementWrap: tr,
				label: pLabelTd.firstChild,
				name: param.NAME || '',
				groupId: param.PARENT || ''
			});
		},

		GetTemplateValue: function()
		{
			var templateInput = BX('TEMPLATE_' + this.id);
			if (templateInput)
				return templateInput.value == '.default' ? '' : templateInput.value;
			return '';
		},

		DoRefreshParams: function()
		{
			var _this = this;
			setTimeout(function()
			{
				_this.params.currentValues = _this.GetParamsValues();
				_this.params.template = _this.GetTemplateValue();
				_this.savedScrollTop = _this.pParamsWrap.scrollTop;
				_this.GetComponentParams(_this.params);
			}, 1);
		},

		SetOptionSelected: function(pOption, bSel)
		{
			setTimeout(function(){pOption.selected = bSel;}, 1);
		},

		OnChageParams: function(e, propertyId)
		{
			if (e && !propertyId)
			{
				var target = e.target || e.srcElement;
				propertyId = target.getAttribute('data-bx-property-id');
			}

			if (propertyId && this.paramsIndex[propertyId])
			{
				var ar = this.paramsIndex[propertyId];
				if (ar.param.REFRESH == 'Y')
				{
					this.DoRefreshParams();
				}
			}
		},

		GetParamsValues: function()
		{
			var
				result = this.params.currentValues || {},
				i, el, propertyId, value,
				arNewValues = {}, param, j,
				arControls = this.GetControls();

			for(i = 0; i < arControls.length; i++)
			{
				el = arControls[i];
				propertyId = el.getAttribute('data-bx-property-id');

				if (el.disabled || !this.paramsIndex[propertyId])
					continue;

				param = this.paramsIndex[propertyId].param;

				if (param.MULTIPLE == 'Y')
				{
					if (!arNewValues[param.ID])
					{
						arNewValues[param.ID] = [];
					}

					if (el.nodeName.toUpperCase() == 'SELECT' && el.multiple)
					{
						for (j in el.options)
						{
							if (el.options.hasOwnProperty(j) && el.options[j].selected)
							{
								arNewValues[param.ID].push(el.options[j].value);
							}
						}
					}
					else
					{
						arNewValues[param.ID].push(el.value);
					}
				}
				else if(param.TYPE == "CHECKBOX")
				{
					arNewValues[param.ID] = el.checked ? "Y" : "N";
				}
				else
				{
					arNewValues[param.ID] = el.value;
				}
			}

			for(propertyId in arNewValues)
			{
				if (arNewValues.hasOwnProperty(propertyId))
				{
					value = arNewValues[propertyId];
					result[propertyId] = (typeof value == 'object') ? this.WrapPHPBrackets(this.ConvertArrayToString(value)) : value;
				}
			}

			return result;
		},

		GetControls: function()
		{
			if (this.params.container)
				return BX.findChildren(this.params.container, {attr: {'data-bx-comp-prop': true}}, true);
			return [];
		},

		GetNamedControls: function()
		{
			var
				i,el, res = {}, propertyId, param,
				arControls = this.GetControls();

			for(i = 0; i < arControls.length; i++)
			{
				el = arControls[i];
				propertyId = el.getAttribute('data-bx-property-id');
				if (propertyId && this.paramsIndex[propertyId])
				{
					param = this.paramsIndex[propertyId].param;
					res[param.ID] = el;
				}
			}

			return res;
		},

		GetParamValueById: function(paramId)
		{
			var
				result = '',
				prop = this.paramsIndex[paramId];

			if (prop && prop.value)
			{
				result = prop.value;
			}
			else if (prop && prop.param && prop.param.DEFAULT != undefined)
			{
				result = prop.param.DEFAULT;
			}

			return result;
		},

		// !!!!!!!!!!!!!!!!
		IsPHPBracket: function(val)
		{
			return val.substr(0, 2) == '={';
		},

		TrimPHPBracket: function(val)
		{
			return val.substr(2, val.length - 3);
		},

		TrimQuotes: function(str, qoute)
		{
			var f_ch, l_ch;
			str = str.trim();
			if (qoute == undefined)
			{
				f_ch = str.substr(0, 1);
				l_ch = str.substr(0, 1);
				if ((f_ch == '"' && l_ch == '"') || (f_ch == '\'' && l_ch == '\''))
				{
					str = str.substring(1, str.length - 1);
				}
			}
			else
			{
				if (!qoute.length)
				{
					return str;
				}
				f_ch = str.substr(0, 1);
				l_ch = str.substr(0, 1);
				qoute = qoute.substr(0, 1);
				if (f_ch == qoute && l_ch == qoute)
				{
					str = str.substring(1, str.length - 1);
				}
			}
			return str;
		},

		WrapPHPBrackets: function(str)
		{
			str = str.trim();
			var
				f_ch = str.substr(0,1),
				l_ch = str.substr(0,1);
			if ((f_ch == '"' && l_ch == '"') || (f_ch == '\'' && l_ch == '\''))
			{
				return str;
			}

			return "={" + str + "}";
		},

		IsNum: function(val)
		{
			var _val = val;
			val = parseFloat(_val);
			if (isNaN(val))
			{
				val = parseInt(_val);
			}

			return !isNaN(val) ? (_val == val) : false;
		},

		ConvertArrayToString: function(ar)
		{
			var _ar = [];
			var str = 'array(';
			for (var k in ar)
			{
				if (ar.hasOwnProperty(k))
				{
					if (isNaN(parseInt(k)) || parseInt(k) != k)
					{
						_ar.push('"' + k + '" => "' + ar[k] + '"');
					}
					else
					{
						_ar[k] = '"' + ar[k] + '"';
					}
				}
			}
			str += _ar.join(", ");
			str += ')';
			return str;
		},

		ConvertStringToArray: function(str, bSkipEmpty)
		{
			var
				arObj = this.GetArray(str),
				bArr = true,
				resArr = [],
				res = {}, i;

			for (i in arObj)
			{
				if (arObj.hasOwnProperty(i))
				{
					if (i !== "" && typeof arObj[i] != 'function' && (arObj[i] !== '' || !bSkipEmpty))
					{
						if (i != parseInt(i)) // At least one non-numeric key...
						{
							bArr = false;
						}

						if (bArr)
						{
							resArr.push(arObj[i]);
						}
						res[i] = arObj[i];
					}
				}
			}

			return bArr ? resArr : res;
		},

		GetArray: function(_str)
		{
			var resAr = {}; //var resAr = [];
			if (_str.substr(0, 6).toLowerCase() != 'array(')
			{
				return _str;
			}
			_str = _str.substring(6, _str.length - 1);
			var
				tempAr = this.GetParams(_str),
				prop_name, prop_val;

			for (var y = 0; y < tempAr.length; y++)
			{
				if (tempAr[y].substr(0, 6).toLowerCase()=='array(')
				{
					resAr[y] = this.GetArray(tempAr[y]);
					continue;
				}

				var p = tempAr[y].indexOf("=>");

				if (p==-1)
				{
					if (tempAr[y] == this.TrimQuotes(tempAr[y]))
					{
						resAr[y] = this.WrapPHPBrackets(tempAr[y]);
					}
					else
					{
						resAr[y] = this.TrimQuotes(tempAr[y]);
					}
				}
				else
				{
					prop_name = this.TrimQuotes(tempAr[y].substr(0,p));
					prop_val = tempAr[y].substr(p+2);
					if (prop_val == this.TrimQuotes(prop_val))
					{
						prop_val = this.WrapPHPBrackets(prop_val);
					}
					else
					{
						prop_val = this.TrimQuotes(prop_val);
					}

					if (prop_val.substr(0, 6).toLowerCase()=='array(')
					{
						prop_val = this.getArray(prop_val);
					}

					resAr[prop_name] = prop_val;
				}
			}
			return resAr;
		},

		GetParams: function(params)
		{
			var
				i,
				arParams = [],
				sk = 0, ch, sl, q1 = 1,q2 = 1,
				param_tmp = "";

			for(i = 0; i < params.length; i++)
			{
				ch = params.substr(i, 1);
				if (ch == "\"" && q2 == 1 && !sl)
				{
					q1 *=-1;
				}
				else if (ch == "'" && q1 == 1  && !sl)
				{
					q2 *=-1;
				}
				else if(ch == "\\"  && !sl)
				{
					sl = true;
					param_tmp += ch;
					continue;
				}

				if (sl)
					sl = false;

				if (q2 == -1 || q1 == -1)
				{
					param_tmp += ch;
					continue;
				}

				if(ch == "(")
				{
					sk++;
				}
				else if(ch == ")")
				{
					sk--;
				}
				else if(ch == "," && sk == 0)
				{
					arParams.push(param_tmp);
					param_tmp = "";
					continue;
				}

				if(sk<0)
					break;

				param_tmp += ch;
			}
			if(param_tmp != "")
				arParams.push(param_tmp);

			return arParams;
		},

		SearchCheck: function(e)
		{
			var
				value = this.pSearchInput.value;

			if (e.keyCode == 27)
			{
				this.pSearchInput.value = '';
				BX.defer(this.ClearSearchResult, this)();
			}
			else
			{
				if (value.length < 2)
				{
					this.ClearSearchResult();
				}
				else
				{
					this.Search(value);
				}
			}
		},

		Search: function(value)
		{
			this.ClearSearchResult();
			var
				bFoundItems = false,
				_this = this,
				pSect, el, group,
				i, l = this.searchIndex.length;

			value = BX.util.trim(value.toLowerCase());

			BX.addClass(this.pGroupsIndex, 'bxcompprop-groups-search');
			BX.addClass(this.pParamsWrap, 'bxcompprop-params-search');
			for(i = 0; i < l; i++)
			{
				el = this.searchIndex[i];
				if (el.content.indexOf(value) !== -1) // Show element
				{
					bFoundItems = true;

					BX.addClass(el.elementWrap, 'bxcompprop-tr-search-res');
					this._searchResult.push(el.elementWrap);
					if (el.name && el.name.toLowerCase().indexOf(value.toLowerCase()) !== -1 &&
						el.label && el.label.parentNode && el.label.parentNode.parentNode)
					{
						this.HighlightLabel(el.label, value, el.name);
					}

					group = this.groupIndex[el.groupId];
					if (group)
					{
						BX.addClass(group.leftIndex, 'bxcompprop-item-search-res');
						this._searchResultSect.push(group.leftIndex);
						BX.addClass(group.titleRow, 'bxcompprop-tr-search-res');
						this._searchResult.push(group.titleRow);
					}
				}
			}

			if (!bFoundItems)
			{
				BX.addClass(this.pContainer, 'bxcompprop-no-search-results');
			}

			this.bSearchCleared = false;
			var wnd = BX.WindowManager.Get();
			if (wnd)
			{
				wnd.unclosable = true;
			}
		},

		ClearSearchResult: function()
		{
			BX.removeClass(this.pGroupsIndex, 'bxcompprop-groups-search');
			BX.removeClass(this.pParamsWrap, 'bxcompprop-params-search');
			BX.removeClass(this.pContainer, 'bxcompprop-no-search-results');

			var i;
			if (this._searchResult)
			{
				for(i = 0; i < this._searchResult.length; i++)
				{
					BX.removeClass(this._searchResult[i], 'bxcompprop-tr-search-res');
				}
				this._searchResult = [];
			}

			if (this._searchResultSect)
			{
				for(i = 0; i < this._searchResultSect.length; i++)
				{
					BX.removeClass(this._searchResultSect[i], 'bxcompprop-item-search-res');
				}
				this._searchResultSect = [];
			}

			if (this._searchResultLabel)
			{
				for(i = 0; i < this._searchResultLabel.length; i++)
				{
					this._searchResultLabel[i].node.innerHTML = BX.util.htmlspecialchars(this._searchResultLabel[i].name) + ':';
				}
				this._searchResultSect = [];
			}
			this.bSearchCleared = true;
			var wnd = BX.WindowManager.Get();
			if (wnd)
			{
				wnd.unclosable = false;
			}
		},

		HighlightLabel: function(pLabel, needle, originalName)
		{
			pLabel.innerHTML = BX.util.htmlspecialchars(originalName).replace(new RegExp('(' + needle + ')', 'ig'), "<i>$1</i>") + ':';
			this._searchResultLabel.push({node: pLabel, name: originalName});
		}
	};


	function __run()
	{
		top.BXComponentParamsManager = window.BXComponentParamsManager = ParamsManager;
	}
	if (!top.BXComponentParamsManager)
		__run();
})();