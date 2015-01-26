<?
/*
##############################################
# Bitrix: SiteManager                        #
# Copyright (c) 2004 - 2009 Bitrix           #
# http://www.bitrix.ru                       #
# mailto:admin@bitrix.ru                     #
##############################################
*/

require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_before.php");

ClearVars();

$sTableID = "tbl_vote";
$oSort = new CAdminSorting($sTableID, "ID", "desc");
$lAdmin = new CAdminList($sTableID, $oSort);

IncludeModuleLangFile(__FILE__);
CModule::IncludeModule("vote");

require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/vote/prolog.php");
$VOTE_RIGHT = $APPLICATION->GetGroupRight("vote");
if ($VOTE_RIGHT <= "D"):
	$APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));
endif;
$arChannels = array();
$arChannelsTitle = array();
$db_res = CVoteChannel::GetList($by1 = "s_c_sort", $order1 = "asc", array(), $is_filtered);
if ($db_res && $res = $db_res->GetNext())
{
	do
	{
		$arChannels[$res["ID"]] = $res;
		$arChannelsTitle[$res["ID"]] = html_entity_decode($res["TITLE"]);
	} while ($res = $db_res->GetNext());
}


$err_mess = "File: ".__FILE__."<br>Line: ";

$arFilterFields = Array(
	"find_id",
	"find_id_exact_match",
	"find_active",
	"find_date_start_1",
	"find_date_start_2",
	"find_date_end_1",
	"find_date_end_2",
	"find_lamp",
	"find_channel",
	"find_channel_exact_match",
	"find_channel_id",
	"find_title",
	"find_title_exact_match",
	"find_description",
	"find_description_exact_match",
	"find_counter_1",
	"find_counter_2");
$arFilter = array();
$lAdmin->InitFilter($arFilterFields);
/********************************************************************
				Functions
********************************************************************/
function CheckFilter()
{
	global $arFilterFields, $message, $lAdmin;
	foreach ($arFilterFields as $s) global $$s;
	$bGotErr = false;

	$find_date_start_1 = trim($find_date_start_1);
	$find_date_start_2 = trim($find_date_start_2);
	$find_date_end_1 = trim($find_date_end_1);
	$find_date_end_2 = trim($find_date_end_2);

	if (strlen($find_date_start_1)>0 || strlen($find_date_start_2)>0)
	{
		// start date
		$date_start_1_stm = MkDateTime(ConvertDateTime($find_date_start_1,"D.M.Y"),"d.m.Y");
		$date_start_2_stm = MkDateTime(ConvertDateTime($find_date_start_2,"D.M.Y")." 23:59:59","d.m.Y H:i:s");
		if (!$date_start_1_stm && strlen(trim($find_date_start_1))>0)
		{
			$bGotErr = true;
			$lAdmin->AddUpdateError(GetMessage("VOTE_WRONG_START_DATE_FROM"));
		}

		if (!$date_start_2_stm && strlen(trim($find_date_start_2))>0)
		{
			$bGotErr = true;
			$lAdmin->AddUpdateError(GetMessage("VOTE_WRONG_START_DATE_TILL"));
		}
		if (!$bGotErr && $date_start_2_stm <= $date_start_1_stm && strlen($date_start_2_stm)>0)
		{
			$bGotErr = true;
			$lAdmin->AddUpdateError(GetMessage("VOTE_WRONG_START_FROM_TILL"));
		}
	}

	if (strlen($find_date_end_1)>0 || strlen($find_date_end_2)>0)
	{
		// end date
		$date_end_1_stm = MkDateTime(ConvertDateTime($find_date_end_1,"D.M.Y"),"d.m.Y");
		$date_end_2_stm = MkDateTime(ConvertDateTime($find_date_end_2,"D.M.Y")." 23:59:59","d.m.Y H:i:s");
		if (!$date_end_1_stm && strlen(trim($find_date_end_1))>0)
		{
			$bGotErr = true;
			$lAdmin->AddUpdateError(GetMessage("VOTE_WRONG_END_DATE_FROM"));
		}
		if (!$date_end_2_stm && strlen(trim($find_date_end_2))>0)
		{
			$bGotErr = true;
			$lAdmin->AddUpdateError(GetMessage("VOTE_WRONG_END_DATE_TILL"));
		}
		if (!$bGotErr && $date_end_2_stm <= $date_end_1_stm && strlen($date_end_2_stm)>0)
		{
			$bGotErr = true;
			$lAdmin->AddUpdateError(GetMessage("VOTE_WRONG_END_FROM_TILL"));
		}
	}

	return ($bGotErr ? false : true);
}

