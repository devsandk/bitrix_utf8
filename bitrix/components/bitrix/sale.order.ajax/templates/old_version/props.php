<?if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();
include($_SERVER["DOCUMENT_ROOT"].$templateFolder."/props_format.php");
?>

<b><?=GetMessage("SOA_TEMPL_PROP_INFO")?></b><br />
<table class="sale_order_full_table">
<tr><td>
<?
if(!empty($arResult["ORDER_PROP"]["USER_PROFILES"]))
{
	if ($arParams["ALLOW_NEW_PROFILE"] == "Y")
	{
	?>
		<?=GetMessage("SOA_TEMPL_PROP_CHOOSE")?><br />
		<select name="PROFILE_ID" id="ID_PROFILE_ID" onChange="SetContact(this.value)">
			<option value="0"><?=GetMessage("SOA_TEMPL_PROP_NEW_PROFILE")?></option>
			<?
			foreach($arResult["ORDER_PROP"]["USER_PROFILES"] as $arUserProfiles)
			{
				?>
				<option value="<?= $arUserProfiles["ID"] ?>"<?if ($arUserProfiles["CHECKED"]=="Y") echo " selected";?>><?=$arUserProfiles["NAME"]?></option>
				<?
			}
			?>
		</select>
		<br />
		<br />
	<?
	}
	else
	{
	?>
		<table class="sale_order_table">
			<tr>
				<td class="name">
					<?=GetMessage("SOA_TEMPL_EXISTING_PROFILE")?>
				</td>
				<td>
					<?
					foreach($arResult["ORDER_PROP"]["USER_PROFILES"] as $arUserProfiles)
					{
						echo $arUserProfiles["NAME"];
						?>
						<input type="hidden" name="PROFILE_ID" id="ID_PROFILE_ID" value="<?=$arUserProfiles["ID"]?>" />
						<br />
						<?
						break;
					}
					?>
				</td>
			</tr>
		</table>
	<?
	}
}

?>
<div style="display:none;">
<?
	$APPLICATION->IncludeComponent(
		"bitrix:sale.ajax.locations",
		$arParams["TEMPLATE_LOCATION"],
		array(
			"AJAX_CALL" => "N",
			"COUNTRY_INPUT_NAME" => "COUNTRY_tmp",
			"REGION_INPUT_NAME" => "REGION_tmp",
			"CITY_INPUT_NAME" => "tmp",
			"CITY_OUT_LOCATION" => "Y",
			"LOCATION_VALUE" => "",
			"ONCITYCHANGE" => "submitForm()",
		),
		null,
		array('HIDE_ICONS' => 'Y')
	);
?>
</div>

<table class="sale_order_full_table_no_border">
<?
PrintPropsForm($arResult["ORDER_PROP"]["USER_PROPS_N"], $arParams["TEMPLATE_LOCATION"]);
PrintPropsForm($arResult["ORDER_PROP"]["USER_PROPS_Y"], $arParams["TEMPLATE_LOCATION"]);
?>
</table>
</td></tr></table>
<br /><br />