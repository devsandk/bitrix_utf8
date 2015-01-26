<?if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();
__IncludeLang(dirname(__FILE__)."/lang/".LANGUAGE_ID."/result_modifier.php");

/********************************************************************
				Input params
 ********************************************************************/
/***************** BASE ********************************************/
$arParams["FORM_ID"] = (!empty($arParams["FORM_ID"]) ? $arParams["FORM_ID"] : "POST_FORM");
$arParams["JS_OBJECT_NAME"] = "PlEditor".$arParams["FORM_ID"];
$arParams["LHE"] = (is_array($arParams['~LHE']) ? $arParams['~LHE'] : array());
$arParams["LHE"]["id"] = (empty($arParams["LHE"]["id"]) ? "idLHE_".$arParams["FORM_ID"] : $arParams["LHE"]["id"]);
$arParams["LHE"]["jsObjName"] = (empty($arParams["LHE"]["jsObjName"]) ? "oLHE".$arParams["FORM_ID"] : $arParams["LHE"]["jsObjName"]);
$arParams["LHE"]["bInitByJS"] = (empty($arParams["TEXT"]["VALUE"]) && $arParams["LHE"]["bInitByJS"] === true ? true : false);

$arParams["PARSER"] = array_unique(is_array($arParams["PARSER"]) ? $arParams["PARSER"] : array());
$arParams["BUTTONS"] = is_array($arParams["BUTTONS"]) ? $arParams["BUTTONS"] : array();
$arParams["BUTTONS"] = (in_array("MentionUser", $arParams["BUTTONS"]) && !IsModuleInstalled("socialnetwork") ?
	array_diff($arParams["BUTTONS"], array("MentionUser")) : $arParams["BUTTONS"]);
$arParams["BUTTONS"] = array_values($arParams["BUTTONS"]);
$arParams["BUTTONS_HTML"] = is_array($arParams["BUTTONS_HTML"]) ? $arParams["BUTTONS_HTML"] : array();

$arParams["TEXT"] = (is_array($arParams["~TEXT"]) ? $arParams["~TEXT"] : array());
$arParams["TEXT"]["ID"] = (!empty($arParams["TEXT"]["ID"]) ? $arParams["TEXT"]["ID"] : "POST_MESSAGE");
$arParams["TEXT"]["NAME"] = (!empty($arParams["TEXT"]["NAME"]) ? $arParams["TEXT"]["NAME"] : "POST_MESSAGE");
$arParams["TEXT"]["TABINDEX"] = intval($arParams["TEXT"]["TABINDEX"] <= 0 ? 10 : $arParams["TEXT"]["TABINDEX"]);
$arParams["TEXT"]["~SHOW"] = $arParams["TEXT"]["SHOW"];
$userOption = CUserOptions::GetOption("main.post.form", "postEdit");
if(isset($userOption["showBBCode"]) && $userOption["showBBCode"] == "Y")
	$arParams["TEXT"]["SHOW"] = "Y";

$arParams["ADDITIONAL"] = (is_array($arParams["~ADDITIONAL"]) ? $arParams["~ADDITIONAL"] : array());
$addSpan = true;
if (!empty($arParams["ADDITIONAL"]))
{
	$res = reset($arParams["ADDITIONAL"]);
	$res = trim($res);
	$addSpan = (substr($res, 0, 1) == "<");
}
$arParams["ADDITIONAL_TYPE"] = ($addSpan ? "html" : "popup");
if ($arParams["TEXT"]["~SHOW"] != "Y")
{
	if ($addSpan)
	{
		array_unshift(
			$arParams["ADDITIONAL"],
			"<span ".
				"onclick=\"window['".$arParams["JS_OBJECT_NAME"]."'].showPanelEditor();\" ".
				"class=\"feed-add-post-form-editor-btn".($arParams["TEXT"]["SHOW"] == "Y" ? " feed-add-post-form-btn-active" : "")."\" ".
				"id=\"lhe_button_editor_".$arParams["FORM_ID"]."\" ".
				"title=\"".GetMessage("MPF_EDITOR")."\"></span>");
	}
	else
	{
		$arParams["ADDITIONAL"][] =
			"{ text : '".GetMessage("MPF_EDITOR")."', onclick : function() {window['".$arParams["JS_OBJECT_NAME"]."'].showPanelEditor(); this.popupWindow.close();}, className: 'blog-post-popup-menu', id: 'bx-html'}";
	}
}