/********************************************************************
				ACTIONS
********************************************************************/
if (intval($reset_id) > 0 && $VOTE_RIGHT >= "W" && check_bitrix_sessid()):
	CVote::Reset($reset_id);
endif;

InitBVar($find_id_exact_match);
InitBVar($find_channel_exact_match);
InitBVar($find_title_exact_match);
InitBVar($find_description_exact_match);

if (CheckFilter()):
	$arFilter = array(
		"ID"						=> $find_id,
		"ID_EXACT_MATCH"			=> $find_id_exact_match,
		"ACTIVE"					=> $find_active,
		"DATE_START_1"				=> $find_date_start_1,
		"DATE_START_2"				=> $find_date_start_2,
		"DATE_END_1"				=> $find_date_end_1,
		"DATE_END_2"				=> $find_date_end_2,
		"LAMP"						=> $find_lamp,
		"CHANNEL_ID"				=> $find_channel_id,
		"CHANNEL"					=> $find_channel,
		"CHANNEL_EXACT_MATCH"		=> $find_channel_exact_match,
		"TITLE"						=> $find_title,
		"TITLE_EXACT_MATCH"			=> $find_title_exact_match,
		"DESCRIPTION"				=> $find_description,
		"DESCRIPTION_EXACT_MATCH"	=> $find_description_exact_match,
		"COUNTER_1"					=> $find_counter_1,
		"COUNTER_2"					=> $find_counter_2
	);
endif;

if ($lAdmin->EditAction() && $VOTE_RIGHT >= "W" && check_bitrix_sessid())
{
	foreach($FIELDS as $ID => $arFields)
	{
		if(!$lAdmin->IsUpdated($ID))
			continue;
		$ID = intVal($ID);
		$arFieldsStore = array(
			"ACTIVE" => $arFields['ACTIVE'],
			"C_SORT" => $arFields['C_SORT'],
			"TITLE" => $arFields['TITLE'],
			"CHANNEL_ID" => $arFields['CHANNEL_ID']);
		if (!CVote::CheckFields("UPDATE", $arFieldsStore, $ID, array("CHECK_INTERSECTION" => "Y"))):
			$err = $GLOBALS['APPLICATION']->GetException();
			$lAdmin->AddUpdateError($ID.": ".$err->GetString(), $ID);
		elseif (!CVote::Update($ID, $arFieldsStore)):
			$lAdmin->AddUpdateError($ID.": ".GetMessage("VOTE_SAVE_ERROR"), $ID);
		endif;
	}
}
// Group actions
if(($arID = $lAdmin->GroupAction()) && $VOTE_RIGHT>="W" && check_bitrix_sessid())
{
	if($_REQUEST['action_target'] == 'selected')
	{
		$arID = Array();
		$rsData = CVote::GetList($by, $order, $arFilter, $is_filtered);
		while($arRes = $rsData->Fetch())
			$arID[] = $arRes['ID'];
	}
	$arID = (is_array($arID) ? $arID : array($arID));

	foreach($arID as $ID)
	{
		$ID = intVal($ID);
		if ($ID <= 0)
			continue;
		switch($_REQUEST['action'])
		{
			case "delete":
				CVote::Delete($ID);
			break;
			case "activate":
			case "deactivate":
				if (!CVote::Update($ID, array("ACTIVE" => ($_REQUEST['action'] == "activate"? "Y" : "N")))):
					if ($ex = $GLOBALS['APPLICATION']->GetException())
						$lAdmin->AddGroupError($ex->GetString(), $ID);
					else
						$lAdmin->AddGroupError(GetMessage("VOTE_SAVE_ERROR"), $ID);
				endif;
			break;
		}
	}
}
/********************************************************************
				/ACTIONS
********************************************************************/

