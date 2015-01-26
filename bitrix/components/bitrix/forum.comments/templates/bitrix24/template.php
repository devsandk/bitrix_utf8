<?if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();
CUtil::InitJSCore(array('ajax'));
// ************************* Input params***************************************************************
$tplID = 'COMMENT_'.$arParams["ENTITY_TYPE"].'_';

if (LANGUAGE_ID == 'ru')
{
	$path = str_replace(array("\\", "//"), "/", __DIR__."/ru/script.php");
	include($path);
}
?>
<div class="feed-wrap">
<div class="feed-comments-block">
	<a name="comments"></a>
<?
// *************************/Input params***************************************************************
if (!empty($arResult["MESSAGES"]))
{
	$arResult["NAV_STRING"] = GetPagePath(false, false);
	if ($arResult["NAV_RESULT"])
	{
		$strNavQueryString = htmlspecialcharsbx(DeleteParam(array(
			"PAGEN_".$arResult["NAV_RESULT"]->NavNum,
			"SIZEN_".$arResult["NAV_RESULT"]->NavNum,
			"SHOWALL_".$arResult["NAV_RESULT"]->NavNum,
			"MID", "result",
			"PHPSESSID",
			"clear_cache"
		)));
		if (!!$strNavQueryString)
			$arResult["NAV_STRING"] .= "?".$strNavQueryString;
	}

	foreach ($arResult["MESSAGES"] as $res)
	{
		foreach (GetModuleEvents('forum', 'OnCommentDisplay', true) as $arEvent)
		{
			$arExt = ExecuteModuleEventEx($arEvent, array($res));
			if ($arExt !== null)
			{
				foreach($arExt as $arTpl)
					$APPLICATION->AddViewContent(implode('_', array($tplID, 'ID', $res['ID'], $arTpl['DISPLAY'])), $arTpl['TEXT'], $arTpl['SORT']);
			}
		}
	}
}

$arResult["OUTPUT_LIST"] = $APPLICATION->IncludeComponent(
	"bitrix:main.post.list",
	"",
	array(
		"RECORDS" => $arResult["MESSAGES"],
		"RESULT" => $arResult["RESULT"],
		"NAV_STRING" => $arResult["NAV_STRING"],
		"NAV_RESULT" => $arResult["NAV_RESULT"],
		"PREORDER" => $arParams["PREORDER"],
		"RIGHTS" => array(
			"MODERATE" =>  $arResult["PANELS"]["MODERATE"],
			"EDIT" => ($arResult["PANELS"]["EDIT"] == "N" ? ($arParams["ALLOW_EDIT_OWN_MESSAGE"] === "ALL" ? "OWN" : (
				$arParams["ALLOW_EDIT_OWN_MESSAGE"] === "LAST" ? "OWNLAST" : "N") ) : "Y"),
			"DELETE" => ($arResult["PANELS"]["EDIT"] == "N" ? ($arParams["ALLOW_EDIT_OWN_MESSAGE"] === "ALL" ? "OWN" : (
				$arParams["ALLOW_EDIT_OWN_MESSAGE"] === "LAST" ? "OWNLAST" : "N") ) : "Y")
		),
		"VISIBLE_RECORDS_COUNT" => 3,
		"TEMPLATE_ID" => $tplID,
		"ENTITY_XML_ID" => $arParams["ENTITY_XML_ID"],
		"ERROR_MESSAGE" => $arResult["ERROR_MESSAGE"],
		"OK_MESSAGE" => $arResult["OK_MESSAGE"],
		"SHOW_POST_FORM" => $arResult["SHOW_POST_FORM"],
		"SHOW_MINIMIZED" => $arParams["SHOW_MINIMIZED"],
		"FORM_ID" => $arParams["FORM_ID"],
		"PUSH&PULL" => array (
			"ACTION" => $_REQUEST['REVIEW_ACTION'],
			"ID" => $arResult["RESULT"]
		),
		"IMAGE_SIZE" => $arParams["IMAGE_SIZE"],
		"jsObjName" => $arParams["jsObjName"],
		"mfi" => $arParams["mfi"],
		"DATE_TIME_FORMAT" => $arParams["DATE_TIME_FORMAT"],
		"BIND_VIEWER" => $arParams["BIND_VIEWER"]
	),
	$this->__component
);
?><?=$arResult["OUTPUT_LIST"]["HTML"]?><?
if ($arResult["SHOW_POST_FORM"] == "Y")
{
	include(__DIR__."/form.php");
}
?>
</div>
</div>