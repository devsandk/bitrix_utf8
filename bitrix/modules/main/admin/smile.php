<?
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_before.php");

if(!$USER->CanDoOperation('edit_other_settings'))
	$APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));

IncludeModuleLangFile(__FILE__); 

$sTableID = "tbl_smile";

$oSort = new CAdminSorting($sTableID, "ID", "asc");
$lAdmin = new CAdminList($sTableID, $oSort);

$arFilterFields = array();

$lAdmin->InitFilter($arFilterFields);

$arFilter = array();
if (isset($_REQUEST['SET_ID']))
	$arFilter['SET_ID'] = intval($_REQUEST['SET_ID']);

if ($arID = $lAdmin->GroupAction())
{
	if ($_REQUEST['action_target']=='selected')
	{
		$arID = Array();
		$res = CSmile::getList(Array(
			'ORDER' => array($by => $order),
			'SELECT' => array('ID'),
			'FILTER' => $arFilter,
			'RETURN_RES' => 'Y'
		));
		while ($row = $res->Fetch())
			$arID[] = $row['ID'];
	}
	foreach ($arID as $ID)
	{
		if (strlen($ID) <= 0)
			continue;

		if ($_REQUEST['action'] == 'delete')
		{
			$arSmile = CSmile::getByID($ID);
			if (CSmile::delete($ID))
			{
				if ($arSmile)
				{
					@unlink($_SERVER["DOCUMENT_ROOT"].($arSmile['TYPE'] == CSmile::TYPE_ICON? CSmile::PATH_TO_ICON: CSmile::PATH_TO_SMILE).$arSmile['SET_ID'].'/'.$arSmile['IMAGE']);
				}
			}
		}
	}
}
if($lAdmin->EditAction())
{
	foreach($FIELDS as $ID=>$arFields)
	{
		$ID = IntVal($ID);
		if($ID <= 0)
			continue;

		CSmile::update($ID, Array(
			'LANG' => Array(
				LANGUAGE_ID => $arFields['NAME']
			),
			'SORT' => $arFields['SORT'],
			'TYPING' => $arFields['TYPING'],
		));
	}
}

$dbResultList = CSmile::getList(Array(
	'SELECT' => Array('ID', 'SET_ID', 'SET_NAME', 'TYPE', 'NAME', 'SORT', 'TYPING', 'IMAGE', 'IMAGE_WIDTH', 'IMAGE_HEIGHT'),
	'FILTER' => $arFilter,
	'ORDER' => array($by => $order),
	'NAV_PARAMS' => array("nPageSize"=>CAdminResult::GetNavSize($sTableID)),
	'RETURN_RES' => 'Y'
));

$dbResultList = new CAdminResult($dbResultList, $sTableID);
$dbResultList->NavStart();

$lAdmin->NavText($dbResultList->GetNavPrint(GetMessage("SMILE_NAV")));

$lAdmin->AddHeaders(array(
	array("id"=>"ID", "content"=>GetMessage("SMILE_ID"), "sort"=>"ID", "default"=>true),
	array("id"=>"SORT","content"=>GetMessage("SMILE_SORT"), "sort"=>"SORT", "default"=>true, "align"=>"right"),
	array("id"=>"NAME", "content"=>GetMessage("SMILE_NAME"), "default"=>true),
	array("id"=>"TYPING", "content"=>GetMessage("SMILE_TYPING"), "default"=>true),
	array("id"=>"ICON", "content"=>GetMessage("SMILE_ICON"), "default"=>true),
	array("id"=>"SET_NAME", "content"=>GetMessage("SMILE_SET_NAME"), "default"=>true),
	array("id"=>"TYPE", "content"=>GetMessage('SMILE_TYPE'), "default"=>true),
	array("id"=>"IMAGE", "content"=>GetMessage("SMILE_IMAGE_FILE"), "default"=>false),
));

$arVisibleColumns = $lAdmin->GetVisibleHeaderColumns();

