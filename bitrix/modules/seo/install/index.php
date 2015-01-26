<?php
IncludeModuleLangFile(__FILE__);

if(class_exists("seo")) return;

class seo extends CModule
{
	var $MODULE_ID = "seo";
	var $MODULE_VERSION;
	var $MODULE_VERSION_DATE;
	var $MODULE_NAME;
	var $MODULE_DESCRIPTION;
	var $MODULE_GROUP_RIGHTS = "Y";

	function seo()
	{
		$arModuleVersion = array();

		$path = str_replace("\\", "/", __FILE__);
		$path = substr($path, 0, strlen($path) - strlen("/index.php"));
		include($path."/version.php");

		if (is_array($arModuleVersion) && array_key_exists("VERSION", $arModuleVersion))
		{
			$this->MODULE_VERSION = $arModuleVersion["VERSION"];
			$this->MODULE_VERSION_DATE = $arModuleVersion["VERSION_DATE"];
		}
		else
		{
			$this->MODULE_VERSION = SEO_VERSION;
			$this->MODULE_VERSION_DATE = SEO_VERSION_DATE;
		}

		$this->MODULE_NAME = GetMessage("SEO_MODULE_NAME");
		$this->MODULE_DESCRIPTION = GetMessage("SEO_MODULE_DESCRIPTION");
	}

