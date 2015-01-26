<?if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();
$APPLICATION->SetAdditionalCSS("/bitrix/components/bitrix/socialnetwork.log.ex/templates/.default/style.css");
$APPLICATION->SetAdditionalCSS("/bitrix/components/bitrix/socialnetwork.blog.blog/templates/.default/style.css");
\Bitrix\Main\Page\Asset::getInstance()->addJs("/bitrix/components/bitrix/main.post.list/templates/.default/scripts_for_form.js");
if (CModule::IncludeModule("im"))
	\Bitrix\Main\Page\Asset::getInstance()->addJs("/bitrix/components/bitrix/main.post.list/templates/.default/scripts_for_im.js");

CUtil::InitJSCore(array("date", "fx", "popup", "viewer"));
$ajax_page = CUtil::JSEscape($APPLICATION->GetCurPageParam("", array("logajax", "bxajaxid", "logout")));
$todayString = ConvertTimeStamp();
ob_start();
?>
	<!--RCRD_#FULL_ID#-->
	<a id="com#ID#" name="com#ID#" bx-mpl-full-id="#FULL_ID#"></a>
	<div id="record-#FULL_ID#" class="feed-com-block-outer">
		#BEFORE_RECORD#
		<div class="feed-com-block feed-com-block-#NEW# blog-comment-user-#AUTHOR_ID# sonet-log-comment-createdby-#AUTHOR_ID# feed-com-block-#APPROVED##CLASSNAME#">
			#BEFORE_HEADER#
			<div class="feed-com-avatar feed-com-avatar-#AUTHOR_AVATAR_IS#"><img src="#AUTHOR_AVATAR#" width="<?=$arParams["AVATAR_SIZE"]?>" height="<?=$arParams["AVATAR_SIZE"]?>" /></div>
			<!--/noindex-->
				<span class="feed-com-name feed-author-name feed-author-name-#AUTHOR_ID#">#AUTHOR_NAME#</span>
				<a class="feed-com-name #AUTHOR_EXTRANET_STYLE# feed-author-name feed-author-name-#AUTHOR_ID#" id="bpc_#FULL_ID#" href="#AUTHOR_URL#">#AUTHOR_NAME#</a>
				<script type="text/javascript">BX.tooltip('#AUTHOR_ID#', "bpc_#FULL_ID#", '<?=$ajax_page?>');</script>
			<!--/noindex-->
			<div class="feed-com-informers">
				<span class="feed-time">#DATE#</span>
				#BEFORE_ACTIONS#
				<?if ( $arParams["SHOW_POST_FORM"] == "Y" )
				{
					?><a href="javascript:void(0);" class="feed-com-reply feed-com-reply-#SHOW_POST_FORM#" <?
						?>id="record-#FULL_ID#-actions-reply" <?
						?>onclick="window['UC']['#ENTITY_XML_ID#'].reply(this)" <?
						?>bx-mpl-author-id="#AUTHOR_ID#" <?
						?>bx-mpl-author-name="#AUTHOR_NAME#"><?=GetMessage("BLOG_C_REPLY")?></a><?
				} ?>
				<a href="#" <?
					?>id="record-#FULL_ID#-actions" <?
					?>bx-mpl-view-url="#VIEW_URL###ID#" bx-mpl-view-show="#VIEW_SHOW#" <?
					?>bx-mpl-edit-url="#EDIT_URL#" bx-mpl-edit-show="#EDIT_SHOW#" <?
					?>bx-mpl-moderate-url="#MODERATE_URL#" bx-mpl-moderate-show="#MODERATE_SHOW#" bx-mpl-moderate-approved="#APPROVED#" <?
					?>bx-mpl-delete-url="#DELETE_URL###ID#" bx-mpl-delete-show="#DELETE_SHOW#" <?
					?>onclick="fcShowActions('#ENTITY_XML_ID#', '#ID#', this); return BX.PreventDefault(this);" <?
					?>class="feed-post-more-link feed-post-more-link-#VIEW_SHOW#-#EDIT_SHOW#-#MODERATE_SHOW#-#DELETE_SHOW#"><?
					?><span class="feed-post-more-text"><?=GetMessage("BLOG_C_BUTTON_MORE")?></span><?
					?><span class="feed-post-more-arrow"></span><?
					?></a>
				#AFTER_ACTIONS#
			</div>
			#AFTER_HEADER#
			#BEFORE#
			<div class="feed-com-text">
				<div class="feed-com-text-inner">
					<div class="feed-com-text-inner-inner" id="record-#FULL_ID#-text">
						<div>#TEXT#</div>
					</div>
				</div>
				<div class="feed-post-text-more" onclick="fcExpandComment('#FULL_ID#', this)" id="record-#FULL_ID#-more">
					<div class="feed-post-text-more-but"><div class="feed-post-text-more-left"></div><div class="feed-post-text-more-right"></div></div>
				</div><?
				?><script>
					if (typeof arCommentsMoreButtonID == 'undefined')
					{
						var arCommentsMoreButtonID = [];
					}
					arCommentsMoreButtonID[arCommentsMoreButtonID.length] = {
						'bodyBlockID' : 'record-#FULL_ID#-text',
						'moreButtonBlockID' : 'record-#FULL_ID#-more'
					};
				</script><?
			?></div>
			#AFTER#
		</div>
		#AFTER_RECORD#
	</div>
	<div id="record-#FULL_ID#-placeholder" class="blog-comment-edit feed-com-add-block blog-post-edit" style="display:none;"></div>
	<!--RCRD_END_#FULL_ID#-->