while ($arForum = $dbResultList->NavNext(true, "f_"))
{
	$row =& $lAdmin->AddRow($f_ID, $arForum);

	$row->AddField("ID", $f_ID);
	$row->AddField("SORT", $f_SORT);
	$row->AddField("TYPE", ($f_TYPE==CSmile::TYPE_ICON? GetMessage("SMILE_TYPE_ICON"): GetMessage("SMILE_TYPE_SMILE")));

	$row->AddViewField("SET_NAME", '<a title="'.GetMessage("SMILE_EDIT_DESCR").'" href="'."smile_set_edit.php?ID=".$f_SET_ID."&lang=".LANG."&".GetFilterParams("filter_").'">'.(strlen($f_SET_NAME)>0?$f_SET_NAME: GetMessage('SMILE_SET_NO_NAME', Array('#ID#' => $f_SET_ID))).'</a>');
	$row->AddViewField("NAME", '<a title="'.GetMessage("SMILE_EDIT_DESCR").'" href="'."smile_edit.php?ID=".$f_ID."&lang=".LANG."&".GetFilterParams("filter_").'">'.(strlen($f_NAME)>0?$f_NAME: GetMessage('SMILE_NO_NAME')).'</a>');

	$row->AddField("TYPING", $f_TYPING);
	$row->AddField("ICON", "<img src=\"".($f_TYPE == CSmile::TYPE_ICON? CSmile::PATH_TO_ICON: CSmile::PATH_TO_SMILE).$f_SET_ID."/".$f_IMAGE."\" border=\"0\" ".((IntVal($f_IMAGE_WIDTH) > 0) ? "width=\"".$f_IMAGE_WIDTH."\"" : "")." ".((IntVal($f_IMAGE_HEIGHT) > 0) ? "height=\"".$f_IMAGE_HEIGHT."\"" : "" ).">");
	$row->AddField("IMAGE", ($f_TYPE == CSmile::TYPE_ICON? CSmile::PATH_TO_ICON: CSmile::PATH_TO_SMILE).$f_SET_ID."/".$f_IMAGE);

	$row->AddInputField("NAME", array("size"=>20));
	$row->AddInputField("TYPING", array("size"=>10));
	$row->AddInputField("SORT", array("size"=>5));

	$arActions = Array(
		array("ICON"=>"edit", "TEXT"=>GetMessage("SMILE_EDIT_DESCR"), "ACTION"=>$lAdmin->ActionRedirect("smile_edit.php?ID=".$f_ID."&lang=".LANG."&".GetFilterParams("filter_").""), "DEFAULT"=>true),
		array("SEPARATOR" => true),
		array("ICON"=>"delete", "TEXT"=>GetMessage("SMILE_DELETE_DESCR"), "ACTION"=>"if(confirm('".GetMessage('SMILE_DEL_CONF')."')) ".$lAdmin->ActionDoGroup($f_ID, "delete"))
	);
	$row->AddActions($arActions);
}

$lAdmin->AddGroupActionTable(
	array(
		"delete" => true,
	)
);

$aContext = array(
	array(
		"TEXT" => GetMessage("SMILE_BTN_ADD_NEW"),
		"LINK" => "smile_edit.php?lang=".LANG."&SET_ID=".intval($_REQUEST['SET_ID']),
		"TITLE" => GetMessage("SMILE_BTN_ADD_NEW_ALT"),
		"ICON" => "btn_new",
	),
);
if (!empty($arFilter))
{
	$aContext[] = array(
		"TEXT" => GetMessage("SMILE_BTN_IMPORT"),
		"LINK" => "smile_import.php?lang=".LANG."&SET_ID=".intval($_REQUEST['SET_ID']),
	);

	$aContext[] = array(
		"TEXT" => GetMessage("SMILE_BTN_CLEAR_FILTER"),
		"LINK" => "smile.php?lang=".LANG,
	);
}
$lAdmin->AddAdminContextMenu($aContext);
$lAdmin->CheckListMode();

$APPLICATION->SetTitle(GetMessage("SMILE_TITLE"));
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");

$lAdmin->DisplayList();

require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");
?>