<?
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_before.php");
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/forum/include.php");

$forumModulePermissions = $APPLICATION->GetGroupRight("forum");
if ($forumModulePermissions == "D")
	$APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));

IncludeModuleLangFile(__FILE__); 
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/forum/prolog.php");

$sTableID = "tbl_forum_smile";

$oSort = new CAdminSorting($sTableID, "ID", "asc");
$lAdmin = new CAdminList($sTableID, $oSort);

$arFilterFields = array();

$lAdmin->InitFilter($arFilterFields);

$arFilter = array();

if (($arID = $lAdmin->GroupAction()) && $forumModulePermissions >= "W")
{
	if ($_REQUEST['action_target']=='selected')
	{
		$arID = array();
		$dbResultList = CForumSmile::GetList(
			array($by => $order),
			$arFilter
		);
		while ($arResult = $dbResultList->Fetch())
			$arID[] = $arResult['ID'];
	}

	foreach ($arID as $ID)
	{
		if (strlen($ID) <= 0)
			continue;

		switch ($_REQUEST['action'])
		{
			case "delete":

				@set_time_limit(0);

				$DB->StartTransaction();

				$arOldSmile = CForumSmile::GetByID($ID);

				if (!CForumSmile::Delete($ID))
				{
					$DB->Rollback();

					if ($ex = $APPLICATION->GetException())
						$lAdmin->AddGroupError($ex->GetString(), $ID);
					else
						$lAdmin->AddGroupError(GetMessage("ERROR_DEL_SMILE"), $ID);
				}
				else
				{
					if ($arOldSmile)
					{
						$strDirNameOld = $_SERVER["DOCUMENT_ROOT"]."/bitrix/images/forum/";
						if ($arOldSmile["TYPE"]=="I")
							$strDirNameOld .= "icon";
						else
							$strDirNameOld .= "smile";
						$strDirNameOld .= "/".$arOldSmile["IMAGE"];
						@unlink($strDirNameOld);
					}
				}
				BXClearCache(true, "/".LANG."/forum/smilesList/");
				BXClearCache(true, "/".LANG."/forum/iconsList/");
				BXClearCache(true, "/".LANG."/forum/smiles/");

				$DB->Commit();

				break;
		}
	}
}

$dbResultList = CForumSmile::GetList(
	array($by => $order),
	$arFilter
);

$dbResultList = new CAdminResult($dbResultList, $sTableID);
$dbResultList->NavStart();

$lAdmin->NavText($dbResultList->GetNavPrint(GetMessage("SMILE_NAV")));

$lAdmin->AddHeaders(array(
	array("id"=>"ID", "content"=>GetMessage("SMILE_ID"), "sort"=>"ID", "default"=>true),
	array("id"=>"NAME", "content"=>GetMessage("FORUM_NAME"),  "sort"=>"", "default"=>true),
	array("id"=>"SORT","content"=>GetMessage("SMILE_SORT"), "sort"=>"SORT", "default"=>true, "align"=>"right"),
	array("id"=>"TYPE", "content"=>GetMessage('SMILE_TYPE'),	"sort"=>"TYPE", "default"=>true),
	array("id"=>"TYPING", "content"=>GetMessage("FORUM_TYPING"), "sort"=>"", "default"=>true),
	array("id"=>"ICON", "content"=>GetMessage("FORUM_SMILE_ICON"), "sort"=>"", "default"=>true),
	array("id"=>"IMAGE", "content"=>GetMessage("FORUM_IMAGE_FILE"), "sort"=>"", "default"=>false),
));

$arVisibleColumns = $lAdmin->GetVisibleHeaderColumns();

while ($arForum = $dbResultList->NavNext(true, "f_"))
{
	$row =& $lAdmin->AddRow($f_ID, $arForum);

	$row->AddField("ID", $f_ID);
	$row->AddField("SORT", $f_SORT);
	$row->AddField("TYPE", (($f_TYPE=="I") ? GetMessage("SMILE_TYPE_ICON") : GetMessage("SMILE_TYPE_SMILE")));

	if (in_array("NAME", $arVisibleColumns))
	{
		$arSmileLang = CForumSmile::GetLangByID($f_ID, LANG);
		$fieldShow = htmlspecialcharsbx($arSmileLang["NAME"]);
		$row->AddViewField("NAME", '<a title="'.GetMessage("FORUM_EDIT_DESCR").'" href="'."forum_smile_edit.php?ID=".$f_ID."&lang=".LANG."&".GetFilterParams("filter_").'">'.$fieldShow.'</a>');
	}

	$row->AddField("TYPING", $f_TYPING);
	$row->AddField("ICON", "<img src=\"/bitrix/images/forum/".(($f_TYPE=="I")?"icon":"smile")."/".$f_IMAGE."\" border=\"0\" ".((IntVal($f_IMAGE_WIDTH) > 0) ? "width=\"".$f_IMAGE_WIDTH."\"" : "")." ".((IntVal($f_IMAGE_WIDTH) > 0) ? "height=\"".$f_IMAGE_HEIGHT."\"" : "" ).">");
	$row->AddField("IMAGE", "/bitrix/images/forum/".(($f_TYPE=="I")?"icon":"smile")."/".$f_IMAGE);
	$arActions = Array();
	if ($forumModulePermissions >= "R")
	{
		$arActions[] = array("ICON"=>"edit", "TEXT"=>GetMessage("FORUM_EDIT_DESCR"), "ACTION"=>$lAdmin->ActionRedirect("forum_smile_edit.php?ID=".$f_ID."&lang=".LANG."&".GetFilterParams("filter_").""), "DEFAULT"=>true);
	}
	if ($forumModulePermissions >= "W")
	{
		$arActions[] = array("SEPARATOR" => true);
		$arActions[] = array("ICON"=>"delete", "TEXT"=>GetMessage("FORUM_DELETE_DESCR"), "ACTION"=>"if(confirm('".GetMessage('SMILE_DEL_CONF')."')) ".$lAdmin->ActionDoGroup($f_ID, "delete"));
	}

	$row->AddActions($arActions);
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

$lAdmin->AddGroupActionTable(
	array(
		"delete" => GetMessage("MAIN_ADMIN_LIST_DELETE"),
	)
);

if ($forumModulePermissions >= "W")
{
	$aContext = array(
		array(
			"TEXT" => GetMessage("FSAN_ADD_NEW"),
			"LINK" => "forum_smile_edit.php?lang=".LANG,
			"TITLE" => GetMessage("FSAN_ADD_NEW_ALT"),
			"ICON" => "btn_new",
		),
	);
	$lAdmin->AddAdminContextMenu($aContext);
}

$lAdmin->CheckListMode();


/****************************************************************************/
/***********  MAIN PAGE  ****************************************************/
/****************************************************************************/
$APPLICATION->SetTitle(GetMessage("SMILE_TITLE"));
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");

$lAdmin->DisplayList();

require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");
?>