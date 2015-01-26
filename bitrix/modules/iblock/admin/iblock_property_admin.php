<?
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_before.php");
CModule::IncludeModule("iblock");
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/iblock/prolog.php");
IncludeModuleLangFile(__FILE__);

$arIBlock = CIBlock::GetArrayByID($_GET["IBLOCK_ID"]);
if(!is_array($arIBlock))
	$APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));

if(!CIBlockRights::UserHasRightTo($arIBlock["ID"], $arIBlock["ID"], "iblock_edit"))
	$APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));

$sTableID = "tbl_iblock_property_admin_".$arIBlock["ID"];
$oSort = new CAdminSorting($sTableID, "SORT", "ASC");
$arOrder = (strtoupper($by) === "ID"? array($by => $order): array($by => $order, "ID" => "ASC"));
$lAdmin = new CAdminList($sTableID, $oSort);

$arFilterFields = array(
	"find_name",
	"find_code",
	"find_active",
	"find_searchable",
	"find_filtrable",
	"find_is_required",
	"find_multiple",
	"find_xml_id",
	"find_property_type",
);

$lAdmin->InitFilter($arFilterFields);

$arFilter = array(
	"IBLOCK_ID" => $arIBlock["ID"],
	"?NAME" => $find_name,
	"?CODE" => $find_code,
	"ACTIVE" => $find_active,
	"SEARCHABLE" => $find_searchable,
	"FILTRABLE" => $find_filtrable,
	"XML_ID" => $find_xml_id,
	"PROPERTY_TYPE" => $find_property_type,
	"IS_REQUIRED" => $find_is_required,
	"MULTIPLE" => $find_multiple,
);
foreach($arFilter as $key => $value)
	if(!strlen(trim($value)))
		unset($arFilter[$key]);

if($lAdmin->EditAction())
{
	foreach($FIELDS as $ID => $arFields)
	{
		$DB->StartTransaction();
		$ID = IntVal($ID);

		if(!$lAdmin->IsUpdated($ID))
			continue;

		$arFields["USER_TYPE"] = "";
		if (strpos($arFields["PROPERTY_TYPE"], ":"))
		{
			list($arFields["PROPERTY_TYPE"], $arFields["USER_TYPE"]) = explode(':', $arFields["PROPERTY_TYPE"], 2);
		}

		$ibp = new CIBlockProperty;
		if(!$ibp->Update($ID, $arFields))
		{
			$lAdmin->AddUpdateError(GetMessage("IBP_ADM_SAVE_ERROR", array("#ID#"=>$ID, "#ERROR_TEXT#"=>$ibp->LAST_ERROR)), $ID);
			$DB->Rollback();
		}
		$DB->Commit();
	}
}

if($arID = $lAdmin->GroupAction())
{
	if($_REQUEST['action_target']=='selected')
	{
		$rsIBlockProps = CIBlockProperty::GetList($arOrder, $arFilter);
		while($arRes = $rsIBlockProps->Fetch())
			$arID[] = $arRes['ID'];
	}

	foreach($arID as $ID)
	{
		if(strlen($ID)<=0)
			continue;

		switch($_REQUEST['action'])
		{
		case "delete":
			if(!CIBlockProperty::Delete($ID))
				$lAdmin->AddGroupError(GetMessage("IBP_ADM_DELETE_ERROR"), $ID);
			break;
		case "activate":
		case "deactivate":
			$ibp = new CIBlockProperty();
			$arFields = array(
				"ACTIVE" => ($_REQUEST['action']=="activate"? "Y": "N"),
			);
			if(!$ibp->Update($ID, $arFields))
				$lAdmin->AddUpdateError(GetMessage("IBP_ADM_SAVE_ERROR", array("#ID#"=>$ID, "#ERROR_TEXT#"=>$ibp->LAST_ERROR)), $ID);
			break;
		}
	}
}

