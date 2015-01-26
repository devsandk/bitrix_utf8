<?if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();
$arResult["SHOW_PANEL"] = in_array("Y", $arResult["PANELS"]) ? "Y" : "N";
$arParams["SHOW_MODERATION"] = ($arParams["SHOW_MODERATION"] == "N" ? "N" : "Y");
$arResult["SHOW_PANEL"] = ($arParams["SHOW_MODERATION"] === "Y" ? $arResult["SHOW_PANEL"] : 'N');
$arParams['SHOW_WYSIWYG_EDITOR'] = ($arParams["SHOW_WYSIWYG_EDITOR"] == "N" ? "N" : "Y");
$arParams["SHOW_SUBSCRIBE"] = ($arParams["SHOW_SUBSCRIBE"] == "Y" ? "Y" : "N");
$arParams["SHOW_AVATAR"] = ($arParams["SHOW_AVATAR"] == "N" ? "N" : "Y");

$arParams["form_index"] = randstring(4);
$arParams["FORM_ID"] = "COMMENTS_".$arParams["form_index"];
$arParams["jsObjName"] = "oLHE";
$arParams["LheId"] = "idLHE_FC".$arParams["form_index"];


CUtil::InitJSCore(array('ajax'));
if (!!$arResult["objRating"])
{
	$arResult["objRating"]->display = array("BEFORE_HEADER" => true, "AFTER_ACTIONS" => false);
	AddEventHandler("forum", "OnCommentDisplay", Array(&$arResult["objRating"], "OnCommentDisplay"));
}
AddEventHandler("forum", "OnCommentDisplay", Array(&$arResult["objFiles"], "OnCommentDisplay"));
AddEventHandler("forum", "OnCommentPreviewDisplay", Array(&$arResult["objFiles"], "OnCommentPreviewDisplay"));
	if ($arResult["FORUM"]["ALLOW_UPLOAD"] !== "N")
{
	AddEventHandler("forum", "OnCommentFormDisplay", Array(&$arResult["objFiles"], "OnCommentFormDisplay"));
}
AddEventHandler("forum", "OnCommentDisplay", Array(&$arResult["objUFs"], "OnCommentDisplay"));
AddEventHandler("forum", "OnCommentPreviewDisplay", Array(&$arResult["objUFs"], "OnCommentPreviewDisplay"));
AddEventHandler("forum", "OnCommentFormDisplay", Array(&$arResult["objUFs"], "OnCommentFormDisplay"));
// ************************* Input params***************************************************************
$arParams["SHOW_LINK_TO_FORUM"] = ($arParams["SHOW_LINK_TO_FORUM"] == "Y" ? "Y" : "N");
if (LANGUAGE_ID == 'ru')
{
	$path = str_replace(array("\\", "//"), "/", dirname(__FILE__)."/ru/script.php");
	include($path);
}

