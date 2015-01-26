<?
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_before.php");

$blogPermissions = $APPLICATION->GetGroupRight("blog");
if ($blogPermissions < "R")
	$APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));

require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/blog/include.php");

IncludeModuleLangFile(__FILE__);

require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/blog/prolog.php");

$ID = IntVal($ID);

$db_lang = CLangAdmin::GetList(($b="sort"), ($o="asc"));
$langCount = 0;
$arSysLangs = Array();
$arSysLangNames = Array();
while ($arLang = $db_lang->Fetch())
{
	$arSysLangs[$langCount] = $arLang["LID"];
	$arSysLangNames[$langCount] = htmlspecialcharsbx($arLang["NAME"]);
	$langCount++;
}

$strErrorMessage = "";
$bInitVars = false;
if ((strlen($save)>0 || strlen($apply)>0) && $REQUEST_METHOD=="POST" && $blogPermissions=="W" && check_bitrix_sessid())
{
	$SORT = IntVal($SORT);
	if ($SORT<=0) $SORT = 150;

	if ($SMILE_TYPE!="S" && $SMILE_TYPE!="I")
		$strErrorMessage .= GetMessage("ERROR_NO_TYPE").". \n";

	for ($i = 0; $i<count($arSysLangs); $i++)
	{
		${"NAME_".$arSysLangs[$i]} = Trim(${"NAME_".$arSysLangs[$i]});
		if (strlen(${"NAME_".$arSysLangs[$i]})<=0)
			$strErrorMessage .= GetMessage("ERROR_NO_NAME")." [".$arSysLangs[$i]."] ".$arSysLangNames[$i].". \n";
	}

	if ($ID<=0 && (!is_set($_FILES, "IMAGE1") || strlen($_FILES["IMAGE1"]["name"])<=0))
		$strErrorMessage .= GetMessage("ERROR_NO_IMAGE").". \n";

	$strFileName = "";
	if (strlen($strErrorMessage)<=0)
	{
		$arOldSmile = false;
		if ($ID>0) $arOldSmile = CBlogSmile::GetByID($ID);

		if (is_set($_FILES, "IMAGE1") && strlen($_FILES["IMAGE1"]["name"])>0)
		{
			$strFileName = RemoveScriptExtension($_FILES["IMAGE1"]["name"]);
			$strFileName = GetFileNameWithoutExtension($strFileName);
			$strFileExt = GetFileExtension($_FILES["IMAGE1"]["name"]);

			if (!in_array($strFileExt, array("jpg", "jpeg", "gif", "png")))
				$strErrorMessage .= GetMessage("FSE_ERROR_EXT").". \n";

			if (strlen($strErrorMessage)<=0)
			{
				$strDirName = $_SERVER["DOCUMENT_ROOT"]."/bitrix/images/blog/";
				if ($SMILE_TYPE=="I") 
					$strDirName .= "icon";
				else 
					$strDirName .= "smile";
				$strDirName .= "/";
				$strFileName = $strFileName.".".$strFileExt;

				CheckDirPath($strDirName);

				if (file_exists($strDirName.$strFileName) 
					&& (!$arOldSmile
						|| $arOldSmile["SMILE_TYPE"] != $SMILE_TYPE
						|| $arOldSmile["IMAGE"] != $strFileName
					))
					$strErrorMessage .= GetMessage("ERROR_EXISTS_IMAGE").". \n";
				else
				{
					if (!@copy($_FILES["IMAGE1"]["tmp_name"], $strDirName.$strFileName))
						$strErrorMessage .= GetMessage("ERROR_COPY_IMAGE").". \n";
					else
					{
						@chmod($strDirName.$strFileName, BX_FILE_PERMISSIONS);
						$imgArray = CFile::GetImageSize($strDirName.$strFileName);
						if (is_array($imgArray))
						{
							$iIMAGE_WIDTH = $imgArray[0];
							$iIMAGE_HEIGHT = $imgArray[1];
						}
						else
						{
							$iIMAGE_WIDTH = 0;
							$iIMAGE_HEIGHT = 0;
						}
					}
					if ($arOldSmile && ($arOldSmile["SMILE_TYPE"]!=$SMILE_TYPE || $arOldSmile["IMAGE"]!=$strFileName) && strlen($arOldSmile["IMAGE"])>0)
					{
						$strDirNameOld = $_SERVER["DOCUMENT_ROOT"]."/bitrix/images/blog/";
						if ($arOldSmile["SMILE_TYPE"]=="I") $strDirNameOld .= "icon";
						else $strDirNameOld .= "smile";
						$strDirNameOld .= "/".$arOldSmile["IMAGE"];
						@unlink($strDirNameOld);
					}
				}
			}

			if (strlen($strFileName)<=0)
				$strErrorMessage .= GetMessage("ERROR_NO_IMAGE").". \n";
		}
		elseif ($arOldSmile && $arOldSmile["SMILE_TYPE"]!=$SMILE_TYPE)
		{
			$strDirNameOld = $_SERVER["DOCUMENT_ROOT"]."/bitrix/images/blog/";
			if ($arOldSmile["SMILE_TYPE"]=="I") $strDirNameOld .= "icon";
			else $strDirNameOld .= "smile";
			$strDirNameOld .= "/".$arOldSmile["IMAGE"];

			$strDirName = $_SERVER["DOCUMENT_ROOT"]."/bitrix/images/blog/";
			if ($SMILE_TYPE=="I") $strDirName .= "icon";
			else $strDirName .= "smile";
			$strDirName .= "/".$arOldSmile["IMAGE"];

			if (!@copy($strDirNameOld, $strDirName))
				$strErrorMessage .= GetMessage("ERROR_COPY_IMAGE").". \n";
			else
			{
				CheckDirPath($strDirName);
				@unlink($strDirNameOld);
			}
		}
	}

	if (strlen($strErrorMessage)<=0)
	{
		$arFields = array(
			"SORT" => $SORT,
			"SMILE_TYPE" => $SMILE_TYPE,
			"TYPING" => $TYPING,
			"DESCRIPTION" => $DESCRIPTION
			);

		if (strlen($strFileName)>0)
		{
			$arFields["IMAGE"] = $strFileName;
			$arFields["IMAGE_WIDTH"] = $iIMAGE_WIDTH;
			$arFields["IMAGE_HEIGHT"] = $iIMAGE_HEIGHT;
		}

		for ($i = 0; $i<count($arSysLangs); $i++)
		{
			$arFields["LANG"][] = array(
				"LID" => $arSysLangs[$i],
				"NAME" => ${"NAME_".$arSysLangs[$i]}
				);
		}

		if ($ID>0)
		{
			$ID1 = CBlogSmile::Update($ID, $arFields);
			if (IntVal($ID1)<=0)
				$strErrorMessage .= GetMessage("ERROR_EDIT_SMILE").". \n";
		}
		else
		{
			$ID = CBlogSmile::Add($arFields);
			if (IntVal($ID)<=0)
				$strErrorMessage .= GetMessage("ERROR_ADD_SMILE").". \n";
		}
	}

	if (strlen($strErrorMessage)>0) $bInitVars = True;

	if (strlen($save)>0 && strlen($strErrorMessage)<=0)
		LocalRedirect("blog_smile.php?lang=".LANG."&".GetFilterParams("filter_", false));
}