/**
 * @var string $arParams["HTML_BEFORE_TEXTAREA"]
 * @var string $arParams["HTML_AFTER_TEXTAREA"]
 * @var array $arParams["UPLOAD_FILE"]
 * @var array $arParams["UPLOAD_WEBDAV_ELEMENT"]
 */
$arParams["UPLOADS_CID"] = array();
$arParams["UPLOADS_HTML"] = "";

$arParams["DESTINATION"] = (is_array($arParams["DESTINATION"]) && IsModuleInstalled("socialnetwork") ? $arParams["DESTINATION"] : array());
$arParams["DESTINATION_SHOW"] = (array_key_exists("SHOW", $arParams["DESTINATION"]) ? $arParams["DESTINATION"]["SHOW"] : $arParams["DESTINATION_SHOW"]);
$arParams["DESTINATION_SHOW"] = ($arParams["DESTINATION_SHOW"] == "Y" ? "Y" : "N");
$arParams["DESTINATION"] = (array_key_exists("VALUE", $arParams["DESTINATION"]) ? $arParams["DESTINATION"]["VALUE"] : $arParams["DESTINATION"]);
if (empty($arParams["DESTINATION"]) && in_array("MentionUser", $arParams["BUTTONS"]) && CModule::IncludeModule("socialnetwork"))
{
	$arStructure = CSocNetLogDestination::GetStucture(array("LAZY_LOAD" => true));
	$arParams["DESTINATION"] = array(
		"LAST" => array("USERS" => CSocNetLogDestination::GetLastUser()),
		"DEPARTMENT" => $arStructure['department'],
		"DEPARTMENT_RELATION" => $arStructure['department_relation']
	);

	if (CModule::IncludeModule('extranet') && !CExtranet::IsIntranetUser())
	{
		$arParams["DESTINATION"]['EXTRANET_USER'] = 'Y';
		$arParams["DESTINATION"]['USERS'] = CSocNetLogDestination::GetExtranetUser();
	}
	else
	{
		$arDestUser = Array();
		foreach ($arParams["DESTINATION"]['LAST']['USERS'] as $value)
			$arDestUser[] = str_replace('U', '', $value);

		$arParams["DESTINATION"]['EXTRANET_USER'] = 'N';
		$arParams["DESTINATION"]['USERS'] = CSocNetLogDestination::GetUsers(Array('id' => $arDestUser));
	}
}

$arParams["TAGS"] = (is_array($arParams["TAGS"]) ? $arParams["TAGS"] : array());
if (!empty($arParams["TAGS"]))
	$arParams["TAGS"]["VALUE"] = (is_array($arParams["TAGS"]["VALUE"]) ? $arParams["TAGS"]["VALUE"] : array());

$arParams["SMILES_COUNT"] = intVal($arParams["SMILES_COUNT"]);
$arParams["SMILES"] = (is_array($arParams["SMILES"]) ? $arParams["SMILES"] : array());
if (!empty($arParams["SMILES"]) && !in_array("SmileList", $arParams["PARSER"]))
	$arParams["PARSER"][] = "SmileList";

$arParams["CUSTOM_TEXT"] = (is_array($arParams["CUSTOM_TEXT"]) ? $arParams["CUSTOM_TEXT"] : array());
$arParams["CUSTOM_TEXT_HASH"] = (!empty($arParams["CUSTOM_TEXT"]) ? md5(implode("", $arParams["CUSTOM_TEXT"])) : "");

$arParams["IMAGE_THUMB"] = array("WIDTH" => 90, "HEIGHT" => 90);
$arParams["IMAGE"] = array("WIDTH" => 90, "HEIGHT" => 90);
/********************************************************************
				/Input params
 ********************************************************************/
?>