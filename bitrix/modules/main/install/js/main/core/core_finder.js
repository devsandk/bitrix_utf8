(function(window) {

if (BX.Finder)
	return;

BX.Finder = function(container, context, panels, lang)
{
	BX.Finder.container = container;
	BX.Finder.context = context.toLowerCase();
	BX.Finder.panels = panels;
	BX.Finder.lang = lang;
	BX.Finder.elements = [];
	BX.Finder.mapElements = [];
	BX.Finder.searchBox = [];
	BX.Finder.searchTab = [];
	BX.Finder.searchPanel = [];
	BX.Finder.selectedProvider = {};
	BX.Finder.selectedElement = {};
	BX.Finder.selectedElements = [];
	BX.Finder.selectedType = {};
	BX.Finder.disabledId = [];
	BX.Finder.disabledElement = [];
	BX.Finder.searchTimeout = null;
	BX.Finder.loadPlace = {};
	
	if (BX.Finder.context == 'access')
	{	
		BX.Finder.elements = BX.findChildren(container, { className : "bx-finder-element" }, true);
		for (var i = 0; i < BX.Finder.elements.length; i++)
		{
			BX.Finder.mapElements[i] = BX.Finder.elements[i].getAttribute('rel');
			BX.Finder.onDisableItem(i);
		}
			
		BX.addCustomEvent(BX.Access, "onSelectProvider", BX.Finder.onSelectProvider);
		BX.addCustomEvent(BX.Access, "onDeleteItem", BX.Finder.onDeleteItem);
		BX.addCustomEvent(BX.Access, "onAfterPopupShow", BX.Finder.onAfterPopupShow);
	}
}

BX.Finder.onAddItem = function(provider, type, element)
{
	elementId = BX(element).getAttribute('rel');

	if (BX.Finder.selectedElement[elementId])
	{
		if (BX.Finder.context == 'access')
		{
			for (var i = 0; i < BX.Finder.selectedElement[elementId].length; i++)
			{
				BX.removeClass(BX.Finder.selectedElement[elementId][i], 'bx-finder-box-item-selected');
			}
			BX.Access.RemoveSelection(provider, elementId);
		}
		else
			BX.Finder.onDeleteItem({'provider': provider, 'id': elementId});

		return false;
	}

	if (!BX.Finder.selectedElement[elementId])
		BX.Finder.selectedElement[elementId] = [];

	BX.Finder.selectedElement[elementId].push(element);

	BX.addClass(element, 'bx-finder-box-item-selected');

	if (type == 1)
	{
		elementTextBox = BX.findChild(element, { className : "bx-finder-box-item-text" }, true);
	}
	else if (type == 2)
	{
		elementTextBox = BX.findChild(element, { className : "bx-finder-box-item-t2-text" }, true);
	}
	else if (type == 3)
	{
		elementTextBox = BX.findChild(element, { className : "bx-finder-box-item-t3-name" }, true);
	}
	else if (type == 4)
	{
		elementTextBox = BX.findChild(element, { className : "bx-finder-box-item-t3-name" }, true);
	}
	else if (type == 5)
	{
		elementTextBox = BX.findChild(element, { className : "bx-finder-box-item-t5-name" }, true);
	}
	else if (type == 'structure')
	{
		elementTextBox = BX.findChild(element, { className : "bx-finder-company-department-employee-name" }, true);
	}
	else if (type == 'structure-checkbox')
	{
		elementTextBox = BX.findChild(element, { className : "bx-finder-company-department-check-text" }, true);
	}
	
	if (type == 'structure-checkbox')
		elementText = elementTextBox.getAttribute('rel');
	else
		elementText = elementTextBox.innerHTML;

	if (BX.Finder.context == 'access')
		BX.Access.AddSelection({'provider': provider, 'id': elementId, 'name': elementText});

	return false;
};

BX.Finder.onDeleteItem = function(arParams)
{
	if (BX.Finder.selectedElement[arParams['id']])
	{
		for (var i = 0; i < BX.Finder.selectedElement[arParams['id']].length; i++)
		{
			BX.removeClass(BX.Finder.selectedElement[arParams['id']][i], 'bx-finder-box-item-selected');
		}
	}

	delete BX.Finder.selectedElement[arParams['id']];

	return false;
};

BX.Finder.onAfterPopupShow = function()
{
	if (BX.Finder.context == 'access')
	{			
		for (var i = 0; i < BX.Finder.mapElements.length; i++)
			BX.Finder.onDisableItem(i);

		BX.Finder.onUnDisableItem();

		BX.addCustomEvent(BX.Access, "onDeleteItem", BX.Finder.onDeleteItem);
	}
}
BX.Finder.onSelectProvider = function(arParams)
{
	if (!BX.Finder.searchBox[arParams['provider']])
		BX.Finder.searchBox[arParams['provider']] = BX.findChild(BX('access_provider_'+arParams['provider']), { tagName : "input", className : "bx-finder-box-search-textbox" }, true);

	BX.focus(BX.Finder.searchBox[arParams['provider']]);
}

BX.Finder.onDisableItem = function(mapId)
{
	element = BX.Finder.elements[mapId];
	elementId = BX.Finder.mapElements[mapId];
	if (BX.Finder.context == 'access' && BX.Access.obAlreadySelected[elementId])
	{
		if (BX.Access.showSelected)
		{
			BX.addClass(element, 'bx-finder-box-item-selected');
			if (!BX.Finder.selectedElement[elementId])
				BX.Finder.selectedElement[elementId] = [];

			BX.Finder.selectedElement[elementId].push(element);
		}
		else if (BX.util.array_search(element, BX.Finder.disabledElement) == -1)
		{
			BX.addClass(element, 'bx-finder-element-disabled');
			if (element.getAttribute('onclick') != '')
			{
				element.setAttribute('proxy_onclick', element.getAttribute('onclick'));
				element.setAttribute('onclick', '');
			}
			BX.Finder.disabledId.push(elementId);
			BX.Finder.disabledElement.push(element);
		}
	}
}

BX.Finder.onUnDisableItem = function()
{
	for (var i = 0; i < BX.Finder.disabledId.length; i++)
	{
		if (typeof(BX.Finder.disabledId[i]) == 'undefined')
			continue;
			
		if (BX.Finder.context == 'access' && !BX.Access.showSelected && BX.Access.obAlreadySelected[BX.Finder.disabledId[i]])
			continue;

		BX.removeClass(BX.Finder.disabledElement[i], 'bx-finder-element-disabled');
		BX.Finder.disabledElement[i].setAttribute('onclick', BX.Finder.disabledElement[i].getAttribute('proxy_onclick'));
		BX.Finder.disabledElement[i].setAttribute('proxy_onclick', '');
		delete BX.Finder.disabledId[i];
		delete BX.Finder.disabledElement[i];
	}
}

BX.Finder.SwitchTab = function(currentTab, bSearchFocus)
{
	var tabsContent = BX.findChildren(
		BX.findChild(currentTab.parentNode.parentNode, { tagName : "div", className : "bx-finder-box-tabs-content"}),
		{ tagName : "div" }
	);

	if (!tabsContent)
		return false;
		
	if (bSearchFocus !== false)
		bSearchFocus = true;
		
	var tabIndex = 0;
	var tabs = BX.findChildren(currentTab.parentNode, { tagName : "a" });
	for (var i = 0; i < tabs.length; i++)
	{
		if (tabs[i] === currentTab)
		{
			BX.addClass(tabs[i], "bx-finder-box-tab-selected");
			tabIndex = i;
			if (bSearchFocus && BX.hasClass(tabs[i], 'bx-finder-box-tab-search'))
				BX.focus(BX.findChild(tabs[i].parentNode.parentNode, { tagName : "input", className : "bx-finder-box-search-textbox" }, true));
		}
		else
			BX.removeClass(tabs[i], "bx-finder-box-tab-selected");
	}

	for (i = 0; i < tabsContent.length; i++)
	{
		if (tabIndex === i)
			BX.addClass(tabsContent[i], "bx-finder-box-tab-content-selected");
		else
			BX.removeClass(tabsContent[i], "bx-finder-box-tab-content-selected");
	}
	return false;
}

BX.Finder.OpenCompanyDepartment = function(provider, id, department)
{
	BX.toggleClass(department, "bx-finder-company-department-opened");

	var nextDiv = BX.findNextSibling(department, { tagName : "div"} );
	if (BX.hasClass(nextDiv, "bx-finder-company-department-children"))
		BX.toggleClass(nextDiv, "bx-finder-company-department-children-opened");

	if (!BX.Finder.loadPlace[id])
	{	
		BX.Finder.loadPlace[id] = BX.findChild(nextDiv, { className : "bx-finder-company-department-employees" });
			
		if (BX.Finder.context == 'access')
			var ajaxSendUrl = '/bitrix/tools/access_dialog.php';
		else
		{
			var ajaxSendUrl = location.href.split('#');
			ajaxSendUrl = ajaxSendUrl[0];
		}
		BX.ajax({
			url: ajaxSendUrl,
			method: 'POST',
			dataType: 'html',
			processData: true,
			data: {'mode': 'ajax', 'action' : 'structure-item', 'provider' : provider, 'item' : id, 'sessid': BX.bitrix_sessid(), 'site_id': BX.message('SITE_ID')||''},
			onsuccess: function(data)	{
				BX.Finder.loadPlace[id].innerHTML = data;
							
				newElements = BX.findChildren(BX.Finder.loadPlace[id], { className : "bx-finder-element" }, true);
				for (var i = 0; i < newElements.length; i++)
				{	
					BX.Finder.elements.push(newElements[i]);
					BX.Finder.mapElements.push(newElements[i].getAttribute('rel'));
					BX.Finder.onDisableItem(BX.Finder.mapElements.length-1);
				}
				
			},
			onfailure: function(data)	{} 
		});
	}
	
	return false;
}

BX.Finder.OpenItemFolder = function(department)
{
	BX.toggleClass(department, "bx-finder-company-department-opened");

	var nextDiv = BX.findNextSibling(department, { tagName : "div"} );
	if (BX.hasClass(nextDiv, "bx-finder-company-department-children"))
		BX.toggleClass(nextDiv, "bx-finder-company-department-children-opened");
	
	return false;
}

BX.Finder.Search = function(element, provider)
{

	if (!BX.Finder.searchTab[provider])
		BX.Finder.searchTab[provider] = BX.findChild(element.parentNode.parentNode, { className : "bx-finder-box-tab-search" }, true);
		
	BX.Finder.SwitchTab(BX.Finder.searchTab[provider], false);
	
	
	if (!BX.Finder.searchPanel[provider])
		BX.Finder.searchPanel[provider] = BX.findChild(element.parentNode.parentNode, { className : "bx-finder-box-tab-content-selected" }, true);

	if (BX.Finder.context == 'access')
		var ajaxSendUrl = '/bitrix/tools/access_dialog.php';
	else
	{
		var ajaxSendUrl = location.href.split('#');
		ajaxSendUrl = ajaxSendUrl[0];
	}
	
	clearTimeout(BX.Finder.searchTimeout);
	if (element.value != '')
	{
		BX.Finder.searchTimeout = setTimeout(function() {
			BX.Finder.searchTimeout = setTimeout(function() {
				if (BX.Finder.searchPanel[provider].innerHTML == '')
				{
					BX.Finder.searchPanel[provider].appendChild(
						BX.create('div', {	'props': {'className': 'bx-finder-search-wait', 'innerHTML': BX.Finder.lang['text-search-wait']}	})
					);
				}
			}, 3000);
			BX.ajax({
				url: ajaxSendUrl,
				method: 'POST',
				dataType: 'html',
				processData: true,
				data: {'mode': 'ajax', 'action' : 'search', 'provider' : provider, 'search' : element.value, 'sessid': BX.bitrix_sessid(), 'site_id': BX.message('SITE_ID')||''},
				onsuccess: function(data)	{
					if (data == '')
					{
						BX.Finder.searchPanel[provider].innerHTML = '';
						BX.Finder.searchPanel[provider].appendChild(
							BX.create('div', {	'props': {'className': 'bx-finder-item-text', 'innerHTML': BX.Finder.lang['text-search-no-result']}	})
						);
					}
					else
					{
						BX.Finder.searchPanel[provider].innerHTML = data;
						
						newElements = BX.findChildren(BX.Finder.searchPanel[provider], { className : "bx-finder-element" }, true);
						for (var i = 0; i < newElements.length; i++)
						{	
							BX.Finder.elements.push(newElements[i]);
							BX.Finder.mapElements.push(newElements[i].getAttribute('rel'));
							BX.Finder.onDisableItem(BX.Finder.mapElements.length-1);
						}
					}
					clearTimeout(BX.Finder.searchTimeout);
				},
				onfailure: function(data)	{} 
			});
		}, 500);
	}
}
})(window);