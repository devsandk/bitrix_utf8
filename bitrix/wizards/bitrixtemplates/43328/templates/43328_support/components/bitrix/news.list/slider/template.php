<?if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();?>

<?if(count($arResult["ITEMS"])>0) {?>
	<?$APPLICATION->AddHeadScript(SITE_DIR.'js/43328/camera.js');?>
	<?$APPLICATION->AddHeadScript(SITE_DIR.'js/43328/jquery.easing.1.3.js');?>
	<?$APPLICATION->SetAdditionalCSS(SITE_DIR."css/43328/camera.css");?>
	<script>
        $(window).load(function(){
			$('.camera_wrap').camera();
        });
	</script>
	<div class="slider">
		<div class="camera_wrap">
			<?foreach($arResult["ITEMS"] as $arItem) {?>
				<?$this->AddEditAction($arItem['ID'], $arItem['EDIT_LINK'], CIBlock::GetArrayByID($arItem["IBLOCK_ID"], "ELEMENT_EDIT"));
				$this->AddDeleteAction($arItem['ID'], $arItem['DELETE_LINK'], CIBlock::GetArrayByID($arItem["IBLOCK_ID"], "ELEMENT_DELETE"), array("CONFIRM" => GetMessage('CT_BNL_ELEMENT_DELETE_CONFIRM')));?>
				<div data-src="<?=$arItem["DETAIL_PICTURE"]["SRC"]?>"></div>
			<?}?>
		</div>
	</div>
<?}?>
