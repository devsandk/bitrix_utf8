window.bBitrixTabs = false;
arButtons['tabsection'] = ['BXButton',
	{
		id : 'tabsection',
		codeEditorMode : false,
		src : '/bitrix/images/fileman/htmledit2/insert_tabsection.gif',
		name : 'Вставить область закладок',
		handler : function ()
		{
			this.bNotFocus = true;
			this.pMainObj.insertHTML(
				'<img src="/bitrix/images/1.gif" style="background-image: url(/bitrix/images/fileman/htmledit2/tab_section_begin.gif); height: 17px; width: 100%" __bxtagname="begin_tabsection" __bxcontainer="" /><div _moz_editor_bogus_node="on"></div>' +
				'<br />' +
				'<br />' +
				'<img src="/bitrix/images/1.gif" style="background-image: url(/bitrix/images/fileman/htmledit2/tab_section_end.gif); height: 17px; width: 100%" __bxtagname="end_tabsection" __bxcontainer="" /><div _moz_editor_bogus_node="on"></div>'
			);
			window.bBitrixTabs = true;
		}
	}
];


arButtons['tab'] = ['BXButton',
	{
		id : 'tab',
		codeEditorMode : false,
		src : '/bitrix/images/fileman/htmledit2/insert_tab.gif',
		name : 'Вставить закладку',
		handler : function ()
		{
			this.bNotFocus = true;
			this.pMainObj.OpenEditorDialog("tab", false, 400, {window: window, document: document});
		},
		OnSelectionChange: function ()
		{
			if (!window.bBitrixTabs)
				return this.Disable(true);

			var oRange = BXGetSelectionRange(this.pMainObj.pEditorDocument, this.pMainObj.pEditorWindow);
			var currentElement = this.pMainObj.GetSelectionObject();
			this.Disable(!isInTabSection(currentElement, 'begin_tabsection', 'end_tabsection'));
		}
	}
];

arButtons['bitrix_note'] = ['BXButton',
	{
		id : 'bitrix_note',
		codeEditorMode : false,
		src : '/images/icons/insert_bxnote.gif',
		name : 'Вставить памятку',
		handler : function()
		{
			this.bNotFocus = true;
			this.pMainObj.OpenEditorDialog("bitrix_note", false, 600, {window: window, document: document});
		}
	}
];

if (!window.lightMode)
{
	oBXEditorUtils.appendButton('tabsection', arButtons['tabsection'], 'standart');
	oBXEditorUtils.appendButton('tab', arButtons['tab'], 'standart');
	oBXEditorUtils.appendButton('bitrix_note', arButtons['bitrix_note'], 'standart');
}
else
{
	for(var bxi = 0, bxl = arGlobalToolbar.length; bxi < bxl; bxi++)
	{
		if (arGlobalToolbar[bxi +1] == 'line_end')
			break;
	}
	arGlobalToolbar = arGlobalToolbar.slice(0, bxi).concat([arButtons['tabsection'], arButtons['tab'], arButtons['bitrix_note']], arGlobalToolbar.slice(bxi + 1));
}