$tplID = 'COMMENT_'.$arParams["ENTITY_TYPE"].'_';
?>
<div class='comments-component'>
<?
// *************************/Input params***************************************************************
if (!empty($arResult["MESSAGES"]))
{
	if ($arResult["NAV_RESULT"] && $arResult["NAV_RESULT"]->NavPageCount > 1)
	{
?>
		<div class="comments-navigation-box comments-navigation-top">
			<div class="comments-page-navigation">
				<?=$arResult["NAV_STRING"]?>
			</div>
			<div class="comments-clear-float"></div>
		</div>
<?
	}
?>
<div class="comments-block-container comments-comments-block-container">
	<div class="comments-block-outer">
		<div class="comments-block-inner">
			<a name="comments"></a>
<?
$iCount = 0;
foreach ($arResult["MESSAGES"] as $res)
{
	$iCount++;

	$arCommentTpl = array();
	foreach (GetModuleEvents('forum', 'OnCommentDisplay', true) as $arEvent)
	{
		$arExt = ExecuteModuleEventEx($arEvent, array($res));
		if ($arExt !== null)
		{
			foreach($arExt as $arTpl)
				$APPLICATION->AddViewContent(implode('_', array($tplID, 'ID', $res['ID'], $arTpl['DISPLAY'])), $arTpl['TEXT'], $arTpl['SORT']);
		}
	}
?>
	<div class="comments-post-table <?=($iCount == 1 ? "comments-post-first " : "")?><?
		?><?=($iCount == count($arResult["MESSAGES"]) ? "comments-post-last " : "")?><?
		?><?=($iCount%2 == 1 ? "comments-post-odd " : "comments-post-even ")?><?
		?><?=(($res["APPROVED"] == 'Y') ? "" : "comments-post-hidden")
		?>" id="message<?=$res["ID"]?>">
		<div class="comment-post-info">
			<?=$APPLICATION->GetViewContent(implode('_', array($tplID, 'ID', $res['ID'], 'BEFORE_HEADER')));?>
			<?if ($arParams["SHOW_AVATAR"] == "Y")
			{ ?>
				<div class="comment-avatar">
					<?
					if(isset($res["AVATAR"]["HTML"]) > 0)
						echo $res["AVATAR"]["HTML"];
					else
						echo '<img src="/bitrix/components/bitrix/forum.comments/templates/.default/images/noavatar.gif" border="0" />';
					?>
				</div>
			<? } ?>
			<div class="comment-author-name">
				<a name="message<?=$res["ID"]?>"></a>
				<b><?
				if (intVal($res["AUTHOR_ID"]) > 0 && !empty($res["AUTHOR_URL"])):
					?><a href="<?=$res["AUTHOR_URL"]?>"><?=$res["AUTHOR_NAME"]?></a><?
				else:
					?><?=$res["AUTHOR_NAME"]?><?
				endif;
				?></b>
				<span class='message-post-date'><?=$res["POST_DATE"]?></span>
			</div>
			<?=$APPLICATION->GetViewContent(implode('_', array($tplID, 'ID', $res['ID'], 'AFTER_HEADER')));?>
		</div>
		<div class="comment-clear-float"></div>
		<div class="comment-content">
			<?=$APPLICATION->GetViewContent(implode('_', array($tplID, 'ID', $res['ID'], 'BEFORE')));?>
			<div class="comments-text" id="message_text_<?=$res["ID"]?>"><?=$res["POST_MESSAGE_TEXT"]?></div>
			<?=$APPLICATION->GetViewContent(implode('_', array($tplID, 'ID', $res['ID'], 'AFTER')));?>
		</div>
		<div class="comment-actions">
<?			if ($arResult["SHOW_POST_FORM"] == "Y")
			{ ?>
				<div class="comments-post-reply-buttons"><!--noindex-->
					<?=$APPLICATION->GetViewContent(implode('_', array($tplID, 'ID', $res['ID'], 'BEFORE_ACTIONS')));?>
					<a href="#review_anchor" style='margin-left:0;' title="<?=GetMessage("F_NAME")?>"  class="comments-button-small" <?
						?>onmousedown="return reply2author('<?=$res["FOR_JS"]["AUTHOR_NAME"]?>'<? if ($arParams['SHOW_WYSIWYG_EDITOR'] != 'Y'): ?>, this<? endif; ?>);"><?=GetMessage("F_NAME")?></a>
<?					if ($arResult["FORUM"]["ALLOW_QUOTE"] == "Y")
					{ ?>
						<span class="separator"></span>
						<a href="#review_anchor" title="<?=GetMessage("F_QUOTE_HINT")?>" class="comments-button-small" <?
						?>onmousedown="quoteMessageEx('<?=$res["FOR_JS"]["AUTHOR_NAME"]?>', 'message_text_<?=$res["ID"]?>'<? if ($arParams['SHOW_WYSIWYG_EDITOR'] != 'Y'): ?>, this<? endif; ?>); return false;"><?
							?><?=GetMessage("F_QUOTE_FULL")?></a>
<?					}
					if ($arResult["SHOW_PANEL"] == "Y")
					{
						if ($arResult["PANELS"]["MODERATE"] == "Y")
						{ ?>
							<span class="separator"></span>
							<a rel="nofollow" bx-forum-message-id="<?=$res["ID"]?>" onclick="return sendFForm(this);" href="<?=$res["URL"]["MODERATE"]?>" class="comments-button-small"><?=GetMessage((($res["APPROVED"] == 'Y') ? "F_HIDE" : "F_SHOW"))?></a>
<?						}
						if ($arResult["PANELS"]["DELETE"] == "Y")
						{ ?>
							<span class="separator"></span>
							<a rel="nofollow" bx-forum-message-id="<?=$res["ID"]?>" onclick="return sendFForm(this);" href="<?=$res["URL"]["DELETE"]?>" class="comments-button-small"><?=GetMessage("F_DELETE")?></a>
<?						}
					} ?>
						<?=$APPLICATION->GetViewContent(implode('_', array($tplID, 'ID', $res['ID'], 'AFTER_ACTIONS')));?>
				<!--/noindex--></div>
<?			} ?>
		</div>
	</div>
<?
}
?>
		</div>
	</div>
</div>
<?
	if (strlen($arResult["NAV_STRING"]) > 0 && $arResult["NAV_RESULT"]->NavPageCount > 1)
	{
	?>
		<div class="comments-navigation-box comments-navigation-bottom">
			<div class="comments-page-navigation">
				<?=$arResult["NAV_STRING"]?>
			</div>
			<div class="comments-clear-float"></div>
		</div>
	<?
	}

	if (!empty($arResult["read"]) && $arParams["SHOW_LINK_TO_FORUM"] != "N")
	{
	?>
		<div class="comments-link-box">
			<div class="comments-link-box-text">
				<a href="<?=$arResult["read"]?>"><?=GetMessage("F_C_GOTO_FORUM");?></a>
			</div>
		</div>
	<?
	}
}

