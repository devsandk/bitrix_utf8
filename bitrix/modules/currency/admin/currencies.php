<?
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_before.php");
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/currency/prolog.php");
$CURRENCY_RIGHT = $APPLICATION->GetGroupRight("currency");
if ($CURRENCY_RIGHT=="D") $APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));
CModule::IncludeModule('currency');
IncludeModuleLangFile(__FILE__);

$sTableID = "t_currencies";
$oSort = new CAdminSorting($sTableID, "sort", "asc");
$lAdmin = new CAdminList($sTableID, $oSort);

if ($lAdmin->EditAction() && $CURRENCY_RIGHT=="W")
{
	foreach($FIELDS as $ID => $arFields)
	{
		$ID = (string)$ID;
		$ID = CCurrency::checkCurrencyID($ID);
		if ($ID === false)
			continue;

		if (!$lAdmin->IsUpdated($ID))
			continue;

		if (!CCurrency::Update($ID, $arFields))
		{
			if ($ex = $APPLICATION->GetException())
			{
				$lAdmin->AddUpdateError(GetMessage("CURRENCY_SAVE_ERR", array("#ID#" => $ID, "#ERROR_TEXT#" => $ex->GetString())), $ID);
			}
			else
			{
				$lAdmin->AddUpdateError(GetMessage("CURRENCY_SAVE_ERR2", array("#ID#"=>$ID)), $ID);
			}
		}
	}
}

if ($CURRENCY_RIGHT == "W" && $arID = $lAdmin->GroupAction())
{
	if ($_REQUEST['action_target']=='selected')
	{
		$rsData = CCurrency::GetList($by, $order);
		while($arRes = $rsData->Fetch())
			$arID[] = $arRes['CURRENCY'];
	}

	foreach($arID as $ID)
	{
		$ID = (string)$ID;
		if ($ID == '')
			continue;

		switch($_REQUEST['action'])
		{
			case "base":
				if (!CCurrency::SetBaseCurrency($ID))
				{
					if ($ex = $APPLICATION->GetException())
						$lAdmin->AddGroupError($ex->GetString(), $ID);
					else
						$lAdmin->AddGroupError(GetMessage("currency_err2"), $ID);
				}
				break;
			case "delete":
				if (!CCurrency::Delete($ID))
				{
					if ($ex = $APPLICATION->GetException())
						$lAdmin->AddGroupError($ex->GetString(), $ID);
					else
						$lAdmin->AddGroupError(GetMessage("currency_err1"), $ID);
				}
				break;
		}
	}
}

$rsData = CCurrency::GetList($by, $order);
$rsData = new CAdminResult($rsData, $sTableID);
$rsData->NavStart();

$lAdmin->NavText($rsData->GetNavPrint(GetMessage("CURRENCY_TITLE")));

$arHeaders = array();
$arHeaders[] = array(
	"id" => "CURRENCY",
	"content" => GetMessage('currency_curr'),
	"sort" => "CURRENCY",
	"default" => true
);
$arHeaders[] = array(
	"id" => "FULL_NAME",
	"content" => GetMessage('CURRENCY_FULL_NAME'),
	"sort" => "name",
	"default" => true
);
$arHeaders[] = array(
	"id" => "SORT",
	"content" => GetMessage('currency_sort'),
	"sort" => "sort",
	"default" => true
);
$arHeaders[] = array(
	"id" => "AMOUNT_CNT",
	"content" => GetMessage('currency_rate_cnt'),
	"default" => true
);
$arHeaders[] = array(
	"id" => "AMOUNT",
	"content" => GetMessage('currency_rate'),
	"default" => true
);
$arHeaders[] = array(
	'id' => 'BASE',
	'content' => GetMessage('BT_MOD_CURRENCY_LIST_ADM_TITLE_BASE'),
	'default' => true
);
$arHeaders[] = array(
	'id' => 'NUMCODE',
	'content' => GetMessage('BT_MOD_CURRENCY_LIST_ADM_TITLE_NUMCODE'),
	'default' => false
);
$arHeaders[] = array(
	'id' => 'DATE_UPDATE',
	'content' => GetMessage('BT_MOD_CURRENCY_LIST_ADM_TITLE_DATE_UPDATE'),
	'default' => true
);
$arHeaders[] = array(
	'id' => 'MODIFIED_BY',
	'content' => GetMessage('BT_MOD_CURRENCY_LIST_ADM_TITLE_MODIFIED_BY'),
	'default' => false
);
$arHeaders[] = array(
	'id' => 'DATE_CREATE',
	'content' => GetMessage('BT_MOD_CURRENCY_LIST_ADM_TITLE_DATE_CREATE'),
	'default' => false
);
$arHeaders[] = array(
	'id' => 'CREATED_BY',
	'content' => GetMessage('BT_MOD_CURRENCY_LIST_ADM_TITLE_CREATED_BY'),
	'default' => false
);