$str_SORT = 150;
$str_TYPING = "";

ClearVars("str_");
if ($ID > 0)
{
	$db_smile = CBlogSmile::GetList(array(), array("ID" => $ID));
	$db_smile->ExtractFields("str_", True);
}

if ($bInitVars)
{
	$DB->InitTableVarsForEdit("b_blog_smile", "", "str_");
}

$sDocTitle = ($ID>0) ? GetMessage("BLOG_EDIT_RECORD", Array("#ID#" => $ID)) : GetMessage("BLOG_NEW_RECORD");
$APPLICATION->SetTitle($sDocTitle);

require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");

/*********************************************************************/
/********************  BODY  *****************************************/
/*********************************************************************/
?>

<?
$aMenu = array(
		array(
				"TEXT" => GetMessage("FSN_2FLIST"),
				"LINK" => "/bitrix/admin/blog_smile.php?lang=".LANG."&".GetFilterParams("filter_", false),
				"ICON" => "btn_list",
			)
	);

if ($ID > 0 && $blogPermissions == "W")
{
	$aMenu[] = array("SEPARATOR" => "Y");

	$aMenu[] = array(
			"TEXT" => GetMessage("FSN_NEW_SMILE"),
			"LINK" => "/bitrix/admin/blog_smile_edit.php?lang=".LANG."&".GetFilterParams("filter_", false),
			"ICON" => "btn_new",
		);

	$aMenu[] = array(
			"TEXT" => GetMessage("FSN_DELETE_SMILE"), 
			"LINK" => "javascript:if(confirm('".GetMessage("FSN_DELETE_SMILE_CONFIRM")."')) window.location='/bitrix/admin/blog_smile.php?action=delete&ID[]=".$ID."&lang=".LANG."&".bitrix_sessid_get()."#tb';",
			"WARNING" => "Y",
			"ICON" => "btn_delete",
		);
}
$context = new CAdminContextMenu($aMenu);
$context->Show();
?>