if (empty($arResult["ERROR_MESSAGE"]) && !empty($arResult["OK_MESSAGE"]))
{
?>
	<div class="comments-note-box comments-note-note">
		<a name="reviewnote"></a>
		<div class="comments-note-box-text"><?=ShowNote($arResult["OK_MESSAGE"]);?></div>
	</div>
<?
}

if ($arResult["SHOW_POST_FORM"] != "Y")
{
	?></div><?
	return false;
}

if (!empty($arResult["MESSAGE_VIEW"]))
{
	$arPreviewTpl = array();
	foreach (GetModuleEvents('forum', 'OnCommentPreviewDisplay', true) as $arEvent)
	{
		$arExt = ExecuteModuleEventEx($arEvent);
		if ($arExt !== null)
		{
			foreach($arExt as $arTpl)
				$APPLICATION->AddViewContent(implode('_', array($tplID, 'PREVIEW', $arTpl['DISPLAY'])), $arTpl['TEXT'], $arTpl['SORT']);
		}
	}
?>
	<div class="comments-preview">
		<div class="comments-header-box">
			<div class="comments-header-title"><a name="postform"><span><?=GetMessage("F_PREVIEW")?></span></a></div>
		</div>

		<div class="comments-info-box comments-post-preview">
			<div class="comments-info-box-inner">
				<div class="comments-post-entry">
					<?=$APPLICATION->GetViewContent(implode('_', array($tplID, 'PREVIEW', 'BEFORE')));?>
					<div class="comments-post-text"><?=$arResult["MESSAGE_VIEW"]["POST_MESSAGE_TEXT"]?></div>
					<?=$APPLICATION->GetViewContent(implode('_', array($tplID, 'PREVIEW', 'AFTER')));?>
				</div>
			</div>
		</div>
		<div class="comments-br"></div>
	</div>
<?
}
if ($arParams['SHOW_MINIMIZED'] == "Y")
{ ?>
	<div class="comments-collapse comments-minimized" style='position:relative; float:none;'>
		<a class="comments-collapse-link" onclick="fToggleCommentsForm(this, true)" href="javascript:void(0);"><?=$arParams['MINIMIZED_EXPAND_TEXT']?></a>
	</div>
<? } ?>