$lAdmin->AddHeaders($arHeaders);

$arUserList = array();
$arUserID = array();
$strNameFormat = CSite::GetNameFormat(true);
$arSelectFields = $lAdmin->GetVisibleHeaderColumns();
$arSelectFields = array_values($arSelectFields);
$arSelectFieldsMap = array_fill_keys($arSelectFields, true);

$arRows = array();
while($arRes = $rsData->Fetch())
{
	$arRes['DATE_CREATE'] = $arRes['DATE_CREATE_FORMAT'];
	$arRes['DATE_UPDATE'] = $arRes['DATE_UPDATE_FORMAT'];
	if ($arSelectFieldsMap['CREATED_BY'])
	{
		$arRes['CREATED_BY'] = (int)$arRes['CREATED_BY'];
		if (0 < $arRes['CREATED_BY'])
			$arUserID[$arRes['CREATED_BY']] = true;
	}
	if ($arSelectFieldsMap['MODIFIED_BY'])
	{
		$arRes['MODIFIED_BY'] = (int)$arRes['MODIFIED_BY'];
		if (0 < $arRes['MODIFIED_BY'])
			$arUserID[$arRes['MODIFIED_BY']] = true;
	}

	$arRows[$arRes['CURRENCY']] = $row =& $lAdmin->AddRow($arRes['CURRENCY'], $arRes, "/bitrix/admin/currency_edit.php?ID=".$arRes['CURRENCY']."&lang=".LANGUAGE_ID, GetMessage('CURRENCY_A_EDIT'));

	$row->AddViewField("CURRENCY", '<a href="/bitrix/admin/currency_edit.php?ID='.$arRes['CURRENCY'].'&lang='.LANGUAGE_ID.'" title="'.GetMessage('CURRENCY_A_EDIT_TITLE').'">'.$arRes['CURRENCY'].'</a>');
	$row->AddInputField("SORT", array("size" => "5"));
	$row->AddViewField("FULL_NAME", htmlspecialcharsex($arRes['FULL_NAME']));
	if ($arRes['BASE'] == 'Y')
	{
		$row->AddViewField('AMOUNT_CNT', $arRes['AMOUNT_CNT']);
		$row->AddViewField('AMOUNT', $arRes['AMOUNT']);
		$row->AddViewField('BASE', GetMessage('BASE_CURRENCY_YES'));
	}
	else
	{
		$row->AddInputField("AMOUNT_CNT", array("size" => "5"));
		$row->AddInputField("AMOUNT", array("size" => "10"));
		$row->AddViewField('BASE', GetMessage('BASE_CURRENCY_NO'));
	}

	if ($arSelectFieldsMap['DATE_CREATE'])
		$row->AddCalendarField('DATE_CREATE', false);
	if ($arSelectFieldsMap['DATE_UPDATE'])
		$row->AddCalendarField('DATE_UPDATE', false);

	if ($arSelectFieldsMap['NUMCODE'])
		$row->AddInputField('NUMCODE', array('size' => 3));

	$arActions = array();

	$arActions[] = array(
		"ICON" => "edit",
		"DEFAULT" => "Y",
		"TEXT" => GetMessage("MAIN_ADMIN_MENU_EDIT"),
		"ACTION" => $lAdmin->ActionRedirect("/bitrix/admin/currency_edit.php?ID=".$arRes['CURRENCY']."&lang=".LANGUAGE_ID)
	);

	if ($CURRENCY_RIGHT=="W" && $arRes['BASE'] != 'Y')
	{
		$arActions[] = array("SEPARATOR" => true);
		$arActions[] = array(
			"ICON" => "edit",
			"TEXT" => GetMessage('CURRENCY_SET_BASE'),
			"TITLE" => GetMessage('CURRENCY_SET_BASE_TITLE'),
			"ACTION" => "if(confirm('".GetMessage('CONFIRM_SET_BASE_MESSAGE')."')) ".$lAdmin->ActionDoGroup($arRes['CURRENCY'], "base")
		);
		$arActions[] = array("SEPARATOR" => true);
		$arActions[] = array(
			"ICON" => "delete",
			"TEXT" => GetMessage("MAIN_ADMIN_MENU_DELETE"),
			"ACTION" => "if(confirm('".GetMessage('CONFIRM_DEL_MESSAGE')."')) ".$lAdmin->ActionDoGroup($arRes['CURRENCY'], "delete")
		);
	}

	$row->AddActions($arActions);
}

