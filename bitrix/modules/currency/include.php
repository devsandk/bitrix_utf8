<?
use Bitrix\Main\Loader;

global $DB;
$strDBType = strtolower($DB->type);

Loader::registerAutoLoadClasses(
	'currency',
	array(
		'CCurrency' => $strDBType.'/currency.php',
		'CCurrencyLang' => $strDBType.'/currency_lang.php',
		'CCurrencyRates' => $strDBType.'/currency_rate.php',
		'Bitrix\Currency\CurrencyTable' => 'lib/currency.php',
		'Bitrix\Currency\CurrencyLangTable' => 'lib/currencylang.php',
		'Bitrix\Currency\CurrencyRateTable' => 'lib/currencyrate.php'
	)
);

$jsCurrencyDescr = array(
	'js' => '/bitrix/js/currency/core_currency.js',
	'rel' => array('core')
);
CJSCore::RegisterExt('currency', $jsCurrencyDescr);

define('CURRENCY_CACHE_DEFAULT_TIME', 10800);

define('CURRENCY_ISO_STANDART_URL', 'http://www.iso.org/iso/home/standards/currency_codes.htm');

/*
* @deprecated deprecated since currency 14.0.0
* @see CCurrencyLang::CurrencyFormat()
*/
function CurrencyFormat($price, $currency)
{
	return CCurrencyLang::CurrencyFormat($price, $currency, true);
}

/*
* @deprecated deprecated since currency 14.0.0
* @see CCurrencyLang::CurrencyFormat()
*/
function CurrencyFormatNumber($price, $currency)
{
	return CCurrencyLang::CurrencyFormat($price, $currency, false);
}
?>