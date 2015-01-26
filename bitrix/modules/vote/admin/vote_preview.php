<?
##############################################
# Bitrix Site Manager Forum                  #
# Copyright (c) 2002-2009 Bitrix             #
# http://www.bitrixsoft.com                  #
# mailto:admin@bitrixsoft.com                #
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
if ($VOTE_ID<=0) $VOTE_ID = intval($PUBLIC_VOTE_ID);
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
			"TEMPLATE"			=> "'".$str_TEMPLATE."'"
			);
		$DB->Update("b_vote",$arFields,"WHERE ID='".$VOTE_ID."'",$err_mess.__LINE__);
	}
}

$z = CVote::GetByID($VOTE_ID);
$zr = $z->Fetch();
$t = CVoteChannel::GetByID($zr["CHANNEL_ID"]);
$tr = $t->Fetch();

if ($TEMPLATE=="") $TEMPLATE=$zr["TEMPLATE"];
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
	"ICON"	=> "btn_list",
	"LINK"			=> "/bitrix/admin/vote_question_list.php?lang=".LANGUAGE_ID."&VOTE_ID=".$VOTE_ID,
	);

$aMenu[] = array(
	"TEXT"			=> GetMessage("VOTE_RESULTS"),
	"LINK"			=> "/bitrix/admin/vote_results.php?lang=".LANGUAGE_ID."&VOTE_ID=".$VOTE_ID
	);

$context = new CAdminContextMenu($aMenu);
$context->Show();
echo ShowError($strError);

/*
?>
<br>
<table cellspacing="0" cellpadding="2">
	<tr>
		<td><b><?=GetMessage("VOTE_VOTE")?></b></td>
		<td>[<a href="vote_edit.php?lang=<?=LANGUAGE_ID?>&ID=<?=$VOTE_ID?>"><?echo $VOTE_ID?></a>]&nbsp;<?
		if (strlen($zr["TITLE"])>0) echo htmlspecialcharsbx($zr["TITLE"]);
		elseif ($zr["DESCRIPTION_TYPE"]=="html")
			echo htmlspecialcharsbx(TruncateText(strip_tags($zr["DESCRIPTION"]),200));
		else
			echo htmlspecialcharsbx(TruncateText($zr["DESCRIPTION"],200));
		?></td>
	</tr>
	<tr>
		<td><b><?=GetMessage("VOTE_CHANNEL")?></b></td>
		<td><?="[<a class='tablebodylink' href='vote_channel_edit.php?ID=".$zr["CHANNEL_ID"]."&lang=".LANGUAGE_ID."'>".$zr["CHANNEL_ID"]."</a>] ".htmlspecialcharsbx($tr["TITLE"])?></td>
	</tr>
</table>
<?
*/
if ($old_module_version=="Y"):?>
	
	<form name="form1" action="<?=$APPLICATION->GetCurPage()?>" method="get">
	<input type="hidden" name="VOTE_ID" value="<?=intval($VOTE_ID)?>">
	<input type="hidden" name="lang" value="<?=LANGUAGE_ID?>">
	<?=GetMessage("VOTE_TEMPLATE")?><?
	echo SelectBoxFromArray("TEMPLATE", GetTemplateList(), htmlspecialcharsbx($TEMPLATE), "","",true);
	?>&nbsp;<input <?if ($VOTE_RIGHT<"W") echo "disabled"?> type="submit" name="save" value="<?=GetMessage("VOTE_SAVE")?>">
	<?echo bitrix_sessid_post()?>
	</form>
<?
	ShowVote($VOTE_ID,$TEMPLATE); 
else:
	$APPLICATION->IncludeComponent("bitrix:voting.form", "with_description", array(
		"VOTE_ID" => $VOTE_ID,
		"VOTE_RESULT_TEMPLATE" => "vote_results.php?VOTE_ID=".$VOTE_ID,
		"CACHE_TYPE" => "N",
		)
	);
endif;
require_once ($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php"); 
?>