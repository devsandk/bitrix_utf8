<?
if($_SERVER["REQUEST_METHOD"] == "POST" && array_key_exists("PULL_AJAX_CALL", $_REQUEST) && $_REQUEST["PULL_AJAX_CALL"] === "Y")
{
	$arResult = array();
	global $USER, $APPLICATION, $DB;
	include($_SERVER["DOCUMENT_ROOT"]."/bitrix/components/bitrix/pull.request/ajax.php");
	die();
}
else if($_SERVER["REQUEST_METHOD"] == "POST" && array_key_exists("NPULL_AJAX_CALL", $_REQUEST) && $_REQUEST["NPULL_AJAX_CALL"] === "Y")
{
	$arResult = array();
	global $USER, $APPLICATION, $DB;
	include($_SERVER["DOCUMENT_ROOT"]."/bitrix/components/bitrix/pull.request/najax.php");
	die();
}
?>