<?
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
	die();

/*
$APPLICATION->IncludeComponent(
	"bitrix:main.interface.filter",
	"",
	array(
		"GRID_ID"=>$arParams["~GRID_ID"],
		"FILTER"=>$arParams["~FILTER"],
		"FILTER_ROWS"=>$arResult["FILTER_ROWS"],
		"FILTER_FIELDS"=>$arResult["FILTER"],
		"OPTIONS"=>$arResult["OPTIONS"],
	),
	$component,
	array("HIDE_ICONS"=>true)
);
*/

$arParams["GRID_ID"] = preg_replace("/[^a-z0-9_]/i", "", $arParams["GRID_ID"]);

$arResult["FILTER_ROWS"] = $arParams["~FILTER_ROWS"];
$arResult["FILTER"] = $arParams["~FILTER_FIELDS"];
$arResult["OPTIONS"] = $arParams["~OPTIONS"];

//save GET parameters in form's hidden fields
$arResult["GET_VARS"] = array();
$aSkipVars = array('filter'=>'', 'clear_filter'=>'', 'logout'=>'', 'bxajaxid'=>'', 'AJAX_CALL'=>'');
$aSpecVars = array('_from', '_to', '_list', '_datesel', '_days');
foreach($_GET as $var=>$value)
{
	if(array_key_exists($var, $aSkipVars))
		continue;
	if(array_key_exists($var, $arResult["FILTER_ROWS"]))
		continue;
	foreach($aSpecVars as $v)
		if(substr($var, -($len=strlen($v))) == $v && array_key_exists(substr($var, 0, -($len)), $arResult["FILTER_ROWS"]))
			continue 2;
	$arResult["GET_VARS"][$var] = $value;
}

$arResult["DATE_FILTER"] = array(
	""=>GetMessage("interface_grid_no_no_no_1"),
	"today"=>GetMessage("inerface_grid_today"),
	"yesterday"=>GetMessage("inerface_grid_yesterday"),
	"week"=>GetMessage("inerface_grid_week"),
	"week_ago"=>GetMessage("inerface_grid_week_ago"),
	"month"=>GetMessage("inerface_grid_month"),
	"month_ago"=>GetMessage("inerface_grid_month_ago"),
	"days"=>GetMessage("inerface_grid_last"),
	"exact"=>GetMessage("inerface_grid_exact"),
	"after"=>GetMessage("inerface_grid_later"),
	"before"=>GetMessage("inerface_grid_earlier"),
	"interval"=>GetMessage("inerface_grid_interval"),
);

//*********************
// Self-explaining
//*********************

$this->IncludeComponentTemplate();
?>
