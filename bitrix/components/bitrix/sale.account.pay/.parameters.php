<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

$arCurrency = Array();
$arAmount = Array();
$arAvAmount = unserialize(COption::GetOptionString("sale", "pay_amount", 'a:4:{i:1;a:2:{s:6:"AMOUNT";s:2:"10";s:8:"CURRENCY";s:3:"EUR";}i:2;a:2:{s:6:"AMOUNT";s:2:"20";s:8:"CURRENCY";s:3:"EUR";}i:3;a:2:{s:6:"AMOUNT";s:2:"30";s:8:"CURRENCY";s:3:"EUR";}i:4;a:2:{s:6:"AMOUNT";s:2:"40";s:8:"CURRENCY";s:3:"EUR";}}'));
if (CModule::IncludeModule("sale"))
{
	if(!empty($arAvAmount))
	{
		foreach($arAvAmount as $key => $val)
		{
			$arAmount[$key] = SaleFormatCurrency($val["AMOUNT"], $val["CURRENCY"]);
		}
	}
}

if (CModule::IncludeModule("currency"))
{
	$rsCurrency = CCurrency::GetList(($by="SORT"), ($order="ASC"));
	while($arr=$rsCurrency->Fetch()) 
		$arCurrency[$arr["CURRENCY"]] = "[".$arr["CURRENCY"]."] ".$arr["FULL_NAME"];
}

$arComponentParameters = Array(
	"PARAMETERS" => Array(
		"PATH_TO_BASKET" => Array(
			"NAME" => GetMessage("SAPP_PATH_TO_BASKET"),
			"TYPE" => "STRING",
			"MULTIPLE" => "N",
			"DEFAULT" => "/personal/basket.php",
			"COLS" => 25,
		),
		"REDIRECT_TO_CURRENT_PAGE" => Array(
			"NAME" => GetMessage("SAPP_REDIRECT_TO_CURRENT_PAGE"),
			"TYPE" => "CHECKBOX",
			"MULTIPLE" => "N",
			"DEFAULT" => "N",
		),
		"SELL_AMOUNT" => Array(
			"NAME"=>GetMessage("SAPP_SELL_AMOUNT"),
			"TYPE"=>"LIST",
			"MULTIPLE"=>"Y",
			"VALUES" => $arAmount,
			"COLS"=>25,
			"ADDITIONAL_VALUES"=>"N",
		),		
		
		"SELL_CURRENCY" => Array(
			"NAME"=>GetMessage("SAPP_SELL_CURRENCY"),
			"TYPE"=>"LIST",
			"MULTIPLE"=>"N",
			"VALUES" => $arCurrency,
			"COLS"=>25,
			"ADDITIONAL_VALUES"=>"N",
		),
		
		"VAR" => Array(
			"NAME" => GetMessage("SAPP_VAR"),
			"TYPE" => "STRING",
			"MULTIPLE" => "N",
			"DEFAULT" => "buyMoney",
			"COLS" => 25,
		),
		
		"CALLBACK_NAME" => Array(
			"NAME" => GetMessage("SAPP_CALLBACK_NAME"),
			"TYPE" => "STRING",
			"MULTIPLE" => "N",
			"DEFAULT" => "PayUserAccountDeliveryOrderCallback",
			"COLS" => 25,
		),
		
		"SET_TITLE" => Array(),
	)
);
?>