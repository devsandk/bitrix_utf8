<?
/**
 * Bitrix vars
 * @global CMain $APPLICATION
 * @param array $arParams
 * @param array $arResult
 * @param CBitrixComponentTemplate $this
 */
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

if ((defined('BX_PUBLIC_MODE')) && (1 == BX_PUBLIC_MODE))
{
	$APPLICATION->SetAdditionalCSS($this->GetFolder().'/style.css');
	$APPLICATION->AddHeadScript("/bitrix/js/main/ajax.js");
	$APPLICATION->AddHeadScript("/bitrix/js/main/utils.js");
	$APPLICATION->AddHeadScript("/bitrix/js/main/public_tools.js");
	$APPLICATION->AddHeadScript($this->__component->GetPath().'/script.js');
}
$APPLICATION->AddHeadScript($this->GetFolder().'/script2.js');

$control_id = $arParams['CONTROL_ID'];
$textarea_id = (array_key_exists('INPUT_NAME_STRING', $arParams) && !empty($arParams['INPUT_NAME_STRING']) ? $arParams['INPUT_NAME_STRING'] : 'visual_'.$control_id);

$arParams['MAX_HEIGHT'] = intval($arParams['MAX_HEIGHT']);
if (0 >= $arParams['MAX_HEIGHT']) $arParams['MAX_HEIGHT'] = 1000;
$arParams['MIN_HEIGHT'] = intval($arParams['MIN_HEIGHT']);
if (0 >= $arParams['MIN_HEIGHT']) $arParams['MIN_HEIGHT'] = 30;
$arParams['MAX_WIDTH'] = intval($arParams['MAX_WIDTH']);
if (0 > $arParams['MAX_WIDTH']) $arParams['MAX_WIDTH'] = 0;
if ((defined('BX_PUBLIC_MODE')) && (1 == BX_PUBLIC_MODE)) $arParams['MAX_WIDTH'] = 500;

$boolStringValue = (array_key_exists('INPUT_VALUE_STRING', $arParams) && '' != $arParams['INPUT_VALUE_STRING']);
$INPUT_VALUE = array();
if ($boolStringValue)
{
	$arTokens = preg_split('/(?<=])[\n;,]+/', $arParams['~INPUT_VALUE_STRING']);
	foreach($arTokens as $key => $token)
	{
		if(preg_match("/^(.*) \\[(\\d+)\\]/", $token, $match))
		{
			$match[2] = intval($match[2]);
			if (0 < $match[2])
				$INPUT_VALUE[] = array(
					"ID" => $match[2],
					"NAME" => $match[1],
				);
		}
	}
}
?><div class="mli-layout" id="layout_<?=$control_id?>"><input type="hidden" name="<?echo $arParams['~INPUT_NAME']; ?>" value=""><?
if($arParams["MULTIPLE"]=="Y")
{
	?><textarea name="<?=$textarea_id?>" id="<?=$textarea_id?>" class="mli-field"><? echo ($boolStringValue ? htmlspecialcharsbx($arParams['INPUT_VALUE_STRING']) : '');?></textarea><?
}
else
{
	?><input autocomplete="off" type="text" name="<?=$textarea_id?>" id="<?=$textarea_id?>" value="<? echo ($boolStringValue ? htmlspecialcharsbx($arParams['INPUT_VALUE_STRING']) : '');?>" class="mli-field" /><?
}
?></div><?
$arAjaxParams = array(
	"IBLOCK_ID" => $arParams["IBLOCK_ID"],
	"lang" => LANGUAGE_ID,
	"site" => SITE_ID,
	"admin" => (defined('ADMIN_SECTION') && ADMIN_SECTION === true ? 'Y' : 'N'),
	'TYPE' => $arParams['TYPE']
);
if ('' != $arParams['BAN_SYM'])
{
	$arAjaxParams['BAN_SYM'] = $arParams['BAN_SYM'];
	$arAjaxParams['REP_SYM'] = $arParams['REP_SYM'];
}

$arSelectorParams = array(
	'AJAX_PAGE' => $this->GetFolder()."/ajax.php",
	'AJAX_PARAMS' => $arAjaxParams,
	'CONTROL_ID' => $control_id,
	'LAYOUT_ID' => 'layout_'.$control_id,
	'INPUT_NAME' => $arParams['~INPUT_NAME'],
	'PROACTIVE' => 'MESSAGE',
	'VALUE' => $INPUT_VALUE,
	'VISUAL' => array(
		'ID' => $textarea_id,
		'MAX_HEIGHT' => $arParams['MAX_HEIGHT'],
		'MIN_HEIGHT' => $arParams['MIN_HEIGHT'],
		'START_TEXT' => $arParams['START_TEXT'],
		'SEARCH_POSITION' => ('Y' == $arParams['FILTER'] ? 'absolute' : ''),
		'SEARCH_ZINDEX' => 4000,
	),
);

if (array_key_exists('INPUT_NAME_SUSPICIOUS', $arParams) && !empty($arParams['INPUT_NAME_SUSPICIOUS']))
{
	$arSelectorParams['INPUT_NAME_SUSPICIOUS'] = $arParams['INPUT_NAME_SUSPICIOUS'];
}
if (0 < $arParams['MAX_WIDTH'])
{
	$arSelectorParams['VISUAL']['MAX_WIDTH'] = $arParams['MAX_WIDTH'];
}

?>
<script type="text/javascript">
BX.ready(
	BX.defer(function(){
		window.jsMLI_<?=$control_id?> = new JCMainLookupAdminSelector(<? echo CUtil::PhpToJSObject($arSelectorParams); ?>);
		<? if ((defined('BX_PUBLIC_MODE')) && (1 == BX_PUBLIC_MODE))
		{
			?>window.jsMLI_<?=$control_id?>.Init();
			BX.addCustomEvent(BX.WindowManager.Get(), 'onWindowClose', function() {window.jsMLI_<?=$control_id?>.Clear(); window.jsMLI_<?=$control_id?> = null; });
			<?
		}
		if (array_key_exists('RESET', $arParams) && 'Y' == $arParams['RESET'])
		{
			?>window.jsMLI_<?=$control_id?>.Reset(true, false);<?
		}
		?>
	})
);
</script>