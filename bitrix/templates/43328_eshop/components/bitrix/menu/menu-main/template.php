<?if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();
$this->setFrameMode(true);
?>

<?if (!empty($arResult)) {?>
	<ul class="sf-menu">
		<?$i = 0; $j = 0; $l = $arParams['MENU_COUNT'];
		foreach($arResult as $arItem) {if($arItem["DEPTH_LEVEL"] == 1) $j++;}
		if($j > $l) $j = $l;
		$previousLevel = 0;
		foreach($arResult as $arItem) {
			if($arItem["DEPTH_LEVEL"] == 1) $i++;
			if($i > $j) break;?>
			<?if ($previousLevel && $arItem["DEPTH_LEVEL"] < $previousLevel) {?>
				<?=str_repeat("</ul></li>", ($previousLevel - $arItem["DEPTH_LEVEL"]));?>
			<?}?>

			<?if ($arItem["IS_PARENT"]) {?>
				<?if ($arItem["DEPTH_LEVEL"] == 1) {?>
					<li class="sub-menu<?if ($arItem["SELECTED"]) echo' current';?>"><a href="<?=$arItem["LINK"]?>"><?=$arItem["TEXT"]?></a>
						<ul>
				<?} else {?>
					<li class="sub-menu<?if ($arItem["SELECTED"]) echo' current';?>"><a href="<?=$arItem["LINK"]?>" class="parent"><?=$arItem["TEXT"]?></a>
						<ul>
				<?}?>
			<?} else {?>
				<?if ($arItem["PERMISSION"] > "D") {?>
					<?if ($arItem["DEPTH_LEVEL"] == 1) {?>
						<li<?if ($arItem["SELECTED"]) echo' class="current"';?>><a href="<?=$arItem["LINK"]?>"><?=$arItem["TEXT"]?></a></li>
					<?} else {?>
						<li<?if ($arItem["SELECTED"]) echo' class="current"';?>><a href="<?=$arItem["LINK"]?>"><?=$arItem["TEXT"]?></a></li>
					<?}?>
				<?} else {?>
					<?if ($arItem["DEPTH_LEVEL"] == 1) {?>
						<li<?if ($arItem["SELECTED"]) echo' class="current"';?>><a href="" title="<?=GetMessage("MENU_ITEM_ACCESS_DENIED")?>"><?=$arItem["TEXT"]?></a></li>
					<?} else {?>
						<li<?if ($arItem["SELECTED"]) echo' class="current"';?>><a href="" class="denied" title="<?=GetMessage("MENU_ITEM_ACCESS_DENIED")?>"><?=$arItem["TEXT"]?></a></li>
					<?}?>
				<?}?>
			<?}?>
			<?$previousLevel = $arItem["DEPTH_LEVEL"];?>
		<?}?>

		<?if ($previousLevel > 1) {//close last item tags?>
			<?=str_repeat("</ul></li>", ($previousLevel-1) );?>
		<?}?>
	</ul>
	<div class="menu-clear-left"></div>
<?}?>