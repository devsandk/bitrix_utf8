<?
use Bitrix\Main\Localization\Loc;
Loc::loadMessages(__FILE__);

class CAllPrice
{
	function CheckFields($ACTION, &$arFields, $ID = 0)
	{
		global $APPLICATION;
		if ((is_set($arFields, "PRODUCT_ID") || $ACTION=="ADD") && intval($arFields["PRODUCT_ID"]) <= 0)
		{
			$APPLICATION->ThrowException(Loc::getMessage("KGP_EMPTY_PRODUCT"), "EMPTY_PRODUCT_ID");
			return false;
		}
		if ((is_set($arFields, "CATALOG_GROUP_ID") || $ACTION=="ADD") && intval($arFields["CATALOG_GROUP_ID"]) <= 0)
		{
			$APPLICATION->ThrowException(Loc::getMessage("KGP_EMPTY_CATALOG_GROUP"), "EMPTY_CATALOG_GROUP_ID");
			return false;
		}
		if ((is_set($arFields, "CURRENCY") || $ACTION=="ADD") && strlen($arFields["CURRENCY"]) <= 0)
		{
			$APPLICATION->ThrowException(Loc::getMessage("KGP_EMPTY_CURRENCY"), "EMPTY_CURRENCY");
			return false;
		}
		if (isset($arFields['CURRENCY']))
		{
			if (!($arCurrency = CCurrency::GetByID($arFields["CURRENCY"])))
			{
				$APPLICATION->ThrowException(Loc::getMessage("KGP_NO_CURRENCY", array('#ID#' => $arFields["CURRENCY"])), "CURRENCY");
				return false;
			}
		}

		if (is_set($arFields, "PRICE") || $ACTION=="ADD")
		{
			$arFields["PRICE"] = str_replace(",", ".", $arFields["PRICE"]);
			$arFields["PRICE"] = DoubleVal($arFields["PRICE"]);
		}

		if ((is_set($arFields, "QUANTITY_FROM") || $ACTION=="ADD") && intval($arFields["QUANTITY_FROM"]) <= 0)
			$arFields["QUANTITY_FROM"] = false;
		if ((is_set($arFields, "QUANTITY_TO") || $ACTION=="ADD") && intval($arFields["QUANTITY_TO"]) <= 0)
			$arFields["QUANTITY_TO"] = false;

		return true;
	}

	function Update($ID, $arFields,$boolRecalc = false)
	{
		global $DB;

		$ID = intval($ID);
		if ($ID <= 0)
			return false;

		$boolBase = false;
		$arFields['RECALC'] = ($boolRecalc === true ? true : false);

		foreach (GetModuleEvents("catalog", "OnBeforePriceUpdate", true) as $arEvent)
		{
			if (ExecuteModuleEventEx($arEvent, array($ID, &$arFields))===false)
				return false;
		}

		if (!CPrice::CheckFields("UPDATE", $arFields, $ID))
			return false;

		if (isset($arFields['RECALC']) && $arFields['RECALC'] === true)
		{
			CPrice::ReCountFromBase($arFields, $boolBase);
			if (!$boolBase && 0 >= $arFields['EXTRA_ID'])
			{
				return false;
			}
		}

		$strUpdate = $DB->PrepareUpdate("b_catalog_price", $arFields);
		if (!empty($strUpdate))
		{
			$strSql = "UPDATE b_catalog_price SET ".$strUpdate." WHERE ID = ".$ID;
			$DB->Query($strSql, false, "File: ".__FILE__."<br>Line: ".__LINE__);
		}

		if ($boolBase)
		{
			CPrice::ReCountForBase($arFields);
		}

		foreach (GetModuleEvents("catalog", "OnPriceUpdate", true) as $arEvent)
		{
			ExecuteModuleEventEx($arEvent, array($ID, $arFields));
		}

		return $ID;
	}

	function Delete($ID)
	{
		global $DB;
		$ID = intval($ID);
		if ($ID <= 0)
			return false;

		foreach (GetModuleEvents("catalog", "OnBeforePriceDelete", true) as $arEvent)
		{
			if (ExecuteModuleEventEx($arEvent, array($ID))===false)
				return false;
		}

		$mxRes = $DB->Query("DELETE FROM b_catalog_price WHERE ID = ".$ID, true);

		foreach (GetModuleEvents("catalog", "OnPriceDelete", true) as $arEvent)
		{
			ExecuteModuleEventEx($arEvent, array($ID));
		}

		return $mxRes;
	}

