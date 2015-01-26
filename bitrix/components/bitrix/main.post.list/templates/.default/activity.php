<?
define("PUBLIC_AJAX_MODE", true);
define("NO_KEEP_STATISTIC", "Y");
define("NO_AGENT_STATISTIC","Y");
define("NO_AGENT_CHECK", true);
define("DisableEventsCheck", true);

require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_before.php");

$arParams["AVATAR_SIZE"] = intval($_REQUEST["AVATAR_SIZE"]);
$arParams["AVATAR_SIZE"] = ($arParams["AVATAR_SIZE"] > 0 ? $arParams["AVATAR_SIZE"] : 42);
$arParams["NAME_TEMPLATE"] = (!!$_REQUEST["NAME_TEMPLATE"] ? $_REQUEST["NAME_TEMPLATE"] : CSite::GetNameFormat());
$arParams["SHOW_LOGIN"] = ($_REQUEST["SHOW_LOGIN"] == "Y" ? "Y" : "N");

$arResult = array();
if (check_bitrix_sessid() && $_REQUEST["MODE"] == "PUSH&PULL" &&
	$GLOBALS["USER"]->IsAuthorized() && !!$_REQUEST["ENTITY_XML_ID"] &&
	is_array($_SESSION["UC"]) && array_key_exists($_REQUEST["ENTITY_XML_ID"], $_SESSION["UC"]) &&
	(time() - $_SESSION["UC"][$_REQUEST["ENTITY_XML_ID"]]["ACTIVITY"] > 10) &&
	CModule::IncludeModule("pull") && CPullOptions::GetNginxStatus())
{
	$_SESSION["UC"][$_REQUEST["ENTITY_XML_ID"]]["ACTIVITY"] = time();

	$dbUser = CUser::GetList(($sort_by = Array('ID'=>'desc')), ($dummy=''), Array("ID" => $GLOBALS["USER"]->GetId()),
		Array("FIELDS" => Array("ID", "LAST_NAME", "NAME", "SECOND_NAME", "LOGIN", "PERSONAL_PHOTO", "PERSONAL_GENDER")));
	$arUser = array();
	if($dbUser && ($arUser = $dbUser->GetNext()) && (intval($arUser["PERSONAL_PHOTO"]) > 0))
	{
		$arUser["PERSONAL_PHOTO_file"] = CFile::GetFileArray($arUser["PERSONAL_PHOTO"]);
		$arUser["PERSONAL_PHOTO_resized_30"] = CFile::ResizeImageGet(
			$arUser["PERSONAL_PHOTO_file"],
			array("width" => $arParams["AVATAR_SIZE"], "height" => $arParams["AVATAR_SIZE"]),
			BX_RESIZE_IMAGE_EXACT,
			false
		);
	}

	$arUserInfo = (!!$arUser ? $arUser : array("PERSONAL_PHOTO_resized_30" => array("src" => "")));
	$arUserInfo["NAME_FORMATED"] = CUser::FormatName(
		$arParams["NAME_TEMPLATE"],
		array(
			"NAME" => $arUserInfo["~NAME"],
			"LAST_NAME" => $arUserInfo["~LAST_NAME"],
			"SECOND_NAME" => $arUserInfo["~SECOND_NAME"],
			"LOGIN" => $arUserInfo["~LOGIN"],
			"NAME_LIST_FORMATTED" => "",
		),
		($arParams["SHOW_LOGIN"] != "N" ? true : false),
		false);
	CPullWatch::AddToStack('UNICOMMENTS'.$_REQUEST["ENTITY_XML_ID"],
		Array(
			'module_id' => 'unicomments',
			'command' => 'answer',
			'params' => Array(
				"USER_ID" => $GLOBALS["USER"]->GetId(),
				"ENTITY_XML_ID" => $_REQUEST["ENTITY_XML_ID"],
				"TS" => time(),
				"NAME" => $arUserInfo["NAME_FORMATED"],
				"AVATAR" => $arUserInfo["PERSONAL_PHOTO_resized_30"]["src"]
			)
		)
	);
	die();
}
?>