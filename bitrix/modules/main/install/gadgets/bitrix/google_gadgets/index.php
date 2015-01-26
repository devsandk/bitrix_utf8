<?php
/**
 * Bitrix Framework
 * @package bitrix
 * @subpackage main
 * @copyright 2001-2013 Bitrix
 */

/**
 * Bitrix vars
 * @global CUser $USER
 * @global CMain $APPLICATION
 * @param array $arParams
 * @param array $arGadget
 * @param string $id
 */
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

global $USER, $APPLICATION;

$rnd = rand();

if (!in_array($arParams["MODE"], array("SU", "SG")) || $USER->IsAdmin())
{
	$bCanUseCustomCode = true;
}

if(LANGUAGE_ID=='ru')
{
	$arGG = Array(
		Array("CODE"=>'<script src="http://www.gmodules.com/ig/ifr?url=http://www.gstatic.com/ig/modules/dictionary/dictionary_v2.xml&amp;up_sl=en&amp;up_tl=ru&amp;up_default_text=&amp;synd=open&amp;w=320&amp;h=200&amp;title=%D0%9F%D0%B5%D1%80%D0%B5%D0%B2%D0%BE%D0%B4%D1%87%D0%B8%D0%BA+Google&amp;lang=ru&amp;country=ALL&amp;border=%23ffffff%7C3px%2C1px+solid+%23999999&amp;output=js"></script>'),
		Array("CODE"=>'<script src="http://www.gmodules.com/ig/ifr?url=http://gadgets.sterno.ru/2day/2day.xml&amp;synd=open&amp;w=320&amp;h=310&amp;title=%D0%AD%D1%82%D0%BE%D1%82+%D0%B4%D0%B5%D0%BD%D1%8C+%D0%B2+%D0%B8%D1%81%D1%82%D0%BE%D1%80%D0%B8%D0%B8&amp;border=%23ffffff%7C3px%2C1px+solid+%23999999&amp;output=js"></script>'),
		Array("CODE"=>'<script src="http://www.gmodules.com/ig/ifr?url=http://www.labpixies.com/campaigns/converter/converter.xml&amp;up_recents=%5B%5D&amp;synd=open&amp;w=320&amp;h=226&amp;title=%D0%9A%D0%BE%D0%BD%D0%B2%D0%B5%D1%80%D1%82%D0%B0%D1%86%D0%B8%D1%8F+%D0%B8%D0%B7%D0%BC%D0%B5%D1%80%D0%B5%D0%BD%D0%B8%D0%B9&amp;lang=ru&amp;country=ALL&amp;border=%23ffffff%7C3px%2C1px+solid+%23999999&amp;output=js"></script>'),
		Array("CODE"=>'<script src="http://www.gmodules.com/ig/ifr?url=http://gadgets.sterno.ru/domodedovo/domodedovo.xml&amp;synd=open&amp;w=320&amp;h=350&amp;title=%D0%9E%D0%BD%D0%BB%D0%B0%D0%B9%D0%BD+%D1%82%D0%B0%D0%B1%D0%BB%D0%BE+%D0%94%D0%BE%D0%BC%D0%BE%D0%B4%D0%B5%D0%B4%D0%BE%D0%B2%D0%BE&amp;lang=ru&amp;country=ALL&amp;border=%23ffffff%7C3px%2C1px+solid+%23999999&amp;output=js"></script>'),
		Array("CODE"=>'<script src="http://www.gmodules.com/ig/ifr?url=http://www.google.com/ig/modules/colorjunction.xml&amp;up_difficulty=4&amp;up_size=15&amp;up_bestScores=00%3A20%7C00%3A35%7C01%3A00%7C00%3A35%7C01%3A15%7C02%3A00%7C01%3A00%7C02%3A00%7C03%3A15&amp;up_boardStyle=1&amp;up_lastScores=00%3A00%7C00%3A00%7C00%3A00%7C00%3A00%7C00%3A00%7C00%3A00%7C00%3A00%7C00%3A00%7C00%3A00&amp;synd=open&amp;w=264&amp;h=287&amp;title=ColorJunction&amp;lang=ru&amp;country=ALL&amp;border=%23ffffff%7C3px%2C1px+solid+%23999999&amp;output=js"></script>'),
		Array("CODE"=>'<script src="http://www.gmodules.com/ig/ifr?url=http://www.labpixies.com/campaigns/blackjack/blackjack.xml&amp;up_balance=1000&amp;up_loans=0&amp;up_highest=1000&amp;up_lowest=1000&amp;up_bank_rounds=0&amp;up_wins=0&amp;up_games=0&amp;up_total_bets=0&amp;up_highest_hand=0&amp;up_default_bet=10&amp;synd=open&amp;w=320&amp;h=280&amp;title=BlackJack&amp;lang=ru&amp;country=ALL&amp;border=%23ffffff%7C3px%2C1px+solid+%23999999&amp;output=js"></script>'),
		Array("CODE"=>'<script src="http://www.gmodules.com/ig/ifr?url=http://www.labpixies.com/campaigns/videopoker/videopoker.xml&amp;synd=open&amp;w=320&amp;h=260&amp;title=%D0%9F%D0%BE%D0%BA%D0%B5%D1%80&amp;lang=all&amp;country=ALL&amp;border=%23ffffff%7C3px%2C1px+solid+%23999999&amp;output=js"></script>'),
		Array("CODE"=>'<script src="http://www.gmodules.com/ig/ifr?url=http://www.labpixies.com/campaigns/minesweeper/minesweeper.xml&amp;up_Sscores=%7B%7D&amp;up_Mscores=%7B%7D&amp;up_Lscores=%7B%7D&amp;up_rank=0&amp;up_rank_counter=0&amp;up_last_board=small&amp;synd=open&amp;w=280&amp;h=360&amp;title=C%D0%B0%D0%BF%D0%B5%D1%80&amp;lang=ru&amp;country=ALL&amp;border=%23ffffff%7C3px%2C1px+solid+%23999999&amp;output=js"></script>'),
		Array("CODE"=>'<script src="http://www.gmodules.com/ig/ifr?url=http://avc-cbrf-gadget.googlecode.com/svn/trunk/cbr_chart_igoogle.xml&amp;synd=open&amp;w=242&amp;h=111&amp;title=%D0%9A%D1%83%D1%80%D1%81+%D0%B2%D0%B0%D0%BB%D1%8E%D1%82+%D0%A6%D0%91+%D0%A0%D0%A4&amp;border=%23ffffff%7C3px%2C1px+solid+%23999999&amp;output=js"></script>'),
		Array("CODE"=>'<script src="http://www.gmodules.com/ig/ifr?url=http://aruljohn.com/gadget/ip.xml&amp;synd=open&amp;w=320&amp;h=150&amp;title=%D0%92%D0%B0%D1%88+IP+%D0%B0%D0%B4%D1%80%D0%B5%D1%81&amp;border=%23ffffff%7C3px%2C1px+solid+%23999999&amp;output=js"></script>'),
	);
}
else
{
	$arGG = Array(
		Array("CODE"=>'<script src="http://www.gmodules.com/ig/ifr?url=http://hosting.gmodules.com/ig/gadgets/file/109974367101812108674/CNN.xml&amp;synd=open&amp;w=470&amp;h=440&amp;title=CNN+NEWS&amp;border=%23ffffff%7C3px%2C1px+solid+%23999999&amp;output=js"></script>'),
		Array("CODE"=>'<script src="http://www.gmodules.com/ig/ifr?url=http://humanmaze.googlepages.com/espn-sports-rss-feeds.xml&amp;up_entries=4&amp;up_summaries=100&amp;up_extrafeed=http%3A%2F%2Fsoccernet.espn.go.com%2Frss%2Fnews&amp;up_extratitle=Soccer&amp;up_subject=ESPN&amp;up_selectedTab=&amp;synd=open&amp;w=320&amp;h=300&amp;title=ESPN&amp;border=%23ffffff%7C3px%2C1px+solid+%23999999&amp;output=js"></script>'),
		Array("CODE"=>'<script src="http://www.gmodules.com/ig/ifr?url=http://www.google.com/ig/modules/colorjunction.xml&amp;up_difficulty=4&amp;up_size=15&amp;up_bestScores=00%3A20%7C00%3A35%7C01%3A00%7C00%3A35%7C01%3A15%7C02%3A00%7C01%3A00%7C02%3A00%7C03%3A15&amp;up_boardStyle=1&amp;up_lastScores=00%3A00%7C00%3A00%7C00%3A00%7C00%3A00%7C00%3A00%7C00%3A00%7C00%3A00%7C00%3A00%7C00%3A00&amp;synd=open&amp;w=264&amp;h=287&amp;title=ColorJunction&amp;lang=en&amp;country=ALL&amp;border=%23ffffff%7C3px%2C1px+solid+%23999999&amp;output=js"></script>'),
		Array("CODE"=>'<script src="http://www.gmodules.com/ig/ifr?url=http://www.labpixies.com/campaigns/blackjack/blackjack.xml&amp;up_balance=1000&amp;up_loans=0&amp;up_highest=1000&amp;up_lowest=1000&amp;up_bank_rounds=0&amp;up_wins=0&amp;up_games=0&amp;up_total_bets=0&amp;up_highest_hand=0&amp;up_default_bet=10&amp;synd=open&amp;w=320&amp;h=280&amp;title=BlackJack&amp;lang=en&amp;country=ALL&amp;border=%23ffffff%7C3px%2C1px+solid+%23999999&amp;output=js"></script>'),
		Array("CODE"=>'<script src="http://www.gmodules.com/ig/ifr?url=http://www.labpixies.com/campaigns/videopoker/videopoker.xml&amp;synd=open&amp;w=320&amp;h=260&amp;title=Poker&amp;lang=all&amp;country=ALL&amp;border=%23ffffff%7C3px%2C1px+solid+%23999999&amp;output=js"></script>'),
		Array("CODE"=>'<script src="http://www.gmodules.com/ig/ifr?url=http://www.labpixies.com/campaigns/minesweeper/minesweeper.xml&amp;up_Sscores=%7B%7D&amp;up_Mscores=%7B%7D&amp;up_Lscores=%7B%7D&amp;up_rank=0&amp;up_rank_counter=0&amp;up_last_board=small&amp;synd=open&amp;w=280&amp;h=360&amp;title=Minesweeper&amp;lang=en&amp;country=ALL&amp;border=%23ffffff%7C3px%2C1px+solid+%23999999&amp;output=js"></script>'),
		Array("CODE"=>'<script src="http://www.gmodules.com/ig/ifr?url=http://aruljohn.com/gadget/ip.xml&amp;synd=open&amp;w=320&amp;h=150&amp;title=Your+IP+Address&amp;border=%23ffffff%7C3px%2C1px+solid+%23999999&amp;output=js"></script>'),
	);
}

