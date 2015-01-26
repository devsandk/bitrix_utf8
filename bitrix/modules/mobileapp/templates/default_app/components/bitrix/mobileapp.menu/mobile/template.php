<?if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

$APPLICATION->SetPageProperty("BodyClass", "menu-page");
?>
<div class="menu-items" id="menu-items">

	<?

	$htmlMenu = "";

	foreach ($arResult["MENU"] as $arMenuSection)
	{
		if (!isset($arMenuSection['type']) && $arMenuSection['type'] != "section")
		{
			continue;
		}

		$htmlMenu .= '<div class="menu-separator">' . (isset($arMenuSection['text']) ? $arMenuSection['text'] : '') . '</div>';

		if (!isset($arMenuSection['items']) || !is_array($arMenuSection['items']))
		{
			continue;
		}

		$htmlMenu .= '<div class="menu-section menu-section-groups">';

		foreach ($arMenuSection['items'] as $arMenuItem)
		{
			$htmlMenu .= '<div class="menu-item';

			if (isset($arMenuItem["class"]))
			{
				$htmlMenu .= ' ' . $arMenuItem["class"];
			}

			$htmlMenu .= '"';

			foreach ($arMenuItem as $attrName => $attrVal)
			{
				if ($attrName == 'text' || $attrName == 'type' || $attrName == 'class')
				{
					continue;
				}

				$htmlMenu .= ' ' . $attrName . '="' . $attrVal . '"';
			}

			$htmlMenu .= '>';

			if (isset($arMenuItem['text']))
			{
				$htmlMenu .= $arMenuItem['text'];
			}

			$htmlMenu .= '</div>';
		}

		$htmlMenu .= '</div>';
	}

	echo $htmlMenu;
	?>
</div>

<script type="text/javascript">

	document.addEventListener("DOMContentLoaded", function ()
	{
		Menu.init(null);
	}, false);

	Menu = {
		currentItem: null,

		init: function (currentItem)
		{
			this.currentItem = currentItem;
			var items = document.getElementById("menu-items");
			var that = this;
			items.addEventListener("click", function (event)
			{
				that.onItemClick(event);
			}, false);
		},

		onItemClick: function (event)
		{
			var target = event.target;
			if (target && target.nodeType && target.nodeType == 1 && BX.hasClass(target, "menu-item"))
			{
				if (this.currentItem != null)
					this.unselectItem(this.currentItem);
				this.selectItem(target);

				var url = target.getAttribute("data-url");
				var pageId = target.getAttribute("data-pageid");

				if (BX.type.isNotEmptyString(url) && BX.type.isNotEmptyString(pageId))
					app.loadPage(url, pageId);
				else if (BX.type.isNotEmptyString(url))
					app.loadPage(url);

				this.currentItem = target;
			}

		},

		selectItem: function (item)
		{
			if (!BX.hasClass(item, "menu-item-selected"))
				BX.addClass(item, "menu-item-selected");
		},

		unselectItem: function (item)
		{
			BX.removeClass(item, "menu-item-selected");
		}
	}
</script>
