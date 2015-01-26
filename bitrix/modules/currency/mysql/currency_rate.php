<?
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/currency/general/currency_rate.php");

class CCurrencyRates extends CAllCurrencyRates
{
	function ConvertCurrency($valSum, $curFrom, $curTo, $valDate = "")
	{
		return doubleval(doubleval($valSum) * CCurrencyRates::GetConvertFactor($curFrom, $curTo, $valDate));
	}

	function GetConvertFactor($curFrom, $curTo, $valDate = "")
	{
		$obRates = new CCurrencyRates;
		return $obRates->GetConvertFactorEx($curFrom, $curTo, $valDate);
	}

	function _get_last_rates($valDate, $cur)
	{
		global $DB;

		$strSql = $DB->TopSql("
			SELECT C.AMOUNT, C.AMOUNT_CNT, CR.RATE, CR.RATE_CNT
			FROM
				b_catalog_currency C
				LEFT JOIN b_catalog_currency_rate CR ON (C.CURRENCY = CR.CURRENCY AND CR.DATE_RATE < '".$DB->ForSql($valDate)."')
			WHERE
				C.CURRENCY = '".$DB->ForSql($cur)."'
			ORDER BY
				DATE_RATE DESC
		", 1);
		$db_res = $DB->Query($strSql, false, "File: ".__FILE__."<br>Line: ".__LINE__);
		return $db_res->Fetch();
	}
}
?>