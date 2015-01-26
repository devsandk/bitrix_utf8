<?if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true) die();?><?
$langFile = GetLangFileName(dirname(__FILE__)."/", "/bill.php");

if(file_exists($langFile))
	include($langFile);


$psTitle = GetMessage("SBLP_DTITLE");
$psDescription = GetMessage("SBLP_DDESCR");

$isAffordPdf = true;

$arPSCorrespondence = array(
		"ORDER_ID" => array(
				"NAME" => GetMessage("SBLP_ORDER_ID"),
				"DESCR" => "",
				"VALUE" => "ID",
				"TYPE" => "ORDER"
			),
		"DATE_INSERT" => array(
				"NAME" => GetMessage("SBLP_DATE"),
				"DESCR" => GetMessage("SBLP_DATE_DESC"),
				"VALUE" => "DATE_INSERT_DATE",
				"TYPE" => "ORDER"
			),
		"DATE_PAY_BEFORE" => array(
				"NAME" => GetMessage("SBLP_PAY_BEFORE"),
				"DESCR" => GetMessage("SBLP_PAY_BEFORE_DESC"),
				"VALUE" => "DATE_PAY_BEFORE",
				"TYPE" => "ORDER"
			),
		"SELLER_NAME" => array(
				"NAME" => GetMessage("SBLP_SUPPLI"),
				"DESCR" => GetMessage("SBLP_SUPPLI_DESC"),
				"VALUE" => "",
				"TYPE" => ""
			),
		"SELLER_RS" => array(
				"NAME" => GetMessage("SBLP_ORDER_SUPPLI"),
				"DESCR" => GetMessage("SBLP_ORDER_SUPPLI_DESC"),
				"VALUE" => "",
				"TYPE" => ""
			),
		"SELLER_BANK" => array(
				"NAME" => GetMessage("SBLP_ORDER_BANK"),
				"DESCR" => "",
				"VALUE" => "",
				"TYPE" => ""
			),
		"SELLER_MFO" => array(
				"NAME" => GetMessage("SBLP_ORDER_MFO"),
				"DESCR" => "",
				"VALUE" => "",
				"TYPE" => ""
			),
		"SELLER_ADDRESS" => array(
				"NAME" => GetMessage("SBLP_ADRESS_SUPPLI"),
				"DESCR" => GetMessage("SBLP_ADRESS_SUPPLI_DESC"),
				"VALUE" => "",
				"TYPE" => ""
			),
		"SELLER_PHONE" => array(
				"NAME" => GetMessage("SBLP_PHONE_SUPPLI"),
				"DESCR" => GetMessage("SBLP_PHONE_SUPPLI_DESC"),
				"VALUE" => "",
				"TYPE" => ""
			),
		"SELLER_EDRPOY" => array(
				"NAME" => GetMessage("SBLP_EDRPOY_SUPPLI"),
				"DESCR" => GetMessage("SBLP_EDRPOY_SUPPLI_DESC"),
				"VALUE" => "",
				"TYPE" => ""
			),
		"SELLER_IPN" => array(
				"NAME" => GetMessage("SBLP_IPN_SUPPLI"),
				"DESCR" => GetMessage("SBLP_IPN_SUPPLI_DESC"),
				"VALUE" => "",
				"TYPE" => ""
			),
		"SELLER_PDV" => array(
				"NAME" => GetMessage("SBLP_PDV_SUPPLI"),
				"DESCR" => GetMessage("SBLP_PDV_SUPPLI_DESC"),
				"VALUE" => "",
				"TYPE" => ""
			),
		"SELLER_SYS" => array(
				"NAME" => GetMessage("SBLP_SYS_SUPPLI"),
				"DESCR" => GetMessage("SBLP_SYS_SUPPLI_DESC"),
				"VALUE" => "",
				"TYPE" => ""
			),
		"SELLER_ACC" => array(
				"NAME" => GetMessage("SBLP_ACC_SUPPLI"),
				"DESCR" => "",
				"VALUE" => "",
				"TYPE" => ""
			),
		"SELLER_ACC_POS" => array(
				"NAME" => GetMessage("SBLP_ACC_POS_SUPPLI"),
				"DESCR" => "",
				"VALUE" => "",
				"TYPE" => ""
			),

		"BUYER_NAME" => array(
				"NAME" => GetMessage("SBLP_CUSTOMER"),
				"DESCR" => GetMessage("SBLP_CUSTOMER_DESC"),
				"VALUE" => "COMPANY_NAME",
				"TYPE" => "PROPERTY"
			),
		"BUYER_ADDRESS" => array(
				"NAME" => GetMessage("SBLP_CUSTOMER_ADRES"),
				"DESCR" => GetMessage("SBLP_CUSTOMER_ADRES_DESC"),
				"VALUE" => "ADDRESS",
				"TYPE" => "PROPERTY"
			),
		"BUYER_FAX" => array(
				"NAME" => GetMessage("SBLP_CUSTOMER_FAX"),
				"DESCR" => GetMessage("SBLP_CUSTOMER_FAX_DESC"),
				"VALUE" => "",
				"TYPE" => ""
			),

		"BUYER_PHONE" => array(
				"NAME" => GetMessage("SBLP_CUSTOMER_PHONE"),
				"DESCR" => GetMessage("SBLP_CUSTOMER_PHONE_DESC"),
				"VALUE" => "PHONE",
				"TYPE" => "PROPERTY"
			),
		"BUYER_DOGOVOR" => array(
				"NAME" => GetMessage("SBLP_CUSTOMER_DOGOVOR"),
				"DESCR" => GetMessage("SBLP_CUSTOMER_DOGOVOR"),
				"VALUE" => "",
				"TYPE" => ""
			),
		"PATH_TO_STAMP" => array(
				"NAME" => GetMessage("SBLP_PRINT"),
				"DESCR" => GetMessage("SBLP_PRINT_DESC"),
				"VALUE" => "",
				"TYPE" => "FILE"
			),
		"SELLER_ACC_SIGN" => array(
				"NAME" => GetMessage("SBLP_ACC_SIGN_SUPPLI"),
				"DESCR" => "",
				"VALUE" => "",
				"TYPE" => "FILE"
			),
		"BACKGROUND" => array(
				"NAME" => GetMessage("SBLP_BACKGROUND"),
				"DESCR" => GetMessage("SBLP_BACKGROUND_DESC"),
				"VALUE" => "",
				"TYPE" => "FILE"
			),
		"BACKGROUND_STYLE" => array(
				"NAME" => GetMessage("SBLP_BACKGROUND_STYLE"),
				"DESCR" => "",
				"VALUE" => array(
					'none' => array('NAME' => GetMessage("SBLP_BACKGROUND_STYLE_NONE")),
					'tile' => array('NAME' => GetMessage("SBLP_BACKGROUND_STYLE_TILE")),
					'stretch' => array('NAME' => GetMessage("SBLP_BACKGROUND_STYLE_STRETCH"))
				),
				"TYPE" => "SELECT"
			),
		"MARGIN_TOP" => array(
				"NAME" => GetMessage("SBLP_MARGIN_TOP"),
				"DESCR" => "",
				"VALUE" => "15",
				"TYPE" => ""
			),
		"MARGIN_RIGHT" => array(
				"NAME" => GetMessage("SBLP_MARGIN_RIGHT"),
				"DESCR" => "",
				"VALUE" => "15",
				"TYPE" => ""
			),
		"MARGIN_BOTTOM" => array(
				"NAME" => GetMessage("SBLP_MARGIN_BOTTOM"),
				"DESCR" => "",
				"VALUE" => "15",
				"TYPE" => ""
			),
		"MARGIN_LEFT" => array(
				"NAME" => GetMessage("SBLP_MARGIN_LEFT"),
				"DESCR" => "",
				"VALUE" => "20",
				"TYPE" => ""
			)
	);
?>