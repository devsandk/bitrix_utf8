<?
define('STOP_STATISTICS', true);
define('NO_AGENT_CHECK', true);
define('DisableEventsCheck', true);
define('BX_SECURITY_SHOW_MESSAGE', true);
define("PUBLIC_AJAX_MODE", true);
define("NOT_CHECK_PERMISSIONS", true);

require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_before.php");
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/iblock/admin_tools.php");
IncludeModuleLangFile(__FILE__);
header('Content-Type: application/x-javascript; charset='.LANG_CHARSET);

if(!CModule::includeModule("iblock") || !CModule::includeModule('fileman'))
{
	die();
}
CUtil::jSPostUnescape();
if (check_bitrix_sessid())
{
	if ($_REQUEST["ENTITY_TYPE"] === "B")
	{
		$ipropTemplates = new \Bitrix\Iblock\InheritedProperty\IblockTemplates($_REQUEST["ENTITY_ID"]);
		$arFields = array(
			"NAME" => $_POST["NAME"],
			"CODE" => $_POST["CODE"],
			"DESCRIPTION" => $_POST["DESCRIPTION"],
		);
	}
	elseif ($_REQUEST["ENTITY_TYPE"] === "S")
	{
		$ipropTemplates = new \Bitrix\Iblock\InheritedProperty\SectionTemplates($_REQUEST["IBLOCK_ID"], $_REQUEST["ENTITY_ID"]);
		$arFields = array(
			"IBLOCK_ID" => $_REQUEST["IBLOCK_ID"],
			"IBLOCK_SECTION_ID" => $_REQUEST["IBLOCK_SECTION_ID"],
			"NAME" => $_POST["NAME"],
			"CODE" => $_POST["CODE"],
			"DESCRIPTION" => $_POST["DESCRIPTION"],
		);
		foreach ($_POST as $key => $value)
		{
			if (substr($key, 0, 3) === "UF_")
				$arFields[$key] = $value;
		}
	}
	elseif ($_REQUEST["ENTITY_TYPE"] === "E")
	{
		$ipropTemplates = new \Bitrix\Iblock\InheritedProperty\ElementTemplates($_REQUEST["IBLOCK_ID"], $_REQUEST["ENTITY_ID"]);

		if (is_array($_POST["IBLOCK_SECTION"]))
			$section_id = min(array_filter($_POST["IBLOCK_SECTION"], "strlen"));
		else
			$section_id = 0;

		$arFields = array(
			"IBLOCK_ID" => $_REQUEST["IBLOCK_ID"],
			"IBLOCK_SECTION_ID" => $section_id,
			"NAME" => $_POST["NAME"],
			"CODE" => $_POST["CODE"],
			"PREVIEW_TEXT" => $_POST["PREVIEW_TEXT"],
			"DETAIL_TEXT" => $_POST["DETAIL_TEXT"],
		);
	}
	else
	{
		$ipropTemplates = null;
		$arFields = array();
	}

	if ($ipropTemplates)
	{
		$values = $ipropTemplates->getValuesEntity();
		$entity = $values->createTemplateEntity();
		$entity->setFields($arFields);

		$templates = $ipropTemplates->findTemplates();
		if (is_array($_POST["IPROPERTY_TEMPLATES"]))
		{
			foreach ($_POST["IPROPERTY_TEMPLATES"] as $TEMPLATE_NAME => $TEMPLATE_VALUE)
			{
				$templates[$TEMPLATE_NAME] = array(
					"TEMPLATE" => \Bitrix\Iblock\Template\Helper::convertArrayToModifiers($TEMPLATE_VALUE),
				);
			}
		}

		$result = array();
		foreach ($templates as $TEMPLATE_NAME => $templateInfo)
		{
			$result[] = array(
				"id" => $TEMPLATE_NAME,
				"value" => \Bitrix\Main\Text\String::htmlEncode(
					\Bitrix\Iblock\Template\Engine::process($entity, $templateInfo["TEMPLATE"])
				),
			);
		}
		echo CUtil::PhpToJSObject($result);
		//$entity = $values->createTemplateEntity();
		//$entity->setFields($arFields);
		//$templates = $values->getTemplateEntity();
	}
}
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_after.php");
?>