$arHeader = array(
	array(
		"id"=>"ID",
		"content"=>GetMessage("IBP_ADM_ID"),
		"sort"=>"id",
		"align"=>"right",
		"default"=>true,
	),
	array(
		"id"=>"NAME",
		"content"=>GetMessage("IBP_ADM_NAME"),
		"sort"=>"name",
		"default"=>true,
	),
	array(
		"id"=>"CODE",
		"content"=>GetMessage("IBP_ADM_CODE"),
		"default"=>true,
	),
	array(
		"id"=>"PROPERTY_TYPE",
		"content"=>GetMessage("IBP_ADM_PROPERTY_TYPE"),
		"default"=>true,
	),
	array(
		"id"=>"SORT",
		"content"=>GetMessage("IBP_ADM_SORT"),
		"sort"=>"sort",
		"align"=>"right",
		"default"=>true,
	),
	array(
		"id"=>"ACTIVE",
		"content"=>GetMessage("IBP_ADM_ACTIVE"),
		"sort"=>"active",
		"align"=>"center",
		"default"=>true,
	),
	array(
		"id"=>"IS_REQUIRED",
		"content"=>GetMessage("IBP_ADM_IS_REQUIRED"),
		"align"=>"center",
		"default"=>true,
	),
	array(
		"id"=>"MULTIPLE",
		"content"=>GetMessage("IBP_ADM_MULTIPLE"),
		"align"=>"center",
		"default"=>true,
	),
	array(
		"id"=>"SEARCHABLE",
		"content"=>GetMessage("IBP_ADM_SEARCHABLE"),
		"sort"=>"searchable",
		"align"=>"center",
		"default"=>true,
	),
	array(
		"id"=>"FILTRABLE",
		"content"=>GetMessage("IBP_ADM_FILTRABLE"),
		"sort"=>"filtrable",
		"align"=>"center",
	),
	array(
		"id"=>"XML_ID",
		"content"=>GetMessage("IBP_ADM_XML_ID"),
	),
	array(
		"id"=>"WITH_DESCRIPTION",
		"content"=>GetMessage("IBP_ADM_WITH_DESCRIPTION"),
		"align"=>"center",
	),
	array(
		"id"=>"HINT",
		"content"=>GetMessage("IBP_ADM_HINT"),
	),
);

$arPropType = array(
	"S" => GetMessage("IBLOCK_PROP_S"),
	"N" => GetMessage("IBLOCK_PROP_N"),
	"L" => GetMessage("IBLOCK_PROP_L"),
	"F" => GetMessage("IBLOCK_PROP_F"),
	"G" => GetMessage("IBLOCK_PROP_G"),
	"E" => GetMessage("IBLOCK_PROP_E"),
);
$arUserTypeList = CIBlockProperty::GetUserType();
\Bitrix\Main\Type\Collection::sortByColumn($arUserTypeList, array('DESCRIPTION' => SORT_STRING));
foreach($arUserTypeList as $arUserType)
	$arPropType[$arUserType["PROPERTY_TYPE"].":".$arUserType["USER_TYPE"]] = $arUserType["DESCRIPTION"];

$lAdmin->AddHeaders($arHeader);

$rsIBlockProps = CIBlockProperty::GetList($arOrder, $arFilter);
$rsIBlockProps = new CAdminResult($rsIBlockProps, $sTableID);
$rsIBlockProps->NavStart();

$lAdmin->NavText($rsIBlockProps->GetNavPrint(GetMessage("IBP_ADM_PAGER")));

