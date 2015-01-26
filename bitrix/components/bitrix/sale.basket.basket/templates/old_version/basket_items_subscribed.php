<?if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();?>
<b><?= GetMessage("SALE_NOTIFY_TITLE")?></b><br /><br />

<table class="sale_basket_basket data-table" id="main-table">

	<thead>
		<tr>
			<?
			foreach ($arResult["GRID"]["HEADERS"] as $id => $arHeader):

				if (!in_array($arHeader["id"], array("NAME", "PROPS", "DELETE")))
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

			if ($arItem["CAN_BUY"] == "N" && $arItem["SUBSCRIBE"] == "Y"):
				$i++;
		?>
			<tr>
			<?
			foreach ($arResult["GRID"]["HEADERS"] as $id => $arHeader):

				if (!in_array($arHeader["id"], array("NAME", "PROPS", "DELETE")))
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

						elseif ($arHeader["id"] == "DELETE"):
						?>
							<div style="text-align: center;"><input type="checkbox" name="DELETE_<?=$arItem["ID"] ?>" id="DELETE_<?=$i?>" value="Y"></div>
						<?
						elseif ($arHeader["id"] == "PROPS"):

							foreach ($arItem["PROPS"] as $val):
								echo $val["NAME"].":&nbsp;".$val["VALUE"]."<br/>";
							endforeach;

						endif;
					?>
				</td>
				<?
				endforeach;
			endif;
			?>
			</tr>
		<?
		endforeach;
		?>
	</tbody>

</table>

<br />
<div width="30%">
	<input type="submit" value="<?= GetMessage("SALE_REFRESH") ?>" name="BasketRefresh"><br />
	<small><?= GetMessage("SALE_REFRESH_NOTIFY_DESCR") ?></small>
</div>
<?