if($_SERVER['REQUEST_METHOD']=='POST' && $_REQUEST['gdggform']=='Y' && $_REQUEST['gdgg']==$id && $arParams["PERMISSION"]>"R" && check_bitrix_sessid())
{
	$content = str_replace(array("|script", "|/script"), array("<script", "</script"), $_POST["content"]);

	// check if the value is from predifined values
	if (!$bCanUseCustomCode)
	{
		foreach ($arGG as $arGGTmp)
		{
			if ($content == $arGGTmp["CODE"])
			{
				$arGadget["USERDATA"] = Array("content"=>$content);
				break;
			}
		}

	}
	else
		$arGadget["USERDATA"] = Array("content"=>$content);

	$arGadget["FORCE_REDIRECT"] = true;
}

$arData = $arGadget["USERDATA"];
$content = $arData["content"];

if(strlen($content)>0):

	if(preg_match('#;title=([^&]+)&#', $content, $regs))
	{
		$str = $APPLICATION->ConvertCharset(urldecode($regs[1]), "utf-8", SITE_CHARSET);
		if (
			!array_key_exists("SETTINGS", $arGadget)
			|| !is_array($arGadget["SETTINGS"])
			|| !array_key_exists("TITLE_STD", $arGadget["SETTINGS"])
			|| strlen($arGadget["SETTINGS"]["TITLE_STD"]) <= 0
		)
			$arGadget["TITLE"] = $str;
	}