	function DoInstall()
	{
		$this->InstallFiles();
		$this->InstallDB();
		$GLOBALS['APPLICATION']->IncludeAdminFile(GetMessage("SEO_INSTALL_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/seo/install/step1.php");
	}

	function InstallDB()
	{
		global $DB, $APPLICATION;

		$this->errors = false;
		if(!$DB->Query("SELECT 'x' FROM b_seo_search_engine", true))
			$this->errors = $DB->RunSQLBatch($_SERVER['DOCUMENT_ROOT']."/bitrix/modules/seo/install/db/".strtolower($DB->type)."/install.sql");

		if($this->errors !== false)
		{
			$APPLICATION->ThrowException(implode("", $this->errors));
			return false;
		}

		RegisterModule("seo");

		require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/seo/install/tasks/install.php");

		$eventManager = \Bitrix\Main\EventManager::getInstance();

		$eventManager->registerEventHandler('main', 'OnPanelCreate', 'seo', 'CSeoEventHandlers', 'SeoOnPanelCreate');

		if (COption::GetOptionString('main', 'vendor', '') == '1c_bitrix')
		{
			$eventManager->registerEventHandler("fileman", "OnIncludeHTMLEditorScript", "seo", "CSeoEventHandlers", "OnIncludeHTMLEditorScript");
			$eventManager->registerEventHandler("fileman", "OnBeforeHTMLEditorScriptRuns", "seo", "CSeoEventHandlers", "OnBeforeHTMLEditorScriptRuns");
		}

		$eventManager->registerEventHandler("iblock", "OnAfterIBlockSectionAdd", "seo", "\Bitrix\Seo\SitemapIblock", "addSection");
		$eventManager->registerEventHandler("iblock", "OnAfterIBlockElementAdd", "seo", "\Bitrix\Seo\SitemapIblock", "addElement");

		$eventManager->registerEventHandler("iblock", "OnBeforeIBlockSectionDelete", "seo", "\Bitrix\Seo\SitemapIblock", "beforeDeleteSection");
		$eventManager->registerEventHandler("iblock", "OnBeforeIBlockElementDelete", "seo", "\Bitrix\Seo\SitemapIblock", "beforeDeleteElement");
		$eventManager->registerEventHandler("iblock", "OnAfterIBlockSectionDelete", "seo", "\Bitrix\Seo\SitemapIblock", "deleteSection");
		$eventManager->registerEventHandler("iblock", "OnAfterIBlockElementDelete", "seo", "\Bitrix\Seo\SitemapIblock", "deleteElement");

		$eventManager->registerEventHandler("iblock", "OnBeforeIBlockSectionUpdate", "seo", "\Bitrix\Seo\SitemapIblock", "beforeUpdateSection");
		$eventManager->registerEventHandler("iblock", "OnBeforeIBlockElementUpdate", "seo", "\Bitrix\Seo\SitemapIblock", "beforeUpdateElement");
		$eventManager->registerEventHandler("iblock", "OnAfterIBlockSectionUpdate", "seo", "\Bitrix\Seo\SitemapIblock", "updateSection");
		$eventManager->registerEventHandler("iblock", "OnAfterIBlockElementUpdate", "seo", "\Bitrix\Seo\SitemapIblock", "updateElement");

		$eventManager->registerEventHandler("forum", "onAfterTopicAdd", "seo", "\Bitrix\Seo\SitemapForum", "addTopic");
		$eventManager->registerEventHandler("forum", "onAfterTopicUpdate", "seo", "\Bitrix\Seo\SitemapForum", "updateTopic");
		$eventManager->registerEventHandler("forum", "onAfterTopicDelete", "seo", "\Bitrix\Seo\SitemapForum", "deleteTopic");

		if (COption::GetOptionString('seo', 'searchers_list', '') == '' && CModule::IncludeModule('statistic'))
		{
			$arFilter = array('ACTIVE' => 'Y', 'NAME' => 'Google|MSN|Bing', 'NAME_EXACT_MATCH' => 'Y');
			if (COption::GetOptionString('main', 'vendor') == '1c_bitrix')
				$arFilter['NAME'] .= '|Yandex';

			$strSearchers = '';
			$is_filtered = false;
			$dbRes = CSearcher::GetList($by = 's_id', $order = 'asc', $arFilter, $is_filtered);
			while ($arRes = $dbRes->Fetch())
			{
				$strSearchers .= ($strSearchers == '' ? '' : ',').$arRes['ID'];
			}

			COption::SetOptionString('seo', 'searchers_list', $strSearchers);
		}

		return true;
	}

	function InstallFiles()
	{
		if($_ENV["COMPUTERNAME"]!='BX')
		{
			CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/seo/install/admin", $_SERVER["DOCUMENT_ROOT"]."/bitrix/admin", true, true);
			CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/seo/install/tools", $_SERVER["DOCUMENT_ROOT"]."/bitrix/tools", true, true);
			CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/seo/install/panel", $_SERVER["DOCUMENT_ROOT"]."/bitrix/panel", true, true);
			CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/seo/install/js", $_SERVER["DOCUMENT_ROOT"]."/bitrix/js", true, true);
			CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/seo/install/images", $_SERVER["DOCUMENT_ROOT"]."/bitrix/images", true, true);
		}
		return true;
	}

	function InstallEvents()
	{
		return true;
	}

	function DoUninstall()
	{
		global $DOCUMENT_ROOT, $APPLICATION, $step;
		$step = IntVal($step);
		if($step<2)
		{
			$APPLICATION->IncludeAdminFile(GetMessage("SEO_UNINSTALL_TITLE"), $DOCUMENT_ROOT."/bitrix/modules/seo/install/unstep1.php");
		}
		elseif($step==2)
		{
			$this->UnInstallDB(array(
				"savedata" => $_REQUEST["savedata"],
			));
			$this->UnInstallFiles();
			$APPLICATION->IncludeAdminFile(GetMessage("SEO_UNINSTALL_TITLE"), $DOCUMENT_ROOT."/bitrix/modules/seo/install/unstep2.php");
		}
	}

	function UnInstallDB($arParams = Array())
	{
		global $APPLICATION, $DB, $errors;

		$this->errors = false;

		if (!$arParams['savedata'])
		{
			$this->errors = $DB->RunSQLBatch($_SERVER['DOCUMENT_ROOT']."/bitrix/modules/seo/install/db/".strtolower($DB->type)."/uninstall.sql");
		}

		if(!empty($this->errors))
		{
			$APPLICATION->ThrowException(implode("", $this->errors));
			return false;
		}

		require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/seo/install/tasks/uninstall.php");

		$eventManager = \Bitrix\Main\EventManager::getInstance();
		$eventManager->unRegisterEventHandler('main', 'OnPanelCreate', 'seo');
		$eventManager->unRegisterEventHandler("fileman", "OnIncludeHTMLEditorScript", "seo");
		$eventManager->unRegisterEventHandler("fileman", "OnBeforeHTMLEditorScriptRuns", "seo", "CSeoEventHandlers", "OnBeforeHTMLEditorScriptRuns");

		$eventManager->unRegisterEventHandler("iblock", "OnAfterIBlockSectionAdd", "seo", "\Bitrix\Seo\SitemapIblock", "addSection");
		$eventManager->unRegisterEventHandler("iblock", "OnAfterIBlockElementAdd", "seo", "\Bitrix\Seo\SitemapIblock", "addElement");

		$eventManager->unRegisterEventHandler("iblock", "OnBeforeIBlockSectionDelete", "seo", "\Bitrix\Seo\SitemapIblock", "beforeDeleteSection");
		$eventManager->unRegisterEventHandler("iblock", "OnBeforeIBlockElementDelete", "seo", "\Bitrix\Seo\SitemapIblock", "beforeDeleteElement");
		$eventManager->unRegisterEventHandler("iblock", "OnAfterIBlockSectionDelete", "seo", "\Bitrix\Seo\SitemapIblock", "deleteSection");
		$eventManager->unRegisterEventHandler("iblock", "OnAfterIBlockElementDelete", "seo", "\Bitrix\Seo\SitemapIblock", "deleteElement");

		$eventManager->unRegisterEventHandler("iblock", "OnBeforeIBlockSectionUpdate", "seo", "\Bitrix\Seo\SitemapIblock", "beforeUpdateSection");
		$eventManager->unRegisterEventHandler("iblock", "OnBeforeIBlockElementUpdate", "seo", "\Bitrix\Seo\SitemapIblock", "beforeUpdateElement");
		$eventManager->unRegisterEventHandler("iblock", "OnAfterIBlockSectionUpdate", "seo", "\Bitrix\Seo\SitemapIblock", "updateSection");
		$eventManager->unRegisterEventHandler("iblock", "OnAfterIBlockElementUpdate", "seo", "\Bitrix\Seo\SitemapIblock", "updateElement");

		$eventManager->unRegisterEventHandler("forum", "onAfterTopicAdd", "seo", "\Bitrix\Seo\SitemapForum", "addTopic");
		$eventManager->unRegisterEventHandler("forum", "onAfterTopicUpdate", "seo", "\Bitrix\Seo\SitemapForum", "updateTopic");
		$eventManager->unRegisterEventHandler("forum", "onAfterTopicDelete", "seo", "\Bitrix\Seo\SitemapForum", "deleteTopic");

		UnRegisterModule("seo");

		return true;
	}

	function UnInstallFiles($arParams = array())
	{
		global $DB;

		// Delete files
		DeleteDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/seo/install/admin/", $_SERVER["DOCUMENT_ROOT"]."/bitrix/admin");
		DeleteDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/seo/install/tools/", $_SERVER["DOCUMENT_ROOT"]."/bitrix/tools");
		DeleteDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/seo/install/images/seo", $_SERVER["DOCUMENT_ROOT"]."/bitrix/images/seo");

		return true;
	}

	function UnInstallEvents()
	{
		return true;
	}

	function GetModuleRightList()
	{
		global $MESS;
		$arr = array(
			"reference_id" => array("D","R","W"),
			"reference" => array(
				"[D] ".GetMessage("SEO_DENIED"),
				"[R] ".GetMessage("SEO_OPENED"),
				"[W] ".GetMessage("SEO_FULL"))
			);
		return $arr;
	}
}
