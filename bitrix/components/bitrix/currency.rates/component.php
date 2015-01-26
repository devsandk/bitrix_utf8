<?if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

if (!isset($arParams['arrCURRENCY_FROM']))
	$arParams['arrCURRENCY_FROM'] = array();
foreach ($arParams['arrCURRENCY_FROM'] as $key => $value)
{
	if ('' === $value)
		unset($arParams['arrCURRENCY_FROM'][$key]);
}

$arParams['CURRENCY_BASE'] = trim($arParams['CURRENCY_BASE']);

$arParams['RATE_DAY'] = trim($arParams['RATE_DAY']);

$arParams['SHOW_CB'] = ('Y' == $arParams['SHOW_CB'] ? 'Y' : 'N');
if ('RUB' != $arParams['CURRENCY_BASE'] && 'RUR' != $arParams['CURRENCY_BASE'])
	$arParams['SHOW_CB'] = 'N';

if (!isset($arParams["CACHE_TIME"]))
	$arParams["CACHE_TIME"] = 86400;
$arParams["CACHE_TIME"] = intval($arParams["CACHE_TIME"]);

if ($this->StartResultCache())
{
	if (!CModule::IncludeModule("currency"))
	{
		$this->AbortResultCache();
		ShowError(GetMessage("CURRENCY_MODULE_NOT_INSTALLED"));
		return;
	}

	global $CACHE_MANAGER;

	$arResult = array();
	$arResult["CURRENCY"] = array();

	if ('' == $arParams["CURRENCY_BASE"])
		$arParams["CURRENCY_BASE"] = COption::GetOptionString("sale", "default_currency");

	if ('' == $arParams["CURRENCY_BASE"])
		$arParams["CURRENCY_BASE"] = CCurrency::GetBaseCurrency();

	if ('' == $arParams["CURRENCY_BASE"])
	{
		$dbCurrency = CCurrency::GetList(($by="SORT"), ($order="ASC"));
		$arCurrency = $dbCurrency->Fetch();
		$arParams["CURRENCY_BASE"] = $arCurrency["CURRENCY"];
	}

	if ('' != $arParams["CURRENCY_BASE"])
	{
		if ('' == $arParams["RATE_DAY"])
		{
			$arResult["RATE_DAY_TIMESTAMP"] = time();
			$arResult["RATE_DAY_SHOW"] = ConvertTimeStamp($arResult["RATE_DAY_TIMESTAMP"], 'SHORT');
		}
		else
		{
			$arRATE_DAY_PARSED = ParseDateTime($arParams["RATE_DAY"], "YYYY-MM-DD");
			$arRATE_DAY_PARSED['YYYY'] = intval($arRATE_DAY_PARSED['YYYY']);
			if (1901 > $arRATE_DAY_PARSED["YYYY"] || 2038 < $arRATE_DAY_PARSED["YYYY"])
			{
				$arResult["RATE_DAY_TIMESTAMP"] = time();
				$arResult["RATE_DAY_SHOW"] = ConvertTimeStamp($arResult["RATE_DAY_TIMESTAMP"], 'SHORT');
			}
			else
			{
				$arResult["RATE_DAY_TIMESTAMP"] = mktime(0, 0, 0, $arRATE_DAY_PARSED["MM"], $arRATE_DAY_PARSED["DD"], $arRATE_DAY_PARSED["YYYY"]);
				$arResult["RATE_DAY_SHOW"] = ConvertTimeStamp($arResult["RATE_DAY_TIMESTAMP"], 'SHORT');
			}
		}

		if (!empty($arParams["arrCURRENCY_FROM"]))
		{
			if ('Y' == $arParams["SHOW_CB"])
			{
				$bWarning = false;

				$obHttp = new CHTTP();
				$obHttp->Query(
					'GET',
					'www.cbr.ru',
					80,
					"/scripts/XML_daily.asp?date_req=".date("d.m.Y", $arResult["RATE_DAY_TIMESTAMP"]),
					false,
					'',
					'N'
				);

				$strQueryText = $obHttp->result;
				if (empty($strQueryText))
					$bWarning = true;

				if (!$bWarning)
				{
					if (SITE_CHARSET != "windows-1251")
						$strQueryText = $APPLICATION->ConvertCharset($strQueryText, "windows-1251", SITE_CHARSET);

					require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/classes/general/xml.php");

					$strQueryText = preg_replace("#<!DOCTYPE[^>]+?>#i", "", $strQueryText);
					$strQueryText = preg_replace("#<"."\\?XML[^>]+?\\?".">#i", "", $strQueryText);

					$objXML = new CDataXML();
					$objXML->LoadString($strQueryText);
					$arData = $objXML->GetArray();

					$arFields = array();
					$arResult["CURRENCY_CBRF"] = array();

					if (!empty($arData) && is_array($arData))
					{
						if (!empty($arData["ValCurs"]) && is_array($arData["ValCurs"]))
						{
							if (!empty($arData["ValCurs"]["#"]) && is_array($arData["ValCurs"]["#"]))
							{
								if (!empty($arData["ValCurs"]["#"]["Valute"]) && is_array($arData["ValCurs"]["#"]["Valute"]))
								{
									$arCBVal = $arData["ValCurs"]["#"]["Valute"];
									foreach($arCBVal as &$arOneCBVal)
									{
										if (in_array($arOneCBVal["#"]["CharCode"][0]["#"], $arParams["arrCURRENCY_FROM"]))
										{
											$arCurrency = array(
												"CURRENCY" => $arOneCBVal["#"]["CharCode"][0]["#"],
												"RATE_CNT" => intval($arOneCBVal["#"]["Nominal"][0]["#"]),
												"RATE" => doubleval(str_replace(",", ".", $arOneCBVal["#"]["Value"][0]["#"]))
											);

											$arResult["CURRENCY_CBRF"][] = array(
												"FROM" => CurrencyFormat($arCurrency["RATE_CNT"], $arCurrency["CURRENCY"]),
												"BASE" => CurrencyFormat($arCurrency["RATE"], $arParams["CURRENCY_BASE"]),
											);
										}
									}
									if (isset($arOneCBVal))
										unset($arOneCBVal);
								}
							}
						}
					}
				}
			}

			$arCurrencyList = array();

			$arDBCurrencies = array();
			$dbCurrencyList = CCurrency::GetList(($b = ""), ($o = ""));
			while ($arCurrency = $dbCurrencyList->Fetch())
				$arDBCurrencies[$arCurrency["CURRENCY"]] = $arCurrency["AMOUNT_CNT"];

			foreach ($arParams["arrCURRENCY_FROM"] as &$strCurrencyCode)
			{
				if (array_key_exists($strCurrencyCode, $arDBCurrencies))
				{
					$arCurrencyList[] = $strCurrencyCode;
					$rate = CCurrencyRates::ConvertCurrency($arDBCurrencies[$strCurrencyCode], $strCurrencyCode, $arParams["CURRENCY_BASE"], $arParams["RATE_DAY"]);
					$arResult["CURRENCY"][] = array(
						'FROM' => CurrencyFormat($arDBCurrencies[$strCurrencyCode], $strCurrencyCode),
						'BASE' => CurrencyFormat($rate, $arParams["CURRENCY_BASE"]),
					);
				}
			}
			if (isset($strCurrencyCode))
				unset($strCurrencyCode);

			if (!empty($arCurrencyList))
			{
				if (defined("BX_COMP_MANAGED_CACHE"))
				{
					$arCurrencyList[] = $arParams["CURRENCY_BASE"];
					$arCurrencyList = array_unique($arCurrencyList);
					$CACHE_MANAGER->StartTagCache($this->GetCachePath());
					foreach ($arCurrencyList as &$strOneCurrency)
					{
						$CACHE_MANAGER->RegisterTag("currency_id_".$strOneCurrency);
					}
					if (isset($strOneCurrency))
						unset($strOneCurrency);
					$CACHE_MANAGER->EndTagCache();
				}
			}
		}
	}

	$this->IncludeComponentTemplate();
}
?>