<?php

if (!function_exists("file_get_contents"))
{
	function file_get_contents($filename)
	{
		if (!$handler = @fopen($filename, "rb"))
			return false;

		$content = fread($handler, filesize($filename));
		fclose($handler);

		return $content;
	}
}

if (!function_exists("file_put_contents"))
{
	function file_put_contents($filePath, $fileContent)
	{
		$handler = @fopen($filePath,"wb");
		if (!$handler)
			return false;

		$success = @fwrite($handler, $fileContent);
		if (!$success)
			return false;

		fclose($handler);
		return true;
	}
}

function InstallGetMessage($name)
{
	return GetMessage($name);
}

class BXInstallServices
{
	function CreateWizardIndex($wizardName, &$errorMessage)
	{
		$indexContent = '<'.'?'.
			'define("WIZARD_DEFAULT_SITE_ID", "'.(defined("WIZARD_DEFAULT_SITE_ID") ? WIZARD_DEFAULT_SITE_ID : "s1").'");'.
			'require('.'$'.'_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_before.php");'.
			'require_once('.'$'.'_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/classes/general/wizard.php");'.
			'$'.'wizard = new CWizard("'.$wizardName.'");'.
			'$'.'wizard->Install();'.
			'require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_after.php");'.
			'?'.'>';

		$p = $_SERVER["DOCUMENT_ROOT"]."/index.php";
		if (defined("WIZARD_DEFAULT_SITE_ID"))
		{
			$rsSite = CSite::GetList($by="sort", $order="asc", array("ID" => WIZARD_DEFAULT_SITE_ID));
			$arSite = $rsSite->GetNext();
			$p = CSite::GetSiteDocRoot($arSite["LID"]).$arSite["DIR"]."/index.php";
		}

		$handler = @fopen($p,"wb");

		if (!$handler)
		{
			$errorMessage = InstallGetMessage("INST_WIZARD_INDEX_ACCESS_ERROR");
			return false;
		}

		$success = @fwrite($handler, $indexContent);
		if (!$success)
		{
			$errorMessage = InstallGetMessage("INST_WIZARD_INDEX_ACCESS_ERROR");
			return false;
		}

		if (defined("BX_FILE_PERMISSIONS"))
			@chmod($_SERVER["DOCUMENT_ROOT"]."/index.php", BX_FILE_PERMISSIONS);

		fclose($handler);

		return true;
	}