<div class="comments-reply-form <?=(($arParams['SHOW_MINIMIZED'] == "Y")?'comments-reply-form-hidden':'')?>" <?=(($arParams['SHOW_MINIMIZED'] == "Y")?'style="display:none;"':'')?>>
<a name="review_anchor"></a>
<?
if (!empty($arResult["ERROR_MESSAGE"]))
{
?>
	<div class="comments-note-box comments-note-error">
		<div class="comments-note-box-text"><?=ShowError($arResult["ERROR_MESSAGE"], "comments-note-error");?></div>
	</div>
<?
}
?>
<script type="text/javascript">
BX.message({
	author : ' <?=GetMessageJS("JQOUTE_AUTHOR_WRITES")?>: \n',
	MINIMIZED_EXPAND_TEXT : '<?=CUtil::addslashes($arParams["MINIMIZED_EXPAND_TEXT"])?>',
	MINIMIZED_MINIMIZE_TEXT : '<?=CUtil::addslashes($arParams["MINIMIZED_MINIMIZE_TEXT"])?>'
});

function commentsCtrlEnterHandler<?=CUtil::JSEscape($arParams["FORM_ID"]);?>()
{
	if (window.<?=$arParams["jsObjName"]?>)
		window.<?=$arParams["jsObjName"]?>.SaveContent();
	var form = document.forms["<?=$arParams["FORM_ID"]?>"];

	BX.submit(form, 'send_button', 'Y');
}

function replyForumFormOpen()
{
<? if ($arParams['SHOW_MINIMIZED'] == "Y")
{ ?>
	var link = BX.findChild(document, {'class': 'comments-collapse-link'}, true);
	if (link) fToggleCommentsForm(link, true);
<? } ?>
	return;
}

function reply2author(name, link)
{
	name = name.replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, "\"");

	if (!!name)
	{
		var input = null;
		if (!!link)
		{
			var component = BX.findParent(link, {'className':'comments-component'});
			if (!!component)
				input = BX.findChild(component, {'className':'post_message'}, true);
		}

		if (!!input)
		{
			input.value += name+" \n";
		}
		else if (!!window.<?=$arParams["jsObjName"]?>)
		{
			replyForumFormOpen();
			if (window.<?=$arParams["jsObjName"]?>.sEditorMode == 'code' && window.<?=$arParams["jsObjName"]?>.bBBCode) { // BB Codes
			<?if ($arResult["FORUM"]["ALLOW_BIU"] == "Y"): ?> name = '[B]' + name + '[/B], ';<? endif; ?>
				window.<?=$arParams["jsObjName"]?>.WrapWith("", "", name);
			} else if (window.<?=$arParams["jsObjName"]?>.sEditorMode == 'html') { // WYSIWYG
			<?if ($arResult["FORUM"]["ALLOW_BIU"] == "Y"): ?> name = '<b>' + name + '</b>, ';<? endif; ?>
				window.<?=$arParams["jsObjName"]?>.InsertHTML(name);
			}
			window.<?=$arParams["jsObjName"]?>.SetFocus();
			BX.defer(window.<?=$arParams["jsObjName"]?>.SetFocus, window.<?=$arParams["jsObjName"]?>)();
		}
	}
	return false;
}
<? if ($arParams['SHOW_WYSIWYG_EDITOR'] != 'Y')
{ ?>
BX.ready(function() {
	BX.bind(BX('REVIEW_TEXT'), 'keydown', commentsKeyDownHandler<?=CUtil::JSEscape($arParams["FORM_ID"]);?>);
	BX.addCustomEvent(window,  'LHE_OnInit', function(lightEditor)
	{
		BX.addCustomEvent(lightEditor, 'onShow', function() {
			BX.style(BX('bxlhe_frame_REVIEW_TEXT').parentNode, 'width', '100%');
		});
	});
});

function commentsKeyDownHandler<?=CUtil::JSEscape($arParams["FORM_ID"]);?>(e)
{
	if(!e) e = window.event;
	var key = e.which || e.keyCode;

	if ((e.keyCode == 13 || e.keyCode == 10) && e.ctrlKey)
	{
		var form = BX('REVIEW_TEXT').form;
		BX.submit(form);
	}
}

<? } ?>
</script>
<form name="<?=$arParams["FORM_ID"]?>" id="<?=$arParams["FORM_ID"]?>" action="<?=POST_FORM_ACTION_URI?>#postform"<?
	?> method="POST" enctype="multipart/form-data" onsubmit="return ValidateForm(this);"<?
	?> class="comments-form">
	<input type="hidden" name="back_page" value="<?=$arResult["CURRENT_PAGE"]?>" />
	<input type="hidden" name="ELEMENT_ID" value="<?=$arParams["ELEMENT_ID"]?>" />
	<input type="hidden" name="comment_review" value="Y" />
	<input type="hidden" name="preview_comment" value="N" />
	<?=bitrix_sessid_post()?>
