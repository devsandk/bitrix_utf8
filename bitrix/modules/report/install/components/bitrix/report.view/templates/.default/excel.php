<?
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true) die();

__IncludeLang(dirname(__FILE__).'/lang/'.LANGUAGE_ID.'/template.php');

foreach ($arResult['data'] as &$row)
{
	foreach($arResult['viewColumns'] as $col)
	{
		if (is_array($row[$col['resultName']]))
		{
			$row[$col['resultName']] = join(' / ', $row[$col['resultName']]);
		}
	}
}
unset($row);

?>
<meta http-equiv="Content-type" content="text/html;charset=<?echo LANG_CHARSET?>" />
<style type="text/css">
	.report-red-neg-val { color: red; }
</style>
<table border="1">
	<thead>
		<tr>
			<? foreach($arResult['viewColumns'] as $colId => $col): ?>
				<th><?=htmlspecialcharsbx($col['humanTitle'])?></th>
			<? endforeach; ?>
		</tr>
	</thead>
	<tbody>
		<? foreach ($arResult['data'] as $row): ?>
			<tr>
				<? foreach($arResult['viewColumns'] as $col): ?>
				<?php
					$td_class = '';
					if ($arResult['settings']['red_neg_vals'] === true)
					{
						$finalValue = $row[$col['resultName']];
						if (is_numeric($finalValue) && $finalValue < 0) $td_class = ' class="report-red-neg-val"';
					}
				?>
					<td<?=$td_class?>><?=$row[$col['resultName']]?></td>
				<? endforeach; ?>
			</tr>
		<? endforeach; ?>
	</tbody>
</table>