<?
/*
##############################################
# Bitrix: SiteManager						 #
# Copyright (c) 2004 - 2009 Bitrix			 #
# http://www.bitrix.ru						 #
# mailto:admin@bitrix.ru					 #
##############################################
*/

require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_before.php");
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/vote/prolog.php");
$VOTE_RIGHT = $APPLICATION->GetGroupRight("vote");
if($VOTE_RIGHT=="D") $APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/vote/include.php");

ClearVars();

IncludeModuleLangFile(__FILE__);
CModule::IncludeModule("vote");

$err_mess = "File: ".__FILE__."<br>Line: ";
$old_module_version = CVote::IsOldVersion();

$aTabs = array(
		array("DIV" => "edit1", "TAB"=>GetMessage("VOTE_PROP"), "ICON"=>"main_vote_edit", "TITLE"=>GetMessage("VOTE_PARAMS")),
		array("DIV" => "edit2", "TAB"=>GetMessage("VOTE_DESCR"), "ICON"=>"main_vote_edit", "TITLE"=>GetMessage("VOTE_DESCRIPTION")),
		array("DIV" => "edit3", "TAB"=>GetMessage("VOTE_HOSTS"), "ICON"=>"main_vote_edit", "TITLE"=>GetMessage("VOTE_UNIQUE_PARAMS")));
$tabControl = new CAdminTabControl("tabControl", $aTabs);

$arChannels = array(); $is_filtered = false; $bVarsFromForm = false;
$db_res = CVoteChannel::GetList($by = "s_c_sort", $order = "asc", array(), $is_filtered);
if ($db_res && $res = $db_res->GetNext())
{
	do
	{
		$arChannels[$res["ID"]] = $res;
	} while ($res = $db_res->GetNext());
}

