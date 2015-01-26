<?
use Bitrix\Main\Type\Collection;
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/sale/general/discount.php");

class CSaleDiscount extends CAllSaleDiscount
{
	public function Add($arFields)
	{
		global $DB;

		$boolNewVersion = true;
		if (!array_key_exists('CONDITIONS', $arFields) && !array_key_exists('ACTIONS', $arFields))
		{
			$boolConvert = CSaleDiscount::__ConvertOldFormat('ADD', $arFields);
			if (!$boolConvert)
				return false;
			$boolNewVersion = false;
		}

		if (!CSaleDiscount::CheckFields("ADD", $arFields))
			return false;

		if ($boolNewVersion)
		{
			$boolConvert = CSaleDiscount::__SetOldFields('ADD', $arFields);
			if (!$boolConvert)
				return false;
		}

		$arInsert = $DB->PrepareInsert("b_sale_discount", $arFields);

		$strSql = "insert into b_sale_discount(".$arInsert[0].") values(".$arInsert[1].")";
		$DB->Query($strSql, false, "File: ".__FILE__."<br>Line: ".__LINE__);

		$ID = (int)$DB->LastID();

		if ($ID > 0)
		{
			self::updateUserGroups($ID, $arFields['USER_GROUPS'], $arFields['ACTIVE'], false);
			if (isset($arFields['HANDLERS']))
				self::updateDiscountHandlers($ID, $arFields['HANDLERS'], false);
		}

		return $ID;
	}

	public function Update($ID, $arFields)
	{
		global $DB;

		$ID = (int)$ID;
		if ($ID <= 0)
			return false;

		$boolNewVersion = true;
		$arFields['ID'] = $ID;
		if (!array_key_exists('CONDITIONS', $arFields) && !array_key_exists('ACTIONS', $arFields))
		{
			$boolConvert = CSaleDiscount::__ConvertOldFormat('UPDATE', $arFields);
			if (!$boolConvert)
				return false;
			$boolNewVersion = false;
		}

		if (!CSaleDiscount::CheckFields("UPDATE", $arFields))
			return false;

		if ($boolNewVersion)
		{
			$boolConvert = CSaleDiscount::__SetOldFields('UPDATE', $arFields);
			if (!$boolConvert)
				return false;
		}

		$strUpdate = $DB->PrepareUpdate("b_sale_discount", $arFields);
		if (!empty($strUpdate))
		{
			$strSql = "update b_sale_discount set ".$strUpdate." where ID = ".$ID;
			$DB->Query($strSql, false, "File: ".__FILE__."<br>Line: ".__LINE__);
		}

		if (isset($arFields['USER_GROUPS']))
			self::updateUserGroups($ID, $arFields['USER_GROUPS'], (isset($arFields['ACTIVE']) ? $arFields['ACTIVE'] : ''), true);

		if (isset($arFields['HANDLERS']))
			self::updateDiscountHandlers($ID, $arFields['HANDLERS'], true);

		return $ID;
	}

	public function Delete($ID)
	{
		global $DB;
		$ID = (int)$ID;
		if ($ID <= 0)
			return false;

		$DB->Query("delete from b_sale_discount_group where DISCOUNT_ID = ".$ID, false, "File: ".__FILE__."<br>Line: ".__LINE__);
		$DB->Query("delete from b_sale_discount_module where DISCOUNT_ID = ".$ID, false, "File: ".__FILE__."<br>Line: ".__LINE__);
		return $DB->Query("delete from b_sale_discount where ID = ".$ID, true);
	}

