if(!window.IBlockComponentProperties)
{
	window.IBlockComponentProperties = function(arParams)
	{
		window.IBlockComponentPropertiesObj.ShowMenu(arParams);
	}

	window.IBlockComponentPropertiesObj =
	{
		ShowMenu: function(arParams)
		{
			if(arParams.data.substr(0, 3) == '[\\\'')
				arParams.data = arParams.data.replace(/\\'/g, '\'');
			var menu = eval(arParams.data);

			var oButton = document.createElement("INPUT");
			oButton.setAttribute('type', 'button');
			oButton.value = '...';
			arParams.oCont.insertBefore(oButton, arParams.oCont.firstChild);
			oButton.onclick = function()
			{
				var pos = window.IBlockComponentPropertiesObj.GetRealPos(oButton);
				setTimeout(function(){window.IBlockComponentPropertiesObj[menu[0]].PopupShow(pos)}, 10);
			}

			var oInput = document.createElement("INPUT");
			oInput.setAttribute('type', 'text');
			oInput.setAttribute('size', '30');
			oInput.setAttribute('id', menu[0] + '_input');
			oInput.value = arParams.oInput.value;
			arParams.oCont.insertBefore(oInput, arParams.oCont.firstChild);
			oInput.onchange = function()
			{
				arParams.oInput.value = oInput.value;
				if(arParams.oInput.onchange)
					arParams.oInput.onchange();
			}
			oInput.onblur = function()
			{
				arParams.oInput.value = oInput.value;
				if(arParams.oInput.onchange)
					arParams.oInput.onchange();
			}

			window.IBlockComponentPropertiesObj[menu[0]] = new PopupMenu(menu[0], menu[1]);
			window.IBlockComponentPropertiesObj[menu[0]].SetItems(menu[2]);
		},

		Action: function(id, menu_id)
		{
			var mnu_list = window.IBlockComponentPropertiesObj[menu_id];
			var obj_ta = document.getElementById(menu_id + '_input');
			obj_ta.focus();
			obj_ta.value += id;
			mnu_list.PopupHide();
			obj_ta.focus();
		},

		GetRealPos: function(el)
		{
			if(!el || !el.offsetParent)
				return false;

			var res = Array();
			res["left"] = el.offsetLeft;
			res["top"] = el.offsetTop;
			var objParent = el.offsetParent;

			while(objParent && objParent.tagName != "BODY")
			{
				res["left"] += objParent.offsetLeft;
				res["top"] += objParent.offsetTop;
				objParent = objParent.offsetParent;
			}

			objParent = el.parentNode;
			while(objParent && objParent.tagName != "BODY")
			{
				res["top"] -= objParent.scrollTop;
				objParent = objParent.parentNode;
			}

			res["right"] = res["left"] + el.offsetWidth;
			res["bottom"] = res["top"] + el.offsetHeight;

			return res;
		}
	}
}