<?if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();
include($_SERVER["DOCUMENT_ROOT"].$templateFolder."/props_format.php");

$style = (is_array($arResult["ORDER_PROP"]["RELATED"]) && count($arResult["ORDER_PROP"]["RELATED"])) ? "" : "display:none";
?>
<div style="<?=$style?>">
	<br /><b><?=GetMessage("SOA_TEMPL_RELATED_PROPS")?></b><br />
	<table class="sale_order_full_table" id="sale_order_related_props">
	<?
	PrintPropsForm($arResult["ORDER_PROP"]["RELATED"], $arParams["TEMPLATE_LOCATION"]);
	?>
	</table>
</div>