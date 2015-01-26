<?
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_before.php");
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/catalog/prolog.php");
global $APPLICATION;
global $DB;
global $USER;

if (!($USER->CanDoOperation('catalog_read') || $USER->CanDoOperation('catalog_store')))
	$APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));
CModule::IncludeModule("catalog");
$bReadOnly = !$USER->CanDoOperation('catalog_store');

if($ex = $APPLICATION->GetException())
{
	require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");
	$strError = $ex->GetString();
	ShowError($strError);
	require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");
	die();
}

$ID = IntVal($_REQUEST["ID"]);

if(!CBXFeatures::IsFeatureEnabled('CatMultiStore'))
{
	$dbResultList = CCatalogStore::GetList(array());
	if(($arResult = $dbResultList->Fetch()) && $ID != $arResult["ID"])
	{
		require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");

		ShowError(GetMessage("CAT_FEATURE_NOT_ALLOW"));

		require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");
		die();
	}
}

IncludeModuleLangFile(__FILE__);
ClearVars();

$errorMessage = "";
$bVarsFromForm = false;

$userId = intval($USER->GetID());

if($_SERVER["REQUEST_METHOD"] == "POST" && strlen($_REQUEST["Update"]) > 0 && !$bReadOnly && check_bitrix_sessid())
{
	$arPREVIEW_PICTURE = $_FILES["IMAGE_ID"];
	$arPREVIEW_PICTURE["del"] = $IMAGE_ID_del;
	$arPREVIEW_PICTURE["MODULE_ID"] = "catalog";
	$ACTIVE = ($ACTIVE == 'Y') ? $ACTIVE : 'N';
	$ISSUING_CENTER = ($_POST["ISSUING_CENTER"] == 'Y') ? 'Y' : 'N';
	$SHIPPING_CENTER = ($_POST["SHIPPING_CENTER"] == 'Y') ? 'Y' : 'N';
	$fileId = 0;
	$isImage = CFile::CheckImageFile($arPREVIEW_PICTURE);

	if(trim($ADDRESS) == '')
		$errorMessage .= GetMessage("ADDRESS_EMPTY")."\n";
	if(strlen($isImage) == 0 && (strlen($arPREVIEW_PICTURE["name"]) > 0 || strlen($arPREVIEW_PICTURE["del"]) > 0))
	{
		$fileId = CFile::SaveFile($arPREVIEW_PICTURE, "catalog");
	}
	elseif(strlen($isImage) > 0)
	{
		$errorMessage .= $isImage."\n";
	}

	$arFields = Array(
		"TITLE" => $TITLE,
		"SORT" => intval($CSTORE_SORT),
		"ACTIVE" => $ACTIVE,
		"ADDRESS" => $ADDRESS,
		"DESCRIPTION" => $DESCRIPTION,
		"GPS_N" => $GPS_N,
		"GPS_S" => $GPS_S,
		"PHONE" => $PHONE,
		"SCHEDULE" => $SCHEDULE,
		"XML_ID" => $XML_ID,
		"USER_ID" => $userId,
		"MODIFIED_BY" => $userId,
		"EMAIL" => $_POST["EMAIL"],
		"ISSUING_CENTER" => $ISSUING_CENTER,
		"SHIPPING_CENTER" => $SHIPPING_CENTER,
		"SITE_ID" => $_POST["SITE_ID"],
	);
	if(intval($fileId) > 0)
		$arFields["IMAGE_ID"] = intval($fileId);
	elseif($fileId === "NULL")
		$arFields["IMAGE_ID"] = "null";

	$DB->StartTransaction();
	if(strlen($errorMessage) == 0 && $ID > 0 && $res = CCatalogStore::Update($ID, $arFields))
	{
		$ID = $res;
		$DB->Commit();

		if (strlen($_REQUEST["apply"])<=0)
			LocalRedirect("/bitrix/admin/cat_store_list.php?lang=".LANG."&".GetFilterParams("filter_", false));
		else
			LocalRedirect("/bitrix/admin/cat_store_edit.php?lang=".LANG."&ID=".$ID."&".GetFilterParams("filter_", false));
	}
	elseif(strlen($errorMessage) == 0 && $ID == 0 && $res = CCatalogStore::Add($arFields))
	{
		$ID = $res;
		$DB->Commit();
		if(strlen($_REQUEST["apply"]) <= 0)
			LocalRedirect("/bitrix/admin/cat_store_list.php?lang=".LANG."&".GetFilterParams("filter_", false));
		else
			LocalRedirect("/bitrix/admin/cat_store_edit.php?lang=".LANG."&ID=".$ID."&".GetFilterParams("filter_", false));
	}
	else
	{
		if($ex = $APPLICATION->GetException())
		{
			$errorMessage .= $ex->GetString()."<br>";
		}
		$bVarsFromForm = true;
		$DB->Rollback();
	}
}