if ($arSelectFieldsMap['CREATED_BY'] || $arSelectFieldsMap['MODIFIED_BY'])
{
	if (!empty($arUserID))
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
		if ($arSelectFieldsMap['CREATED_BY'])
		{
			$strCreatedBy = '';
			if ($row->arRes['CREATED_BY'] > 0 && isset($arUserList[$row->arRes['CREATED_BY']]))
			{
				$strCreatedBy = $arUserList[$row->arRes['CREATED_BY']];
			}
			$row->AddViewField("CREATED_BY", $strCreatedBy);
		}
		if ($arSelectFieldsMap['MODIFIED_BY'])
		{
			$strModifiedBy = '';
			if ($row->arRes['MODIFIED_BY'] > 0 && isset($arUserList[$row->arRes['MODIFIED_BY']]))
			{
				$strModifiedBy = $arUserList[$row->arRes['MODIFIED_BY']];
			}
			$row->AddViewField("MODIFIED_BY", $strModifiedBy);
		}
	}
	if (isset($row))
		unset($row);
}

$lAdmin->AddFooter(
	array(
		array("title"=>GetMessage("MAIN_ADMIN_LIST_SELECTED"), "value"=>$rsData->SelectedRowsCount()),
		array("counter"=>true, "title"=>GetMessage("MAIN_ADMIN_LIST_CHECKED"), "value"=>"0"),
	)
);


if ($CURRENCY_RIGHT=="W")
{
	$lAdmin->AddGroupActionTable(Array(
		"delete"=>GetMessage("MAIN_ADMIN_LIST_DELETE"),
		)
	);
}

$aContext = array(
	array(
		"ICON" => "btn_new",
		"TEXT"=>GetMessage("currency_add"),
		"LINK"=>"/bitrix/admin/currency_edit.php?lang=".LANGUAGE_ID,
		"TITLE"=>GetMessage("currency_add")
	),
	array(
		"ICON" => "",
		"TEXT"=>GetMessage("currency_list"),
		"LINK"=>"/bitrix/admin/currencies_rates.php?lang=".LANGUAGE_ID,
		"TITLE"=>GetMessage("currency_list")
	),
);

$lAdmin->AddAdminContextMenu($aContext);

$lAdmin->CheckListMode();

$APPLICATION->SetTitle(GetMessage("CURRENCY_TITLE"));
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");

$lAdmin->DisplayList();
echo BeginNote();
echo GetMessage('CURRENCY_CODES_ISO_STANDART', array('#ISO_LINK#' => CURRENCY_ISO_STANDART_URL));
echo EndNote();

?><?require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");?>