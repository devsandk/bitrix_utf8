<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();
if(strlen($arResult["errorMessage"]) > 0)
	ShowError($arResult["errorMessage"]);

?><h3><?=GetMessage("SAP_BUY_MONEY")?></h3>
<form method="post" name="buyMoney" action="">
<?
foreach($arResult["AMOUNT_TO_SHOW"] as $v)
{
	?><input type="radio" name="<?=$arParams["VAR"]?>" value="<?=$v["ID"]?>"><?=$v["NAME"]?><br /><?
}
?>
<input type="submit" name="button" value="<?=GetMessage("SAP_BUTTON")?>">
</form>