<?
if ($arParams['AUTOSAVE'])
	$arParams['AUTOSAVE']->Init();
?>
	<div style="position:relative; display: block; width:100%;">
<?
/* GUEST PANEL */
if (!$GLOBALS["USER"]->IsAuthorized())
{
?>
	<div class="comments-reply-fields">
		<div class="comments-reply-field-user">
			<div class="comments-reply-field comments-reply-field-author"><label for="REVIEW_AUTHOR<?=$arParams["form_index"]?>"><?=GetMessage("OPINIONS_NAME")?><?
				?><span class="comments-required-field">*</span></label>
				<span><input name="REVIEW_AUTHOR" id="REVIEW_AUTHOR<?=$arParams["form_index"]?>" size="30" type="text" value="<?=$arResult["REVIEW_AUTHOR"]?>" tabindex="<?=$tabIndex++;?>" /></span></div>
<?
			if ($arResult["FORUM"]["ASK_GUEST_EMAIL"]=="Y")
			{
?>
			<div class="comments-reply-field-user-sep">&nbsp;</div>
			<div class="comments-reply-field comments-reply-field-email"><label for="REVIEW_EMAIL<?=$arParams["form_index"]?>"><?=GetMessage("OPINIONS_EMAIL")?></label>
				<span><input type="text" name="REVIEW_EMAIL" id="REVIEW_EMAIL<?=$arParams["form_index"]?>" size="30" value="<?=$arResult["REVIEW_EMAIL"]?>" tabindex="<?=$tabIndex++;?>" /></span></div>
<?
			}
?>
			<div class="comments-clear-float"></div>
		</div>
	</div>
<?
}
?>
<?
	$arEditTpl = array();
	foreach (GetModuleEvents('forum', 'OnCommentFormDisplay', true) as $arEvent)
	{
		$arExt = ExecuteModuleEventEx($arEvent);
		if ($arExt !== null)
		{
			foreach($arExt as $arTpl)
				$APPLICATION->AddViewContent(implode('_', array($tplID, 'EDIT', $arTpl['DISPLAY'])), $arTpl['TEXT'], $arTpl['SORT']);
		}
	}
?>
<?=$APPLICATION->GetViewContent(implode('_', array($tplID, 'EDIT', 'BEFORE')));?>
	<div class="comments-reply-header"><?=$arParams["MESSAGE_TITLE"]?><span class="comments-required-field">*</span></div>
		<div class="comments-reply-field comments-reply-field-text">
