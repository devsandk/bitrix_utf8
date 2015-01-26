<?
IncludeModuleLangFile(__FILE__);

class CAllCatalogProductGroups
{
	function CheckFields($ACTION, &$arFields, $ID = 0)
	{
		if ((is_set($arFields, "PRODUCT_ID") || $ACTION=="ADD") && intval($arFields["PRODUCT_ID"]) <= 0)
			return false;

		if ((is_set($arFields, "GROUP_ID") || $ACTION=="ADD") && intval($arFields["GROUP_ID"]) <= 0)
			return false;

		if ((is_set($arFields, "ACCESS_LENGTH") || $ACTION=="ADD"))
		{
			$arFields["ACCESS_LENGTH"] = intval($arFields["ACCESS_LENGTH"]);
			if ($arFields["ACCESS_LENGTH"] < 0)
				$arFields["ACCESS_LENGTH"] = 0;
		}

		if ((is_set($arFields, "ACCESS_LENGTH_TYPE") || $ACTION=="ADD") && !array_key_exists($arFields["ACCESS_LENGTH_TYPE"], CCatalogProduct::GetTimePeriodTypes(true)))
		{
			$arFields["ACCESS_LENGTH_TYPE"] = CCatalogProduct::TIME_PERIOD_DAY;
		}

		return true;
	}

	function GetByID($ID)
	{
		global $DB;
		$ID = intval($ID);
		if (0 >= $ID)
			return false;

		$strSql = "SELECT ID, PRODUCT_ID, GROUP_ID, ACCESS_LENGTH, ACCESS_LENGTH_TYPE FROM b_catalog_product2group WHERE ID = ".$ID;
		$db_res = $DB->Query($strSql, false, "File: ".__FILE__."<br>Line: ".__LINE__);
		if ($res = $db_res->Fetch())
			return $res;

		return false;
	}

	function Update($ID, $arFields)
	{
		global $DB;

		$ID = intval($ID);
		if ($ID <= 0)
			return false;

		if (!CCatalogProductGroups::CheckFields("UPDATE", $arFields, $ID))
			return False;

		$strUpdate = $DB->PrepareUpdate("b_catalog_product2group", $arFields);
		if (!empty($strUpdate))
		{
			$strSql = "UPDATE b_catalog_product2group SET ".$strUpdate." WHERE ID = ".$ID;
			$DB->Query($strSql, false, "File: ".__FILE__."<br>Line: ".__LINE__);
		}

		return $ID;
	}

	function Delete($ID)
	{
		global $DB;

		$ID = intval($ID);
		if (0 >= $ID)
			return false;

		return $DB->Query("DELETE FROM b_catalog_product2group WHERE ID = ".$ID, true);
	}

	function DeleteByGroup($ID)
	{
		global $DB;

		$ID = intval($ID);
		if (0 >= $ID)
			return false;

		return $DB->Query("DELETE FROM b_catalog_product2group WHERE GROUP_ID = ".$ID, true);
	}

	function OnGroupDelete($ID)
	{
		CCatalogProductGroups::DeleteByGroup($ID);
	}
}
?>