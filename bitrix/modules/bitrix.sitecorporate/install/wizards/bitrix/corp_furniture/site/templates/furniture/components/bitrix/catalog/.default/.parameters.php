<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true) die();

$arTemplateParameters = array(
	"DETAIL_SHOW_PICTURE" => Array(
		"NAME" => GetMessage("SHOW_PICTURE_DETAIL"),
		"TYPE" => "CHECKBOX",
		"MULTIPLE" => "N",
		"DEFAULT" => "Y",
		"PARENT" => 'DETAIL_SETTINGS',
	),
);
?>
