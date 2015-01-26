<?if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true) die();?><?
include(GetLangFileName(dirname(__FILE__)."/", "/.description.php"));
$psTitle = "PayPal";
$psDescription = GetMessage("PPL_NAME");

$arPSCorrespondence = array(
		"USER"  => Array(
				"NAME" => GetMessage("PPL_USER"),
				"DESCR" => GetMessage("PPL_USER_DESCR"),
				"VALUE" => "",
				"TYPE" => "",
			),
		"PWD"  => Array(
				"NAME" => GetMessage("PPL_PWD"),
				"DESCR" => GetMessage("PPL_PWD_DESCR"),
				"VALUE" => "",
				"TYPE" => "",
			),
		"SIGNATURE"  => Array(
				"NAME" => GetMessage("PPL_SIGNATURE"),
				"DESCR" => GetMessage("PPL_SIGNATURE_DESCR"),
				"VALUE" => "",
				"TYPE" => "",
			),

		"ORDER_ID" => Array(
				"NAME" => GetMessage("PPL_ORDER_ID_NAME"),
				"VALUE" => "ID",
				"TYPE" => "ORDER",
			),
		"DATE_INSERT" => Array(
				"NAME" => GetMessage("PPL_DATE_INSERT_NAME"),
				"DESCR" => GetMessage("PPL_DATE_INSERT_DESCR"),
				"VALUE" => "DATE_INSERT",
				"TYPE" => "ORDER",
			),
		"SHOULD_PAY" => Array(
				"NAME" => GetMessage("PPL_SHOULD_PAY_NAME"),
				"DESCR" => GetMessage("PPL_SHOULD_PAY_DESCR"),
				"VALUE" => "SHOULD_PAY",
				"TYPE" => "ORDER",
			),
		"CURRENCY" => Array(
				"NAME" => GetMessage("PPL_CURRENCY_NAME"),
				"VALUE" => "CURRENCY",
				"TYPE" => "ORDER",
			),
		"NOTIFY_URL" => Array(
				"NAME" => GetMessage("PPL_NOTIFY_URL_NAME"),
				"DESCR" => GetMessage("PPL_NOTIFY_URL_DESCR"),
				"VALUE" => "https://".$_SERVER["HTTP_HOST"]."/bitrix/tools/sale_ps_paypal_result.php",
				"TYPE" => "",
			),
		"TEST" => array(
				"NAME" => GetMessage("PPL_TEST_NAME"),
				"DESCR" => GetMessage("PPL_TEST_DESCR"),
				"VALUE" => "",
				"TYPE" => ""
			),
		"SSL_ENABLE" => array(
				"NAME" => GetMessage("PPL_SSL_ENABLE_NAME"),
				"DESCR" => GetMessage("PPL_SSL_ENABLE_DESCR"),
				"VALUE" => "",
				"TYPE" => ""
			),
		"BUTTON_SRC"  => Array(
				"NAME" => GetMessage("PPL_BUTTON_SRC_NAME"),
				"VALUE" => GetMessage("PPL_BUTTON_SRC_NAME_VALUE"),
				"TYPE" => "",
			),
		"ON0"  => Array(
				"NAME" => GetMessage("PPL_ON0_NAME"),
				"DESCR" => GetMessage("PPL_ON0_DESCR"),
				"VALUE" => "",
				"TYPE" => "",
			),
		"ON1"  => Array(
				"NAME" => GetMessage("PPL_ON1_NAME"),
				"DESCR" => GetMessage("PPL_ON1_DESCR"),
				"VALUE" => "",
				"TYPE" => "",
			),
		/*
		"OS0"  => Array(
				"NAME" => GetMessage("PPL_OS0_NAME"),
				"DESCR" => GetMessage("PPL_OS0_DESCR"),
				"VALUE" => "",
				"TYPE" => "",
			),
		"OS1"  => Array(
				"NAME" => GetMessage("PPL_OS1_NAME"),
				"DESCR" => GetMessage("PPL_OS1_DESCR"),
				"VALUE" => "",
				"TYPE" => "",
			),
		*/
		"BUSINESS" => array(
				"NAME" => GetMessage("PPL_BUSINESS_NAME"),
				"DESCR" => GetMessage("PPL_BUSINESS_DESCR"),
				"VALUE" => "you@youremail.com",
				"TYPE" => ""
			),
		"IDENTITY_TOKEN" => array(
				"NAME" => GetMessage("PPL_IDENTITY_TOKEN_NAME"),
				"DESCR" => GetMessage("PPL_IDENTITY_TOKEN_DESCR"),
				"VALUE" => "",
				"TYPE" => ""
			),
		"RETURN" => Array(
				"NAME" => GetMessage("PPL_RETURN_NAME"),
				"DESCR" => GetMessage("PPL_RETURN_DESCR"),
				"VALUE" => "https://".$_SERVER["HTTP_HOST"]."/personal/payment/success.php",
				"TYPE" => "",
			),
	);
?>