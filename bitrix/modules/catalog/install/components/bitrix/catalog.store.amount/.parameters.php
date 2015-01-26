<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true) die();

$arComponentParameters = array(
	'GROUPS' => array(
		'STORE' => array(
			'NAME' => GetMessage('CP_CSA_GROUP_STORE')
		)
	),
	'PARAMETERS' => array(
		'ELEMENT_ID' => array(
			'PARENT' => 'BASE',
			'NAME' => GetMessage('CP_CSA_PARAM_ELEMENT_ID'),
			'TYPE' => 'STRING',
			'DEFAULT' => ''
		),
		'STORE_PATH' => array(
			'PARENT' => 'URL_TEMPLATES',
			'NAME' => GetMessage('CP_CSA_PARAM_STORE_PATH'),
			'TYPE' => 'STRING',
			'DEFAULT' => ''
		),
		'USE_STORE_PHONE' => array(
			'PARENT' => 'STORE',
			'NAME' => GetMessage('CP_CSA_PARAM_USE_STORE_PHONE'),
			'TYPE' => 'CHECKBOX',
			'DEFAULT' => 'N'
		),
		'SCHEDULE' => array(
			'PARENT' => 'STORE',
			'NAME' => GetMessage('CP_CSA_PARAM_SCHEDULE'),
			'TYPE' => 'CHECKBOX',
			'DEFAULT' => 'N',
		),
		'USE_MIN_AMOUNT' => array(
			'PARENT' => 'STORE',
			'NAME' => GetMessage('CP_CSA_PARAM_USE_MIN_AMOUNT'),
			'TYPE' => 'CHECKBOX',
			'DEFAULT' => 'Y',
			'REFRESH' => 'Y'
		),
		'MAIN_TITLE' => array(
			'NAME' => GetMessage('CP_CSA_PARAM_MAIN_TITLE'),
			'TYPE' => 'STRING',
			'DEFAULT' => ''
		),
		'CACHE_TIME'  =>  array('DEFAULT' => 36000),
	)
);

if (!isset($arCurrentValues['USE_MIN_AMOUNT']) || $arCurrentValues['USE_MIN_AMOUNT'] == 'Y')
{
	$arComponentParameters['PARAMETERS']['MIN_AMOUNT'] = array(
		'PARENT' => 'STORE',
		'NAME' => GetMessage('CP_CSA_PARAM_MIN_AMOUNT'),
		'TYPE' => 'STRING',
		'DEFAULT' => '0',
	);
}