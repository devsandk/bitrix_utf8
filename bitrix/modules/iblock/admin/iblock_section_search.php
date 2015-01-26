<?
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_before.php");
CModule::IncludeModule("iblock");
IncludeModuleLangFile(__FILE__);

//Init variables
$IBLOCK_ID = IntVal($_GET["IBLOCK_ID"]);
$n = preg_replace("/[^a-zA-Z0-9_\\[\\]]/", "", $_GET["n"]);
$k = preg_replace("/[^a-zA-Z0-9_:]/", "", $_GET["k"]);
$m = $_GET["m"] === "y";
$get_xml_id = $_GET["get_xml_id"] === "Y";
$lookup = preg_replace("/[^a-zA-Z0-9_:]/", "", $_GET["lookup"]);
$strWarning = "";

$boolDiscount = (array_key_exists('discount', $_REQUEST) && 'Y' == $_REQUEST['discount']);

$arIBTYPE = false;
if($IBLOCK_ID > 0)
{
	$arIBlock = CIBlock::GetArrayByID($IBLOCK_ID);
	if($arIBlock)
	{
		$arIBTYPE = CIBlockType::GetByIDLang($arIBlock["IBLOCK_TYPE_ID"], LANG);
		if(!$arIBTYPE)
			$APPLICATION->AuthForm(GetMessage("IBLOCK_BAD_BLOCK_TYPE_ID"));

		$bBadBlock = !CIBlockRights::UserHasRightTo($IBLOCK_ID, $IBLOCK_ID, "iblock_admin_display");
	}
	else
	{
		$bBadBlock = true;
	}
	if($bBadBlock)
		$APPLICATION->AuthForm(GetMessage("IBLOCK_BAD_IBLOCK"));
}
else
{
	$arIBlock = array(
		"ID" => 0,
		"NAME" => "",
		"SECTIONS_NAME" => GetMessage("IBLOCK_SECSEARCH_SECTIONS"),
	);
}

$APPLICATION->SetTitle(GetMessage("IBLOCK_SECSEARCH_TITLE"));

if($IBLOCK_ID > 0)
	$entity_id = "IBLOCK_".$IBLOCK_ID."_SECTION";
else
	$entity_id = false;

$sTableID = ($boolDiscount ? "tbl_iblock_section_search_".md5('discount') : "tbl_iblock_section_search_".intval($arIBlock["ID"]));
$oSort = new CAdminSorting($sTableID, "NAME", "asc");
$arOrder = (strtoupper($by) === "ID"? array($by => $order): array($by => $order, "ID" => "ASC"));
$lAdmin = new CAdminList($sTableID, $oSort);

$arFilterFields = Array(
	"find_section_id",
	"find_section_timestamp_1",
	"find_section_timestamp_2",
	"find_section_modified_by",
	"find_section_date_create_1",
	"find_section_date_create_2",
	"find_section_created_by",
	"find_section_name",
	"find_section_active",
	"find_section_section",
	"find_section_code",
	"find_section_external_id"
);
if($entity_id)
	$USER_FIELD_MANAGER->AdminListAddFilterFields($entity_id, $arFilterFields);

$section_id = intval($find_section_section);
$lAdmin->InitFilter($arFilterFields);
$find_section_section = $section_id;
if($find_section_section<=0)
	$find_section_section=-1;

############################################

$arFilter = Array(
	"?NAME"		=> $find_section_name,
	"SECTION_ID"	=> $find_section_section,
	"ID"		=> $find_section_id,
	">=TIMESTAMP_X"	=> $find_section_timestamp_1,
	"<=TIMESTAMP_X"	=> $find_section_timestamp_2,
	"MODIFIED_BY"	=> $find_section_modified_user_id? $find_section_modified_user_id: $find_section_modified_by,
	">=DATE_CREATE"	=> $find_section_date_create_1,
	"<=DATE_CREATE"	=> $find_section_date_create_2,
	"CREATED_BY"	=> $find_section_created_user_id? $find_section_created_user_id: $find_section_created_by,
	"ACTIVE"	=> $find_section_active,
	"CODE"		=> $find_section_code,
	"EXTERNAL_ID"	=> $find_section_external_id,
);
if($entity_id)
	$USER_FIELD_MANAGER->AdminListAddFilter($entity_id, $arFilter);

if($find_section_section == "")
	unset($arFilter["SECTION_ID"]);

if($IBLOCK_ID > 0)
	$arFilter["IBLOCK_ID"] = $IBLOCK_ID;
else
	$arFilter["IBLOCK_ID"] = -1;

$arFilter["CHECK_PERMISSIONS"]="Y";

