<?if(!Defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true) die();

$arResult = array(
	"CURRENT_PAGE" => $APPLICATION->GetCurPage(),
	"AJAX_URL" => $componentPath."/ajax.php"
);

$arResult["PATH"] = isset($_REQUEST["path"]) ? $_REQUEST["path"] : '';
$arResult["DATA"] = CAdminMobilePush::getData($arResult["PATH"]);

CJSCore::Init('ajax');

$this->IncludeComponentTemplate();
?>