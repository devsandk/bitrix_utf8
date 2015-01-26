<?
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true) die();

use Bitrix\Main\Loader;

if(!Loader::includeModule('catalog'))
{
	ShowError(GetMessage('CATALOG_MODULE_NOT_INSTALL'));
	return;
}

if(!isset($arParams['CACHE_TIME']))
	$arParams['CACHE_TIME'] = 360;
$arParams['ELEMENT_ID'] = (int)(isset($arParams['ELEMENT_ID']) ? $arParams['ELEMENT_ID'] : 0);
$arParams['MAIN_TITLE'] = trim($arParams['MAIN_TITLE']);
$arParams['STORE_PATH'] = trim($arParams['STORE_PATH']);
$arParams['USE_STORE_PHONE'] = (isset($arParams['USE_STORE_PHONE']) && $arParams['USE_STORE_PHONE'] == 'Y' ? 'Y' : 'N');
$arParams['SCHEDULE'] = (isset($arParams['SCHEDULE']) && $arParams['SCHEDULE'] == 'Y' ? 'Y' : 'N');
$arParams['USE_MIN_AMOUNT'] = (isset($arParams['USE_MIN_AMOUNT']) && $arParams['USE_MIN_AMOUNT'] == 'N' ? 'N' : 'Y');
$arParams['MIN_AMOUNT'] = (float)(isset($arParams['MIN_AMOUNT']) ? $arParams['MIN_AMOUNT'] : 0);

if ($arParams["ELEMENT_ID"] <= 0)
{
	ShowError(GetMessage("PRODUCT_NOT_EXIST"));
	return;
}