	public function GetList($arOrder = array(), $arFilter = array(), $arGroupBy = false, $arNavStartParams = false, $arSelectFields = array())
	{
		global $DB;

		if (!is_array($arOrder) && !is_array($arFilter))
		{
			$arOrder = (string)($arOrder);
			$arFilter = (string)($arFilter);
			if ($arOrder !== '' && $arFilter !== '')
				$arOrder = array($arOrder => $arFilter);
			else
				$arOrder = array();
			if (is_array($arGroupBy))
				$arFilter = $arGroupBy;
			else
				$arFilter = array();
			if (isset($arFilter["PRICE"]))
			{
				$valTmp = $arFilter["PRICE"];
				unset($arFilter["PRICE"]);
				$arFilter["<=PRICE_FROM"] = $valTmp;
				$arFilter[">=PRICE_TO"] = $valTmp;
			}
			$arGroupBy = false;
		}

		$arFields = array(
			"ID" => array("FIELD" => "D.ID", "TYPE" => "int"),
			"XML_ID" => array("FIELD" => "D.XML_ID", "TYPE" => "string"),
			"LID" => array("FIELD" => "D.LID", "TYPE" => "string"),
			"SITE_ID" => array("FIELD" => "D.LID", "TYPE" => "string"),
			"NAME" => array("FIELD" => "D.NAME", "TYPE" => "string"),
			"PRICE_FROM" => array("FIELD" => "D.PRICE_FROM", "TYPE" => "double", "WHERE" => array("CSaleDiscount", "PrepareCurrency4Where")),
			"PRICE_TO" => array("FIELD" => "D.PRICE_TO", "TYPE" => "double", "WHERE" => array("CSaleDiscount", "PrepareCurrency4Where")),
			"CURRENCY" => array("FIELD" => "D.CURRENCY", "TYPE" => "string"),
			"DISCOUNT_VALUE" => array("FIELD" => "D.DISCOUNT_VALUE", "TYPE" => "double"),
			"DISCOUNT_TYPE" => array("FIELD" => "D.DISCOUNT_TYPE", "TYPE" => "char"),
			"ACTIVE" => array("FIELD" => "D.ACTIVE", "TYPE" => "char"),
			"SORT" => array("FIELD" => "D.SORT", "TYPE" => "int"),
			"ACTIVE_FROM" => array("FIELD" => "D.ACTIVE_FROM", "TYPE" => "datetime"),
			"ACTIVE_TO" => array("FIELD" => "D.ACTIVE_TO", "TYPE" => "datetime"),
			"TIMESTAMP_X" => array("FIELD" => "D.TIMESTAMP_X", "TYPE" => "datetime"),
			"MODIFIED_BY" => array("FIELD" => "D.MODIFIED_BY", "TYPE" => "int"),
			"DATE_CREATE" => array("FIELD" => "D.DATE_CREATE", "TYPE" => "datetime"),
			"CREATED_BY" => array("FIELD" => "D.CREATED_BY", "TYPE" => "int"),
			"PRIORITY" => array("FIELD" => "D.PRIORITY", "TYPE" => "int"),
			"LAST_DISCOUNT" => array("FIELD" => "D.LAST_DISCOUNT", "TYPE" => "char"),
			"VERSION" => array("FIELD" => "D.VERSION", "TYPE" => "int"),
			"CONDITIONS" => array("FIELD" => "D.CONDITIONS", "TYPE" => "string"),
			"UNPACK" => array("FIELD" => "D.UNPACK", "TYPE" => "string"),
			"APPLICATION" => array("FIELD" => "D.APPLICATION", "TYPE" => "string"),
			"ACTIONS" => array("FIELD" => "D.ACTIONS", "TYPE" => "string"),
			"USE_COUPONS" => array("FIELD" => "D.USE_COUPONS", "TYPE" => "char"),
			"USER_GROUPS" => array("FIELD" => "DG.GROUP_ID", "TYPE" => "int","FROM" => "LEFT JOIN b_sale_discount_group DG ON (D.ID = DG.DISCOUNT_ID)")
		);

		if (empty($arSelectFields))
			$arSelectFields = array('ID','LID','SITE_ID','PRICE_FROM','PRICE_TO','CURRENCY','DISCOUNT_VALUE','DISCOUNT_TYPE','ACTIVE','SORT','ACTIVE_FROM','ACTIVE_TO','PRIORITY','LAST_DISCOUNT','VERSION','NAME');
		elseif (is_array($arSelectFields) && in_array('*',$arSelectFields))
			$arSelectFields = array('ID','LID','SITE_ID','PRICE_FROM','PRICE_TO','CURRENCY','DISCOUNT_VALUE','DISCOUNT_TYPE','ACTIVE','SORT','ACTIVE_FROM','ACTIVE_TO','PRIORITY','LAST_DISCOUNT','VERSION','NAME');

		$arSqls = CSaleOrder::PrepareSql($arFields, $arOrder, $arFilter, $arGroupBy, $arSelectFields);

		$arSqls["SELECT"] = str_replace("%%_DISTINCT_%%", '', $arSqls["SELECT"]);

		if (empty($arGroupBy) && is_array($arGroupBy))
		{
			$strSql = "select ".$arSqls["SELECT"]." from b_sale_discount D ".$arSqls["FROM"];
			if (!empty($arSqls["WHERE"]))
				$strSql .= " where ".$arSqls["WHERE"];
			if (!empty($arSqls["GROUPBY"]))
				$strSql .= " group by ".$arSqls["GROUPBY"];

			$dbRes = $DB->Query($strSql, false, "File: ".__FILE__."<br>Line: ".__LINE__);
			if ($arRes = $dbRes->Fetch())
				return $arRes["CNT"];
			else
				return false;
		}

		$strSql = "select ".$arSqls["SELECT"]." from b_sale_discount D ".$arSqls["FROM"];
		if (!empty($arSqls["WHERE"]))
			$strSql .= " where ".$arSqls["WHERE"];
		if (!empty($arSqls["GROUPBY"]))
			$strSql .= " group by ".$arSqls["GROUPBY"];
		if (!empty($arSqls["ORDERBY"]))
			$strSql .= " order by ".$arSqls["ORDERBY"];

		$intTopCount = 0;
		$boolNavStartParams = (!empty($arNavStartParams) && is_array($arNavStartParams));
		if ($boolNavStartParams && isset($arNavStartParams['nTopCount']))
		{
			$intTopCount = (int)$arNavStartParams["nTopCount"];
		}
		if ($boolNavStartParams && $intTopCount <= 0)
		{
			$strSql_tmp = "select COUNT('x') as CNT from b_sale_discount D ".$arSqls["FROM"];
			if (!empty($arSqls["WHERE"]))
				$strSql_tmp .= " where ".$arSqls["WHERE"];
			if (!empty($arSqls["GROUPBY"]))
				$strSql_tmp .= " group by ".$arSqls["GROUPBY"];

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
			if ($boolNavStartParams && $intTopCount > 0)
			{
				$strSql .= " limit ".$intTopCount;
			}
			$dbRes = $DB->Query($strSql, false, "File: ".__FILE__."<br>Line: ".__LINE__);
		}

		return $dbRes;
	}

