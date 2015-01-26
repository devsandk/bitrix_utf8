<?
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_before.php");
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/catalog/prolog.php");
global $APPLICATION;
global $DB;
global $USER;

if(!($USER->CanDoOperation('catalog_read') || $USER->CanDoOperation('catalog_store')))
	$APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));
CModule::IncludeModule("catalog");
$bReadOnly = !$USER->CanDoOperation('catalog_store');

IncludeModuleLangFile(__FILE__);

$bCanAdd = true;
$bExport = false;
if($_REQUEST["mode"] == "excel")
	$bExport = true;

if(!CBXFeatures::IsFeatureEnabled('CatMultiStore'))
{
	$dbResultList = CCatalogStore::GetList(array());
	if($arResult = $dbResultList->Fetch())
		$bCanAdd = false;
}

if($ex = $APPLICATION->GetException())
{
	require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");

	$strError = $ex->GetString();
	ShowError($strError);

	require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");
	die();
}

/** For a given site ID, issues generated site title.
 * @param $siteId
 * @return string
 */
function getSiteTitle($siteId)
{
	static $rsSites = '';
	static $arSitesShop = array();
	$siteTitle = $siteId;

	if($rsSites === '')
	{
		$rsSites = CSite::GetList($b="id", $o="asc", Array("ACTIVE" => "Y"));
		while($arSite = $rsSites->GetNext())
			$arSitesShop[] = array("ID" => $arSite["ID"], "NAME" => $arSite["NAME"]);
	}

	foreach($arSitesShop as $arSite)
	{
		if($arSite["ID"] == $siteId)
		{
			$siteTitle = $arSite["NAME"]." (".$arSite["ID"].")";
		}
	}
	return $siteTitle;
}

$sTableID = "b_catalog_store";
$oSort = new CAdminSorting($sTableID, "SORT", "asc");
$lAdmin = new CAdminList($sTableID, $oSort);
$arFilterFields = array(
	"filter_site_id",
);
$lAdmin->InitFilter($arFilterFields);
$arFilter = array();
if(strlen($filter_site_id) > 0 && $filter_site_id != "NOT_REF")
	$arFilter["SITE_ID"] = $filter_site_id;

if($lAdmin->EditAction() && !$bReadOnly)
{
	foreach ($_POST['FIELDS'] as $ID => $arFields)
	{
		$DB->StartTransaction();
		$ID = (int)$ID;
		$arFields['ID']=$ID;
		if(isset($arFields["IMAGE_ID"]))
			unset($arFields["IMAGE_ID"]);
		if(!$lAdmin->IsUpdated($ID))
			continue;

		if(!CCatalogStore::Update($ID, $arFields))
		{
			if($ex = $APPLICATION->GetException())
				$lAdmin->AddUpdateError($ex->GetString(), $ID);
			else
				$lAdmin->AddUpdateError(GetMessage("ERROR_UPDATING_REC")." (".$arFields["ID"].", ".$arFields["TITLE"].", ".$arFields["SORT"].")", $ID);

			$DB->Rollback();
		}

		$DB->Commit();
	}
}

if(($arID = $lAdmin->GroupAction()) && !$bReadOnly)
{
	if($_REQUEST['action_target']=='selected')
	{
		$arID = Array();
		$dbResultList = CCatalogStore::GetList(array($_REQUEST["by"] => $_REQUEST["order"], $arFilter, false, false, array('ID')));
		while ($arResult = $dbResultList->Fetch())
			$arID[] = $arResult['ID'];
	}

	foreach ($arID as $ID)
	{
		if(strlen($ID) <= 0)
			continue;

		switch ($_REQUEST['action'])
		{
			case "delete":
				@set_time_limit(0);

				$DB->StartTransaction();

				if(!CCatalogStore::Delete($ID))
				{
					$DB->Rollback();

					if($ex = $APPLICATION->GetException())
						$lAdmin->AddGroupError($ex->GetString(), $ID);
					else
						$lAdmin->AddGroupError(GetMessage("ERROR_DELETING_TYPE"), $ID);
				}
				$DB->Commit();
				break;
		}
	}
}
$arSelect = array(
	"ID",
	"ACTIVE",
	"TITLE",
	"ADDRESS",
	"DESCRIPTION",
	"GPS_N",
	"GPS_S",
	"IMAGE_ID",
	"PHONE",
	"SCHEDULE",
	"XML_ID",
	"DATE_MODIFY",
	"DATE_CREATE",
	"USER_ID",
	"MODIFIED_BY",
	"SORT",
	"EMAIL",
	"ISSUING_CENTER",
	"SHIPPING_CENTER",
	"SITE_ID"
);

