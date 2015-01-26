<?if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true) die();?><?

if (!CModule::IncludeModule("currency"))
	return;

$arCurrency = array();
$rsCurrency = CCurrency::GetList(($by="SORT"), ($order="ASC"));
while ($arr = $rsCurrency->Fetch())
{
	$arCurrency[$arr["CURRENCY"]] = "[".$arr["CURRENCY"]."]".('' != $arr['FULL_NAME'] ? ' '.$arr['FULL_NAME'] : '');
}

$arComponentParameters = array(
	"PARAMETERS" => array(
		"arrCURRENCY_FROM" => array(
			"NAME" => GetMessage("CURRENCY_FROM"),
			"TYPE" => "LIST",
			"MULTIPLE" => "Y",
			"ADDITIONAL_VALUES" => "N",
			"VALUES" => $arCurrency,
			"GROUP" => "BASE",
		),
		"CURRENCY_BASE" => array(
			"NAME" => GetMessage("CURRENCY_BASE"),
			"TYPE" => "LIST",
			"MULTIPLE" => "N",
			"ADDITIONAL_VALUES" => "N",
			"VALUES" => $arCurrency,
			"GROUP" => "BASE",
		),
		"RATE_DAY" => array(
			"NAME" => GetMessage("CURRENCY_RATE_DAY"),
			"TYPE" => "STRING",
			"GROUP" => "ADDITIONAL_PARAMETERS",
			),
		"SHOW_CB" => array(
			"NAME" => GetMessage("T_CURRENCY_CBRF"),
			"TYPE" => "CHECKBOX",
			"MULTIPLE" => "N",
			"DEFAULT" => "N",
			"ADDITIONAL_VALUES" => "N",
			"GROUP" => "ADDITIONAL_PARAMETERS",
		),
		"CACHE_TIME" => array("DEFAULT" => "86400"),
	),
);
?>