<?
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_before.php");
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/currency/prolog.php");
$CURRENCY_RIGHT = $APPLICATION->GetGroupRight("currency");
if ($CURRENCY_RIGHT=="D") $APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));
CModule::IncludeModule('currency');
IncludeModuleLangFile($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/currency/currencies_rates.php");

$sTableID = "t_currency_rates";
$oSort = new CAdminSorting($sTableID, "date", "desc");
$lAdmin = new CAdminList($sTableID, $oSort);

$arFilterFields = Array(
	"filter_period_from",
	"filter_period_to",
	"filter_currency",
);

$lAdmin->InitFilter($arFilterFields);

$filter = new CAdminFilter(
	$sTableID."_filter",
	array(
		GetMessage("curr_rates_curr1"),
	)
);

$arFilter = Array(
	"CURRENCY" => $filter_currency,
	"DATE_RATE" => $filter_period_from,
	"!DATE_RATE" => $filter_period_to,
);

if ($by != "curr" && $by != "rate")
	$by = "date";

$order = strtolower($order);
if ($order != "asc")
	$order = "desc";

if ($CURRENCY_RIGHT=="W" && $lAdmin->EditAction())
{
	foreach($FIELDS as $ID => $arFields)
	{
		$ID = (int)$ID;

		if(!$lAdmin->IsUpdated($ID))
			continue;

		$arCurR = CCurrencyRates::GetByID($ID);
		$arFields["CURRENCY"] = $arCurR["CURRENCY"];

		$res = CCurrencyRates::Update($ID, $arFields);
		if (!$res)
		{
			if($e = $APPLICATION->GetException())
				$lAdmin->AddUpdateError(GetMessage("SAVE_ERROR").$ID.": ".str_replace("<br>"," ",$e->GetString()), $ID);
		}
	}
}

if($CURRENCY_RIGHT=="W" && $arID = $lAdmin->GroupAction())
{
	if ($_REQUEST['action_target']=='selected')
	{
		$rsData = CCurrencyRates::GetList($by, $order, $arFilter);
		while($arRes = $rsData->Fetch())
			$arID[] = $arRes['ID'];
	}

	foreach($arID as $ID)
	{
		$ID = (int)($ID);
		if ($ID<=0)
			continue;

		switch($_REQUEST['action'])
		{
			case "delete":
				CCurrencyRates::Delete($ID);
			break;
		}
	}
}

$rsData = CCurrencyRates::GetList($by, $order, $arFilter);
$rsData = new CAdminResult($rsData, $sTableID);
$rsData->NavStart();

$lAdmin->NavText($rsData->GetNavPrint(GetMessage("curr_rates_nav")));

$arHeaders = array();

$arHeaders[] = array(
	"id" => "ID",
	"content" => "ID",
	"default" => false
);
$arHeaders[] = array(
	"id" => "CURRENCY",
	"content" => GetMessage('curr_rates_curr1'),
	"sort" => "curr",
	"default" => true
);
$arHeaders[] = array(
	"id" => "DATE_RATE",
	"content" => GetMessage('curr_rates_date1'),
	"sort" => "date",
	"default" => true
);
$arHeaders[] = array(
	"id" => "RATE_CNT",
	"content" => GetMessage('curr_rates_rate_cnt'),
	"default" => true
);
$arHeaders[] = array(
	"id" => "RATE",
	"content" => GetMessage('curr_rates_rate'),
	"sort" => "rate",
	"default" => true
);

$lAdmin->AddHeaders($arHeaders);

while($arRes = $rsData->NavNext(true, "f_"))
{
	$row =& $lAdmin->AddRow($f_ID, $arRes, "/bitrix/admin/currency_rate_edit.php?ID=".$f_ID."&lang=".LANGUAGE_ID.GetFilterParams("filter_"), GetMessage('CURRENCY_RATES_A_EDIT'));

	$row->AddViewField('ID', '<a href="/bitrix/admin/currency_rate_edit.php?ID='.$f_ID.'&lang='.LANGUAGE_ID.GetFilterParams("filter_").'" title="'.GetMessage('CURRENCY_RATES_A_EDIT_TITLE').'">'.$f_ID.'</a>');
	$row->AddViewField('CURRENCY', '<a href="/bitrix/admin/currency_edit.php?ID='.$f_CURRENCY.'&lang='.LANGUAGE_ID.'" title="'.GetMessage('CURRENCY_A_EDIT_TITLE').'">'.$f_CURRENCY.'</a>');
	$row->AddCalendarField('DATE_RATE');

	$row->AddInputField("RATE_CNT",Array("size"=>"5"));
	$row->AddInputField("RATE",Array("size"=>"8"));

	$arActions = Array();

	$arActions[] = array(
		"ICON"=>"edit",
		"TEXT"=>GetMessage("MAIN_ADMIN_MENU_EDIT"),
		"DEFAULT" => "Y",
		"ACTION"=>$lAdmin->ActionRedirect("/bitrix/admin/currency_rate_edit.php?ID=".$f_ID."&lang=".LANGUAGE_ID.GetFilterParams("filter_"))
	);

	if ($CURRENCY_RIGHT=="W")
	{
		$arActions[] = array("SEPARATOR"=>true);

		$arActions[] = array(
			"ICON"=>"delete",
			"TEXT"=>GetMessage("MAIN_ADMIN_MENU_DELETE"),
			"ACTION"=>"if(confirm('".GetMessage('CONFIRM_DEL_MESSAGE')."')) ".$lAdmin->ActionDoGroup($f_ID, "delete")
		);
	}

	$row->AddActions($arActions);

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
	));
}

$aContext = array(
	array(
		"ICON" => "btn_new",
		"TEXT"=>GetMessage("CURRENCY_NEW_TITLE"),
		"LINK"=>"/bitrix/admin/currency_rate_edit.php?lang=".LANGUAGE_ID.GetFilterParams("filter_"),
		"TITLE"=>GetMessage("CURRENCY_NEW_TITLE")
	),
);

$lAdmin->AddAdminContextMenu($aContext);

$lAdmin->CheckListMode();

$APPLICATION->SetTitle(GetMessage("CURRENCY_TITLE"));
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");
?>
<form method="get" action="<?=$APPLICATION->GetCurPage()?>" name="find_form">
<?$filter->Begin();?>
	<tr>
		<td><?echo GetMessage("curr_rates_date1")?>:</td>
		<td>
			<?echo CalendarPeriod("filter_period_from", $filter_period_from, "filter_period_to", $filter_period_to, "find_form", "Y")?>
		</td>
	</tr>
	<tr>
		<td><?echo GetMessage("curr_rates_curr1")?>:</td>
		<td>
			<?echo CCurrency::SelectBox("filter_currency", $filter_currency, GetMessage("curr_rates_all"), True, "", "") ?>
		</td>
	</tr>
<?$filter->Buttons(array("table_id"=>$sTableID, "url"=>$APPLICATION->GetCurPage(), "form"=>"find_form"));$filter->End();?>
</form>
<?$lAdmin->DisplayList();?>
<?require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");?>