/********************************************************************
				Data
********************************************************************/
$rsData = CVote::GetList($by, $order, $arFilter, $is_filtered);
$rsData = new CAdminResult($rsData, $sTableID);
$rsData->NavStart();
$lAdmin->NavText($rsData->GetNavPrint(GetMessage("VOTE_PAGES")));
$lAdmin->AddHeaders(array(
	array("id"=>"ID", "content"=>"ID", "sort"=>"s_id", "default"=>true),
	array("id"=>"LAMP", "content"=>GetMessage("VOTE_LAMP"), "sort"=>"s_lamp", "default"=>true),
	array("id"=>"DATE_START", "content"=>GetMessage("VOTE_DATE_START"), "sort"=>"s_date_start", "default"=>true),
	array("id"=>"DATE_END", "content"=>GetMessage("VOTE_DATE_END"), "sort"=>"s_date_end", "default"=>true),
	array("id"=>"CHANNEL_ID", "content"=>GetMessage("VOTE_CHANNEL"), "sort"=>"s_channel", "default"=>true),
	array("id"=>"ACTIVE", "content"=>GetMessage("VOTE_ACTIVE"), "sort"=>"s_active", "default"=>true),
	array("id"=>"C_SORT", "content"=>GetMessage("VOTE_C_SORT"), "sort"=>"s_c_sort", "default"=>true),
	array("id"=>"TITLE", "content"=>GetMessage("VOTE_TITLE"), "sort"=>"s_title", "default"=>true),
	array("id"=>"QUESTIONS", "content"=>GetMessage("VOTE_QUESTIONS"), "default"=>true),
	array("id"=>"COUNTER", "content"=>GetMessage("VOTE_COUNTER"), "sort"=>"s_counter", "default"=>true),
));

