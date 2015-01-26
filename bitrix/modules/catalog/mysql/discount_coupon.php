<?
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/catalog/general/discount_coupon.php");

class CCatalogDiscountCoupon extends CAllCatalogDiscountCoupon
{
	public function Add($arFields, $bAffectDataFile = true)
	{
		global $DB;

		foreach (GetModuleEvents("catalog", "OnBeforeCouponAdd", true) as $arEvent)
		{
			if (false === ExecuteModuleEventEx($arEvent, array(&$arFields, &$bAffectDataFile)))
				return false;
		}

		$bAffectDataFile = false;

		if (!CCatalogDiscountCoupon::CheckFields("ADD", $arFields, 0))
			return false;

		$arInsert = $DB->PrepareInsert("b_catalog_discount_coupon", $arFields);

		$strSql = "INSERT INTO b_catalog_discount_coupon(".$arInsert[0].") VALUES(".$arInsert[1].")";
		$DB->Query($strSql, false, "File: ".__FILE__."<br>Line: ".__LINE__);

		$ID = intval($DB->LastID());

		foreach (GetModuleEvents("catalog", "OnCouponAdd", true) as $arEvent)
		{
			ExecuteModuleEventEx($arEvent, array($ID, $arFields));
		}

		return $ID;
	}

	public function Update($ID, $arFields)
	{
		global $DB;

		$ID = intval($ID);
		if ($ID <= 0)
			return false;

		foreach (GetModuleEvents("catalog", "OnBeforeCouponUpdate", true) as $arEvent)
		{
			if (false === ExecuteModuleEventEx($arEvent, array($ID, &$arFields)))
				return false;
		}

		if (!CCatalogDiscountCoupon::CheckFields("UPDATE", $arFields, $ID))
			return false;

		$strUpdate = $DB->PrepareUpdate("b_catalog_discount_coupon", $arFields);
		if (!empty($strUpdate))
		{
			$strSql = "UPDATE b_catalog_discount_coupon SET ".$strUpdate." WHERE ID = ".$ID;
			$DB->Query($strSql, false, "File: ".__FILE__."<br>Line: ".__LINE__);
		}

		foreach (GetModuleEvents("catalog", "OnCouponUpdate", true) as $arEvent)
		{
			ExecuteModuleEventEx($arEvent, array($ID, $arFields));
		}

		return $ID;
	}

	public function Delete($ID, $bAffectDataFile = true)
	{
		global $DB;

		$ID = intval($ID);
		if ($ID <= 0)
			return false;

		foreach (GetModuleEvents("catalog", "OnBeforeCouponDelete", true) as $arEvent)
		{
			if (false === ExecuteModuleEventEx($arEvent, array($ID, &$bAffectDataFile)))
				return false;
		}

		$bAffectDataFile = false;

		$DB->Query("DELETE FROM b_catalog_discount_coupon WHERE ID = ".$ID, false, "File: ".__FILE__."<br>Line: ".__LINE__);

		foreach (GetModuleEvents("catalog", "OnCouponDelete", true) as $arEvent)
		{
			if (false === ExecuteModuleEventEx($arEvent, array($ID)))
				return false;
		}

		return true;
	}

	public function DeleteByDiscountID($ID, $bAffectDataFile = true)
	{
		global $DB;

		$bAffectDataFile = false;
		$ID = intval($ID);
		if ($ID <= 0)
			return false;

		$DB->Query("DELETE FROM b_catalog_discount_coupon WHERE DISCOUNT_ID = ".$ID, false, "File: ".__FILE__."<br>Line: ".__LINE__);

		return true;
	}

	public function GetByID($ID)
	{
		global $DB;

		$ID = intval($ID);
		if ($ID <= 0)
			return false;

		$strSql =
			"SELECT CD.ID, CD.DISCOUNT_ID, CD.ACTIVE, CD.COUPON, CD.ONE_TIME, ".
			$DB->DateToCharFunction("CD.DATE_APPLY", "FULL")." as DATE_APPLY, ".
			$DB->DateToCharFunction("CD.TIMESTAMP_X", "FULL")." as TIMESTAMP_X, ".
			"CD.CREATED_BY, CD.MODIFIED_BY, ".$DB->DateToCharFunction('CD.DATE_CREATE', 'FULL').' as DATE_CREATE, '.
			"CD.DESCRIPTION FROM b_catalog_discount_coupon CD WHERE CD.ID = ".$ID;

		$db_res = $DB->Query($strSql, false, "File: ".__FILE__."<br>Line: ".__LINE__);
		if ($res = $db_res->Fetch())
			return $res;

		return false;
	}

