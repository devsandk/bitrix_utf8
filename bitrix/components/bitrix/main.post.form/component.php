<?if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

if(strlen($arParams["FORM_ID"]) <= 0)
	$arParams["FORM_ID"] = "POST_FORM_".RandString(3);
$arParams['NAME_TEMPLATE'] = empty($arParams['NAME_TEMPLATE']) ? CSite::GetNameFormat(false) : str_replace(array("#NOBR#","#/NOBR#"), "", $arParams["NAME_TEMPLATE"]);

return $this->IncludeComponentTemplate();
?>