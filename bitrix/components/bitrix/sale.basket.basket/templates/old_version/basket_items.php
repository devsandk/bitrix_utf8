<?if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();?>
<?
echo ShowError($arResult["ERROR_MESSAGE"]);
echo GetMessage("STB_ORDER_PROMT"); ?>

<br /><br />
<table width="100%">
	<tr>
		<td width="50%">
			<input type="submit" value="<?= GetMessage("SALE_REFRESH")?>" name="BasketRefresh">
		</td>
		<td align="right" width="50%">
			<input type="submit" value="<?= GetMessage("SALE_ORDER")?>" name="BasketOrder" id="basketOrderButton1">
		</td>
	</tr>
</table>
<br />

<table class="sale_basket_basket data-table" id="main-table">

	<thead>
		<tr>
			<?foreach ($arResult["GRID"]["HEADERS"] as $id => $arHeader):?>
				<th>
					<?
					if (strlen($arHeader["name"]) > 0)
						echo $arHeader["name"];
					else
						echo GetMessage("SALE_".$arHeader["id"]);
					?>
				</th>
			<?endforeach;?>
		</tr>
	</thead>

	<tbody>
		<?
		$i = 0;
		foreach ($arResult["GRID"]["ROWS"] as $k => $arItem):

			if ($arItem["DELAY"] == "N" && $arItem["CAN_BUY"] == "Y"):
				$i++;
		?>
			<tr>
				<?foreach ($arResult["GRID"]["HEADERS"] as $id => $arHeader):?>
					<td>
					<?
						if ($arHeader["id"] == "NAME"):

							if (strlen($arItem["DETAIL_PAGE_URL"]) > 0):
							?>
								<a href="<?=$arItem["DETAIL_PAGE_URL"] ?>">
							<?
							endif;
							?>
								<b><?=$arItem["NAME"]?></b>
							<?
							if (strlen($arItem["DETAIL_PAGE_URL"]) > 0):
							?>
								</a>
							<?
							endif;

						elseif ($arHeader["id"] == "QUANTITY"):
						?>
							<div style="text-align: center;">
								<table cellspacing="0" cellpadding="0" class="counter">
									<tr>
										<td>
											<input
												type="text"
												size="3"
												id="QUANTITY_<?=$arItem["ID"]?>"
												name="QUANTITY_<?=$arItem["ID"]?>"
												maxlength="18"
												value="<?=$arItem["QUANTITY"]?>"
												onchange="updateQuantity(<?=$arItem["ID"]?>, <? echo isset($arItem["MEASURE_RATIO"]) ? $arItem["MEASURE_RATIO"] : 0 ?>)"
											>
										</td>
										<?
										if (isset($arItem["MEASURE_RATIO"]) && floatval($arItem["MEASURE_RATIO"]) != 0 && !CSaleBasketHelper::isSetParent($arItem)):
										?>
											<td id="quantity_control">
												<div class="quantity_control">
													<a href="javascript:void(0)" class="plus" onclick="setQuantity(<?=$arItem["ID"]?>, <?=$arItem["MEASURE_RATIO"]?>, 'up');"></a>
													<a href="javascript:void(0)" class="minus" onclick="setQuantity(<?=$arItem["ID"]?>, <?=$arItem["MEASURE_RATIO"]?>, 'down');"></a>
												</div>
											</td>
										<?
										endif;
										if (isset($arItem["MEASURE_TEXT"])):
										?>
											<td style="text-align: left"><?=$arItem["MEASURE_TEXT"]?></td>
										<?
										endif;
										?>
									</tr>
								</table>
							</div>
						<?
						elseif ($arHeader["id"] == "PRICE"):
						?>
							<div style="text-align: right;"><?=$arItem["PRICE_FORMATED"]?></div>
						<?
						elseif ($arHeader["id"] == "DELETE"):
						?>
							<div style="text-align: center;"><input type="checkbox" name="DELETE_<?=$arItem["ID"] ?>" id="DELETE_<?=$i?>" value="Y"></div>
						<?
						elseif ($arHeader["id"] == "DELAY"):
						?>
							<div style="text-align: center;"><input type="checkbox" name="DELAY_<?=$arItem["ID"] ?>" value="Y"></div>
						<?
						elseif ($arHeader["id"] == "PROPS"):

							foreach ($arItem["PROPS"] as $val):
								echo $val["NAME"].":&nbsp;".$val["VALUE"]."<br/>";
							endforeach;

						elseif ($arHeader["id"] == "TYPE"):

							echo $arItem["NOTES"];

						elseif ($arHeader["id"] == "DISCOUNT"):

							echo $arItem["DISCOUNT_PRICE_PERCENT_FORMATED"];

						elseif ($arHeader["id"] == "WEIGHT"):
						?>
							<div style="text-align: right;"><?=$arItem["WEIGHT_FORMATED"]?></div>
						<?
						else:

							echo $arItem[$arHeader["id"]];

						endif;
					?>
					</td>
				<?
				endforeach;
				?>
			</tr>
			<?
			endif;
		endforeach;
		?>
	</tbody>

	<tfoot>
		<?
		foreach ($arResult["GRID"]["HEADERS"] as $id => $arHeader):

			if ($arHeader["id"] == "NAME"):
			?>
				<td align="right" nowrap>
					<?if ($arParams['PRICE_VAT_SHOW_VALUE'] == 'Y'):?>
						<b><?=GetMessage('SALE_VAT_INCLUDED')?></b><br />
					<?endif;?>
					<?
					if (doubleval($arResult["DISCOUNT_PRICE"]) > 0):
					?>
						<b>
						<?
						echo GetMessage("SALE_CONTENT_DISCOUNT");
						if (strLen($arResult["DISCOUNT_PERCENT_FORMATED"]) > 0)
							echo " (".$arResult["DISCOUNT_PERCENT_FORMATED"].")";
						?>:
						</b><br />
					<?
					endif;
					?>
					<b><?=GetMessage("SALE_ITOGO")?>:</b>
				</td>
			<?
			elseif ($arHeader["id"] == "PRICE"):
			?>
				<td align="right" nowrap>
					<?if ($arParams['PRICE_VAT_SHOW_VALUE'] == 'Y'):?>
						<?=$arResult["allVATSum_FORMATED"]?><br/>
					<?endif;?>
					<?
					if (doubleval($arResult["DISCOUNT_PRICE"]) > 0):
						echo $arResult["DISCOUNT_PRICE_FORMATED"]."<br />";
					endif;
					?>
					<?=$arResult["allSum_FORMATED"]?><br/>
				</td>
			<?
			elseif ($arHeader["id"] == "DELETE"):
			?>
				<td align="center"><input type="checkbox" name="DELETE" value="Y" onClick="checkAll(this.checked)"></td>
			<?
			elseif ($arHeader["id"] == "WEIGHT"):
			?>
				<td align="right"><?=$arResult["allWeight_FORMATED"] ?></td>
			<?
			else:
			?>
				<td>&nbsp;</td>
			<?
			endif;
		endforeach;
		?>
	</tfoot>

</table>

<br />
<table width="100%">
	<?if ($arParams["HIDE_COUPON"] != "Y"):?>
		<tr>
			<td colspan="3">
				<?= GetMessage("STB_COUPON_PROMT") ?>
				<input type="text" name="COUPON" value="<?=$arResult["COUPON"]?>" size="20">
				<br /><br />
			</td>
		</tr>
	<?endif;?>
	<tr>
		<td width="30%">
			<input type="submit" value="<?echo GetMessage("SALE_REFRESH")?>" name="BasketRefresh"><br />
			<small><?echo GetMessage("SALE_REFRESH_DESCR")?></small><br />
		</td>
		<td align="right" width="40%" valign="top"><?if(strlen($arResult["PREPAY_BUTTON"]) > 0) echo $arResult["PREPAY_BUTTON"];?></td>
		<td align="right" width="30%">
			<input type="submit" value="<?echo GetMessage("SALE_ORDER")?>" name="BasketOrder"  id="basketOrderButton2"><br />
			<small><?echo GetMessage("SALE_ORDER_DESCR")?></small><br />
		</td>
	</tr>
</table>
<br />
<?