// list header
$arHeaders = array(
	array(
		"id" => "ID",
		"content" => GetMessage("IBLOCK_SECSEARCH_ID"),
		"sort" => "id",
		"default" => true,
		"align" => "right",
	),
	array(
		"id" => "NAME",
		"content" => GetMessage("IBLOCK_SECSEARCH_NAME"),
		"sort" => "name",
		"default" => true,
	),
	array(
		"id" => "ACTIVE",
		"content" => GetMessage("IBLOCK_SECSEARCH_ACTIVE"),
		"sort" => "active",
		"default" => true,
		"align" => "center",
	),
	array(
		"id" => "SORT",
		"content" => GetMessage("IBLOCK_SECSEARCH_SORT"),
		"sort" => "sort",
		"default" => true,
		"align" => "right",
	),
	array(
		"id" => "CODE",
		"content" => GetMessage("IBLOCK_SECSEARCH_CODE"),
		"sort" => "code",
	),
	array(
		"id" => "XML_ID",
		"content" => GetMessage("IBLOCK_SECSEARCH_XML_ID"),
	),
	array(
		"id" => "ELEMENT_CNT",
		"content" => GetMessage("IBLOCK_SECSEARCH_ELEMENT_CNT"),
		"sort" => "element_cnt",
		"align" => "right",
	),
	array(
		"id" => "SECTION_CNT",
		"content" => GetMessage("IBLOCK_SECSEARCH_SECTION_CNT"),
		"default" => true,
		"align" => "right",
	),
	array(
		"id" => "TIMESTAMP_X",
		"content" => GetMessage("IBLOCK_SECSEARCH_TIMESTAMP"),
		"sort" => "timestamp_x",
	),
	array(
		"id" => "MODIFIED_BY",
		"content" => GetMessage("IBLOCK_SECSEARCH_MODIFIED_BY"),
		"sort" => "modified_by",
	),
	array(
		"id" => "DATE_CREATE",
		"content" => GetMessage("IBLOCK_SECSEARCH_DATE_CREATE"),
		"sort" => "date_create",
	),
	array(
		"id" => "CREATED_BY",
		"content" => GetMessage("IBLOCK_SECSEARCH_CREATED_BY"),
		"sort" => "created_by",
	),
);
if($entity_id)
	$USER_FIELD_MANAGER->AdminListAddHeaders($entity_id, $arHeaders);
$lAdmin->AddHeaders($arHeaders);

$arVisibleColumns = $lAdmin->GetVisibleHeaderColumns();
$arVisibleColumnsMap = array();
foreach($arVisibleColumns as $value)
	$arVisibleColumnsMap[$value] = true;

if(array_key_exists("ELEMENT_CNT", $arVisibleColumnsMap))
{
	$arFilter["CNT_ALL"] = "Y";
	$arFilter["ELEMENT_SUBSECTIONS"] = "N";
	$rsData = CIBlockSection::GetList($arOrder, $arFilter, true, $arVisibleColumns);
}
else
{
	$rsData = CIBlockSection::GetList($arOrder, $arFilter, false, $arVisibleColumns);
}

$rsData = new CAdminResult($rsData, $sTableID);
$rsData->NavStart();
$lAdmin->NavText($rsData->GetNavPrint($arIBlock["SECTIONS_NAME"]));

$strPath = "";
$jsPath  = "";
if(intval($find_section_section) > 0)
{
	$nav = CIBlockSection::GetNavChain($IBLOCK_ID, $find_section_section);
	while($ar_nav = $nav->GetNext())
	{
		$strPath .= htmlspecialcharsbx($ar_nav["~NAME"], ENT_QUOTES)."&nbsp;/&nbsp;";
		$jsPath .= htmlspecialcharsbx(CUtil::JSEscape($ar_nav["~NAME"]), ENT_QUOTES)."&nbsp;/&nbsp;";
	}
}

$arUsersCache = array();

