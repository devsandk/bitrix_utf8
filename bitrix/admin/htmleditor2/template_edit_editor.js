var templatePreparseHeaders = function()
{
	var pMainObj = GLOBAL_pMainObj['CONTENT'];
	pMainObj.pParser.GetHBF(pMainObj.pValue.value, false);
}
jsUtils.addCustomEvent('EditorLoadFinish_CONTENT', templatePreparseHeaders)

window.fullEditMode = true;

var edit_hbf = [ //hbf - head, body, footer
	'BXButton',
	{
		id : 'edit_hbf',
		iconkit : '_global_iconkit.gif',
		name : TE_MESS.FILEMAN_EDIT_HBF,
		handler : function ()
		{
			this.bNotFocus = true;
			this.pMainObj.OpenEditorDialog("edit_hbf", false, 700, {bUseTabControl: true});
		}
	}
];

var insert_wa = [
	'BXButton',
	{
		id : 'insert_wa',
		iconkit : '_global_iconkit.gif',
		name : TE_MESS.FILEMAN_INSERT_WA,
		handler : function ()
		{
			this.pMainObj.insertHTML("<img src=\"/bitrix/images/fileman/htmledit2/work_area.gif\" id=\"" + this.pMainObj.SetBxTag(false, {tag: 'work_area'}) + "\"/>");
		}
	}
];

var preview_tmpl = [
	'BXButton',
	{
		id : 'preview_tmpl',
		iconkit : '_global_iconkit.gif',
		name : TE_MESS.FILEMAN_PREVIEW_TEMPLATE,
		title : TE_MESS.FILEMAN_PREVIEW_TEMPLATE_TITLE,
		handler : function ()
		{
			preview_template(__ID, BX.bitrix_sessid());
		}
	}
];

arToolbars['style'] = [
	BX_MESS.TBSStyle,
		[arButtons['FontStyle'], arButtons['HeadingList'], arButtons['FontName'], arButtons['FontSize'], arButtons['separator'],
			arButtons['Bold'], arButtons['Italic'], arButtons['Underline'], 'separator',
			arButtons['RemoveFormat']
		]
];

var edit_template = oBXEditorUtils.createToolbar("edit_template", TE_MESS.FILEMAN_TOOLBAR_TITLE, [edit_hbf, insert_wa, preview_tmpl]);
oBXEditorUtils.addToolbar(edit_template);

function TemplateEditContentParser(str, pMainObj)
{
	str = str.replace(/#WORK_AREA#/ig, '<img src="/bitrix/images/fileman/htmledit2/work_area.gif" id="' + pMainObj.SetBxTag(false, {tag: 'work_area'}) + '"/>');
	return str;
}
oBXEditorUtils.addContentParser(TemplateEditContentParser);

function TemplateEditUnParser(node, pMainObj)
{
	var id = node.arAttributes['id'];
	if (id)
	{
		bxTag = pMainObj.GetBxTag(id);
		if(bxTag.tag == 'work_area')
			return '#WORK_AREA#';
	}
	return false;
}
oBXEditorUtils.addUnParser(TemplateEditUnParser);