if ($ID > 0)
	$APPLICATION->SetTitle(str_replace("#ID#", $ID, GetMessage("STORE_TITLE_UPDATE")));
else
	$APPLICATION->SetTitle(GetMessage("STORE_TITLE_ADD"));

require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");
$str_ACTIVE = "Y";

if($ID > 0)
{
	$arSelect = array(
		"ID",
		"ACTIVE",
		"TITLE",
		"ADDRESS",
		"DESCRIPTION",
		"GPS_N",
		"GPS_S",
		"IMAGE_ID",
		"LOCATION_ID",
		"PHONE",
		"SCHEDULE",
		"XML_ID",
		"SORT",
		"EMAIL",
		"ISSUING_CENTER",
		"SHIPPING_CENTER",
		"SITE_ID",
	);

	$dbResult = CCatalogStore::GetList(array(), array('ID' => $ID), false, false, $arSelect);
	if (!$dbResult->ExtractFields("str_"))
		$ID = 0;
}

if ($bVarsFromForm)
	$DB->InitTableVarsForEdit("b_catalog_store", "", "str_");

if(isset($str_ADDRESS))
	$str_ADDRESS = (trim($str_ADDRESS) != '') ? $str_ADDRESS : '';

$aMenu = array(
	array(
		"TEXT" => GetMessage("STORE_LIST"),
		"ICON" => "btn_list",
		"LINK" => "/bitrix/admin/cat_store_list.php?lang=".LANG."&".GetFilterParams("filter_", false)
	)
);

if ($ID > 0 && !$bReadOnly)
{
	$aMenu[] = array("SEPARATOR" => "Y");

	$aMenu[] = array(
		"TEXT" => GetMessage("STORE_NEW"),
		"ICON" => "btn_new",
		"LINK" => "/bitrix/admin/cat_store_edit.php?lang=".LANG."&".GetFilterParams("filter_", false)
	);

	$aMenu[] = array(
		"TEXT" => GetMessage("STORE_DELETE"),
		"ICON" => "btn_delete",
		"LINK" => "javascript:if(confirm('".GetMessage("STORE_DELETE_CONFIRM")."')) window.location='/bitrix/admin/cat_store_list.php?action=delete&ID[]=".$ID."&lang=".LANG."&".bitrix_sessid_get()."#tb';",
		"WARNING" => "Y"
	);
}
$context = new CAdminContextMenu($aMenu);
$context->Show();
$arSitesShop = array();
$arSitesTmp = array();
$rsSites = CSite::GetList($_REQUEST["by"] = "id", $_REQUEST["order"] = "asc", Array("ACTIVE" => "Y"));
while($arSite = $rsSites->GetNext())
{
	$site = COption::GetOptionString("sale", "SHOP_SITE_".$arSite["ID"], "");
	if ($arSite["ID"] == $site)
	{
		$arSitesShop[] = array("ID" => $arSite["ID"], "NAME" => $arSite["NAME"]);
	}
	$arSitesTmp[] = array("ID" => $arSite["ID"], "NAME" => $arSite["NAME"]);
}

$rsCount = count($arSitesShop);
if ($rsCount <= 0)
{
	$arSitesShop = $arSitesTmp;
	$rsCount = count($arSitesShop);
}
?>

<?CAdminMessage::ShowMessage($errorMessage);?>