while($arRes = $rsData->NavNext(true, "f_"))
{
	$row =& $lAdmin->AddRow($f_ID, $arRes);
	$row->AddViewField("ID","<a href='vote_edit.php?lang=".LANGUAGE_ID."&ID=$f_ID' title='".GetMessage("VOTE_EDIT_TITLE")."'>$f_ID</a>");
	if ($f_LAMP == "yellow")
	{
		$arRes["LAMP"] = $f_LAMP = ($f_ID == CVote::GetActiveVoteId($arRes["CHANNEL_ID"]) ? "green" : "red");
	}
	$lamp = $f_LAMP;
	if ($f_LAMP=="green")
		$lamp = "<div class=\"lamp-green\" title=\"".GetMessage("VOTE_LAMP_ACTIVE")."\"></div>";
	elseif ($f_LAMP == "red")
		$lamp = "<div class=\"lamp-red\" title=\"".($f_ACTIVE != 'Y' ? GetMessage("VOTE_NOT_ACTIVE") : GetMessage("VOTE_ACTIVE_RED_LAMP"))."\"></div>";

	$row->AddViewField("LAMP", $lamp);
	$row->AddSelectField("CHANNEL_ID", $arChannelsTitle);
	$row->AddCheckField("ACTIVE");
	$row->AddInputField("C_SORT");
	$row->AddInputField("TITLE", array());

	$row->AddViewField("QUESTIONS","<a title=\"".GetMessage("VOTE_QUESTIONS_TITLE")."\" href=\"vote_question_list.php?lang=".LANGUAGE_ID."&VOTE_ID=$f_ID\">$f_QUESTIONS</a>&nbsp;[<a title=\"".GetMessage("VOTE_QUESTIONS_ADD")."\" href=\"vote_question_edit.php?lang=".LANGUAGE_ID."&VOTE_ID=$f_ID\">+</a>]");
	$row->AddViewField("COUNTER", "<a href=\"vote_user_votes.php?lang=".LANGUAGE_ID."&find_vote_id=$f_ID&find_valid=Y&set_filter=Y\" title=\"".GetMessage("VOTE_VOTES_TITLE")."\">$f_COUNTER</a>");

	$arActions = Array();
	$arActions[] = array("DEFAULT"=>"Y", "ICON"=>"edit", "TEXT"=>GetMessage("MAIN_ADMIN_MENU_EDIT"), "ACTION"=>$lAdmin->ActionRedirect("vote_edit.php?ID=".$f_ID));
	$arActions[] = array(
		"ICON" => "copy", "TEXT" => GetMessage("VOTE_COPY"),
		"ACTION" => "if(confirm('".GetMessage("VOTE_CONFIRM_COPY")."')) window.location='vote_edit.php?lang=".LANGUAGE_ID."&docopy=Y&ID=$f_ID&".bitrix_sessid_get()."'");
	$arActions[] = array(
		"ICON" => "reset", "TEXT" => GetMessage("VOTE_RESET_NULL"),
		"ACTION" => "if(confirm('".GetMessage("VOTE_CONFIRM_RESET_VOTE")."')) window.location='vote_list.php?lang=".LANGUAGE_ID."&reset_id=$f_ID&".bitrix_sessid_get()."'");
	$arActions[] = array("SEPARATOR"=>true);

	$arActions[] = array("TEXT" => GetMessage("VOTE_PREVIEW"), "TITLE" => GetMessage("VOTE_PREVIEW_TITLE"),
		"ACTION" => $lAdmin->ActionRedirect("vote_preview.php?lang=".LANGUAGE_ID."&VOTE_ID=$f_ID"));
	$arActions[] = array("TEXT" => GetMessage("VOTE_RESULTS"), "TITLE" => GetMessage("VOTE_RESULTS_TITLE"),
		"ACTION" => $lAdmin->ActionRedirect("vote_results.php?lang=".LANGUAGE_ID."&VOTE_ID=$f_ID"));
	$arActions[] = array("SEPARATOR"=>true);
	$arActions[] = array("ICON" => "delete", "TEXT" => GetMessage("MAIN_ADMIN_MENU_DELETE"),
		"ACTION"=>"if(confirm('".GetMessage("VOTE_CONFIRM_DEL_VOTE")."')) window.location='vote_list.php?lang=".LANGUAGE_ID."&action=delete&ID=$f_ID&".bitrix_sessid_get()."'");
	if ($VOTE_RIGHT < "W")
		$row->bReadOnly = True;
	else
		$row->AddActions($arActions);
}

/************** Footer *********************************************/
$lAdmin->AddFooter(array(
	array("title"=>GetMessage("MAIN_ADMIN_LIST_SELECTED"), "value"=>$rsData->SelectedRowsCount()),
	array("counter"=>true, "title"=>GetMessage("MAIN_ADMIN_LIST_CHECKED"), "value"=>"0")));

$aMenu = array(); $aContext = array();
if ($VOTE_RIGHT >= "W"):
	$lAdmin->AddGroupActionTable(Array(
		"delete" => GetMessage("VOTE_DELETE"),
		"activate" => GetMessage("VOTE_ACTIVATE"),
		"deactivate" => GetMessage("VOTE_DEACTIVATE")));
	$aMenu[] = array(
		"TEXT"	=> GetMessage("VOTE_CREATE"),
				"TITLE"=>GetMessage("VOTE_ADD_LIST"),
				"LINK"=>"vote_edit.php?lang=".LANG,
		"ICON" => "btn_new");
	$aContext = $aMenu;
endif;

$lAdmin->AddAdminContextMenu($aContext);
$lAdmin->CheckListMode();
/********************************************************************
				/Data
********************************************************************/