while($dbrs = $rsIBlockProps->NavNext(true, "f_"))
{
	if($dbrs["USER_TYPE"])
		$dbrs["PROPERTY_TYPE"] .= ":".$dbrs["USER_TYPE"];
	$row =& $lAdmin->AddRow($f_ID, $dbrs, 'iblock_edit_property.php?ID='.$f_ID.'&lang='.LANGUAGE_ID."&IBLOCK_ID=".urlencode($arIBlock["ID"]).($_REQUEST["admin"]=="Y"? "&admin=Y": "&admin=N"));

	$row->AddViewField("ID", $f_ID);
	$row->AddInputField("NAME", Array("size"=>"35"));
	$row->AddViewField("NAME", '<a href="iblock_edit_property.php?ID='.$f_ID.'&lang='.LANGUAGE_ID."&IBLOCK_ID=".urlencode($arIBlock["ID"]).($_REQUEST["admin"]=="Y"? "&admin=Y": "&admin=N").'">'.$f_NAME.'</a>');
	$row->AddInputField("CODE");
	$row->AddInputField("SORT", Array("size"=>"5"));
	$row->AddCheckField("ACTIVE");
	$row->AddCheckField("MULTIPLE");
	$row->AddInputField("XML_ID");
	$row->AddCheckField("WITH_DESCRIPTION");
	$row->AddCheckField("SEARCHABLE");
	$row->AddCheckField("FILTRABLE");
	$row->AddCheckField("IS_REQUIRED");
	$row->AddInputField("HINT");
	$row->AddSelectField("PROPERTY_TYPE", $arPropType);

	$arActions = array(
		array(
			"ICON"=>"edit",
			"TEXT"=>GetMessage("MAIN_ADMIN_MENU_EDIT"),
			"DEFAULT"=>true,
			"ACTION" => $lAdmin->ActionRedirect("iblock_edit_property.php?ID=".$f_ID."&lang=".LANGUAGE_ID."&IBLOCK_ID=".urlencode($arIBlock["ID"]).($_REQUEST["admin"]=="Y"? "&admin=Y": "&admin=N")),
		),
		array(
			"ICON"=>"delete",
			"TEXT"=>GetMessage("MAIN_ADMIN_MENU_DELETE"),
			"ACTION"=>"if(confirm('".GetMessageJS("IBP_ADM_CONFIRM_DEL_MESSAGE")."')) ".$lAdmin->ActionDoGroup($f_ID, "delete", "&IBLOCK_ID=".urlencode($arIBlock["ID"])."&lang=".LANGUAGE_ID),
		),
	);
	$row->AddActions($arActions);
}

$lAdmin->AddFooter(
	array(
		array("title"=>GetMessage("MAIN_ADMIN_LIST_SELECTED"), "value"=>$rsIBlockProps->SelectedRowsCount()),
		array("counter"=>true, "title"=>GetMessage("MAIN_ADMIN_LIST_CHECKED"), "value"=>"0"),
	)
);

$aContext = array(
	array(
		"ICON"=>"btn_new",
		"TEXT"=>GetMessage("IBP_ADM_TO_ADD"),
		"LINK"=>"iblock_edit_property.php?lang=".LANGUAGE_ID."&IBLOCK_ID=".urlencode($arIBlock["ID"])."&ID=n0".($_REQUEST["admin"]=="Y"? "&admin=Y": "&admin=N"),
		"TITLE"=>GetMessage("IBP_ADM_TO_ADD_TITLE")
	),
);
$lAdmin->AddAdminContextMenu($aContext);

$lAdmin->AddGroupActionTable(Array(
	"delete"=>GetMessage("MAIN_ADMIN_LIST_DELETE"),
	"activate"=>GetMessage("MAIN_ADMIN_LIST_ACTIVATE"),
	"deactivate"=>GetMessage("MAIN_ADMIN_LIST_DEACTIVATE"),
));

$lAdmin->CheckListMode();

$APPLICATION->SetTitle(GetMessage("IBP_ADM_TITLE", array("#IBLOCK_NAME#" => htmlspecialcharsex($arIBlock["NAME"]))));

