function updateQuantity(basketId, ratio)
{
	var oldVal = BX("QUANTITY_" + basketId).defaultValue,
		newVal = BX("QUANTITY_" + basketId).value,
		bValidChange = false;

	if (ratio == 0)
	{
		bValidChange = true;
	}
	else
	{
		var newValInt = newVal * 10000,
			ratioInt = ratio * 10000,
			reminder = newValInt % ratioInt;

		if (reminder == 0)
			bValidChange = true;
	}

	if (!bValidChange)
		BX("QUANTITY_" + basketId).value = oldVal;
	else
	{
		newVal = parseFloat(newVal).toFixed(2);
		BX("QUANTITY_" + basketId).defaultValue = newVal;
		BX("QUANTITY_" + basketId).value = newVal;
	}
}

function setQuantity(basketId, ratio, sign)
{
	var curVal = parseFloat(BX("QUANTITY_" + basketId).value),
		newVal;

	newVal = (sign == 'up') ? curVal + ratio : curVal - ratio;

	if (newVal < 0)
		newVal = 0;

	newVal = newVal.toFixed(2);

	BX("QUANTITY_" + basketId).value = newVal;
	BX("QUANTITY_" + basketId).defaultValue = newVal;
}

function checkAll(val)
{
	var count = BX("main-table").rows.length - 2;

	for (i=0; i<=count; i++)
	{
		if (val)
		{
			if (BX('DELETE_' + i))
				BX('DELETE_' + i).checked = true;
		}
		else
		{
			if (BX('DELETE_' + i))
				BX('DELETE_' + i).checked = false;
		}
	}
}
