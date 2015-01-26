<?if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();
if (!!$arResult["ERROR_MESSAGE"] && strpos($arResult["ERROR_MESSAGE"], "MID=") !== false)
{
	$arResult["ERROR_MESSAGE"] = preg_replace(array("/\(MID\=\d+\)/is", "/\s\s/", "/\s\./"), array("", " ", "."), $arResult["ERROR_MESSAGE"]);
}
if (!!$arResult["OK_MESSAGE"] && strpos($arResult["OK_MESSAGE"], "MID=") !== false)
{
	$arResult["OK_MESSAGE"] = preg_replace(array("/\(MID\=\d+\)/is", "/\s\s/", "/\s\./"), array("", " ", "."), $arResult["OK_MESSAGE"]);
}

$arParams["SHOW_LINK_TO_FORUM"] = ($arParams["SHOW_LINK_TO_FORUM"] == "Y" ? "Y" : "N");
$arParams["SHOW_LINK_TO_MESSAGE"] = ($arParams["SHOW_LINK_TO_MESSAGE"] == "N" ? "N" : "Y");
$arParams["SHOW_MINIMIZED"] = "Y";
$arParams["form_index"] = randstring(4);
$arParams["FORM_ID"] = "COMMENTS_".$arParams["form_index"];
$arParams["jsObjName"] = "oLHE_FC".$arParams["form_index"];
$arParams["LheId"] = "idLHE_FC".$arParams["form_index"];

if (!empty($arResult["MESSAGES"]))
{
	foreach ($arResult["MESSAGES"] as $key => $res)
	{
		$arResult["MESSAGES"][$key]["AUTHOR"] = array(
			"ID" => $res["AUTHOR_ID"],
			"NAME" => $res["AUTHOR_NAME"],
			"URL" => $res["AUTHOR_URL"],
			"AVATAR" => (is_array($res["AVATAR"]) && array_key_exists("FILE", $res["AVATAR"]) ? $res["AVATAR"]["FILE"]["src"] : ""),
		);
		$arResult["MESSAGES"][$key]["UF"] = $res["PROPS"];
		if ($arParams["SHOW_LINK_TO_MESSAGE"] == "N")
		{
			unset($arResult["MESSAGES"][$key]["URL"]["~LINK"]);
			unset($arResult["MESSAGES"][$key]["URL"]["LINK"]);
		}
	}
}

if (!!$arResult["objRating"])
{
	$arResult["objRating"]->display = array("BEFORE_ACTIONS" => true, "BEFORE_ACTIONS" => false);
	AddEventHandler("forum", "OnCommentDisplay", Array(&$arResult["objRating"], "OnCommentDisplay"));
}
AddEventHandler("forum", "OnCommentDisplay", Array(&$arResult["objFiles"], "OnCommentDisplay"));
AddEventHandler("forum", "OnCommentPreviewDisplay", Array(&$arResult["objFiles"], "OnCommentPreviewDisplay"));
//AddEventHandler("forum", "OnCommentDisplay", Array(&$arResult["objUFs"], "OnCommentDisplay"));
AddEventHandler("forum", "OnCommentPreviewDisplay", Array(&$arResult["objUFs"], "OnCommentPreviewDisplay"));
AddEventHandler("forum", "OnCommentFormDisplay", Array(&$arResult["objUFs"], "OnCommentFormDisplay"));
?>