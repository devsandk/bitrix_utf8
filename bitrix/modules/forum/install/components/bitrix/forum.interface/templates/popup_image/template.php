<?if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();
// ************************* Input params***************************************************************
// ************************* BASE **********************************************************************
$arParams["URL"] = trim($arParams["~URL"]);
if (empty($arParams["URL"]))
	return false;
if ($arParams["CONVERT"] == "Y")
	$arParams["URL"] = htmlspecialcharsEx($arParams["URL"]);
// *************************/BASE **********************************************************************
// ************************* ADDITIONAL ****************************************************************
$arParams["IMG_WIDTH"] = (array_key_exists("IMG_WIDTH", $arParams) ? intval($arParams["IMG_WIDTH"]) : 0);
$arParams["IMG_HEIGHT"] = (array_key_exists("IMG_HEIGHT", $arParams) ? intval($arParams["IMG_HEIGHT"]) : 0);

if (is_array($arParams["MAX_SIZE"]))
{
	$arParams["WIDTH"] = ($arParams["MAX_SIZE"]["width"] > 0 ? $arParams["MAX_SIZE"]["width"] : $arParams["MAX_SIZE"]["WIDTH"]);
	$arParams["HEIGHT"] = ($arParams["MAX_SIZE"]["height"] > 0 ? $arParams["MAX_SIZE"]["height"] : $arParams["MAX_SIZE"]["HEIGHT"]);
}
$arParams["WIDTH"] = intval($arParams["WIDTH"]);
$arParams["HEIGHT"] = intval($arParams["HEIGHT"]);
$arParams["MAX_SIZE"] = array(
	"width" => ($arParams["WIDTH"] > 0 && $arParams["WIDTH"] != $arParams["IMG_WIDTH"] ? $arParams["WIDTH"] : 0),
	"height" => ($arParams["HEIGHT"] > 0 && $arParams["HEIGHT"] != $arParams["IMG_HEIGHT"] ? $arParams["HEIGHT"] : 0));
if ($arParams["MAX_SIZE"]["width"] > 0 && $arParams["MAX_SIZE"]["height"] <= 0)
	$arParams["MAX_SIZE"]["height"] = $arParams["IMG_HEIGHT"];
else if ($arParams["MAX_SIZE"]["width"] <= 0 && $arParams["MAX_SIZE"]["height"] > 0)
	$arParams["MAX_SIZE"]["width"] = $arParams["IMG_WIDTH"];
//$arParams["HTML_SIZE"] html resize for image. This is helpful for disk space economy.
$arParams["HTML_SIZE"] = (is_array($arParams["HTML_SIZE"]) ? $arParams["HTML_SIZE"] : array("width" => $arParams["HTML_SIZE"], "height" => $arParams["HTML_SIZE"]));
$arParams["HTML_SIZE"] = array(
	"width" => intval($arParams["HTML_SIZE"]["width"] > 0 ? $arParams["HTML_SIZE"]["width"] : $arParams["HTML_SIZE"]["WIDTH"]),
	"height" => intval($arParams["HTML_SIZE"]["height"] > 0 ? $arParams["HTML_SIZE"]["height"] : $arParams["HTML_SIZE"]["HEIGHT"]));
foreach($arParams["HTML_SIZE"] as $k => $v)
	$arParams["HTML_SIZE"][$k] = ((0 < $v && $v < $arParams["MAX_SIZE"][$k]) ? $v : $arParams["MAX_SIZE"][$k]);
if ($arParams["HTML_SIZE"]["width"] > 0 && $arParams["HTML_SIZE"]["height"] <= 0)
	$arParams["HTML_SIZE"]["height"] = $arParams["IMG_HEIGHT"];
else if ($arParams["HTML_SIZE"]["width"] <= 0 && $arParams["HTML_SIZE"]["height"] > 0)
	$arParams["HTML_SIZE"]["width"] = $arParams["IMG_WIDTH"];
if ($arParams["HTML_SIZE"]["width"] <= 0 || $arParams["HTML_SIZE"]["height"] <= 0)
	$arParams["HTML_SIZE"] = false;

$arParams["SIZE"] = is_array($arParams["SIZE"]) ? $arParams["SIZE"] : array();
$arParams["SIZE"]["width"] = intval(!!$arParams["SIZE"]["width"] ? $arParams["SIZE"]["width"] : $arParams["SIZE"]["WIDTH"]);
$arParams["SIZE"]["height"] = intval(!!$arParams["SIZE"]["height"] ? $arParams["SIZE"]["height"] : $arParams["SIZE"]["HEIGHT"]);
$bExactly = ($arParams["SIZE"]["width"] > 0 && $arParams["SIZE"]["height"] > 0);

//$arParams["SIZE"] user data in img tag <img width=... height=...> Has not been realized yet.

