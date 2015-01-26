;
(function ()
{
	if (window.BX.app) return;
	var BX = window.BX;

	if (BX.browser.IsIE() && BX.browser.DetectIeVersion() < 9)
	{
		return false;
	}

	BX.Mobile = {
		Tools: {
			extendProto: function (child, proto)
			{
				for (var element in proto)
				{
					child.prototype[element] = proto[element];
				}
			},
			highlight: function (node, rbgColor, restore, duration)
			{
				var d = (duration)? duration:0.2;

				(new BX.fx({
					start: 0.0,
					finish: 30.0,
					step: 0.005,
					type: "accelerated",
					time: d,
					callback: function (value)
					{
						node.style.backgroundColor = "rgba(" + rbgColor[0] + "," + rbgColor[1] + "," + rbgColor[2] + "," + value / 100 + ")"
					},
					callback_start: function ()
					{

					},
					callback_complete: function ()
					{
						if(typeof restore != "undefined" && restore === false)
							return;
						(new BX.fx({
							start: 30.0,
							finish: 0.0,
							step: 0.005,
							type: "deccelerated",
							time: 0.8,
							callback: function (value)
							{
								node.style.backgroundColor = "rgba(" + rbgColor[0] + "," + rbgColor[1] + "," + rbgColor[2] + "," + value / 100 + ")"
							},
							callback_start: function ()
							{

							},
							callback_complete: function ()
							{
								node.style.backgroundColor = "ffffff";
							}
						})).start();
					}
				})).start();
			}
		},
		Designer: function (params)
		{
			this.designerContainer = BX(params.containerId);
			this.container = BX.create("DIV", {
				attrs: {
					id: "app_params"
				}
			});
			this.previewContainer = BX.create("DIV", {
				attrs: {
					id: "app_preview"
				}
			});
			this.projects = {};
			this.apps = [];
			this.configs = [];
			this.saveTimeOutId = 0;
			this.saveTimeOut = 1000;
			this.useAutoSave = true;
			this.editor = null;
			this.currentProject = {};
			this.currentPlatform = "";
			this.map = {};
			this.createForm = false;
			this.availablePlatforms = params.platforms;
			this.currentPlatformTab = false;
			this.isDataSet = false;
			if (params.data)
			{
				this.setData(params.data);

			}

		},
		Project: function (params)
		{
			this.name = params.name;
			this.desc = params.desc;
			this.folder = params.folder;
			this.config = {};
			this.files = {};
			this.hasFiles = false;
			this.code = params.code;
		},
		Editor: function (map, container, previewContainer, imager)
		{
			this.activeGroupId = false;
			this.previewContainer = previewContainer;
			this.saved = true;
			this.groups = {};
			this.config = {};
			this.controlList = {};
			this.imager = imager;
			this.map = map || {
				groupedParams: {},
				lang: {}
			};
			this.container = BX.create("DIV", {
				props: {
					className: "designer-editor-wrap"
				}
			});


			container.appendChild(this.container);
			this.init();

		},
		Viewer: function (editor, container)
		{
			this.editor = editor;
			this.map = editor.map;
			this.container = container;
			this.config = {};
		},
		ViewerElement: function (viewer, options)
		{
			BX.addCustomEvent("onEditorConfigChanged", BX.proxy(this.onParameterValueChanged, this));
			BX.addCustomEvent(viewer.editor, "onEditorConfigReady", BX.proxy(this.redrawElement, this));
			this.isEmpty = true;
			this.params = options || {};
			this.watched = [];
			this.baseElement = null;
			this.canvasElement = null;
			this.valuesSet = {};
			this.bindedParameters = {};
			this.map = viewer.map;
			this.viewer = viewer;
			this.defaultValues = this.params.defaultValues || {};
			this.textShadowColor = false;
			this.text = (this.params.text ? this.params.text : "");
			this.textSize = (this.params.textSize ? this.params.textSize : 10);
			this.type = this.params.type ? this.params.type : "common";
			this.textPosition = this.params.textPosition ? this.params.textPosition : {x: "center", y: "center"};

			if (this.params.element)
			{
				this.setBaseElement(this.params.element);
			}

			if (this.params.bindedParams)
			{
				for (var paramKey in this.params.bindedParams)
				{
					this.bindParameter(paramKey, this.params.bindedParams[paramKey])
				}
			}


		},
		Controls: {
			Base: function (options)
			{
				this.langs = options.langs;
				this.params = options.params;
				this.id = options.id;
				this.picker = options.picker;
				this.imager = options.imageDialog;
				this.displayElement = null;
				this.value = null;
				this.startChoose = BX.proxy(function ()
				{
					if (typeof this["_startChoose"] == "function")
						this._startChoose();
				}, this);
				if (typeof this["onCreate"] == "function")
					this.onCreate();
			},
			Select: function (options)
			{
				BX.Mobile.Controls.Select.superclass.constructor.apply(this, [options]);

				this._setValue = function (value)
				{
					this.input.value = value;
				};

				this._getDisplayElement = function ()
				{
					var options = [];
					for (var i = 0; i < this.params.list.length; i++)
					{
						options.push(
							BX.create("OPTION", {
								html: this.getMessage(this.params.list[i]),
								attrs: {
									value: this.params.list[i],
									id: this.params.list[i]
								}
							})
						);
					}


					this.displayElement = BX.create("SPAN", {
						props: {
							className: "adm-select-wrap"
						},
						children: [
							this.input = BX.create("SELECT", {
								props: {className: "adm-workarea adm-select"},
								attrs: {id: this.id},
								children: options,
								events: {
									"change": BX.proxy(function ()
									{
										this.setValue(this.input.value, true, false);
									}, this)
								}
							})
						]
					});

					return this.displayElement;
				};
			},
			String: function (options)
			{
				BX.Mobile.Controls.String.superclass.constructor.apply(this, [options]);

				this._setValue = function (value)
				{
					this.input.value = value;
				};

				this._getDisplayElement = function ()
				{
					this.displayElement = this.input = BX.create("INPUT", {
						props: {
							className: "designer-simple-string"
						},
						attrs: {
							type: "text",
							id: this.id,
							placeholder: ""
						},
						events: {
							"change": BX.proxy(function ()
							{
								this.setValue(this.input.value, true, false);
							}, this)
						}
					});

					return this.displayElement;
				};
			},
			Number: function (options)
			{
				BX.Mobile.Controls.Number.superclass.constructor.apply(this, [options]);

				this._setValue = function (value)
				{
					this.input.value = value;
				};

				this._getDisplayElement = function ()
				{
					this.input = BX.create("INPUT", {
						props: {
							className: "designer-simple-string"
						},
						attrs: {type: "number", id: this.id},
						events: {
							"change": BX.proxy(function ()
							{
								if (this.params.limits["min"] && this.input.value < this.params.limits["min"])
								{
									this.input.value = this.params.limits["min"];
								}
								this.setValue(this.input.value, true, false);
							}, this)
						}
					});


					this.input.setAttribute("placeholder", "0");
					this.displayElement = BX.create("SPAN", {
						props: {
							className: "designer-input-wrap"
						},
						children: [
							this.input
						]
					});

					return this.displayElement;
				}
			},
			Image: function (options)
			{
				BX.Mobile.Controls.Image.superclass.constructor.apply(this, [options]);
				this._setValue = function (value)
				{

					if (typeof value === "object")
					{
						if (value.id)
						{
							this.input.value = value.id;
						}
						if (value.src)
						{
							this.image.src = (value.preview) ? value.preview : value.src;
							BX.show(this.imageView);
						}
						else
						{
							BX.hide(this.imageView);
						}

					}
					else
					{
						this.input.value = (value) ? value : "";
						var src = this.imager.getSrcByID(value, true);
						this.image.src = this.imager.getSrcByID(value, true);
						if (value > 0 && src)
						{
							BX.show(this.imageView);
						}
						else
						{
							BX.hide(this.imageView);
						}
					}
				};
				this._getDisplayElement = function ()
				{
					this.input = BX.create("INPUT", {
						props: {
							className: "designer-simple-string"
						},
						attrs: {type: "text", id: this.id}
					});

					this.button = BX.create("INPUT", {
						attrs: {
							type: "button",
							value: BX.message("MOBILEAPP_SELECT_IMAGE")
						}

					});
					this.displayElement = BX.create("DIV", {
						props: {
							className: "designer-image-wrap",
							id: this.id
						},
						events: {
							"mouseover": function ()
							{
								BX.addClass(this, "designer-image-list-item-highlight");
							},
							"mouseout": function ()
							{
								BX.removeClass(this, "designer-image-list-item-highlight");
							}
						},
						children: [
							this.imageView = BX.create("DIV", {
								children: [
									BX.create("DIV", {
										props: {
											className: "designer-imager-item-delete"
										},
										attrs: {
											"data-id": this.id
										},
										children: [
											BX.create("SPAN", {
												attrs: {
													"data-id": this.id
												},
												props: {
													className: "designer-imager-item-delete-inner"
												}
											})
										],
										events: {
											"click": BX.proxy(function ()
											{
												this.setValue("", true)
											}, this)
										}
									}),
									BX.create("DIV", {
										props: {
											className: "designer-image-preview"
										},
										children: [
											this.image = BX.create("IMG", {
												attrs: {}
											})
										]
									})
								]
							}),
							this.button
						]
					});

					BX.bind(this.button, 'click', BX.proxy(function ()
					{
						this.imager.open(this);
					}, this));

					return this.displayElement;
				};
			},
			MultiImage: function (options)
			{
				BX.Mobile.Controls.MultiImage.superclass.constructor.apply(this, [options]);
			},
			Boolean: function (options)
			{
				BX.Mobile.Controls.Boolean.superclass.constructor.apply(this, [options]);
				this._setValue = function (value)
				{
					var options = this.input.options;
					for (var i = 0; i < options.length; i++)
					{
						if (options[i].value.toLowerCase() == value.toLowerCase())
						{
							this.input.selectedIndex = i;
							break;
						}
					}
				};

				this._getDisplayElement = function ()
				{
					var options = [];
					var variants = ["YES", "NO"];
					for (var i = 0; i < variants.length; i++)
					{
						options.push(
							BX.create("OPTION", {
								html: this.getMessage(variants[i]),
								attrs: {
									value: variants[i]
								}
							})
						);
					}

					this.displayElement = BX.create("SPAN", {
						props: {
							className: "adm-select-wrap"
						},
						children: [
							this.input = BX.create("SELECT", {
								attrs: {id: this.id}, props: {
									className: "adm-workarea adm-select"
								},
								children: options,
								events: {
									"change": BX.proxy(function ()
									{
										this.setValue(this.input.value, true, false);
									}, this)
								}

							})
						]
					});

					return this.displayElement;
				}
			},
			Color: function (options)
			{
				BX.Mobile.Controls.Color.superclass.constructor.apply(this, [options]);
				this.colorBox = null;
			}
		},
		ControlsFactory: {
			getControl: function (options)
			{
				var control = null;
				switch (options.params.type)
				{

					case "value_list":
					case "fill_list":
						control = new BX.Mobile.Controls.Select(options);
						break;
					case "image":
						control = new BX.Mobile.Controls.Image(options);
						break;
					case "image_set":
						control = new BX.Mobile.Controls.MultiImage(options);
						break;
					case "color":
						control = new BX.Mobile.Controls.Color(options);
						break;
					case "size":
						control = new BX.Mobile.Controls.Number(options);
						break;
					case "boolean":
						control = new BX.Mobile.Controls.Boolean(options);
						break;
					default:
						control = new BX.Mobile.Controls.String(options);
						break;
				}

				return control;
			}
		}
	};
	BX.Mobile.Designer.prototype = {
		onEditorConfigChanged: function ()
		{
			if (this.useAutoSave)
			{
				clearTimeout(this.saveTimeOutId);
				this.saveTimeOutId = setTimeout(BX.proxy(this.save, this), this.saveTimeOut);
			}
		},
		setData: function (data)
		{
			this.map = data["map"];
			this.apps = data["apps"];
			this.configs = data['configs'];
			this.templates = data['templates'];
			for (var i = 0; i < this.apps.length; i++)
			{
				var code = this.apps[i]["code"];
				var platform = this.apps[i]["platform"];
				var params = this.apps[i]["params"];

				if (!this.projects[code])
				{
					this.projects[code] = new BX.Mobile.Project(this.apps[i]);
				}

				this.projects[code].setConfig(platform, params);
			}

			this.isDataSet = true;
		},
		draw: function ()
		{
			this.drawPanel();
			this.designerContainer.appendChild(this.container);
			this.designerContainer.appendChild(this.previewContainer);
			this.imager.init();

			this.editor = new BX.Mobile.Editor(this.map, this.editorContainer, this.previewContainer, this.imager);
			if (this.apps.length !== 0)
			{
				this.editorContainer.style.display = "inline-block";
				this.setCurrentProject(this.projects[this.appSwitcher.activeApp]);
			}
			else
			{
				this.showEmptyScreen();
			}
		},
		init: function ()
		{
			BX.addCustomEvent("onEditorConfigLoad", BX.proxy(this.onEditorConfigLoad, this));
			BX.addCustomEvent("onEditorConfigChanged", BX.proxy(this.onEditorConfigChanged, this));
			BX.addCustomEvent("onEditorConfigSaved", BX.proxy(this.onEditorConfigSave, this));

			if (!this.isDataSet)
			{
				this.executeRequest(
					{
						command: "getInitData",
						onsuccess: BX.proxy(function (data)
						{
							this.setData(data);
							this.draw();
						}, this),
						onfailure: function (data)
						{
							//handling error
						}
					}
				);
			}
			else
			{
				this.draw();
			}

		},
		setCurrentProject: function (project)
		{

			if (!this.projects[project.code])
			{
				this.projects[project.code] = project;
				this.appSwitcher.add(project.code, project);
			}

			this.appSwitcher.setActiveApp(project.code);
			this.editor.setReady(false);
			this.currentProject = project;
			this.getFiles();

			this.imager.uploader.appCode = project.code;
			this.imager.setFileList(project.files);
			this.editor.setSaved(true);


			this.currentPlatform = false;
			var configs = this.currentProject.config;
			this.currentPlatformTab = false;
			this.configList.innerHTML = "";


			for (var platform in configs)
			{
				var platformTab = this.createPlatformTab(platform);
				this.configList.appendChild(platformTab);

				if (!this.currentPlatform)
				{
					this.currentPlatform = platform;
					this.currentPlatformTab = platformTab;

				}
			}

			this.editor.loadConfig(this.currentProject.getConfig(this.currentPlatform), this.currentPlatform);
			this.addConfigButton.style.visibility = (this.getPlatformsToCreate().length == 0) ? "hidden" : "visible";
		},
		createPlatformTab: function (platform)
		{
			var _that = this;
			return BX.create("SPAN", {
				props: {
					className: "designer-config-tab" + (platform === "global" ? " global-config-tab" : " ") + ((this.currentPlatform == false) ? " designer-config-tab-selected" : "")
				},
				attrs: {
					"data-platform": platform
				},
				events: {
					"click": function ()
					{

						var platform = this.getAttribute("data-platform");
						if (_that.currentPlatform === platform)
							return;

						if (_that.editor.getSaved() === false)
							_that.save();

						_that.currentPlatform = platform;
						BX.addClass(this, "designer-config-tab-selected");
						if (_that.currentPlatformTab !== false)
						{
							BX.removeClass(_that.currentPlatformTab, "designer-config-tab-selected");
						}

						_that.currentPlatformTab = this;
						_that.editor.loadConfig(_that.currentProject.getConfig(platform), platform);
					}
				},
				children: [
					BX.create("SPAN", {html: BX.message("MOBILEAPP_" + platform.toUpperCase())}),
					(
						platform !== "global" ? BX.create("DIV", {
							attrs: {
								"data-platform": platform
							},
							props: {
								className: "designer-config-tab-cross"
							},
							events: {
								"mouseover": function ()
								{
									BX.addClass(this, "designer-config-tab-cross-hover");
								},
								"mouseout": function ()
								{
									BX.removeClass(this, "designer-config-tab-cross-hover");
								},
								"click": function (event)
								{
									if (event.stopPropagation)
									{
										event.stopPropagation();
									}
									else
									{
										event.cancelBubble = true;
									}

									_that.removePlatformConfig(event.target.getAttribute("data-platform"), event.target);
								}
							}

						})
							: null
					)
				]

			});
		},
		drawPanel: function ()
		{
			var _that = this;


			this.configList = BX.create("SPAN");

			this.saveButton = BX.create("INPUT", {
				attrs: {
					value: BX.message("MOBILEAPP_SAVE"),
					type: "button"
				},

				events: {
					"click": BX.proxy(this.save, this)
				},
				props: {
					className: "designer-save-button adm-btn-save"
				}
			});

			this.createButton = BX.create("SPAN", {
				attrs: {},
				events: {
					"click": BX.proxy(function ()
					{
						this.showCreateForm(this.createButton);
					}, this)
				},
				props: {
					className: "designer-command-panel-item adm-filter-add-button designer-button-app-add"
				}
			});
			this.appSwitcher.create();
			BX.addCustomEvent(this.appSwitcher, "change", function (code)
			{
				//TODO ask user if he really wants to leave the  application and lose all unsaved changes
				/**
				 * @var BX.Mobile.Designer _that
				 */
				if (_that.editor.getSaved() === false)
					_that.save();

				_that.setCurrentProject(_that.projects[code]);
			});
			BX.addCustomEvent(this.appSwitcher, "delete", BX.proxy(function (code)
			{
				this.removeApp(code)
			}, this));

			for (var appCode in this.projects)
			{
				var project = this.projects[appCode];
				this.appSwitcher.add(appCode, project);
			}

			this.addButtonArea = BX.create("SPAN", {
				props: {},
				children: [
					this.addConfigButton = BX.create("SPAN",
						{
							html: BX.message("MOBILEAPP_APP_PLATFORM"),
							props: {
								className: "designer-config-add-button"
							},
							events: {
								"click": function (e)
								{
									_that.showCreateConfigForm(e.target);
								}
							}
						})
				]
			});

			this.addConfigButton.style.visibility = (this.getPlatformsToCreate().length == 0) ? "hidden" : "visible";

			this.panel = BX.create("DIV", {
				props: {
					className: "adm-filter-content designer-command-panel"
				},
				children: [
					this.createButton,
					this.appSwitcher.getDisplayElement(),
					this.configList,
					this.addButtonArea
				]
			});
			this.designerContainer.appendChild(this.panel);
			this.editorContainer = BX.create("DIV");
			this.editorContainer.style.display = "none";
			this.editorContainer.style.height = "632px";
			this.editorContainer.appendChild(BX.create("DIV", {
				props: {
					className: "designer-save-panel"
				},
				children: [
					this.configLabel = BX.create("SPAN", {
						props: {
							className: "designer-label"
						}
					}),
					this.saveButton
				]
			}));

			if (this.useAutoSave)
				this.saveButton.style.visibility = "hidden";
			this.container.appendChild(this.editorContainer);

		},
		getFiles: function ()
		{
			if (this.currentProject.hasFiles)
			{
				this.imager.setFileList(this.currentProject.files);
				BX.onCustomEvent("onAppFileListGot", [this.currentProject.files]);
			}
			else
			{
				this.executeRequest(
					{
						data: {
							code: this.currentProject.code
						},
						command: "getFiles",
						onsuccess: BX.proxy(function (data)
						{
							this.currentProject.files = data.files;
							this.projects[this.currentProject.code].files = data.files;
							this.projects[this.currentProject.code].hasFiles = true;
							this.imager.setFileList(this.currentProject.files);
							BX.onCustomEvent("onAppFileListGot", [data.files]);
						}, this),
						onfailure: function (data)
						{
	//							console.log(data);
						}
					}
				)
			}
		},
		showEmptyScreen: function ()
		{
			this.emptyScreen = BX.create("DIV", {
				props: {
					className: "designer-no-apps-message"
				},
				children: [
					BX.create("DIV", {
						html: BX.message("MOBILEAPP_NO_APPS")
					}),
					BX.create("INPUT", {
						attrs: {
							value: BX.message("MOBILEAPP_CREATE_APP"),
							type: "button"
						},
						events: {
							"click": BX.proxy(function ()
							{
								this.showCreateForm();
							}, this)
						}
					})
				]
			});

			this.designerContainer.appendChild(this.emptyScreen);
			BX.addClass(this.designerContainer, "designer-prop-wrapper-empty");
		},
		closeEmptyScreen: function ()
		{
			if (this.emptyScreen && this.emptyScreen.parentNode != null)
				this.designerContainer.removeChild(this.emptyScreen);
			BX.removeClass(this.designerContainer, "designer-prop-wrapper-empty");
		},
		_createForm:{
			inited:false,
			hasErrors:false,
			fields:{},
			popupError: false,
			validatedFields:[],
			onChangeValidate: function (e)
			{
				var element = e.target;
				var error = element.getAttribute("data-error");
				if (this.validate(element.value))
				{
					if (error == null || error == "N")
					{
						BX.Mobile.Tools.highlight(element, [255, 0, 0], false);
						element.setAttribute("data-error", "Y");
					}

				}
				else
				{
					element.setAttribute("data-error", "N");
					element.style.backgroundColor = "#ffffff";

				}

				this.saveButton.disabled = !this.isValid();


				BX.PreventDefault(e);
			},
			validate:function(value)
			{
				return (/^[a-zA-Z0-9_]+$/.test(value) == false && value.length > 0)
			},
			reset:function()
			{
				for (var key in this.fields)
				{
					this.fields[key].value = "";
					this.fields[key].setAttribute("data-error", "N");
					BX.Mobile.Tools.highlight(this.fields[key],[255,255,255]);
					if(key == "template")
						this.fields[key].value = "NewMobileTemplate"

				}

				this.saveButton.disabled = true;
			},
			isValid:function()
			{
				if(this.popupError)
					this.popupError.close();
				for(var key in this.fields)
				{
					if(this.templateList.value != "new" && key == "template" )
						continue;
					if(this.fields[key].getAttribute("data-error") == "Y" || this.fields[key].value.length == 0)
					{
						return false;
					}

				}

				return true;
			},
			highlightAllErrors:function()
			{
				for (var key in this.fields)
				{

					if (this.fields[key].getAttribute("data-error") == "Y")
					{
						BX.Mobile.Tools.highlight(this.fields[key], [255, 0, 0],false, 0.8);
					}
				}

			},
			showError:function(fieldName, errorMessage)
			{
				if(this.popupError == false)
				{
					this.popupError = new BX.PopupWindow('DesignerCreateFormError', null, {
						content: BX.create("DIV", {
							props: {
								className: "designer-create-form"
							},
							style: {
								width: "150px"
							},
							html: errorMessage
						}),
						autoHide: true,
						lightShadow: true,
						angle: {position: "left", offset: 15},
						offsetTop: -37,
						closeByEsc:true,
						offsetLeft: 210,
						zIndex:100500,
						closeIcon: {right: "12px", top: "10px"},
						bindOptions: {
							forceTop: true,
							forceLeft: true
						}
					});
				}
				if(this.fields[fieldName])
				{
					BX.Mobile.Tools.highlight(this.fields[fieldName], [255, 0, 0], false);
					this.popupError.setBindElement(this.fields[fieldName]);
					this.popupError.show();
				}
			},
			initCreateForm: function (designer)
			{

				if (this.inited == false)
				{
					this.designer = designer;
					this.inited = true;
					var fields = [];
					fields.push(BX.create("DIV", {
						props: {
							className: "designer-form-title"
						},
						html: BX.message("MOBILEAPP_CREATE_APP")
					}));
					fields.push(BX.create("HR"));
					fields.push(BX.create("DIV",
						{
							children: [
								BX.create("DIV", {
									props: {
										className: "designer-create-form-field-wrap"
									},
									children: [

										BX.create("DIV", {
											props: {
												className: "designer-create-form-input-wrap"
											},
											children: [
												this.fields.name = BX.create("INPUT", {
													attrs: {
														placeholder: BX.message("MOBILEAPP_APP_NAME")
													}
												})
											]
										})
									]
								}),
								BX.create("DIV", {
									props: {
										className: "designer-create-form-field-wrap"
									},
									children: [
										BX.create("DIV", {
											props: {
												className: "designer-create-form-input-wrap"
											},
											children: [
												this.fields.code = BX.create("INPUT", {
													events: {
														"keyup": BX.proxy(this.onChangeValidate, this)
													},
													attrs: {
														placeholder: BX.message("MOBILEAPP_LABEL_CODE")
													}
												})
											]
										})
									]
								}),
								BX.create("DIV", {
									props: {
										className: "designer-create-form-field-wrap"
									},
									children: [
										BX.create("DIV", {
											props: {
												className: "designer-create-form-input-wrap"
											},
											children: [
												this.fields.folder = BX.create("INPUT", {
													attrs: {
														placeholder: BX.message("MOBILEAPP_LABEL_APP_FOLDER")
													},
													events: {
														"keyup": BX.proxy(this.onChangeValidate, this)
													}
												})
											]
										})
									]
								})
							]
						}));


					this.templateList = BX.create("SELECT", {
						props: {className: "adm-workarea adm-select"},
						style: {width: "212px"},
						events: {
							"change": BX.proxy(function (e)
							{
								var selector = e.target;
								if (selector.options[selector.selectedIndex].value != "new")
								{
									BX.hide(this.templateFolderName);
								}
								else
									BX.show(this.templateFolderName);

								this.saveButton.disabled = !this.isValid();
							}, this)
						}
					});


					this.templateList.appendChild(BX.create("OPTION", {
						html: BX.message("MOBILEAPP_CREATE_NEW_TEMPLATE"),
						attrs: {
							value: "new"
						}
					}));

					this.templateList.appendChild(BX.create("OPTION", {
						html: BX.message("MOBILEAPP_WITHOUT_TEMPLATE"),
						attrs: {
							value: "without"
						}
					}));

					if (this.designer.templates.length > 0)
					{
						var group = BX.create("OPTGROUP", {
							attrs: {
								label: BX.message("MOBILEAPP_SELECT_TEMPLATE")
							}
						});
						this.templateList.appendChild(group);
						for (var i = 0; i < this.designer.templates.length; i++)
						{
							group.appendChild(BX.create("OPTION", {
								html: this.designer.templates[i]["NAME"],
								attrs: {
									value: this.designer.templates[i]["ID"]
								}
							}));
						}
					}


					fields.push(BX.create("DIV", {
						props: {
							className: "designer-form-create-label"
						},
						html: BX.message("MOBILEAPP_APP_TEMPLATE")
					}));
					fields.push(
						BX.create("SPAN", {
							props: {
								className: "adm-select-wrap"
							},
							children: [
								this.templateList
							]
						})
					);

					fields.push(
						this.templateFolderName = BX.create("DIV", {
							props: {
								className: "designer-create-form-field-wrap"
							},
							style: {display: "block"},
							children: [
								BX.create("DIV", {
									props: {
										className: "designer-create-form-input-wrap"
									},
									children: [
										this.fields.template = BX.create("INPUT", {
											attrs: {
												placeholder: BX.message("MOBILEAPP_NEW_TEMPLATE_NAME"),
												value: "NewMobileTemplate"
											},
											events: {
												"keyup": BX.proxy(this.onChangeValidate, this)
											}
										})
									]
								})
							]
						})
					);

					fields.push(BX.create("DIV", {
						props: {
							className: "popup-window-buttons"
						},
						children: [
							this.saveButton = BX.create("input", {
									props: {
										className: "adm-btn-save"
									},
									attrs: {
										type: "button",
										disabled:true,
										value: BX.message("MOBILEAPP_CREATE")
									},
									events: {
										click: BX.proxy(function ()
										{
											if(!this.isValid())
											{
												alert("Error!");
												return;
											}
											var data = {
												"code": this.fields.code.value,
												"platform": "global",
												"name": this.fields.name.value,
												"folder": this.fields.folder.value,
												"createNew": "N",
												"bindTemplate": "N"
											};

											if (this.templateList.value != "without")
											{
												if (this.templateList.value == "new")
												{
													if (this.fields.template.value.length > 0)
													{
														data["createNew"] = "Y";
														data["bindTemplate"] = "Y";
														data["template_id"] = this.fields.template.value;
													}

												}
												else
												{
													data["bindTemplate"] = "Y";
													data["template_id"] = this.templateList.value;
												}
											}
											this.designer.createProject(data);
										}, this)
									}
								}
							),
							BX.create("input", {
									attrs: {
										type: "button",
										value: BX.message("MOBILEAPP_CLOSE")
									},
									events: {
										click: BX.proxy(function ()
										{
											this.popup.close()
										}, this)
									}
								}
							)
						]
					}));

					this.popup = new BX.PopupWindow('DesignerCreateForm', null, {
						content: BX.create("DIV", {
							props: {
								className: "designer-create-form adm-workarea"
							},
							children: fields
						}),
						closeByEsc: true,
						height: 1000,
						overlay: true,
						autoHide: true,
						zIndex: 10000
					});

					BX.addCustomEvent(this.popup, "onPopupClose", BX.proxy(function(){
						if(this.popupError)
							this.popupError.close();
					}))
				}
			}

		},
		showCreateForm: function (bindNode)
		{
			this._createForm.initCreateForm(this);
			if (bindNode)
				this._createForm.popup.setBindElement(bindNode);
			else
				this._createForm.popup.bindElement = null;
			this._createForm.popup.show();
		},
		getPlatformsToCreate: function ()
		{
			var platforms = [];
			var configs = this.currentProject.config;

			if (configs)
			{
				for (var i = 0; i < this.availablePlatforms.length; i++)
				{
					if (!configs[this.availablePlatforms[i]])
						platforms.push(this.availablePlatforms[i])
				}
			}

			return platforms;
		},
		showCreateConfigForm: function (bindNode)
		{
			var platforms = [];
			var platformsToCreate = this.getPlatformsToCreate();
			var _that = this;

			for (var i = 0; i < platformsToCreate.length; i++)
			{

				platforms.push(
					BX.create("DIV", {
						html: BX.message("MOBILEAPP_" + platformsToCreate[i].toUpperCase()),
						attrs: {
							"data-platform": platformsToCreate[i]
						},
						props: {
							className: "designer-app-switcher-list-item"
						},
						events: {
							"click": function (e)
							{

								var element = e.target;
								var platform = element.getAttribute("data-platform");
								_that.createPlatformConfig(platform);
							}
						}
					})
				);
			}
			var platformContainer = BX.create("DIV", {
				props: {
					className: "designer-popup-config-list"
				},
				children: platforms
			});

			if (!this.createConfigForm)
			{
				this.createConfigForm = new BX.PopupWindow('preview' + Math.random(), null, {
					content: "",
					lightShow: true,
					offsetTop: -5,
					autoHide: true,
					closeIcon: false,
					bindOptions: {
						forceTop: true
					},

					zIndex: 2000
				});
			}

			this.createConfigForm.setContent(platformContainer);
			this.createConfigForm.setBindElement(bindNode);
			this.createConfigForm.show();
		},
		removePlatformConfig: function (platform, node)
		{
			var appCode = this.currentProject.code;
			this.executeRequest(
				{
					command: "removePlatform",
					waitMessage: BX.message("MOBILEAPP_APP_REMOVE_CONFIG_WAIT"),
					data: {
						code: appCode,
						platform: platform
					},
					onsuccess: BX.proxy(function (data)
					{
						if (data.status == "ok")
						{
							node.parentNode.removeChild(node);
							delete this.currentProject.config[platform];
							this.setCurrentProject(this.currentProject);
						}
						else
						{
							alert("Error");
						}
					}, this),
					onfailure: function (data)
					{
						//handling error
					}
				});
		},
		createPlatformConfig: function (platform)
		{
			var appCode = this.currentProject.code;
			this.executeRequest(
				{
					command: "createPlatform",
					waitMessage: BX.message("MOBILEAPP_APP_CREATE_CONFIG_WAIT"),
					data: {
						code: appCode,
						platform: platform
					},
					onsuccess: BX.proxy(function (data)
					{
						if (data.status == "ok")
						{
							this.currentProject.setConfig(platform, {});
							this.configList.appendChild(this.createPlatformTab(platform));
							this.addConfigButton.style.visibility = (this.getPlatformsToCreate().length == 0) ? "hidden" : "visible";

							this.createConfigForm.close();
						}
						else
						{
							alert("Error");
						}
					}, this),
					onfailure: function (data)
					{
						//handling error
					}
				});
		},
		createProject: function (params)
		{
			this.executeRequest(
				{
					command: "createApp",
					data: params,
					onsuccess: BX.proxy(function (data)
					{
						if (data.status == "ok")
						{
							this.currentProject = new BX.Mobile.Project(params);
							this.currentProject.setConfig("global", {});
							this.editorContainer.style.display = "inline-block";
							this.setCurrentProject(this.currentProject);
							this.closeEmptyScreen();
							this._createForm.popup.close();
							this._createForm.reset();
						}
						else if(data.status == "is_already_exists")
						{
							this._createForm.showError("code",BX.message("MOBILEAPP_APP_IS_ALREADY_EXISTS"));
						}
					}, this),
					onfailure: function (data)
					{
						//handling error
					}
				});
		},
		removeApp: function (code)
		{
			this.executeRequest(
				{
					command: "removeApp",
					data: {
						"code": code
					},
					onsuccess: BX.proxy(function (data)
					{
						if (data.status == "ok")
						{
							this.removeProject(code);
						}
					}, this),
					onfailure: function (data)
					{
						//handling error
					}
				});
		},
		removeProject: function (code)
		{
			delete this.projects[code];
			BX.onCustomEvent(this, 'onProjectRemoved', [code]);
			this.appSwitcher.remove(code);
			var arrayProjects = Object.keys(this.projects);
			if (arrayProjects.length == 0)
			{
				this.showEmptyScreen()
			}
			else
			{
				this.setCurrentProject(this.projects[arrayProjects[0]]);
			}
		},
		executeRequest: function (params)
		{
			if (params.showWait != false)
			{
				if (params.waitMessage && params.waitMessage.length > 0)
				{
					BX.showWait(null, params.waitMessage);
				}
				else
				{
					BX.showWait();
				}
			}


			var data = params.data;
			data['sessid'] = BX.bitrix_sessid();
			BX.ajax(
				{
					url: "?action=" + params.command,
					data: data,
					method: "POST",
					dataType: "json",
					onsuccess: function (data)
					{
						BX.closeWait();
						params.onsuccess(data);
					},
					onfailure: function (data)
					{
						BX.closeWait();
						params.onfailure(data);
					}
				}
			);
		},
		save: function ()
		{
			BX.showWait(this.editor.container, BX.message("MOBILEAPP_APP_SAVE_CONFIG_WAIT"));
			this.currentProject.setConfig(this.currentPlatform, this.editor.config);
			this.editor.setSaved(true);
			this.executeRequest({
				showWait: false,
				command: "save",
				method: "POST",
				onsuccess: function ()
				{
				},
				onfailure: function ()
				{
				},
				data: {
					code: this.currentProject.code,
					platform: this.currentPlatform,
					config: this.editor.config
				}
			})

		},
		onEditorConfigLoad: function (data)
		{
			this.configLabel.innerHTML = BX.message("MOBILEAPP_CONFIGNAME_" + data.platform.toUpperCase());
		},
		onEditorConfigSave: function (data)
		{
			this.saveButton.disabled = data.status;
		},
		imager: {
			init: function ()
			{
				BX.addCustomEvent('OnFileUploadRemove', BX.proxy(this.onRemove, this));
				BX.addCustomEvent('BFileDSelectFileDialogLoaded', BX.proxy(function (uploader)
				{
					this.uploader = uploader;
				}, this));

				this.projectId = false;
				this.files = {};
				this.caller = null;
				this.popup = new BX.PopupWindow('imageDialog', null, {
					content: BX.create("DIV", {
						props: {
							className: "designer-create-form"
						}
					}),
					closeIcon: {right: "12px", top: "12px"},
					closeByEsc: true,
					width: 500,
					overlay: true,
					zIndex: 100001
				});


				var firstParent = BX('file-selectdialog-designer').parentNode;
				this.images = BX.create("DIV", {
					props: {
						className: "designer-image-container"
					},
					attrs: {
						id: "images"
					}
				});
				this.popup.setContent(
					BX.create("DIV", {
						style: {width: '700px', margin: "17px"},
						children: [
							this.images,
							BX('file-selectdialog-designer')
						]
					})
				);

				BX.addCustomEvent('OnFileUploadSuccess', BX.proxy(this.fileUploadSuccess, this));

				BX.onCustomEvent(firstParent, 'BFileDLoadFormController');
			},
			fileUploadSuccess: function (uploadResult)
			{
				BX.remove(BX("wd-doc" + uploadResult.element_id));
				this.addImageToList(uploadResult.element_id, uploadResult.element_thumbnail);
				this.files["file_" + uploadResult.element_id] = {
					src: uploadResult.element_url,
					preview: uploadResult.element_thumbnail
				};
				BX.onCustomEvent("onImageUploaded", [
					{
						id: uploadResult.element_id,
						src: uploadResult.element_url,
						preview: uploadResult.element_thumbnail
					}
				]);
			},

			addImageToList: function (id, url)
			{
				var node = BX.create("SPAN", {
					props: {
						className: "designer-image-list-item"
					},
					events: {
						"mouseover": function ()
						{
							BX.addClass(this, "designer-image-list-item-highlight");
						},
						"mouseout": function ()
						{
							BX.removeClass(this, "designer-image-list-item-highlight");
						}
					},
					attrs: {
						"id": "image_container_" + id
					},
					children: [
						BX.create("DIV", {
							props: {
								className: "designer-imager-item-delete"
							},
							attrs: {
								"data-id": id
							},
							children: [
								BX.create("SPAN", {
									attrs: {
										"data-id": id
									},
									props: {
										className: "designer-imager-item-delete-inner"
									}
								})
							],
							events: {
								"click": BX.proxy(function (e)
								{
									var id = e.target.getAttribute("data-id");
									this.uploader.remove(id);

								}, this)
							}
						}),
						BX.create("IMG", {
							attrs: {
								src: url,
								id: "img_" + id,
								"data-id": id
							},
							props: {
								className: "designer-imager-item-img"
							},
							events: {
								"click": BX.proxy(function (e)
								{
									var img = e.target;
									this.onImageChosen({id: img.getAttribute("data-id")/*, src: img.src*/});
								}, this)
							}
						})
					]
				});

				this.images.appendChild(node);
				this.images.style.display = "block";
			},
			open: function (caller)
			{
				this.caller = caller;
				this.popup.resizeOverlay();
				this.popup.show();
			},
			onRemove: function (id)
			{
				var element = BX("image_container_" + id);
				element.parentNode.removeChild(element);
				delete this.files["file_" + id];
				if (Object.keys(this.files).length == 0)
				{
					this.images.style.display = "none";
				}

			},
			onImageChosen: function (data)
			{
				if (this.caller && this.caller["onImageChosen"])
				{
					this.caller.onImageChosen(data);
					this.caller = null;
				}

				this.popup.close();
			},

			setFileList: function (files)
			{
				this.images.innerHTML = "";
				this.images.style.display = "none";
				this.files = files;
				for (var key in files)
				{
					this.addImageToList(files[key].id, (files[key].preview) ? files[key].preview : files[key].src);
				}

			},

			getSrcByID: function (id, preview)
			{
				var url = "";
				if (this.files["file_" + id])
				{
					url = (preview && this.files["file_" + id]["preview"]) ? this.files["file_" + id]["preview"]
						: this.files["file_" + id]["src"]
					;
				}

				return url;

			}
		},
		appSwitcher: {
			inited: false,
			apps: {},
			activeApp: false,
			activeAppNode: false,
			add: function (code, project)
			{
				var that = this;
				var itemValue = BX.create("SPAN", {
					props: {
						className: "designer-app-switcher-list-item-inner"
					},
					html: project.name + " (" + code + ")"
				});
				var appItem = BX.create("DIV", {
					props: {
						className: "designer-app-switcher-list-item"
					},
					attrs: {
						"data-app": code
					},
					children: [
						itemValue,
						BX.create("SPAN", {
							props: {
								className: "designer-app-switcher-item-del-link"
							},
							attrs: {
								"data-app": code
							},
							html: BX.message("MOBILEAPP_REMOVE"),
							events: {
								"click": BX.proxy(function (e)
								{
									var code = this.getAttribute("data-app");
									that.onDelete(code);
									that.popupList.close();
									BX.PreventDefault(e);
								}, appItem)
							}
						}),
						BX.create("SPAN", {
							props: {
								className: "designer-app-switcher-list-item-delimiter"
							}
						})
					],
					events: {
						"click": BX.proxy(function ()
						{
							var code = this.getAttribute("data-app");
							that.onChange(code);
							that.popupList.close();
						}, appItem)
					}
				});
				if (this.activeApp === false)
				{
					this.activeValueNode.innerHTML = project.name + " (" + code + ")";
					this.activeApp = code;
				}
				this.apps[code] = project;
				this.apps[code]["node"] = appItem;
				this.apps[code]["value"] = itemValue;
				this.appListContainer.appendChild(appItem);

			},
			remove: function (appCode)
			{
				this.appListContainer.removeChild(this.apps[appCode]["node"]);
				delete this.apps[appCode];
			},
			create: function ()
			{
				if (!this.popupList)
				{
					this.appListContainer = BX.create("DIV", {
						props: {
							className: ""
						}
					});
					this.popupList = new BX.PopupWindow('popupList', null, {
						content: this.appListContainer,
						closeByEsc: true,
						darkMode: false,
						autoHide: true,
						height: 1000,
						zIndex: 10000
					});
				}

				if (this.activeAppNode === false)
				{
					this.activeValueNode = BX.create("SPAN", {
						props: {
							className: "designer-app-switcher-inner"
						}
					});
					this.activeAppNode = BX.create("SPAN", {
						props: {
							className: "designer-command-panel-item designer-app-switcher"
						},
						children: [
							this.activeValueNode,
							BX.create("SPAN", {props: {className: "designer-app-switcher-angle"}})
						],
						events: {
							"click": BX.proxy(function ()
							{
								if (Object.keys(this.apps).length > 0)
									this.show();
							}, this)
						}
					});


				}

				this.inited = true;
			},
			getDisplayElement: function ()
			{

				if (!this.inited)
					this.create();
				return this.activeAppNode;
			},
			show: function ()
			{
				this.popupList.setBindElement(this.activeAppNode);
				this.popupList.show();
			},
			setActiveApp: function (code)
			{
				this.activeApp = code;
				this.activeValueNode.innerHTML = this.apps[code].name + " (" + code + ")";
			},
			onChange: function (code)
			{
				if (code == this.activeApp)
					return;
				this.setActiveApp(code);
				BX.onCustomEvent(this, "change", [this.activeApp]);
			},

			onDelete: function (code)
			{
				BX.onCustomEvent(this, "delete", [code]);
			}

		}
	};
	BX.Mobile.Project.prototype = {
		setConfig: function (platform, configObject)
		{
			this.config[platform] = configObject;
		},
		getConfig: function (platform)
		{
			return this.config[platform];
		}
	};
	BX.Mobile.Editor.prototype = {
		loadConfig: function (config, platform)
		{
			this.config = (typeof config != "object") ? {} : BX.clone(config);
			for (var key in this.controlList)
			{
				this.controlList[key].setValue((this.config[key]) ? this.config[key] : "");
			}
			BX.onCustomEvent("onEditorConfigLoad", [
				{'platform': platform, 'config': config}
			]);


			if (!this.viewer)
			{
				this.viewer = new BX.Mobile.Viewer(this, this.previewContainer);
				this.viewer.config = config;
				this.viewer.init();
			}
			else
			{
				this.viewer.setConfig(config);
			}

			this.setConfigReady(true);

		},
		setImageReady: function (ready)
		{
			this.imageReady = ready;
			if (this.imageReady && this.configReady)
				this.setReady(true);
		},
		setConfigReady: function (ready)
		{
			this.configReady = ready;
			if (this.imageReady && this.configReady)
				this.setReady(true);

		},
		setReady: function (ready)
		{
			if (!ready)
			{
				this.imageReady = false;
				this.configReady = false;
				this.ready = false;
			}
			else
			{
				this.ready = true;
				BX.onCustomEvent(this, "onEditorConfigReady", [this]);
			}
		},
		sortByParent: function (groupedParams)
		{
			var result = {};
			for (var key in groupedParams)
			{
				if (groupedParams[key]["type"] == "group")
					continue;
				var parent = groupedParams[key]["parent"];
				if (parent && parent.length > 0)
				{
					if (!result[parent])
						result[parent] = {};
					result[parent][key] = groupedParams[key];
				}
				else
				{
					if (!result["common_params"])
						result["common_params"] = {};
					result["common_params"][key] = groupedParams[key];
				}
			}

			return result;
		},
		init: function ()
		{
			this.ready = false;
			this.imageReady = false;
			this.configReady = false;
			this.controlListImage = {};
			this.picker = new window.BXColorPicker({
				'id': "picker", 'name': 'picker'
			});
			this.picker.Create();
			BX.addCustomEvent("onAppFileListGot", BX.proxy(function (data)
			{
				this.setImageReady(true);
				var imageControls = this.controlListImage;
				for (var key in imageControls)
				{
					if (imageControls.hasOwnProperty(key))
					{
						var fileID = imageControls[key].input.value;
						var fileData = data["file_" + imageControls[key].input.value];

						if (fileID && fileData)
						{
							imageControls[key].setValue(fileData, false, true);
						}
					}


				}
			}, this));


			if (!this.map)
				return;
			this.initGroupTabs();


			for (var i = 0; i < this.map.groups.length; i++)
			{
				var group = {tab: false, propCont: null};
				group = this.groups[this.map.groups[i]];
				var table = BX.create("TABLE", {
					props: {
						className: "param-table"
					}
				});

				group.propCont.appendChild(table);
				var groupedParams = this.map.groupedParams[this.map.groups[i]];
				var param = {};

				var data = this.sortByParent(groupedParams);

				for (var parent in data)
				{
					var paramList = data[parent];
					var subgroupLine = BX.create("TR");
					table.appendChild(subgroupLine);

					subgroupLine.appendChild(BX.create("TD", {
						attrs: {colspan: 1},
						props: {
							className: "label-td heading"
						},
						html: this.getMessage(parent)
					}));
					var values = paramList;
					var firstVariant = true;
					for (var variant in values)
					{

						if (!firstVariant)
						{
							table.appendChild(table.appendChild(BX.create("HR", {
								props: {
									className: "label-delimiter"
								}
							})));
						}
						firstVariant = false;
						var varParam = paramList[variant];
						table.appendChild(this.getParamNameLine(variant));
						this.controlList[variant] = this.createControl(varParam, variant);
						if (varParam.type == "image")
						{
							this.controlListImage[variant] = this.controlList[variant];
						}
						table.appendChild(this.getParamControlLine(this.controlList[variant]));
					}
				}

				this.showGroup(this.activeGroupId);
			}
		},

		getParamNameLine: function (key)
		{
			return BX.create("TR", {
				children: [
					BX.create("TD", {
						props: {
							className: "label-td"
						},
						children: [
							BX.create("DIV", {
								html: this.getMessage(key)
							})
						]
					})
				]
			});
		},

		getParamControlLine: function (control)
		{
			return BX.create("TR", {
				children: [
					BX.create("TD", {
						props: {
							className: "control-td"
						},
						children: [
							control.getDisplayElement()
						]
					})
				]
			});
		},

		initGroupTabs: function ()
		{
			var groupList = this.map.groups;
			var tabDiv = BX.create("DIV", {
				props: {
					className: "designer-tabs"
				}
			});
			this.container.appendChild(tabDiv);
			for (var i = 0; i < groupList.length; i++)
			{

				this.groups[groupList[i]] = {
					tab: BX.create("DIV", {
						attrs: {
							"data-gid": groupList[i]
						},
						props: {
							className: "designer-tab-wrap"
						},
						events: {
							"click": BX.proxy(function ()
							{
								var e = arguments[0];
								var gid = e.target.parentNode.getAttribute("data-gid");
								if (gid)
									this.showGroup(gid);
							}, this)
						},
						children: [

							BX.create("DIV", {
								props: {
									className: "designer-tab-back-shadow"
								}
							}),
							BX.create("DIV", {
								props: {
									className: "designer-tab"
								},

								html: this.getMessage(groupList[i])
							})
						]
					}),
					propCont: BX.create("DIV", {
						attrs: {id: groupList[i] + "_section"},
						props: {
							className: "designer-group-container"
						}
					})
				};

				tabDiv.appendChild(this.groups[groupList[i]].tab);

				if (i == 0)
					this.activeGroupId = groupList[i];
			}


		},

		showGroup: function (gid)
		{
			if (this.groups[this.activeGroupId].propCont.parentNode)
			{
				BX.removeClass(this.groups[this.activeGroupId].tab, "designer-tab-active");
				this.container.removeChild(this.groups[this.activeGroupId].propCont);
			}
			this.activeGroupId = gid;
			this.container.appendChild(this.groups[gid].propCont);
			BX.addClass(this.groups[gid].tab, "designer-tab-active");
		},

		setSaved: function (status)
		{
			this.saved = status;
			BX.onCustomEvent("onEditorConfigSaved", [
				{'status': status}
			]);
		},

		getSaved: function ()
		{
			return this.saved;
		},

		createControl: function (param, id)
		{
			var control = BX.Mobile.ControlsFactory.getControl({
				id: id,
				params: param,
				langs: this.map.lang,
				picker: this.picker,
				imageDialog: this.imager
			});
			control.setOnChangeHandler(BX.proxy(function (name, value)
			{

				this.setSaved(false);
				if (value == "")
				{
					delete this.config[name];
				}
				else
				{
					this.config[name] = value;
				}

				BX.onCustomEvent("onEditorConfigChanged", [
					{id: name, value: value}
				]);

			}, this));

			return control;
		},
		jumpToControl: function (controlId, additionalControlIds)
		{
			var pathComponents = controlId.split("/");
			if (pathComponents[0] != this.viewer.editor.activeGroupId)
				this.viewer.editor.showGroup(pathComponents[0]);

			var control = this.viewer.editor.controlList[controlId];
			var section = BX(pathComponents[0] + "_section");
			var pos = BX.pos(control.displayElement, true);
			var offset = 200;
			var _that = this;
			var animation = new BX.fx({
				start: section.scrollTop,
				finish: pos.top - offset,
				type: "deccelerated",
				time: 0.3,
				step: 0.005,
				callback: function (value)
				{
					section.scrollTop = value;
				},
				callback_complete: function ()
				{
					control.highlight(control.displayElement.parentNode, [199, 219, 125]);
					control.startChoose();

					if (additionalControlIds && additionalControlIds.length > 0)
					{
						for (var i = 0; i < additionalControlIds.length; i++)
						{
							var addControl = _that.viewer.editor.controlList[additionalControlIds[i]];
							addControl.highlight(addControl.displayElement.parentNode, [199, 219, 125]);
						}

					}

				}

			});
			animation.start();
		},
		getMessage: function (key)
		{
			var messKey = key.toLowerCase().replace(new RegExp("/", 'g'), "_");
			if (this.map.lang[messKey])
				return this.map.lang[messKey];
			return key;
		}
	};
	BX.Mobile.Viewer.prototype = {
		getListElement: function ()
		{
			this.cells = [];
			var sectionCount = 4;
			var sectionNumber = 0;
			for (var i = 0; i < 20; i++)
			{

				if (sectionNumber == 0)
				{
					var sectionBack = new BX.Mobile.ViewerElement(this, {
						element: {
							position: {top: 0, left: 0},
							size: {width: 320, height: 25}
						},
						defaultValues: {"fill_mode": "stretch"},
						bindedParams: {
							"table/sections_background_color": "color"
						}
					});
					var sectionText = new BX.Mobile.ViewerElement(this, {
						element: {
							position: {top: 0, left: 0},
							size: {width: 40, height: 25}
						},
						defaultValues: {"textColor": "#dedede"},
						bindedParams: {
							"table/sections_text_color": "textColor",
							"table/sections_text_shadow_color": "textShadowColor"
						}
					});

					sectionText.setText("A");
					sectionText.setTextSize(12);

					var section = BX.create("DIV", {
						props: {
							className: ""
						},
						style: {
							width: "320px",
							height: "25px",
							position: "relative"
						},
						children: [
							sectionBack.canvasElement,
							sectionText.canvasElement
						]
					});

					this.cells.push(section);
				}

				var cellBack = new BX.Mobile.ViewerElement(this, {
					element: {
						position: {top: 0, left: 0},
						size: {width: 320, height: 50}
					},
					defaultValues: {"fill_mode": "stretch", "height": 50},
					bindedParams: {
						"table/cell_background/color": "color",
						"table/row_height": "height",
						"table/cell_background/image": "image"
					}
				});


				var cellText = new BX.Mobile.ViewerElement(this, {
					element: {
						position: {top: 10, left: 40},
						size: {width: 50, height: 20}
					},
					type: "cellText",
					text: "Title",
					textPosition: {y: "center", x: 0},
					bindedParams: {
						"table/cell_text_color": "textColor",
						"table/cell_text_shadow_color": "textShadowColor"
					}
				});
				cellText.type = "cellText";

				var detailText = new BX.Mobile.ViewerElement(this, {
					element: {
						position: {top: 25, left: 40},
						size: {width: 50, height: 20}
					},
					type: "detailText",
					textSize: 8,
					textPosition: {y: "center", x: 0},
					text: "Subtitle",
					bindedParams: {
						"table/cell_detail_text_color": "textColor"
					}
				});

				cellText.setText("Title");
				detailText.setText("Subtitle");
				detailText.setTextSize(8);

				var cell = BX.create("DIV", {
					props: {
						className: "preview_cell"
					},
					style: {
						width: "320px",
						height: "50px"
					},
					children: [
						cellBack.canvasElement,
						detailText.canvasElement,
						cellText.canvasElement
					]
				});

				BX.addCustomEvent(cellBack, "onViewerElementSetSize", BX.proxy(function (size)
				{

					if (size.height >= 50)
					{
						this.style.height = size.height + "px";
					}
					else
					{
						this.style.height = "50px";
					}
				}, cell));

				this.cells.push(cell);
				sectionNumber++;
				if (sectionNumber == sectionCount)
					sectionNumber = 0;

			}

			return BX.create("DIV",
				{
					style: {
						top: "44px",
						width: "320px",
						height: "448px",
						position: "absolute",
						overflowY: "auto",
						overflowX: "hidden"
					},
					children: this.cells
				});
		},
		createTableScreen: function ()
		{

			return BX.create("DIV", {
				props: {
					className: "preview_screen"
				},
				style: {overflow: "hidden"},
				children: [
					BX.create("DIV",
						{
							children: [
								this.getTopBarElement().canvasElement,
								this.getTitleElement().canvasElement,
								this.getButtonElement().canvasElement
							]
						}),
					this.getListElement(),
					this.getToolBarElement().canvasElement

				]
			});
		},
		createMainScreen: function ()
		{

			return BX.create("DIV", {
				props: {
					className: "preview_screen"
				},
				children: [
					(new BX.Mobile.ViewerElement(this, {
						element: {
							className: "",
							size: {width: 320, height: 448},
							position: {top: 44, left: 0}
						},
						defaultValues: {
							"fill_mode": "repeat"
						},
						bindedParams: {
							"controller_settings/main_background/color": "color",
							"controller_settings/main_background/image": "image",
							"controller_settings/main_background/fill_mode": "fill_mode"
						}
					})).baseElement,
					this.getTopBarElement().baseElement,
					this.getTitleElement().baseElement,
					this.getBackButtonElement().baseElement,
					this.getButtonElement().baseElement,
					this.getToolBarElement().baseElement

				]
			});
		},
		createLoadScreen: function ()
		{
			return BX.create("DIV", {
				props: {
					className: "preview_screen"
				},
				children: [
					(new BX.Mobile.ViewerElement(this, {
						element: {
							className: "",
							size: {width: 320, height: 448},
							position: {top: 44, left: 0}
						},
						defaultValues: {
							"fill_mode": "repeat"
						},
						bindedParams: {
							"controller_settings/loading_background/color": "color",
							"controller_settings/loading_background/image": "image",
							"controller_settings/loading_background/fill_mode": "fill_mode"
						}
					})).baseElement,
					this.getTopBarElement().baseElement,
					this.getTitleElement().baseElement,
					this.getBackButtonElement().baseElement,
					this.getButtonElement().baseElement,
					this.getToolBarElement().baseElement

				]
			});
		},
		getButtonElement: function ()
		{
			return new BX.Mobile.ViewerElement(this, {
				element: {
					className: "preview_button preview_button_right",
					position: {top: 0, left: 0},
					size: {width: 70, height: 30}
				},
				text: "Button",
				defaultValues: {"fill_mode": "stretch", textColor: "#ffffff"},
				bindedParams: {
					"buttons/type": "",
					"buttons/text_color": "textColor",
					"buttons/main_background_image": "image"
				}

			});
		},
		getBackButtonElement: function ()
		{
			var backButton = new BX.Mobile.ViewerElement(this, {
				element: {
					className: "preview_button preview_button_back",
					position: {top: 0, left: 0},
					size: {width: 35, height: 30}
				},
				text: "",
				defaultValues: {"fill_mode": "stretch", textColor: "#ffffff"},
				bindedParams: {
					"buttons/type": "buttonTypes",
					"buttons/default_back_button": "backType",
					"buttons/text_color": "textColor",
					"buttons/main_background_image": "image"
				}

			});

			backButton._customHandle = BX.proxy(function (param, value)
			{
				if (param == "buttonTypes")
				{
					var foundBackIcon = false;
					for (var key in value)
					{
						if (key == "back")
						{
							if (backButton.valuesSet["backType"] == "back")
							{
								foundBackIcon = true;
								backButton.valuesSet["image"] = value[key];
								backButton.valuesSet["backImage"] = value[key];
								backButton.handleParameter("image", value[key]);
								break;
							}
						}
					}
				}

				if (param == "backImage" && backButton.valuesSet["backType"] == "back")
				{

				}

				if (param == "backType")
				{
					if (value == "default")
					{
						backButton.valuesSet["width"] = 60;
						backButton.text = "< " + BX.message("MOBILEAPP_BACK");
						backButton.handleParameter("width", 60);
					}
					else if (value == "back_text")
					{
						backButton.valuesSet["width"] = 60;
						backButton.text = BX.message("MOBILEAPP_BACK");
						backButton.handleParameter("width", 60);
					}
					else
					{
						backButton.valuesSet["width"] = 35;
						backButton.text = "";
						backButton.handleParameter("width", 35);
						if (typeof this.editor.config != "undefined")
						{
							if (this.editor.config["buttons/type"] && this.editor.config["buttons/type"]["back"])
							{
								backButton.defaultValues["backImageId"] = this.editor.config["buttons/type"]["back"];
								this.handleParameter()
							}
						}
					}
				}

			}, this);

			return backButton;
		},
		getTitleElement: function ()
		{
			return new BX.Mobile.ViewerElement(this, {
				element: {
					position: {top: 0, left: 105},
					size: {width: 110, height: 44}
				},
				text: BX.message("MOBILEAPP_TITLE"),
				textSize: 12,
				defaultValues: {"fill_mode": "stretch", textColor: "#dedede"},
				bindedParams: {
					"controller_settings/title_color": "textColor"
				}

			});
		},
		getTopBarElement: function ()
		{
			return new BX.Mobile.ViewerElement(this, {
				element: {
					className: "preview_bar",
					size: {width: 320, height: 44},
					position: {top: 0, left: 0}
				},
				defaultValues: {"fill_mode": "stretch"},
				bindedParams: {
					"controller_settings/navigation_bar_background/color": "color",
					"controller_settings/navigation_bar_background/image": "image"
				}
			});
		},
		getToolBarElement: function ()
		{
			return new BX.Mobile.ViewerElement(this, {
				element: {
					className: "preview_bottom_bar",
					size: {width: 320, height: 44},
					position: {bottom: 0}
				},
				bindedParams: {
					"controller_settings/toolbar_background/color": "color",
					"controller_settings/toolbar_background/image": "image"
				}
			});
		},
		setConfig: function (config)
		{
			this.config = config;
			BX.onCustomEvent(this, "onViewerNewConfigSet", [config]);
		},
		addScreen: function (code, name, screen)
		{
			this.screens[code] = screen;
			this.screenList.push(code);
			this.screenView.appendChild(screen);

			var option = BX.create("OPTION", {
				html: name,
				attrs: {
					value: code,
					id: code
				}
			});

			this.selectScreens.appendChild(option);
		},
		jumpToScreen: function (value)
		{
			var animation = new BX.fx({
				start: this.screenView.scrollTop,
				finish: this.screenList.indexOf(value) * 536,
				type: "accelerated",
				time: 0.3,
				step: 0.005,
				callback: BX.proxy(function (value)
				{
					this.screenView.scrollTop = value;
				}, this),
				callback_complete: function ()
				{

				}

			});
			animation.start();
		},
		init: function ()
		{
			this.screenView = BX.create("DIV", {
				props: {
					className: "preview_view"
				}
			});
			this.viewerWrapper = BX.create("DIV", {
				props: {
					className: "designer-editor-wrap preview_viewer_wrapper"
				}
			});
			this.viewerWrapper.appendChild(BX.create("DIV", {
				props: {
					className: "preview_hint"
				},
				html: BX.message("MOBILEAPP_PREVIEW_HINT")
			}));
			this.viewerWrapper.appendChild(this.screenView);

			this.container.appendChild(BX.create("SPAN", {
				props: {
					className: "adm-select-wrap"
				},
				children: [
					this.selectScreens = BX.create("SELECT", {
//						attrs:{size:4},
						props: {className: "adm-workarea adm-select"},
						events: {
							"change": BX.proxy(function (e)
							{
								var element = e.target;
								this.jumpToScreen(element.value);
							}, this)
						}
					})
				]
			}));
			this.container.appendChild(this.viewerWrapper);

			this.screens = {};
			this.screenList = [];

			this.addScreen("main", BX.message("MOBILEAPP_PREVIEW_MAIN"), this.createMainScreen());
			this.addScreen("load", BX.message("MOBILEAPP_PREVIEW_LOAD"), this.createLoadScreen());
			this.addScreen("table", BX.message("MOBILEAPP_PREVIEW_LISTS"), this.createTableScreen());


		}
	};

	/**
	 * ..............................
	 * ------------------------------
	 * Viewer elements --------------
	 * ------------------------------
	 * ..............................
	 */
	BX.Mobile.ViewerElement.prototype = {
		setBaseElement: function (element)
		{
			this.baseElement = this.canvasElement = BX.create("CANVAS", {
				props: {
					className: "preview_element" + ((element.className) ? " " + element.className : "")
				},
				style: {
					position: "absolute",
					top: element.position.top + "px",
					left: element.position.left + "px",
					bottom: element.position.bottom + "px",
					right: element.position.right + "px"
				},
				attrs: {
					width: element.size.width + "px",
					height: element.size.height + "px"

				},
				events: {
					click: BX.proxy(function ()
					{

						var except = ["fill_mode"];
						var priority = {
							"color": 3,
							"image": 2,
							"textColor": 1,
							"textShadowColor": 0
						};
						var jumpToParam = "";
						var configKey = "";
						var configKeys = [];
						for (var keyParam in this.bindedParameters)
						{
							configKeys.push(keyParam);
							var param = this.bindedParameters[keyParam];

							if (!jsUtils.in_array(param, except))
							{

								if (jumpToParam)
								{
									if (this.valuesSet[param] && this.valuesSet[jumpToParam] && priority[jumpToParam] > priority[param])
										continue;
									configKey = keyParam;
									jumpToParam = param;
								}
								else
								{
									configKey = keyParam;
									jumpToParam = param;
								}

							}

						}


						if (keyParam)
						{
							this.viewer.editor.jumpToControl(configKey, configKeys);
						}


					}, this)
				}
			});
		},
		setText: function (text)
		{
			this.text = text;
		},
		setTextSize: function (size)
		{
			this.textSize = size;
		},
		createNode: function (className)
		{
			if (typeof this["_createNode"] === 'function')
				this._createNode(className);
		},
		isBackgroundNeeded: function ()
		{
			var watchedImage = jsUtils.in_array("image", this.watched);
			var watchedColor = jsUtils.in_array("color", this.watched);
			var valueColor = this.valuesSet["color"];
			var valueImage = this.valuesSet["image"];
			return !((!watchedImage && !watchedColor)
			|| (watchedImage && watchedColor && (valueColor || valueImage))
			|| (watchedImage && valueImage)
			|| (watchedColor && valueColor));


		},
		bindParameter: function (configParamName, propertyName)
		{
			this.bindedParameters[configParamName] = propertyName;
			var paramValue = this.viewer.config[configParamName] || this.defaultValues[propertyName];

			if (paramValue)
			{
				this.handleParameter(propertyName, paramValue);
			}

			this.watched.push(propertyName);
		},
		customHandle: function (param, value, isRedraw)
		{
			if ((typeof this["_customHandle"]) == "function")
				this._customHandle(param, value, isRedraw);
		},
		handleParameter: function (param, value)
		{

			this.valuesSet[param] = value;
			this.delayedParamData = {
				param: param,
				value: value
			};
			clearTimeout(this.applyTimeout);
			this.applyTimeout = setTimeout(BX.proxy(function ()
			{
				this.apply();
				this.applyTimeout = 0;
			}, this), 200);


		},
		getParamValue: function (code)
		{
			if (this.valuesSet[code])
				return this.valuesSet[code];
			if (this.defaultValues[code])
				return this.defaultValues[code];

			return false;
		},
		apply: function ()
		{
			BX.onCustomEvent(this, "onApply", [this.valuesSet]);


			var canvas = this.canvasElement;
			var context = canvas.getContext('2d');
			context.clearRect(0, 0, canvas.width, canvas.height);
			this.setSize();
			if (!this.drawColor())
			{
				if (!this.drawImage())
					this.drawText();
			}

			this.customHandle();


			this.isEmpty = (this.isBackgroundNeeded() || (jsUtils.in_array("textColor", this.watched) && !this.valuesSet["textColor"]));

			if (this.isEmpty)
			{
				this.drawEmpty();
			}
		},

		setSize: function ()
		{
			var width = this.getParamValue("width");
			var height = this.getParamValue("height");
			if (width)
				this.canvasElement.width = parseInt(width);
			if (height)
			{
				this.canvasElement.height = parseInt(height);
			}

			BX.onCustomEvent(this, "onViewerElementSetSize", [
				{
					width: width,
					height: height
				}
			])
		},
		drawText: function ()
		{
			if (this.text.length > 0)
			{
				var canvas = this.canvasElement;
				var context = canvas.getContext('2d');
				var color = this.getParamValue("textColor");
				var shadow = this.getParamValue("textShadowColor");
				context.fillStyle = (color) ? color : "#dedede";
				context.font = "bold " + this.textSize + "pt Helvetica";
				if (shadow)
				{
					context.shadowOffsetY = 1;
					context.shadowOffsetX = 1;
					context.shadowColor = shadow;
					context.shadowBlur = 1;
				}
				else
				{
					context.shadowOffsetY = 0;
					context.shadowOffsetX = 0;
					context.shadowBlur = 0;
				}

				var x = 0;
				var y = 0;
				if (this.textPosition.x)
				{
					context.textAlign = 'center';
					x = (this.textPosition.x == "center") ? canvas.width / 2 : parseInt(this.textPosition.x);
				}

				if (this.textPosition.y)
				{
					y = (this.textPosition.y == "center") ? (canvas.height + this.textSize) / 2 : parseInt(this.textPosition.y);
				}

				context.fillText(this.text, x, y);

				return true;
			}


			return false;
		},
		drawEmpty: function ()
		{
			var canvas = this.canvasElement;
			var context = canvas.getContext('2d');
			var squareHeight = 20;
			var countH = Math.round(canvas.width - 4 / squareHeight);
			var countV = Math.round(canvas.height - 4 / squareHeight);
			var x = squareHeight;
			var y = squareHeight;


			context.shadowOffsetY = 0;
			context.shadowOffsetX = 0;
			context.shadowBlur = 0;
			context.strokeStyle = "#f0f0f0";
			context.beginPath();

			for (var i = 0; i < countH; i++)
			{
				context.moveTo(x, 2);
				context.lineTo(x, canvas.height - 2);
				x = x + squareHeight;
			}

			for (var j = 0; j < countV; j++)
			{
				context.moveTo(2, y);
				context.lineTo(canvas.width - 2, y);
				y = y + squareHeight;
			}

			context.stroke();
			context.closePath();

			context.shadowOffsetY = 0;
			context.shadowOffsetX = 0;
			context.shadowBlur = 0;
			context.strokeStyle = "#c4c4c4";
			context.beginPath();
			context.moveTo(2, 2);
			context.lineTo(canvas.width - 2, 2);
			context.lineTo(canvas.width - 2, canvas.height - 2);
			context.lineTo(2, canvas.height - 2);
			context.lineTo(2, 2);
			context.stroke();
			context.closePath();
		},
		drawColor: function ()
		{
			var color = this.getParamValue("color");
			if (color)
			{

				var canvas = this.canvasElement;
				var context = canvas.getContext('2d');
				context.rect(0, 0, this.canvasElement.width, this.canvasElement.height);
				context.fillStyle = color;
				context.fill();

				return true;
			}

			return false;
		},
		drawImage: function ()
		{
			var canvas = this.canvasElement;
			var context = canvas.getContext('2d');
			var image = this.getParamValue("image");
			if (image)
			{
				var imageObj = new Image();
				context.clearRect(0, 0, canvas.width, canvas.height);
				var src = this.viewer.editor.imager.getSrcByID(image);
				if (src == "")
					return;

				imageObj.fillMode = this.getParamValue("fill_mode");
				BX.bind(imageObj, "load", function ()
				{
					if (this.fillMode == "crop")
					{
						var aspectRatio = imageObj.naturalWidth / imageObj.naturalHeight;
						var diff = canvas.width / canvas.height - aspectRatio;
						var width = (diff > 0) ? canvas.width : Math.round(canvas.height * aspectRatio);
						var height = (diff > 0) ? Math.round(canvas.width / aspectRatio) : canvas.height;

						var y = height - canvas.height;
						var x = width - canvas.width;
						context.drawImage(imageObj, -x / 2, -y / 2, width, height);
					}
					else if (this.fillMode == "stretch")
					{
						context.drawImage(imageObj, 0, 0, canvas.width, canvas.height);
					}
					else
					{
						var pat = context.createPattern(imageObj, "repeat");
						context.rect(0, 0, canvas.width, canvas.height);
						context.fillStyle = pat;
						context.fill();
					}

				});

				BX.bind(imageObj, "load", BX.proxy(function ()
				{
					this.drawText();
				}, this));

				imageObj.src = src;
			}

		},
		onParameterValueChanged: function (data)
		{
			var param = data.id;
			var value = data.value;

			if (this.bindedParameters[param])
			{
				this.handleParameter(this.bindedParameters[param], value)
			}
		},
		redrawElement: function ()
		{
			this.valuesSet = {};
			this.canvasElement.getContext('2d').clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
			BX.onCustomEvent(this, "onRedraw", [this.defaultValues]);
			for (var param in this.bindedParameters)
			{
				var value = this.viewer.config[param];
				if (value)
					this.valuesSet[this.bindedParameters[param]] = value;
			}
			this.apply();
		},
		init: function ()
		{
			this.createNode();
		}

	};

	/**
	 * ..............................
	 * ------------------------------
	 * Editor controls ----------
	 * ------------------------------
	 * ..............................
	 */
	BX.Mobile.Controls.Base.prototype = {
		setValue: function (value, fireChange, setValue)
		{
			this.value = value;
			if ((typeof setValue) == "undefined" || setValue == true)
			{
				if (typeof this["_setValue"] == "function")
					this._setValue(value);
			}

			if (fireChange || false)
				this.changeListener(this.id, value);

		},
		getInput: function ()
		{
			if (typeof this["_getInput"] == "function")
				return this._getInput();
			return this.input;
		},
		getDisplayElement: function ()
		{
			if (this.displayElement)
				return this.displayElement;
			if (typeof this["_getDisplayElement"] == "function")
				return this._getDisplayElement();
			else
				console.error("Can't get display element", this);

		},
		setOnChangeHandler: function (func)
		{
			this.changeListener = func;
		},
		highlight: function (node, rbgColor)
		{
			(new BX.fx({
				start: 0.0,
				finish: 30.0,
				step: 0.005,
				type: "accelerated",
				time: .2,
				callback: function (value)
				{
					node.style.backgroundColor = "rgba(" + rbgColor[0] + "," + rbgColor[1] + "," + rbgColor[2] + "," + value / 100 + ")"
				},
				callback_start: function ()
				{

				},
				callback_complete: function ()
				{
					(new BX.fx({
						start: 30.0,
						finish: 0.0,
						step: 0.005,
						type: "deccelerated",
						time: 0.8,
						callback: function (value)
						{
							node.style.backgroundColor = "rgba(" + rbgColor[0] + "," + rbgColor[1] + "," + rbgColor[2] + "," + value / 100 + ")"
						},
						callback_start: function ()
						{

						},
						callback_complete: function ()
						{
							node.style.backgroundColor = "ffffff";
						}
					})).start();
				}
			})).start();
		},
		getMessage: function (key)
		{
			var messKey = key.toLowerCase().replace(new RegExp("/", 'g'), "_");
			if (this.langs[messKey])
				return this.langs[messKey];
			return key;
		}

	};
	for (var control in BX.Mobile.Controls)
	{
		if (control.toString() != "Base")
			BX.extend(BX.Mobile.Controls[control], BX.Mobile.Controls.Base);
	}

	BX.Mobile.Tools.extendProto(BX.Mobile.Controls.MultiImage, {
		onCreate: function ()
		{
			this.values = {};
			this.items = {};
			BX.addCustomEvent("onAppFileListGot", BX.proxy(function ()
			{
				this.setValue(this.values, false);
			}, this));
		},
		_getDisplayElement: function ()
		{

			this.displayElement = BX.create("DIV", {
				children: [
					this.itemsNode = BX.create("DIV", {
						props: {
							className: "designer-multi-image-container"
						},
						attrs: {
							id: this.id
						}
					}),
					this.button = BX.create("INPUT", {
						events: {
							"click": BX.proxy(function ()
							{
								this.imager.open(this);
							}, this)
						},
						attrs: {
							type: "button",
							value: BX.message("MOBILEAPP_ADD_IMAGE")
						}
					})
				]
			});

			return this.displayElement;
		},
		_setValue: function (value)
		{

			if (typeof value == "object")
				this.values = value;
			else
				this.values = {};
//			this.items = {};
//			this.itemsNode.innerHTML = "";

			for (var code in this.items)
			{
				if (!this.values[code])
				{
					this.items[code]["element"].parentNode.removeChild(this.items[code]["element"]);
					delete this.items[code];
				}
			}

			for (var imgCode in this.values)
			{
				this.addItem(imgCode, this.values[imgCode])
			}
		},
		getDefaultCode: function ()
		{
			var number = 1;
			var prefix = "type";
			var code = prefix + number;
			var continueSearch = true;
			while (continueSearch)
			{
				continueSearch = false;
				for (var key in this.values)
				{
					if (key == code)
					{
						code = prefix + (++number);
						continueSearch = true;
						break;
					}
				}
			}

			return code;
		},
		addItem: function (code, id)
		{
			if (code == false)
				code = this.getDefaultCode();
			if (!this.items[code])
			{

				this.items[code] = {
					"img": BX.create("IMG", {
						props: {
							className: "designer-multi-img"
						},
						attrs: {
							src: this.imager.getSrcByID(id, true)
						}
					}),
					"input": BX.create("INPUT", {
						props: {
							className: "type-text"
						},
						attrs: {
							"data-code": code,
							value: code
						},
						events: {
							"keyup": BX.proxy(function (e)
							{
								if (e.keyCode == 13)
								{
									if (this.save(e.target))
										e.target.blur();
								}
							}, this),
							"blur": function (e)
							{
								var element = e.target;
								var code = element.getAttribute("data-code");
								var newCode = element.value;
								if (code != newCode)
								{
									element.value = code;
								}
							},
							"change": BX.proxy(function (e)
							{
								this.save(e.target);

							}, this)
						}
					})
				};

				var _that = this;
				this.items[code]["element"] = BX.create("DIV", {
					props: {
						className: "designer-multi-image-item"
					},
					events: {
						"mouseover": function ()
						{
							BX.addClass(this, "designer-multi-image-item-hover");
						},
						"mouseout": function ()
						{
							BX.removeClass(this, "designer-multi-image-item-hover");
						}
					},
					children: [
						BX.create("DIV", {
							props: {
								className: "designer-multi-image-item-left"
							},
							children: [
								this.items[code]["img"]
							]
						}),
						BX.create("DIV", {
							props: {
								className: "designer-multi-image-item-right"
							},
							children: [
								this.items[code]["input"],
								BX.create("DIV",
									{
										props: {
											className: "designer-multi-image-remove-button"
										},
										events: {
											"click": BX.proxy(function ()
											{
												var code = this.input.getAttribute("data-code");
												delete _that.values[code];
												_that.setValue(_that.values, true)

											}, this.items[code])
										}

									})
							]
						})

					]
				});

				this.itemsNode.appendChild(this.items[code]["element"]);
			}
			else
			{
				this.items[code]["img"].src = this.imager.getSrcByID(id, true);
				this.items[code]["input"].value = code;
			}

			return this.items[code];

		},
		save: function (item)
		{
			var element = item;
			var code = element.getAttribute("data-code");
			var current = this.values[code];
			var newCode = element.value;

			if (newCode == "")
			{
				this.highlight(element, [255, 0, 0]);
				return false;
			}
			else if (this.items[newCode] && code != this.items[newCode].input.getAttribute("data-code"))
			{
				this.highlight(this.items[newCode].input, [255, 0, 0]);
				this.highlight(element, [255, 0, 0]);
				return false;
			}

			if (code != element.value)
			{
				delete this.values[code];
				this.values[element.value] = current;
				this.items[element.value] = this.items[code];
				delete this.items[code];
				this.setValue(this.values, true);
				element.setAttribute("data-code", element.value);
				this.highlight(element, [34, 139, 34]);
			}


			return true;
		},
		onImageChosen: function (data)
		{
			var code = this.getDefaultCode();
			this.values[code] = data.id;
			var item = this.addItem(code, data.id);
			this.setValue(this.values, true);
			item.input.focus();
			item.input.select();
		}
	});
	BX.Mobile.Tools.extendProto(BX.Mobile.Controls.Image, {
		onImageChosen: function (data)
		{
			this.setValue(data.id, true);
		}
	});
	BX.Mobile.Tools.extendProto(BX.Mobile.Controls.Color, {
		_setValue: function (value)
		{
			this.input.value = value;
			this.colorBox.style.background = value;

			if (value == "")
				BX.hide(this.deleteButton);
			else
				BX.show(this.deleteButton);

		},
		_getDisplayElement: function ()
		{
			this.input = BX.create("INPUT", {
				props: {
					className: "designer-simple-string"
				},
				attrs: {
					type: "text",
					id: this.id,
					placeholder: "#FFFFFF"
				}
			});
			BX.addClass(this.input, "color-input");
			this.colorBox = BX.create("SPAN", {
				props: {
					className: "color-square"
				}
			});

			this.displayElement = BX.create("SPAN", {
				attrs: {
					id: "wrap-" + this.id
				},
				props: {
					className: "designer-input-wrap"
				},
				children: [

					BX.create("DIV", {
						props: {
							className: "designer-color-wrap"
						},
						children: [
							this.input, this.colorBox
						]
					}),
					this.deleteButton = BX.create("SPAN",
						{
							props: {
								className: "designer-color-button-delete"
							},
							events: {
								"click": BX.proxy(function ()
								{
									this.setValue("", true);

								}, this)
							}

						})
				]
			});
			var clickHandler = BX.proxy(function (e)
			{
				var element = e.target;
				element.parentNode.appendChild(this.picker.pCont);
				this.picker.oPar.OnSelect = BX.proxy(function (color)
				{
					element.value = color;
					this.colorBox.style.background = color;
					this.setValue(color, true);
				}, this);

				this.picker.Close();
				this.picker.Open(element);

			}, this);


			BX.bind(this.input, 'click', clickHandler);
			BX.bind(this.colorBox, 'click', clickHandler);

			var changeColorHandler = BX.proxy(function (e)
			{
				var element = e.target;
				if (element.oldValue == element.value)
					return;
				element.oldValue = element.value;
				if (element.value == "")
				{
					this.deleteButton.style.display = "none";
				}
				else
				{
					this.deleteButton.style.display = "inline-block";
				}
				this.colorBox.style.background = element.value;
				this.changeListener(this.id, element.value);
			}, this);
			BX.bind(this.input, "focus", function (e)
			{
				var input = e.target;
				input.oldValue = input.value;
			});
			BX.bind(this.input, 'blur', changeColorHandler);
			BX.bind(this.input, 'keyup', changeColorHandler);

			return this.displayElement;
		}
	});

})();



