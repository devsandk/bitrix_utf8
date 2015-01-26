<?
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true) die();
/** @var CBitrixComponent $this */
/** @var array $arParams */
/** @var array $arResult */
/** @var string $componentPath */
/** @var string $componentName */
/** @var string $componentTemplate */
/** @global CDatabase $DB */
/** @global CUser $USER */
/** @global CMain $APPLICATION */

if(!CModule::IncludeModule("iblock"))
{
	ShowError(GetMessage("IBLOCK_MODULE_NOT_INSTALLED"));
	return;
}

/*************************************************************************
	Processing of received parameters
*************************************************************************/
if(!isset($arParams["CACHE_TIME"]))
	$arParams["CACHE_TIME"] = 3600;

if(isset($arParams["URL"]))
{
	$ar = parse_url($arParams["URL"]);
	if(is_array($ar))
	{
		$arParams["SITE"] = $ar["host"];
		$arParams["PORT"] = $ar["port"] > 0? intval($ar["port"]): 80;
		$arParams["PATH"] = $ar["path"];
		$arParams["QUERY_STR"] = $ar["query"];
	}
}
else
{
	$arParams["SITE"] = trim($arParams["SITE"]);
	$arParams["PORT"] = intval($arParams["PORT"]);
	$arParams["PATH"] = trim($arParams["PATH"]);
	$arParams["QUERY_STR"] = trim($arParams["QUERY_STR"]);
}
$arParams["OUT_CHANNEL"] = $arParams["OUT_CHANNEL"]=="Y";
$arParams["NUM_NEWS"] = intval($arParams["NUM_NEWS"]);
if($arParams["PROCESS"] != "QUOTE" && $arParams["PROCESS"] != "TEXT")
	$arParams["PROCESS"] = "NONE";
/*************************************************************************
	Start caching
*************************************************************************/
if($this->StartResultCache())
{
	$arResult = CIBlockRSS::GetNewsEx($arParams["SITE"], $arParams["PORT"], $arParams["PATH"], $arParams["QUERY_STR"], $arParams["OUT_CHANNEL"]);
	$arResult = CIBlockRSS::FormatArray($arResult, $arParams["OUT_CHANNEL"]);
	if($arParams["NUM_NEWS"]>0)
		while(count($arResult["item"])>$arParams["NUM_NEWS"])
			array_pop($arResult["item"]);

	if($arParams["PROCESS"] == "QUOTE")
		array_walk_recursive($arResult, create_function('&$val, $key', '$val=htmlspecialcharsex($val);'));
	elseif($arParams["PROCESS"] == "TEXT")
		array_walk_recursive($arResult, create_function('&$val, $key', '$val=str_replace(array("    ", "\\r\\n"), array("&nbsp;&nbsp;&nbsp;&nbsp;", "<br>"), HTMLToTxt($val));'));

	$this->IncludeComponentTemplate();
}
?>
