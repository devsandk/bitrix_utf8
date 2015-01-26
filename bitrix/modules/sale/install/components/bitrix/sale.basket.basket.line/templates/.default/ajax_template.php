<?if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true) die();
$this->IncludeLangFile('template.php');
$cartId = $arParams['cartId'];
?>
<div class="bx_small_cart">
	<span class="icon_cart"></span>
	<a href="<?=$arParams['PATH_TO_BASKET']?>"><?=GetMessage('TSB1_CART')?></a>
	<?if ($arParams['SHOW_NUM_PRODUCTS'] == 'Y' && ($arResult['NUM_PRODUCTS'] > 0 || $arParams['SHOW_EMPTY_VALUES'] == 'Y')):?>
		<strong><?=$arResult['NUM_PRODUCTS'].' '.$arResult['PRODUCT(S)']?></strong>
	<?endif?>
	<?if ($arParams['SHOW_TOTAL_PRICE'] == 'Y'):?>
		<br>
		<span class="icon_spacer"></span>
		<?=GetMessage('TSB1_TOTAL_PRICE')?>
		<?if ($arResult['NUM_PRODUCTS'] > 0 || $arParams['SHOW_EMPTY_VALUES'] == 'Y'):?>
			<strong><?=$arResult['TOTAL_PRICE']?></strong>
		<?endif?>
	<?endif?>
	<?if ($arParams['SHOW_PERSONAL_LINK'] == 'Y'):?>
		<br>
		<span class="icon_info"></span>
		<a class="link_profile" href="<?=$arParams['PATH_TO_PERSONAL']?>"><?=GetMessage('TSB1_PERSONAL')?></a>
	<?endif?>
	<?if ($arParams['SHOW_AUTHOR'] == 'Y'):?>
		<br>
		<span class="icon_profile"></span>
		<?if ($USER->IsAuthorized()):
			$name = trim($USER->GetFullName());
			if (! $name)
				$name = trim($USER->GetLogin());
			if (strlen($name) > 15)
				$name = substr($name, 0, 12).'...';
			?>
			<a class="link_profile" href="<?=$arParams['PATH_TO_PROFILE']?>"><?=$name?></a>
			&nbsp;
			<a class="link_profile" href="?logout=yes"><?=GetMessage('TSB1_LOGOUT')?></a>
		<?else:?>
			<a class="link_profile" href="<?=$arParams['PATH_TO_REGISTER']?>?login=yes"><?=GetMessage('TSB1_LOGIN')?></a>
			&nbsp;
			<a class="link_profile" href="<?=$arParams['PATH_TO_REGISTER']?>?register=yes"><?=GetMessage('TSB1_REGISTER')?></a>
		<?endif?>
	<?endif?>
</div>
<?if ($arParams["SHOW_PRODUCTS"] == "Y" && $arResult['NUM_PRODUCTS'] > 0):?>
	<div class="bx_item_listincart<?
		$topNumber = 3;
		if ($arParams['SHOW_TOTAL_PRICE'] == 'N')
			$topNumber--;
		if ($arParams['SHOW_PERSONAL_LINK'] == 'N')
			$topNumber--;
		if ($topNumber < 3)
			echo " top$topNumber"?>">

		<?if ($arParams["POSITION_FIXED"] == "Y"):?>
			<div id="<?=$cartId?>status" class="status" onclick="<?=$cartId?>.toggleOpenCloseCart()"><?=GetMessage("TSB1_EXPAND")?></div>
		<?endif?>

		<div id="<?=$cartId?>products" class="bx_itemlist_container">
			<?foreach ($arResult["CATEGORIES"] as $category => $items):
				if (empty($items))
					continue;
				?>
				<div class="bx_item_status"><?=GetMessage("TSB1_$category")?></div>
				<?foreach ($items as $v):?>
					<div class="bx_itemincart">
						<div class="bx_item_delete" onclick="<?=$cartId?>.removeItemFromCart(<?=$v['ID']?>)" title="<?=GetMessage("TSB1_DELETE")?>"></div>
						<?if ($arParams["SHOW_IMAGE"] == "Y"):?>
							<div class="bx_item_img_container">
								<?if ($v["PICTURE_SRC"]):?>
									<?if($v["DETAIL_PAGE_URL"]):?>
										<a href="<?=$v["DETAIL_PAGE_URL"]?>"><img src="<?=$v["PICTURE_SRC"]?>" alt="<?=$v["NAME"]?>"></a>
									<?else:?>
										<img src="<?=$v["PICTURE_SRC"]?>" alt="<?=$v["NAME"]?>" />
									<?endif?>
								<?endif?>
							</div>
						<?endif?>
						<div class="bx_item_title">
							<?if ($v["DETAIL_PAGE_URL"]):?>
								<a href="<?=$v["DETAIL_PAGE_URL"]?>"><?=$v["NAME"]?></a>
							<?else:?>
								<?=$v["NAME"]?>
							<?endif?>
						</div>
						<?if (true):/*$category != "SUBSCRIBE") TODO */?>
							<?if ($arParams["SHOW_PRICE"] == "Y"):?>
								<div class="bx_item_price">
									<strong><?=$v["PRICE_FMT"]?></strong>
									<?if ($v["FULL_PRICE"] != $v["PRICE_FMT"]):?>
										<span class="bx_item_oldprice"><?=$v["FULL_PRICE"]?></span>
									<?endif?>
								</div>
							<?endif?>
							<?if ($arParams["SHOW_SUMMARY"] == "Y"):?>
								<div class="bx_item_col_summ">
									<strong><?=$v["QUANTITY"]?></strong> <?=$v["MEASURE_NAME"]?> <?=GetMessage("TSB1_SUM")?>
									<strong><?=$v["SUM"]?></strong>
								</div>
							<?endif?>
						<?endif?>
					</div>
				<?endforeach?>
			<?endforeach?>
		</div>

		<?if($arParams["PATH_TO_ORDER"] && $arResult["CATEGORIES"]["READY"]):?>
			<div class="bx_button_container">
				<a href="<?=$arParams["PATH_TO_ORDER"]?>" class="bx_bt_button_type_2 bx_medium">
					<?=GetMessage("TSB1_2ORDER")?>
				</a>
			</div>
		<?endif?>

	</div>
<?endif?>