<form enctype="multipart/form-data" method="POST" action="<?echo $APPLICATION->GetCurPage()?>?" name="store_edit">
	<?echo GetFilterHiddens("filter_");?>
	<input type="hidden" name="Update" value="Y">
	<input type="hidden" name="lang" value="<?echo LANG ?>">
	<input type="hidden" name="ID" value="<?echo $ID ?>">
	<?=bitrix_sessid_post()?>

	<?
	$aTabs = array(
		array("DIV" => "edit1", "TAB" => GetMessage("STORE_TAB"), "ICON" => "catalog", "TITLE" => GetMessage("STORE_TAB_DESCR")),
	);

	$tabControl = new CAdminTabControl("tabControl", $aTabs);
	$tabControl->Begin();
	?>

	<?
	$tabControl->BeginNextTab();
	?>

	<?if ($ID > 0):?>
	<tr>
		<td>ID:</td>
		<td><?= $ID ?></td>
	</tr>
	<?endif;?>
	<tr>
		<td width="40%"><?= GetMessage("STORE_ACTIVE") ?>:</td>
		<td width="60%">
			<input type="checkbox" name="ACTIVE" value="Y" <?if(($str_ACTIVE == 'Y') || ($ID == 0)) echo "checked";?> size="50" />
		</td>
	</tr>
	<tr>
		<td width="40%"><?= GetMessage("ISSUING_CENTER") ?>:</td>
		<td width="60%">
			<input type="checkbox" name="ISSUING_CENTER" value="Y" <?if(($str_ISSUING_CENTER == 'Y') || $ID == 0) echo "checked";?> size="50" />
		</td>
	</tr>
	<tr>
		<td width="40%"><?= GetMessage("SHIPPING_CENTER") ?>:</td>
		<td width="60%">
			<input type="checkbox" name="SHIPPING_CENTER" value="Y" <?if(($str_SHIPPING_CENTER == 'Y') || $ID == 0) echo "checked";?> size="50" />
		</td>
	</tr>
	<tr>
		<td><?= GetMessage("STORE_SITE_ID") ?>:</td>
		<td>
			<select id="SITE_ID" style="max-width: 300px; width: 300px;" name="SITE_ID" <?=($bReadOnly) ? " disabled" : ""?> />
			<option <?=$selected?> value="<?=0?>"><?=GetMessage("STORE_SELECT_SITE_ID")?></option>
			<? foreach($arSitesShop as $key => $val)
			{
				$selected = ($val['ID'] == $str_SITE_ID) ? 'selected' : '';
				echo"<option ".$selected." value=".$val['ID'].">".$val["NAME"]." (".$val["ID"].")"."</option>";
			}
			?>
			</select>
		</td>
	</tr>
	<tr>
		<td><?= GetMessage("STORE_TITLE") ?>:</td>
		<td>
			<input type="text" style="width:300px" name="TITLE" value="<?=$str_TITLE?>" />
		</td>
	</tr>
	<tr class="adm-detail-required-field">
		<td  class="adm-detail-valign-top"><?= GetMessage("STORE_ADDRESS") ?>:</td>
		<td>
			<textarea cols="35" rows="3" class="typearea" name="ADDRESS" wrap="virtual"><?= $str_ADDRESS ?></textarea>
		</td>
	</tr>
	<tr>
		<td  class="adm-detail-valign-top"><?= GetMessage("STORE_DESCR") ?>:</td>
		<td>
			<textarea cols="35" rows="3" class="typearea" name="DESCRIPTION" wrap="virtual"><?= $str_DESCRIPTION ?></textarea>
		</td>
	</tr>
	<tr>
		<td><?= GetMessage("STORE_PHONE") ?>:</td>
		<td>
			<input type="text" name="PHONE" value="<?=$str_PHONE?>" size="45" />
		</td>
	</tr>
	<tr>
		<td><?= GetMessage("STORE_SCHEDULE") ?>:</td>
		<td>
			<input type="text" style="width:300px" name="SCHEDULE" value="<?=$str_SCHEDULE?>"/>
		</td>
	</tr>
	<tr>
		<td><?= "Email" ?>:</td>
		<td>
			<input type="text" style="width:300px" name="EMAIL" value="<?=$str_EMAIL?>"/>
		</td>
	</tr>
	<tr>
		<td><?= GetMessage("STORE_GPS_N") ?>:</td>
		<td><input type="text" name="GPS_N" value="<?=$str_GPS_N?>" size="15" />
		</td>
	</tr>
	<tr>
		<td><?= GetMessage("STORE_GPS_S") ?>:</td>
		<td><input type="text" name="GPS_S" value="<?=$str_GPS_S?>" size="15" />
		</td>

	</tr>
	<tr>
		<td>XML_ID:</td>
		<td><input type="text" name="XML_ID" value="<?=$str_XML_ID?>" size="45" />
		</td>

	</tr>
	<tr>
		<td width="40%"><?= GetMessage("CSTORE_SORT") ?>:</td>
		<td width="60%">
			<input type="text" name="CSTORE_SORT" value="<?=$str_SORT?>" size="5" />
		</td>
	</tr>
	<tr>
	<tr>
		<td><?echo GetMessage("STORE_IMAGE")?>:</td>
		<td>
			<?echo CFile::InputFile("IMAGE_ID", 20, $str_IMAGE_ID, false, 0, "IMAGE", "", 0);?><br>
			<?
			if($str_IMAGE_ID)
			{
				echo CFile::ShowImage($str_IMAGE_ID, 200, 200, "border=0", "", true);
			}
			?>
		</td>
	</tr>
	</tr>

	<?echo
$tabControl->EndTab();

	$tabControl->Buttons(
		array(
			"disabled" => $bReadOnly,
			"back_url" => "/bitrix/admin/cat_store_list.php?lang=".LANG."&".GetFilterParams("filter_", false)
		)
	);
	$tabControl->End();
	?>
</form>

<?require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");?>