	function LoadWizardData($wizard)
	{
		$arTmp = explode(":", $wizard);
		$ar = array();
		foreach ($arTmp as $a)
		{
			$a = preg_replace("#[^a-z0-9_.-]+#i", "", $a);
			if (strlen($a) > 0)
				$ar[] = $a;
		}

		if (count($ar) > 2)
			$path = $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/".$ar[0]."/install/wizards/".$ar[1]."/".$ar[2];
		elseif (count($ar) == 2)
			$path = $_SERVER["DOCUMENT_ROOT"]."/bitrix/wizards/".$ar[0]."/".$ar[1];
		else
			return false;

		if (!file_exists($path."/.description.php") || !is_file($path."/.description.php"))
			return false;

		if (!defined("B_PROLOG_INCLUDED"))
			define("B_PROLOG_INCLUDED", true);

		global $MESS;
		if(file_exists($path."/lang/en/.description.php"))
			include($path."/lang/en/.description.php");
		if (file_exists($path."/lang/".LANGUAGE_ID."/.description.php"))
			include($path."/lang/".LANGUAGE_ID."/.description.php");

		$arWizardDescription = array();
		include($path."/.description.php");

		if (count($arWizardDescription) <= 0)
			return false;

		if (!array_key_exists("WIZARD_TYPE", $arWizardDescription))
			return false;
		if (defined("WIZARD_DEFAULT_TONLY") && WIZARD_DEFAULT_TONLY === true && !defined("WIZARD_DEFAULT_DONLY") && strtoupper($arWizardDescription["WIZARD_TYPE"]) != "INSTALL")
			return false;
		if (defined("WIZARD_DEFAULT_TONLY") && WIZARD_DEFAULT_TONLY === true && defined("WIZARD_DEFAULT_DONLY") && strtoupper($arWizardDescription["WIZARD_TYPE"]) != "INSTALL" && strtoupper($arWizardDescription["WIZARD_TYPE"]) != "INSTALL_ONCE")
			return false;
		if ((!defined("WIZARD_DEFAULT_TONLY") || WIZARD_DEFAULT_TONLY !== true) && strtoupper($arWizardDescription["WIZARD_TYPE"]) != "INSTALL" && strtoupper($arWizardDescription["WIZARD_TYPE"]) != "INSTALL_ONCE")
			return false;
		if (strlen($arWizardDescription["IMAGE"]) > 0)
		{
			if (count($ar) > 2)
			{
				BXInstallServices::CopyDirFiles(
					$path."/".$arWizardDescription["IMAGE"],
					$_SERVER["DOCUMENT_ROOT"]."/bitrix/tmp/".$ar[1]."/".$ar[2]."/".$arWizardDescription["IMAGE"],
					true
				);
				$arWizardDescription["IMAGE"] = "/bitrix/tmp/".$ar[1]."/".$ar[2]."/".$arWizardDescription["IMAGE"];
			}
			else
			{
				$arWizardDescription["IMAGE"] = "/bitrix/wizards/".$ar[0]."/".$ar[1]."/".$arWizardDescription["IMAGE"];
			}
		}

		return array(
			"ID" => implode(":", $ar),
			"NAME" => (BXInstallServices::IsUTFString($arWizardDescription["NAME"]) && function_exists("mb_convert_encoding") ? mb_convert_encoding($arWizardDescription["NAME"], INSTALL_CHARSET, "utf-8") : $arWizardDescription["NAME"]),
			"DESCRIPTION" => (BXInstallServices::IsUTFString($arWizardDescription["DESCRIPTION"]) && function_exists("mb_convert_encoding") ? mb_convert_encoding($arWizardDescription["DESCRIPTION"], INSTALL_CHARSET, "utf-8") : $arWizardDescription["DESCRIPTION"]),
			"IMAGE" => $arWizardDescription["IMAGE"],
			"VERSION" => $arWizardDescription["VERSION"],
		);
	}

	function GetWizardsList($moduleName = "")
	{
		$arWizardsList = array();
		if (strlen($moduleName) <= 0)
		{
			$path = $_SERVER["DOCUMENT_ROOT"]."/bitrix/wizards";
			if ($h1 = opendir($path))
			{
				while (($f1 = readdir($h1)) !== false)
				{
					if ($f1 == "." || $f1 == "..")
						continue;

					if (!is_dir($path."/".$f1))
						continue;

					if ($h2 = opendir($path."/".$f1))
					{
						while (($f2 = readdir($h2)) !== false)
						{
							if ($f2 == "." || $f2 == "..")
								continue;

							if (!is_dir($path."/".$f1."/".$f2))
								continue;

							if (!file_exists($path."/".$f1."/".$f2."/.description.php"))
								continue;

							if ($wizardData = BXInstallServices::LoadWizardData($f1.":".$f2))
							{
								$arWizardsList[$f1.":".$f2] = $wizardData;
							}
						}
						closedir($h2);
					}
				}
				closedir($h1);
			}
		}

		$path = $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules";
		if ($h1 = opendir($path))
		{
			while (($f1 = readdir($h1)) !== false)
			{
				if ($f1 == "." || $f1 == "..")
					continue;

				if (strlen($moduleName) > 0 && $f1 != $moduleName)
					continue;

				if (!is_dir($path."/".$f1) || !file_exists($path."/".$f1."/install/wizards") || !is_dir($path."/".$f1."/install/wizards"))
					continue;

				if ($h2 = opendir($path."/".$f1."/install/wizards"))
				{
					while (($f2 = readdir($h2)) !== false)
					{
						if ($f2 == "." || $f2 == "..")
							continue;

						if (!is_dir($path."/".$f1."/install/wizards/".$f2))
							continue;

						if ($h3 = opendir($path."/".$f1."/install/wizards/".$f2))
						{
							while (($f3 = readdir($h3)) !== false)
							{
								if ($f3 == "." || $f3 == "..")
									continue;

								if (!is_dir($path."/".$f1."/install/wizards/".$f2."/".$f3))
									continue;

								if (array_key_exists($f2.":".$f3, $arWizardsList))
									continue;

								if (!file_exists($path."/".$f1."/install/wizards/".$f2."/".$f3."/.description.php"))
									continue;

								if ($wizardData = BXInstallServices::LoadWizardData($f1.":".$f2.":".$f3))
									$arWizardsList[$f2.":".$f3] = $wizardData;
							}
							closedir($h3);
						}
					}
					closedir($h2);
				}
			}
			closedir($h1);
		}

		if(LANGUAGE_ID != 'ru')
			unset($arWizardsList['bitrix:demo']);

		ksort($arWizardsList);

		return array_values($arWizardsList);
	}

