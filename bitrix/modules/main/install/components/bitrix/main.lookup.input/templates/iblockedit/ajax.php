<?
define("STOP_STATISTICS", true);
define("BX_SECURITY_SHOW_MESSAGE", true);

use Bitrix\Main\Localization\Loc as Loc;

if (isset($_REQUEST['admin']) && $_REQUEST['admin'] === 'Y')
	define('ADMIN_SECTION', true);
if (isset($_REQUEST['site']) && !empty($_REQUEST['site']))
{
	$strSite = substr((string)$_REQUEST['site'], 0, 2);
	define('SITE_ID', $strSite);
}

require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_before.php");
Loc::loadMessages(__FILE__);

global $APPLICATION;

if(!CModule::IncludeModule('iblock'))
{
	echo Loc::getMessage("BT_COMP_MLI_AJAX_ERR_MODULE_ABSENT");
	die();
}

CUtil::JSPostUnescape();

$IBlockID = intval($_REQUEST["IBLOCK_ID"]);
if(!CIBlockRights::UserHasRightTo($IBlockID, $IBlockID, "iblock_admin_display"))
{
	echo Loc::getMessage('BT_COMP_MLI_AJAX_ERR_IBLOCK_ACCESS_DENIED');
	die();
}

$arIBlock = CIBlock::GetArrayByID($IBlockID);

$strBanSym = trim($_REQUEST['BAN_SYM']);
$arBanSym = str_split($strBanSym,1);
$strRepSym = trim($_REQUEST['REP_SYM']);
$arRepSym = array_fill(0,sizeof($arBanSym),$strRepSym);

$bSection = false;
if (isset($_REQUEST['TYPE']) && 'SECTION' == $_REQUEST['TYPE'])
{
	$bSection = true;
}

if($_REQUEST['MODE'] == 'SEARCH')
{
	$APPLICATION->RestartBuffer();

	$arResult = array();
	$search = trim($_REQUEST['search']);

	$matches = array();
	if(preg_match('/^(.*?)\[([\d]+?)\]/i', $search, $matches))
	{
		$matches[2] = intval($matches[2]);
		if($matches[2] > 0)
		{
			if ($bSection)
			{
				$dbRes = CIBlockSection::GetList(
					array(),
					array(
						"=ID" => $matches[2],
						"IBLOCK_ID" => $arIBlock["ID"],
						"CHECK_PERMISSIONS" => "Y",
						"MIN_PERMISSION" => "R",
					),
					false,
					array("ID", "NAME")
				);
			}
			else
			{
				$dbRes = CIBlockElement::GetList(
					array(),
					array(
						"=ID" => $matches[2],
						"IBLOCK_ID" => $arIBlock["ID"],
						"CHECK_PERMISSIONS" => "Y",
						"MIN_PERMISSION" => "R",
					),
					false,
					false,
					array("ID", "NAME")
				);
			}
			if($arRes = $dbRes->Fetch())
			{
				$arResult[] = array(
					'ID' => $arRes['ID'],
					'NAME' => str_replace($arBanSym,$arRepSym,$arRes['NAME']),
					'READY' => 'Y',
				);

				Header('Content-Type: application/x-javascript; charset='.LANG_CHARSET);
				echo CUtil::PhpToJsObject($arResult);
				die();
			}
		}
		elseif(strlen($matches[1]) > 0)
		{
			$search = $matches[1];
		}
	}

	if ($bSection)
	{
		$dbRes = CIBlockSection::GetList(
			array(),
			array(
				"IBLOCK_ID" => $arIBlock["ID"],
				"%NAME" => $search,
				"CHECK_PERMISSIONS" => "Y",
				"MIN_PERMISSION" => "R",
			),
			false,
			array("ID", "NAME")
		);
		$i = 0;
		while($arRes = $dbRes->Fetch())
		{
			$arResult[] = array(
				'ID' => $arRes['ID'],
				'NAME' => str_replace($arBanSym,$arRepSym,$arRes['NAME']),
			);
			$i++;
			if (20 < $i)
				break;
		}
	}
	else
	{
		$dbRes = CIBlockElement::GetList(
			array(),
			array(
				"IBLOCK_ID" => $arIBlock["ID"],
				"%NAME" => $search,
				"CHECK_PERMISSIONS" => "Y",
				"MIN_PERMISSION" => "R",
			),
			false,
			array("nTopCount" => 20),
			array("ID", "NAME")
		);
		while($arRes = $dbRes->Fetch())
		{
			$arResult[] = array(
				'ID' => $arRes['ID'],
				'NAME' => str_replace($arBanSym,$arRepSym,$arRes['NAME']),
			);
		}
	}

	Header('Content-Type: application/x-javascript; charset='.LANG_CHARSET);
	echo CUtil::PhpToJsObject($arResult);
	die();
}