if(array_key_exists("mode", $_REQUEST) && $_REQUEST["mode"] == "excel")
	$arNavParams = false;
else
	$arNavParams = array("nPageSize"=>CAdminResult::GetNavSize($sTableID));

$dbResultList = CCatalogStore::GetList(
	array($_REQUEST["by"] => $_REQUEST["order"]),
	$arFilter,
	false,
	$arNavParams,
	$arSelect
);
$dbResultList = new CAdminResult($dbResultList, $sTableID);
$dbResultList->NavStart();
$lAdmin->NavText($dbResultList->GetNavPrint(GetMessage("group_admin_nav")));

$lAdmin->AddHeaders(array(
	array(
		"id" => "ID",
		"content" => "ID",
		"sort" => "ID",
		"default" => true
	),
	array(
		"id" => "SORT",
		"content" => GetMessage("CSTORE_SORT"),
		"sort" => "SORT",
		"default" => true
	),
	array(
		"id" => "TITLE",
		"content" => GetMessage("TITLE"),
		"sort" => "TITLE",
		"default" => true
	),
	array(
		"id" => "ACTIVE",
		"content" => GetMessage("STORE_ACTIVE"),
		"sort" => "ACTIVE",
		"default" => true
	),
	array(
		"id" => "ADDRESS",
		"content" => GetMessage("ADDRESS"),
		"sort" => "",
		"default" => true
	),
	array(
		"id" => "IMAGE_ID",
		"content" => GetMessage("STORE_IMAGE"),
		"sort" => "",
		"default" => false
	),
	array(
		"id" => "DESCRIPTION",
		"content" => GetMessage("DESCRIPTION"),
		"sort" => "",
		"default" => true
	),
	array(
		"id" => "GPS_N",
		"content" => GetMessage("GPS_N"),
		"sort" => "GPS_N",
		"default" => false
	),
	array(
		"id" => "GPS_S",
		"content" => GetMessage("GPS_S"),
		"sort" => "GPS_S",
		"default" => false
	),
	array(
		"id" => "PHONE",
		"content" => GetMessage("PHONE"),
		"sort" => "",
		"default" => true
	),
	array(
		"id" => "SCHEDULE",
		"content" => GetMessage("SCHEDULE"),
		"sort" => "",
		"default" => true
	),
	array(
		"id" => "DATE_MODIFY",
		"content" => GetMessage("DATE_MODIFY"),
		"sort" => "DATE_MODIFY",
		"default" => true
	),
	array(
		"id" => "MODIFIED_BY",
		"content" => GetMessage("MODIFIED_BY"),
		"sort" => "MODIFIED_BY",
		"default" => true
	),
	array(
		"id" => "DATE_CREATE",
		"content" => GetMessage("DATE_CREATE"),
		"sort" => "DATE_CREATE",
		"default" => false
	),
	array(
		"id" => "USER_ID",
		"content" => GetMessage("USER_ID"),
		"sort" => "USER_ID",
		"default" => false
	),
	array(
		"id" => "EMAIL",
		"content" => "Email",
		"sort" => "EMAIL",
		"default" => false
	),
	array(
		"id" => "ISSUING_CENTER",
		"content" => GetMessage("ISSUING_CENTER"),
		"sort" => "ISSUING_CENTER",
		"default" => false
	),
	array(
		"id" => "SHIPPING_CENTER",
		"content" => GetMessage("SHIPPING_CENTER"),
		"sort" => "SHIPPING_CENTER",
		"default" => false
	),
	array(
		"id" => "SITE_ID",
		"content" => GetMessage("STORE_SITE_ID"),
		"sort" => "SITE_ID",
		"default" => true
	),

));

$arSelectFieldsMap = array(
	"ID" => false,
	"TITLE" => false,
	"ACTIVE" => false,
	"ADDRESS" => false,
	"IMAGE_ID" => false,
	"DESCRIPTION" => false,
	"GPS_N" => false,
	"GPS_S" => false,
	"PHONE" => false,
	"SCHEDULE" => false,
	"DATE_MODIFY" => false,
	"MODIFIED_BY" => false,
	"DATE_CREATE" => false,
	"USER_ID" => false,
	"EMAIL" => false,
	"ISSUING_CENTER" => false,
	"SHIPPING_CENTER" => false,
	"SITE_ID" => false,
);

$arSelectFields = $lAdmin->GetVisibleHeaderColumns();
if(!in_array('ID', $arSelectFields))
	$arSelectFields[] = 'ID';

