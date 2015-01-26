<?
##############################################
# Bitrix Site Manager Forum					 #
# Copyright (c) 2002-2009 Bitrix			 #
# http://www.bitrixsoft.com					 #
# mailto:admin@bitrixsoft.com				 #
##############################################
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_before.php");
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/vote/prolog.php");
$VOTE_RIGHT = $APPLICATION->GetGroupRight("vote");
if($VOTE_RIGHT=="D") $APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/vote/include.php");

IncludeModuleLangFile(__FILE__);
$err_mess = "File: ".__FILE__."<br>Line: ";
define("HELP_FILE","vote_list.php");
$old_module_version = CVote::IsOldVersion();

/********************************************************************
				Actions
********************************************************************/
$VOTE_ID = intval($VOTE_ID);
$z = $DB->Query("SELECT ID FROM b_vote WHERE ID='$VOTE_ID'", false, $err_mess.__LINE__);
if (!($zr=$z->Fetch())) 
{
	require_once ($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");
	echo "<a href='vote_list.php?lang=".LANGUAGE_ID."' class='navchain'>".GetMessage("VOTE_VOTE_LIST")."</a>";
	echo ShowError(GetMessage("VOTE_NOT_FOUND"));
	require_once ($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");
	die();
}
if ($old_module_version=="Y")
{
	if ($REQUEST_METHOD=="GET" && strlen($save)>0 && $VOTE_RIGHT=="W" && check_bitrix_sessid())
	{
		$DB->PrepareFields("b_vote");
		$arFields = array(
			"TIMESTAMP_X"		=> $DB->GetNowFunction(),
			"RESULT_TEMPLATE"	=> "'".$str_RESULT_TEMPLATE."'"
			);
		$DB->Update("b_vote",$arFields,"WHERE ID='".$VOTE_ID."'",$err_mess.__LINE__);
	}
}

$z = CVote::GetByID($VOTE_ID);
$zr = $z->Fetch();
$t = CVoteChannel::GetByID($zr["CHANNEL_ID"]);
$tr = $t->Fetch();

if ($RESULT_TEMPLATE=="") $RESULT_TEMPLATE=$zr["RESULT_TEMPLATE"];
/********************************************************************
				Form
********************************************************************/
$APPLICATION->SetTitle(str_replace("#ID#","$VOTE_ID",GetMessage("VOTE_PAGE_TITLE")));
require_once ($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");

$aMenu = array(
	array(
		"TEXT"	=> GetMessage("VOTE_VOTE_LIST"),
		"ICON"	=> "btn_list",
		"LINK"	=> "/bitrix/admin/vote_list.php?lang=".LANGUAGE_ID
	)
);

$aMenu[] = array("SEPARATOR"=>"Y");

$aMenu[] = array(
	"TEXT"			=> GetMessage("VOTE_QUESTIONS")." [".$zr["QUESTIONS"]."]",
	"LINK"			=> "/bitrix/admin/vote_question_list.php?lang=".LANGUAGE_ID."&VOTE_ID=".$VOTE_ID,
	"ICON"	=> "btn_list",
	"TEXT_PARAM"	=> " [<a title='".GetMessage("VOTE_QUESTIONS_ADD")."' class=submenutext href='/bitrix/admin/vote_question_edit.php?lang=".LANGUAGE_ID."&VOTE_ID=".$VOTE_ID."'>+</a>]",
	);

$aMenu[] = array(
	"TEXT"			=> GetMessage("VOTE_PREVIEW"),
	"LINK"			=> "/bitrix/admin/vote_preview.php?lang=".LANGUAGE_ID."&VOTE_ID=".$VOTE_ID
	);

echo ShowError($strError);

$context = new CAdminContextMenu($aMenu);
$context->Show();

if ($old_module_version=="Y"):?>

	<form name="form1" action="" method="get">
	<input type="hidden" name="VOTE_ID" value="<?=intval($VOTE_ID)?>">
	<input type="hidden" name="lang" value="<?=LANGUAGE_ID?>">
	<?=bitrix_sessid_post();?>
	<?=GetMessage("VOTE_TEMPLATE")?><?
	echo SelectBoxFromArray("RESULT_TEMPLATE", GetTemplateList("RV"), htmlspecialcharsbx($RESULT_TEMPLATE), "","",true);
	?>&nbsp;<input <?if ($VOTE_RIGHT<"W") echo "disabled"?> type="submit" name="save" value="<?=GetMessage("VOTE_SAVE")?>">
	</form>
	<?
	ShowVoteResults($VOTE_ID,$RESULT_TEMPLATE);
else:
	$APPLICATION->IncludeComponent("bitrix:voting.result", "with_description", array(
		"VOTE_ID" => $VOTE_ID,
		"CACHE_TYPE" => "N",
		"VOTE_ALL_RESULTS" => 'Y'
		)
	);
endif;
require_once ($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php"); 
?>
