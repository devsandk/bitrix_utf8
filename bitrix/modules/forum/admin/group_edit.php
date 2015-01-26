<?require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_before.php");

$forumPermissions = $APPLICATION->GetGroupRight("forum");
if ($forumPermissions == "D")
	$APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));

require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/forum/include.php");
ClearVars();

IncludeModuleLangFile(__FILE__); 
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/forum/prolog.php");

$ID = IntVal($ID);
$langCount = 0;
$arSysLangs = $arSysLangNames = array();
$db_lang = CLangAdmin::GetList(($b="sort"), ($o="asc"));
$arError = array();
$message = false;
$bInitVars = false;
while ($arLang = $db_lang->Fetch())
{
	$arSysLangs[$langCount] = $arLang["LID"];
	$arSysLangNames[$langCount] = htmlspecialcharsbx($arLang["NAME"]);
	$langCount++;
}
$arGroups = CForumGroup::GetByLang(LANGUAGE_ID);
array_unshift($arGroups, array("ID" => 0, "NAME" => "..."));
if ((strlen($save)>0 || strlen($apply)>0) && $REQUEST_METHOD=="POST" && $forumPermissions=="W" && check_bitrix_sessid())
{
	$arFields = array(
		"SORT" => intVal(intVal($SORT) <= 0 ? 150 : $SORT), 
		"PARENT_ID" => $_REQUEST["FORUM_GROUP"]["PARENT_ID"]);
	for ($i = 0; $i<count($arSysLangs); $i++)
	{
		$arFields["LANG"][] = array(
			"LID" => $arSysLangs[$i],
			"NAME" => $_REQUEST["FORUM_GROUP"]["LANG"][$arSysLangs[$i]]["NAME"],
			"DESCRIPTION" => $_REQUEST["FORUM_GROUP"]["LANG"][$arSysLangs[$i]]["DESCRIPTION"]);
	}
	if (!CForumGroup::CheckFields(($ID > 0 ? "UPDATE" : "ADD"), $arFields, ($ID > 0 ? $ID : false)))
	{
		$arError[] = array(
			"code" => "error_checkfields",
			"title" => GetMessage("ERROR_ADD_GROUP_BAD_FIELDS"));
	}
	else
	{
		if ($ID>0)
		{
			if (!CForumGroup::CanUserUpdateGroup($ID, $USER->GetUserGroupArray()))
			{
				$arError[] = array(
					"code" => "not_right_for_edit",
					"title" => GetMessage("ERROR_EDIT_GROUP_NOT_RIGHT"));
			}
			else 
			{
				$ID1 = CForumGroup::Update($ID, $arFields);
				if (IntVal($ID1)<=0)
				{
					$arError[] = array(
						"code" => "not_edit",
						"title" => GetMessage("ERROR_EDIT_GROUP"));
				}
			}
		}
		else 
		{
			if (!CForumGroup::CanUserAddGroup($USER->GetUserGroupArray()))
			{
				$arError[] = array(
					"code" => "not_right_for_add",
					"title" => GetMessage("ERROR_ADD_GROUP_NOT_RIGHT"));
			}
			else
			{
				$ID = CForumGroup::Add($arFields);
				if (IntVal($ID)<=0)
				{
					$arError[] = array(
						"code" => "not_add",
						"title" => GetMessage("ERROR_ADD_GROUP"));
					
				}
			}
		}
	}
	
	if (!empty($arError) && $e = $GLOBALS["APPLICATION"]->GetException())
		$message = new CAdminMessage(($ID > 0 ? GetMessage("ERROR_EDIT_GROUP") : GetMessage("ERROR_ADD_GROUP")), $e);

	$bInitVars = (!empty($arError) ? true : false);

	if (strlen($save)>0 && empty($arError))
	{
		BXClearCache(true, "bitrix/forum/group/");
		LocalRedirect("forum_group.php?lang=".LANG."&".GetFilterParams("filter_", false));
	}
}

if ($ID>0)
{
	$db_group = CForumGroup::GetList(array(), array("ID" => $ID));
	$db_group->ExtractFields("str_", False);
}

if ($bInitVars)
{
	$DB->InitTableVarsForEdit("b_forum_group", "", "str_");
}

$sDocTitle = ($ID>0) ? str_replace("#ID#", $ID, GetMessage("FORUM_EDIT_RECORD")) : GetMessage("FORUM_NEW_RECORD");
$APPLICATION->SetTitle($sDocTitle);

require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");

/*********************************************************************/
/********************  BODY  *****************************************/
/*********************************************************************/
?>

<?
$aMenu = array(
	array(
		"TEXT" => GetMessage("FGN_2FLIST"),
		"LINK" => "/bitrix/admin/forum_group.php?lang=".LANG."&".GetFilterParams("filter_", false),
		"ICON" => "btn_list"));

