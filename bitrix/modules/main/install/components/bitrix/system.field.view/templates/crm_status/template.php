<?if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();
CModule::IncludeModule('crm');

$ar = CCrmStatus::GetStatusList($arParams['arUserField']['SETTINGS']['ENTITY_TYPE']);
$first = true;
foreach ($arResult["VALUE"] as $res):
	if (!$first):
		?><span class="fields separator"></span><?
	else:
		$first = false;	
	endif;
	?><span class="fields crm_status"><?=(isset($ar[$res])? htmlspecialcharsbx($ar[$res]): '')?></span><?
endforeach;	
?>