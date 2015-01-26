<?
use Bitrix\Main\DB\SqlExpression;
use Bitrix\Main\Application;
use Bitrix\Main\Type\DateTime;
use Bitrix\Main\Config\Option;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Loader;
use Bitrix\Main\ModuleManager;

use Bitrix\Main\Localization\LanguageTable;
use Bitrix\Main\SiteTable;
use Bitrix\Currency\CurrencyTable;
use Bitrix\Currency\CurrencyLangTable;

Loc::loadMessages(__FILE__);

class currency extends CModule
{
	var $MODULE_ID = "currency";
	var $MODULE_VERSION;
	var $MODULE_VERSION_DATE;
	var $MODULE_NAME;
	var $MODULE_DESCRIPTION;
	var $MODULE_CSS;
	var $MODULE_GROUP_RIGHTS = "Y";
	var $errors = false;

	function currency()
	{
		$arModuleVersion = array();

		$path = str_replace("\\", "/", __FILE__);
		$path = substr($path, 0, strlen($path) - strlen("/index.php"));
		include($path."/version.php");

		if (is_array($arModuleVersion) && isset($arModuleVersion["VERSION"]))
		{
			$this->MODULE_VERSION = $arModuleVersion["VERSION"];
			$this->MODULE_VERSION_DATE = $arModuleVersion["VERSION_DATE"];
		}
		else
		{
			$this->MODULE_VERSION = CURRENCY_VERSION;
			$this->MODULE_VERSION_DATE = CURRENCY_VERSION_DATE;
		}

		$this->MODULE_NAME = Loc::getMessage("CURRENCY_INSTALL_NAME");
		$this->MODULE_DESCRIPTION = Loc::getMessage("CURRENCY_INSTALL_DESCRIPTION");
	}

