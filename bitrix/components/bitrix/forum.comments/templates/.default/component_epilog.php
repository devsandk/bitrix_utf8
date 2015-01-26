<?if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();?>
<script>
	if (typeof phpVars != "object")
		var phpVars = {};
	phpVars.bitrix_sessid = '<?=bitrix_sessid()?>';
	BX(function() {
		var form = BX("COMMENTS<?=CUtil::JSEscape($arParams["form_index"]);?>");
		var sessIDs = BX.findChild(form, {tagName:'input', property:{name:'sessid'}}, true, true);
		if (!!sessIDs)
			for(var i=0;i<sessIDs.length;i++)
				sessIDs[i].value = phpVars.bitrix_sessid;
		var actionDivs = BX.findChild(document, {className:'comment-actions'}, true, true);
		if (!!actionDivs)
		{
			for(var i=0;i<actionDivs.length;i++)
			{
				var actions = BX.findChild(actionDivs[i], {tagName:'A'}, true, true);
				if (!!actions)
				{
					for (var j=0;j<actions.length;j++)
					{
						var href = actions[j].getAttribute('href');
						if (!!href && href.length > 0 && href.indexOf('sessid') > 0)
						{
							href = href.replace(/.sessid=[^&]*/g, '');
							href += ((href.indexOf('?') > -1) ? '&' : '?') + 'sessid=' + phpVars.bitrix_sessid;
							actions[j].setAttribute('href', href);
						}
					}
				}
			}
		}
	});
</script>