	public function GetList($arOrder = array(), $arFilter = array(), $arGroupBy = false, $arNavStartParams = false, $arSelectFields = array())
	{
		global $DB;

		$arFields = array(
			"ID" => array("FIELD" => "CD.ID", "TYPE" => "int"),
			"DISCOUNT_ID" => array("FIELD" => "CD.DISCOUNT_ID", "TYPE" => "string"),
			"ACTIVE" => array("FIELD" => "CD.ACTIVE", "TYPE" => "char"),
			"ONE_TIME" => array("FIELD" => "CD.ONE_TIME", "TYPE" => "char"),
			"COUPON" => array("FIELD" => "CD.COUPON", "TYPE" => "string"),
			"DATE_APPLY" => array("FIELD" => "CD.DATE_APPLY", "TYPE" => "datetime"),
			"DISCOUNT_NAME" => array("FIELD" => "CDD.NAME", "TYPE" => "string", "FROM" => "INNER JOIN b_catalog_discount CDD ON (CD.DISCOUNT_ID = CDD.ID)"),
			"DESCRIPTION" => array("FIELD" => "CD.DESCRIPTION","TYPE" => "string"),
			"TIMESTAMP_X" => array("FIELD" => "CD.TIMESTAMP_X", "TYPE" => "datetime"),
			"MODIFIED_BY" => array("FIELD" => "CD.MODIFIED_BY", "TYPE" => "int"),
			"DATE_CREATE" => array("FIELD" => "CD.DATE_CREATE", "TYPE" => "datetime"),
			"CREATED_BY" => array("FIELD" => "CD.CREATED_BY", "TYPE" => "int"),
		);

		$arSqls = CCatalog::PrepareSql($arFields, $arOrder, $arFilter, $arGroupBy, $arSelectFields);

		$arSqls["SELECT"] = str_replace("%%_DISTINCT_%%", "", $arSqls["SELECT"]);

		if (empty($arGroupBy) && is_array($arGroupBy))
		{
			$strSql = "SELECT ".$arSqls["SELECT"]." FROM b_catalog_discount_coupon CD ".$arSqls["FROM"];
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

		$strSql = "SELECT ".$arSqls["SELECT"]." FROM b_catalog_discount_coupon CD ".$arSqls["FROM"];
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
			$strSql_tmp = "SELECT COUNT('x') as CNT FROM b_catalog_discount_coupon CD ".$arSqls["FROM"];
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

	public function CouponApply($intUserID, $strCoupon)
	{
		global $DB;

		$mxResult = false;

		$intUserID = intval($intUserID);
		if (0 > $intUserID)
			$intUserID = 0;

		$arCouponList = array();
		$arCheck = (is_array($strCoupon) ? $strCoupon : array($strCoupon));
		foreach ($arCheck as &$strOneCheck)
		{
			$strOneCheck = strval($strOneCheck);
			if ('' != $strOneCheck)
				$arCouponList[] = $strOneCheck;
		}
		if (isset($strOneCheck))
			unset($strOneCheck);

		if (empty($arCouponList))
			return $mxResult;

		$boolFlag = false;
		$rsCoupons = CCatalogDiscountCoupon::GetList(
			array(),
			array('COUPON' => $arCouponList, 'ACTIVE' => 'Y'),
			false,
			false,
			array('ID', 'ONE_TIME', 'COUPON')
		);
		$strDateFunction = $DB->GetNowFunction();
		while ($arCoupon = $rsCoupons->Fetch())
		{
			$arCoupon['ID'] = intval($arCoupon['ID']);
			$arFields = array(
				"~DATE_APPLY" => $strDateFunction
			);

			if (self::TYPE_ONE_TIME == $arCoupon["ONE_TIME"])
			{
				$arFields["ACTIVE"] = "N";
				if (0 < $intUserID)
				{
					CCatalogDiscountCoupon::EraseCouponByManage($intUserID, $arCoupon['COUPON']);
				}
				else
				{
					CCatalogDiscountCoupon::EraseCoupon($arCoupon['COUPON']);
				}
			}
			elseif (self::TYPE_ONE_ORDER == $arCoupon["ONE_TIME"])
			{
				$boolFlag = true;
				if (!array_key_exists($arCoupon['ID'], self::$arOneOrderCoupons))
					self::$arOneOrderCoupons[$arCoupon['ID']] = array(
						'COUPON' => $arCoupon['COUPON'],
						'USER_ID' => $intUserID,
					);
			}

			$strUpdate = $DB->PrepareUpdate("b_catalog_discount_coupon", $arFields);
			if (!empty($strUpdate))
			{
				$strSql = "UPDATE b_catalog_discount_coupon SET ".$strUpdate." WHERE ID = ".$arCoupon['ID'];
				$DB->Query($strSql, false, "File: ".__FILE__."<br>Line: ".__LINE__);
				$mxResult = true;
			}
		}
		if ($boolFlag)
		{
			AddEventHandler('sale', 'OnBasketOrder', array('CCatalogDiscountCoupon', 'CouponOneOrderDisable'));
			AddEventHandler('sale', 'OnDoBasketOrder', array('CCatalogDiscountCoupon', 'CouponOneOrderDisable'));
		}
		return $mxResult;
	}

/*
* @deprecated deprecated since catalog 12.5.6
* @see CCatalogDiscountCoupon::CouponOneOrderDisable()
*/
	public function __CouponOneOrderDisable($arCoupons)
	{
		global $DB;
		if (!is_array($arCoupons))
			$arCoupons = array(intval($arCoupons));
		CatalogClearArray($arCoupons, false);
		if (empty($arCoupons))
			return;
		$strSql = "UPDATE b_catalog_discount_coupon SET ACTIVE='N' WHERE ID IN (".implode(', ', $arCoupons).") AND ONE_TIME='".self::TYPE_ONE_ORDER."'";
		$DB->Query($strSql, false, "File: ".__FILE__."<br>Line: ".__LINE__);
	}

	public function CouponOneOrderDisable($intOrderID = 0)
	{
		global $DB;
		if (!empty(self::$arOneOrderCoupons))
		{
			$arCouponID = array_keys(self::$arOneOrderCoupons);
			foreach (self::$arOneOrderCoupons as &$arCoupon)
			{
				$arCoupon['USER_ID'] = intval($arCoupon['USER_ID']);
				if (0 < $arCoupon['USER_ID'])
				{
					CCatalogDiscountCoupon::EraseCouponByManage($arCoupon['USER_ID'], $arCoupon['COUPON']);
				}
				else
				{
					CCatalogDiscountCoupon::EraseCoupon($arCoupon['COUPON']);
				}
			}
			if (isset($arCoupon))
				unset($arCoupon);
			CatalogClearArray($arCouponID, false);
			if (!empty($arCouponID))
			{
				$strSql = "UPDATE b_catalog_discount_coupon SET ACTIVE='N' WHERE ID IN (".implode(', ', $arCouponID).") AND ONE_TIME='".self::TYPE_ONE_ORDER."'";
				$DB->Query($strSql, false, "File: ".__FILE__."<br>Line: ".__LINE__);
			}
			self::$arOneOrderCoupons = array();
		}
	}

	public function IsExistCoupon($strCoupon)
	{
		global $DB;

		if ('' == $strCoupon)
			return false;

		$strSql = "select ID, COUPON from b_catalog_discount_coupon where COUPON='".$DB->ForSql($strCoupon)."' limit 1";
		$rsCoupons = $DB->Query($strSql, false, "File: ".__FILE__."<br>Line: ".__LINE__);
		if ($arCoupon = $rsCoupons->Fetch())
			return true;
		return false;
	}
}
?>