<?CAdminMessage::ShowMessage($strErrorMessage);?>

<form method="POST" action="<?echo $APPLICATION->GetCurPage()?>?" name="fform" enctype="multipart/form-data">
<input type="hidden" name="Update" value="Y">
<input type="hidden" name="lang" value="<?echo LANG ?>">
<input type="hidden" name="ID" value="<?echo $ID ?>">
<?=bitrix_sessid_post()?>

<?
$aTabs = array(
		array("DIV" => "edit1", "TAB" => GetMessage("FSN_TAB_SMILE"), "ICON" => "blog", "TITLE" => GetMessage("FSN_TAB_SMILE_DESCR"))
	);

$tabControl = new CAdminTabControl("tabControl", $aTabs);
$tabControl->Begin();
?>

<?
$tabControl->BeginNextTab();
?>

	<?if ($ID > 0):?>
	<tr>
		<td width="40%"><?echo GetMessage("BLOG_CODE")?>:</td>
		<td width="60%"><?echo $ID ?></td>
	</tr>
	<?endif;?>

	<tr>
		<td width="40%"><?echo GetMessage("BLOG_SORT")?>:</td>
		<td width="60%">
			<input type="text" name="SORT" value="<?echo $str_SORT ?>" size="10">
		</td>
	</tr>

	<tr>
		<td><?echo GetMessage("BLOG_TYPE")?>:</td>
		<td>
			<select name="SMILE_TYPE">
				<option value="S" <?if ($str_SMILE_TYPE=="S") echo "selected";?>><?echo GetMessage("FSE_SMILE");?></option>
				<option value="I" <?if ($str_SMILE_TYPE=="I") echo "selected";?>><?echo GetMessage("FSE_ICON");?></option>
			</select>
		</td>
	</tr>

	<tr>
		<td valign="top"><?echo GetMessage("BLOG_TYPING")?>:<br><small><?echo GetMessage("BLOG_TYPING_NOTE")?></small></td>
		<td valign="top">
			<input type="text" name="TYPING" value="<?echo $str_TYPING ?>" size="50">
		</td>
	</tr>

	<tr>
		<td><?echo GetMessage("BLOG_IMAGE")?>:<br><small><?echo GetMessage("BLOG_IMAGE_NOTE")?></small></td>
		<td>
			<input type="file" name="IMAGE1" size="30">
			<?
			if (strlen($str_IMAGE)>0)
			{
				?><br><img src="/bitrix/images/blog/<?echo ($str_SMILE_TYPE=="I")?"icon":"smile" ?>/<?echo $str_IMAGE?>" border="0" <?echo (IntVal($str_IMAGE_WIDTH)>0) ? "width=\"".$str_IMAGE_WIDTH."\"" : "" ?> <?echo (IntVal($str_IMAGE_WIDTH)>0) ? "height=\"".$str_IMAGE_HEIGHT."\"" : "" ?>><?
			}
			?>
		</td>
	</tr>

	<?
	for ($i = 0; $i < count($arSysLangs); $i++):
		$arSmileLang = CBlogSmile::GetLangByID($ID, $arSysLangs[$i]);
		$str_NAME = htmlspecialcharsbx($arSmileLang["NAME"]);
		$str_DESCRIPTION = htmlspecialcharsbx($arSmileLang["DESCRIPTION"]);
		if ($bInitVars)
		{
			$str_NAME = htmlspecialcharsbx(${"NAME_".$arSysLangs[$i]});
			$str_DESCRIPTION = htmlspecialcharsbx(${"DESCRIPTION_".$arSysLangs[$i]});
		}
		?>
		<tr class="heading">
			<td colspan="2">[<?echo $arSysLangs[$i];?>] <?echo $arSysLangNames[$i];?></td>
		</tr>
		<tr class="adm-detail-required-field">
			<td>
				<?echo GetMessage("BLOG_NAME")?>:
			</td>
			<td>
				<input type="text" name="NAME_<?echo $arSysLangs[$i] ?>" value="<?echo $str_NAME ?>" size="40">
			</td>
		</tr>
	<?endfor;?>

<?
$tabControl->EndTab();
?>

<?
$tabControl->Buttons(
		array(
				"disabled" => ($blogPermissions < "W"),
				"back_url" => "/bitrix/admin/blog_smile.php?lang=".LANG."&".GetFilterParams("filter_", false)
			)
	);
?>

<?
$tabControl->End();
?>

</form>
<?require($DOCUMENT_ROOT."/bitrix/modules/main/include/epilog_admin.php");?>