arEditorFastDialogs['bitrix_note'] = function(pObj)
{
	var str = '<table height="100%" width="100%" border="0" style="margin-top:10px">' +
	'<tr>' +
		'<td align="right">' +
			'Целевая аудитория' + ':' +
		'</td>' +
		'<td>' +
			'<textarea id="bx_fd_note_audience" cols="50"></textarea>' +
		'</td>' +
	'</tr>' +
	'<tr>' +
		'<td align="right">' +
			'Их вопросы' + ':' +
		'</td>' +
		'<td>' +
			'<textarea id="bx_fd_note_questions" cols="50"></textarea>' +
		'</td>' +
	'</tr>' +
	'<tr>' +
		'<td align="right">' +
			'Чего хотим мы' + ':' +
		'</td>' +
		'<td>' +
			'<textarea id="bx_fd_note_we_want" cols="50"></textarea>' +
		'</td>' +
	'</tr>' +
	'<tr>' +
		'<td align="right">' +
			'SEO' + ':' +
		'</td>' +
		'<td>' +
			'<textarea id="bx_fd_note_seo" cols="50"></textarea>' +
		'</td>' +
	'</tr>' +
	'<tr>' +
		'<td align="right">' +
			'Комментарий' + ':' +
		'</td>' +
		'<td>' +
			'<textarea id="bx_fd_note_comment" cols="50"></textarea>' +
		'</td>' +
	'</tr>' +
	'<tr valign="top">' +
		'<td align="right" valign="middle" style="height:40px"><input type="button" id="bx_bitrix_note_save" value="' + BX_MESS.TBSave + '"></td>' +
		'<td align="left" valign="middle" style="height:40px"><input type="button" id="bx_bitrix_note_close" value="' + BX_MESS.TBCancel + '"></td>' +
	'</tr>' +
'</table>';
	var OnClose = function(){pObj.Close();};
	var OnSave = function(t)
	{
		var pTAudience = document.getElementById("bx_fd_note_audience");
		var pTQuestions = document.getElementById("bx_fd_note_questions");
		var pTWe_want = document.getElementById("bx_fd_note_we_want");
		var pTSeo = document.getElementById("bx_fd_note_seo");
		var pTComment = document.getElementById("bx_fd_note_comment");

		var audience = pTAudience.value || '';
		var questions = pTQuestions.value || '';
		var we_want = pTWe_want.value || '';
		var seo = pTSeo.value || '';
		var comment = pTComment.value || '';
		var groups = 'array(0=>"1",1=>"36")'

		BXSelectRange(oPrevRange, pObj.pMainObj.pEditorDocument, pObj.pMainObj.pEditorWindow);
		pObj.pMainObj.insertHTML('<img src="/images/icons/bxnote.gif" __bxtagname="bitrix_note" __bxcontainer="'+bxhtmlspecialchars(BXSerialize({groups : groups, audience : audience, questions : questions, we_want : we_want, seo : seo, comment : comment}))+'" /><div _moz_editor_bogus_node="on"></div>');
		
		OnClose();
	};

	return {
		title: "Вставить памятку",
		innerHTML : str,
		OnLoad: function()
		{
			window.oPrevRange = BXGetSelectionRange(pObj.pMainObj.pEditorDocument, pObj.pMainObj.pEditorWindow);
			var tn = document.getElementById("bx_fd_note_audience");
			tn.focus();
			var bs = document.getElementById("bx_bitrix_note_save");
			bs.onclick = OnSave;
			document.getElementById("bx_bitrix_note_close").onclick = OnClose;
		}
	};
}

arEditorFastDialogs['tab'] = function(pObj)
{
	var str = '<table height="100%" width="100%" border="0" style="margin-top:10px">' +
	'<tr>' +
		'<td align="right">' +
			'Идентификатор закладки' + ':' +
		'</td>' +
		'<td>' +
			'<input id="bx_fd_tab_id">' +
		'</td>' +
	'</tr>' +
	'<tr>' +
		'<td align="right">' +
			'Название закладки' + ':' +
		'</td>' +
		'<td>' +
			'<input id="bx_fd_tab_name">' +
		'</td>' +
	'</tr>' +
	'<tr valign="top">' +
		'<td align="right" valign="middle" style="height:40px"><input type="button" id="bx_tabsection_save" value="' + BX_MESS.TBSave + '"></td>' +
		'<td align="left" valign="middle" style="height:40px"><input type="button" id="bx_tabsection_close" value="' + BX_MESS.TBCancel + '"></td>' +
	'</tr>' +
'</table>';
	var OnClose = function(){pObj.Close();};
	var OnSave = function(t)
	{
		var pTId = document.getElementById("bx_fd_tab_id");
		var pTName = document.getElementById("bx_fd_tab_name");
		var id = pTId.value || '';
		var name = pTName.value || '';
		if (name.length <= 0)
			return alert('Поле название закладки не может быть пустым');
		BXSelectRange(oPrevRange, pObj.pMainObj.pEditorDocument, pObj.pMainObj.pEditorWindow);
		pObj.pMainObj.insertHTML('<img src="/bitrix/images/1.gif" style="background-image: url(/bitrix/images/fileman/htmledit2/tab.gif); height: 20px; width: 100%" __bxtagname="tab" __bxcontainer="'+bxhtmlspecialchars(BXSerialize({name : name, id : id}))+'" /><div _moz_editor_bogus_node="on"></div>');
		
		OnClose();
	};

	return {
		title: "Вставить закладку",
		innerHTML : str,
		OnLoad: function()
		{
			window.oPrevRange = BXGetSelectionRange(pObj.pMainObj.pEditorDocument, pObj.pMainObj.pEditorWindow);
			var tn = document.getElementById("bx_fd_tab_name");
			tn.focus();
			var bs = document.getElementById("bx_tabsection_save");
			bs.onclick = OnSave;
			document.getElementById("bx_tabsection_close").onclick = OnClose;
		}
	};
}


