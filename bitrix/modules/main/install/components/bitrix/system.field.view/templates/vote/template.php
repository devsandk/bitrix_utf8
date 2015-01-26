<?if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true) die();
if (IsModuleInstalled("vote"))
{
	$arComponentParams = array(
		"CHANNEL_ID" => $arParams["~arUserField"]["SETTINGS"]["CHANNEL_ID"],
		"VOTE_ID" => $arParams["~arUserField"]["VALUE"],
		"NAME_TEMPLATE" => $arParams["~arAddField"]["NAME_TEMPLATE"],
		"PATH_TO_USER" => $arParams["~arAddField"]["PATH_TO_USER"]
	);

	if (isset($arParams["ACTION_PAGE"]))
	{
		$arComponentParams["ACTION_PAGE"] = $arParams["ACTION_PAGE"];
	}

	$GLOBALS["APPLICATION"]->IncludeComponent(
		"bitrix:voting.current",
		".userfield",
		$arComponentParams,
		null,
		array("HIDE_ICONS" => "Y")
	);
}
?>