	function CopyDirFiles($path_from, $path_to, $rewrite = true)
	{
		if (strpos($path_to."/", $path_from."/")===0)
			return false;

		if (is_dir($path_from))
		{
			BXInstallServices::CheckDirPath($path_to."/");
		}
		elseif (is_file($path_from))
		{
			$p = strrpos($path_to, "/");
			$path_to_dir = substr($path_to, 0, $p);
			BXInstallServices::CheckDirPath($path_to_dir."/");

			if (file_exists($path_to) && !$rewrite)
				return false;

			@copy($path_from, $path_to);
			if(is_file($path_to))
				@chmod($path_to, BX_FILE_PERMISSIONS);

			return true;
		}
		else
		{
			return true;
		}

		if ($handle = @opendir($path_from))
		{
			while (($file = readdir($handle)) !== false)
			{
				if ($file == "." || $file == "..")
					continue;

				if (is_dir($path_from."/".$file))
				{
					BXInstallServices::CopyDirFiles($path_from."/".$file, $path_to."/".$file, $rewrite);
				}
				elseif (is_file($path_from."/".$file))
				{
					if (file_exists($path_to."/".$file) && !$rewrite)
						continue;

					@copy($path_from."/".$file, $path_to."/".$file);
					@chmod($path_to."/".$file, BX_FILE_PERMISSIONS);
				}
			}
			@closedir($handle);
		}
	}