function BitrixRU_ContentParser(str)
{
	window.bBitrixTabs = false;
	str = str.replace(/<tabsection>/ig, function(str){
		window.bBitrixTabs = true;
		return '<img src="/bitrix/images/1.gif" style="background-image: url(/bitrix/images/fileman/htmledit2/tab_section_begin.gif); height: 17px; width: 100%; display:block;" __bxtagname="begin_tabsection" __bxcontainer="" /><div _moz_editor_bogus_node="on"></div>';
	});
	str = str.replace(/<\/tabsection>/ig, function(str)
		{
			return '<img src="/bitrix/images/1.gif" style="background-image: url(/bitrix/images/fileman/htmledit2/tab_section_end.gif); height: 17px; width: 100%" __bxtagname="end_tabsection" __bxcontainer="" /><div _moz_editor_bogus_node="on"></div>';
		}
	);
	str = str.replace(/<tab\s{1}(?:\s|\S)*?>/ig, function(str, b1)
		{
			var id = '';
			var name = '';
			str = str.replace(/id\s*=\s*("|')((?:\s|\S)*?)\1/i, function(str, b1, b2_id){id = b2_id; return '';});
			str = str.replace(/name\s*=\s*("|')((?:\s|\S)*?)\1/i, function(str, b1, b2_name){name = b2_name; return '';});
			return '<img src="/bitrix/images/1.gif" style="background-image: url(/bitrix/images/fileman/htmledit2/tab.gif); height: 20px; width: 100%" __bxtagname="tab" __bxcontainer="'+bxhtmlspecialchars(BXSerialize({name : name, id : id}))+'" /><div _moz_editor_bogus_node="on"></div>';
		}
	);

	str = str.replace(/<\?\$APPLICATION->IncludeComponent\(\s*?("|')\S*?bitrix\.comment\1(\S|\s)*?\?>/ig, function(str)
		{
			var groups = '';
			str = str.replace(/("|')GROUPS\1\s*?=>\s*?(array\s*?\((\S|\s)*?\)),/i, function(str,b1,b2_groups){groups = b2_groups; return '';});
			groups = oBXEditorUtils.PHPParser.cleanCode(groups);	
			var audience = '';
			str = str.replace(/("|')AUDIENCE\1\s*?=>\s*?\1((\S|\s)*?)\1,/i, function(str,b1,b2_audience){audience = b2_audience; return '';});
			var questions = '';
			str = str.replace(/("|')QUESTIONS\1\s*?=>\s*?\1((\S|\s)*?)\1/i, function(str,b1,b2_questions){questions = b2_questions; return '';});
			var we_want = '';
			str = str.replace(/("|')WE_WANT\1\s*?=>\s*?\1((\S|\s)*?)\1/i, function(str,b1,b2_we_want){we_want = b2_we_want; return '';});
			var seo = '';
			str = str.replace(/("|')SEO\1\s*?=>\s*?\1((\S|\s)*?)\1/i, function(str,b1,b2_seo){seo = b2_seo; return '';});
			var comment = '';
			str = str.replace(/("|')COMMENT\1\s*?=>\s*?\1((\S|\s)*?)\1/i, function(str,b1,b2_comment){comment = b2_comment; return '';});

			return '<img src="/images/icons/bxnote.gif" __bxtagname="bitrix_note" __bxcontainer="'+bxhtmlspecialchars(BXSerialize({groups : groups, audience : audience, questions : questions, we_want : we_want, seo : seo, comment : comment}))+'" /><div _moz_editor_bogus_node="on"></div>';
		}
	);

	return str;
}
oBXEditorUtils.addContentParser(BitrixRU_ContentParser);

function BitrixRU_UnParser(node)
{
	if (node.arAttributes["__bxtagname"] == 'begin_tabsection')
	{
		return '<tabsection>';
	}
	else if (node.arAttributes["__bxtagname"] == 'end_tabsection')
	{
		return '</tabsection>';
	}
	else if (node.arAttributes["__bxtagname"] == 'tab')
	{
		var par = BXUnSerialize(node.arAttributes["__bxcontainer"]);
		var _id = par.id ? ' id="' + par.id + '"' : '';
		var _name = ' name="' + (par.name || 'BXTab') + '"';
		return '<tab' + _id + _name + '>';
	}
	else if(node.arAttributes["__bxtagname"] == 'bitrix_note')
	{
		var par = BXUnSerialize(node.arAttributes["__bxcontainer"]);
		var _groups = par.groups ? '"GROUPS" => ' + par.groups + ',' : '';
		var _audience = par.audience ? '"AUDIENCE" => "' + par.audience + '",' : '';
		var _questions = par.questions ? '"QUESTIONS" => "' + par.questions + '",' : '';
		var _we_want = par.we_want ? '"WE_WANT" => "' + par.we_want + '",' : '';
		var _seo = par.seo ? '"SEO" => "' + par.seo + '",' : '';
		var _comment = par.comment ? '"COMMENT" => "' + par.comment + '",' : '';
		
		return '<?$APPLICATION->IncludeComponent(' +
			'"bx:bitrix.comment",' +
			'"",' +
			'Array(' +
			_groups +
			_audience +
			_questions +
			_we_want +
			_seo +
			_comment +
			')' +
			');?>';
	}
	return false;
}
oBXEditorUtils.addUnParser(BitrixRU_UnParser);

pPropertybarHandlers['bitrix_note'] = function (bNew, pTaskbar, pElement)
{
	pTaskbar.pHtmlElement = pElement;
	if(bNew)
	{
		pTaskbar.arElements = [];
		var tProp;
		var arBarHandlersCache = pTaskbar.pMainObj.arBarHandlersCache;
		if(arBarHandlersCache['bitrix_note'])
		{
			tProp = arBarHandlersCache['bitrix_note'][0];
			pTaskbar.arElements = arBarHandlersCache['bitrix_note'][1];
		}
		else
		{
			tProp = pTaskbar.pMainObj.CreateElement("TABLE", {className: "bxtaskbarprops", cellSpacing: 0, cellPadding: 1}, {width: '100%'});
			var row, cell;

			row = tProp.insertRow(-1); cell = row.insertCell(-1); cell.align = 'right'; cell.width="40%";
			cell.appendChild(pTaskbar.pMainObj.CreateElement("SPAN", {innerHTML: 'Целевая аудитория:'}));

			cell = row.insertCell(-1); cell.width="60%";
			pTaskbar.arElements.audience = cell.appendChild(pTaskbar.pMainObj.CreateElement("TEXTAREA", {cols: '50'}));

			row = tProp.insertRow(-1); cell = row.insertCell(-1); cell.align = 'right';
			cell.appendChild(pTaskbar.pMainObj.CreateElement("SPAN", {innerHTML: 'Их вопросы:'}));

			cell = row.insertCell(-1);
			pTaskbar.arElements.questions = cell.appendChild(pTaskbar.pMainObj.CreateElement("TEXTAREA", {cols: '50'}));

			row = tProp.insertRow(-1); cell = row.insertCell(-1); cell.align = 'right'; cell.width="40%";
			cell.appendChild(pTaskbar.pMainObj.CreateElement("SPAN", {innerHTML: 'Чего хотим мы:'}));

			cell = row.insertCell(-1); cell.width="60%";
			pTaskbar.arElements.we_want = cell.appendChild(pTaskbar.pMainObj.CreateElement("TEXTAREA", {cols: '50'}));

			row = tProp.insertRow(-1); cell = row.insertCell(-1); cell.align = 'right'; cell.width="40%";
			cell.appendChild(pTaskbar.pMainObj.CreateElement("SPAN", {innerHTML: 'SEO:'}));

			cell = row.insertCell(-1); cell.width="60%";
			pTaskbar.arElements.seo = cell.appendChild(pTaskbar.pMainObj.CreateElement("TEXTAREA", {cols: '50'}));

			row = tProp.insertRow(-1); cell = row.insertCell(-1); cell.align = 'right'; cell.width="40%";
			cell.appendChild(pTaskbar.pMainObj.CreateElement("SPAN", {innerHTML: 'Комментарий:'}));

			cell = row.insertCell(-1); cell.width="60%";
			pTaskbar.arElements.comment = cell.appendChild(pTaskbar.pMainObj.CreateElement("TEXTAREA", {cols: '50'}));

			arBarHandlersCache['bitrix_note'] = [tProp, pTaskbar.arElements];
		}
		pTaskbar.pCellProps.appendChild(tProp);
	}
	
	var val = BXUnSerialize(pElement.getAttribute("__bxcontainer"));

	pTaskbar.arElements.audience.value = val.audience;
	pTaskbar.arElements.questions.value = val.questions;
	pTaskbar.arElements.we_want.value = val.we_want;
	pTaskbar.arElements.seo.value = val.seo;
	pTaskbar.arElements.comment.value = val.comment;

	var fChange = function(){pElement.setAttribute("__bxcontainer", BXSerialize({groups: val.groups, audience: pTaskbar.arElements.audience.value, questions: pTaskbar.arElements.questions.value, we_want: pTaskbar.arElements.we_want.value, seo: pTaskbar.arElements.seo.value, comment: pTaskbar.arElements.comment.value}));};

	pTaskbar.arElements.audience.onchange = fChange;
	pTaskbar.arElements.questions.onchange = fChange;
	pTaskbar.arElements.we_want.onchange = fChange;
	pTaskbar.arElements.seo.onchange = fChange;
	pTaskbar.arElements.comment.onchange = fChange;
};

pPropertybarHandlers['tab'] = function (bNew, pTaskbar, pElement)
{
	pTaskbar.pHtmlElement = pElement;
	if(bNew)
	{
		pTaskbar.arElements = [];
		var tProp;
		var arBarHandlersCache = pTaskbar.pMainObj.arBarHandlersCache;
		if(arBarHandlersCache['tab'])
		{
			tProp = arBarHandlersCache['tab'][0];
			pTaskbar.arElements = arBarHandlersCache['tab'][1];
		}
		else
		{
			tProp = pTaskbar.pMainObj.CreateElement("TABLE", {className: "bxtaskbarprops", cellSpacing: 0, cellPadding: 1}, {width: '100%'});
			var row, cell;

			row = tProp.insertRow(-1); cell = row.insertCell(-1); cell.align = 'right'; cell.width="40%";
			cell.appendChild(pTaskbar.pMainObj.CreateElement("SPAN", {innerHTML: 'Идентификатор закладки:'}));

			cell = row.insertCell(-1); cell.width="60%";
			pTaskbar.arElements.id = cell.appendChild(pTaskbar.pMainObj.CreateElement("INPUT", {size: '40'}));

			row = tProp.insertRow(-1); cell = row.insertCell(-1); cell.align = 'right';
			cell.appendChild(pTaskbar.pMainObj.CreateElement("SPAN", {innerHTML: 'Название закладки:'}));
			cell = row.insertCell(-1);
			pTaskbar.arElements.name = cell.appendChild(pTaskbar.pMainObj.CreateElement("INPUT", {size: '40'}));
			arBarHandlersCache['tab'] = [tProp, pTaskbar.arElements];
		}
		pTaskbar.pCellProps.appendChild(tProp);
	}

	var val = BXUnSerialize(pElement.getAttribute("__bxcontainer"));
	pTaskbar.arElements.id.value = val.id;
	pTaskbar.arElements.name.value = val.name;

	var fChange = function(){pElement.setAttribute("__bxcontainer", BXSerialize({name: pTaskbar.arElements.name.value, id: pTaskbar.arElements.id.value}));};

	pTaskbar.arElements.id.onchange = fChange;
	pTaskbar.arElements.name.onchange = fChange;
};

function isInTabSection(el)
{
	var i = -1, tn;
	tn = (el && el.getAttribute) ? el.getAttribute("__bxtagname") : '';
	if (tn == 'begin_tabsection' || tn == 'end_tabsection')
		return false;
	if (el && el.nodeName && el.nodeName.toUpperCase() == 'TD')
		el = el.lastChild;
	while (el && el.nodeName && el.nodeName.toUpperCase() != 'BODY' && i++ <= 500)
	{
		el = el.previousSibling || el.parentNode;
		if (el.nodeName.toUpperCase() == 'IMG' && el.getAttribute)
		{
			tn = el.getAttribute("__bxtagname");
			if (tn == 'begin_tabsection' || tn == 'tab')
				return true;
			else if (tn == 'end_tabsection')
				return false;
		}
	}
	return false;
}



/*window.bBitrixTabs = false;
arButtons['tabsection'] = ['BXButton',
	{
		id : 'tabsection',
		codeEditorMode : false,
		src : '/bitrix/images/fileman/htmledit2/insert_tabsection.gif',
		name : 'Вставить область закладок',
		handler : function ()
		{
			this.bNotFocus = true;
			this.pMainObj.insertHTML(
				'<img src="/bitrix/images/1.gif" style="background-image: url(/bitrix/images/fileman/htmledit2/tab_section_begin.gif); height: 17px; width: 100%" __bxtagname="begin_tabsection" __bxcontainer="" /><div _moz_editor_bogus_node="on"></div>' +
				'<br />' +
				'<br />' +
				'<img src="/bitrix/images/1.gif" style="background-image: url(/bitrix/images/fileman/htmledit2/tab_section_end.gif); height: 17px; width: 100%" __bxtagname="end_tabsection" __bxcontainer="" /><div _moz_editor_bogus_node="on"></div>'
			);
			window.bBitrixTabs = true;
		}
	}
];
arButtons['tab'] = ['BXButton',
	{
		id : 'tab',
		codeEditorMode : false,
		src : '/bitrix/images/fileman/htmledit2/insert_tab.gif',
		name : 'Вставить закладку',
		handler : function ()
		{
			this.bNotFocus = true;
			this.pMainObj.OpenEditorDialog("tab", false, 400, {window: window, document: document});
		},
		OnSelectionChange: function ()
		{
			if (!window.bBitrixTabs)
				return this.Disable(true);

			var oRange = BXGetSelectionRange(this.pMainObj.pEditorDocument, this.pMainObj.pEditorWindow);
			var currentElement = this.pMainObj.GetSelectionObject();
			this.Disable(!isInTabSection(currentElement, 'begin_tabsection', 'end_tabsection'));
		}
	}
];

if (!window.lightMode)
{
	oBXEditorUtils.appendButton('tabsection', arButtons['tabsection'], 'standart');
	oBXEditorUtils.appendButton('tab', arButtons['tab'], 'standart');
}
else
{
	for(var bxi = 0, bxl = arGlobalToolbar.length; bxi < bxl; bxi++)
	{
		if (arGlobalToolbar[bxi +1] == 'line_end')
			break;
	}
	arGlobalToolbar = arGlobalToolbar.slice(0, bxi).concat([arButtons['tabsection'], arButtons['tab']], arGlobalToolbar.slice(bxi + 1));
}

arEditorFastDialogs['tab'] = function(pObj)
{
	var str = '<table height="100%" width="100%" border="0" style="margin-top:10px">' +
	'<tr>' +
		'<td align="right">' +
			'Идентификатор закладки' + ':' +
		'</td>' +
		'<td>' +
			'<input id="bx_fd_tab_id">' +
		'</td>' +
	'</tr>' +
	'<tr>' +
		'<td align="right">' +
			'Название закладки' + ':' +
		'</td>' +
		'<td>' +
			'<input id="bx_fd_tab_name">' +
		'</td>' +
	'</tr>' +
	'<tr valign="top">' +
		'<td align="right" valign="middle" style="height:40px"><input type="button" id="bx_tabsection_save" value="' + BX_MESS.TBSave + '"></td>' +
		'<td align="left" valign="middle" style="height:40px"><input type="button" id="bx_tabsection_close" value="' + BX_MESS.TBCancel + '"></td>' +
	'</tr>' +
'</table>';
	var OnClose = function(){pObj.Close();};
	var OnSave = function(t)
	{
		var pTId = document.getElementById("bx_fd_tab_id");
		var pTName = document.getElementById("bx_fd_tab_name");
		var id = pTId.value || '';
		var name = pTName.value || '';
		if (name.length <= 0)
			return alert('Поле название закладки не может быть пустым');
		BXSelectRange(oPrevRange, pObj.pMainObj.pEditorDocument, pObj.pMainObj.pEditorWindow);
		pObj.pMainObj.insertHTML('<img src="/bitrix/images/1.gif" style="background-image: url(/bitrix/images/fileman/htmledit2/tab.gif); height: 20px; width: 100%" __bxtagname="tab" __bxcontainer="'+bxhtmlspecialchars(BXSerialize({name : name, id : id}))+'" /><div _moz_editor_bogus_node="on"></div>');
		
		OnClose();
	};

	return {
		title: "Вставить закладку",
		innerHTML : str,
		OnLoad: function()
		{
			window.oPrevRange = BXGetSelectionRange(pObj.pMainObj.pEditorDocument, pObj.pMainObj.pEditorWindow);
			var tn = document.getElementById("bx_fd_tab_name");
			tn.focus();
			var bs = document.getElementById("bx_tabsection_save");
			bs.onclick = OnSave;
			document.getElementById("bx_tabsection_close").onclick = OnClose;
		}
	};
}


function BitrixRU_ContentParser(str)
{
	window.bBitrixTabs = false;
	str = str.replace(/<tabsection>/ig, function(str){
		window.bBitrixTabs = true;
		return '<img src="/bitrix/images/1.gif" style="background-image: url(/bitrix/images/fileman/htmledit2/tab_section_begin.gif); height: 17px; width: 100%; display:block;" __bxtagname="begin_tabsection" __bxcontainer="" /><div _moz_editor_bogus_node="on"></div>';
	});
	str = str.replace(/<\/tabsection>/ig, function(str)
		{
			return '<img src="/bitrix/images/1.gif" style="background-image: url(/bitrix/images/fileman/htmledit2/tab_section_end.gif); height: 17px; width: 100%" __bxtagname="end_tabsection" __bxcontainer="" /><div _moz_editor_bogus_node="on"></div>';
		}
	);
	str = str.replace(/<tab\s{1}(?:\s|\S)*?>/ig, function(str, b1)
		{
			var id = '';
			var name = '';
			str = str.replace(/id\s*=\s*("|')((?:\s|\S)*?)\1/i, function(str, b1, b2_id){id = b2_id; return '';});
			str = str.replace(/name\s*=\s*("|')((?:\s|\S)*?)\1/i, function(str, b1, b2_name){name = b2_name; return '';});
			return '<img src="/bitrix/images/1.gif" style="background-image: url(/bitrix/images/fileman/htmledit2/tab.gif); height: 20px; width: 100%" __bxtagname="tab" __bxcontainer="'+bxhtmlspecialchars(BXSerialize({name : name, id : id}))+'" /><div _moz_editor_bogus_node="on"></div>';
		}
	);
	return str;
}
oBXEditorUtils.addContentParser(BitrixRU_ContentParser);

function BitrixRU_UnParser(node)
{
	if (node.arAttributes["__bxtagname"] == 'begin_tabsection')
	{
		return '<tabsection>';
	}
	else if (node.arAttributes["__bxtagname"] == 'end_tabsection')
	{
		return '</tabsection>';
	}
	else if (node.arAttributes["__bxtagname"] == 'tab')
	{
		var par = BXUnSerialize(node.arAttributes["__bxcontainer"]);
		var _id = par.id ? ' id="' + par.id + '"' : '';
		var _name = ' name="' + (par.name || 'BXTab') + '"';
		return '<tab' + _id + _name + '>';
	}
	return false;
}
oBXEditorUtils.addUnParser(BitrixRU_UnParser);

pPropertybarHandlers['tab'] = function (bNew, pTaskbar, pElement)
{
	pTaskbar.pHtmlElement = pElement;
	if(bNew)
	{
		pTaskbar.arElements = [];
		var tProp;
		var arBarHandlersCache = pTaskbar.pMainObj.arBarHandlersCache;
		if(arBarHandlersCache['tab'])
		{
			tProp = arBarHandlersCache['tab'][0];
			pTaskbar.arElements = arBarHandlersCache['tab'][1];
		}
		else
		{
			tProp = pTaskbar.pMainObj.CreateElement("TABLE", {className: "bxtaskbarprops", cellSpacing: 0, cellPadding: 1}, {width: '100%'});
			var row, cell;

			row = tProp.insertRow(-1); cell = row.insertCell(-1); cell.align = 'right'; cell.width="40%";
			cell.appendChild(pTaskbar.pMainObj.CreateElement("SPAN", {innerHTML: 'Идентификатор закладки:'}));

			cell = row.insertCell(-1); cell.width="60%";
			pTaskbar.arElements.id = cell.appendChild(pTaskbar.pMainObj.CreateElement("INPUT", {size: '40'}));

			row = tProp.insertRow(-1); cell = row.insertCell(-1); cell.align = 'right';
			cell.appendChild(pTaskbar.pMainObj.CreateElement("SPAN", {innerHTML: 'Название закладки:'}));
			cell = row.insertCell(-1);
			pTaskbar.arElements.name = cell.appendChild(pTaskbar.pMainObj.CreateElement("INPUT", {size: '40'}));
			arBarHandlersCache['tab'] = [tProp, pTaskbar.arElements];
		}
		pTaskbar.pCellProps.appendChild(tProp);
	}

	var val = BXUnSerialize(pElement.getAttribute("__bxcontainer"));
	pTaskbar.arElements.id.value = val.id;
	pTaskbar.arElements.name.value = val.name;

	var fChange = function(){pElement.setAttribute("__bxcontainer", BXSerialize({name: pTaskbar.arElements.name.value, id: pTaskbar.arElements.id.value}));};

	pTaskbar.arElements.id.onchange = fChange;
	pTaskbar.arElements.name.onchange = fChange;
};

function isInTabSection(el)
{
	var i = -1, tn;
	tn = (el && el.getAttribute) ? el.getAttribute("__bxtagname") : '';
	if (tn == 'begin_tabsection' || tn == 'end_tabsection')
		return false;
	if (el && el.nodeName && el.nodeName.toUpperCase() == 'TD')
		el = el.lastChild;
	while (el && el.nodeName && el.nodeName.toUpperCase() != 'BODY' && i++ <= 500)
	{
		el = el.previousSibling || el.parentNode;
		if (el.nodeName.toUpperCase() == 'IMG' && el.getAttribute)
		{
			tn = el.getAttribute("__bxtagname");
			if (tn == 'begin_tabsection' || tn == 'tab')
				return true;
			else if (tn == 'end_tabsection')
				return false;
		}
	}
	return false;
}
*/