	function GetBasePrice($productID, $quantityFrom = false, $quantityTo = false, $boolExt = true)
	{
		$productID = intval($productID);
		if (0 >= $productID)
			return false;

		$arBaseType = CCatalogGroup::GetBaseGroup();
		if (empty($arBaseType))
			return false;

		$arFilter = array(
			'PRODUCT_ID' => $productID,
			'CATALOG_GROUP_ID' => $arBaseType['ID']
		);

		if ($quantityFrom !== false)
			$arFilter["QUANTITY_FROM"] = intval($quantityFrom);
		if ($quantityTo !== false)
			$arFilter["QUANTITY_TO"] = intval($quantityTo);

		if (false === $boolExt)
		{
			$arSelect = array('ID', 'PRODUCT_ID', 'EXTRA_ID', 'CATALOG_GROUP_ID', 'PRICE', 'CURRENCY', 'TIMESTAMP_X',
				'QUANTITY_FROM', 'QUANTITY_TO', 'TMP_ID'
			);
		}
		else
		{
			$arSelect = array('ID', 'PRODUCT_ID', 'EXTRA_ID', 'CATALOG_GROUP_ID', 'PRICE', 'CURRENCY', 'TIMESTAMP_X',
				'QUANTITY_FROM', 'QUANTITY_TO', 'TMP_ID',
				'PRODUCT_QUANTITY', 'PRODUCT_QUANTITY_TRACE', 'PRODUCT_CAN_BUY_ZERO',
				'PRODUCT_NEGATIVE_AMOUNT_TRACE', 'PRODUCT_WEIGHT', 'ELEMENT_IBLOCK_ID'
			);
		}

		$db_res = CPrice::GetList(
			array('QUANTITY_FROM' => 'ASC', 'QUANTITY_TO' => 'ASC'),
			$arFilter,
			false,
			array('nTopCount' => 1),
			$arSelect
		);
		if ($res = $db_res->Fetch())
		{
			$res['BASE'] = 'Y';
			$res['CATALOG_GROUP_NAME'] = $arBaseType['NAME'];
			return $res;
		}

		return false;
	}

	function SetBasePrice($ProductID, $Price, $Currency, $quantityFrom = false, $quantityTo = false, $bGetID = false)
	{
		$bGetID = ($bGetID == true);

		$arFields = array();
		$arFields["PRICE"] = doubleval($Price);
		$arFields["CURRENCY"] = $Currency;
		$arFields["QUANTITY_FROM"] = ($quantityFrom == false ? false : (int)$quantityFrom);
		$arFields["QUANTITY_TO"] = ($quantityTo == false ? false : (int)$quantityTo);
		$arFields["EXTRA_ID"] = false;

		$ID = false;
		if ($arBasePrice = CPrice::GetBasePrice($ProductID, $quantityFrom, $quantityTo, false))
		{
			$ID = CPrice::Update($arBasePrice["ID"], $arFields);
		}
		else
		{
			$arBaseGroup = CCatalogGroup::GetBaseGroup();
			$arFields["CATALOG_GROUP_ID"] = $arBaseGroup["ID"];
			$arFields["PRODUCT_ID"] = $ProductID;

			$ID = CPrice::Add($arFields);
		}
		if (!$ID)
		{
			return false;
		}
		else
		{
			return ($bGetID ? $ID : true);
		}
	}

	function ReCalculate($TYPE, $ID, $VAL)
	{
		$ID = intval($ID);
		if (0 < $ID)
		{
			if ('EXTRA' == $TYPE)
			{
				$db_res = CPrice::GetList(
					array(),
					array('EXTRA_ID' => $ID),
					false,
					false,
					array('ID', 'PRODUCT_ID', 'EXTRA_ID', 'QUANTITY_FROM', 'QUANTITY_TO')
				);
				while ($res = $db_res->Fetch())
				{
					$arFields = array();
					if ($arBasePrice = CPrice::GetBasePrice($res["PRODUCT_ID"], $res["QUANTITY_FROM"], $res["QUANTITY_TO"]))
					{
						$arFields["PRICE"] = RoundEx($arBasePrice["PRICE"] * (1 + 1 * $VAL / 100), 2);
						$arFields["CURRENCY"] = $arBasePrice["CURRENCY"];
						CPrice::Update($res["ID"], $arFields);
					}
				}
			}
			else
			{
				$db_res = CPrice::GetList(
					array(),
					array("PRODUCT_ID" => $ID),
					false,
					false,
					array('ID', 'PRODUCT_ID', 'EXTRA_ID')
				);
				while ($res = $db_res->Fetch())
				{
					$res["EXTRA_ID"] = intval($res["EXTRA_ID"]);
					if (0 < $res["EXTRA_ID"])
					{
						$res1 = CExtra::GetByID($res["EXTRA_ID"]);
						$arFields = array(
							"PRICE" => $VAL * (1 + 1 * $res1["PERCENTAGE"] / 100),
						);
						CPrice::Update($res["ID"], $arFields);
					}
				}
			}
		}
	}

	function OnCurrencyDelete($Currency)
	{
		global $DB;
		if ($Currency == '')
			return false;

		$strSql = "DELETE FROM b_catalog_price WHERE CURRENCY = '".$DB->ForSql($Currency)."'";
		return $DB->Query($strSql, true);
	}

	function OnIBlockElementDelete($ProductID)
	{
		global $DB;
		$ProductID = intval($ProductID);
		if (0 >= $ProductID)
			return false;
		$strSql = "DELETE FROM b_catalog_price WHERE PRODUCT_ID = ".$ProductID;
		return $DB->Query($strSql, true);
	}

