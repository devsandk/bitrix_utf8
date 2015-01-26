<?if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();?>
<b><?= GetMessage("SALE_OTLOG_TITLE")?></b><br /><br />

<table class="sale_basket_basket data-table" id="main-table">

	<thead>
		<tr>
			<?
			foreach ($arResult["GRID"]["HEADERS"] as $id => $arHeader):

				if ($arHeader["id"] == "DISCOUNT")
					continue;
			?>
				<th>
				<?
					if (strlen($arHeader["name"]) > 0)
						echo $arHeader["name"];
					else
						echo GetMessage("SALE_".$arHeader["id"]);
				?>
				</th>
			<?
			endforeach;
			?>
		</tr>
	</thead>

	<tbody>
		<?
		$i = 0;
		foreach ($arResult["GRID"]["ROWS"] as $k => $arItem):

			if ($arItem["DELAY"] == "Y" && $arItem["CAN_BUY"] == "Y"):
				$i++;
		?>
			<tr>
			<?
			foreach ($arResult["GRID"]["HEADERS"] as $id => $arHeader):

				if ($arHeader["id"] == "DISCOUNT")
					continue;
			?>
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
										<?
										echo $arItem["QUANTITY"];
										if (isset($arItem["MEASURE_TEXT"]))
											echo "&nbsp;".$arItem["MEASURE_TEXT"];
										?>
									</tr>
								</table>
							</div>
						<?
						elseif ($arHeader["id"] == "PRICE"):
						?>
							<div style="text-align: right;"><?=str_replace(" ", "&nbsp;", $arItem["PRICE_FORMATED"]);?></div>
						<?
						elseif ($arHeader["id"] == "DELETE"):
						?>
							<div style="text-align: center;"><input type="checkbox" name="DELETE_<?=$arItem["ID"] ?>" id="DELETE_<?=$i?>" value="Y"></div>
						<?
						elseif ($arHeader["id"] == "DELAY"):
						?>
							<div style="text-align: center;"><input type="checkbox" checked name="DELAY_<?=$arItem["ID"] ?>" value="Y"></div>
						<?
						elseif ($arHeader["id"] == "PROPS"):

							foreach ($arItem["PROPS"] as $val):
								echo $val["NAME"].":&nbsp;".$val["VALUE"]."<br/>";
							endforeach;

						elseif ($arHeader["id"] == "TYPE"):

							echo $arItem["NOTES"];

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
			endif;
			?>
			</tr>
		<?endforeach;?>
	</tbody>

</table>

<br />
<div width="30%">
	<input type="submit" value="<?= GetMessage("SALE_REFRESH")?>" name="BasketRefresh"><br />
	<small><?= GetMessage("SALE_REFRESH_DESCR")?></small><br />
</div>
<br />
<?