require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");
?>
<form method="GET" action="iblock_admin.php?type=<?=urlencode($type)?>" name="find_form">
<?
$oFilter = new CAdminFilter(
	$sTableID."_filter",
	array(
		"find_code" => GetMessage("IBP_ADM_CODE"),
		"find_active" => GetMessage("IBP_ADM_ACTIVE"),
		"find_searchable" => GetMessage("IBP_ADM_SEARCHABLE"),
		"find_filtrable" => GetMessage("IBP_ADM_FILTRABLE"),
		"find_is_required" => GetMessage("IBP_ADM_IS_REQUIRED"),
		"find_multiple" => GetMessage("IBP_ADM_MULTIPLE"),
		"find_xml_id" => GetMessage("IBP_ADM_XML_ID"),
		"find_property_type" => GetMessage("IBP_ADM_PROPERTY_TYPE"),
	)
);

$oFilter->Begin();

	$arr = array(
		"reference" => array(GetMessage("IBLOCK_YES"), GetMessage("IBLOCK_NO")),
		"reference_id" => array("Y","N"),
	);
?>
	<tr>
		<td><b><?echo GetMessage("IBP_ADM_NAME")?>:</b></td>
		<td><input type="text" name="find_name" value="<?echo htmlspecialcharsbx($find_name)?>" size="40"></td>
	</tr>
	<tr>
		<td><?echo GetMessage("IBP_ADM_CODE")?>:</td>
		<td><input type="text" name="find_code" value="<?echo htmlspecialcharsbx($find_code)?>" size="40"></td>
	</tr>
	<tr>
		<td><?echo GetMessage("IBP_ADM_ACTIVE")?>:</td>
		<td><? echo SelectBoxFromArray("find_active", $arr, htmlspecialcharsex($find_active), GetMessage('IBLOCK_ALL')); ?></td>
	</tr>
	<tr>
		<td><?echo GetMessage("IBP_ADM_SEARCHABLE")?>:</td>
		<td><? echo SelectBoxFromArray("find_searchable", $arr, htmlspecialcharsex($find_searchable), GetMessage('IBLOCK_ALL')); ?></td>
	</tr>
	<tr>
		<td><?echo GetMessage("IBP_ADM_FILTRABLE")?>:</td>
		<td><? echo SelectBoxFromArray("find_filtrable", $arr, htmlspecialcharsex($find_filtrable), GetMessage('IBLOCK_ALL')); ?></td>
	</tr>
	<tr>
		<td><?echo GetMessage("IBP_ADM_IS_REQUIRED")?>:</td>
		<td><? echo SelectBoxFromArray("find_is_required", $arr, htmlspecialcharsex($find_is_required), GetMessage('IBLOCK_ALL')); ?></td>
	</tr>
	<tr>
		<td><?echo GetMessage("IBP_ADM_MULTIPLE")?>:</td>
		<td><? echo SelectBoxFromArray("find_multiple", $arr, htmlspecialcharsex($find_multiple), GetMessage('IBLOCK_ALL')); ?></td>
	</tr>
	<tr>
		<td><?echo GetMessage("IBP_ADM_XML_ID")?>:</td>
		<td><input type="text" name="find_xml_id" value="<?echo htmlspecialcharsbx($find_xml_id)?>" size="40"></td>
	</tr>
	<tr>
		<td><?echo GetMessage("IBP_ADM_PROPERTY_TYPE")?>:</td>
		<td><? echo SelectBoxFromArray("find_property_type", array(
			"reference_id" => array_keys($arPropType),
			"reference" => array_values($arPropType),
		), htmlspecialcharsex($find_filtrable), GetMessage('IBLOCK_ALL')); ?></td>
	</tr>
<?
$oFilter->Buttons(array(
	"table_id"=>$sTableID,
	"url"=>$APPLICATION->GetCurPage().'?IBLOCK_ID='.urlencode($arIBlock["ID"]),
	"form"=>"find_form",
));
$oFilter->End();
?>
</form>
<?
$lAdmin->DisplayList();

require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");
?>
