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
$abs_path = CSite::GetSiteDocRoot($site).$file;

if(strpos($file, "/bitrix/") !== 0 || strpos($file, "/lang/") === false/* || GetFileExtension($file) <> "php"*/)
	$strError = GetMessage("trans_edit_err")."<br>";
		
if($strError == "")
{
	$aTabs = array(
		array("DIV" => "edit1", "TAB" => GetMessage("TRANS_TITLE"), "ICON" => "translate_edit", "TITLE" => GetMessage("TRANS_TITLE_TITLE")),
	);
	$tabControl = new CAdminTabControl("tabControl", $aTabs);
	
	// form a way to get back
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

$filesrc_tmp = $APPLICATION->GetFileContent($abs_path);

if ($_SERVER['REQUEST_METHOD'] == 'POST') 
{
	if(!check_bitrix_sessid())
	{
		$strError = GetMessage("TR_SESSION_EXPIRED");
		$bVarsFromForm = true;
	}
	else 
	{   
		$filesrc_for_save = $filesrc_tmp;
		if (isset($_POST['filesrc'])) 
			$filesrc_for_save = $_POST['filesrc'];
	}

	if($strError == '')
	{
		if (!TR_BACKUP($file)) {
			$strError = GetMessage("TR_CREATE_BACKUP_ERROR", array('%FILE%' => $file));
		} else {
			if(!$APPLICATION->SaveFileContent($abs_path, $filesrc_for_save))
			{
				if($APPLICATION->GetException())
				{
					$str_err = $APPLICATION->GetException();
					if ($str_err && ($err = $str_err->GetString()))
						$strError = $err;
				}
				if($strError == '')
					$strError = GetMessage("TR_FILE_SAVE_ERROR");
			}
		}
		if ($strError == '')
		{
			if(isset($_REQUEST['apply']))
			{
				if(strlen($back_url)>0 && strpos($back_url, "/bitrix/admin/fileman_file_edit.php")!==0)
					LocalRedirect("/".ltrim($back_url, "/"));
				LocalRedirect("/bitrix/admin/translate_edit_php.php?lang=".LANGUAGE_ID.'&file='.$file);
			}
			else
			{
				LocalRedirect("/bitrix/admin/translate_list.php?lang=".LANGUAGE_ID."&path=/".implode("/",$arPath)."/"."&".bitrix_sessid_get());
			}
		} 
		else 
		{
			CAdminMessage::ShowMessage($strError);
			require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");
			die();		
		}

		$filesrc_tmp = $filesrc_for_save;
	}				
	
	if (isset($_REQUEST['apply'])) 
		$filesrc_tmp = $_REQUEST['filesrc'];
}

$filesrc = $filesrc_tmp;

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
	"TEXT"	=> GetMessage("TR_FILE_SHOW"),
	"LINK"	=> "/bitrix/admin/translate_show_php.php?lang=".LANGUAGE_ID."&file=$file&".bitrix_sessid_get(),
	"TITLE"	=> GetMessage("TR_FILE_SHOW_TITLE"),
	"ICON"	=> ""
	);	
$context = new CAdminContextMenu($aMenu);
$context->Show();
?>
<p><?=$chain?></p>
<form name="form1" method="POST" action="<?=$APPLICATION->GetCurPage()?>?file=<?=htmlspecialcharsbx($file)?>&amp;lang=<?=LANGUAGE_ID?>">
<?=bitrix_sessid_post()?>
<?
$tabControl->Begin();
$tabControl->BeginNextTab();
?>
		<tr><td>
			<textarea name="filesrc" rows="37" style="width:100%; overflow:auto;" wrap="OFF"><?echo htmlspecialcharsbx($filesrc)?></textarea>
		</td></tr>
<?

$tabControl->Buttons(
	array(
		"disabled" => $only_read,
		"back_url" => "/bitrix/admin/translate_list.php?lang=".LANGUAGE_ID."&path=/".implode("/",$arPath)."/"."&".bitrix_sessid_get()
	)
);
$tabControl->End();
?>

</form>
<?
require_once ($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");
?>