$APPLICATION->SetTitle(GetMessage("VOTE_PAGE_TITLE"));
require_once ($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");
?>
<a name="tb"></a>
<form name="find_form" method="GET" action="<?=$APPLICATION->GetCurPage()?>?">
<?

$oFilter = new CAdminFilter(
		$sTableID."_filter",
		array(
		GetMessage("VOTE_FL_ID"),
		GetMessage("VOTE_FL_LAMP"),
		GetMessage("VOTE_FL_DATE_START"),
		GetMessage("VOTE_FL_DATE_END"),
		GetMessage("VOTE_FL_CHANNEL"),
		GetMessage("VOTE_FL_ACTIVE"),
		GetMessage("VOTE_FL_COUNTER")
		)
);

$oFilter->Begin();

?>

<tr>
	<td nowrap><b><?=GetMessage("VOTE_F_TITLE")?></b></td>
	<td nowrap><input type="text" name="find_title" value="<?echo htmlspecialcharsbx($find_title)?>" size="47"><?=InputType("checkbox", "find_title_exact_match", "Y", $find_title_exact_match, false, "", "title='".GetMessage("VOTE_EXACT_MATCH")."'")?>&nbsp;<?=ShowFilterLogicHelp()?></td>
</tr>

<tr>
	<td>ID:</td>
	<td><input type="text" name="find_id" size="47" value="<?echo htmlspecialcharsbx($find_id)?>"><?=InputType("checkbox", "find_id_exact_match", "Y", $find_id_exact_match, false, "", "title='".GetMessage("VOTE_EXACT_MATCH")."'")?>&nbsp;<?=ShowFilterLogicHelp()?></td>
</tr>
<tr>
	<td><?=GetMessage("VOTE_F_LAMP")?></td>
	<td><?
		$arr = array("reference"=>array(GetMessage("VOTE_RED"), GetMessage("VOTE_GREEN")), "reference_id"=>array("red","green"));
		echo SelectBoxFromArray("find_lamp", $arr, htmlspecialcharsbx($find_lamp), GetMessage("VOTE_ALL"));
		?></td>
</tr>
<tr>
	<td nowrap><?echo GetMessage("VOTE_F_DATE_START").":"?></td>
	<td nowrap><?echo CalendarPeriod("find_date_start_1", $find_date_start_1, "find_date_start_2", $find_date_start_2, "find_form","Y")?></td>
</tr>
<tr>
	<td nowrap><?echo GetMessage("VOTE_F_DATE_END").":"?></td>
	<td nowrap><?echo CalendarPeriod("find_date_end_1", $find_date_end_1, "find_date_end_2", $find_date_end_2, "find_form","Y")?></td>
</tr>
<tr>
	<td nowrap><?echo GetMessage("VOTE_F_CHANNEL")?></td>
	<td nowrap><input type="text" name="find_channel" value="<?echo htmlspecialcharsbx($find_channel)?>" size="47"><?=InputType("checkbox", "find_channel_exact_match", "Y", $find_channel_exact_match, false, "", "title='".GetMessage("VOTE_EXACT_MATCH")."'")?>&nbsp;<?=ShowFilterLogicHelp()?><br><?
		echo SelectBox("find_channel_id", CVoteChannel::GetDropDownList(), GetMessage("VOTE_ALL"), htmlspecialcharsbx($find_channel_id));
		?></td>
</tr>
<tr>
	<td nowrap><?echo GetMessage("VOTE_F_ACTIVE")?></td>
	<td nowrap><?
		$arr = array("reference"=>array(GetMessage("VOTE_YES"), GetMessage("VOTE_NO")), "reference_id"=>array("Y","N"));
		echo SelectBoxFromArray("find_active", $arr, htmlspecialcharsbx($find_active), GetMessage("VOTE_ALL"));
		?></td>
</tr>
<tr>
	<td nowrap><?echo GetMessage("VOTE_F_COUNTER")?></td>
	<td nowrap><input type="text" name="find_counter_1" value="<?=htmlspecialcharsbx($find_counter_1)?>" size="10"><?echo "&nbsp;".GetMessage("VOTE_TILL")."&nbsp;"?><input type="text" name="find_counter_2" value="<?=htmlspecialcharsbx($find_counter_2)?>" size="10"></td>
</tr>
<?
$oFilter->Buttons(array("table_id"=>$sTableID, "url"=>$APPLICATION->GetCurPage(), "form"=>"find_form"));
$oFilter->End();
#############################################################
?>

</form>
<?
$lAdmin->DisplayList();
require_once ($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");
?>
