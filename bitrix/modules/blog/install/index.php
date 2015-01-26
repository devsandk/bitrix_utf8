<?
global $MESS;
$strPath2Lang = str_replace("\\", "/", __FILE__);
$strPath2Lang = substr($strPath2Lang, 0, strlen($strPath2Lang)-strlen("/install/index.php"));
include(GetLangFileName($strPath2Lang."/lang/", "/install/index.php"));

Class blog extends CModule
{
	var $MODULE_ID = "blog";
	var $MODULE_VERSION;
	var $MODULE_VERSION_DATE;
	var $MODULE_NAME;
	var $MODULE_DESCRIPTION;
	var $MODULE_CSS;
	var $MODULE_GROUP_RIGHTS = "Y";

	function blog()
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
			$this->MODULE_VERSION = BLOG_VERSION;
			$this->MODULE_VERSION_DATE = BLOG_VERSION_DATE;
		}

		$this->MODULE_NAME = GetMessage("BLOG_INSTALL_NAME");
		$this->MODULE_DESCRIPTION = GetMessage("BLOG_INSTALL_DESCRIPTION");
	}

	function InstallUserFields()
	{
		global $USER_FIELD_MANAGER;
		$errors = null;

		$arFields = array(
			"BLOG_POST" => array(
				"ENTITY_ID" => "BLOG_POST",
				"FIELD_NAME" => "UF_BLOG_POST_DOC",
				"XML_ID" => "UF_BLOG_POST_DOC"
			),
			"BLOG_COMMENT" => array(
				"ENTITY_ID" => "BLOG_COMMENT",
				"FIELD_NAME" => "UF_BLOG_COMMENT_DOC",
				"XML_ID" => "UF_BLOG_COMMENT_DOC"
			),
		);

		$arFieldProps = Array(
			"USER_TYPE_ID" => "file",
			"SORT" => 100,
			"MULTIPLE" => "Y",
			"MANDATORY" => "N",
			"SHOW_FILTER" => "N",
			"SHOW_IN_LIST" => "N",
			"EDIT_IN_LIST" => "Y",
			"IS_SEARCHABLE" => "Y",
			"SETTINGS" => array(),
			"EDIT_FORM_LABEL" => "",
			"LIST_COLUMN_LABEL" => "",
			"LIST_FILTER_LABEL" => "",
			"ERROR_MESSAGE" => "",
			"HELP_MESSAGE" => "",
			"MAX_ALLOWED_SIZE" => COption::GetOptionString("blog", "image_max_size", "5000000"),
		);

		foreach ($arFields as $fieldName => $arField)
		{
			$rsData = CUserTypeEntity::GetList(array($by=>$order), $arField);
			if ($arRes = $rsData->Fetch())
			{
				$intID = $arRes['ID'];
			}
			else
			{
				$arProps = $arFieldProps + $arField;
				$obUserField  = new CUserTypeEntity;
				$intID = $obUserField->Add($arProps, false);

				if (false == $intID)
				{
					if ($strEx = $GLOBALS['APPLICATION']->GetException())
					{
						$errors = $strEx->GetString();
					}
				}
			}
		}

		if (is_null($errors))
		{
			$rsData = CUserTypeEntity::GetList(
				array($by=>$order), 
				array(
					"ENTITY_ID" => "BLOG_POST",
					"XML_ID" => "UF_GRATITUDE"
				)
			);
			if ($arRes = $rsData->Fetch())
				$intID = $arRes['ID'];
			else
			{
				$arFieldProps = Array(
					"ENTITY_ID" => "BLOG_POST",
					"FIELD_NAME" => "UF_GRATITUDE",
					"XML_ID" => "UF_GRATITUDE",			
					"USER_TYPE_ID" => "integer",
					"SORT" => 100,
					"MULTIPLE" => "N",
					"MANDATORY" => "N",
					"SHOW_FILTER" => "N",
					"SHOW_IN_LIST" => "N",
					"EDIT_IN_LIST" => "Y",
					"IS_SEARCHABLE" => "N",
					"SETTINGS" => array(),
					"EDIT_FORM_LABEL" => "",
					"LIST_COLUMN_LABEL" => "",
					"LIST_FILTER_LABEL" => "",
					"ERROR_MESSAGE" => "",
					"HELP_MESSAGE" => "",
				);

				$obUserField  = new CUserTypeEntity;
				$intID = $obUserField->Add($arFieldProps, false);

				if (
					(false == $intID)
					&& ($strEx = $GLOBALS['APPLICATION']->GetException())
				)
					$errors = $strEx->GetString();
			}
		}

		return $errors;
	}

	function InstallDB($install_wizard = true)
	{
		global $DB, $DBType, $APPLICATION, $install_smiles;

		if (!$DB->Query("SELECT 'x' FROM b_blog_user_group", true))
		{
			$errors = $DB->RunSQLBatch($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/blog/install/".$DBType."/install.sql");
			COption::SetOptionString("blog", "socNetNewPerms", "Y");
		}

		if (empty($errors))
		{
			$errors = $this->InstallUserFields();
		}

		if (!empty($errors))
		{
			$APPLICATION->ThrowException(implode("", $errors));
			return false;
		}

		RegisterModule("blog");
		RegisterModuleDependences("search", "OnReindex", "blog", "CBlogSearch", "OnSearchReindex");
		RegisterModuleDependences("main", "OnUserDelete", "blog", "CBlogUser", "Delete");
		RegisterModuleDependences("main", "OnSiteDelete", "blog", "CBlogSitePath", "DeleteBySiteID");

		RegisterModuleDependences("socialnetwork", "OnSocNetGroupDelete", "blog", "CBlogSoNetPost", "OnGroupDelete");

		RegisterModuleDependences("socialnetwork", "OnSocNetFeaturesAdd", "blog", "CBlogSearch", "SetSoNetFeatureIndexSearch");
		RegisterModuleDependences("socialnetwork", "OnSocNetFeaturesUpdate", "blog", "CBlogSearch", "SetSoNetFeatureIndexSearch");
		RegisterModuleDependences("socialnetwork", "OnSocNetFeaturesPermsAdd", "blog", "CBlogSearch", "SetSoNetFeaturePermIndexSearch");
		RegisterModuleDependences("socialnetwork", "OnSocNetFeaturesPermsUpdate", "blog", "CBlogSearch", "SetSoNetFeaturePermIndexSearch");

		RegisterModuleDependences("main", "OnAfterAddRating", 	"blog", "CRatingsComponentsBlog", "OnAfterAddRating", 200);
		RegisterModuleDependences("main", "OnAfterUpdateRating", "blog", "CRatingsComponentsBlog", "OnAfterUpdateRating", 200);
		RegisterModuleDependences("main", "OnSetRatingsConfigs", "blog", "CRatingsComponentsBlog", "OnSetRatingConfigs", 200);
		RegisterModuleDependences("main", "OnGetRatingsConfigs", "blog", "CRatingsComponentsBlog", "OnGetRatingConfigs", 200);
		RegisterModuleDependences("main", "OnGetRatingsObjects", "blog", "CRatingsComponentsBlog", "OnGetRatingObject", 200);

		RegisterModuleDependences("main", "OnGetRatingContentOwner", "blog", "CRatingsComponentsBlog", "OnGetRatingContentOwner", 200);
		RegisterModuleDependences("im", "OnGetNotifySchema", "blog", "CBlogNotifySchema", "OnGetNotifySchema");

		CModule::IncludeModule("blog");
		if (CModule::IncludeModule("search"))
			CSearch::ReIndexModule("blog");

		if($install_smiles == "Y" || $install_wizard)
		{
			$dbSmile = CBlogSmile::GetList();
			if(!($dbSmile->Fetch()))
			{

				$arSmile = Array(
					Array(
						"TYPING" => ":D :-D",
						"IMAGE" => "icon_biggrin.png",
						"FICON_SMILE" => "FICON_BIGGRIN",
						"SORT" => "120",
					),
					Array(
						"TYPING" => ":) :-)",
						"IMAGE" => "icon_smile.png",
						"FICON_SMILE" => "FICON_SMILE",
						"SORT" => "100",
					),
					Array(
						"TYPING" => ":( :-(",
						"IMAGE" => "icon_sad.png",
						"FICON_SMILE" => "FICON_SAD",
						"SORT" => "140",
					),
					Array(
						"TYPING" => ":o :-o :shock:",
						"IMAGE" => "icon_eek.png",
						"FICON_SMILE" => "FICON_EEK",
						"SORT" => "180",
					),
					Array(
						"TYPING" => "8) 8-)",
						"IMAGE" => "icon_cool.png",
						"FICON_SMILE" => "FICON_COOL",
						"SORT" => "130",
					),
					Array(
						"TYPING" => ":{} :-{}",
						"IMAGE" => "icon_kiss.png",
						"FICON_SMILE" => "FICON_KISS",
						"SORT" => "200",
					),
					Array(
						"TYPING" => ":oops:",
						"IMAGE" => "icon_redface.png",
						"FICON_SMILE" => "FICON_REDFACE",
						"SORT" => "190",
					),
					Array(
						"TYPING" => ":cry: :~(",
						"IMAGE" => "icon_cry.png",
						"FICON_SMILE" => "FICON_CRY",
						"SORT" => "160",
					),
					Array(
						"TYPING" => ":evil: >:-<",
						"IMAGE" => "icon_evil.png",
						"FICON_SMILE" => "FICON_EVIL",
						"SORT" => "170",
					),
					Array(
						"TYPING" => ";) ;-)",
						"IMAGE" => "icon_wink.png",
						"FICON_SMILE" => "FICON_WINK",
						"SORT" => "110",
					),
					Array(
						"TYPING" => ":!:",
						"IMAGE" => "icon_exclaim.png",
						"FICON_SMILE" => "FICON_EXCLAIM",
						"SORT" => "220",
					),
					Array(
						"TYPING" => ":?:",
						"IMAGE" => "icon_question.png",
						"FICON_SMILE" => "FICON_QUESTION",
						"SORT" => "210",
					),
					Array(
						"TYPING" => ":idea:",
						"IMAGE" => "icon_idea.png",
						"FICON_SMILE" => "FICON_IDEA",
						"SORT" => "230",
					),
					Array(
						"TYPING" => ":| :-|",
						"IMAGE" => "icon_neutral.png",
						"FICON_SMILE" => "FICON_NEUTRAL",
						"SORT" => "150",
					),
				);
				$arLang = Array();
				$dbLangs = CLanguage::GetList(($b = ""), ($o = ""), array("ACTIVE" => "Y"));
				while ($arLangs = $dbLangs->Fetch())
				{
					IncludeModuleLangFile($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/blog/install/smiles.php", $arLangs["LID"]);

					foreach($arSmile as $key => $val)
					{
						$arSmile[$key]["LANG"][] = Array("LID" => $arLangs["LID"], "NAME" => GetMessage($val["FICON_SMILE"]));
					}
				}

				foreach($arSmile as $val)
				{
					$val["SMILE_TYPE"] = "S";
					$val["CLICKABLE"] = "Y";

					$val["IMAGE_WIDTH"] = 16;
					$val["IMAGE_HEIGHT"] = 16;

					$id = CBlogSmile::Add($val);
				}

			}
		}

		return true;
	}

	function UnInstallDB($arParams = Array())
	{
		global $DB, $DBType, $APPLICATION;
		if(array_key_exists("savedata", $arParams) && $arParams["savedata"] != "Y")
		{
			$errors = $DB->RunSQLBatch($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/blog/install/".$DBType."/uninstall.sql");

			if (!empty($errors))
			{
				$APPLICATION->ThrowException(implode("", $errors));
				return false;
			}
			else
			{
				$this->UnInstallUserFields();
			}

		}
		if (CModule::IncludeModule("search"))
			CSearch::DeleteIndex("blog");

		UnRegisterModuleDependences("search", "OnReindex", "blog", "CBlogSearch", "OnSearchReindex");
		UnRegisterModuleDependences("main", "OnUserDelete", "blog", "CBlogUser", "Delete");
		UnRegisterModuleDependences("main", "OnSiteDelete", "blog", "CBlogSitePath", "DeleteBySiteID");

		UnRegisterModuleDependences("socialnetwork", "OnSocNetGroupDelete", "blog", "CBlogSoNetPost", "OnGroupDelete");
		UnRegisterModuleDependences("socialnetwork", "OnSocNetFeaturesAdd", "blog", "CBlogSearch", "SetSoNetFeatureIndexSearch");
		UnRegisterModuleDependences("socialnetwork", "OnSocNetFeaturesUpdate", "blog", "CBlogSearch", "SetSoNetFeatureIndexSearch");
		UnRegisterModuleDependences("socialnetwork", "OnSocNetFeaturesPermsAdd", "blog", "CBlogSearch", "SetSoNetFeaturePermIndexSearch");
		UnRegisterModuleDependences("socialnetwork", "OnSocNetFeaturesPermsUpdate", "blog", "CBlogSearch", "SetSoNetFeaturePermIndexSearch");

		UnRegisterModuleDependences("main", "OnAfterAddRating",    "blog", "CRatingsComponentsBlog", "OnAfterAddRating");
		UnRegisterModuleDependences("main", "OnAfterUpdateRating", "blog", "CRatingsComponentsBlog", "OnAfterUpdateRating");
		UnRegisterModuleDependences("main", "OnSetRatingsConfigs", "blog", "CRatingsComponentsBlog", "OnSetRatingConfigs");
		UnRegisterModuleDependences("main", "OnGetRatingsConfigs", "blog", "CRatingsComponentsBlog", "OnGetRatingConfigs");
		UnRegisterModuleDependences("main", "OnGetRatingsObjects", "blog", "CRatingsComponentsBlog", "OnGetRatingObject");
		
		UnRegisterModuleDependences("main", "OnGetRatingContentOwner", "blog", "CRatingsComponentsBlog", "OnGetRatingContentOwner");
		UnRegisterModuleDependences("im", "OnGetNotifySchema", "blog", "CBlogNotifySchema", "OnGetNotifySchema");

		UnRegisterModule("blog");

		return true;
	}

	function UnInstallUserFields()
	{
		global $USER_FIELD_MANAGER;
		$errors = null;

		$arFields = array(
			"BLOG_POST" => array(
				"ENTITY_ID" => "BLOG_POST",
				"FIELD_NAME" => "UF_BLOG_POST_DOC",
				"XML_ID" => "UF_BLOG_POST_DOC"
			),
			"BLOG_COMMENT" => array(
				"ENTITY_ID" => "BLOG_COMMENT",
				"FIELD_NAME" => "UF_BLOG_COMMENT_DOC",
				"XML_ID" => "UF_BLOG_COMMENT_DOC"
			),
		);

		foreach ($arFields as $fieldName => $arField)
		{
			$rsData = CUserTypeEntity::GetList(array($by=>$order), $arField);
			if ($arRes = $rsData->Fetch())
			{
				$ent = new CUserTypeEntity;
				$ent->Delete($arRes['ID']);
			}
		}
		return $errors;
	}

	function InstallEvents()
	{

		global $DB;
		$sIn = "'NEW_BLOG_COMMENT', 'NEW_BLOG_COMMENT2COMMENT', 'NEW_BLOG_MESSAGE'";
		$rs = $DB->Query("SELECT count(*) C FROM b_event_type WHERE EVENT_NAME IN (".$sIn.") ", false, "File: ".__FILE__."<br>Line: ".__LINE__);
		$ar = $rs->Fetch();
		if($ar["C"] <= 0)
		{
			include($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/blog/install/events/set_events.php");
		}
		return true;
	}

	function UnInstallEvents()
	{
		global $DB;
		include_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/blog/install/events/del_events.php");
		return true;
	}

	function InstallFiles()
	{
		global $install_public, $public_rewrite, $public_dir;
		if($_ENV["COMPUTERNAME"]!='BX')
		{
			CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/blog/install/admin", $_SERVER["DOCUMENT_ROOT"]."/bitrix/admin", true);
			CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/blog/install/images",  $_SERVER["DOCUMENT_ROOT"]."/bitrix/images/blog", true, True);
			CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/blog/install/themes", $_SERVER["DOCUMENT_ROOT"]."/bitrix/themes", true, true);
			CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/blog/install/components", $_SERVER["DOCUMENT_ROOT"]."/bitrix/components", true, true);
			CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/blog/install/public/templates", $_SERVER["DOCUMENT_ROOT"]."/bitrix/templates", true, true);
		}

		$install_public = (($install_public == "Y") ? "Y" : "N");
		$errors = false;

		$arSite = Array();
		$public_installed = false;
		$dbSites = CSite::GetList(($b = ""), ($o = ""), Array("ACTIVE" => "Y"));
		while ($site = $dbSites->Fetch())
		{
			$arSite[] = Array(
				"LANGUAGE_ID" => $site["LANGUAGE_ID"],
				"ABS_DOC_ROOT" => $site["ABS_DOC_ROOT"],
				"DIR" => $site["DIR"],
				"SITE_ID" => $site["LID"],
				"SERVER_NAME" =>$site["SERVER_NAME"],
				"NAME" => $site["NAME"]
			);
		}

		foreach($arSite as $fSite)
		{
			global ${"install_public_".$fSite["SITE_ID"]};
			global ${"public_path_".$fSite["SITE_ID"]};
			global ${"public_rewrite_".$fSite["SITE_ID"]};
			global ${"is404_".$fSite["SITE_ID"]};

			if (${"install_public_".$fSite["SITE_ID"]} == "Y" && !empty(${"public_path_".$fSite["SITE_ID"]}))
			{
				$public_dir = ${"public_path_".$fSite["SITE_ID"]};
				$bReWritePublicFiles = ${"public_rewrite_".$fSite["SITE_ID"]};
				$folder = (${"is404_".$fSite["SITE_ID"]}=="Y")?"SEF":"NSEF";

				CopyDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/blog/install/public/".$folder, $fSite['ABS_DOC_ROOT'].$fSite["DIR"].$public_dir, $bReWritePublicFiles, true);
				if ($folder == "SEF")
				{
					if (file_exists($fSite['ABS_DOC_ROOT'].$fSite["DIR"].$public_dir."/index.php"))
					{

						if (!function_exists("file_get_contents"))
						{
							function file_get_contents($filename)
							{
								$fd = fopen("$filename", "rb");
								$content = fread($fd, filesize($filename));
								fclose($fd);
								return $content;
							}
						}

						$file = file_get_contents($fSite['ABS_DOC_ROOT'].$fSite["DIR"].$public_dir."/index.php");
						if ($file)
						{
							$file = str_replace("#SEF_FOLDER#", "/".$public_dir."/", $file);
							if ($f = fopen($fSite['ABS_DOC_ROOT'].$fSite["DIR"].$public_dir."/index.php", "w"))
							{
								@fwrite($f, $file);
								@fclose($f);
							}
						}
					}
					$arFields = array(
						"CONDITION" => "#^/".$public_dir."/#",
						"RULE" => "",
						"ID" => "bitrix:blog",
						"PATH" => "/".$public_dir."/index.php"
					);
					CUrlRewriter::Add($arFields);
				}
				$public_installed = true;
			}
		}
		return true;
	}

	function UnInstallFiles()
	{
		if($_ENV["COMPUTERNAME"]!='BX')
		{
			DeleteDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/blog/install/admin", $_SERVER["DOCUMENT_ROOT"]."/bitrix/admin");
			DeleteDirFiles($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/blog/install/themes/.default/", $_SERVER["DOCUMENT_ROOT"]."/bitrix/themes/.default");//css
			DeleteDirFilesEx("/bitrix/themes/.default/icons/blog/");//icons
			DeleteDirFilesEx("/bitrix/images/blog/");//images
		}

		return true;
	}

	function DoInstall()
	{
		global $APPLICATION, $step;
		$step = IntVal($step);
		if ($step < 2)
			$APPLICATION->IncludeAdminFile(GetMessage("BLOG_INSTALL_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/blog/install/step1.php");
		elseif($step==2)
		{
			$this->InstallFiles();
			$this->InstallDB(false);
			$this->InstallEvents();
			$GLOBALS["errors"] = $this->errors;

			$APPLICATION->IncludeAdminFile(GetMessage("BLOG_INSTALL_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/blog/install/step2.php");
		}
	}

	function DoUninstall()
	{
		global $APPLICATION, $step;
		$step = IntVal($step);
		if($step<2)
			$APPLICATION->IncludeAdminFile(GetMessage("BLOG_INSTALL_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/blog/install/unstep1.php");
		elseif($step==2)
		{
			$this->UnInstallDB(array(
				"savedata" => $_REQUEST["savedata"],
			));
			$this->UnInstallFiles();

			if($_REQUEST["saveemails"] != "Y")
				$this->UnInstallEvents();

			$GLOBALS["errors"] = $this->errors;

			$APPLICATION->IncludeAdminFile(GetMessage("BLOG_INSTALL_TITLE"), $_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/blog/install/unstep2.php");
		}
	}

	function GetModuleRightList()
	{
		$arr = array(
			"reference_id" => array("D", /*"K",*/ "N", "R", "W"),
			"reference" => array(
					"[D] ".GetMessage("BLI_PERM_D"),
					//"[K] ".GetMessage("BLI_PERM_K"),
					"[N] ".GetMessage("BLI_PERM_N"),
					"[R] ".GetMessage("BLI_PERM_R"),
					"[W] ".GetMessage("BLI_PERM_W")
				)
			);
		return $arr;
	}
}
?>