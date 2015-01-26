<?if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();?>

<div class="order_props_title"><div><?=GetMessage("SOA_PERSON_TYPE")?></div></div>
<div class="order_props">
	<table class="sale_order_full_table">
	<tr>
		<td>
			<?
			foreach($arResult["PERSON_TYPE"] as $v)
			{
				?><input type="radio" id="PERSON_TYPE_<?= $v["ID"] ?>" name="PERSON_TYPE" value="<?= $v["ID"] ?>"<?if ($v["CHECKED"]=="Y") echo " checked=\"checked\"";?> onClick="submitForm()"> <label for="PERSON_TYPE_<?= $v["ID"] ?>"><?= $v["NAME"] ?></label><br /><?
			}
			?>
		</td>
	</tr>
	</table>
</div>
