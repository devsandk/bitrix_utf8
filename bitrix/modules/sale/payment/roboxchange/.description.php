<?if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true) die();?><?
include(GetLangFileName(dirname(__FILE__)."/", "/payment.php"));

$psTitle = GetMessage("SPCP_DTITLE");
$psDescription = GetMessage("SPCP_DDESCR");

$arPSCorrespondence = array(
		"ShopLogin" => array(
				"NAME" => GetMessage("ShopLogin"),
				"DESCR" => GetMessage("ShopLogin_DESCR"),
				"VALUE" => "",
				"TYPE" => ""
			),
		"ShopPassword" => array(
				"NAME" => GetMessage("ShopPassword"),
				"DESCR" => GetMessage("ShopPassword_DESCR"),
				"VALUE" => "",
				"TYPE" => ""
			),
		"ShopPassword2" => array(
				"NAME" => GetMessage("ShopPassword2"),
				"DESCR" => GetMessage("ShopPassword_DESCR2"),
				"VALUE" => "",
				"TYPE" => ""
			),
		"OrderDescr" => array(
				"NAME" => GetMessage("OrderDescr"),
				"DESCR" => GetMessage("OrderDescr_DESCR"),
				"VALUE" => "",
				"TYPE" => ""
			),
		"SHOULD_PAY" => array(
				"NAME" => GetMessage("SHOULD_PAY"),
				"DESCR" => GetMessage("SHOULD_PAY_DESCR"),
				"VALUE" => "",
				"TYPE" => ""
			),
		"CURRENCY" => array(
				"NAME" => GetMessage("CURRENCY"),
				"DESCR" => GetMessage("CURRENCY_DESCR"),
				"VALUE" => "",
				"TYPE" => ""
			),
		"DATE_INSERT" => array(
				"NAME" => GetMessage("DATE_INSERT"),
				"DESCR" => GetMessage("DATE_INSERT_DESCR"),
				"VALUE" => "",
				"TYPE" => ""
			),
		"EMAIL_USER" => array(
				"NAME" => GetMessage("EMAIL_USER"),
				"DESCR" => GetMessage("EMAIL_USER_DESCR"),
				"VALUE" => "EMAIL",
				"TYPE" => "PROPERTY"
			),
		"PAYMENT_VALUE" => array(
				"NAME" => GetMessage("SALE_TYPE_PAYMENT"),
				"DESCR" => '',
				"TYPE" => "SELECT",
				"VALUE" => array(
					"0" => array(
						"NAME" => GetMessage("SALE_ALL_Terminals"),
					),
					"Qiwi29OceanR" => array(
						"NAME" => GetMessage("SALE_QiwiR_Terminals"),
					),
					"WMRM" => array(
							"NAME" => GetMessage("SALE_WMRM_EMoney"),
						),
					"YandexMerchantOceanR" => array(
							"NAME" => GetMessage("SALE_YandexMerchantR_EMoney"),
						),
					"AlfaBankOceanR" => array(
							"NAME" => GetMessage("SALE_AlfaBankOceanR_Bank"),
						),
					"VTB24R" => array(
							"NAME" => GetMessage("SALE_VTB24R_Bank"),
						),
					"BANKOCEAN2R" => array(
							"NAME" => GetMessage("SALE_OceanBankOceanR_Bank"),
						),
					"MegafonR" => array(
							"NAME" => GetMessage("SALE_MegafonR_Mobile"),
						),
					"MtsR" => array(
							"NAME" => GetMessage("SALE_MtsR_Mobile"),
						),
					"RapidaOceanEurosetR" => array(
							"NAME" => GetMessage("SALE_RapidaOceanEurosetR_Other"),
						),
					"RapidaOceanSvyaznoyR" => array(
							"NAME" => GetMessage("SALE_RapidaOceanSvyaznoyR_Other"),
						)
			),
		),
		"CHANGE_STATUS_PAY" => array(
				"NAME" => GetMessage("PYM_CHANGE_STATUS_PAY"),
				"DESCR" => GetMessage("PYM_CHANGE_STATUS_PAY_DESC"),
				"VALUE" => "Y",
				"TYPE" => ""
			),
		"IS_TEST" => array(
				"NAME" => GetMessage("PYM_TEST"),
				"DESCR" => GetMessage("PYM_TEST_DESC"),
				"VALUE" => "Y",
				"TYPE" => ""
			),
	);
?>
