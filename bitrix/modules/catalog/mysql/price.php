<?
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/catalog/general/price.php");

class CPrice extends CAllPrice
{
	function Add($arFields, $boolRecalc = false)
	{
		global $DB;

		$boolBase = false;
		$arFields['RECALC'] = ($boolRecalc === true ? true : false);

		foreach (GetModuleEvents("catalog", "OnBeforePriceAdd", true) as $arEvent)
		{
			ExecuteModuleEventEx($arEvent, array(&$arFields));
		}

		if (!CPrice::CheckFields("ADD", $arFields, 0))
			return false;

		if (isset($arFields['RECALC']) && $arFields['RECALC'] === true)
		{
			CPrice::ReCountFromBase($arFields, $boolBase);
			if (!$boolBase && 0 >= $arFields['EXTRA_ID'])
			{
				return false;
			}
		}

		$arInsert = $DB->PrepareInsert("b_catalog_price", $arFields);

		$strSql = "INSERT INTO b_catalog_price(".$arInsert[0].") VALUES(".$arInsert[1].")";
		$DB->Query($strSql, false, "File: ".__FILE__."<br>Line: ".__LINE__);

		$ID = intval($DB->LastID());

		if ($ID > 0 && $boolBase)
		{
			CPrice::ReCountForBase($arFields);
		}

		foreach (GetModuleEvents("catalog", "OnPriceAdd", true) as $arEvent)
		{
			ExecuteModuleEventEx($arEvent, array($ID, $arFields));
		}

		// strange copy-paste bug
		foreach (GetModuleEvents("sale", "OnPriceAdd", true) as $arEvent)
		{
			ExecuteModuleEventEx($arEvent, array($ID, $arFields));
		}

		return $ID;
	}

	function GetByID($ID)
	{
		global $DB, $USER;
		$ID = intval($ID);
		if (0 >= $ID)
			return false;
		$strUserGroups = (CCatalog::IsUserExists() ? $USER->GetGroups() : '2');
		$strSql =
			"SELECT CP.ID, CP.PRODUCT_ID, CP.EXTRA_ID, CP.CATALOG_GROUP_ID, CP.PRICE, ".
			"	CP.CURRENCY, CP.QUANTITY_FROM, CP.QUANTITY_TO, IF(CGG.ID IS NULL, 'N', 'Y') as CAN_ACCESS, CP.TMP_ID, ".
			"	CGL.NAME as CATALOG_GROUP_NAME, IF(CGG1.ID IS NULL, 'N', 'Y') as CAN_BUY, ".
			"	".$DB->DateToCharFunction("CP.TIMESTAMP_X", "FULL")." as TIMESTAMP_X ".
			"FROM b_catalog_price CP, b_catalog_group CG ".
			"	LEFT JOIN b_catalog_group2group CGG ON (CG.ID = CGG.CATALOG_GROUP_ID AND CGG.GROUP_ID IN (".$strUserGroups.") AND CGG.BUY <> 'Y') ".
			"	LEFT JOIN b_catalog_group2group CGG1 ON (CG.ID = CGG1.CATALOG_GROUP_ID AND CGG1.GROUP_ID IN (".$strUserGroups.") AND CGG1.BUY = 'Y') ".
			"	LEFT JOIN b_catalog_group_lang CGL ON (CG.ID = CGL.CATALOG_GROUP_ID AND CGL.LID = '".LANGUAGE_ID."') ".
			"WHERE CP.ID = ".$ID." ".
			"	AND CP.CATALOG_GROUP_ID = CG.ID ".
			"GROUP BY CP.ID, CP.PRODUCT_ID, CP.EXTRA_ID, CP.CATALOG_GROUP_ID, CP.PRICE, CP.CURRENCY, CP.QUANTITY_FROM, CP.QUANTITY_TO, CP.TIMESTAMP_X ";
		$db_res = $DB->Query($strSql, false, "File: ".__FILE__."<br>Line: ".__LINE__);
		if ($res = $db_res->Fetch())
			return $res;

		return false;
	}

