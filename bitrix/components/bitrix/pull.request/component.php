<?if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

if (isset($_REQUEST['AJAX_CALL']) && $_REQUEST['AJAX_CALL'] == 'Y')
	return;

if (intval($USER->GetID()) <= 0)
	return;

if (!CModule::IncludeModule('pull'))
	return;

if (defined('BX_PULL_SKIP_INIT'))
	return;

if (CPullOptions::CheckNeedRun())
{
	CJSCore::Init(array('pull'));

	$arResult = CPullChannel::GetUserConfig($GLOBALS['USER']->GetID());

	if (!(isset($arParams['TEMPLATE_HIDE']) && $arParams['TEMPLATE_HIDE'] == 'Y'))
	{
		define("BX_PULL_SKIP_INIT", true);
		$this->IncludeComponentTemplate();
	}
}

return $arResult;
?>