if (empty($arChannels))
{
	$APPLICATION->SetTitle(GetMessage("VOTE_NEW_RECORD"));
	require_once ($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");
	echo "<a href='vote_list.php?lang=".LANGUAGE_ID."' class='navchain'>".GetMessage("VOTE_VOTE_LIST")."</a>";
	echo ShowError(GetMessage("VOTE_CHANNEL_NOT_FOUND"));
	require_once ($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");
	die();
}

$DAYS = (intVal($_REQUEST["DAYS"]) > 0 ? intVal($_REQUEST["DAYS"]) : 30);
/********************************************************************
				ACTIONS
********************************************************************/
$ID = intval($ID);
$bCopy = isset($_REQUEST['docopy']);
if (isset($_REQUEST['COPYID'])) unset($ID);
$TEMPLATE = ($TEMPLATE == "NOT_REF" ? "" : $TEMPLATE);
$RESULT_TEMPLATE = ($RESULT_TEMPLATE == "NOT_REF" ? "" : $RESULT_TEMPLATE);
$CHANNEL_ID = intval($CHANNEL_ID);

if((strlen($save)>0 || strlen($apply)>0) && $_SERVER["REQUEST_METHOD"]=="POST" && $VOTE_RIGHT=="W" && check_bitrix_sessid())
{
	if(array_key_exists("IMAGE_ID", $_FILES))
		$arIMAGE_ID = $_FILES["IMAGE_ID"];
	elseif(isset($_REQUEST["IMAGE_ID"]) && strlen($_REQUEST["IMAGE_ID"]) > 0)
	{
		$arIMAGE_ID = CFile::MakeFileArray($_SERVER["DOCUMENT_ROOT"].$_REQUEST["IMAGE_ID"]);
		$arIMAGE_ID["COPY_FILE"] = "Y";
	}
	else
		$arIMAGE_ID = array();

	$arIMAGE_ID["del"] = ${"IMAGE_ID_del"};
	$arIMAGE_ID["description"] = ${"IMAGE_ID_descr"};
	$uniqSession = isset($_REQUEST['UNIQUE_TYPE_SESSION']) ? intval($_REQUEST['UNIQUE_TYPE_SESSION']) : 0;
	$uniqCookie  = isset($_REQUEST['UNIQUE_TYPE_COOKIE']) ? intval($_REQUEST['UNIQUE_TYPE_COOKIE']) : 0;
	$uniqIP		 = isset($_REQUEST['UNIQUE_TYPE_IP']) ? intval($_REQUEST['UNIQUE_TYPE_IP']) : 0;
	$uniqID		 = isset($_REQUEST['UNIQUE_TYPE_USER_ID']) ? intval($_REQUEST['UNIQUE_TYPE_USER_ID']) : 0;
	$uniqIDNew	 = isset($_REQUEST['UNIQUE_TYPE_USER_ID_NEW']) ? intval($_REQUEST['UNIQUE_TYPE_USER_ID_NEW']) : 0;


	$uniqType = $uniqSession | $uniqCookie | $uniqIP | $uniqID | $uniqIDNew;
	$uniqType += 5;

	$arFields = array(
		"CHANNEL_ID"		=> $_REQUEST["CHANNEL_ID"],
		"C_SORT"			=> intVal($_REQUEST["C_SORT"]),
		"ACTIVE"			=> ($_REQUEST["ACTIVE"] == "Y" ? "Y" : "N"),
		"DATE_START"		=> $_REQUEST["DATE_START"],
		"DATE_END"			=> $_REQUEST["DATE_END"],
		"TITLE"				=> $_REQUEST["TITLE"],
		"DESCRIPTION"		=> $_REQUEST["DESCRIPTION"],
		"DESCRIPTION_TYPE"	=> $_REQUEST["DESCRIPTION_TYPE"],
		"IMAGE_ID"			=> $arIMAGE_ID,
		"EVENT1"			=> $_REQUEST["EVENT1"],
		"EVENT2"			=> $_REQUEST["EVENT2"],
		"EVENT3"			=> $_REQUEST["EVENT3"],
		"UNIQUE_TYPE"		=> $uniqType,
		"DELAY"				=> $_REQUEST["DELAY"],
		"DELAY_TYPE"		=> $_REQUEST["DELAY_TYPE"],
		"TEMPLATE"			=> $_REQUEST["TEMPLATE"],
		"RESULT_TEMPLATE"	=> $_REQUEST["RESULT_TEMPLATE"],
		"NOTIFY"			=> $_REQUEST["NOTIFY"],
		"URL"				=> $_REQUEST["URL"]
	);

	$result = false;
	$arFields["IMAGE_ID"]["del"] = $_POST["IMAGE_ID_del"];
	if (!CVote::CheckFields(($ID > 0 ? "UPDATE" : "ADD"), $arFields, $ID, array("CHECK_INTERSECTION" => "Y"))):
	elseif ($ID <= 0):
		$arFields["AUTHOR_ID"] = $GLOBALS["USER"]->GetId();
		$result = $ID = CVote::Add($arFields);
	else:
		$result = CVote::Update($ID, $arFields);
	endif;
	if (!$result)
	{
		$e = $APPLICATION->GetException();
		$message = new CAdminMessage(GetMessage("VOTE_GOT_ERROR"), $e);
		$bVarsFromForm = true;
	}
	else
	{
		if ( isset($_REQUEST['COPYID'])
				&& (($oldID = intval($_REQUEST['COPYID'])) > 0)
				&& ($rCurrentVote = CVote::GetByID($oldID))
				&& ($arCurrentVote = $rCurrentVote->Fetch()))
		{
			global $DB;
			$newImageId = false;
			if (intval($arCurrentVote['IMAGE_ID']) > 0 &&
				empty($arIMAGE_ID['name']) &&
				$arIMAGE_ID['del'] != 'Y' )
			{
				$imageId = $arCurrentVote['IMAGE_ID'];
				$newImageId = CFile::CopyFile($imageId);
				$arCurrentVote["IMAGE_ID"] = NULL;
			}
			$newID = $ID;
			if ($newID === false)
				return false;
			$DB->Update("b_vote", array("COUNTER"=>"0"), "WHERE ID=".$newID, $err_mess.__LINE__);
			if ($newImageId)
			{
				$DB->Update("b_vote", array("IMAGE_ID"=>$newImageId), "WHERE ID=".$newID, $err_mess.__LINE__);
			}

			$state = true;
			$rQuestions = CVoteQuestion::GetList($oldID, $by, $order, array(), $is_filtered);
			while ($arQuestion = $rQuestions->Fetch())
			{
				$state = $state && ( CVoteQuestion::Copy($arQuestion['ID'], $newID) !== false);
			}
		}

		if (!empty($save))
		{
			if (!empty($_REQUEST["return_url"]))
				LocalRedirect($_REQUEST["return_url"]);
			LocalRedirect("vote_list.php?lang=".LANGUAGE_ID."&CHANNEL_ID=".$arFields["CHANNEL_ID"]);
		}
		LocalRedirect($APPLICATION->GetCurPage(). "?lang=".LANGUAGE_ID."&CHANNEL_ID=".$arFields["CHANNEL_ID"]."&ID=".$ID."&".$tabControl->ActiveTabParam().
			(!empty($_REQUEST["return_url"]) ? "&return_url=".urlencode($_REQUEST["return_url"]) : ""));
	}
}
/********************************************************************
				/ACTIONS
********************************************************************/
if ($ID > 0)
{
	$db_res = CVote::GetByID($ID);
	if ($db_res && $res = $db_res->Fetch()):
		$arVote = $res;
		$arChannel = $arChannels[$arVote["CHANNEL_ID"]];
	else:
		$ID = 0;
	endif;
}
if ($ID <= 0)
{
	$arChannel = current($arChannels);
	reset($arChannels);
	$arVote = array(
		"CHANNEL_ID" => (isset($_REQUEST['CHANNEL_ID']) && (intval($_REQUEST['CHANNEL_ID'])>0)) ? intval($_REQUEST['CHANNEL_ID']) : $arChannel["ID"],
		"C_SORT" => CVote::GetNextSort($arChannel["ID"]),
		"ACTIVE" => "Y",
		"DATE_START" => ($arChannel["VOTE_SINGLE"] != "N" ? CVote::GetNextStartDate($arChannel["ID"]) : ""),
		"UNIQUE_TYPE" => 12, // IP
		"DELAY" => 10,
		"DELAY_TYPE" => "M",
		"DESCRIPTION_TYPE" => "html",
		"IMAGE_ID" => 0,
		"EVENT1" => "vote",
		"EVENT2" => strtolower($arChannel["SYMBOLIC_NAME"]),
		"TEMPLATE" => "default.php"
	);
}
if ($bVarsFromForm)
{
	if (!empty($arVote["IMAGE_ID"])):
		unset($arFields["IMAGE_ID"]);
	endif;
	$arVote = $arFields;
}
foreach ($arVote as $key => $val):
	$arVote["~".$key] = $val;
	$arVote[$key] = htmlspecialcharsEx($val);
endforeach;

$sDocTitle = ($ID > 0 ? str_replace("#ID#", $ID, GetMessage("VOTE_EDIT_RECORD")) : GetMessage("VOTE_NEW_RECORD"));
if (isset($_REQUEST['docopy']) || isset($_REQUEST['COPYID']))
	$sDocTitle = GetMessage("VOTE_NEW_RECORD");
$APPLICATION->SetTitle($sDocTitle);
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");

/***************************************************************************
				HTML
****************************************************************************/
$aMenu = array();
$aMenu[] = array(
	"TEXT"	=> GetMessage("VOTE_LIST"),
	"TITLE" => GetMessage("VOTE_RECORDS_LIST"),
	"LINK"	=> "/bitrix/admin/vote_list.php?lang=".LANGUAGE_ID,
	"ICON" => "btn_list");

if (($ID > 0) && !$bCopy)
{
	$aMenu[] = array(
		"TEXT"	=> GetMessage("VOTE_QUESTIONS").($arVote["QUESTIONS"]?" [".$arVote["QUESTIONS"]."]":""),
		"TITLE"	=> GetMessage("VOTE_QUESTIONS_TITLE"),
		"LINK"	=> "/bitrix/admin/vote_question_list.php?lang=".LANGUAGE_ID."&VOTE_ID=".$ID,
	);

	if ($VOTE_RIGHT == "W")
	{
		$aMenu[] = array(
			"TEXT"	=> GetMessage("VOTE_CREATE"),
			"TITLE"	=> GetMessage("VOTE_CREATE_NEW_RECORD"),
			"LINK"	=> "/bitrix/admin/vote_edit.php?lang=".LANGUAGE_ID,
			"ICON" => "btn_new");
		$aMenu[] = array(
			"TEXT"	=> GetMessage("VOTE_COPY"),
			"TITLE"	=> GetMessage("VOTE_COPY_TITLE"),
			"LINK"	=> "vote_edit.php?lang=".LANGUAGE_ID."&amp;docopy=Y&ID=$ID&".bitrix_sessid_get(),
			"ICON" => "btn_copy");
		$aMenu[] = array(
			"TEXT"	=> GetMessage("VOTE_DELETE"),
			"TITLE"	=> GetMessage("VOTE_DELETE_RECORD"),
			"LINK"	=> "javascript:if(confirm('".GetMessage("VOTE_DELETE_RECORD_CONFIRM")."')) window.location='/bitrix/admin/vote_list.php?action=delete&ID=".$ID."&".bitrix_sessid_get()."&lang=".LANGUAGE_ID."';",
			"ICON" => "btn_delete");
		$aMenu[] = array(
			"TITLE"	=> GetMessage("VOTE_RESET_RECORD"),
			"LINK"	=> "javascript:if(confirm('".GetMessage("VOTE_RESET_RECORD_CONFIRM")."')) window.location='/bitrix/admin/vote_list.php?reset_id=".$ID."&lang=".LANGUAGE_ID."&".bitrix_sessid_get()."';",
			"TEXT"	=> GetMessage("VOTE_RESET"));
	}

	$aMenu[] = array(
		"TEXT"	=> GetMessage("VOTE_QUESTIONS_ADD"),
		"TITLE"	=> GetMessage("VOTE_QUESTIONS_ADD_TITLE"),
		"LINK"	=> "/bitrix/admin/vote_question_edit.php?lang=".LANGUAGE_ID."&VOTE_ID=$ID",
		"ICON" => "btn_new");
}

$context = new CAdminContextMenu($aMenu);
$context->Show();

if($message) echo $message->Show();
?>
<form name="form1" method="POST" action=""	enctype="multipart/form-data">
<SCRIPT LANGUAGE="JavaScript">
<!--
function UNIQUE_TYPE_CHANGE()
{
	ip = document.form1.UNIQUE_TYPE_IP.checked;
	document.getElementById("DELAY_TYPE").disabled = (! ip);
	document.getElementById("DELAY").disabled = (! ip);

	id = document.form1.UNIQUE_TYPE_USER_ID.checked;
	document.form1.UNIQUE_TYPE_USER_ID_NEW.disabled = (! id);
}
//-->
</SCRIPT>
<?=bitrix_sessid_post()?>
<? if (!$bCopy) { ?>
	<input type="hidden" name="ID" value="<?=$ID?>" />
<? } else { ?>
	<? if ($ID > 0) { ?>
		<input type="hidden" name="COPYID" value="<?=$ID?>" />
	<? } else if (isset($_REQUEST['COPYID']) && intval($_REQUEST['COPYID'])>0) { ?>
		<input type="hidden" name="COPYID" value="<?=intval($_REQUEST['COPYID'])?>" />
	<? } ?>
<? } ?>
<input type="hidden" name="lang" value="<?=LANGUAGE_ID?>">
<?
$tabControl->Begin();

//********************
//General Tab
//********************
$tabControl->BeginNextTab();

if ($ID > 0):
	if (strlen($arVote["TIMESTAMP_X"]) > 0 && $arVote["TIMESTAMP_X"] != "00.00.0000 00:00:00"):
?>
	<tr>
		<td><?=GetMessage("VOTE_TIMESTAMP")?></td>
		<td><?=$arVote["TIMESTAMP_X"]?></td>
	</tr>
<?
	endif;
?>
	<tr>
		<td><?=GetMessage("VOTE_COUNTER")?></td>
		<td><a href="vote_user_votes.php?lang=<?=LANGUAGE_ID?>&find_vote_id=<?=$ID?>&find_valid=Y&set_filter=Y" class="tablebodylink" title="<?=GetMessage("VOTE_GOTO_LIST")?>"><?=$arVote["COUNTER"]?></a></td>
	</tr>
<?
endif;
?>
	<tr>
		<td width="40%"><?=GetMessage("VOTE_ACTIVE_TITLE")?></td>
		<td width="60%"><input type="checkbox" name="ACTIVE" id="ACTIVE" value="Y" <?=($arVote["ACTIVE"] == "Y" ? " checked" : "")?> />
			<label for="ACTIVE"><?=GetMessage("VOTE_ACTIVE")?></label></td>
	</tr>
<?
$arAuthor = array();
if ($arVote["AUTHOR_ID"] > 0) {
	$arAuthor = CUser::GetByID($arVote["AUTHOR_ID"])->Fetch();
}
if (!empty($arAuthor))
{
	$arAuthor["NAME"] = CUser::FormatName('#NAME# #LAST_NAME#', $arAuthor, true, true);
	?>
	<tr>
		<td width="40%"><?=GetMessage("VOTE_AUTHOR")?></td>
		<td width="60%">
			<a href="/bitrix/admin/user_edit.php?ID=<?=$arVote["AUTHOR_ID"]?>&lang=<?=LANG?>"> [<?=$arVote["AUTHOR_ID"]?>] <?=$arAuthor["NAME"]?></a>
		</td>
	</tr>
	<tr>
		<td><?=GetMessage("VOTE_NOTIFY")?></td>
		<td width="60%"><?
		$ref = array("reference_id" => array(), "reference" => array());
		$arVote["NOTIFY"] = ($arVote["NOTIFY"] != "I" && $arVote["NOTIFY"] != "Y" ? "N" : $arVote["NOTIFY"]);
		if (IsModuleInstalled("im") && IsModuleInstalled("search")) {
			$ref["reference_id"][] = "I"; $ref["reference"][] = GetMessage("VOTE_NOTIFY_IM");
		} else {
			$arVote["NOTIFY"] = ($arVote["NOTIFY"] == "I" ? "N" : $arVote["NOTIFY"]);
		}
		$ref["reference_id"][] = "Y"; $ref["reference"][] = GetMessage("VOTE_NOTIFY_EMAIL");
		$ref["reference_id"][] = "N"; $ref["reference"][] = GetMessage("VOTE_NOTIFY_N");
		?><?=SelectBoxFromArray("NOTIFY", $ref, $arVote["NOTIFY"]);?></td>
	</tr>
<?
}
else
{
	?><input type="hidden" name="NOTIFY" value="N" /><?
}
?>	<tr>
		<td><?=GetMessage("VOTE_SORTING")?></td>
		<td><input type="text" name="C_SORT" size="5" value="<?=$arVote["C_SORT"]?>" /></td>
	</tr>
	<tr>
		<td><?=GetMessage("VOTE_CHANNEL")?></td>
		<td><select name="CHANNEL_ID"><?
			foreach ($arChannels as $res):
				?><option value="<?=$res["ID"]?>" <?=($arVote["CHANNEL_ID"] == $res["ID"] ? " selected" : "")?><?
					?>> [ <?=$res["ID"]?> ] <?=$res["TITLE"]?></option><?
			endforeach;
			?></select>
		</td>
	</tr>
	<tr>
		<td><?=GetMessage("VOTE_TITLE")?></td>
		<td><input type="text" name="TITLE" size="45" maxlength="255" value="<?=$arVote["TITLE"]?>" /></td>
	</tr>
	<tr>
		<td><?=GetMessage("VOTE_DATE").":"?></td>
		<td><?=CalendarPeriod("DATE_START", $arVote["~DATE_START"], "DATE_END", $arVote["~DATE_END"], "form1", "N", false, false, "19")?></td>
	</tr>
	<tr>
		<td><?=GetMessage("VOTE_URL")?></td>
		<td><input type="text" name="URL" size="45" maxlength="255" value="<?=$arVote["URL"]?>" /></td>
	</tr>
<?
if (IsModuleInstalled("statistic")) :
//********************
//Statistic Data
//********************
?>
	<tr class="heading">
		<td colspan="2"><?=GetMessage("VOTE_STATISTIC_PARAMS")?></td>
	</tr>
	<tr>
		<td>event1:</td>
		<td><input type="text" id="event1" name="EVENT1" size="15" value="<?=$arVote["EVENT1"]?>" <?=$arVote["EVENTS_disabled"]?> /></td>
	</tr>
	<tr>
		<td>event2:</td>
		<td><input type="text" id="event2" name="EVENT2" size="15" value="<?=$arVote["EVENT2"]?>" <?=$arVote["EVENTS_disabled"]?> /></td>
	</tr>
	<tr>
		<td>event3:</td>
		<td><input type="text" id="event3" name="EVENT3" size="15" value="<?=$arVote["EVENT3"]?>" <?=$arVote["EVENTS_disabled"]?> /></td>
	</tr>
<?
endif;
//********************
//Descr Tab
//********************
$tabControl->BeginNextTab();
$str_PREVIEW_PICTURE = intval($arVote["IMAGE_ID"]);
$bFileman = CModule::IncludeModule("fileman");
?>
	<tr class="adm-detail-file-row">
		<td width="40%"><?=GetMessage("VOTE_IMAGE")?></td>
		<td width="60%">
		<?
			if ($bFileman)
			{
				echo CMedialib::InputFile(
					"IMAGE_ID", $str_PREVIEW_PICTURE,
					array("IMAGE" => "Y", "PATH" => "Y", "FILE_SIZE" => "Y", "DIMENSIONS" => "Y",
					"IMAGE_POPUP"=>"Y", "MAX_SIZE" => array("W" => 200, "H"=>200)), //info
					array(), //file
					array(), //server
					array(), //media lib
					array(), //descr
					array(), //delete
					'' //scale hint
				);
			} else {
				CFile::InputFile("IMAGE_ID", 20, $arVote["IMAGE_ID"]);
				if (strlen($arVote["IMAGE_ID"])>0):
					echo "<br />";
					CFile::ShowImage($arVote["IMAGE_ID"], 200, 200, "border=0", "", true);
				endif;
			}
			?>
		</td>
	</tr>
	<tr class="heading">
		<td colspan="2"><?echo GetMessage("VOTE_DESCR")?></td>
	</tr>
	<tr>
		<td align="center" colspan="2">
<?
	if (COption::GetOptionString("vote", "USE_HTML_EDIT")=="Y" && CModule::IncludeModule("fileman")):
			CFileMan::AddHTMLEditorFrame("DESCRIPTION", $arVote["DESCRIPTION"], "DESCRIPTION_TYPE", $arVote["DESCRIPTION_TYPE"], array('height' => '200', 'width' => '100%'));
	else:
?>
			<input type="radio" name="DESCRIPTION_TYPE" id="DESCRIPTION_TYPE_TEXT" value="text" <?=($arVote["DESCRIPTION_TYPE"] == "text" ? " checked" : "")?> />
				<label for="DESCRIPTION_TYPE_TEXT">Text</label>&nbsp;/&nbsp;
			<input type="radio" name="DESCRIPTION_TYPE" id="DESCRIPTION_TYPE_HTML" value="html" <?=($arVote["DESCRIPTION_TYPE"] == "html" ? " checked" : "")?> />
				<label for="DESCRIPTION_TYPE_HTML">HTML</label><br />

			<textarea name="DESCRIPTION" style="width:100%" rows="23"><?=$arVote["DESCRIPTION"]?></textarea>
<?
	endif;
?>
		</td>
	</tr>
<?
	if ($old_module_version == "Y"):
?>
	<tr>
		<td><?=GetMessage("VOTE_TEMPLATE")?></td>
		<td><?=SelectBoxFromArray("TEMPLATE", GetTemplateList(), $arVote["TEMPLATE"]);
		?>&nbsp;[&nbsp;<a title="<?echo GetMessage("VOTE_CHOOSE_TITLE")?>" href="vote_preview.php?lang=<?=LANGUAGE_ID?>&VOTE_ID=<?=$ID?>" class="tablebodylink"><?=GetMessage("VOTE_CHOOSE")?></a>&nbsp;]</td>
	</tr>
	<tr>
		<td><?=GetMessage("VOTE_RESULT_TEMPLATE")?></td>
		<td><?echo SelectBoxFromArray("RESULT_TEMPLATE", GetTemplateList("RV"), $arVote["RESULT_TEMPLATE"]);
		?>&nbsp;[&nbsp;<a title="<?echo GetMessage("VOTE_CHOOSE_RESULT_TITLE")?>" href="vote_results.php?lang=<?=LANGUAGE_ID?>&VOTE_ID=<?=$ID?>" class="tablebodylink"><?=GetMessage("VOTE_CHOOSE")?></a>&nbsp;]</td>
	</tr>
<?
endif;
//********************
//Unique Tab
//********************
$tabControl->BeginNextTab();
?>
<tr>
	<td width="40%" class="adm-detail-valign-top"><?=GetMessage("VOTE_UNIQUE")?></td>
	<td width="60%">
	<? $uniqType = ( ($arVote["UNIQUE_TYPE"] > 4 ) ? ($arVote["UNIQUE_TYPE"] - 5) : $arVote["UNIQUE_TYPE"]); ?>
		<div class="adm-list">
			<? if (IsModuleInstalled('statistic')) { ?>
			<div class="adm-list-item">
				<div class="adm-list-control"><input type="checkbox" id="UNIQUE_TYPE_SESSION" name="UNIQUE_TYPE_SESSION" value="1" <?=($uniqType & 1)?" checked":""?> /></div>
				<div class="adm-list-label"><label for="UNIQUE_TYPE_SESSION"><?=GetMessage("VOTE_SESSION")?></label></div>
			</div>
			<? } ?>
			<div class="adm-list-item">
				<div class="adm-list-control"><input type="checkbox" id="UNIQUE_TYPE_COOKIE" name="UNIQUE_TYPE_COOKIE" value="2"	<?=($uniqType & 2)?" checked":""?> /></div>
				<div class="adm-list-label"><label for="UNIQUE_TYPE_COOKIE"><?=GetMessage("VOTE_COOKIE_ONLY")?></div>
			</div>
			<div class="adm-list-item">
				<div class="adm-list-control"><input type="checkbox" id="UNIQUE_TYPE_IP" name="UNIQUE_TYPE_IP" onClick="UNIQUE_TYPE_CHANGE()" value="4"  <?=($uniqType & 4)?" checked":""?> /></div>
				<div class="adm-list-label"><label for="UNIQUE_TYPE_IP"><?=GetMessage("VOTE_IP_ONLY")?></div>
			</div>
			<div class="adm-list-item">
				<div class="adm-list-control"><input type="checkbox" id="UNIQUE_TYPE_USER_ID" name="UNIQUE_TYPE_USER_ID" onClick="UNIQUE_TYPE_CHANGE()" value="8"	<?=($uniqType & 8)?" checked":""?> /></div>
				<div class="adm-list-label"><label for="UNIQUE_TYPE_USER_ID"><?=GetMessage("VOTE_USER_ID_ONLY")?></div>
			</div>
		</div>
	</td>
</tr>
<tr>
	<td width="40%"><?=GetMessage("VOTE_ID_NEW")?></td>
	<td width="60%">
		<input type="checkbox" id="UNIQUE_TYPE_USER_ID_NEW" name="UNIQUE_TYPE_USER_ID_NEW" value="16" <?=($uniqType & 16)?" checked":""?> />&nbsp;<label for="UNIQUE_TYPE_USER_ID_NEW"><?=GetMessage("VOTE_ID_NEW_MSG")?></label><br />
	</td>
</tr>
<tr>
	<td><?=GetMessage("VOTE_DELAY")?></td>
	<td><input type="text" name="DELAY" id="DELAY" size="5" value="<?=$arVote["DELAY"]?>">&nbsp;&nbsp;<?
		$arr = array(
		"reference"=>array(
			GetMessage("VOTE_SECOND"),
			GetMessage("VOTE_MINUTE"),
			GetMessage("VOTE_HOUR"),
			GetMessage("VOTE_DAY")),
		"reference_id"=>array("S","M","H","D"));
		echo SelectBoxFromArray("DELAY_TYPE", $arr, $arVote["DELAY_TYPE"], "", "class=\"typeselect\"");
	?></td>
</tr>
<?

$tabControl->Buttons(array("disabled"=>($VOTE_RIGHT<"W"), "back_url"=>"vote_list.php?lang=".LANGUAGE_ID));
$tabControl->End();
?>

</form>
<?
$tabControl->ShowWarnings("form1", $message);
?>
<SCRIPT LANGUAGE="JavaScript">
<!--
UNIQUE_TYPE_CHANGE();
//-->
</SCRIPT>
<?
require_once ($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");
?>