if($this->StartResultCache())
{
	$arResult["TITLE"] = $arParams["MAIN_TITLE"];
	$arSelect = array(
		"ID",
		"TITLE",
		"ACTIVE",
		"ADDRESS",
		"DESCRIPTION",
		"PHONE",
		"SCHEDULE",
		"PRODUCT_AMOUNT",
		"ELEMENT_ID",
	);

	$rsProps = CCatalogStore::GetList(array('TITLE' => 'ASC', 'ID' => 'ASC'), array('ACTIVE' => 'Y', "PRODUCT_ID" => $arParams["ELEMENT_ID"], "+SITE_ID" => SITE_ID, "ISSUING_CENTER" => 'Y'), false, false, $arSelect);

	while($arProp = $rsProps->GetNext())
	{
		$amount = (is_null($arProp["PRODUCT_AMOUNT"])) ? 0 : $arProp["PRODUCT_AMOUNT"];
		$storeURL = CComponentEngine::MakePathFromTemplate($arParams["STORE_PATH"], array("store_id" => $arProp["ID"]));

		if($arProp["TITLE"] == '' && $arProp["ADDRESS"] != '')
			$storeName = $arProp["ADDRESS"];
		elseif($arProp["ADDRESS"] == '' && $arProp["TITLE"] != '')
			$storeName = $arProp["TITLE"];
		else
			$storeName = $arProp["TITLE"]." (".$arProp["ADDRESS"].")";

		if($arParams["USE_STORE_PHONE"] == 'Y' && $arProp["PHONE"] != '')
			$storePhone = $arProp["PHONE"];
		else
			$storePhone = null;

		if($arParams["SCHEDULE"] == 'Y' && $arProp["SCHEDULE"] != '')
			$storeSchedule = $arProp["SCHEDULE"];
		else
			$storeSchedule = null;

		$numAmount = array("NUM_AMOUNT" => $amount);
		if($arParams["USE_MIN_AMOUNT"] == 'Y')
		{
			if(intval($amount) >= $arParams["MIN_AMOUNT"])
				$amount = GetMessage("LOT_OF_GOOD");
			elseif(intval($amount) == 0)
				$amount = GetMessage("ABSENT");
			elseif(intval($amount) < $arParams["MIN_AMOUNT"])
				$amount = GetMessage("NOT_MUCH_GOOD");
		}

		$arResult["STORES"][] = array_merge(
			array(
				'ID' => $arProp["ID"],
				'URL' => $storeURL,
				'TITLE' => $storeName,
				'PHONE' => $storePhone,
				'SCHEDULE' => $storeSchedule,
				'AMOUNT' => $amount,
				'ELEMENT_ID' => $arProp["ELEMENT_ID"],
			),$numAmount);
	}

	$isProductExistSKU = CCatalogSKU::IsExistOffers($arParams["ELEMENT_ID"]);
	$arResult["IS_SKU"] = false;
	if($isProductExistSKU)
	{
		$arSkuElements = $arSkuInfo = $arResultSkuId = array();
		$intIBlockID = (int)CIBlockElement::GetIBlockByID($arParams["ELEMENT_ID"]);
		if($intIBlockID > 0)
			$arSkuInfo = CCatalogSKU::GetInfoByProductIBlock($intIBlockID);
		if(!empty($arSkuInfo) && is_array($arSkuInfo))
		{
			$dbAllSkuElements = CIBlockElement::GetList(
				array(),
				array('IBLOCK_ID' => $arSkuInfo['IBLOCK_ID'], '=PROPERTY_'.$arSkuInfo['SKU_PROPERTY_ID'] => $arParams["ELEMENT_ID"]),
				false,
				false,
				array('ID')
			);
			while($arAllSkuElements = $dbAllSkuElements->fetch())
			{
				$arSkuElements[] = $arAllSkuElements;
			}
		}
		foreach($arSkuElements as $skuId)
		{
			if(isset($skuId["ID"]))
				$arResultSkuId[] = $skuId["ID"];
		}
		if(!empty($arResultSkuId))
			$arParams["ELEMENT_ID"] = $arResultSkuId;
		$arResult["IS_SKU"] = true;


		$rsProps = CCatalogStore::GetList(array('TITLE' => 'ASC', 'ID' => 'ASC'), array('ACTIVE' => 'Y', "PRODUCT_ID" => $arParams["ELEMENT_ID"], "+SITE_ID" => SITE_ID, "ISSUING_CENTER" => 'Y'), false, false, $arSelect);
		while($arProp = $rsProps->GetNext())
		{
			$amount = (is_null($arProp["PRODUCT_AMOUNT"])) ? 0 : $arProp["PRODUCT_AMOUNT"];
			$storeURL = CComponentEngine::MakePathFromTemplate($arParams["STORE_PATH"], array("store_id" => $arProp["ID"]));

			if($arProp["TITLE"] == '' && $arProp["ADDRESS"] != '')
				$storeName = $arProp["ADDRESS"];
			elseif($arProp["ADDRESS"] == '' && $arProp["TITLE"] != '')
				$storeName = $arProp["TITLE"];
			else
				$storeName = $arProp["TITLE"]." (".$arProp["ADDRESS"].")";

			if($arParams["USE_STORE_PHONE"] == 'Y' && $arProp["PHONE"] != '')
				$storePhone = $arProp["PHONE"];
			else
				$storePhone = null;

			if($arParams["SCHEDULE"] == 'Y' && $arProp["SCHEDULE"] != '')
				$storeSchedule = $arProp["SCHEDULE"];
			else
				$storeSchedule = null;

			$numAmount = array("NUM_AMOUNT" => $amount);
			if($arParams["USE_MIN_AMOUNT"] == 'Y')
			{
				if(intval($amount) >= $arParams["MIN_AMOUNT"])
					$amount = GetMessage("LOT_OF_GOOD");
				elseif(intval($amount) == 0)
					$amount = GetMessage("ABSENT");
				elseif(intval($amount) < $arParams["MIN_AMOUNT"])
					$amount = GetMessage("NOT_MUCH_GOOD");
			}

			$arResult["SKU"][] = array_merge(
				array(
					'ID' => $arProp["ID"],
					'URL' => $storeURL,
					'TITLE' => $storeName,
					'PHONE' => $storePhone,
					'SCHEDULE' => $storeSchedule,
					'AMOUNT' => $amount,
					'ELEMENT_ID' => $arProp["ELEMENT_ID"],
				),$numAmount);
		}
	}
	$this->IncludeComponentTemplate();
}
?>