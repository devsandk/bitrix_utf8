<?
use Bitrix\Main\Localization\Loc;
Loc::loadMessages(__FILE__);

class CAllCatalogSKU
{
	const TYPE_CATALOG = 'D';
	const TYPE_PRODUCT = 'P';
	const TYPE_OFFERS = 'O';
	const TYPE_FULL = 'X';

	static protected $arOfferCache = array();
	static protected $arProductCache = array();
	static protected $arPropertyCache = array();
	static protected $arIBlockCache = array();

	public function GetCatalogTypes($boolFull = false)
	{
		$boolFull = ($boolFull === true);
		if ($boolFull)
		{
			return array(
				self::TYPE_CATALOG => Loc::getMessage('BT_CAT_SKU_TYPE_CATALOG'),
				self::TYPE_PRODUCT => Loc::getMessage('BT_CAT_SKU_TYPE_PRODUCT'),
				self::TYPE_OFFERS => Loc::getMessage('BT_CAT_SKU_TYPE_OFFERS'),
				self::TYPE_FULL => Loc::getMessage('BT_CAT_SKU_TYPE_FULL')
			);
		}
		return array(
			self::TYPE_CATALOG,
			self::TYPE_PRODUCT,
			self::TYPE_OFFERS,
			self::TYPE_FULL
		);
	}

	public function GetProductInfo($intOfferID, $intIBlockID = 0)
	{
		$intOfferID = (int)$intOfferID;
		if ($intOfferID <= 0)
			return false;

		$intIBlockID = (int)$intIBlockID;
		if ($intIBlockID <= 0)
		{
			$intIBlockID = (int)CIBlockElement::GetIBlockByID($intOfferID);
		}
		if ($intIBlockID <= 0)
			return false;

		if (!isset(self::$arOfferCache[$intIBlockID]))
		{
			$arSkuInfo = CCatalogSKU::GetInfoByOfferIBlock($intIBlockID);
		}
		else
		{
			$arSkuInfo = self::$arOfferCache[$intIBlockID];
		}
		if (empty($arSkuInfo) || empty($arSkuInfo['SKU_PROPERTY_ID']))
			return false;

		$rsItems = CIBlockElement::GetProperty(
			$intIBlockID,
			$intOfferID,
			array(),
			array('ID' => $arSkuInfo['SKU_PROPERTY_ID'])
		);
		if ($arItem = $rsItems->Fetch())
		{
			$arItem['VALUE'] = (int)$arItem['VALUE'];
			if ($arItem['VALUE'] > 0)
			{
				return array(
					'ID' => $arItem['VALUE'],
					'IBLOCK_ID' => $arSkuInfo['PRODUCT_IBLOCK_ID'],
				);
			}
		}
		return false;
	}

	public function GetInfoByOfferIBlock($intIBlockID)
	{
		$intIBlockID = (int)$intIBlockID;
		if ($intIBlockID <= 0)
			return false;

		if (!isset(self::$arOfferCache[$intIBlockID]))
		{
			self::$arOfferCache[$intIBlockID] = false;
			$rsOffers = CCatalog::GetList(
				array(),
				array('IBLOCK_ID' => $intIBlockID, '!PRODUCT_IBLOCK_ID' => 0),
				false,
				false,
				array('IBLOCK_ID','PRODUCT_IBLOCK_ID','SKU_PROPERTY_ID')
			);
			$arResult = $rsOffers->Fetch();
			if (!empty($arResult))
			{
				$arResult['IBLOCK_ID'] = (int)$arResult['IBLOCK_ID'];
				$arResult['PRODUCT_IBLOCK_ID'] = (int)$arResult['PRODUCT_IBLOCK_ID'];
				$arResult['SKU_PROPERTY_ID'] = (int)$arResult['SKU_PROPERTY_ID'];
				self::$arOfferCache[$intIBlockID] = $arResult;
			}
		}
		else
		{
			$arResult = self::$arOfferCache[$intIBlockID];
		}
		return $arResult;
	}

	public function GetInfoByProductIBlock($intIBlockID)
	{
		$intIBlockID = (int)$intIBlockID;
		if ($intIBlockID <= 0)
			return false;
		if (!isset(self::$arProductCache[$intIBlockID]))
		{
			self::$arProductCache[$intIBlockID] = false;
			$rsProducts = CCatalog::GetList(
				array(),
				array('PRODUCT_IBLOCK_ID' => $intIBlockID),
				false,
				false,
				array('IBLOCK_ID','PRODUCT_IBLOCK_ID','SKU_PROPERTY_ID')
			);
			$arResult = $rsProducts->Fetch();
			if (!empty($arResult))
			{
				$arResult['IBLOCK_ID'] = (int)$arResult['IBLOCK_ID'];
				$arResult['PRODUCT_IBLOCK_ID'] = (int)$arResult['PRODUCT_IBLOCK_ID'];
				$arResult['SKU_PROPERTY_ID'] = (int)$arResult['SKU_PROPERTY_ID'];
				self::$arProductCache[$intIBlockID] = $arResult;
			}
		}
		else
		{
			$arResult = self::$arProductCache[$intIBlockID];
		}
		return $arResult;
	}

	public function GetInfoByLinkProperty($intPropertyID)
	{
		$intPropertyID = (int)$intPropertyID;
		if ($intPropertyID <= 0)
			return false;
		if (!isset(self::$arPropertyCache[$intPropertyID]))
		{
			self::$arPropertyCache[$intPropertyID] = false;
			$rsProducts = CCatalog::GetList(
				array(),
				array('SKU_PROPERTY_ID' => $intPropertyID),
				false,
				false,
				array('IBLOCK_ID','PRODUCT_IBLOCK_ID','SKU_PROPERTY_ID')
			);
			$arResult = $rsProducts->Fetch();
			if (!empty($arResult))
			{
				$arResult['IBLOCK_ID'] = (int)$arResult['IBLOCK_ID'];
				$arResult['PRODUCT_IBLOCK_ID'] = (int)$arResult['PRODUCT_IBLOCK_ID'];
				$arResult['SKU_PROPERTY_ID'] = (int)$arResult['SKU_PROPERTY_ID'];
				self::$arPropertyCache[$intPropertyID] = $arResult;
			}
		}
		else
		{
			$arResult = self::$arPropertyCache[$intPropertyID];
		}
		return $arResult;
	}

	public function GetInfoByIBlock($intIBlockID)
	{
	}

	public function IsExistOffers($intProductID, $intIBlockID = 0)
	{
		$intProductID = (int)$intProductID;
		if ($intProductID == 0)
			return false;

		$intIBlockID = (int)$intIBlockID;
		if ($intIBlockID <= 0 && $intProductID > 0)
		{
			$intIBlockID = (int)CIBlockElement::GetIBlockByID($intProductID);
		}
		if ($intIBlockID <= 0)
			return false;

		if (!isset(self::$arProductCache[$intIBlockID]))
		{
			$arSkuInfo = CCatalogSKU::GetInfoByProductIBlock($intIBlockID);
		}
		else
		{
			$arSkuInfo = self::$arProductCache[$intIBlockID];
		}
		if (empty($arSkuInfo))
			return false;

		$intCount = CIBlockElement::GetList(
			array(),
			array('IBLOCK_ID' => $arSkuInfo['IBLOCK_ID'], '=PROPERTY_'.$arSkuInfo['SKU_PROPERTY_ID'] => $intProductID),
			array()
		);
		return ($intCount > 0);
	}

	public static function ClearCache()
	{
		self::$arOfferCache = array();
		self::$arProductCache = array();
		self::$arPropertyCache = array();
		self::$arIBlockCache = array();
	}
}
?>