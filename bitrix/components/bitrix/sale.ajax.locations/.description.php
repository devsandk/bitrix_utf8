<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true) die();

$arComponentDescription = array(
	"NAME" => GetMessage("SAL_DEFAULT_TEMPLATE_NAME"),
	"DESCRIPTION" => GetMessage("SAL_DEFAULT_TEMPLATE_DESCRIPTION"),
	"ICON" => "/images/sale_ajax_locations.gif",
	"PATH" => array(
		"ID" => "e-store",
		"CHILD" => array(
			"ID" => "sale_order",
			"NAME" => GetMessage("SAL_NAME")
		)
	),
);
?>