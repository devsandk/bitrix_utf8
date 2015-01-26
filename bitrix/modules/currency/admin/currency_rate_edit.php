<?
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_before.php");
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/currency/prolog.php");
$CURRENCY_RIGHT = $APPLICATION->GetGroupRight("currency");
if ($CURRENCY_RIGHT=="D") $APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));
CModule::IncludeModule('currency');
IncludeModuleLangFile($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/currency/currencies_rates.php");

$errorMessage = array();

$arFields = array();

$ID = 0;
if (isset($_REQUEST['ID']))
	$ID = (int)$_REQUEST['ID'];
if ($ID < 0)
	$ID = 0;

$aTabs = array(
	array("DIV" => "edit1", "TAB" => GetMessage("curr_rates_rate"), "ICON" => "currency", "TITLE" => GetMessage("curr_rates_rate_ex")),
);
$tabControl = new CAdminTabControl("tabControl", $aTabs);

if ($_SERVER['REQUEST_METHOD'] == 'POST' && !empty($_POST['Update']) && $CURRENCY_RIGHT=="W" && check_bitrix_sessid())
{
	$arFields = array(
		'DATE_RATE' => (isset($_POST['DATE_RATE']) ? $_POST['DATE_RATE'] : ''),
		'RATE' => (isset($_POST['RATE']) ? $_POST['RATE'] : ''),
		'RATE_CNT' => (isset($_POST['RATE_CNT']) ? $_POST['RATE_CNT'] : ''),
		'CURRENCY' => (isset($_POST['CURRENCY']) ? $_POST['CURRENCY'] : '')
	);

	if ($ID > 0)
	{
		$res = CCurrencyRates::Update($ID, $arFields);
	}
	else
	{
		$ID = (int)CCurrencyRates::Add($arFields);
		$res = ($ID > 0);
	}

	if (!$res)
	{
		if ($ex = $APPLICATION->GetException())
			$errorMessage[] = $ex->GetString();
		else
			$errorMessage[] = (
				$ID > 0
				? GetMessage('BX_CURRENCY_RATE_EDIT_ERR_UPDATE', array('#ID#' => $ID))
				: GetMessage('BX_CURRENCY_RATE_EDIT_ERR_ADD')
			);
	}
	else
	{
		if (empty($_POST['apply']))
		{
			if(strlen($return_url)>0)
				LocalRedirect($return_url);
			else
				LocalRedirect("/bitrix/admin/currencies_rates.php?lang=".LANGUAGE_ID.GetFilterParams("filter_", false));
		}
		LocalRedirect("/bitrix/admin/currency_rate_edit.php?lang=".LANGUAGE_ID."&ID=".$ID."&".GetFilterParams("filter_", false));
	}
}

$defaultValues = array(
	'DATE_RATE' => '',
	'CURRENCY' => '',
	'RATE_CNT' => '',
	'RATE' => ''
);

if ($ID > 0)
	$APPLICATION->SetTitle(GetMessage("CURRENCY_EDIT_TITLE"));
else
	$APPLICATION->SetTitle(GetMessage("CURRENCY_NEW_TITLE"));

require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");

CJSCore::Init(array('ajax'));

$currencyRate = $defaultValues;

if ($ID > 0)
{
	$currencyRate = CCurrencyRates::GetByID($ID);
	if (empty($currencyRate))
	{
		$ID = 0;
		$currencyRate = $defaultValues;
	}
}

if (!empty($errorMessage))
{
	$currencyRate = $arFields;
}

$aContext = array(
	array(
		"ICON" => "btn_list",
		"TEXT" => GetMessage("MAIN_ADMIN_MENU_LIST"),
		"LINK" => "/bitrix/admin/currencies_rates.php?lang=".LANGUAGE_ID,
		"TITLE" => GetMessage("MAIN_ADMIN_MENU_LIST")
	),
);

if ($ID > 0)
{
	$aContext[] = 	array(
		"ICON" => "btn_new",
		"TEXT" => GetMessage("MAIN_ADMIN_MENU_CREATE"),
		"LINK" => "/bitrix/admin/currency_rate_edit.php?lang=".LANGUAGE_ID,
		"TITLE" => GetMessage("MAIN_ADMIN_MENU_CREATE")
	);

	if ($CURRENCY_RIGHT == "W")
	{
		$aContext[] = 	array(
			"ICON" => "btn_delete",
			"TEXT" => GetMessage("MAIN_ADMIN_MENU_DELETE"),
			"LINK" => "javascript:if(confirm('".GetMessage("CONFIRM_DEL_MESSAGE")."'))window.location='/bitrix/admin/currencies_rates.php?action=delete&ID=".$ID."&lang=".LANGUAGE_ID."&".bitrix_sessid_get()."';",
		);
	}
}

$context = new CAdminContextMenu($aContext);
$context->Show();

if (!empty($errorMessage))
	CAdminMessage::ShowMessage(implode('<br>', $errorMessage));

$baseCurrency = CCurrency::GetBaseCurrency();
$showGetRate = ($baseCurrency != '' && in_array($baseCurrency, array('RUB', 'UAH', 'BYR')));
?>
<form method="POST" action="<?$APPLICATION->GetCurPage()?>" name="rate_edit">
<? echo bitrix_sessid_post();
echo GetFilterHiddens("filter_");?>
<input type="hidden" name="ID" value="<? echo $ID; ?>">
<input type="hidden" name="Update" value="Y">
<?
$tabControl->Begin();
$tabControl->BeginNextTab();
if ($ID > 0)
{
?>
<tr>
	<td>ID:</td>
	<td><? echo $ID; ?></td>
</tr><?
}
?>
<tr class="adm-detail-required-field">
	<td width="40%"><?echo GetMessage("curr_rates_date1")?>:</td>
	<td width="60%"><?= CalendarDate("DATE_RATE", $currencyRate['DATE_RATE'], "rate_edit", "10", 'class="typeinput"'); ?></td>
</tr>
<tr class="adm-detail-required-field">
	<td><?echo GetMessage("curr_rates_curr1")?>:</td>
	<td><?echo CCurrency::SelectBox("CURRENCY", $currencyRate['CURRENCY'], '', true); ?></td>
</tr>
<tr class="adm-detail-required-field">
	<td><?echo GetMessage("curr_rates_rate_cnt")?>:</td>
	<td><input type="text" id="RATE_CNT" name="RATE_CNT" value="<? echo $currencyRate['RATE_CNT']; ?>" size="5"></td>
</tr>
<tr class="adm-detail-required-field">
	<td><?echo GetMessage("curr_rates_rate")?>:</td>
	<td>
		<input type="text" id="RATE" name="RATE" value="<? echo $currencyRate['RATE']; ?>" size="12"><?
if ($showGetRate)
{
?>
		&nbsp;<input id="get_btn" type="button" title="<?echo GetMessage("curr_rates_query_ex")?>" value="<?echo GetMessage("curr_rates_query")?>">
		<div id="cyrrency_query_error_div"></div><?
}
?>
	</td>
</tr>
<?$tabControl->EndTab();
$tabControl->Buttons(
	array(
		"disabled" => $CURRENCY_RIGHT<"W",
		"back_url" =>"/bitrix/admin/currencies_rates.php?lang=".LANGUAGE_ID.GetFilterParams("filter_")
	)
);
$tabControl->End();?>
</form>
<script type="text/javascript">
function getCurrencyRate()
{
	BX('cyrrency_query_error_div').innerHTML = '';
	var date = document.forms['rate_edit'].elements['DATE_RATE'].value,
		curr = document.forms['rate_edit'].elements['CURRENCY'].value,
		url,
		ajaxData;

	if (curr == "")
	{
		alert('<?=GetMessage("ERROR_CURRENCY")?>');
		return false;
	}

	if (date == "")
	{
		alert('<?=GetMessage("ERROR_DATE_RATE")?>');
		document.forms['rate_edit'].elements['DATE_RATE'].focus();
		return false;
	}

	url = '/bitrix/tools/currency/get_rate.php';
	ajaxData = {
		lang: BX.message('LANGUAGE_ID'),
		CURRENCY: curr,
		DATE_RATE: date,
		sessid: BX.bitrix_sessid()
	};
	BX.showWait();
	BX.ajax.loadJSON(
		url,
		ajaxData,
		resultCurrencyRate
	)
}
function resultCurrencyRate(result)
{
	BX.closeWait();
	if (typeof result !== 'object' || !result.STATUS)
	{
		BX('cyrrency_query_error_div').innerHTML = '<? echo GetMessageJS('BX_CURRENCY_GET_RATE_ERR_UNKNOWN'); ?>';
	}
	else
	{
		if (result.STATUS === 'ERROR')
		{
			BX('cyrrency_query_error_div').innerHTML = result.MESSAGE;
		}
		else
		{
			BX('RATE_CNT').value = result.RATE_CNT;
			BX('RATE').value = result.RATE;
		}
	}
}
BX.ready(function(){
	var btn = BX('get_btn');
	if (!!btn)
	{
		BX.bind(btn, 'click', getCurrencyRate);
	}
});
</script>
<?require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");?>