$arSelectFieldsMap = array_merge($arSelectFieldsMap, array_fill_keys($arSelectFields, true));

$arUserList = array();
$arUserID = array();
$strNameFormat = CSite::GetNameFormat(true);

$arRows = array();

while ($arRes = $dbResultList->Fetch())
{
	$arRes['ID'] = (int)$arRes['ID'];
	if($arSelectFieldsMap['USER_ID'])
	{
		$arRes['USER_ID'] = (int)$arRes['USER_ID'];
		if(0 < $arRes['USER_ID'])
			$arUserID[$arRes['USER_ID']] = true;
	}
	if($arSelectFieldsMap['MODIFIED_BY'])
	{
		$arRes['MODIFIED_BY'] = (int)$arRes['MODIFIED_BY'];
		if(0 < $arRes['MODIFIED_BY'])
			$arUserID[$arRes['MODIFIED_BY']] = true;
	}

	$arRows[$arRes['ID']] = $row =& $lAdmin->AddRow($arRes['ID'], $arRes);
	$row->AddField("ID", "<a href=\""."cat_store_edit.php?ID=".$arRes['ID']."&lang=".LANGUAGE_ID."&".GetFilterParams("filter_")."\">".$arRes['ID']."</a>");
	if($bReadOnly)
	{
		$row->AddViewField("SORT", $f_SORT);
		if($arSelectFieldsMap['TITLE'])
			$row->AddInputField("TITLE", false);
		if($arSelectFieldsMap['ADDRESS'])
			$row->AddInputField("ADDRESS", false);
		if($arSelectFieldsMap['DESCRIPTION'])
			$row->AddInputField("DESCRIPTION", false);
		if($arSelectFieldsMap['ACTIVE'])
			$row->AddCheckField("ACTIVE", false);
		if($arSelectFieldsMap['ISSUING_CENTER'])
			$row->AddCheckField("ISSUING_CENTER", false);
		if($arSelectFieldsMap['SHIPPING_CENTER'])
			$row->AddCheckField("SHIPPING_CENTER", false);
		if($arSelectFieldsMap['PHONE'])
			$row->AddInputField("PHONE", false);
		if($arSelectFieldsMap['SCHEDULE'])
			$row->AddInputField("SCHEDULE", false);
		if($arSelectFieldsMap['EMAIL'])
			$row->AddInputField("EMAIL", false);
		if($arSelectFieldsMap['IMAGE_ID'] && !$bExport)
			$row->AddField("IMAGE_ID", CFile::ShowImage($arRes['IMAGE_ID'], 100, 100, "border=0", "", true));
	}
	else
	{
		$row->AddInputField("SORT", array("size" => "3"));
		if($arSelectFieldsMap['SITE_ID'])
			$row->AddViewField("SITE_ID", getSiteTitle($arRes['SITE_ID']));
		if($arSelectFieldsMap['TITLE'])
			$row->AddInputField("TITLE");
		if($arSelectFieldsMap['ACTIVE'])
			$row->AddCheckField("ACTIVE");
		if($arSelectFieldsMap['ISSUING_CENTER'])
			$row->AddCheckField("ISSUING_CENTER");
		if($arSelectFieldsMap['SHIPPING_CENTER'])
			$row->AddCheckField("SHIPPING_CENTER");
		if($arSelectFieldsMap['ADDRESS'])
			$row->AddInputField("ADDRESS", array("size" => 30));
		if($arSelectFieldsMap['DESCRIPTION'])
			$row->AddInputField("DESCRIPTION", array("size" => 50));
		if($arSelectFieldsMap['PHONE'])
			$row->AddInputField("PHONE", array("size" => 25));
		if($arSelectFieldsMap['SCHEDULE'])
			$row->AddInputField("SCHEDULE", array("size" => 35));
		if($arSelectFieldsMap['EMAIL'])
			$row->AddInputField("EMAIL", array("size" => 35));
		if($arSelectFieldsMap['IMAGE_ID'] && !$bExport)
			$row->AddField("IMAGE_ID", CFile::ShowImage($arRes['IMAGE_ID'], 100, 100, "border=0", "", true));
	}

	if($arSelectFieldsMap['DATE_CREATE'])
		$row->AddCalendarField("DATE_CREATE", false);
	if($arSelectFieldsMap['DATE_MODIFY'])
		$row->AddCalendarField("DATE_MODIFY", false);

	$arActions = array();
	$arActions[] = array("ICON"=>"edit", "TEXT"=>GetMessage("EDIT_STORE_ALT"), "ACTION"=>$lAdmin->ActionRedirect("cat_store_edit.php?ID=".$arRes['ID']."&lang=".LANGUAGE_ID."&".GetFilterParams("filter_").""), "DEFAULT"=>true);

	if(!$bReadOnly)
	{
		$arActions[] = array("SEPARATOR" => true);
		$arActions[] = array("ICON"=>"delete", "TEXT"=>GetMessage("DELETE_STORE_ALT"), "ACTION"=>"if(confirm('".GetMessageJS('DELETE_STORE_CONFIRM')."')) ".$lAdmin->ActionDoGroup($arRes['ID'], "delete"));
	}

	$row->AddActions($arActions);
}
if(isset($row))
	unset($row);