	function GetDBTypes()
	{
		$arTypes = Array();

		if (file_exists($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/classes/mysql/database.php"))
			$arTypes["mysql"] = function_exists("mysql_connect");

		if (file_exists($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/classes/oracle/database.php"))
			$arTypes["oracle"] = function_exists("OCILogon");

		if (file_exists($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/classes/mssql/database.php"))
			$arTypes["mssql"] = function_exists("sqlsrv_connect");

		return $arTypes;
	}

	function CheckDirPath($path)
	{
		$badDirs = Array();
		$path = str_replace("\\", "/", $path);
		$path = str_replace("//", "/", $path);

		if ($path[strlen($path)-1] != "/")
		{
			$p = strrpos($path, "/");
			$path = substr($path, 0, $p);
		}

		while (strlen($path)>1 && $path[strlen($path)-1]=="/")
			$path = substr($path, 0, strlen($path)-1);

		$p = strrpos($path, "/");
		while ($p > 0)
		{
			if (file_exists($path) && is_dir($path))
			{
				if (!is_writable($path))
					@chmod($path, BX_DIR_PERMISSIONS);
				break;
			}
			$badDirs[] = substr($path, $p+1);
			$path = substr($path, 0, $p);
			$p = strrpos($path, "/");
		}

		for ($i = count($badDirs)-1; $i>=0; $i--)
		{
			$path = $path."/".$badDirs[$i];
			$success = @mkdir($path, BX_DIR_PERMISSIONS);
			if (!$success)
				return false;
		}

		return true;
	}

	function DeleteDirRec($path)
	{
		$path = str_replace("\\", "/", $path);
		if (!file_exists($path)) return;
		if (!is_dir($path))
		{
			@unlink($path);
			return;
		}
		if ($handle = opendir($path))
		{
			while (($file = readdir($handle)) !== false)
			{
				if ($file == "." || $file == "..") continue;
				if (is_dir($path."/".$file))
				BXInstallServices::DeleteDirRec($path."/".$file);
				else
					@unlink($path."/".$file);
			}
		}
		closedir($handle);
		@rmdir($path);
	}

	function DeleteDbFiles($dbType)
	{
		if (defined("DEBUG_MODE"))
			return;

		$path = $_SERVER['DOCUMENT_ROOT']."/bitrix/modules";

		if (!$handle = @opendir($path))
			return;

		while (($file = readdir($handle)) !== false)
		{
			if ($file == "." || $file == "..")
				continue;

			if (is_dir($path."/".$file))
			{
				BXInstallServices::DeleteDirRec($path."/".$file."/".$dbType);
				BXInstallServices::DeleteDirRec($path."/".$file."/classes/".$dbType);
				BXInstallServices::DeleteDirRec($path."/".$file."/install/".$dbType);
				BXInstallServices::DeleteDirRec($path."/".$file."/install/db/".$dbType);
			}
		}

		closedir($handle);
	}

	function VersionCompare($strCurver, $strMinver, $strMaxver = "0.0.0")
	{
		$curver = explode(".", $strCurver);for ($i = 0; $i < 3; $i++) $curver[$i] = (isset($curver[$i]) ? intval($curver[$i]) : 0);
		$minver = explode(".", $strMinver);  for ($i = 0; $i < 3; $i++) $minver[$i] = (isset($minver[$i]) ? intval($minver[$i]) : 0);
		$maxver = explode(".", $strMaxver);  for ($i = 0; $i < 3; $i++) $maxver[$i] = (isset($maxver[$i]) ? intval($maxver[$i]) : 0);

		if (($minver[0]>0 || $minver[1]>0 || $minver[2]>0)
			&&
			($curver[0]<$minver[0]
				|| (($curver[0]==$minver[0]) && ($curver[1]<$minver[1]))
				|| (($curver[0]==$minver[0]) && ($curver[1]==$minver[1]) && ($curver[2]<$minver[2]))
			))
			return false;
		elseif (($maxver[0]>0 || $maxver[1]>0 || $maxver[2]>0)
			&&
			($curver[0]>$maxver[0]
				|| (($curver[0]==$maxver[0]) && ($curver[1]>$maxver[1]))
				|| (($curver[0]==$maxver[0]) && ($curver[1]==$maxver[1]) && ($curver[2]>=$maxver[2]))
			))
			return false;
		else
			return true;
	}

	function Add2Log($sText, $sErrorCode = "")
	{
		$MAX_LOG_SIZE = 1000000;
		$READ_PSIZE = 8000;
		$LOG_FILE = $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/install.log";
		$LOG_FILE_TMP = $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/install_tmp.log";

		if (strlen($sText) <= 0 && strlen($sErrorCode) <= 0)
			return;

		$old_abort_status = ignore_user_abort(true);

		if (file_exists($LOG_FILE))
		{
			$log_size = @filesize($LOG_FILE);
			$log_size = IntVal($log_size);

			if ($log_size > $MAX_LOG_SIZE)
			{
				if (!($fp = @fopen($LOG_FILE, "rb")))
				{
					ignore_user_abort($old_abort_status);
					return False;
				}

				if (!($fp1 = @fopen($LOG_FILE_TMP, "wb")))
				{
					ignore_user_abort($old_abort_status);
					return False;
				}

				$iSeekLen = IntVal($log_size-$MAX_LOG_SIZE/2.0);
				fseek($fp, $iSeekLen);

				do
				{
					$data = fread($fp, $READ_PSIZE);
					if (strlen($data) == 0)
						break;

					@fwrite($fp1, $data);
				}
				while(true);

				@fclose($fp);
				@fclose($fp1);

				@copy($LOG_FILE_TMP, $LOG_FILE);
				@unlink($LOG_FILE_TMP);
			}
			clearstatcache();
		}

		if ($fp = @fopen($LOG_FILE, "ab+"))
		{
			if (flock($fp, LOCK_EX))
			{
				@fwrite($fp, date("Y-m-d H:i:s")." - ".$sErrorCode." - ".$sText."\n");
				@fflush($fp);
				@flock($fp, LOCK_UN);
				@fclose($fp);
			}
		}
		ignore_user_abort($old_abort_status);
	}

	function ParseForSql($sqlString)
	{
	}


	function GetDemoWizard()
	{
		if (!defined("B_PROLOG_INCLUDED"))
			define("B_PROLOG_INCLUDED",true);

		if (isset($GLOBALS["arWizardConfig"]) && array_key_exists("demoWizardName", $GLOBALS["arWizardConfig"]) && CWizardUtil::CheckName($GLOBALS["arWizardConfig"]["demoWizardName"]))
			return $GLOBALS["arWizardConfig"]["demoWizardName"];

		$arWizards = CWizardUtil::GetWizardList();

		$defaultWizard = false;
		foreach ($arWizards as $arWizard)
		{
			$wizardID = $arWizard["ID"];

			if ($wizardID == "bitrix:demo")
			{
				$defaultWizard = "bitrix:demo";
				continue;
			}

			$position = strpos($wizardID, ":");
			if ($position !== false)
				$wizardName = substr($wizardID, $position+1);
			else
				$wizardName = $wizardID;

			if ($wizardName == "demo")
				return $wizardID;
		}

		return $defaultWizard;
	}

	function GetWizardCharset($wizardName)
	{
		if (!defined("B_PROLOG_INCLUDED"))
			define("B_PROLOG_INCLUDED",true);

		$wizardPath = CWizardUtil::GetRepositoryPath().CWizardUtil::MakeWizardPath($wizardName);
		if (!file_exists($_SERVER["DOCUMENT_ROOT"].$wizardPath."/.description.php"))
			return false;

		$arWizardDescription = Array();
		include($_SERVER["DOCUMENT_ROOT"].$wizardPath."/.description.php");

		if (array_key_exists("CHARSET", $arWizardDescription) && strlen($arWizardDescription["CHARSET"]) > 0)
			return $arWizardDescription["CHARSET"];

		return false;
	}

	function IsShortInstall()
	{
		$dbconnPath = $_SERVER["DOCUMENT_ROOT"].BX_PERSONAL_ROOT."/php_interface/dbconn.php";

		if (!file_exists($dbconnPath))
			return false;

		define("DELAY_DB_CONNECT", false); //For check connection in $DB->Connect
		global $DBType, $DBHost, $DBLogin, $DBPassword, $DBName, $DBDebug, $DBSQLServerType;
		@include($dbconnPath);

		return defined("SHORT_INSTALL");
	}

	function CheckShortInstall()
	{
		global $DB, $DBType, $DBHost, $DBLogin, $DBPassword, $DBName, $DBDebug, $DBSQLServerType;

		if (defined("SHORT_INSTALL_CHECK"))
			return true;

		//PHP
		$requireStep = new RequirementStep;
		if (!$requireStep->CheckRequirements($DBType))
			BXInstallServices::ShowStepErrors($requireStep);

		//UTF-8
		if (defined("BX_UTF") && !BXInstallServices::IsUTF8Support())
			BXInstallServices::ShowStepErrors(InstallGetMessage("INST_UTF8_NOT_SUPPORT"));
		elseif (defined("BX_UTF") && $DBType == "mssql")
			BXInstallServices::ShowStepErrors(InstallGetMessage("INST_UTF8_NOT_SUPPORT"));

		//Check connection
		require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/classes/".$DBType."/database.php");
		require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/classes/".$DBType."/main.php");
		require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/tools.php");
		IncludeModuleLangFile($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/classes/general/main.php");

		$application = \Bitrix\Main\HttpApplication::getInstance();
		$application->initializeBasicKernel();
		$conPool = $application->getConnectionPool();

		$DBType = strtolower($DBType);
		if ($DBType == 'mysql')
			$dbClassName = "\\Bitrix\\Main\\DB\\MysqlConnection";
		elseif ($DBType == 'mssql')
			$dbClassName = "\\Bitrix\\Main\\DB\\MssqlConnection";
		else
			$dbClassName = "\\Bitrix\\Main\\DB\\OracleConnection";

		$conPool->setConnectionParameters(
			\Bitrix\Main\Data\ConnectionPool::DEFAULT_CONNECTION_NAME,
			array(
				'className' => $dbClassName,
				'host' => $DBHost,
				'database' => $DBName,
				'login' => $DBLogin,
				'password' => $DBPassword,
				'options' => (function_exists("mysql_pconnect") ? 1 : 0) | 2
			)
		);

		$DB = new CDatabase;

		if (!$DB->Connect($DBHost, $DBName, $DBLogin, $DBPassword))
			BXInstallServices::ShowStepErrors(InstallGetMessage("COULD_NOT_CONNECT")." ".$DB->db_Error);

		$databaseStep = new CreateDBStep;
		$databaseStep->DB =& $DB;
		$databaseStep->dbType = $DBType;
		$databaseStep->dbName = $DBName;
		$databaseStep->filePermission = (defined("BX_FILE_PERMISSIONS") ? BX_FILE_PERMISSIONS : 0);
		$databaseStep->folderPermission = (defined("BX_DIR_PERMISSIONS") ? BX_DIR_PERMISSIONS : 0);
		$databaseStep->createDBType = (defined("MYSQL_TABLE_TYPE") ? MYSQL_TABLE_TYPE : "");
		$databaseStep->utf8 = defined("BX_UTF");
		$databaseStep->createCharset = null;
		$databaseStep->needCodePage = false;

		if ($databaseStep->IsBitrixInstalled())
			BXInstallServices::ShowStepErrors($databaseStep);

		//Database check
		if ($DBType == "mysql")
		{
			$dbResult = $DB->Query("select VERSION() as ver", true);
			if ($dbResult && ($arVersion = $dbResult->Fetch()))
			{
				$mysqlVersion = trim($arVersion["ver"]);
				if (!BXInstallServices::VersionCompare($mysqlVersion, "5.0.0"))
					BXInstallServices::ShowStepErrors(InstallGetMessage("SC_DB_VERS_MYSQL_ER"));

				$databaseStep->needCodePage = true;

				if (!$databaseStep->needCodePage && defined("BX_UTF"))
					BXInstallServices::ShowStepErrors(InstallGetMessage("INS_CREATE_DB_CHAR_NOTE"));
			}

			//Code page
			if ($databaseStep->needCodePage)
			{
				$codePage = false;
				if (LANGUAGE_ID == "ru")
					$codePage = "cp1251";
				elseif ($databaseStep->createCharset != '')
					$codePage = $databaseStep->createCharset;
				else
					$codePage = 'latin1';

				if ($databaseStep->utf8)
					$DB->Query("ALTER DATABASE `".$databaseStep->dbName."` CHARACTER SET UTF8 COLLATE utf8_unicode_ci", true);
				elseif ($codePage)
					$DB->Query("ALTER DATABASE `".$databaseStep->dbName."` CHARACTER SET ".$codePage, true);
			}

			if (strlen($databaseStep->createDBType) > 0)
				$DB->Query("SET storage_engine = '".$databaseStep->createDBType."'", false);

			//SQL mode
			$dbResult = $DB->Query("SELECT @@sql_mode", true);
			if ($dbResult && ($arResult = $dbResult->Fetch()))
			{
				$sqlMode = trim($arResult["@@sql_mode"]);
				if (strpos($sqlMode, "STRICT_TRANS_TABLES") !== false )
				{
					$databaseStep->sqlMode = preg_replace("~,?STRICT_TRANS_TABLES~i", "", $sqlMode);
					$databaseStep->sqlMode = ltrim($databaseStep->sqlMode, ",");
				}
			}

		}
		elseif ($DBType == "oracle" && $databaseStep->utf8)
		{
			$query = "SELECT * FROM nls_database_parameters WHERE PARAMETER='NLS_CHARACTERSET' OR PARAMETER='NLS_NCHAR_CHARACTERSET'";
			$dbResult = $DB->Query($query, true);
			if ($dbResult && ($arResult = $dbResult->Fetch()))
			{
				$arOracleParams = Array("NLS_CHARACTERSET" => "","NLS_NCHAR_CHARACTERSET" => "");

				foreach ($arResult as $arParam)
					$arOracleParams[$arParam["PARAMETER"]] = $arParam["VALUE"];

				if ($arOracleParams["NLS_CHARACTERSET"] != "AL32UTF8" || $arOracleParams["NLS_NCHAR_CHARACTERSET"] != "UTF8")
					BXInstallServices::ShowStepErrors(InstallGetMessage("INST_ORACLE_UTF_ERROR"));
			}
			else
				BXInstallServices::ShowStepErrors(InstallGetMessage("INST_ORACLE_CHARSET_ERROR"));
		}

		//Create after_connect.php if not exists
		if (!file_exists($_SERVER["DOCUMENT_ROOT"].BX_PERSONAL_ROOT."/php_interface/after_connect.php") && $databaseStep->CreateAfterConnect() === false)
			BXInstallServices::ShowStepErrors($databaseStep);

		if (!$databaseStep->CheckDBOperation())
			BXInstallServices::ShowStepErrors($databaseStep);

		$filePath = $_SERVER["DOCUMENT_ROOT"].BX_PERSONAL_ROOT."/php_interface/dbconn.php";
		if ($fileContent = file_get_contents($filePath))
		{
			$fileContent = "<"."? define(\"SHORT_INSTALL_CHECK\", true);?".">".$fileContent;
			file_put_contents($filePath, $fileContent);
		}

		return true;
	}

	function ShowStepErrors($obStep)
	{
		header("Content-Type: text/html; charset=".INSTALL_CHARSET);

		if (is_object($obStep))
			$arErrors = $obStep->GetErrors();
		else
			$arErrors[] = Array($obStep);

		$strError = "";
		if (count($arErrors) > 0)
		{
			foreach ($arErrors as $arError)
				$strError .= $arError[0]."<br />";
		}

		echo '<span style="color:red">'.InstallGetMessage("INST_SHORT_INSTALL_ERROR").': '.$strError.'</span>';
		exit;
	}

	//UTF Functions
	function IsUTF8Support()
	{
		return (
			extension_loaded("mbstring")
			&& ini_get("mbstring.func_overload") == 2
			&& strtoupper(ini_get("mbstring.internal_encoding")) == "UTF-8"
		);
	}

	function IsUTFString($string)
	{
		return preg_match('%^(?:
			[\x09\x0A\x0D\x20-\x7E]             # ASCII
			|[\xC2-\xDF][\x80-\xBF]             # non-overlong 2-byte
			| \xE0[\xA0-\xBF][\x80-\xBF]        # excluding overlongs
			|[\xE1-\xEC\xEE\xEF][\x80-\xBF]{2}  # straight 3-byte
			| \xED[\x80-\x9F][\x80-\xBF]        # excluding surrogates
			| \xF0[\x90-\xBF][\x80-\xBF]{2}     # planes 1-3
			|[\xF1-\xF3][\x80-\xBF]{3}          # planes 4-15
			| \xF4[\x80-\x8F][\x80-\xBF]{2}     # plane 16
		)*$%xs', $string);
	}

	function EncodeFile($filePath, $charsetFrom)
	{
		$position = strrpos($filePath, ".");
		$extension = strtolower(substr($filePath, $position + 1, strlen($filePath) - $position));

		if ($extension != "php" && $extension != "sql" && $extension != "js" && $extension != "csv" && $extension != "snp" && $extension != "html" && $extension != "xml")
			return;

		$fileContent = file_get_contents($filePath);
		if ($fileContent === false)
			return;
		if($extension == "xml")
		{
			if(substr($fileContent, 0, 5) === "<?xml" && strpos(substr($fileContent, 0, 100), "encoding") === false)
			{
				$fileContent = mb_convert_encoding($fileContent, "utf-8", $charsetFrom);
				file_put_contents($filePath, $fileContent);
			}
		}
		else
		{
			$fileContent = mb_convert_encoding($fileContent, "utf-8", $charsetFrom);
			file_put_contents($filePath, $fileContent);
		}
	}

	function EncodeDir($dirPath, $charsetFrom, $encodeALL = false)
	{
		$dirPath = str_replace("\\", "/", $dirPath);
		$dirPath = rtrim($dirPath, "/");

		if (!is_dir($dirPath))
			return false;

		if (!$handle = @opendir($dirPath))
			return false;

		while (($file = readdir($handle)) !== false)
		{
			if ($file == "." || $file == "..")
				continue;

			$filePath = $dirPath."/".$file;

			if (is_dir($filePath))
				BXInstallServices::EncodeDir($filePath, $charsetFrom, $encodeALL);
			else
			{
				if (
					$encodeALL === false &&
					!preg_match("@/(ru|de|la)/@", $filePath, $matches) ||
					strpos($filePath, "/bitrix/modules/main/lang/".LANGUAGE_ID."/install.php") !== false
				)
					continue;

				if ($encodeALL)
					BXInstallServices::EncodeFile($filePath, $charsetFrom);
				else
				{
					if($matches[1]=='de')
						BXInstallServices::EncodeFile($filePath, "iso-8859-15");
					elseif($matches[1]=='ru')
						BXInstallServices::EncodeFile($filePath, "windows-1251");
					elseif($matches[1]=='la')
						BXInstallServices::EncodeFile($filePath, "iso-8859-1");
				}
			}
		}
	}

	function SetStatus($status)
	{
		$bCgi = (stristr(php_sapi_name(), "cgi") !== false);
		$bFastCgi = ($bCgi && (array_key_exists('FCGI_ROLE', $_SERVER) || array_key_exists('FCGI_ROLE', $_ENV)));
		if($bCgi && !$bFastCgi)
			header("Status: ".$status);
		else
			header($_SERVER["SERVER_PROTOCOL"]." ".$status);
	}

	function LocalRedirect($url)
	{
		global $HTTP_HOST, $SERVER_PORT;

		$url = str_replace("&amp;","&",$url);
		$url = str_replace ("\r", "", $url);
		$url = str_replace ("\n", "", $url);

		BXInstallServices::SetStatus("302 Found");

		if (
			strtolower(substr($url,0,7))=="http://" ||
			strtolower(substr($url,0,8))=="https://" ||
			strtolower(substr($url,0,6))=="ftp://")
		{
			header("Request-URI: $url");
			header("Content-Location: $url");
			header("Location: $url");
		}
		else
		{
			if ($SERVER_PORT!="80" && $SERVER_PORT != 443 && $SERVER_PORT>0 && strpos($HTTP_HOST,":".$SERVER_PORT)<=0)
				$HTTP_HOST .= ":".$SERVER_PORT;

			$protocol = ($_SERVER["SERVER_PORT"]==443 || strtolower($_SERVER["HTTPS"])=="on" ? "https" : "http");

			header("Request-URI: $protocol://$HTTP_HOST$url");
			header("Content-Location: $protocol://$HTTP_HOST$url");
			header("Location: $protocol://$HTTP_HOST$url");
		}
		exit;
	}


	function SetSession()
	{
		if (!function_exists("session_start"))
			return false;

		session_start();
		$_SESSION["session_check"] = "Y";

		return true;
	}

	function CheckSession()
	{
		if (!function_exists("session_start"))
			return false;

		session_start();

		return ( isset($_SESSION["session_check"]) && $_SESSION["session_check"] == "Y" );
	}

	function GetWizardsSettings()
	{
		$arWizardConfig = Array();
		$configFile = $_SERVER["DOCUMENT_ROOT"]."/install.config";

		if (!is_file($configFile))
			return $arWizardConfig;

		$configFileContent = file_get_contents($configFile);
		if (strlen($configFileContent) <= 0)
			return $arWizardConfig;

		$configFileContent = str_replace(Array("<config>", "</config>"), "", $configFileContent);

		preg_match_all("~<([a-zA-Z0-9]+[^>]*)>(.*?)</\\1>~s", $configFileContent, $arMatch);

		if (isset($arMatch[1]) && isset($arMatch[2]) && is_array($arMatch[1]) && is_array($arMatch[2]))
		{
			for ($i = 0, $length = count($arMatch[1]); $i < $length; $i++)
			{
				$tagContent = str_replace(Array("&amp;", "&gt;", "&lt;", "&apos;", "&quot;"), Array("&", ">", "<", "'", '"'), $arMatch[2][$i]);
				$arWizardConfig[$arMatch[1][$i]] = $tagContent;
			}
		}

		return $arWizardConfig;
	}


}