while($arRes = $rsData->NavNext(true, "f_"))
{
	$sec_list_url = 'iblock_section_search.php?IBLOCK_ID='.$IBLOCK_ID.'&amp;lang='.LANG.'&amp;find_section_section='.$f_ID.'&amp;n='.urlencode($n).'&amp;k='.urlencode($k).($m? "&amp;m=y": "");

	$row =& $lAdmin->AddRow($f_ID, $arRes);

	if($entity_id)
		$USER_FIELD_MANAGER->AddUserFields($entity_id, $arRes, $row);

	$row->AddViewField("NAME", '<a href="'.$sec_list_url.'" onclick="'.$lAdmin->ActionAjaxReload($sec_list_url).'; return false;" title="'.GetMessage("IBLOCK_SECSEARCH_LIST").'">'.$f_NAME.'</a><div style="display:none" id="name_'.$f_ID.'">'.$strPath.$f_NAME.'&nbsp;/&nbsp;'.'</div>');

	$row->AddCheckField("ACTIVE");

	if(array_key_exists("ELEMENT_CNT", $arVisibleColumnsMap))
		$row->AddViewField("ELEMENT_CNT", $f_ELEMENT_CNT.'('.IntVal(CIBlockSection::GetSectionElementsCount($f_ID, Array("CNT_ALL"=>"Y"))).')');

	if(array_key_exists("SECTION_CNT", $arVisibleColumnsMap))
	{
		$arFilter = Array("IBLOCK_ID"=>$IBLOCK_ID, "SECTION_ID"=>$f_ID);
		$row->AddViewField("SECTION_CNT", '<a href="'.$sec_list_url.'" onclick="'.$lAdmin->ActionAjaxReload($sec_list_url).'; return false;" title="'.GetMessage("IBLOCK_SECSEARCH_LIST").'">'.IntVal(CIBlockSection::GetCount($arFilter)).'</a>');
	}

	if(array_key_exists("MODIFIED_BY", $arVisibleColumnsMap) && intval($f_MODIFIED_BY) > 0)
	{
		if(!array_key_exists($f_MODIFIED_BY, $arUsersCache))
		{
			$rsUser = CUser::GetByID($f_MODIFIED_BY);
			$arUsersCache[$f_MODIFIED_BY] = $rsUser->Fetch();
		}
		if($arUser = $arUsersCache[$f_MODIFIED_BY])
			$row->AddViewField("MODIFIED_BY", '[<a href="user_edit.php?lang='.LANG.'&ID='.$f_MODIFIED_BY.'" title="'.GetMessage("IBLOCK_SECSEARCH_USERINFO").'">'.$f_MODIFIED_BY."</a>]&nbsp;(".htmlspecialcharsEx($arUser["LOGIN"]).") ".htmlspecialcharsEx($arUser["NAME"]." ".$arUser["LAST_NAME"]));
	}

	if(array_key_exists("CREATED_BY", $arVisibleColumnsMap) && intval($f_CREATED_BY) > 0)
	{
		if(!array_key_exists($f_CREATED_BY, $arUsersCache))
		{
			$rsUser = CUser::GetByID($f_CREATED_BY);
			$arUsersCache[$f_CREATED_BY] = $rsUser->Fetch();
		}
		if($arUser = $arUsersCache[$f_MODIFIED_BY])
			$row->AddViewField("CREATED_BY", '[<a href="user_edit.php?lang='.LANG.'&ID='.$f_CREATED_BY.'" title="'.GetMessage("IBLOCK_SECSEARCH_USERINFO").'">'.$f_CREATED_BY."</a>]&nbsp;(".htmlspecialcharsEx($arUser["LOGIN"]).") ".htmlspecialcharsEx($arUser["NAME"]." ".$arUser["LAST_NAME"]));
	}

	$row->AddActions(array(
		array(
			"DEFAULT" => "Y",
			"TEXT" => GetMessage("IBLOCK_SECSEARCH_SELECT"),
			"ACTION"=>"javascript:SelEl('".($get_xml_id? $f_XML_ID: $f_ID)."', '".htmlspecialcharsbx($jsPath.htmlspecialcharsbx(CUtil::JSEscape($arRes["NAME"]), ENT_QUOTES))."&nbsp;/&nbsp;"."')",
		),
	));
}

$lAdmin->AddFooter(
	array(
		array("title"=>GetMessage("MAIN_ADMIN_LIST_SELECTED"), "value"=>$rsData->SelectedRowsCount()),
		array("counter"=>true, "title"=>GetMessage("MAIN_ADMIN_LIST_CHECKED"), "value"=>"0"),
	)
);

if($m)
{
	$lAdmin->AddGroupActionTable(array(
		array(
			"action" => "SelAll()",
			"value" => "select",
			"type" => "button",
			"name" => GetMessage("IBLOCK_SECSEARCH_SELECT"),
			)
	), array("disable_action_target"=>true));
}

$lAdmin->AddAdminContextMenu(array(), false);