if($arSelectFieldsMap['USER_ID'] || $arSelectFieldsMap['MODIFIED_BY'])
{
	if(!empty($arUserID))
	{
		$byUser = 'ID';
		$byOrder = 'ASC';
		$rsUsers = CUser::GetList(
			$byUser,
			$byOrder,
			array('ID' => implode(' | ', array_keys($arUserID))),
			array('FIELDS' => array('ID', 'LOGIN', 'NAME', 'LAST_NAME', 'SECOND_NAME', 'EMAIL'))
		);
		while ($arOneUser = $rsUsers->Fetch())
		{
			$arOneUser['ID'] = (int)$arOneUser['ID'];
			$arUserList[$arOneUser['ID']] = '<a href="/bitrix/admin/user_edit.php?lang='.LANGUAGE_ID.'&ID='.$arOneUser['ID'].'">'.CUser::FormatName($strNameFormat, $arOneUser).'</a>';
		}
	}

	foreach ($arRows as &$row)
	{
		if($arSelectFieldsMap['USER_ID'])
		{
			$strCreatedBy = '';
			if (0 < $row->arRes['USER_ID'] && isset($arUserList[$row->arRes['USER_ID']]))
			{
				$strCreatedBy = $arUserList[$row->arRes['USER_ID']];
			}
			$row->AddViewField("USER_ID", $strCreatedBy);
		}
		if($arSelectFieldsMap['MODIFIED_BY'])
		{
			$strModifiedBy = '';
			if (0 < $row->arRes['MODIFIED_BY'] && isset($arUserList[$row->arRes['USER_ID']]))
			{
				$strModifiedBy = $arUserList[$row->arRes['MODIFIED_BY']];
			}
			$row->AddViewField("MODIFIED_BY", $strModifiedBy);
		}
	}
	if(isset($row))
		unset($row);
}

$lAdmin->AddFooter(
	array(
		array(
			"title" => GetMessage("MAIN_ADMIN_LIST_SELECTED"),
			"value" => $dbResultList->SelectedRowsCount()
		),
		array(
			"counter" => true,
			"title" => GetMessage("MAIN_ADMIN_LIST_CHECKED"),
			"value" => "0"
		),
	)
);

if(!$bReadOnly)
{
	$lAdmin->AddGroupActionTable(
		array(
			"delete" => GetMessage("MAIN_ADMIN_LIST_DELETE"),
		)
	);
}

if(!$bReadOnly && $bCanAdd)
{
	$aContext = array(
		array(
			"TEXT" => GetMessage("STORE_ADD_NEW"),
			"ICON" => "btn_new",
			"LINK" => "cat_store_edit.php?lang=".LANGUAGE_ID,
			"TITLE" => GetMessage("STORE_ADD_NEW_ALT")
		),
	);
	$lAdmin->AddAdminContextMenu($aContext);
}

$lAdmin->CheckListMode();

$APPLICATION->SetTitle(GetMessage("STORE_TITLE"));
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");
?>

	<form name="find_form" method="GET" action="<?echo $APPLICATION->GetCurPage()?>?">
		<?
		$oFilter = new CAdminFilter(
			$sTableID."_filter",
			array(
				GetMessage("STORE_SITE_ID"),
			)
		);

		$oFilter->Begin();
		?>
		<tr>
			<td><?= GetMessage("STORE_SITE_ID") ?>:</td>
			<td>
				<?echo CSite::SelectBox("filter_site_id", $filter_site_id, "(".GetMessage("STORE_SITE_ID").")"); ?>
			</td>
		</tr>

		<?
		$oFilter->Buttons(
			array(
				"table_id" => $sTableID,
				"url" => $APPLICATION->GetCurPage(),
				"form" => "find_form"
			)
		);
		$oFilter->End();
		?>
	</form>


<?
$lAdmin->DisplayList();
?>

<?require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");?>