<?
	if ($arParams['SHOW_WYSIWYG_EDITOR'] == 'Y')
	{
		$arSmiles = array();
		if ($arResult["FORUM"]["ALLOW_SMILES"] == "Y")
		{
			foreach($arResult["SMILES"] as $arSmile)
			{
				$arSmiles[] = array(
					'name' => $arSmile["NAME"],
					'path' => $arParams["PATH_TO_SMILE"].$arSmile["IMAGE"],
					'code' => array_shift(explode(" ", str_replace("\\\\","\\",$arSmile["TYPING"])))
				);
			}
		}

		CModule::IncludeModule("fileman");
		AddEventHandler("fileman", "OnIncludeLightEditorScript", "CustomizeLHEForForum");

		$LHE = new CLightHTMLEditor();

		$arEditorParams = array(
			'id' => $arParams["LheId"],
			'content' => isset($arResult["REVIEW_TEXT"]) ? $arResult["REVIEW_TEXT"] : "",
			'inputName' => "REVIEW_TEXT",
			'inputId' => "",
			'width' => "100%",
			'height' => "200px",
			'minHeight' => "200px",
			'bUseFileDialogs' => false,
			'bUseMedialib' => false,
			'BBCode' => true,
			'bBBParseImageSize' => true,
			'jsObjName' => $arParams["jsObjName"],
			'toolbarConfig' => array(),
			'smileCountInToolbar' => 3,
			'arSmiles' => $arSmiles,
			'bQuoteFromSelection' => true,
			'ctrlEnterHandler' => 'commentsCtrlEnterHandler'.$arParams["FORM_ID"],
			'bSetDefaultCodeView' => ($arParams['EDITOR_CODE_DEFAULT'] === 'Y'),
			'bResizable' => true,
			'bAutoResize' => true
		);

		$arEditorFeatures = array(
			"ALLOW_BIU" => array('Bold', 'Italic', 'Underline', 'Strike'),
			"ALLOW_FONT" => array('ForeColor','FontList', 'FontSizeList'),
			"ALLOW_QUOTE" => array('Quote'),
			"ALLOW_CODE" => array('Code'),
			'ALLOW_ANCHOR' => array('CreateLink', 'DeleteLink'),
			"ALLOW_IMG" => array('Image'),
			"ALLOW_VIDEO" => array('ForumVideo'),
			"ALLOW_TABLE" => array('Table'),
			"ALLOW_LIST" => array('InsertOrderedList', 'InsertUnorderedList'),
			"ALLOW_SMILES" => array('SmileList'),
			"ALLOW_UPLOAD" => array(''),
			"ALLOW_NL2BR" => array(''),
		);
		foreach ($arEditorFeatures as $featureName => $toolbarIcons)
		{
			if (isset($arResult['FORUM'][$featureName]) && ($arResult['FORUM'][$featureName] == 'Y'))
				$arEditorParams['toolbarConfig'] = array_merge($arEditorParams['toolbarConfig'], $toolbarIcons);
		}
		$arEditorParams['toolbarConfig'] = array_merge($arEditorParams['toolbarConfig'], array('RemoveFormat', 'Translit', 'Source'));

		$LHE->Show($arEditorParams);
	}
	else
	{
?>
		<textarea class="post_message" name="REVIEW_TEXT" id="REVIEW_TEXT" tabindex="<?=$tabIndex++;?>"><?=isset($arResult["REVIEW_TEXT"]) ? $arResult["REVIEW_TEXT"] : ""?></textarea>
<?
	}
?>
		</div>
<?=$APPLICATION->GetViewContent(implode('_', array($tplID, 'EDIT', 'AFTER')));?>
<?