if($IBLOCK_ID > 0)
{
	$chain = $lAdmin->CreateChain();
	if(intval($find_section_section)>0)
	{
		$nav = CIBlockSection::GetNavChain($IBLOCK_ID, $find_section_section);
		while($ar_nav = $nav->GetNext())
		{
			if($find_section_section==$ar_nav["ID"])
			{
				$chain->AddItem(array(
					"TEXT" => $ar_nav["NAME"],
				));
			}
			else
			{
				$chain->AddItem(array(
					"TEXT" => $ar_nav["NAME"],
					"LINK" => 'iblock_section_search.php?lang='.LANG.'&amp;IBLOCK_ID='.$IBLOCK_ID.'&amp;find_section_section=-1'.'&amp;n='.urlencode($n).'&amp;k='.urlencode($k).($m? "&amp;m=y": ""),
					"ONCLICK" => $lAdmin->ActionAjaxReload('iblock_section_search.php?lang='.LANG.'&IBLOCK_ID='.$IBLOCK_ID.'&find_section_section='.$ar_nav["ID"].'&n='.urlencode($n).'&k='.urlencode($k).($m? "&m=y": "")).';return false;',
				));
			}
		}
	}
	$lAdmin->ShowChain($chain);
}
else
{
	$lAdmin->BeginPrologContent();
	$message = new CAdminMessage(array("MESSAGE"=>GetMessage("IBLOCK_SECSEARCH_CHOOSE_IBLOCK"), "TYPE"=>"OK"));
	echo $message->Show();
	$lAdmin->EndPrologContent();
}

$lAdmin->CheckListMode();

/***************************************************************************
				HTML form
****************************************************************************/
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_popup_admin.php");

$chain = new CAdminChain("main_navchain");
$chain->AddItem(array(
	"TEXT" => htmlspecialcharsex($arIBlock["NAME"]),
	"LINK" => 'iblock_section_search.php?lang='.LANG.'&amp;IBLOCK_ID='.$IBLOCK_ID.'&amp;find_section_section=0'.'&amp;n='.urlencode($n).'&amp;k='.urlencode($k).($m? "&amp;m=y": ""),
	"ONCLICK" => $lAdmin->ActionAjaxReload('iblock_section_search.php?lang='.LANG.'&IBLOCK_ID='.$IBLOCK_ID.'&find_section_section=0'.'&n='.urlencode($n).'&k='.urlencode($k).($m? "&m=y": "")).';return false;',
));
$chain->Show();
?>
<form method="GET" name="find_section_form" action="<?echo $APPLICATION->GetCurPage()?>">
<?
$arFindFields = Array(
	//"parent" => GetMessage("IBLOCK_SECSEARCH_PARENT"),
	"id" => GetMessage("IBLOCK_SECSEARCH_ID"),
	"timestamp_x" => GetMessage("IBLOCK_SECSEARCH_TIMESTAMP"),
	"modified_by" => GetMessage("IBLOCK_SECSEARCH_MODIFIED_BY"),
	"date_create" => GetMessage("IBLOCK_SECSEARCH_DATE_CREATE"),
	"created_by" => GetMessage("IBLOCK_SECSEARCH_CREATED_BY"),
	"code" => GetMessage("IBLOCK_SECSEARCH_CODE"),
	"xml_id" => GetMessage("IBLOCK_SECSEARCH_XML_ID"),
	"active" => GetMessage("IBLOCK_SECSEARCH_ACTIVE"),
);
$USER_FIELD_MANAGER->AddFindFields($entity_id, $arFindFields);

$oFilter = new CAdminFilter($sTableID."_filter", $arFindFields);

$oFilter->Begin();
?>
<script type="text/javascript">
function SelEl(id, name)
{
<?
	if ('' != $lookup)
	{
		if ('' != $m)
		{
			?>window.opener.<? echo $lookup; ?>.AddValue(id);<?
		}
		else
		{
			?>
			window.opener.<? echo $lookup; ?>.AddValue(id);
			window.close();<?
		}
	}
	else
	{
		if($m)
		{
			?>window.opener.InS<?echo md5($n)?>(id, name);<?
		}
		else
		{
			?>el = window.opener.document.getElementById('<?echo $n?>[<?echo $k?>]');
		if(!el)
			el = window.opener.document.getElementById('<?echo $n?>');
		if(el)
			el.value = id;
		el = window.opener.document.getElementById('sp_<?echo md5($n)?>_<?echo $k?>');
		if(!el)
			el = window.opener.document.getElementById('sp_<?echo $n?>');
		if(el)
			el.innerHTML = name;
		window.close();
		<?
		}
	}
	?>
}