$arParams["FAMILY"] = trim($arParams["FAMILY"]);
$arParams["FAMILY"] = strtolower(empty($arParams["FAMILY"]) ? "forum" : $arParams["FAMILY"]);
$arParams["FAMILY"] = preg_replace("/[^a-z]/is", "", $arParams["FAMILY"]);
$arParams["RETURN"] = ($arParams["RETURN"] == "Y" ? "Y" : "N");
$arParams["MODE"] = trim($arParams["MODE"]);
// *************************/ADDITIONAL ****************************************************************
// *************************/Input params***************************************************************
$img = array(
	"~src" => $arParams["URL"],
	"src_download" => $arParams["URL"].(strpos($arParams["URL"], '?') !== false ? '&' : '?')."action=download",
	"src" => $arParams["URL"].(strpos($arParams["URL"], '?') !== false ? '&' : '?').http_build_query($arParams["MAX_SIZE"]),
	"~width" => $arParams["IMG_WIDTH"],
	"width" => $arParams["IMG_WIDTH"],
	"~height" => $arParams["IMG_HEIGHT"],
	"height" => $arParams["IMG_HEIGHT"]
);
CFile::ScaleImage(
	$arParams["IMG_WIDTH"], $arParams["IMG_HEIGHT"],
	$arParams["MAX_SIZE"], BX_RESIZE_IMAGE_PROPORTIONAL,
	$bNeedCreatePicture, $arSourceSize, $arDestinationSize);
$circumscribed = $arParams["MAX_SIZE"];
if ($arParams["HTML_SIZE"])
{
	CFile::ScaleImage(
		$arParams["IMG_WIDTH"], $arParams["IMG_HEIGHT"],
		$arParams["HTML_SIZE"], BX_RESIZE_IMAGE_PROPORTIONAL,
		$bNeedCreatePicture1, $arSourceSize, $arDestinationSize1);
	if ($bNeedCreatePicture1 && ($arDestinationSize1["width"] < $arDestinationSize["width"] ||
		$arDestinationSize1["height"] < $arDestinationSize["height"]) )
	{
		$bNeedCreatePicture = true;
		$circumscribed = $arParams["HTML_SIZE"];
		$arDestinationSize = $arDestinationSize1;
	}
}
if ($bExactly)
{
	CFile::ScaleImage(
		$arParams["SIZE"]["width"], $arParams["SIZE"]["height"],
		$circumscribed, BX_RESIZE_IMAGE_PROPORTIONAL,
		$bNeedCreatePicture1, $arSourceSize, $arDestinationSize1);
	if ($bNeedCreatePicture1)
	{
		$bNeedCreatePicture = true;
		$arDestinationSize = $arDestinationSize1;
	}
}
if ($bNeedCreatePicture)
{
	$img["width"] = $arDestinationSize["width"];
	$img["height"] = $arDestinationSize["height"];
}

if ($arParams['MODE'] == 'RSS')
{
	ob_start();
	if (!$bNeedCreatePicture)
	{
		?><img src="<?=$img["src"]?>" width="<?=$img["width"]?>" height="<?=$img["height"]?>" /><?
	}
	else
	{
		?><a href="<?=$img["~src"]?>" target="_blank"><?
			?><img src="<?=$img["src"]?>" width="<?=$img["width"]?>" height="<?=$img["height"]?>" /><?
		?></a><?
	}
	$arParams["RETURN_DATA"] = ob_get_clean();
}
elseif ($arParams['MODE'] == 'SHOW2IMAGES')
{
$arParams["RETURN_DATA"] = <<<HTML
<img style="border:none;" src="{$img["src"]}" width="{$img["width"]}"
	height="{$img["height"]}"
	data-bx-viewer="image"
	data-bx-src="{$img["~src"]}"
	data-bx-download="{$img["src_download"]}"
	data-bx-width="{$img["~width"]}"
	data-bx-height="{$img["~height"]}"
	data-bx-title="{$arParams["IMG_NAME"]}"
	data-bx-size="{$arParams["IMG_SIZE"]}" />
HTML;
	$arParams["RETURN_DATA"] = str_replace(array("\n", "\t", "  "), " ", $arParams["RETURN_DATA"]);
}
else
{
	if ($arParams["HTML_SIZE"])
	{
		$arParams["WIDTH"] = $arParams["HTML_SIZE"]["width"];
		$arParams["HEIGHT"] = $arParams["HTML_SIZE"]["height"];
	}
	CUtil::InitJSCore();
	do {
		$id = "popup_".rand();
	} while(ForumGetEntity($id) !== false);

	$style = "" . ($arParams["HEIGHT"] > 0 ? "max-height:".$arParams["HEIGHT"]."px;" : "") . ($arParams["WIDTH"] > 0 ? "max-width:".$arParams["WIDTH"]."px;" : "");
	if ($style !== "")
		$style = "style=\"$style\"";
$arParams["RETURN_DATA"] = <<<HTML
<img src="{$arParams["URL"]}" id="{$id}" border="0" {$style} data-bx-viewer="image" data-bx-src="{$arParams["URL"]}" />
HTML;

	$arParams["RETURN_DATA"] = str_replace(array("\n", "\t"), "", $arParams["RETURN_DATA"]);
}
if ($arParams["RETURN"] == "Y")
	$this->__component->arParams["RETURN_DATA"] = $arParams["RETURN_DATA"];
else
	echo $arParams["RETURN_DATA"];
?>