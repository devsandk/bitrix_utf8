/**
 * Classes
 * BX.Scale.ActionsParamsTypes.Proto
 * BX.Scale.ActionsParamsTypes.String
 * BX.Scale.ActionsParamsTypes.Checkbox
 * BX.Scale.ActionsParamsTypes.Dropdown
 */

 ;(function(window) {

	if (BX.Scale.ActionsParamsTypes) return;
		BX.Scale.ActionsParamsTypes = {};

	/**
	 * Class BX.Scale.ActionsParamsTypes.Proto
	 * Abstract class for user params.
	 * @param paramId
	 * @param params
	 * @constructor
	 */
	BX.Scale.ActionsParamsTypes.Proto = {

		init: function(paramId, params)
		{
			this.id = paramId;
			this.domNodeId = "action_user_param_"+paramId;
			this.domNode = null;
			this.name = params.NAME;
			this.defaultValue = params.DEFAULT_VALUE;
			this.required = params.REQUIRED;
			this.type = params.TYPE
		},

		/**
		 * Absract function generates HTML for UI
		 */

		/**
		 * Absract function generates DOM node
		 */
		createDomNode: function(){},

		/**
		 *  @returns {domNode}
		 */
		getDomNode: function()
		{
			return this.domNode;
		},

		/**
		 * Function returns entered by user value
		 */
		getValue: function()
		{
			var result = false;

			if(this.domNode && this.domNode.value !== undefined)
				result = this.domNode.value

			return result;
		}
	};

	/**
	 * Class BX.Scale.ActionsParamsTypes.String
	 */

	BX.Scale.ActionsParamsTypes.String = function(paramId, params)
	{
		this.init(paramId, params);

		this.createDomNode = function()
		{
			var type = this.type == "PASSWORD" ? "password" : "text";

			this.domNode = BX.create('INPUT', {props: {id: this.domNodeId, name: this.domNodeId, type: type}});

			if(this.defaultValue !== undefined)
				this.domNode.value = this.defaultValue;

			if(this.required !== undefined && this.required == "Y")
			{
				var _this = this;
				this.domNode.onkeyup = this.domNode.oninput = this.domNode.onpaste = this.domNode.oncut = this.domNode.onblur = function(e){
					var empty = _this.isEmpty();
					BX.onCustomEvent("BXScaleActionParamKeyUp", [{paramId: _this.id, empty: empty }]);
				}
			}
		};

		this.isEmpty = function()
		{
			return (this.domNode.value.length <= 0);
		};

		this.createDomNode();
	};

	BX.Scale.ActionsParamsTypes.String.prototype = BX.Scale.ActionsParamsTypes.Proto;

	/**
	 * Class BX.Scale.ActionsParamsTypes.Checkbox
	 */
	BX.Scale.ActionsParamsTypes.Checkbox = function(paramId, params)
	{
		this.init(paramId, params);
		this.checked = params.CHECKED == "Y" || this.defaultValue == "Y";
		this.string = params.STRING || "";

		this.createDomNode = function()
		{
			this.domNode = BX.create('INPUT', {props: {id: this.domNodeId, name: this.domNodeId, type: 'checkbox', checked: this.checked}});
		};

		this.getValue = function()
		{
			var domNode = BX(this.domNodeId),
				result = false;

			if(domNode && domNode.checked !== undefined)
				result = domNode.checked ? this.string : "";

			return result;
		};

		this.createDomNode();
	};

	BX.Scale.ActionsParamsTypes.Checkbox.prototype = BX.Scale.ActionsParamsTypes.Proto;

	/**
	 * Class BX.Scale.ActionsParamsTypes.Dropdown
	 */
	BX.Scale.ActionsParamsTypes.Dropdown = function(paramId, params)
	{
		this.init(paramId, params);
		this.values = params.VALUES;

		this.createDomNode = function()
		{
			this.domNode = BX.create('SELECT', {props: {id: this.domNodeId, name: this.domNodeId}});

			for(var i in this.values)
			{
				var oOption = BX.create('OPTION');
				oOption.appendChild(document.createTextNode(this.values[i]));
				oOption.setAttribute("value", i);

				if (this.defaultValue)
				{
					oOption.defaultSelected = true;
					oOption.selected = true;
				}

				this.domNode.appendChild(oOption);
			}
		};

		this.getValue = function()
		{
			var result = false;

			if (this.domNode.selectedIndex != -1)
				result = this.domNode.options[this.domNode.selectedIndex].value;

			return result;
		};

		this.createDomNode();
	};

	BX.Scale.ActionsParamsTypes.Dropdown.prototype = BX.Scale.ActionsParamsTypes.Proto;

	/**
	 * Class BX.Scale.ActionsParamsTypes.Text
	 */

	BX.Scale.ActionsParamsTypes.Text = function(paramId, params)
	{
		this.init(paramId, params);

		this.createDomNode = function()
		{
			this.domNode = BX.create('DIV');
			this.textNode = BX.create('SPAN', {html: this.defaultValue});
			this.inputNode = BX.create('INPUT', {props: {id: this.domNodeId, name: this.domNodeId, type: "hidden"}});

			if(this.defaultValue !== undefined)
				this.inputNode.value = this.defaultValue;

			this.domNode.appendChild(this.inputNode);
			this.domNode.appendChild(this.textNode);
		};

		this.getValue =  function()
		{
			var result = false;

			if(this.inputNode && this.inputNode.value !== undefined)
				result = this.inputNode.value

			return result;
		}

		this.createDomNode();
	};

	BX.Scale.ActionsParamsTypes.Text.prototype = BX.Scale.ActionsParamsTypes.Proto;

})(window);