	public function GetDiscountGroupList($arOrder = array(), $arFilter = array(), $arGroupBy = false, $arNavStartParams = false, $arSelectFields = array())
	{
		global $DB;

		$arFields = array(
			"ID" => array("FIELD" => "DG.ID", "TYPE" => "int"),
			"DISCOUNT_ID" => array("FIELD" => "DG.DISCOUNT_ID", "TYPE" => "int"),
			"GROUP_ID" => array("FIELD" => "DG.GROUP_ID", "TYPE" => "int"),
		);

		$arSqls = CSaleOrder::PrepareSql($arFields, $arOrder, $arFilter, $arGroupBy, $arSelectFields);

		$arSqls["SELECT"] = str_replace("%%_DISTINCT_%%", "", $arSqls["SELECT"]);

		if (empty($arGroupBy) && is_array($arGroupBy))
		{
			$strSql = "select ".$arSqls["SELECT"]." from b_sale_discount_group DG ".$arSqls["FROM"];
			if (!empty($arSqls["WHERE"]))
				$strSql .= " where ".$arSqls["WHERE"];
			if (!empty($arSqls["GROUPBY"]))
				$strSql .= " group by ".$arSqls["GROUPBY"];

			$dbRes = $DB->Query($strSql, false, "File: ".__FILE__."<br>Line: ".__LINE__);
			if ($arRes = $dbRes->Fetch())
				return $arRes["CNT"];
			else
				return false;
		}

		$strSql = "select ".$arSqls["SELECT"]." from b_sale_discount_group DG ".$arSqls["FROM"];
		if (!empty($arSqls["WHERE"]))
			$strSql .= " where ".$arSqls["WHERE"];
		if (!empty($arSqls["GROUPBY"]))
			$strSql .= " group by ".$arSqls["GROUPBY"];
		if (!empty($arSqls["ORDERBY"]))
			$strSql .= " order by ".$arSqls["ORDERBY"];

		$intTopCount = 0;
		$boolNavStartParams = (!empty($arNavStartParams) && is_array($arNavStartParams));
		if ($boolNavStartParams && array_key_exists('nTopCount', $arNavStartParams))
		{
			$intTopCount = intval($arNavStartParams["nTopCount"]);
		}
		if ($boolNavStartParams && 0 >= $intTopCount)
		{
			$strSql_tmp = "select COUNT('x') as CNT from b_sale_discount_group DG ".$arSqls["FROM"];
			if (!empty($arSqls["WHERE"]))
				$strSql_tmp .= " where ".$arSqls["WHERE"];
			if (!empty($arSqls["GROUPBY"]))
				$strSql_tmp .= " group by ".$arSqls["GROUPBY"];

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
				$strSql .= " limit ".$intTopCount;
			}
			$dbRes = $DB->Query($strSql, false, "File: ".__FILE__."<br>Line: ".__LINE__);
		}

