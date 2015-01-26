<?
define('NO_AGENT_CHECK', true);
define("STOP_STATISTICS", true);

use \Bitrix\Catalog\CatalogViewedProductTable as CatalogViewedProductTable;

require($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/main/include/prolog_before.php');
if (isset($_POST['AJAX']) && $_POST['AJAX'] == 'Y')
{
	if (isset($_POST['PRODUCT_ID']) && isset($_POST['SITE_ID']))
	{
		$productID = (int)$_POST['PRODUCT_ID'];
		$siteID = substr((string)$_POST['SITE_ID'], 0, 2);
		if ($productID > 0 && $siteID !== '' && \Bitrix\Main\Loader::includeModule('catalog') && \Bitrix\Main\Loader::includeModule('sale'))
		{
			CatalogViewedProductTable::refresh(
				$productID,
				CSaleBasket::GetBasketUserID(),
				$siteID
			);
			echo CUtil::PhpToJSObject(array("STATUS" => "SUCCESS"));
		}
		else
		{
			echo CUtil::PhpToJSObject(array("STATUS" => "ERROR", "TEXT" => "UNDEFINED PRODUCT"));
		}
	}
	die();
}