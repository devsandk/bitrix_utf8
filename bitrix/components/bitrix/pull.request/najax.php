<?
if (!defined('PULL_AJAX_INIT'))
{
	define("PULL_AJAX_INIT", true);
	define("PUBLIC_AJAX_MODE", true);
	define("NO_KEEP_STATISTIC", "Y");
	define("NO_AGENT_STATISTIC","Y");
	define("NO_AGENT_CHECK", true);
	define("NOT_CHECK_PERMISSIONS", true);
	define("DisableEventsCheck", true);
	require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_before.php");
}
header('Content-Type: application/x-javascript; charset='.LANG_CHARSET);

// NOTICE
// Before execute next code, execute file /module/pull/ajax_hit.php
// for skip onProlog events

if (!CModule::IncludeModule("pull"))
{
	echo CUtil::PhpToJsObject(Array('ERROR' => 'PULL_MODULE_IS_NOT_INSTALLED'));
	require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_after.php");
	die();
}
if (intval($USER->GetID()) <= 0)
{
	echo CUtil::PhpToJsObject(Array('ERROR' => 'AUTHORIZE_ERROR'));
	require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_after.php");
	die();
}
if (check_bitrix_sessid())
{
	if ($_POST['PULL_GET_CHANNEL'] == 'Y')
	{
		// need request from
		if (CModule::IncludeModule('socialservices'))
		{
			$oAuth = CBitrix24NetTransport::init();
			if($oAuth)
			{
				$arChannel = $oAuth->getProfileChannel(array(
					'CACHE' => $_POST['CACHE'],
					'PROTO' => CMain::IsHTTPS() ? 'Y' : 'N',
					'PULL_REVISION' => PULL_REVISION,
				));

				if($arChannel['result'])
				{
					echo CUtil::PhpToJsObject($arChannel['result']);
				}
				else
				{
					echo CUtil::PhpToJsObject(array('ERROR' => $arChannel['error']));
				}
			}
			else
			{
				echo CUtil::PhpToJsObject(array('ERROR' => 'SOCSERV_AUTHORIZE_ERROR'));
			}
		}
		else
		{
			echo CUtil::PhpToJsObject(array('ERROR' => 'SOCSERV_AUTHORIZE_ERROR'));
		}
	}
	elseif ($_POST['PULL_UPDATE_WATCH'] == 'Y')
	{
		foreach ($_POST['WATCH'] as $tag)
			CPullWatch::Extend($USER->GetID(), $tag);

		echo CUtil::PhpToJsObject(Array('ERROR' => ''));
	}
	elseif ($_POST['PULL_UPDATE_STATE'] == 'Y')
	{
		$arMessage = CPullStack::Get($_POST['CHANNEL_ID'], intval($_POST['CHANNEL_LAST_ID']));

		$arResult["COUNTERS"] = CUserCounter::GetAllValues($USER->GetID());
		if (!empty($arResult["COUNTERS"]))
		{
			$arMessage[] = Array(
				'module_id' => 'main',
				'command' => 'user_counter',
				'params' => $arResult["COUNTERS"]
			);
		}
		echo CUtil::PhpToJsObject(Array('MESSAGE' => $arMessage, 'ERROR' => ''));
	}
	else
	{
		echo CUtil::PhpToJsObject(Array('ERROR' => 'UNKNOWN_ERROR'));
	}
}
else
{
	echo CUtil::PhpToJsObject(Array(
		'BITRIX_SESSID' => bitrix_sessid(),
		'ERROR' => 'SESSION_ERROR'
	));
}
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_after.php");
?>