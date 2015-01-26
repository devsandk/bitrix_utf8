<?if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();
/** @var array $arParams */
/** @var array $arResult */
/** @global CMain $APPLICATION */
/** @global CUser $USER */
/** @global CDatabase $DB */
/** @var CBitrixComponentTemplate $this */
/** @var string $templateName */
/** @var string $templateFile */
/** @var string $templateFolder */
/** @var string $componentPath */
/** @var CBitrixComponent $component */
$this->setFrameMode(true);

if (empty($arResult["BRAND_BLOCKS"]))
	return;
$strRand = $this->randString();
$strObName = 'obIblockBrand_'.$strRand;
$blockID = 'bx_IblockBrand_'.$strRand;
$mouseEvents = 'onmouseover="'.$strObName.'.itemOver(this);" onmouseout="'.$strObName.'.itemOut(this)"';
?><div class="bx_item_detail_inc_two" id="<? echo $blockID; ?>"><?
$handlerIDS = array();
foreach ($arResult["BRAND_BLOCKS"] as $blockId => $arBB)
{
	$brandID = 'brand_'.$arResult['ID'].'_'.$strRand;
	$popupID = $brandID.'_popup';

	$usePopup = $arBB['FULL_DESCRIPTION'] !== false;
	$useLink = $arBB['LINK'] !== false;
	if ($useLink)
	{
		$arBB['LINK'] = htmlspecialcharsbx($arBB['LINK']);
	}
	switch ($arBB['TYPE'])
	{
		case 'ONLY_PIC':
			?><div id="<? echo $brandID; ?>" class="bx_item_detail_inc_one_container"<? echo ($usePopup ? ' data-popup="'.$popupID.'"' : ''); ?>><?
			if ($usePopup)
			{
				?><span class="bx_popup" id="<? echo $popupID; ?>"><span class="arrow"></span><span class="text"><? echo $arBB['FULL_DESCRIPTION']; ?></span></span><?
			}
			if ($useLink)
			{
				echo '<a href="'.$arBB['LINK'].'">';
			}
			?><img src="<? echo $arBB['PICT']['SRC']; ?>" width="<? echo $arBB['PICT']['WIDTH']; ?>" height="<? echo $arBB['PICT']['HEIGHT']; ?>"<?
			if ($arBB['NAME'] !== false)
			{
				$arBB['NAME'] = htmlspecialcharsbx($arBB['NAME']);
				echo ' alt="'.$arBB['NAME'].'" title="'.$arBB['NAME'].'"';
			}
			?>><?
			if ($useLink)
			{
				echo '</a>';
			}
			?>
			</div><?
			break;
		default:
			$tagAttrs = 'id="'.$brandID.'"'.(
				empty($arBB['PICT'])
				? ' class="bx_item_vidget"'
				: ' class="bx_item_vidget icon" style="background-image:url('.$arBB['PICT']['SRC'].');"'
			);
			if ($usePopup)
			{
				$tagAttrs .= ' data-popup="'.$popupID.'"';
			}

			if ($useLink)
			{
				?><a <? echo $tagAttrs; ?> href="<? echo $arBB['LINK']; ?>"><?
				if ($usePopup)
				{
					?><span class="bx_popup" id="<? echo $popupID; ?>"><span class="arrow"></span><span class="text"><? echo $arBB['FULL_DESCRIPTION']; ?></span></span><?
				}
				if($arBB['DESCRIPTION'] !== false)
				{
					echo htmlspecialcharsex($arBB['DESCRIPTION']);
				}
				?></a><?
			}
			else
			{
				?><span <? echo $tagAttrs; ?>><?
				if ($usePopup)
				{
					?><span class="bx_popup" id="<? echo $popupID; ?>"><span class="arrow"></span><span class="text"><? echo $arBB['FULL_DESCRIPTION']; ?></span></span><?
				}
				if($arBB['DESCRIPTION'] !== false)
				{
					echo htmlspecialcharsex($arBB['DESCRIPTION']);
				}
				?></span><?
			}
			break;
	}

	if ($usePopup)
	{
		$handlerIDS[] = $brandID;
	}
}
?></div><?
if (!empty($handlerIDS))
{
	$jsParams = array(
		'blockID' => $blockID
	);
?><script type="text/javascript">
var <? echo $strObName; ?> = new JCIblockBrands(<? echo CUtil::PhpToJSObject($jsParams); ?>);
</script><?
}