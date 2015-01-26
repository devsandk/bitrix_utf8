<?
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_before.php");
require_once($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/currency/prolog.php");
$CURRENCY_RIGHT = $APPLICATION->GetGroupRight("currency");
if ($CURRENCY_RIGHT=="D") $APPLICATION->AuthForm(GetMessage("ACCESS_DENIED"));
CModule::IncludeModule('currency');
IncludeModuleLangFile(__FILE__);

$errorMessage = array();

$ID = '';
if (isset($_REQUEST['ID']))
	$ID = (string)$_REQUEST['ID'];

$aTabs = array(
	array("DIV" => "edit1", "TAB" => GetMessage("currency_curr"), "ICON"=>"", "TITLE"=>GetMessage("currency_curr_settings")),
	array("DIV" => "edit2", "TAB" => GetMessage("BT_CURRENCY_EDIT_TAB_NAME_LANGUAGE"), "ICON"=>"", "TITLE"=>GetMessage("BT_CURRENCY_EDIT_TAB_TITLE_LANGUAGE")),
);
$tabControl = new CAdminTabControl("tabControl", $aTabs);

$arTemplates = CCurrencyLang::GetFormatTemplates();
$separatorList = CCurrencyLang::GetSeparatorTypes(true);

$langList = array();
$langID = array();
$by = "sort";
$order = "asc";
$langIterator = CLangAdmin::GetList($by, $order);
while ($oneLang = $langIterator->Fetch())
{
	$langID[] = $oneLang['LID'];
	$langList[$oneLang['LID']] = $oneLang['NAME'];
}
unset($oneLang, $langIterator, $order, $by);

$arFields = array();

if ($_SERVER['REQUEST_METHOD'] == 'POST' && $CURRENCY_RIGHT=="W" && !empty($_POST['Update']) && check_bitrix_sessid())
{
	if (!isset($_POST['BASE']) || $_POST['BASE'] != 'Y')
	{
		$arFields = array(
			'AMOUNT' => (isset($_POST['AMOUNT']) ? $_POST['AMOUNT'] : ''),
			'AMOUNT_CNT' => (isset($_POST['AMOUNT_CNT']) ? $_POST['AMOUNT_CNT'] : ''),
			'SORT' => (isset($_POST['SORT']) ? $_POST['SORT'] : ''),
			'NUMCODE' => (isset($_POST['NUMCODE']) ? $_POST['NUMCODE'] : '')
		);
	}
	else
	{
		$arFields = array(
			'AMOUNT' => 1,
			'AMOUNT_CNT' => 1,
			'SORT' => (isset($_POST['SORT']) ? $_POST['SORT'] : ''),
			'NUMCODE' => (isset($_POST['NUMCODE']) ? $_POST['NUMCODE'] : '')
		);
	}
	if (!$ID && isset($_POST['CURRENCY']))
	{
		$arFields['CURRENCY'] = $_POST['CURRENCY'];
	}
	$strAction = ($ID ? 'UPDATE' : 'ADD');
	$langSettings = array();
	foreach ($langID as &$oneLang)
	{
		if (isset($_POST['LANG_'.$oneLang]))
			$langSettings[$oneLang] = $_POST['LANG_'.$oneLang];
	}
	unset($oneLang);
	$arFields['LANG'] = $langSettings;
	unset($langSettings);

	$DB->StartTransaction();
	if ($ID)
	{
		$res = CCurrency::Update($ID, $arFields);
	}
	else
	{
		$ID = (string)CCurrency::Add($arFields);
		$res = ($ID !== '');
	}
	if (!$res)
	{
		$DB->Rollback();
		if ($ex = $APPLICATION->GetException())
			$errorMessage[] = $ex->GetString();
		else
			$errorMessage[] = ($ID ? str_replace('#ID#', $ID, GetMessage('BT_CURRENCY_EDIT_ERR_UPDATE')) : GetMessage('BT_CURRENCY_EDIT_ERR_ADD'))."<br>";
	}
	else
	{
		$DB->Commit();
		if (empty($_POST['apply']))
			LocalRedirect('/bitrix/admin/currencies.php?lang='.LANGUAGE_ID);

		LocalRedirect('/bitrix/admin/currency_edit.php?ID='.$ID.'&lang='.LANGUAGE_ID.'&'.$tabControl->ActiveTabParam());
	}
}

$defaultValues = array(
	'CURRENCY' => '',
	'AMOUNT_CNT' => 1,
	'AMOUNT' => 1,
	'SORT' => 100,
	'NUMCODE' => '',
	'BASE' => 'N'
);
$defaultLangValues = array(
	'FULL_NAME' => '',
	'FORMAT_STRING' => '#',
	'DEC_POINT' => '.',
	'THOUSANDS_SEP' => '',
	'DECIMALS' => 2,
	'THOUSANDS_VARIANT' => CCurrencyLang::SEP_SPACE,
	'HIDE_ZERO' => 'Y'
);

if ($ID != '')
	$APPLICATION->SetTitle(GetMessage("CURRENCY_EDIT_TITLE"));
else
	$APPLICATION->SetTitle(GetMessage("CURRENCY_NEW_TITLE"));

require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/prolog_admin_after.php");

$currency = $defaultValues;
$currencyLangs = array_fill_keys($langID, $defaultLangValues);

if ($ID != '')
{
	$currency = CCurrency::GetByID($ID);
	if (empty($currency))
	{
		$ID = '';
		$currency = $defaultValues;
	}
	else
	{
		$by = 'currency';
		$order = 'asc';
		$langIterator = CCurrencyLang::GetList($by, $order, $ID);
		while ($lang = $langIterator->Fetch())
		{
			$lang['THOUSANDS_SEP'] = (string)$lang['THOUSANDS_SEP'];
			$lang['THOUSANDS_VARIANT'] = (string)$lang['THOUSANDS_VARIANT'];
			$currencyLangs[$lang['LID']] = $lang;
		}
		unset($lang, $langIterator, $order, $by);
	}
}

if (!empty($errorMessage))
{
	$currency = $arFields;
	if (!isset($currency['CURRENCY']))
		$currency['CURRENCY'] = '';
	$currencyLangs = $arFields['LANG'];
}

$aContext = array(
	array(
		"ICON" => "btn_list",
		"TEXT" => GetMessage("MAIN_ADMIN_MENU_LIST"),
		"LINK" => "currencies.php?lang=".LANGUAGE_ID,
		"TITLE" => GetMessage("MAIN_ADMIN_MENU_LIST")
	),
);

if ($ID != '')
{
	$aContext[] = 	array(
		"ICON" => "btn_new",
		"TEXT" => GetMessage("MAIN_ADMIN_MENU_CREATE"),
		"LINK" => "currency_edit.php?lang=".LANGUAGE_ID,
		"TITLE" => GetMessage("MAIN_ADMIN_MENU_CREATE")
	);

	if ($CURRENCY_RIGHT == "W" && $currency['BASE'] != 'Y')
	{
		$aContext[] = array(
			"ICON" => "btn_delete",
			"TEXT" => GetMessage("MAIN_ADMIN_MENU_DELETE"),
			"ONCLICK" => "javascript:if(confirm('".GetMessageJS("CONFIRM_DEL_MESSAGE")."'))window.location='currencies.php?action=delete&ID[]=".CUtil::JSEscape($ID)."&lang=".LANGUAGE_ID."&".bitrix_sessid_get()."';",
		);
	}
}
$context = new CAdminContextMenu($aContext);
$context->Show();

if (!empty($errorMessage))
	CAdminMessage::ShowMessage(implode('<br>', $errorMessage));

?><script type="text/javascript">
function setTemplate(lang)
{
	var arFormat = [], arPoint = [], arThousand = [], arDecimals = [],
		sIndex, i;
	<?
	foreach ($arTemplates as $key => $ar)
	{
		echo "arFormat[".$key."] = '".$ar["FORMAT"]."';\n";
		echo "arPoint[".$key."] = '".$ar["DEC_POINT"]."';\n";
		echo "arThousand[".$key."] = '".$ar["THOUSANDS_VARIANT"]."';\n";
		echo "arDecimals[".$key."] = '".$ar["DECIMALS"]."';\n";
	}
	?>
	sIndex = document.forms['form1'].elements['format_' + lang].selectedIndex;
	if (sIndex > 0)
	{
		document.forms['form1'].elements['LANG_' + lang + '[FORMAT_STRING]'].value = arFormat[sIndex-1];
		document.forms['form1'].elements['LANG_' + lang + '[DEC_POINT]'].value = arPoint[sIndex-1];
		for (i = 0; i < document.forms['form1'].elements['LANG_' + lang + '[THOUSANDS_VARIANT]'].options.length; i++)
		{
			if (document.forms['form1'].elements['LANG_' + lang + '[THOUSANDS_VARIANT]'].options[i].value === arThousand[sIndex-1])
			{
				document.forms['form1'].elements['LANG_' + lang + '[THOUSANDS_VARIANT]'].selectedIndex = i;
				setThousandsVariant(lang);
				break;
			}
		}
		document.forms['form1'].elements['LANG_' + lang + '[DECIMALS]'].value = arDecimals[sIndex-1];
	}
}
function setThousandsVariant(lang)
{
	var value = document.forms['form1'].elements['LANG_' + lang + '[THOUSANDS_VARIANT]'].value;
	document.forms['form1'].elements['LANG_' + lang + '[THOUSANDS_SEP]'].disabled = (value.length > 0);
}
</script>
<form method="post" action="<?$APPLICATION->GetCurPage()?>" name="form1">
<? echo bitrix_sessid_post(); ?>
<?echo GetFilterHiddens("filter_");?>
<input type="hidden" name="ID" value="<?echo $ID?>">
<input type="hidden" name="Update" value="Y">
<input type="hidden" name="from" value="<?echo htmlspecialcharsbx($from)?>">
<input type="hidden" name="BASE" value="<?echo htmlspecialcharsbx($currency['BASE']); ?>">
<?if(strlen($return_url)>0):?><input type="hidden" name="return_url" value="<?=htmlspecialcharsbx($return_url)?>"><?endif?>

<?$tabControl->Begin();?>
<?$tabControl->BeginNextTab();?>
	<tr class="adm-detail-required-field">
		<td width="40%"><?echo GetMessage("currency_curr")?>:</td>
		<td width="60%">
		<?if (!$ID):?>
			<input type="text" value="<?echo htmlspecialcharsbx($currency['CURRENCY']);?>" size="3" name="CURRENCY" maxlength="3">
		<?else:?>
			<?=$ID; ?>
		<? endif?>
		</td>
	</tr>
	<tr class="adm-detail-required-field">
		<td width="40%"><? echo GetMessage("currency_base"); ?>:</td>
		<td width="60%"><? echo ($currency['BASE'] == 'Y' ? GetMessage('BASE_CURRENCY_YES') : GetMessage('BASE_CURRENCY_NO')); ?></td>
	</tr>
	<tr class="adm-detail-required-field">
		<td width="40%"><?echo GetMessage("currency_rate_cnt")?>:</td>
		<td width="60%">
			<input type="text" size="10" name="AMOUNT_CNT" value="<?=(int)$currency['AMOUNT_CNT']; ?>"<? echo ($currency['BASE'] == 'Y' ? ' disabled' : ''); ?>>
		</td>
	</tr>
	<tr class="adm-detail-required-field">
		<td width="40%"><?echo GetMessage("currency_rate")?>:</td>
		<td width="60%">
			<input type="text" size="20" name="AMOUNT" value="<?=htmlspecialcharsbx($currency['AMOUNT'])?>" maxlength="20"<? echo ($currency['BASE'] == 'Y' ? ' disabled' : ''); ?>>
		</td>
	</tr>
	<tr>
		<td width="40%"><?echo GetMessage("currency_numcode")?>:</td>
		<td width="60%">
			<input type="text" size="3" name="NUMCODE" value="<?echo htmlspecialcharsbx($currency['NUMCODE']); ?>" maxlength="3">
		</td>
	</tr>
	<tr>
		<td width="40%"><?echo GetMessage("currency_sort_ex")?>:</td>
		<td width="60%">
			<input type="text" size="10" name="SORT" value="<?echo (int)$currency['SORT']; ?>" maxlength="10">
		</td>
	</tr>
<?$tabControl->BeginNextTab();
	foreach ($currencyLangs as $lang => $settings)
	{
		?><tr class="heading"><td colspan="2"><?echo htmlspecialcharsex($langList[$lang]); ?></td></tr>
		<tr>
			<td width="40%"><?echo GetMessage("CURRENCY_FULL_NAME")?>:</td>
			<td width="60%"><input title="<?echo GetMessage("CURRENCY_FULL_NAME_DESC")?>" type="text" maxlength="50" size="15" name="LANG_<? echo $lang; ?>[FULL_NAME]" value="<?=htmlspecialcharsbx($settings['FULL_NAME']);?>"></td>
		</tr>
		<tr>
			<td width="40%"><?echo GetMessage("CURRENCY_FORMAT_TEMPLATE")?>:</td>
			<td width="60%">
				<select name="format_<? echo $lang; ?>" onchange="setTemplate('<? echo $lang; ?>')">
					<option value="">-<?echo GetMessage("CURRENCY_SELECT_TEMPLATE")?>-</option>
					<?foreach ($arTemplates as $key => $ar):?>
						<option value="<?=$key?>"><?=$ar["TEXT"]?></option>
					<?endforeach?>
				</select>
			</td>
		</tr>
		<tr class="adm-detail-required-field">
			<td width="40%"><?echo GetMessage("CURRENCY_FORMAT_DESC")?>:</td>
			<td width="60%"><input title="<?echo GetMessage("CURRENCY_FORMAT_DESC")?>" type="text" maxlength="50" size="10" name="LANG_<? echo $lang; ?>[FORMAT_STRING]" value="<?=htmlspecialcharsbx($settings['FORMAT_STRING']); ?>"></td>
		</tr>
		<tr>
			<td width="40%"><?echo GetMessage("CURRENCY_DEC_POINT_DESC")?>:</td>
			<td width="60%"><input title="<?echo GetMessage("CURRENCY_DEC_POINT_DESC")?>" type="text" maxlength="5" size="5" name="LANG_<? echo $lang; ?>[DEC_POINT]" value="<?=htmlspecialcharsbx($settings['DEC_POINT']); ?>"></td>
		</tr>
		<tr>
			<td width="40%"><?echo GetMessage("THOU_SEP_DESC")?>:</td>
			<td width="60%">
				<select name="LANG_<? echo $lang; ?>[THOUSANDS_VARIANT]" onchange="setThousandsVariant('<? echo $lang; ?>')">
				<?
				foreach ($separatorList as $separatorID => $separatorTitle)
				{
					?><option value="<? echo $separatorID ?>"<?
						echo ($settings['THOUSANDS_VARIANT'] == $separatorID
						? ' selected' : '');?>><? echo htmlspecialcharsex($separatorTitle); ?></option><?
				}
				unset($separatorID, $separatorTitle);
				?>
				<option value=""<? echo ($settings['THOUSANDS_SEP'] !== '' ? ' selected' : '');?>><?=GetMessage("CURRENCY_THOUSANDS_VARIANT_O")?></option>
				</select>
				<input title="<?echo GetMessage("THOU_SEP_DESC")?>" type="text" maxlength="5" size="5" name="LANG_<? echo $lang; ?>[THOUSANDS_SEP]" value="<?=htmlspecialcharsbx($settings['THOUSANDS_SEP']);?>">
			</td>
		</tr>
		<tr>
			<td width="40%"><?echo GetMessage("DECIMALS_DESC")?>: <span class="required" style="vertical-align: super; font-size: smaller;">1</span></td>
			<td width="60%"><input title="<?echo GetMessage("DECIMALS_DESC")?>" type="text" maxlength="5" size="5" name="LANG_<? echo $lang; ?>[DECIMALS]" value="<?=htmlspecialcharsbx($settings['DECIMALS']);?>"></td>
		</tr>
		<tr>
			<td width="40%"><? echo GetMessage('HIDE_ZERO_DECIMALS'); ?>: <span class="required" style="vertical-align: super; font-size: smaller;">2</span></td>
			<td width="60%">
				<input type="hidden" name="LANG_<? echo $lang; ?>[HIDE_ZERO]" value="N">
				<input type="checkbox" name="LANG_<? echo $lang; ?>[HIDE_ZERO]" value="Y" <? echo ($settings['HIDE_ZERO'] == 'Y' ? 'checked' : ''); ?>>
			</td>
		</tr>
		<?
	}
$tabControl->EndTab();
$tabControl->Buttons(array("disabled" => $CURRENCY_RIGHT < "W", "back_url" =>"/bitrix/admin/currencies.php?lang=".LANGUAGE_ID));
$tabControl->End();?>
</form>
<?
echo BeginNote();
echo GetMessage('CURRENCY_CODES_ISO_STANDART', array('#ISO_LINK#' => CURRENCY_ISO_STANDART_URL));
?><br><br>
<span class="required" style="vertical-align: super; font-size: smaller;">1</span> - <?
echo GetMessage('DECIMALS_COMMENTS');
?><br><br>
<span class="required" style="vertical-align: super; font-size: smaller;">2</span> - <?
echo GetMessage('HIDE_ZERO_DECIMALS_DESCR_EXT');
echo EndNote();
?>
<script type="text/javascript">
BX.ready(function(){
<?
foreach ($langID as &$lang)
{
	?>setThousandsVariant('<? echo $lang; ?>');
	<?
}
unset($lang);
?>
});
</script>
<?require($_SERVER["DOCUMENT_ROOT"]."/bitrix/modules/main/include/epilog_admin.php");?>