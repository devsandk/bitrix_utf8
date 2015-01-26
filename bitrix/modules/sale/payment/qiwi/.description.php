<?if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true) die();?><?

use \Bitrix\Main\Localization\Loc;
use Bitrix\Main\Application;

Loc::loadMessages(__FILE__);

$host = Application::getInstance()->getContext()->getServer()->getHttpHost();

$psTitle 		= Loc::getMessage("SALE_QH_TITLE");
$psDescription 	= Loc::getMessage("SALE_QH_DESCRIPTION");

$arPSCorrespondence = array(
	"SHOP_ID" => array(
		"NAME" => Loc::getMessage("SALE_QH_SHOP_ID"),
		"DESCR" => Loc::getMessage("SALE_QH_SHOP_ID_DESCR"),
		"VALUE" => "",
		"TYPE" => "",
		
	),
	"API_LOGIN" => array(
		"NAME" => Loc::getMessage("SALE_QH_API_LOGIN"),
		"DESCR" => Loc::getMessage("SALE_QH_API_LOGIN_DESCR"),
		"VALUE" => "",
		"TYPE" => "",
		
	),
	"API_PASSWORD" => array(
		"NAME" => Loc::getMessage("SALE_QH_API_PASS"),
		"DESCR" => Loc::getMessage("SALE_QH_API_PASS_DESCR"),
		"VALUE" => "",
		"TYPE" => "",
		
	),
	"NOTICE_PASSWORD" => array(
		"NAME" => Loc::getMessage("SALE_QH_NOTICE_PASSWORD"),
		"DESCR" => Loc::getMessage("SALE_QH_NOTICE_PASSWORD_DESCR"),
		"VALUE" => "",
		"TYPE" => "",
		
	),
	"CLIENT_PHONE" => array(
		"NAME" => Loc::getMessage("SALE_QH_CLIENT_PHONE"),
		"DESCR" => Loc::getMessage("SALE_QH_CLIENT_PHONE_DESCR"),
		"VALUE" => "PHONE",
		"TYPE" => "PROPERTY"
	),
	"ORDER_ID" => array(
		"NAME" => Loc::getMessage("SALE_QH_ORDER_ID"),
		"DESCR" => Loc::getMessage("SALE_QH_ORDER_ID_DESCR"),
		"VALUE" => "ID",
		"TYPE" => "ORDER"
	),
	"SHOULD_PAY" => array(
		"NAME" => Loc::getMessage("SALE_QH_SHOULD_PAY"),
		"DESCR" => Loc::getMessage("SALE_QH_SHOULD_PAY_DESCR"),
		"VALUE" => "SHOULD_PAY",
		"TYPE" => "ORDER"
	),
	"CURRENCY" => array(
		"NAME" => Loc::getMessage("SALE_QH_CURRENCY"),
		"DESCR" => Loc::getMessage("SALE_QH_CURRENCY_DESCR"),
		"VALUE" => "CURRENCY",
		"TYPE" => "ORDER"
	),
	"BILL_LIFETIME" => array(
		"NAME" => Loc::getMessage("SALE_QH_BILL_LIFETIME"),
		"DESCR" => Loc::getMessage("SALE_QH_BILL_LIFETIME_DESCR"),
		"VALUE" => "240",
		"TYPE" => ""
	),

	"AUTHORIZATION" => array(
		"NAME" => Loc::getMessage("SALE_QH_AUTHORIZATION"),
		"DESCR" => Loc::getMessage("SALE_QH_AUTHORIZATION_DESCR"),
		"TYPE" => "",
		'VALUE' => "OPEN",
	),

	"SUCCESS_URL" => array(
		"NAME" => Loc::getMessage("SALE_QH_SUCCESS_URL"),
		"DESCR" => Loc::getMessage("SALE_QH_SUCCESS_URL_DESCR"),
		"VALUE" => "http://{$host}/personal/order/",
		"TYPE" => ""
	),
	"FAIL_URL" => array(
		"NAME" => Loc::getMessage("SALE_QH_FAIL_URL"),
		"DESCR" => Loc::getMessage("SALE_QH_FAIL_URL_DESCR"),
		"VALUE" => "http://{$host}/personal/order/",
		"TYPE" => ""
	),
	"CHANGE_STATUS_PAY" => array(
		"NAME" => Loc::getMessage("SALE_QH_CHANGE_STATUS_PAY"),
		"DESCR" => Loc::getMessage("SALE_QH_CHANGE_STATUS_PAY_DESC"),
		"TYPE" => "",
		'VALUE' => 'Y'
	)
);
?>
