<?
define("NO_KEEP_STATISTIC", true);
define('NO_AGENT_CHECK', true);
define("NO_AGENT_STATISTIC", true);
define("NOT_CHECK_PERMISSIONS", true);
define('DisableEventsCheck', true);

if (isset($_REQUEST['SITE_ID']) && !empty($_REQUEST['SITE_ID']))
{
	$strSiteID = (string)$_REQUEST['SITE_ID'];
	if (preg_match('/^[a-z0-9_]{2}$/i', $strSiteID) === 1)
	{
		define('SITE_ID', $strSiteID);
	}
}
else
{
	die();
}

require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_before.php");

if (check_bitrix_sessid())
{
	if(
		isset($_REQUEST["IBLOCK_ID"])
		&& isset($_REQUEST["ELEMENT_ID"])
		&& isset($_SESSION["IBLOCK_CATALOG_COMMENTS_PARAMS_".$_REQUEST["IBLOCK_ID"]."_".$_REQUEST["ELEMENT_ID"]])
	)
	{
		$commParams = $_SESSION["IBLOCK_CATALOG_COMMENTS_PARAMS_".$_REQUEST["IBLOCK_ID"]."_".$_REQUEST["ELEMENT_ID"]];
	}
	else
	{
		$commParams = array();
	}

	if(!empty($commParams) && is_array($commParams))
	{
		$APPLICATION->IncludeComponent(
			"bitrix:catalog.comments",
			"",
			$commParams,
			false
		);
	}
}

die();
?>