		return $dbRes;
	}

	protected function updateUserGroups($discountID, $userGroups, $active = '', $updateData)
	{
		global $DB;

		$discountID = (int)$discountID;
		if ($discountID <= 0 || empty($userGroups) || !is_array($userGroups))
			return;

		$active = (string)$active;
		if ($active !== 'Y' && $active !== 'N')
		{
			$strQuery = 'select ID, ACTIVE from b_sale_discount where DISCOUNT_ID = '.$discountID;
			$rsActive = $DB->Query($strQuery,  false, "File: ".__FILE__."<br>Line: ".__LINE__);
			if ($activeFromDatabase = $rsActive->Fetch())
			{
				$active = $activeFromDatabase['ACTIVE'];
			}
		}
		if ($updateData)
		{
			$strQuery = 'delete from b_sale_discount_group where DISCOUNT_ID = '.$discountID;
			$DB->Query($strQuery,  false, "File: ".__FILE__."<br>Line: ".__LINE__);
		}
		foreach ($userGroups as &$value)
		{
			$strQuery = "insert into b_sale_discount_group(DISCOUNT_ID, GROUP_ID) values(".$discountID.", ".$value.")";
			$DB->Query($strQuery, false, "File: ".__FILE__."<br>Line: ".__LINE__);
		}
		unset($value);
	}

	protected function updateDiscountHandlers($discountID, $handlers, $update)
	{
		global $DB;

		$discountID = (int)$discountID;
		if ($discountID <= 0 || empty($handlers) || !is_array($handlers))
		{
			return;
		}
		if (isset($handlers['MODULES']))
		{
			if ($update)
			{
				$sqlQuery = 'delete from b_sale_discount_module where DISCOUNT_ID = '.$discountID;
				$DB->Query($sqlQuery, false, 'File: '.__FILE__.'<br>Line: '.__LINE__);
			}
			if (!empty($handlers['MODULES']))
			{
				foreach ($handlers['MODULES'] as &$oneModuleID)
				{
					$fields = array(
						'DISCOUNT_ID' => $discountID,
						'MODULE_ID' => $oneModuleID
					);
					$insert = $DB->PrepareInsert('b_sale_discount_module', $fields);
					$sqlQuery = "insert into b_sale_discount_module(".$insert[0].") values(".$insert[1].")";
					$DB->Query($sqlQuery, false, 'File: '.__FILE__.'<br>Line: '.__LINE__);
				}
				unset($oneModuleID);
			}
		}
	}

	protected function getDiscountHandlers($discountList)
	{
		global $DB;

		$defaultRes = array(
			'MODULES' => array(),
			'EXT_FILES' => array()
		);
		$result = array();
		if (!empty($discountList) && is_array($discountList))
		{
			$map = array();
			foreach ($discountList as $value)
			{
				$value = (int)$value;
				if (0 < $value)
					$map[$value] = true;
			}
			if (!empty($map))
			{
				$map = array_keys($map);
				sort($map);
			}
			$discountList = $map;
			if (!empty($discountList))
			{
				$result = array_fill_keys($discountList, $defaultRes);
				$discountIn = implode(', ', $discountList);
				$sqlQuery = 'select * from b_sale_discount_module where DISCOUNT_ID IN ('.$discountIn.')';
				$resQuery = $DB->Query($sqlQuery, false, 'File: '.__FILE__.'<br>Line: '.__LINE__);
				while ($row = $resQuery->Fetch())
				{
					$row['DISCOUNT_ID'] = (int)$row['DISCOUNT_ID'];
					$result[$row['DISCOUNT_ID']]['MODULES'][] = $row['MODULE_ID'];
				}
			}
		}

		return $result;
	}
}
?>