?>
<div id="X<?=$rnd?>">
<?=$content;?>
</div>

<script>
function XX<?=$rnd?>()
{
	var dd = document.getElementById('X<?=$rnd?>');
	if(!dd)
		return;
	var Ee = dd.childNodes;
	for(var ei in Ee)
	{
		var e = Ee[ei];
		if(e.nodeType==1 && e.tagName.toUpperCase() == 'TABLE')
		{
			//alert(e.rows[0].cells[0].childNodes[0].innerHTML);
			e.rows[0].cells[0].style.display = 'none';
			//alert(e.rows[0].cells[0].innerHTML);
		}
	}

}

<?echo 'setTimeout("XX'.$rnd.'()", 0);'?>
</script>

<?
elseif($arParams["PERMISSION"]>"R"):

	?>
	<script>
	function Ch<?=$rnd?>(b)
	{
		var Dd = document.getElementById('Dd<?=$rnd?>');
		if(b)
		{
			Dd.style.display = 'block';
			//alert('');
			//window.open('http://www.google.com/ig/directory?synd=open&cat=all', '', '');
		}
		else
			Dd.style.display = 'none';
	}
	</script>
	<form action="?gdgg=<?=$id?>" method="post" id="gdggf<?=$id?>">
	<?=bitrix_sessid_post()?>
	<input type="hidden" name="gdggform" value="Y">
	<?
	if ($arParams["MULTIPLE"] == "Y"):
		?><input type="hidden" name="dt_page" value="<?=$arParams["DESKTOP_PAGE"]?>"><?
	endif;
	?>
	<select name="gdgglist" id="gdgglist_<?=$id?>" style="width: 100%;" onchange="if(this.value=='-')Ch<?=$rnd?>(true);else Ch<?=$rnd?>(false);">
		<option value=""><?=GetMessage("GD_GOOGLE_GADGETS_SELECT")?></option>
		<?foreach($arGG as $v):
			if(preg_match('#;title=([^&]+)&#', $v["CODE"], $regs))
				$title = $APPLICATION->ConvertCharset(urldecode($regs[1]), "utf-8", SITE_CHARSET);
			else
				$title = GetMessage("GD_GOOGLE_GADGETS_GADGET");
		?>
			<option value="<?=htmlspecialcharsbx(str_replace(array("<script", "</script"), array("|script", "|/script"), $v["CODE"]));?>"><?=htmlspecialcharsbx($title)?></option>
		<?endforeach?>
		<?if ($bCanUseCustomCode):?>
			<option value="-"><?=GetMessage("GD_GOOGLE_GADGETS_MORE")?></option>
		<?endif;?>
	</select>
	<div id="Dd<?=$rnd?>" style="display:none">
		<?if ($bCanUseCustomCode):?>
			<p><?=GetMessage("GD_GOOGLE_GADGETS_LINK")?></p>
			<?=GetMessage("GD_GOOGLE_GADGETS_HELP")?>
			<p><?=GetMessage("GD_GOOGLE_GADGETS_CODE")?></p>
			<textarea style="width:100%;" id="gdggcontentu"></textarea>
		<?endif;?>
	</div>
	<input type="hidden" name="content" id="gdggcontent_<?=$id?>" value="">
	<br>
	<a href="javascript:void(0);" onclick="return gdggsave('<?=$id?>');"><?=GetMessage("GD_GOOGLE_GADGETS_SAVE")?></a>
	</form>
	<script>
	function gdggsave(id)
	{
		var str = document.getElementById("gdgglist_" + id).value;
		if(str == '')
		{
			alert('<?=GetMessage("GD_GOOGLE_GADGETS_WARN1")?>');
			return false;
		}

		if(str == '-')
			str = document.getElementById("gdggcontentu").value;

		if(str == '')
		{
			alert('<?=GetMessage("GD_GOOGLE_GADGETS_WARN2")?>');
			return false;
		}
		str = str.replace('<script', '|script');
		str = str.replace('<'+'/script', '|/script');
		document.getElementById("gdggcontent_" + id).value = str;
		document.getElementById("gdggf" + id).submit();
		return false;
	}
	</script>
	<?

endif;
?>