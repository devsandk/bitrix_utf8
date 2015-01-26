<?if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();?>
<?if(strlen($arResult["ERROR_MESSAGE"])>0)
	ShowError($arResult["ERROR_MESSAGE"]);
if(!empty($arResult["STORES"]) && $arResult["TITLE"] != ''):?>
	<h4><?=$arResult["TITLE"]?></h4>
<?endif;
if(isset($arResult["IS_SKU"]) && $arResult["IS_SKU"] == 1):?>
	<script type="text/javascript">
		var obStoreAmount = new JCCatalogStoreSKU({
			'AR_ALL_RESULT': <?=CUtil::PhpToJSObject($arResult["SKU"])?>,
			'PHONE_MESSAGE': <?=CUtil::PhpToJSObject(GetMessage('S_PHONE'))?>,
			'SCHEDULE_MESSAGE': <?=CUtil::PhpToJSObject(GetMessage('S_SCHEDULE'))?>,
			'AMOUNT_MESSAGE': <?=CUtil::PhpToJSObject(GetMessage('S_AMOUNT'))?>,
		});
	</script>
	<?unset($arResult["STORES"]);
endif;?>
<div class="bx_storege" id="catalog_store_amount_div">
	<?if(!empty($arResult["STORES"])):?>
	<hr><ul>
		<?foreach($arResult["STORES"] as $pid => $arProperty):?>
			<li>
				<a href="<?=$arProperty["URL"]?>"><?=$arProperty["TITLE"]?></a>
				<?if(isset($arProperty["PHONE"])):?>
					<br /><span class="tel"><?=GetMessage('S_PHONE')?><?=$arProperty["PHONE"]?></span>
				<?endif;?>
				<?if(isset($arProperty["SCHEDULE"])):?>
					<br /><span class="schedule"><?=GetMessage('S_SCHEDULE')?><?=$arProperty["SCHEDULE"]?></span>
				<?endif;?>
				<br /><span class="balance"><?=$arProperty["AMOUNT"]?></span>
			</li>
		<?endforeach;?>
		</ul>
	<?endif;?>
</div>