	function DeleteByProduct($ProductID, $arExceptionIDs = array())
	{
		global $DB;

		$ProductID = intval($ProductID);
		if ($ProductID <= 0)
			return false;
		foreach (GetModuleEvents("catalog", "OnBeforeProductPriceDelete", true) as $arEvent)
		{
			if (ExecuteModuleEventEx($arEvent, array($ProductID, &$arExceptionIDs))===false)
				return false;
		}

		if (!empty($arExceptionIDs))
			CatalogClearArray($arExceptionIDs, false);

		if (!empty($arExceptionIDs))
		{
			$strSql = "DELETE FROM b_catalog_price WHERE PRODUCT_ID = ".$ProductID." AND ID NOT IN (".implode(',',$arExceptionIDs).")";
		}
		else
		{
			$strSql = "DELETE FROM b_catalog_price WHERE PRODUCT_ID = ".$ProductID;
		}

		$mxRes = $DB->Query($strSql, true);

		foreach (GetModuleEvents("catalog", "OnProductPriceDelete", true) as $arEvent)
		{
			ExecuteModuleEventEx($arEvent, array($ProductID,$arExceptionIDs));
		}

		return $mxRes;
	}

	function ReCountForBase(&$arFields)
	{
		static $arExtraList = array();
		$boolSearch = false;

		$arFilter = array('PRODUCT_ID' => $arFields['PRODUCT_ID'],'!CATALOG_GROUP_ID' => $arFields['CATALOG_GROUP_ID']);
		if (isset($arFields['QUANTITY_FROM']))
			$arFilter['QUANTITY_FROM'] = $arFields['QUANTITY_FROM'];
		if (isset($arFields['QUANTITY_TO']))
			$arFilter['QUANTITY_TO'] = $arFields['QUANTITY_TO'];

		$rsPrices = CPrice::GetListEx(
			array('CATALOG_GROUP_ID' => 'ASC',"QUANTITY_FROM" => "ASC", "QUANTITY_TO" => "ASC"),
			$arFilter,
			false,
			false,
			array('ID','EXTRA_ID')
		);
		while ($arPrice = $rsPrices->Fetch())
		{
			$arPrice['EXTRA_ID'] = intval($arPrice['EXTRA_ID']);
			if ($arPrice['EXTRA_ID'] > 0)
			{
				$boolSearch = isset($arExtraList[$arPrice['EXTRA_ID']]);
				if (!$boolSearch)
				{
					$arExtra = CExtra::GetByID($arPrice['EXTRA_ID']);
					if (!empty($arExtra))
					{
						$boolSearch = true;
						$arExtraList[$arExtra['ID']] = $arExtra['PERCENTAGE'];
					}
				}
				if ($boolSearch)
				{
					$arNewPrice = array(
						'CURRENCY' => $arFields['CURRENCY'],
						'PRICE' => RoundEx($arFields["PRICE"] * (1 + DoubleVal($arExtraList[$arPrice['EXTRA_ID']])/100), CATALOG_VALUE_PRECISION),
					);
					CPrice::Update($arPrice['ID'],$arNewPrice,false);
				}
			}
		}
	}

	function ReCountFromBase(&$arFields, &$boolBase)
	{
		$arBaseGroup = CCatalogGroup::GetBaseGroup();
		if (!empty($arBaseGroup))
		{
			if ($arFields['CATALOG_GROUP_ID'] == $arBaseGroup['ID'])
			{
				$boolBase = true;
			}
			else
			{
				if (!empty($arFields['EXTRA_ID']) && intval($arFields['EXTRA_ID']) > 0)
				{
					$arExtra = CExtra::GetByID($arFields['EXTRA_ID']);
					if (!empty($arExtra))
					{
						$arFilter = array('PRODUCT_ID' => $arFields['PRODUCT_ID'],'CATALOG_GROUP_ID' => $arBaseGroup['ID']);
						if (isset($arFields['QUANTITY_FROM']))
							$arFilter['QUANTITY_FROM'] = $arFields['QUANTITY_FROM'];
						if (isset($arFields['QUANTITY_TO']))
							$arFilter['QUANTITY_TO'] = $arFields['QUANTITY_TO'];
						$rsBasePrices = CPrice::GetListEx(
							array("QUANTITY_FROM" => "ASC", "QUANTITY_TO" => "ASC"),
							$arFilter,
							false,
							array('nTopCount' => 1),
							array('PRICE','CURRENCY')
						);
						if ($arBasePrice = $rsBasePrices->Fetch())
						{
							$arFields['CURRENCY'] = $arBasePrice['CURRENCY'];
							$arFields['PRICE'] = RoundEx($arBasePrice["PRICE"] * (1 + DoubleVal($arExtra["PERCENTAGE"])/100), CATALOG_VALUE_PRECISION);
						}
						else
						{
							$arFields['EXTRA_ID'] = 0;
						}
					}
					else
					{
						$arFields['EXTRA_ID'] = 0;
					}
				}
			}
		}
	}
}
?>