<?
$template = ob_get_clean();


if (empty($arParams["RECORDS"]))
{
	?><div id="record-<?=$arParams["ENTITY_XML_ID"]?>-corner" class="feed-com-corner"></div><?
}
else
{
	if (!!$arParams["NAV_STRING"] && !!$arParams["NAV_RESULT"])
	{
		$count = $arParams["NAV_RESULT"]->NavRecordCount;
		if ($arParams["VISIBLE_RECORDS_COUNT"] > 0)
			$count -= $arParams["VISIBLE_RECORDS_COUNT"];
		else
			$count -= ($arParams["NAV_RESULT"]->NavPageNomer * $arParams["NAV_RESULT"]->NavPageSize);
		if ($count > 0)
		{
			ob_start();

			if ($arParams["PREORDER"] == "Y")
			{
				?><div id="<?=$arParams["ENTITY_XML_ID"]?>_hidden_records" class="feed-hidden-post" style="display:none; overflow:hidden;"></div> <?
			}
			?><div class="feed-com-header">
			<a class="feed-com-all" href="<?=$arParams["NAV_STRING"]?>" id="<?=$arParams["ENTITY_XML_ID"]?>_page_nav"><?
				?><?=GetMessage("BLOG_C_VIEW")?> (<?=$count?>)<i></i></a>
			</div><?
			if ($arParams["PREORDER"] != "Y")
			{
				?><div id="<?=$arParams["ENTITY_XML_ID"]?>_hidden_records" class="feed-hidden-post" style="display:none; overflow:hidden;"></div> <?
			}
			$arParams["NAV_STRING"] = ob_get_clean();
		}
		else
		{
			$arParams["NAV_STRING"] = "";
		}
	}
	$tmp = reset($arParams["RECORDS"]);
	?><div class="feed-com-corner<?=($arParams["NAV_STRING"] === "" && $tmp["NEW"] == "Y" ? " feed-post-block-yellow-corner" : "")?>"></div><?
	if ($arParams["PREORDER"] != "Y"): ?><?=$arParams["NAV_STRING"]?><? endif;
	$iCount = 0;
	?><!--RCRDLIST_<?=$arParams["ENTITY_XML_ID"]?>--><?
	foreach ($arParams["RECORDS"] as $key => $res)
	{
		$res["AUTHOR"] = (is_array($res["AUTHOR"]) ? $res["AUTHOR"] : array());
		$iCount++;
	?>
		<div id="record-<?=$arParams["ENTITY_XML_ID"]?>-<?=$res["ID"]?>-cover" class="feed-com-block-cover"><?
			$result = $template;
			$uf = "";
			if (is_array($res["UF"]))
			{
				ob_start();
				foreach ($res["UF"] as $arPostField)
				{
					if(!empty($arPostField["VALUE"]))
					{
						$GLOBALS["APPLICATION"]->IncludeComponent("bitrix:system.field.view", $arPostField["USER_TYPE"]["USER_TYPE_ID"],
							array("arUserField" => $arPostField), null, array("HIDE_ICONS"=>"Y"));
					}
				}
				$uf = ob_get_clean();
				$res["AFTER"] = $uf.$res["AFTER"];
				$this->__component->arParams["RECORDS"][$key]["AFTER"] = $res["AFTER"];
				$this->__component->arParams["RECORDS"][$key]["CLASSNAME"] .= " feed-com-block-uf";
			}
			$result = str_replace(array(
				"#ID#",
				"#FULL_ID#",
				"#ENTITY_XML_ID#",
				"#NEW#",
				"#APPROVED#",
				"#DATE#",
				"#TEXT#",
				"#CLASSNAME#",
				"#VIEW_URL#",
				"#VIEW_SHOW#",
				"#EDIT_URL#",
				"#EDIT_SHOW#",
				"#MODERATE_URL#",
				"#MODERATE_SHOW#",
				"#DELETE_URL#",
				"#DELETE_SHOW#",
				"#BEFORE_HEADER#",
				"#BEFORE_ACTIONS#",
				"#AFTER_ACTIONS#",
				"#AFTER_HEADER#",
				"#BEFORE#",
				"#AFTER#",
				"#BEFORE_RECORD#",
				"#AFTER_RECORD#",
				"#AUTHOR_ID#",
				"#AUTHOR_AVATAR_IS#",
				"#AUTHOR_AVATAR#",
				"#AUTHOR_URL#",
				"#AUTHOR_NAME#",
				"#SHOW_POST_FORM#",
				"#AUTHOR_EXTRANET_STYLE#",
			), array(
				$res["ID"],
				$arParams["ENTITY_XML_ID"]."-".$res["ID"],
				$arParams["ENTITY_XML_ID"],
				($res["NEW"] == "Y" ? "new" : "old"),
				($res["APPROVED"] != "Y" ? "hidden" : "approved"),
				(ConvertTimeStamp($res["POST_TIMESTAMP"], "SHORT") == $todayString ? $res["POST_TIME"] : $res["POST_DATE"]),
				$res["POST_MESSAGE_TEXT"],
				(isset($res["CLASSNAME"]) ? " ".$res["CLASSNAME"] : ""),
				$res["URL"]["LINK"],
				(!!$res["URL"]["LINK"] ? "Y" : "N"),
				$res["URL"]["EDIT"],
				$res["PANELS"]["EDIT"],
				$res["URL"]["MODERATE"],
				$res["PANELS"]["MODERATE"],
				$res["URL"]["DELETE"],
				$res["PANELS"]["DELETE"],
				$res["BEFORE_HEADER"],
				$res["BEFORE_ACTIONS"],
				$res["AFTER_ACTIONS"],
				$res["AFTER_HEADER"],
				$res["BEFORE"],
				$res["AFTER"],
				$res["BEFORE_RECORD"],
				$res["AFTER_RECORD"],
				$res["AUTHOR"]["ID"],
				(empty($res["AUTHOR"]["AVATAR"]) ? "N" : "Y"),
				($res["AUTHOR"]["AVATAR"] ? $res["AUTHOR"]["AVATAR"] : "/bitrix/images/1.gif"),
				$res["AUTHOR"]["URL"],
				$res["AUTHOR"]["NAME"],
				$arParams["SHOW_POST_FORM"],
				($res["AUTHOR"]["IS_EXTRANET"] ? ' feed-com-name-extranet' : ''),
			), $result);
			$result = str_replace("background:url('') no-repeat center;", "", $result);
			?><?=$result?>
		</div>
	<?
	}
	?><!--RCRDLIST_END_<?=$arParams["ENTITY_XML_ID"]?>--><?
	if ($arParams["PREORDER"] == "Y"): ?><?=$arParams["NAV_STRING"]?><? endif;
}
?>
<script type="text/javascript">
BX.ready(function(){
	window["UC"]["<?=$arParams["ENTITY_XML_ID"]?>"] = new FCList({
			ENTITY_XML_ID : '<?=$arParams["ENTITY_XML_ID"]?>',
			container : BX('<?=$arParams["ENTITY_XML_ID"]?>_hidden_records'),
			nav : BX('<?=$arParams["ENTITY_XML_ID"]?>_page_nav'),
			mid : <?=(!!$arParams["LAST_RECORD"] ? $arParams["LAST_RECORD"]["ID"] : 0)?>,
			order : '<?=($arParams["PREORDER"] == "N" ? "DESC" : "ASC")?>',
			rights : <?=CUtil::PhpToJSObject($arParams["RIGHTS"])?>,
			params : {
				DATE_TIME_FORMAT : '<?=CUtil::JSEscape($arParams["~DATE_TIME_FORMAT"])?>',
				NOTIFY_TAG : '<?=CUtil::JSEscape($arParams["~NOTIFY_TAG"])?>',
				NOTIFY_TEXT : '<?=CUtil::JSEscape($arParams["~NOTIFY_TEXT"])?>',
				PATH_TO_USER : '<?=CUtil::JSEscape($arParams["~PATH_TO_USER"])?>',
				AVATAR_SIZE : '<?=CUtil::JSEscape($arParams["AVATAR_SIZE"])?>',
				NAME_TEMPLATE : '<?=CUtil::JSEscape($arParams["~NAME_TEMPLATE"])?>',
				SHOW_LOGIN : '<?=CUtil::JSEscape($arParams["SHOW_LOGIN"])?>',
				SHOW_FORM : '<?=CUtil::JSEscape($arParams["SHOW_POST_FORM"])?>'
			}
		}
	);
	<?if ($arParams["BIND_VIEWER"] == "Y"):?>
	BX.viewElementBind(
		BX('record-<?=$arParams["ENTITY_XML_ID"]?>-new').parentNode,
		{},
		function(node){
			return BX.type.isElementNode(node) && (node.getAttribute('data-bx-viewer') || node.getAttribute('data-bx-image'));
		}
	);
	<?endif;?>
<?
if ($GLOBALS["USER"]->IsAuthorized() && CModule::IncludeModule("pull") && CPullOptions::GetNginxStatus())
{
	?>
	BX.addCustomEvent("onPullEvent-unicomments", function(command, params) {
		if (params["ENTITY_XML_ID"] == '<?=$arParams["ENTITY_XML_ID"]?>') {
			if (command == 'comment' && !!params["ID"]){
				window["UC"]["<?=$arParams["ENTITY_XML_ID"]?>"].pullNewRecord(params);
			} else if (command == 'answer' && params["USER_ID"] != <?=$GLOBALS["USER"]->GetId()?>)
				window["UC"]["<?=$arParams["ENTITY_XML_ID"]?>"].pullNewAuthor(params["USER_ID"], params["NAME"], params["AVATAR"]);
		}
	});<?
} ?>
});
</script>
<div id="record-<?=$arParams["ENTITY_XML_ID"]?>-new"></div><?
if (!empty($arParams["ERROR_MESSAGE"]))
{
	?><div class="feed-add-error"><span class="feed-add-info-text"><span class="feed-add-info-icon"></span>
		<b><?=GetMessage("B_B_PC_COM_ERROR")?></b><br /><?=$arParams["ERROR_MESSAGE"]?></span></div><?
}
include_once(__DIR__."/messages.php");
if ($arParams["SHOW_POST_FORM"] == "Y")
{
	$AUTHOR_AVATAR = __mpl_get_avatar();
	?>
		<div id="record-<?=$arParams["ENTITY_XML_ID"]?>-0-placeholder" class="blog-comment-edit feed-com-add-block blog-post-edit" style="display:none;"><?
			?><div class="feed-com-avatar feed-com-avatar-<?=($AUTHOR_AVATAR == '/bitrix/images/1.gif' ? "N" : "Y")?>"><?
				?><img width="<?=$arParams["AVATAR_SIZE"]?>" height="<?=$arParams["AVATAR_SIZE"]?>" src="<?=$AUTHOR_AVATAR?>"><?
			?></div><?
		?></div><?
		?><div class="feed-com-footer" id="record-<?=$arParams["ENTITY_XML_ID"]?>-switcher" onclick="window['UC']['<?=$arParams["ENTITY_XML_ID"]?>'].reply();" <?
			?><?if ($arParams['SHOW_MINIMIZED'] != "Y"): ?> style="display:none;" <? endif; ?>><?
			?><div class="feed-com-add"><?
				?><div class="feed-com-avatar feed-com-avatar-<?=($AUTHOR_AVATAR == '/bitrix/images/1.gif' ? "N" : "Y")?>"><?
					?><img width="<?=$arParams["AVATAR_SIZE"]?>" height="<?=$arParams["AVATAR_SIZE"]?>" src="<?=$AUTHOR_AVATAR?>"><?
				?></div><?
				?><a class="feed-com-add-link" href="javascript:void(0);"  style="outline: none;" hidefocus="true"><?=GetMessage("B_B_MS_ADD_COMMENT")?></a><?
			?></div><?
		?></div><?
}
?>