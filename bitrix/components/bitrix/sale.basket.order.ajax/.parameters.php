<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

$arYesNo = Array(
	"Y" => GetMessage("SBB_DESC_YES"),
	"N" => GetMessage("SBB_DESC_NO"),
);

$arComponentParameters = Array(
	"PARAMETERS" => Array(
		"HIDE_COUPON" => Array(
			"NAME"=>GetMessage("SBB_HIDE_COUPON"),
			"TYPE"=>"LIST", "MULTIPLE"=>"N",
			"VALUES"=>array(
					"N" => GetMessage("SBB_DESC_NO"),
					"Y" => GetMessage("SBB_DESC_YES")
				),
			"DEFAULT"=>"N",
			"COLS"=>25,
			"ADDITIONAL_VALUES"=>"N",
			"PARENT" => "ADDITIONAL_SETTINGS",
		),
		"COLUMNS_LIST" => Array(
			"NAME"=>GetMessage("SBB_COLUMNS_LIST"),
			"TYPE"=>"LIST",
			"MULTIPLE"=>"Y",
			"VALUES"=>array(
				"NAME" => GetMessage("SBB_BNAME"),
				"PROPS" => GetMessage("SBB_BPROPS"),
				"WEIGHT" => GetMessage("SBB_BWEIGHT"),
				"QUANTITY" => GetMessage("SBB_BQUANTITY"),
				"DISCOUNT" => GetMessage("SBB_BDISCOUNT"),
				"TYPE" => GetMessage("SBB_BTYPE"),
				"PRICE" => GetMessage("SBB_BPRICE"),
				"DELETE" => GetMessage("SBB_BDELETE"),
				"DELAY" => GetMessage("SBB_BDELAY"),
				),
				"DEFAULT"=>array("NAME", "QUANTITY", "DISCOUNT", "PRICE"),
				"COLS"=>25,
			"ADDITIONAL_VALUES"=>"N",
			"PARENT" => "VISUAL",
		),
		"PATH_TO_PERSONAL" => Array(
			"NAME" => GetMessage("SOA_PATH_TO_PERSONAL"),
			"TYPE" => "STRING",
			"MULTIPLE" => "N",
			"DEFAULT" => "index.php",
			"COLS" => 25,
			"PARENT" => "BASE",
		),
		"PATH_TO_PAYMENT" => Array(
			"NAME" => GetMessage("SOA_PATH_TO_PAYMENT"),
			"TYPE" => "STRING",
			"MULTIPLE" => "N",
			"DEFAULT" => "payment.php",
			"COLS" => 25,
			"PARENT" => "BASE",
		),
		"SEND_NEW_USER_NOTIFY" => Array(
			"NAME"=>GetMessage("SOA_SEND_NEW_USER_NOTIFY"),
			"TYPE" => "CHECKBOX",
			"DEFAULT"=>"Y",
			"PARENT" => "BASE",
		),
		"QUANTITY_FLOAT" => array(
			"NAME" => GetMessage('SBB_QUANTITY_FLOAT'),
			"TYPE" => "CHECKBOX",
			"MULTIPLE" => "N",
			"DEFAULT" => "N",
			"ADDITIONAL_VALUES"=>"N",
			"PARENT" => "ADDITIONAL_SETTINGS",
		),
		"PRICE_VAT_SHOW_VALUE" => array(
			"NAME" => GetMessage('SBB_VAT_SHOW_VALUE'),
			"TYPE" => "CHECKBOX",
			"MULTIPLE" => "N",
			"DEFAULT" => "N",
			"ADDITIONAL_VALUES"=>"N",
			"PARENT" => "ADDITIONAL_SETTINGS",
		),
		"PRICE_TAX_SHOW_VALUE" => array(
			"NAME" => GetMessage('SBB_TAX_SHOW_VALUE'),
			"TYPE" => "CHECKBOX",
			"MULTIPLE" => "N",
			"DEFAULT" => "Y",
			"ADDITIONAL_VALUES"=>"N",
			"PARENT" => "ADDITIONAL_SETTINGS",
		),
		"SHOW_BASKET_ORDER" => array(
			"NAME" => GetMessage('SBB_ORDER_SHOW'),
			"TYPE" => "CHECKBOX",
			"MULTIPLE" => "N",
			"DEFAULT" => "N",
			"ADDITIONAL_VALUES"=>"N",
			"PARENT" => "ADDITIONAL_SETTINGS",
		),
		"TEMPLATE_LOCATION" => Array(
			"NAME"=>GetMessage("SBB_TEMPLATE_LOCATION"),
			"TYPE"=>"LIST",
			"MULTIPLE"=>"N",
			"VALUES"=>array(
					".default" => GetMessage("SBB_TMP_DEFAULT"),
					"popup" => GetMessage("SBB_TMP_POPUP")
				),
			"DEFAULT"=>".default",
			"COLS"=>25,
			"ADDITIONAL_VALUES"=>"N",
			"PARENT" => "ADDITIONAL_SETTINGS",
		),



		"SET_TITLE" => Array(),

	)
);
?>