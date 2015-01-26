<?if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();
IncludeTemplateLangFile($_SERVER["DOCUMENT_ROOT"]."/bitrix/templates/".SITE_TEMPLATE_ID."/header.php");
$wizTemplateId = COption::GetOptionString("main", "wizard_template_id", "eshop_adapt_horizontal", SITE_ID);
CUtil::InitJSCore();
CJSCore::Init(array("fx"));
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="<?=LANGUAGE_ID?>" lang="<?=LANGUAGE_ID?>">
	<head>
		<meta http-equiv="X-UA-Compatible" content="IE=edge" />
		<meta name="viewport" content="user-scalable=no, initial-scale=1.0, maximum-scale=1.0, width=device-width">
		<link rel="shortcut icon" type="image/x-icon" href="<?=SITE_DIR?>favicon.ico" />
		<link href='http://fonts.googleapis.com/css?family=Andika&subset=latin,cyrillic' rel='stylesheet' type='text/css'>
		<?$APPLICATION->SetAdditionalCSS(SITE_DIR."css/43328/reset.css");?>
		<?$APPLICATION->SetAdditionalCSS(SITE_DIR."css/43328/skeleton.css");?>
		<?$APPLICATION->SetAdditionalCSS(SITE_DIR."css/43328/superfish.css");?>
<link rel="stylesheet" href="<?=SITE_DIR?>css/43328/camera.css" type="text/css" media="screen">
		<script type="text/javascript" src="<?=SITE_DIR?>js/43328/jquery.js"></script>
	    <script type="text/javascript" src="<?=SITE_DIR?>js/43328/superfish.js"></script>
		<script type="text/javascript" src="<?=SITE_DIR?>js/43328/jquery.responsivemenu.js"></script>
		<script type="text/javascript" src="<?=SITE_DIR?>js/43328/jquery.mobilemenu.js"></script>
<script type="text/javascript" src="<?=SITE_DIR?>js/43328/jquery.easing.1.3.js"></script>
		<script type="text/javascript" src="<?=SITE_DIR?>js/43328/script.js"></script>
<script type="text/javascript" src="<?=SITE_DIR?>js/43328/camera.js"></script>
		<?$APPLICATION->ShowHead();
		/*$APPLICATION->SetAdditionalCSS(SITE_TEMPLATE_PATH.'/colors.css');*/
		/*$APPLICATION->AddHeadScript(SITE_TEMPLATE_PATH."/script.js");*/?>
		<title><?$APPLICATION->ShowTitle()?></title>
		<script type="text/javascript">
			$(document).ready(function(){
				$('.sf-menu').mobileMenu({
					'topOptionText': '<?=GetMessage("MENU_SMALL_TEXT")?>',
				});
			});
		</script>

<!--[if (gt IE 9)|!(IE)]><!-->
		    <script type="text/javascript" src="<?=SITE_DIR?>js/43328/jquery.mobile.customized.min.js"></script>
	<!--<![endif]-->
	<script>
        $(document).ready(function(){
		jQuery('.camera_wrap').camera();
        });
	</script>	

		<!--[if lt IE 8]>
			<div style=' clear: both; text-align:center; position: relative;'>
				<a href="http://windows.microsoft.com/en-US/internet-explorer/products/ie/home?ocid=ie6_countdown_bannercode">
					<img src="http://storage.ie6countdown.com/assets/100/images/banners/warning_bar_0000_us.jpg" border="0" height="42" width="820" alt="You are using an outdated browser. For a faster, safer browsing experience, upgrade for free today." />
				</a>
			</div>
		<![endif]-->
    	<!--[if lt IE 9]>
   			<script type="text/javascript" src="<?=SITE_DIR?>js/43328/html5.js"></script>
    			<link rel="stylesheet" type="text/css" media="screen" href="<?=SITE_DIR?>css/43328/ie.css">
    	<![endif]-->
	</head>
	<body>
		<div id="panel"><?$APPLICATION->ShowPanel();?></div>
		<div class="main" id="pages">
			<div class="container_12">
				<!--==============================header=================================-->
				<header>
					<div class="logo">
						<?$APPLICATION->IncludeFile(
							$APPLICATION->GetTemplatePath("include_areas/logo.php"),
							Array(),
							Array("MODE"=>"html")
						);?> 
					</div>



<div class="header_inner_container_one" align="right">
					<div class="header_inner_include_aria"><span style="color: #0868d9;">
							<strong style="display: inline-block;padding-top: 1px;"><a style="text-decoration: none;color:#1b5c79;" href="<?=SITE_DIR?>about/contacts/" itemprop = "telephone"><?$APPLICATION->IncludeComponent("bitrix:main.include", "", array("AREA_FILE_SHOW" => "file", "PATH" => SITE_DIR."include/telephone.php"), false);?></a></strong>&nbsp; &nbsp; <br />
							</span>
					</div>
				</div>


					<div class="search-nav wrapper-after">



						<div class="div-search">
							<?$APPLICATION->IncludeComponent("bitrix:search.form", "search", array(
	"PAGE" => "#SITE_DIR#search/index.php",
	"USE_SUGGEST" => "N"
	),
	false
);?>
						</div>
						<div class="clear"></div>
					    <nav>
					    	<?$APPLICATION->IncludeComponent(
	"bitrix:menu", 
	"menu-main2", 
	array(
		"ROOT_MENU_TYPE" => "top",
		"MENU_CACHE_TYPE" => "A",
		"MENU_CACHE_TIME" => "360000",
		"MENU_CACHE_USE_GROUPS" => "N",
		"MENU_CACHE_GET_VARS" => array(
		),
		"MAX_LEVEL" => "3",
		"CHILD_MENU_TYPE" => "left",
		"USE_EXT" => "Y",
		"DELAY" => "N",
		"ALLOW_MULTI_SELECT" => "N",
		"MENU_COUNT" => "6"
	),
	false
);?>
						    <div class="clear"></div>
					    </nav>
					</div>
					<div class="clear"></div>
				</header>
<!--==============================content================================-->
				<section id="content">
			
					<div class="indent-top content-2">
						<?if($APPLICATION->GetCurPage(true) != '/index.php') {?>
							<h1 class="marg-top-0"><?$APPLICATION->ShowTitle(false);?></h1>
							<?$APPLICATION->IncludeComponent("bitrix:breadcrumb", "nav", Array(
								"START_FROM" => "0",	// Номер пункта, начиная с которого будет построена навигационная цепочка
								"PATH" => "",	// Путь, для которого будет построена навигационная цепочка (по умолчанию, текущий путь)
								"SITE_ID" => "-",	// Cайт (устанавливается в случае многосайтовой версии, когда DOCUMENT_ROOT у сайтов разный)
								),
								false
							);?>
						<?}?>