	function GetList($arOrder = array(), $arFilter = array(), $arGroupBy = false, $arNavStartParams = false, $arSelectFields = array())
	{
		global $DB, $USER;

		// for old execution style
		if (!is_array($arOrder) && !is_array($arFilter))
		{
			$arOrder = strval($arOrder);
			$arFilter = strval($arFilter);
			if ('' != $arOrder && '' != $arFilter)
				$arOrder = array($arOrder => $arFilter);
			else
				$arOrder = array();
			if (is_array($arGroupBy))
				$arFilter = $arGroupBy;
			else
				$arFilter = array();
			$arGroupBy = false;
		}

		$strUserGroups = (CCatalog::IsUserExists() ? $USER->GetGroups() : '2');

		if (empty($arSelectFields))
			$arSelectFields = array("ID", "PRODUCT_ID", "EXTRA_ID", "CATALOG_GROUP_ID", "PRICE", "CURRENCY", "TIMESTAMP_X", "QUANTITY_FROM", "QUANTITY_TO", "BASE", "SORT", "CATALOG_GROUP_NAME", "CAN_ACCESS", "CAN_BUY");

		$arFields = array(
			"ID" => array("FIELD" => "P.ID", "TYPE" => "int"),
			"PRODUCT_ID" => array("FIELD" => "P.PRODUCT_ID", "TYPE" => "int"),
			"EXTRA_ID" => array("FIELD" => "P.EXTRA_ID", "TYPE" => "int"),
			"CATALOG_GROUP_ID" => array("FIELD" => "P.CATALOG_GROUP_ID", "TYPE" => "int"),
			"PRICE" => array("FIELD" => "P.PRICE", "TYPE" => "double"),
			"CURRENCY" => array("FIELD" => "P.CURRENCY", "TYPE" => "string"),
			"TIMESTAMP_X" => array("FIELD" => "P.TIMESTAMP_X", "TYPE" => "datetime"),
			"QUANTITY_FROM" => array("FIELD" => "P.QUANTITY_FROM", "TYPE" => "int"),
			"QUANTITY_TO" => array("FIELD" => "P.QUANTITY_TO", "TYPE" => "int"),
			"TMP_ID" => array("FIELD" => "P.TMP_ID", "TYPE" => "string"),

			"BASE" => array("FIELD" => "CG.BASE", "TYPE" => "char", "FROM" => "INNER JOIN b_catalog_group CG ON (P.CATALOG_GROUP_ID = CG.ID)"),
			"SORT" => array("FIELD" => "CG.SORT", "TYPE" => "int", "FROM" => "INNER JOIN b_catalog_group CG ON (P.CATALOG_GROUP_ID = CG.ID)"),

			"PRODUCT_QUANTITY" => array("FIELD" => "CP.QUANTITY", "TYPE" => "int", "FROM" => "INNER JOIN b_catalog_product CP ON (P.PRODUCT_ID = CP.ID)"),
			"PRODUCT_QUANTITY_TRACE" => array("FIELD" => "IF (CP.QUANTITY_TRACE = 'D', '".$DB->ForSql(COption::GetOptionString('catalog','default_quantity_trace','N'))."', CP.QUANTITY_TRACE)", "TYPE" => "char", "FROM" => "INNER JOIN b_catalog_product CP ON (P.PRODUCT_ID = CP.ID)"),
			"PRODUCT_CAN_BUY_ZERO" => array("FIELD" => "IF (CP.CAN_BUY_ZERO = 'D', '".$DB->ForSql(COption::GetOptionString('catalog','default_can_buy_zero','N'))."', CP.CAN_BUY_ZERO)", "TYPE" => "char", "FROM" => "INNER JOIN b_catalog_product CP ON (P.PRODUCT_ID = CP.ID)"),
			"PRODUCT_NEGATIVE_AMOUNT_TRACE" => array("FIELD" => "IF (CP.NEGATIVE_AMOUNT_TRACE = 'D', '".$DB->ForSql(COption::GetOptionString('catalog','allow_negative_amount','N'))."', CP.NEGATIVE_AMOUNT_TRACE)", "TYPE" => "char", "FROM" => "INNER JOIN b_catalog_product CP ON (P.PRODUCT_ID = CP.ID)"),
			"PRODUCT_WEIGHT" => array("FIELD" => "CP.WEIGHT", "TYPE" => "int", "FROM" => "INNER JOIN b_catalog_product CP ON (P.PRODUCT_ID = CP.ID)"),

			"ELEMENT_IBLOCK_ID" => array("FIELD" => "IE.IBLOCK_ID", "TYPE" => "int", "FROM" => "INNER JOIN b_iblock_element IE ON (P.PRODUCT_ID = IE.ID)"),

			"CATALOG_GROUP_NAME" => array("FIELD" => "CGL.NAME", "TYPE" => "string", "FROM" => "LEFT JOIN b_catalog_group_lang CGL ON (CG.ID = CGL.CATALOG_GROUP_ID AND CGL.LID = '".LANGUAGE_ID."')"),
		);

		$arFields["CAN_ACCESS"] = array(
			"FIELD" => "IF(CGG.ID IS NULL, 'N', 'Y')",
			"TYPE" => "char",
			"FROM" => "LEFT JOIN b_catalog_group2group CGG ON (CG.ID = CGG.CATALOG_GROUP_ID AND CGG.GROUP_ID IN (".$strUserGroups.") AND CGG.BUY <> 'Y')"
		);
		$arFields["CAN_BUY"] = array(
			"FIELD" => "IF(CGG1.ID IS NULL, 'N', 'Y')",
			"TYPE" => "char",
			"FROM" => "LEFT JOIN b_catalog_group2group CGG1 ON (CG.ID = CGG1.CATALOG_GROUP_ID AND CGG1.GROUP_ID IN (".$strUserGroups.") AND CGG1.BUY = 'Y')"
		);

		$arSqls = CCatalog::PrepareSql($arFields, $arOrder, $arFilter, $arGroupBy, $arSelectFields);

		if (array_key_exists("CAN_ACCESS", $arFields) || array_key_exists("CAN_BUY", $arFields))
			$arSqls["SELECT"] = str_replace("%%_DISTINCT_%%", "DISTINCT", $arSqls["SELECT"]);
		else
			$arSqls["SELECT"] = str_replace("%%_DISTINCT_%%", "", $arSqls["SELECT"]);

		if (empty($arGroupBy) && is_array($arGroupBy))
		{
			$strSql = "SELECT ".$arSqls["SELECT"]." FROM b_catalog_price P ".$arSqls["FROM"];
			if (!empty($arSqls["WHERE"]))
				$strSql .= " WHERE ".$arSqls["WHERE"];
			if (!empty($arSqls["GROUPBY"]))
				$strSql .= " GROUP BY ".$arSqls["GROUPBY"];

			$dbRes = $DB->Query($strSql, false, "File: ".__FILE__."<br>Line: ".__LINE__);
			if ($arRes = $dbRes->Fetch())
				return $arRes["CNT"];
			else
				return false;
		}

		$strSql = "SELECT ".$arSqls["SELECT"]." FROM b_catalog_price P ".$arSqls["FROM"];
		if (!empty($arSqls["WHERE"]))
			$strSql .= " WHERE ".$arSqls["WHERE"];
		if (!empty($arSqls["GROUPBY"]))
			$strSql .= " GROUP BY ".$arSqls["GROUPBY"];
		if (!empty($arSqls["ORDERBY"]))
			$strSql .= " ORDER BY ".$arSqls["ORDERBY"];

		$intTopCount = 0;
		$boolNavStartParams = (!empty($arNavStartParams) && is_array($arNavStartParams));
		if ($boolNavStartParams && array_key_exists('nTopCount', $arNavStartParams))
		{
			$intTopCount = intval($arNavStartParams["nTopCount"]);
		}
		if ($boolNavStartParams && 0 >= $intTopCount)
		{
			$strSql_tmp = "SELECT COUNT('x') as CNT FROM b_catalog_price P ".$arSqls["FROM"];
			if (!empty($arSqls["WHERE"]))
				$strSql_tmp .= " WHERE ".$arSqls["WHERE"];
			if (!empty($arSqls["GROUPBY"]))
				$strSql_tmp .= " GROUP BY ".$arSqls["GROUPBY"];

			$dbRes = $DB->Query($strSql_tmp, false, "File: ".__FILE__."<br>Line: ".__LINE__);
			$cnt = 0;
			if (empty($arSqls["GROUPBY"]))
			{
				if ($arRes = $dbRes->Fetch())
					$cnt = $arRes["CNT"];
			}
			else
			{
				$cnt = $dbRes->SelectedRowsCount();
			}

			$dbRes = new CDBResult();

			$dbRes->NavQuery($strSql, $cnt, $arNavStartParams);
		}
		else
		{
			if ($boolNavStartParams && 0 < $intTopCount)
			{
				$strSql .= " LIMIT ".$intTopCount;
			}
			$dbRes = $DB->Query($strSql, false, "File: ".__FILE__."<br>Line: ".__LINE__);
		}

		return $dbRes;
	}