function SelAll()
{
	var frm = document.getElementById('form_tbl_iblock_section_search_<?=intval($arIBlock["ID"])?>');
	if(frm)
	{
		var e = frm.elements['ID[]'];
		if(e && e.nodeName)
		{
			var v = e.value;
			var n = document.getElementById('name_'+v).innerHTML;
			SelEl(v, n);
		}
		else if(e)
		{
			var l = e.length;
			for(i=0;i<l;i++)
			{
				var a = e[i].checked;
				if (a == true)
				{
					var v = e[i].value;
					var n = document.getElementById('name_'+v).innerHTML;
					SelEl(v, n);
				}
			}
		}
		window.close();
	}
}
</script>
	<tr>
		<td><b><?echo GetMessage("IBLOCK_SECSEARCH_NAME")?>:</b></td>
		<td><input type="text" name="find_section_name" value="<?echo htmlspecialcharsex($find_section_name)?>" size="47">&nbsp;<?=ShowFilterLogicHelp()?></td>
	</tr>

	<tr>
		<td><?echo GetMessage("IBLOCK_SECSEARCH_ID")?>:</td>
		<td><input type="text" name="find_section_id" size="47" value="<?echo htmlspecialcharsbx($find_section_id)?>"></td>
	</tr>
	<tr>
		<td><?echo GetMessage("IBLOCK_SECSEARCH_TIMESTAMP").":"?></td>
		<td><?echo CalendarPeriod("find_section_timestamp_1", htmlspecialcharsbx($find_section_timestamp_1), "find_section_timestamp_2", htmlspecialcharsbx($find_section_timestamp_2), "find_section_form","Y")?></td>
	</tr>
	<tr>
		<td><?echo GetMessage("IBLOCK_SECSEARCH_MODIFIED_BY")?>:</td>
		<td>
			<?echo FindUserID(
				/*$tag_name=*/"find_section_modified_user_id",
				/*$tag_value=*/$find_section_modified_by,
				/*$user_name=*/"",
				/*$form_name=*/"find_section_form",
				/*$tag_size=*/"5",
				/*$tag_maxlength=*/"",
				/*$button_value=*/" ... ",
				/*$tag_class=*/"",
				/*$button_class=*/""
			);?>
		</td>
	</tr>
	<tr>
		<td><?echo GetMessage("IBLOCK_SECSEARCH_DATE_CREATE").":"?></td>
		<td><?echo CalendarPeriod("find_section_date_create_1", htmlspecialcharsex($find_section_date_create_1), "find_section_date_create_2", htmlspecialcharsex($find_section_date_create_2), "find_section_form")?></td>
	</tr>
	<tr>
		<td><?echo GetMessage("IBLOCK_SECSEARCH_CREATED_BY")?>:</td>
		<td>
			<?echo FindUserID(
				/*$tag_name=*/"find_section_created_user_id",
				/*$tag_value=*/$find_section_created_by,
				/*$user_name=*/"",
				/*$form_name=*/"find_section_form",
				/*$tag_size=*/"5",
				/*$tag_maxlength=*/"",
				/*$button_value=*/" ... ",
				/*$tag_class=*/"",
				/*$button_class=*/""
			);?>
		</td>
	</tr>
	<tr>
		<td><?echo GetMessage("IBLOCK_SECSEARCH_CODE")?>:</td>
		<td><input type="text" name="find_section_code" size="47" value="<?echo htmlspecialcharsbx($find_section_code)?>"></td>
	</tr>
	<tr>
		<td><?echo GetMessage("IBLOCK_SECSEARCH_XML_ID")?>:</td>
		<td><input type="text" name="find_section_external_id" size="47" value="<?echo htmlspecialcharsbx($find_section_external_id)?>"></td>
	</tr>
	<tr>
		<td><?echo GetMessage("IBLOCK_SECSEARCH_ACTIVE")?>:</td>
		<td>
			<select name="find_section_active" >
				<option value=""><?=htmlspecialcharsex(GetMessage('IBLOCK_ALL'))?></option>
				<option value="Y"<?if($find_section_active=="Y")echo " selected"?>><?=htmlspecialcharsex(GetMessage("IBLOCK_YES"))?></option>
				<option value="N"<?if($find_section_active=="N")echo " selected"?>><?=htmlspecialcharsex(GetMessage("IBLOCK_NO"))?></option>
			</select>
		</td>
	</tr>
<?
$USER_FIELD_MANAGER->AdminListShowFilter($entity_id);
$oFilter->Buttons(array("table_id"=>$sTableID, "url"=>$APPLICATION->GetCurPage().'?IBLOCK_ID='.$IBLOCK_ID, "form"=>"find_section_form"));
$oFilter->End();
?>
</form>
<?
$lAdmin->DisplayList();

echo ShowError($strWarning);

require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_popup_admin.php");
?>