<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

use Bitrix\Main\Analytics\SiteSpeed;

$bFixed = (SiteSpeed::isOn() && $GLOBALS["USER"]->CanDoOperation("view_other_settings"));
$arDescription = array(
		"NAME" => GetMessage("GD_PERFMON_NAME"),
		"DESCRIPTION" => GetMessage("GD_PERFMON_DESC"),
		"ICON" => "",
		"TITLE_ICON_CLASS" => "bx-gadgets-perfmon",
		"GROUP" => array("ID"=>"admin_settings"),
		"NOPARAMS" => "Y",
		"AI_ONLY" => true,
		"PERFMON_ONLY" => true,
		"COLOURFUL" => true,
		"CAN_BE_FIXED" => $bFixed,
		"TOTALLY_FIXED" => $bFixed,
		"UNIQUE" => true,
	);
?>