	function GetListEx($arOrder = array(), $arFilter = array(), $arGroupBy = false, $arNavStartParams = false, $arSelectFields = array())
	{
		global $DB;

		if (empty($arSelectFields))
			$arSelectFields = array("ID", "PRODUCT_ID", "EXTRA_ID", "CATALOG_GROUP_ID", "PRICE", "CURRENCY", "TIMESTAMP_X", "QUANTITY_FROM", "QUANTITY_TO", "TMP_ID");

		$arFields = array(
			"ID" => array("FIELD" => "P.ID", "TYPE" => "int"),
			"PRODUCT_ID" => array("FIELD" => "P.PRODUCT_ID", "TYPE" => "int"),
			"EXTRA_ID" => array("FIELD" => "P.EXTRA_ID", "TYPE" => "int"),
			"CATALOG_GROUP_ID" => array("FIELD" => "P.CATALOG_GROUP_ID", "TYPE" => "int"),
			"PRICE" => array("FIELD" => "P.PRICE", "TYPE" => "double"),
			"CURRENCY" => array("FIELD" => "P.CURRENCY", "TYPE" => "string"),
			"TIMESTAMP_X" => array("FIELD" => "P.TIMESTAMP_X", "TYPE" => "datetime"),
			"QUANTITY_FROM" => array("FIELD" => "P.QUANTITY_FROM", "TYPE" => "int"),
			"QUANTITY_TO" => array("FIELD" => "P.QUANTITY_TO", "TYPE" => "int"),
			"TMP_ID" => array("FIELD" => "P.TMP_ID", "TYPE" => "string"),

			"PRODUCT_QUANTITY" => array("FIELD" => "CP.QUANTITY", "TYPE" => "int", "FROM" => "INNER JOIN b_catalog_product CP ON (P.PRODUCT_ID = CP.ID)"),
			"PRODUCT_QUANTITY_TRACE" => array("FIELD" => "IF (CP.QUANTITY_TRACE = 'D', '".$DB->ForSql(COption::GetOptionString('catalog','default_quantity_trace','N'))."', CP.QUANTITY_TRACE)", "TYPE" => "char", "FROM" => "INNER JOIN b_catalog_product CP ON (P.PRODUCT_ID = CP.ID)"),
			"PRODUCT_CAN_BUY_ZERO" => array("FIELD" => "IF (CP.CAN_BUY_ZERO = 'D', '".$DB->ForSql(COption::GetOptionString('catalog','default_can_buy_zero','N'))."', CP.CAN_BUY_ZERO)", "TYPE" => "char", "FROM" => "INNER JOIN b_catalog_product CP ON (P.PRODUCT_ID = CP.ID)"),
			"PRODUCT_NEGATIVE_AMOUNT_TRACE" => array("FIELD" => "IF (CP.NEGATIVE_AMOUNT_TRACE = 'D', '".$DB->ForSql(COption::GetOptionString('catalog','allow_negative_amount','N'))."', CP.NEGATIVE_AMOUNT_TRACE)", "TYPE" => "char", "FROM" => "INNER JOIN b_catalog_product CP ON (P.PRODUCT_ID = CP.ID)"),
			"PRODUCT_WEIGHT" => array("FIELD" => "CP.WEIGHT", "TYPE" => "int", "FROM" => "INNER JOIN b_catalog_product CP ON (P.PRODUCT_ID = CP.ID)"),

			"ELEMENT_IBLOCK_ID" => array("FIELD" => "IE.IBLOCK_ID", "TYPE" => "int", "FROM" => "INNER JOIN b_iblock_element IE ON (P.PRODUCT_ID = IE.ID)"),
			"ELEMENT_NAME" => array("FIELD" => "IE.NAME", "TYPE" => "string", "FROM" => "INNER JOIN b_iblock_element IE ON (P.PRODUCT_ID = IE.ID)"),

			"CATALOG_GROUP_CODE" => array("FIELD" => "CG.NAME", "TYPE" => "string", "FROM" => "INNER JOIN b_catalog_group CG ON (P.CATALOG_GROUP_ID = CG.ID)"),
			"CATALOG_GROUP_BASE" => array("FIELD" => "CG.BASE", "TYPE" => "char", "FROM" => "INNER JOIN b_catalog_group CG ON (P.CATALOG_GROUP_ID = CG.ID)"),
			"CATALOG_GROUP_SORT" => array("FIELD" => "CG.SORT", "TYPE" => "int", "FROM" => "INNER JOIN b_catalog_group CG ON (P.CATALOG_GROUP_ID = CG.ID)"),

			"CATALOG_GROUP_NAME" => array("FIELD" => "CGL.NAME", "TYPE" => "string", "FROM" => "LEFT JOIN b_catalog_group_lang CGL ON (P.CATALOG_GROUP_ID = CGL.CATALOG_GROUP_ID AND CGL.LID = '".LANGUAGE_ID."')"),

			"GROUP_GROUP_ID" => array("FIELD" => "CGG.GROUP_ID", "TYPE" => "int", "FROM" => "INNER JOIN b_catalog_group2group CGG ON (P.CATALOG_GROUP_ID = CGG.CATALOG_GROUP_ID)"),
			"GROUP_BUY" => array("FIELD" => "CGG.BUY", "TYPE" => "char", "FROM" => "INNER JOIN b_catalog_group2group CGG ON (P.CATALOG_GROUP_ID = CGG.CATALOG_GROUP_ID)")
		);

		$arSqls = CCatalog::PrepareSql($arFields, $arOrder, $arFilter, $arGroupBy, $arSelectFields);

		$arSqls["SELECT"] = str_replace("%%_DISTINCT_%%", "", $arSqls["SELECT"]);

		if (empty($arGroupBy) && is_array($arGroupBy))
		{
			$strSql = "SELECT ".$arSqls["SELECT"]." FROM b_catalog_price P ".$arSqls["FROM"];
			if (!empty($arSqls["WHERE"]))
				$strSql .= " WHERE ".$arSqls["WHERE"];
			if (!empty($arSqls["GROUPBY"]))
				$strSql .= " GROUP BY ".$arSqls["GROUPBY"];

			$dbRes = $DB->Query($strSql, false, "File: ".__FILE__."<br>Line: ".__LINE__);
			if ($arRes = $dbRes->Fetch())
				return $arRes["CNT"];
			else
				return false;
		}

		$strSql = "SELECT ".$arSqls["SELECT"]." FROM b_catalog_price P ".$arSqls["FROM"];
		if (!empty($arSqls["WHERE"]))
			$strSql .= " WHERE ".$arSqls["WHERE"];
		if (!empty($arSqls["GROUPBY"]))
			$strSql .= " GROUP BY ".$arSqls["GROUPBY"];
		if (!empty($arSqls["ORDERBY"]))
			$strSql .= " ORDER BY ".$arSqls["ORDERBY"];

		$intTopCount = 0;
		$boolNavStartParams = (!empty($arNavStartParams) && is_array($arNavStartParams));
		if ($boolNavStartParams && array_key_exists('nTopCount', $arNavStartParams))
		{
			$intTopCount = intval($arNavStartParams["nTopCount"]);
		}
		if ($boolNavStartParams && 0 >= $intTopCount)
		{
			$strSql_tmp = "SELECT COUNT('x') as CNT FROM b_catalog_price P ".$arSqls["FROM"];
			if (!empty($arSqls["WHERE"]))
				$strSql_tmp .= " WHERE ".$arSqls["WHERE"];
			if (!empty($arSqls["GROUPBY"]))
				$strSql_tmp .= " GROUP BY ".$arSqls["GROUPBY"];

			$dbRes = $DB->Query($strSql_tmp, false, "File: ".__FILE__."<br>Line: ".__LINE__);
			$cnt = 0;
			if (empty($arSqls["GROUPBY"]))
			{
				if ($arRes = $dbRes->Fetch())
					$cnt = $arRes["CNT"];
			}
			else
			{
				$cnt = $dbRes->SelectedRowsCount();
			}

			$dbRes = new CDBResult();

			$dbRes->NavQuery($strSql, $cnt, $arNavStartParams);
		}
		else
		{
			if ($boolNavStartParams && 0 < $intTopCount)
			{
				$strSql .= " LIMIT ".$intTopCount;
			}
			$dbRes = $DB->Query($strSql, false, "File: ".__FILE__."<br>Line: ".__LINE__);
		}

		return $dbRes;
	}
}
?>