<?if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

if ($arResult["READY"]=="Y" || $arResult["DELAY"]=="Y" || $arResult["NOTAVAIL"]=="Y" || $arResult["SUBSCRIBE"]=="Y")
{
?><table class="sale_basket_small"><?
	if ($arResult["READY"]=="Y")
	{
		?><tr><td align="center"><? echo GetMessage("TSBS_READY"); ?></td></tr>
		<tr><td><ul><?
		foreach ($arResult["ITEMS"] as &$v)
		{
			if ($v["DELAY"]=="N" && $v["CAN_BUY"]=="Y")
			{
				?><li><?
				if ('' != $v["DETAIL_PAGE_URL"])
				{
					?><a href="<?echo $v["DETAIL_PAGE_URL"]; ?>"><b><?echo $v["NAME"]?></b></a><?
				}
				else
				{
					?><b><?echo $v["NAME"]?></b><?
				}
				?><br />
				<?= GetMessage("TSBS_PRICE") ?>&nbsp;<b><?echo $v["PRICE_FORMATED"]?></b><br />
				<?= GetMessage("TSBS_QUANTITY") ?>&nbsp;<?echo $v["QUANTITY"]?>
				</li>
				<?
			}
		}
		if (isset($v))
			unset($v);
		?></ul></td></tr><?
		if ('' != $arParams["PATH_TO_BASKET"])
		{
			?><tr><td align="center"><form method="get" action="<?=$arParams["PATH_TO_BASKET"]?>">
			<input type="submit" value="<?= GetMessage("TSBS_2BASKET") ?>">
			</form></td></tr><?
		}
		if ('' != $arParams["PATH_TO_ORDER"])
		{
			?><tr><td align="center"><form method="get" action="<?= $arParams["PATH_TO_ORDER"] ?>">
			<input type="submit" value="<?= GetMessage("TSBS_2ORDER") ?>">
			</form></td></tr><?
		}
	}
	if ($arResult["DELAY"]=="Y")
	{
		?><tr><td align="center"><?= GetMessage("TSBS_DELAY") ?></td></tr>
		<tr><td><ul>
		<?
		foreach ($arResult["ITEMS"] as &$v)
		{
			if ($v["DELAY"]=="Y" && $v["CAN_BUY"]=="Y")
			{
				?><li><?
				if ('' != $v["DETAIL_PAGE_URL"])
				{
					?><a href="<?echo $v["DETAIL_PAGE_URL"] ?>"><b><?echo $v["NAME"]?></b></a><?
				}
				else
				{
					?><b><?echo $v["NAME"]?></b><?
				}
				?><br />
				<?= GetMessage("TSBS_PRICE") ?>&nbsp;<b><?echo $v["PRICE_FORMATED"]?></b><br />
				<?= GetMessage("TSBS_QUANTITY") ?>&nbsp;<?echo $v["QUANTITY"]?>
				</li>
				<?
			}
		}
		if (isset($v))
			unset($v);
		?></ul></td></tr><?
		if ('' != $arParams["PATH_TO_BASKET"])
		{
			?><tr><td><form method="get" action="<?=$arParams["PATH_TO_BASKET"]?>">
			<input type="submit" value="<?= GetMessage("TSBS_2BASKET") ?>">
			</form></td></tr><?
		}
	}
	if ($arResult["SUBSCRIBE"]=="Y")
	{
		?><tr><td align="center"><?= GetMessage("TSBS_SUBSCRIBE") ?></td></tr>
		<tr><td><ul><?
		foreach ($arResult["ITEMS"] as &$v)
		{
			if ($v["CAN_BUY"]=="N" && $v["SUBSCRIBE"]=="Y")
			{
				?><li><?
				if ('' != $v["DETAIL_PAGE_URL"])
				{
					?><a href="<?echo $v["DETAIL_PAGE_URL"] ?>"><b><?echo $v["NAME"]?></b></a><?
				}
				else
				{
					?><b><?echo $v["NAME"]?></b><?
				}
				?></li><?
			}
		}
		if (isset($v))
			unset($v);
		?></ul></td></tr><?
	}
	if ($arResult["NOTAVAIL"]=="Y")
	{
		?><tr><td align="center"><?= GetMessage("TSBS_UNAVAIL") ?></td></tr>
		<tr><td><ul><?
		foreach ($arResult["ITEMS"] as &$v)
		{
			if ($v["CAN_BUY"]=="N" && $v["SUBSCRIBE"]=="N")
			{
				?><li><?
				if ('' != $v["DETAIL_PAGE_URL"])
				{
					?><a href="<?echo $v["DETAIL_PAGE_URL"] ?>"><b><?echo $v["NAME"]?></b></a><?
				}
				else
				{
					?><b><?echo $v["NAME"]?></b><?
				}
				?><br />
				<?= GetMessage("TSBS_PRICE") ?>&nbsp;<b><?echo $v["PRICE_FORMATED"]?></b><br />
				<?= GetMessage("TSBS_QUANTITY") ?>&nbsp;<?echo $v["QUANTITY"]?>
				</li><?
			}
		}
		if (isset($v))
			unset($v);
		?></ul></td></tr><?
	}
	?></table><?
}
?>