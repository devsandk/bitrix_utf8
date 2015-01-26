<?
/*
##############################################
# Bitrix Site Manager                        #
# Copyright (c) 2002-2007 Bitrix             #
# http://www.bitrixsoft.com                  #
# mailto:admin@bitrixsoft.com                #
##############################################
*/
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_before.php");
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/translate/prolog.php");

if(!$USER->CanDoOperation('edit_php')) 
	$APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));

require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/translate/include.php");
IncludeModuleLangFile(__FILE__);

define("HELP_FILE","translate_list.php");

/***************************************************************************
                           GET | POST
***************************************************************************/
$strError = "";
$file = Rel2Abs("/", $file);
$abs_path = CSite::GetSiteDocRoot(false).htmlspecialcharsbx($file);

if(strpos($file, "/bitrix/") !== 0 || strpos($file, "/lang/") === false || GetFileExtension($file) <> "php")
	$strError = GetMessage("trans_edit_err")."<br>";
	
$APPLICATION->SetTitle(GetMessage("TRANS_TITLE"));
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");

if($strError == "")
{
	$aTabs = array(
		array("DIV" => "edit1", "TAB" => GetMessage("TRANS_TITLE"), "ICON" => "translate_edit", "TITLE" => GetMessage("TRANS_TITLE_TITLE")),
	);
	$tabControl = new CAdminTabControl("tabControl", $aTabs);
	
	$chain = "";
	$arPath = array();
	$path_back = dirname($file);
	$arSlash = explode("/",$path_back);
	if (is_array($arSlash))
	{
		$arSlash_tmp = $arSlash;
		$lang_key = array_search("lang", $arSlash) + 1;
		unset($arSlash_tmp[$lang_key]);
		if ($lang_key==sizeof($arSlash)-1)
		{
			unset($arSlash[$lang_key]);
			$path_back = implode("/",$arSlash);
		}
		$i = 0;
		foreach($arSlash_tmp as $dir)
		{
			$i++;
			if ($i==1)
			{
				$chain .= "<a href=\"translate_list.php?lang=".LANGUAGE_ID."&path=/"."&".bitrix_sessid_get()."\" title=\"".GetMessage("TRANS_CHAIN_FOLDER_ROOT")."\">..</a> / ";
			}
			else
			{
				$arPath[] = htmlspecialcharsbx($dir);
				if ($i>2) $chain .= " / ";
				$chain .= "<a href=\"translate_list.php?lang=".LANGUAGE_ID."&path="."/".implode("/",$arPath)."/"."&".bitrix_sessid_get()."\" title=\"".GetMessage("TRANS_CHAIN_FOLDER")."\">".htmlspecialcharsbx($dir)."</a>";
			}
		}
	}	
}

$APPLICATION->SetTitle(GetMessage("TRANS_TITLE"));
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");

if($strError <> "")
{
	CAdminMessage::ShowMessage($strError);
	require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");
	die();
}	


/***************************************************************************
                               HTML
****************************************************************************/
$aMenu = array();
$aMenu[] = Array(
	"TEXT"	=> GetMessage("TRANS_LIST"),
	"LINK"	=> "/bitrix/admin/translate_list.php?lang=".LANGUAGE_ID."&path=/".implode("/",$arPath)."/"."&".bitrix_sessid_get(),
	"TITLE"	=> GetMessage("TRANS_LIST_TITLE"),
	"ICON"	=> "btn_list"
	);

$aMenu[] = Array(
	"TEXT"	=> GetMessage("TR_FILE_EDIT"),
	"LINK"	=> "/bitrix/admin/translate_edit_php.php?lang=".LANGUAGE_ID."&file=$file&".bitrix_sessid_get(),
	"TITLE"	=> GetMessage("TR_FILE_EDIT_TITLE"),
	"ICON"	=> ""
	);	
	
$context = new CAdminContextMenu($aMenu);
$context->Show();
?>
<p><?=$chain?></p>
<?
$tabControl->Begin();

$tabControl->BeginNextTab();

highlight_file($abs_path);

$tabControl->End();
?>

<?require_once ($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php")?>