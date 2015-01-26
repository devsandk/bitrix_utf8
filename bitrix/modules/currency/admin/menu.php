<?
IncludeModuleLangFile(__FILE__);

if('D' < $APPLICATION->GetGroupRight("currency"))
{
		$aMenu = array(
		"parent_menu" => "global_menu_settings",
		"section" => "currency",
		"sort" => 300,
		"text" => GetMessage("CURRENCY_CONTROL"),
		"title" => GetMessage("currency_menu_title"),
		"icon" => "currency_menu_icon",
		"page_icon" => "currency_page_icon",
		"items_id" => "menu_currency",
		"items" => array(
			array(
				"text" => GetMessage("CURRENCY"),
				"title" => GetMessage("CURRENCY_ALT"),
				"url" => "currencies.php?lang=".LANGUAGE_ID,
				"more_url" => array(
					"currency_edit.php?lang=".LANGUAGE_ID,
				)
			),
			array(
				"text" => GetMessage("CURRENCY_RATES"),
				"title" => GetMessage("CURRENCY_RATES_ALT"),
				"url" => "currencies_rates.php?lang=".LANGUAGE_ID,
				"more_url" => array(
					"currency_rate_edit.php?lang=".LANGUAGE_ID,
				)
			)
		)
	);
	return $aMenu;
}
return false;
?>