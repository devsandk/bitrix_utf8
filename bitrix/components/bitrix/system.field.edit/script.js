function addElement(Name, thisButton)
{
	if (document.getElementById('main_' + Name))
	{
		var element = document.getElementById('main_' + Name).getElementsByTagName('div');
		if (element && element.length > 0 && element[0])
		{
			var parentElement = element[0].parentNode; // parent
			parentElement.appendChild(element[element.length-1].cloneNode(true));
		}
	}
	return;
}

function addElementFile(Name, thisButton)
{
	var parentElement = document.getElementById('main_' + Name);
	var clone = document.getElementById('main_add_' + Name);
	if(parentElement && clone)
	{
		clone = clone.cloneNode(true);
		clone.id = '';
		clone.style.display = '';
		parentElement.appendChild(clone);
	}
	return;
}