	function DoInstall()
	{
		global $APPLICATION;
		$this->InstallFiles();
		$this->InstallDB();
		$this->InstallEvents();
		$GLOBALS["errors"] = $this->errors;

		$APPLICATION->IncludeAdminFile(Loc::getMessage("CURRENCY_INSTALL_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/currency/install/step1.php");
	}

	function DoUninstall()
	{
		global $APPLICATION, $step;
		$step = (int)$step;
		if ($step<2)
		{
			$APPLICATION->IncludeAdminFile(Loc::getMessage("CURRENCY_INSTALL_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/currency/install/unstep1.php");
		}
		elseif ($step==2)
		{
			$this->UnInstallDB(array(
				"savedata" => $_REQUEST["savedata"],
			));
			$this->UnInstallFiles();

			$GLOBALS["errors"] = $this->errors;
			$APPLICATION->IncludeAdminFile(Loc::getMessage("CURRENCY_INSTALL_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/currency/install/unstep2.php");
		}
	}

	function InstallDB()
	{
		global $DB, $APPLICATION;
		global $stackCacheManager;
		global $CACHE_MANAGER;

		$this->errors = false;

		$bitrix24Path = $_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/bitrix24/';
		$bitrix24 = file_exists($bitrix24Path) && is_dir($bitrix24Path);
		unset($bitrix24Path);

		if (!$DB->Query("SELECT COUNT(CURRENCY) FROM b_catalog_currency", true)):
			$this->errors = $DB->RunSQLBatch($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/currency/install/db/".strtolower($DB->type)."/install.sql");
		endif;

		if ($this->errors !== false)
		{
			$APPLICATION->ThrowException(implode("", $this->errors));
			return false;
		}
		RegisterModule("currency");
		$stackCacheManager->Clear("currency_currency_lang");
		$CACHE_MANAGER->Clean("currency_currency_list");
		$CACHE_MANAGER->Clean("currency_base_currency");
		$stackCacheManager->Clear("currency_rate");

		if (Loader::includeModule("currency"))
		{
			$currencyIterator = CurrencyTable::getList(array(
				'select' => array('CURRENCY'),
				'limit' => 1
			));
			if (!($currency = $currencyIterator->fetch()))
			{
				$languageID = '';
				$siteIterator = SiteTable::getList(array(
					'select' => array('LID', 'LANGUAGE_ID'),
					'filter' => array('DEF' => 'Y', 'ACTIVE' => 'Y')
				));
				if ($site = $siteIterator->fetch())
				{
					$languageID = (string)$site['LANGUAGE_ID'];
				}
				if (isset($site))
					unset($site);
				unset($siteIterator);

				if ($languageID == '')
					$languageID = 'en';

				$currencyList = array();
				$currencySetID = '';
				switch ($languageID)
				{
					case 'ua':
					case 'de':
					case 'en':
						$currencySetID = $languageID;
						break;
					case 'ru':
						if (!$bitrix24)
						{
							$languageIterator = LanguageTable::getList(array(
								'select' => array('ID'),
								'filter' => array('ID' => 'kz', 'ACTIVE' => 'Y')
							));
							if ($existLanguage = $languageIterator->fetch())
							{
								$currencySetID = $existLanguage['ID'];
							}
							if ($currencySetID == '')
							{
								$languageIterator = LanguageTable::getList(array(
									'select' => array('ID'),
									'filter' => array('ID' => 'ua', 'ACTIVE' => 'Y')
								));
								if ($existLanguage = $languageIterator->fetch())
								{
									$currencySetID = $existLanguage['ID'];
								}
							}
						}
						if ($currencySetID == '')
						{
							$currencySetID = $languageID;
						}
						break;
					default:
						$currencySetID = 'en';
						break;
				}
				$datetimeEntity = new SqlExpression(Application::getConnection()->getSqlHelper()->getCurrentDateTimeFunction());
				switch ($currencySetID)
				{
					case 'kz':
						$addCurrency = array(
							array('CURRENCY' => 'KZT', 'AMOUNT' => 1, 'AMOUNT_CNT' => 1, 'SORT' => 100, 'BASE' => 'Y', 'CURRENT_BASE_RATE' => 1),
							array('CURRENCY' => 'RUB', 'AMOUNT' => 1, 'AMOUNT_CNT' => 4.72, 'SORT' => 200, 'BASE' => 'N', 'CURRENT_BASE_RATE' => 4.72),
							array('CURRENCY' => 'USD', 'AMOUNT' => 1, 'AMOUNT_CNT' => 154.52, 'SORT' => 300, 'BASE' => 'N', 'CURRENT_BASE_RATE' => 154.52),
							array('CURRENCY' => 'EUR', 'AMOUNT' => 1, 'AMOUNT_CNT' => 212.73, 'SORT' => 400, 'BASE' => 'N', 'CURRENT_BASE_RATE' => 212.73)
						);
						break;
					case 'ua':
						$addCurrency = array(
							array('CURRENCY' => 'UAH', 'AMOUNT' => 1, 'AMOUNT_CNT' => 1, 'SORT' => 100, 'BASE' => 'Y', 'CURRENT_BASE_RATE' => 1),
							array('CURRENCY' => 'RUB', 'AMOUNT' => 2.54, 'AMOUNT_CNT' => 10, 'SORT' => 200, 'BASE' => 'N', 'CURRENT_BASE_RATE' => 0.254),
							array('CURRENCY' => 'USD', 'AMOUNT' => 799.3, 'AMOUNT_CNT' => 100, 'SORT' => 300, 'BASE' => 'N', 'CURRENT_BASE_RATE' => 7.993),
							array('CURRENCY' => 'EUR', 'AMOUNT' => 1083.37, 'AMOUNT_CNT' => 100, 'SORT' => 400, 'BASE' => 'N', 'CURRENT_BASE_RATE' => 10.8337)
						);
						break;
					case 'ru':
						$addCurrency = array(
							array('CURRENCY' => 'RUB', 'AMOUNT' => 1, 'AMOUNT_CNT' => 1, 'SORT' => 100, 'BASE' => 'Y', 'CURRENT_BASE_RATE' => 1),
							array('CURRENCY' => 'USD', 'AMOUNT' => 32.30, 'AMOUNT_CNT' => 1, 'SORT' => 200, 'BASE' => 'N', 'CURRENT_BASE_RATE' => 32.30),
							array('CURRENCY' => 'EUR', 'AMOUNT' => 43.80, 'AMOUNT_CNT' => 1, 'SORT' => 300, 'BASE' => 'N', 'CURRENT_BASE_RATE' => 43.80),
							array('CURRENCY' => 'UAH', 'AMOUNT' => 39.41, 'AMOUNT_CNT' => 10, 'SORT' => 400, 'BASE' => 'N', 'CURRENT_BASE_RATE' => 3.941),
							array('CURRENCY' => 'BYR', 'AMOUNT' => 36.72, 'AMOUNT_CNT' => 10000, 'SORT' => 500, 'BASE' => 'N', 'CURRENT_BASE_RATE' => 0.003672)
						);
						break;
					case 'de':
						$addCurrency = array(
							array('CURRENCY' => 'EUR', 'AMOUNT' => 1, 'AMOUNT_CNT' => 1, 'SORT' => 100, 'BASE' => 'Y', 'CURRENT_BASE_RATE' => 1),
							array('CURRENCY' => 'USD', 'AMOUNT' => 0.74, 'AMOUNT_CNT' => 1, 'SORT' => 200, 'BASE' => 'N', 'CURRENT_BASE_RATE' => 0.74)
						);
						break;
					case 'en':
						$addCurrency = array(
							array('CURRENCY' => 'USD', 'AMOUNT' => 1, 'AMOUNT_CNT' => 1, 'SORT' => 100, 'BASE' => 'Y', 'CURRENT_BASE_RATE' => 1),
							array('CURRENCY' => 'EUR', 'AMOUNT' => 1.36, 'AMOUNT_CNT' => 1, 'SORT' => 200, 'BASE' => 'N', 'CURRENT_BASE_RATE' => 1.36)
						);
						break;
				}
				foreach ($addCurrency as &$fields)
				{
					$fields['CREATED_BY'] = null;
					$fields['MODIFIED_BY'] = null;
					$fields['DATE_CREATE'] = $datetimeEntity;
					$fields['DATE_UPDATE'] = $datetimeEntity;
					$currencyResult = CurrencyTable::add($fields);
					if ($currencyResult->isSuccess())
						$currencyList[] = $fields['CURRENCY'];
				}
				unset($currencyResult, $fields);

				if (!empty($currencyList))
				{
					Option::set('currency', 'installed_currencies', implode(',', $currencyList), '');
					$languageIterator = LanguageTable::getList(array(
						'select' => array('ID'),
						'filter' => array('ACTIVE' => 'Y')
					));
					while ($existLanguage = $languageIterator->fetch())
					{
						$CACHE_MANAGER->Clean('currency_currency_list_'.$existLanguage['ID']);
						$messList = Loc::loadLanguageFile($_SERVER['DOCUMENT_ROOT'].'/bitrix/modules/currency/install_lang.php', $existLanguage['ID']);
						foreach($currencyList as &$oneCurrency)
						{
							$fields = array(
								'LID' => $existLanguage['ID'],
								'CURRENCY' => $oneCurrency,
								'THOUSANDS_SEP' => false,
								'DECIMALS' => 2,
								'HIDE_ZERO' => 'Y',
								'FORMAT_STRING' => $messList['CUR_INSTALL_'.$oneCurrency.'_FORMAT_STRING'],
								'FULL_NAME' => $messList['CUR_INSTALL_'.$oneCurrency.'_FULL_NAME'],
								'DEC_POINT' => $messList['CUR_INSTALL_'.$oneCurrency.'_DEC_POINT'],
								'THOUSANDS_VARIANT' => $messList['CUR_INSTALL_'.$oneCurrency.'_THOUSANDS_SEP'],
								'CREATED_BY' => null,
								'MODIFIED_BY' => null,
								'DATE_CREATE' => $datetimeEntity,
								'TIMESTAMP_X' => $datetimeEntity
							);
							$resultCurrencyLang = CurrencyLangTable::add($fields);
						}
						unset($oneCurrency);
					}
					unset($existLanguage, $languageIterator);
					if (!$bitrix24)
					{
						$checkDate = DateTime::createFromTimestamp(strtotime('tomorrow 00:01:00'));;
						CAgent::AddAgent('\Bitrix\Currency\CurrencyTable::currencyBaseRateAgent();', 'currency', 'Y', 86400, '', 'Y', $checkDate->toString(), 100, false, true);
					}
				}
			}
		}
		$stackCacheManager->Clear("currency_currency_lang");
		$CACHE_MANAGER->Clean("currency_currency_list");
		$CACHE_MANAGER->Clean("currency_base_currency");
		$stackCacheManager->Clear("currency_rate");

		return true;
	}

	function UnInstallDB($arParams = array())
	{
		global $DB, $APPLICATION;
		$this->errors = false;
		if (!isset($arParams["savedata"]) || $arParams["savedata"] != "Y")
		{
			$this->errors = $DB->RunSQLBatch($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/currency/install/db/".strtolower($DB->type)."/uninstall.sql");
			if($this->errors !== false)
			{
				$APPLICATION->ThrowException(implode('', $this->errors));
				return false;
			}
		}

		CAgent::RemoveModuleAgents('currency');
		UnRegisterModule('currency');

		return true;
	}

	function InstallEvents()
	{
		return true;
	}

	function UnInstallEvents()
	{
		return true;
	}

	function InstallFiles()
	{
		if($_ENV["COMPUTERNAME"]!='BX')
		{
			CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/currency/install/admin", $_SERVER["DOCUMENT_ROOT"]."/bitrix/admin", true);
			CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/currency/install/images", $_SERVER["DOCUMENT_ROOT"]."/bitrix/images/currency", true, true);
			CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/currency/install/themes", $_SERVER["DOCUMENT_ROOT"]."/bitrix/themes", true, true);
			CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/currency/install/components", $_SERVER["DOCUMENT_ROOT"]."/bitrix/components", true, true);
			CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/currency/install/js", $_SERVER["DOCUMENT_ROOT"]."/bitrix/js", true, true);
			CopyDirFiles($_SERVER['DOCUMENT_ROOT']."/bitrix/modules/currency/install/tools", $_SERVER['DOCUMENT_ROOT']."/bitrix/tools", true, true);
		}
		return true;
	}

	function UnInstallFiles()
	{
		DeleteDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/currency/install/admin", $_SERVER["DOCUMENT_ROOT"]."/bitrix/admin");
		DeleteDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/currency/install/themes/.default/", $_SERVER["DOCUMENT_ROOT"]."/bitrix/themes/.default");
		DeleteDirFilesEx("/bitrix/themes/.default/icons/currency/");
		DeleteDirFilesEx("/bitrix/images/currency/");
		DeleteDirFilesEx("/bitrix/js/currency/");
		DeleteDirFilesEx("/bitrix/tools/currency/"); // scripts

		return true;
	}
}