/* CAPTHCA */
if (strLen($arResult["CAPTCHA_CODE"]) > 0)
{
?>
	<div class="comments-reply-field comments-reply-field-captcha">
		<input type="hidden" name="captcha_code" value="<?=$arResult["CAPTCHA_CODE"]?>"/>
		<div class="comments-reply-field-captcha-label">
			<label for="captcha_word"><?=GetMessage("F_CAPTCHA_PROMT")?><span class="comments-required-field">*</span></label>
			<input type="text" size="30" name="captcha_word" tabindex="<?=$tabIndex++;?>" autocomplete="off" />
		</div>
		<div class="comments-reply-field-captcha-image">
			<img src="/bitrix/tools/captcha.php?captcha_code=<?=$arResult["CAPTCHA_CODE"]?>" alt="<?=GetMessage("F_CAPTCHA_TITLE")?>" />
		</div>
	</div>
<?
}
?>
<? if (($arResult["FORUM"]["ALLOW_SMILES"] == "Y" && ($arParams['SHOW_WYSIWYG_EDITOR'] == 'Y')) || ($arParams["SHOW_SUBSCRIBE"] == "Y"))
{ ?>
		<div class="comments-reply-field comments-reply-field-settings">
<?
/* SMILES */
if ($arResult["FORUM"]["ALLOW_SMILES"] == "Y" && ($arParams['SHOW_WYSIWYG_EDITOR'] == 'Y'))
{
?>
			<div class="comments-reply-field-setting">
				<input type="checkbox" name="REVIEW_USE_SMILES" id="REVIEW_USE_SMILES<?=$arParams["form_index"]?>" <?
				?>value="Y" <?=($arResult["REVIEW_USE_SMILES"]=="Y") ? "checked=\"checked\"" : "";?> <?
				?>tabindex="<?=$tabIndex++;?>" /><?
			?>&nbsp;<label for="REVIEW_USE_SMILES<?=$arParams["form_index"]?>"><?=GetMessage("F_WANT_ALLOW_SMILES")?></label></div>
<?
}
/* SUBSCRIBE */
if ($arParams["SHOW_SUBSCRIBE"] == "Y")
{
?>
			<div class="comments-reply-field-setting">
				<input type="checkbox" name="TOPIC_SUBSCRIBE" id="TOPIC_SUBSCRIBE<?=$arParams["form_index"]?>" value="Y" <?
					?><?=($arResult["TOPIC_SUBSCRIBE"] == "Y")? "checked disabled " : "";?> tabindex="<?=$tabIndex++;?>" /><?
				?>&nbsp;<label for="TOPIC_SUBSCRIBE<?=$arParams["form_index"]?>"><?=GetMessage("F_WANT_SUBSCRIBE_TOPIC")?></label></div>
<?
		if ($arResult["FORUM_SUBSCRIBE"] == "Y")
		{
?>			<div class="comments-reply-field-setting">
				<input type="checkbox" name="FORUM_SUBSCRIBE" id="FORUM_SUBSCRIBE<?=$arParams["form_index"]?>" value="Y" <?
				?><?=($arResult["FORUM_SUBSCRIBE"] == "Y")? "checked disabled " : "";?> tabindex="<?=$tabIndex++;?>"/><?
				?>&nbsp;<label for="FORUM_SUBSCRIBE<?=$arParams["form_index"]?>"><?=GetMessage("F_WANT_SUBSCRIBE_FORUM")?></label></div>
<?
		}
}
?>
		</div>
<? } ?>
		<div class="comments-reply-buttons">
			<input name="send_button" type="submit" value="<?=GetMessage("OPINIONS_SEND")?>" tabindex="<?=$tabIndex++;?>" <?
				?>onclick="this.form.preview_comment.value = 'N';" />
			<input name="view_button" type="submit" value="<?=GetMessage("OPINIONS_PREVIEW")?>" tabindex="<?=$tabIndex++;?>" <?
				?>onclick="this.form.preview_comment.value = 'VIEW';" />
		</div>

	</div>
</form>
</div>
<?
if ($arParams['AUTOSAVE'])
	$arParams['AUTOSAVE']->LoadScript(array(
		"formID" => $arParams["FORM_ID"],
		"controlID" => "REVIEW_TEXT"
	));
//GetMessage("F_HIDE");
//GetMessage("F_SHOW");
?>
</div>