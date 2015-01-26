<?if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();
$this->setFrameMode(true);
?>

<form id="search" action="<?=$arResult["FORM_ACTION"]?>">
	<input type="text" name="q" placeholder="<?=GetMessage("BSF_T_SEARCH_BUTTON");?>" value="" />
	<input name="s" type="hidden" value="<?=GetMessage("BSF_T_SEARCH_BUTTON");?>" />
	<a href="#" onClick="document.getElementById('search').submit()"></a>
</form>