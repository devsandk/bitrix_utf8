<?
/*
##############################################
# Bitrix: SiteManager                        #
# Copyright (c) 2004 - 2006 Bitrix           #
# http://www.bitrix.ru                       #
# mailto:admin@bitrix.ru                     #
##############################################
*/

require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_before.php");

$sTableID = "tbl_form_view";
$oSort = new CAdminSorting($sTableID, "ID", "asc");

require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/form/prolog.php");

$FORM_RIGHT = $APPLICATION->GetGroupRight("form");
if($FORM_RIGHT=="D") $APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));

CModule::IncludeModule('form');

$strError = ''; $strNote = '';

ClearVars();

IncludeModuleLangFile(__FILE__);
$err_mess = "File: ".__FILE__."<br>Line: ";
define("HELP_FILE","form_list.php");
$bSimple = (COption::GetOptionString("form", "SIMPLE", "Y") == "Y") ? true : false;

/***************************************************************************
                           GET | POST
****************************************************************************/

$arrShowTemplate = CForm::GetTemplateList("SHOW");
if (is_array($arrShowTemplate) && count($arrShowTemplate["reference"])>0)
	$old_module_version = "Y";

$WEB_FORM_ID = intval($WEB_FORM_ID);
$arForm = CForm::GetByID_admin($WEB_FORM_ID);
if (false === $arForm)
{
	require_once ($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");
	echo "<a href='form_list.php?lang=".LANGUAGE_ID."'>".GetMessage("FORM_FORM_LIST")."</a>";
	echo ShowError(GetMessage("FORM_NOT_FOUND"));
	require_once ($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");
	die();
}

$F_RIGHT = CForm::GetPermission($WEB_FORM_ID);

if($old_module_version=="Y")
{
	if($REQUEST_METHOD == "GET" && strlen($save)>0 && $F_RIGHT >= 30 && check_bitrix_sessid())
	{
		$DB->PrepareFields("b_form");
		$arFields = array(
			"TIMESTAMP_X"		=> $DB->GetNowFunction(),
			"SHOW_TEMPLATE"		=> "'".$DB->ForSql($str_SHOW_TEMPLATE)."'"
			);

		$DB->Update("b_form",$arFields,"WHERE ID='".$WEB_FORM_ID."'",$err_mess.__LINE__);
	}
}
else
{
	// fix redirect bug
	ob_start();
}
if ($SHOW_TEMPLATE=="") $SHOW_TEMPLATE = $arForm["SHOW_TEMPLATE"];

/***************************************************************************
							   HTML form
****************************************************************************/

$title = ($old_module_version=="Y") ? str_replace("#ID#","$WEB_FORM_ID",GetMessage("FORM_PAGE_TITLE")) : GetMessage("FORM_PAGE_TITLE_NEW");
$APPLICATION->SetTitle($title);

$APPLICATION->SetAdditionalCSS('/bitrix/components/bitrix/main.calendar/templates/.default/style.css');

require_once ($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");

$context = new CAdminContextMenuList($arForm['ADMIN_MENU']);
$context->Show();

echo BeginNote('width="100%"');
?>
<b><?=GetMessage("FORM_FORM_NAME")?></b> [<a title='<?=GetMessage("FORM_EDIT_FORM")?>' href='form_edit.php?lang=<?=LANGUAGE_ID?>&ID=<?=$WEB_FORM_ID?>'><?=$WEB_FORM_ID?></a>]&nbsp;(<?=htmlspecialcharsbx($arForm["SID"])?>)&nbsp;<?=htmlspecialcharsbx($arForm["NAME"])?>
<?
echo EndNote();

if ($old_module_version=="Y") :?>
<?
echo ShowError($strError);
echo ShowNote($strNote);
?>
<form name="form1" action="" method="get">
<?echo bitrix_sessid_post();?>
<input type="hidden" name="WEB_FORM_ID" value="<?=intval($WEB_FORM_ID)?>">
<input type="hidden" name="lang" value="<?=LANGUAGE_ID?>">
<?=GetMessage("FORM_SHOW_TEMPLATE")?><?
echo SelectBoxFromArray("SHOW_TEMPLATE", $arrShowTemplate, htmlspecialcharsbx($SHOW_TEMPLATE), "","",true);
?>&nbsp;<input <?if ($F_RIGHT<30) echo "disabled"?> type="submit" name="save" value="<?=GetMessage("FORM_SAVE")?>">
</form>
<?endif;?>

<?
if ($old_module_version == "Y")
{
	CForm::Show($arForm["SID"],false,$SHOW_TEMPLATE,"N");
}
else
{
	/*
	$APPLICATION->IncludeFile(
		"form/result_new/default.php",
		array(
				"WEB_FORM_ID" => $WEB_FORM_ID,
				"LIST_URL" => "form_result_list.php",
				"EDIT_URL" => "form_result_edit.php",
			)
		);
	*/
	$APPLICATION->IncludeComponent(
		"bitrix:form.result.new",
		"",
		array(
				"WEB_FORM_ID" => $WEB_FORM_ID,
				"LIST_URL" => "form_result_list.php?lang=".LANG,
				"EDIT_URL" => "form_result_edit.php?lang=".LANG,
				"CACHE_TIME" => 0,
			)
	);
}

require_once ($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");
?>