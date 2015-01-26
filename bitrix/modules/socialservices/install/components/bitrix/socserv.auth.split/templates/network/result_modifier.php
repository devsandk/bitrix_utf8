<?
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
	die();

if(\Bitrix\Main\Loader::includeModule('socialservices'))
{
	$dbRes = \Bitrix\SocialServices\UserTable::getList(array(
		'filter' => array(
			'USER_ID' => $arParams['USER_ID'],
			'EXTERNAL_AUTH_ID' => CSocServBitrix24Net::ID
		),
		'select' => array(
			'NAME', 'LAST_NAME', 'LOGIN', 'PERSONAL_WWW'
		),
	));

	$arResult['NETWORK_ACCOUNT'] = $dbRes->fetch();
}
?>