if ($ID > 0 && $forumPermissions == "W")
{
	$aMenu[] = array("SEPARATOR" => "Y");

	$aMenu[] = array(
		"TEXT" => GetMessage("FGN_NEW_GROUP"),
		"LINK" => "/bitrix/admin/forum_group_edit.php?lang=".LANG."&".GetFilterParams("filter_", false),
		"ICON" => "btn_new",
	);

	$aMenu[] = array(
		"TEXT" => GetMessage("FGN_DELETE_GROUP"), 
		"LINK" => "javascript:if(confirm('".GetMessage("FGN_DELETE_GROUP_CONFIRM")."')) window.location='/bitrix/admin/forum_group.php?action=delete&ID[]=".$ID."&lang=".LANG."&".bitrix_sessid_get()."#tb';",
		"ICON" => "btn_delete",
	);
}
$context = new CAdminContextMenu($aMenu);
$context->Show();
if($message)
	echo $message->Show();

?>
<form method="POST" action="<?echo $APPLICATION->GetCurPage()?>" name="fform">
<input type="hidden" name="Update" value="Y">
<input type="hidden" name="lang" value="<?echo LANG ?>">
<input type="hidden" name="ID" value="<?echo $ID ?>">
<?=bitrix_sessid_post()?>

<?
$aTabs = array(
		array("DIV" => "edit1", "TAB" => GetMessage("FGN_TAB_GROUP"), "ICON" => "forum", "TITLE" => GetMessage("FGN_TAB_GROUP_DESCR"))
	);

$tabControl = new CAdminTabControl("tabControl", $aTabs);
$tabControl->Begin();

$tabControl->BeginNextTab();
?>

<?
if ($ID > 0):?>
	<tr>
		<td width="40%"><?=GetMessage("FORUM_CODE")?>:</td>
		<td width="60%"><?=intVal($ID)?></td>
	</tr>
<?endif;?>

	<tr>
		<td width="40%"><?=GetMessage("FORUM_SORT")?>:</td>
		<td width="60%"><input type="text" name="SORT" value="<?=intVal($bInitVars ? $_REQUEST["SORT"] : $str_SORT)?>" size="10"></td>
	</tr>
	<tr>
		<td width="40%"><?=GetMessage("FORUM_PARENT_ID")?>:</td>
		<td width="60%">
			<select name="FORUM_GROUP[PARENT_ID]">
<?
	if ($bInitVars)
	{
		$str_PARENT_ID = $_REQUEST["FORUM_GROUP"]["PARENT_ID"];
	}
	else
	{
		
	}
	foreach ($arGroups as $res):
		if ($ID > 0 && ($ID == $res["ID"] || $str_LEFT_MARGIN < $res["LEFT_MARGIN"] && $res["RIGHT_MARGIN"] < $str_RIGHT_MARGIN)):
			continue;
		endif;
?>
				<option value="<?=$res["ID"]?>" <?=($res["ID"] == $str_PARENT_ID ? "selected" : "")
					?>><?=str_pad("", ($res["DEPTH_LEVEL"] - 1), ".")?><?=$res["NAME"]?></option>
<?
	endforeach;
?>
				
			</select>
			</td>
	</tr>

	<?
	for ($i = 0; $i<count($arSysLangs); $i++):
		if ($bInitVars)
		{
			$str_NAME = $_REQUEST["FORUM_GROUP"]["LANG"][$arSysLangs[$i]]["NAME"];
			$str_DESCRIPTION = $_REQUEST["FORUM_GROUP"]["LANG"][$arSysLangs[$i]]["DESCRIPTION "];
		}
		else 
		{
			$arGroupLang = CForumGroup::GetLangByID($ID, $arSysLangs[$i]);
			$str_NAME = $arGroupLang["NAME"];
			$str_DESCRIPTION = $arGroupLang["DESCRIPTION"];
		}
	?>
	<tr class="heading">
		<td colspan="2">[<?echo $arSysLangs[$i];?>] <?echo $arSysLangNames[$i];?></td>
	</tr>
	<tr class="adm-detail-required-field">
		<td><?echo GetMessage("FORUM_NAME")?>:</td>
		<td>
			<input type="text" name="FORUM_GROUP[LANG][<?=$arSysLangs[$i]?>][NAME]" value="<?=htmlspecialcharsbx($str_NAME)?>" size="40">
		</td>
	</tr>
	<tr>
		<td><?echo GetMessage("FORUM_DESCR")?>:</td>
		<td>
			<input type="text" name="FORUM_GROUP[LANG][<?=$arSysLangs[$i]?>][DESCRIPTION]" value="<?=htmlspecialcharsbx($str_DESCRIPTION)?>" size="40">
		</td>
	</tr>
	<?endfor;

$tabControl->EndTab();
$tabControl->Buttons(
		array(
				"disabled" => ($forumPermissions < "W"),
				"back_url" => "/bitrix/admin/forum_group.php?lang=".LANG."&".GetFilterParams("filter_", false)
			)
	);
$tabControl->End();

$tabControl->ShowWarnings("fform", $message);
?>
</form>
<?require($DOCUMENT_ROOT."/bitrix/modules/main/include/epilog_admin.php");?>