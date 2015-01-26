<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();
if (!CModule::IncludeModule("blog"))
{
	ShowError(GetMessage("BLOG_MODULE_NOT_INSTALL"));
	return;
}

$arParams["ID"] = IntVal($arParams["ID"]);
$arParams["BLOG_URL"] = preg_replace("/[^a-zA-Z0-9_-]/is", "", Trim($arParams["BLOG_URL"]));
if(!is_array($arParams["GROUP_ID"]))
	$arParams["GROUP_ID"] = array($arParams["GROUP_ID"]);
foreach($arParams["GROUP_ID"] as $k=>$v)
	if(IntVal($v) <= 0)
		unset($arParams["GROUP_ID"][$k]);
		
if(strLen($arParams["BLOG_VAR"])<=0)
	$arParams["BLOG_VAR"] = "blog";
if(strLen($arParams["PAGE_VAR"])<=0)
	$arParams["PAGE_VAR"] = "page";
if(strLen($arParams["USER_VAR"])<=0)
	$arParams["USER_VAR"] = "id";
if(strLen($arParams["POST_VAR"])<=0)
	$arParams["POST_VAR"] = "id";
	
$arParams["PATH_TO_BLOG"] = trim($arParams["PATH_TO_BLOG"]);
if(strlen($arParams["PATH_TO_BLOG"])<=0)
	$arParams["PATH_TO_BLOG"] = htmlspecialcharsbx($APPLICATION->GetCurPage()."?".$arParams["PAGE_VAR"]."=blog&".$arParams["BLOG_VAR"]."=#blog#");

$arParams["PATH_TO_POST"] = trim($arParams["PATH_TO_POST"]);
if(strlen($arParams["PATH_TO_POST"])<=0)
	$arParams["PATH_TO_POST"] = htmlspecialcharsbx($APPLICATION->GetCurPage()."?".$arParams["PAGE_VAR"]."=post&".$arParams["BLOG_VAR"]."=#blog#&".$arParams["POST_VAR"]."=#post_id#");

$arParams["PATH_TO_POST_EDIT"] = trim($arParams["PATH_TO_POST_EDIT"]);
if(strlen($arParams["PATH_TO_POST_EDIT"])<=0)
	$arParams["PATH_TO_POST_EDIT"] = htmlspecialcharsbx($APPLICATION->GetCurPage()."?".$arParams["PAGE_VAR"]."=post_edit&".$arParams["BLOG_VAR"]."=#blog#&".$arParams["POST_VAR"]."=#post_id#");

$arParams["PATH_TO_USER"] = trim($arParams["PATH_TO_USER"]);
if(strlen($arParams["PATH_TO_USER"])<=0)
	$arParams["PATH_TO_USER"] = htmlspecialcharsbx($APPLICATION->GetCurPage()."?".$arParams["PAGE_VAR"]."=user&".$arParams["USER_VAR"]."=#user_id#");

$arParams["PATH_TO_DRAFT"] = trim($arParams["PATH_TO_DRAFT"]);
if(strlen($arParams["PATH_TO_DRAFT"])<=0)
	$arParams["PATH_TO_DRAFT"] = htmlspecialcharsbx($APPLICATION->GetCurPage()."?".$arParams["PAGE_VAR"]."=draft&".$arParams["BLOG_VAR"]."=#blog#");

$arParams["PATH_TO_GROUP_BLOG"] = trim($arParams["PATH_TO_GROUP_BLOG"]);
if(strlen($arParams["PATH_TO_GROUP_BLOG"])<=0)
{
	$arParams["PATH_TO_GROUP_BLOG"] = "/workgroups/group/#group_id#/blog/";
	if($arParams["MICROBLOG"])
		$arParams["PATH_TO_GROUP_BLOG"] = "/workgroups/group/#group_id#/microblog/";
}
if(strlen($arParams["PATH_TO_GROUP_POST"])<=0)
{
	$arParams["PATH_TO_GROUP_POST"] = "/workgroups/group/#group_id#/blog/#post_id#/";
	if($arParams["MICROBLOG"])
		$arParams["PATH_TO_GROUP_POST"] = "/workgroups/group/#group_id#/microblog/#post_id#/";
}
if(strlen($arParams["PATH_TO_GROUP_POST_EDIT"])<=0)
{
	$arParams["PATH_TO_GROUP_POST_EDIT"] = "/workgroups/group/#group_id#/blog/edit/#post_id#/";
	if($arParams["MICROBLOG"])
		$arParams["PATH_TO_GROUP_POST_EDIT"] = "/workgroups/group/#group_id#/microblog/edit/#post_id#/?microblog=Y";
}
if(strlen($arParams["PATH_TO_GROUP_DRAFT"])<=0)
	$arParams["PATH_TO_GROUP_DRAFT"] = "/workgroups/group/#group_id#/blog/draft/";

if(!is_array($arParams["POST_PROPERTY"]))
	$arParams["POST_PROPERTY"] = Array("UF_BLOG_POST_DOC");
else
	$arParams["POST_PROPERTY"][] = "UF_BLOG_POST_DOC";
	
$arParams["PATH_TO_SMILE"] = strlen(trim($arParams["PATH_TO_SMILE"]))<=0 ? false : trim($arParams["PATH_TO_SMILE"]);
$arParams["DATE_TIME_FORMAT"] = trim(empty($arParams["DATE_TIME_FORMAT"]) ? $DB->DateFormatToPHP(CSite::GetDateFormat("FULL")) : $arParams["DATE_TIME_FORMAT"]);

$arParams["SMILES_COUNT"] = IntVal($arParams["SMILES_COUNT"]);
if(IntVal($arParams["SMILES_COUNT"]) <= 0)
	$arParams["SMILES_COUNT"] = 5;

$arParams["ALLOW_POST_MOVE"] = ($arParams["ALLOW_POST_MOVE"] == "Y") ? "Y" : "N";

$arParams["IMAGE_MAX_WIDTH"] = IntVal($arParams["IMAGE_MAX_WIDTH"]);
$arParams["IMAGE_MAX_HEIGHT"] = IntVal($arParams["IMAGE_MAX_HEIGHT"]);

$arParams["EDITOR_RESIZABLE"] = $arParams["EDITOR_RESIZABLE"] !== "N";
$arParams["EDITOR_CODE_DEFAULT"] = $arParams["EDITOR_CODE_DEFAULT"] === "Y";
$arParams["EDITOR_DEFAULT_HEIGHT"] = intVal($arParams["EDITOR_DEFAULT_HEIGHT"]);
if(IntVal($arParams["EDITOR_DEFAULT_HEIGHT"]) <= 0)
	$arParams["EDITOR_DEFAULT_HEIGHT"] = 300;

$user_id = $USER->GetID();
$arResult["UserID"] = $user_id;
$arResult["enable_trackback"] = COption::GetOptionString("blog","enable_trackback", "Y");
$arResult["allowVideo"] = COption::GetOptionString("blog","allow_video", "Y");
$blogModulePermissions = $APPLICATION->GetGroupRight("blog");

$arParams["ALLOW_POST_CODE"] = $arParams["ALLOW_POST_CODE"] !== "N";
$arParams["USE_GOOGLE_CODE"] = $arParams["USE_GOOGLE_CODE"] === "Y";
$arParams["SEO_USE"] = ($arParams["SEO_USE"] == "Y") ? "Y" : "N";

$arResult["preview"] = (strlen($_POST["preview"]) > 0) ? "Y" : "N";

$arBlog = CBlog::GetByUrl($arParams["BLOG_URL"], $arParams["GROUP_ID"]);
if(IntVal($arParams["ID"]) > 0)
	$arResult["perms"] = CBlogPost::GetBlogUserPostPerms($arParams["ID"], $arResult["UserID"]);
else
	$arResult["perms"] = CBlog::GetBlogUserPostPerms($arBlog["ID"], $arResult["UserID"]);

if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_REQUEST['mfi_mode']) && ($_REQUEST['mfi_mode'] == "upload"))
{
	CBlogImage::AddImageResizeHandler(array("width" => 400, "height" => 400));
}

if(!empty($arBlog) && $arBlog["ACTIVE"] == "Y")
{
	$arGroup = CBlogGroup::GetByID($arBlog["GROUP_ID"]);
	if($arGroup["SITE_ID"] == SITE_ID)
	{
		$arResult["Blog"] = $arBlog;
		$arResult["urlToBlog"] = CComponentEngine::MakePathFromTemplate($arParams["PATH_TO_BLOG"], array("blog" => $arBlog["URL"], "user_id" => $arBlog["OWNER_ID"]));

		if(IntVal($arParams["ID"])>0 && $arPost = CBlogPost::GetByID($arParams["ID"]))
		{
			$arPost = CBlogTools::htmlspecialcharsExArray($arPost);
			$arResult["Post"] = $arPost;
			if($arParams["SET_TITLE"]=="Y" && !$arParams["MICROBLOG"])
				$APPLICATION->SetTitle(str_replace("#BLOG#", $arBlog["NAME"], "".GetMessage("BLOG_POST_EDIT").""));
		}
		else
		{
			$arParams["ID"] = 0;
			if($arParams["SET_TITLE"]=="Y" && !$arParams["MICROBLOG"])
				$APPLICATION->SetTitle(str_replace("#BLOG#", $arBlog["NAME"], "".GetMessage("BLOG_NEW_MESSAGE").""));
		}
		if (($arResult["perms"] >= BLOG_PERMS_MODERATE || ($arResult["perms"] >= BLOG_PERMS_PREMODERATE && ($arParams["ID"]==0 || $arPost["AUTHOR_ID"] == $arResult["UserID"]))) && (IntVal($arParams["ID"]) <= 0 || $arPost["BLOG_ID"]==$arBlog["ID"]))
		{
			if(IntVal($arParams["ID"]) > 0 && $arPost["PUBLISH_STATUS"] == BLOG_PUBLISH_STATUS_READY && $arResult["perms"] == BLOG_PERMS_PREMODERATE)
			{
				$arResult["MESSAGE"] = GetMessage("BPE_HIDDEN_POSTED");
			}

			if (($_POST["apply"] || $_POST["save"] || $_POST["do_upload"] || $_POST["draft"]) && $arResult["preview"] != "Y")
			{
				if(!check_bitrix_sessid())
					$arResult["ERROR_MESSAGE"] = GetMessage("BPE_SESS");
			}

			if ($_GET["image_upload_frame"] == "Y" || $_GET["image_upload"] || $_POST["do_upload"])
			{
				$arResult["imageUploadFrame"] = "Y";
				$arResult["imageUpload"] = "Y";
				$APPLICATION->RestartBuffer();
				header("Pragma: no-cache");

				if(check_bitrix_sessid() || strlen($_REQUEST["sessid"]) <= 0)
				{
					$arFields = Array();
					if ($_FILES["BLOG_UPLOAD_FILE"]["size"] > 0)
					{
						$arFields = array(
							"BLOG_ID"	=> $arBlog["ID"],
							"POST_ID"	=> $arParams["ID"],
							"USER_ID"	=> $arResult["UserID"],
							"=TIMESTAMP_X"	=> $DB->GetNowFunction(),
							"TITLE"		=> $_POST["IMAGE_TITLE"],
							"IMAGE_SIZE"	=> $_FILES["BLOG_UPLOAD_FILE"]["size"]
						);
						$arImage=array_merge(
							$_FILES["BLOG_UPLOAD_FILE"],
							array(
								"MODULE_ID" => "blog",
								"del" => "Y"
							)
						);
						$arFields["FILE_ID"] = $arImage;
					}
					elseif ($_POST["do_upload"] && $_FILES["FILE_ID"]["size"] > 0)
					{
						$arFields = array(
							"BLOG_ID"	=> $arBlog["ID"],
							"POST_ID"	=> $arParams["ID"],
							"USER_ID"	=> $arResult["UserID"],
							"=TIMESTAMP_X"	=> $DB->GetNowFunction(),
							"TITLE"		=> $_POST["IMAGE_TITLE"],
							"IMAGE_SIZE"	=> $_FILES["FILE_ID"]["size"],
						);
						$arImage=array_merge(
							$_FILES["FILE_ID"],
							array(
								"MODULE_ID" => "blog",
								"del" => "Y"
							)
						);
						$arFields["FILE_ID"] = $arImage;
					}
					if(!empty($arFields))
					{
						if ($imgID = CBlogImage::Add($arFields))
						{
							$aImg = CBlogImage::GetByID($imgID);
							$aImg = CBlogTools::htmlspecialcharsExArray($aImg);

							$iMaxW = 100;
							$iMaxH = 100;
							$aImg["PARAMS"] = CFile::_GetImgParams($aImg["FILE_ID"]);
							$intWidth = $aImg["PARAMS"]['WIDTH'];
							$intHeight = $aImg["PARAMS"]['HEIGHT'];
							if(
								$iMaxW > 0 && $iMaxH > 0
								&& ($intWidth > $iMaxW || $intHeight > $iMaxH)
							)
							{
								$coeff = ($intWidth/$iMaxW > $intHeight/$iMaxH? $intWidth/$iMaxW : $intHeight/$iMaxH);
								$iHeight = intval(roundEx($intHeight/$coeff));
								$iWidth = intval(roundEx($intWidth/$coeff));
							}
							else
							{
								$coeff = 1;
								$iHeight = $intHeight;
								$iWidth = $intWidth;
							}

							$file = "<img src=\"".$aImg["PARAMS"]["SRC"]."\" width=\"".$iWidth."\" height=\"".$iHeight."\" id=\"".$aImg["ID"]."\" border=\"0\" style=\"cursor:pointer\" onclick=\"InsertBlogImage('".$aImg["ID"]."', '".$aImg["PARAMS"]['WIDTH']."');\" title=\"".GetMessage("BLOG_P_INSERT")."\">";

							//$file = CFile::ShowImage($aImg["FILE_ID"], 100, 100, "id='".$aImg["ID"]."' border=0 style=cursor:pointer onclick=\"InsertBlogImage('".$aImg["ID"]."');\" title='".GetMessage("BLOG_P_INSERT")."'");
							$file = str_replace("'","\'",$file);
							$file = str_replace("\r"," ",$file);
							$file = str_replace("\n"," ",$file);
							$arResult["ImageModified"] = $file;
							$arResult["Image"] = $aImg;
						}
						else
						{
							if ($ex = $APPLICATION->GetException())
								$arResult["ERROR_MESSAGE"] = $ex->GetString();
						}
					}
				}
			}
			else
			{
				if (($_POST["apply"] || $_POST["save"]) && $arResult["preview"] != "Y" && empty($_POST["reset"])) // Save on button click
				{
					if(check_bitrix_sessid())
					{
						if(strlen($arResult["ERROR_MESSAGE"]) <= 0)
						{
							$TRACKBACK = trim($_POST["TRACKBACK"]);
							InitBVar($_POST["ENABLE_TRACKBACK"]);

							$CATEGORYtmp = Array();
							if(!empty($_POST["TAGS"]))
							{
								$dbCategory = CBlogCategory::GetList(Array(), Array("BLOG_ID" => $arBlog["ID"]));
								while($arCategory = $dbCategory->Fetch())
								{
									$arCatBlog[ToLower($arCategory["NAME"])] = $arCategory["ID"];
								}
								$tags = explode (",", $_POST["TAGS"]);
								foreach($tags as $tg)
								{
									$tg = trim($tg);
									if(!in_array($arCatBlog[ToLower($tg)], $CATEGORYtmp))
									{
										if(IntVal($arCatBlog[ToLower($tg)]) > 0)
											$CATEGORYtmp[] = $arCatBlog[ToLower($tg)];
										else
										{
											$CATEGORYtmp[] = CBlogCategory::Add(array("BLOG_ID" => $arBlog["ID"], "NAME" => $tg));
											BXClearCache(True, "/".SITE_ID."/blog/".$arBlog["URL"]."/category/");
										}
									}
								}
							}
							elseif (!empty($_POST["CATEGORY_ID"]))
							{
								foreach($_POST["CATEGORY_ID"] as $v)
								{
									if(substr($v, 0, 4) == "new_")
									{
										$CATEGORYtmp[] = CBlogCategory::Add(array("BLOG_ID"=>$arBlog["ID"],"NAME"=>substr($v, 4
	)));
										BXClearCache(True, "/".SITE_ID."/blog/".$arBlog["URL"]."/category/");
									}
									else
										$CATEGORYtmp[] = $v;
								}
							}
							else
								$CATEGORY_ID = "";
							$CATEGORY_ID = implode(",", $CATEGORYtmp);

							$DATE_PUBLISH = "";
							if(strlen($_POST["DATE_PUBLISH_DEF"]) > 0)
								$DATE_PUBLISH = $_POST["DATE_PUBLISH_DEF"];
							elseif (strlen($_POST["DATE_PUBLISH"])<=0)
								$DATE_PUBLISH = ConvertTimeStamp(time()+CTimeZone::GetOffset(), "FULL");
							else
								$DATE_PUBLISH = $_POST["DATE_PUBLISH"];

							if(strlen($_POST["draft"]) > 0 || $_POST["PUBLISH_STATUS"] == "D")
								$PUBLISH_STATUS = BLOG_PUBLISH_STATUS_DRAFT;
							elseif($arResult["perms"] == BLOG_PERMS_PREMODERATE)
								$PUBLISH_STATUS = BLOG_PUBLISH_STATUS_READY;
							elseif(strlen($_POST["PUBLISH_STATUS"]) <= 0 || $_POST["PUBLISH_STATUS"] == "P")
								$PUBLISH_STATUS = BLOG_PUBLISH_STATUS_PUBLISH;

							$arFields=array(
								"TITLE"			=> trim($_POST["POST_TITLE"]),
								"DETAIL_TEXT"		=> trim(($_POST["POST_MESSAGE_TYPE"] == "html")? $_POST["POST_MESSAGE_HTML"] : $_POST["POST_MESSAGE"]),
								"DETAIL_TEXT_TYPE"	=> "text",
								"DATE_PUBLISH"		=> $DATE_PUBLISH,
								"PUBLISH_STATUS"	=> $PUBLISH_STATUS,
								"ENABLE_TRACKBACK"	=> $_POST["ENABLE_TRACKBACK"],
								"ENABLE_COMMENTS"	=> ($_POST["ENABLE_COMMENTS"] == "N") ? "N" : "Y",
								"CATEGORY_ID"		=> $CATEGORY_ID,
								"FAVORITE_SORT" => (IntVal($_POST["FAVORITE_SORT"]) > 0) ? IntVal($_POST["FAVORITE_SORT"]) : 0,
								"ATTACH_IMG" => "",
								"PATH" => CComponentEngine::MakePathFromTemplate(htmlspecialcharsBack($arParams["PATH_TO_POST"]), array("blog" => $arBlog["URL"], "post_id" => "#post_id#", "user_id" => $arBlog["OWNER_ID"])),
								"URL" => $arBlog["URL"],
							);

							if($arParams["SEO_USE"] == "Y")
							{
								$arFields["SEO_TITLE"] = $_POST["SEO_TITLE"];
								$arFields["SEO_TAGS"] = $_POST["SEO_TAGS"];
								$arFields["SEO_DESCRIPTION"] = $_POST["SEO_DESCRIPTION"];
							}

							if($arParams["ALLOW_POST_CODE"] && strlen(trim($_POST["CODE"])) > 0)
							{
								$arFields["CODE"] = trim($_POST["CODE"]);
								$arPCFilter = array("BLOG_ID" => $arBlog["ID"], "CODE" => $arFields["CODE"]);
								if(IntVal($arParams["ID"]) > 0)
									$arPCFilter["!ID"] = $arParams["ID"];
								$db = CBlogPost::GetList(Array(), $arPCFilter, false, Array("nTopCount" => 1), Array("ID", "CODE", "BLOG_ID"));
								if($db->Fetch())
								{
									$uind = 0;
									do
									{
										$uind++;
										$arFields["CODE"] = $arFields["CODE"].$uind;
										$arPCFilter["CODE"]  = $arFields["CODE"];
										$db = CBlogPost::GetList(Array(), $arPCFilter, false, Array("nTopCount" => 1), Array("ID", "CODE", "BLOG_ID"));
									}
									while ($db->Fetch());
								}
							}
							if($_POST["POST_MESSAGE_TYPE"] == "html" && strlen($_POST["POST_MESSAGE_HTML"]) <= 0)
								$arFields["DETAIL_TEXT"] = $_POST["POST_MESSAGE"];
							if ($_POST["blog_perms"]==1)
							{
								if ($_POST["perms_p"][1] > BLOG_PERMS_READ)
									$_POST["perms_p"][1] = BLOG_PERMS_READ;
								//if ($_POST["perms_c"][1] > BLOG_PERMS_READ)
									//$_POST["perms_c"][1] = BLOG_PERMS_READ;

								$arFields["PERMS_POST"] = $_POST["perms_p"];
								$arFields["PERMS_COMMENT"] = $_POST["perms_c"];
							}
							else
							{
								$arFields["PERMS_POST"] = array();
								$arFields["PERMS_COMMENT"] = array();
							}
							if($arParams["MICROBLOG"])
							{
								$arFields["MICRO"] = "Y";
								$arFields["TITLE"] = trim(blogTextParser::killAllTags($arFields["DETAIL_TEXT"]));
								if(strlen($arFields["TITLE"]) <= 0)
									$arFields["TITLE"] = GetMessage("BLOG_EMPTY_TITLE_PLACEHOLDER");
								//$arFields["ENABLE_COMMENTS"] = "N";
							}

							if(is_array($_POST["IMAGE_ID_title"]))
							{
								foreach($_POST["IMAGE_ID_title"] as $imgID => $imgTitle)
								{
									$aImg = CBlogImage::GetByID($imgID);
									$aImg = CBlogTools::htmlspecialcharsExArray($aImg);
									if (($aImg["BLOG_ID"]==$arBlog["ID"] || $aImg["BLOG_ID"]==$arOldBlog["ID"]) && $aImg["POST_ID"]==$arParams["ID"])
									{
										if ($_POST["IMAGE_ID_del"][$imgID])
										{
											CBlogImage::Delete($imgID);
											$arFields["DETAIL_TEXT"] = str_replace("[IMG ID=$imgID]","",$arFields["DETAIL_TEXT"]);
										}
										else
										{
											CBlogImage::Update($imgID, array("TITLE"=>$imgTitle));
										}
									}
								}
							}

							$fieldName = 'UF_BLOG_POST_DOC';
							if (isset($GLOBALS[$fieldName]) && is_array($GLOBALS[$fieldName]))
							{
								$arOldFiles = array();
								if($arParams["ID"] > 0 && strlen($_POST["blog_upload_cid"]) <= 0)
								{
									$dbP = CBlogPost::GetList(array(), array("ID" => $arParams["ID"]), false, false, array("ID", "UF_BLOG_POST_DOC"));
									if($arP = $dbP->Fetch())
									{
										$arOldFiles = $arP["UF_BLOG_POST_DOC"];
									}
								}
								$arAttachedFiles = array();
								foreach($GLOBALS[$fieldName] as $fileID)
								{
									$fileID = intval($fileID);

									if ($fileID <= 0)
									{
										continue;
									}
									elseif(!is_array($_SESSION["MFI_UPLOADED_FILES_".$_POST["blog_upload_cid"]]) || !in_array($fileID, $_SESSION["MFI_UPLOADED_FILES_".$_POST["blog_upload_cid"]]))
									{
										if(empty($arOldFiles) || !in_array($fileID, $arOldFiles))
											continue;
									}

									$arFile = CFile::GetFileArray($fileID);
									if (CFile::CheckImageFile(CFile::MakeFileArray($fileID)) === null)
									{
										$arImgFields = array(
											"BLOG_ID"	=> $arBlog["ID"],
											"POST_ID"	=> 0,
											"USER_ID"	=> $arResult["UserID"],
											"=TIMESTAMP_X"	=> $DB->GetNowFunction(),
											"TITLE"		=> $arFile["FILE_NAME"],
											"IMAGE_SIZE"	=> $arFile["FILE_SIZE"],
											"FILE_ID" => $fileID,
											"IMAGE_SIZE_CHECK" => "N",
										);
										$imgID = CBlogImage::Add($arImgFields);
										if (intval($imgID) <= 0)
										{
											$GLOBALS["APPLICATION"]->ThrowException("Error Adding file by CBlogImage::Add");
										}
										else
										{
											$arFields["DETAIL_TEXT"] = str_replace("[IMG ID=".$fileID."file", "[IMG ID=".$imgID."", $arFields["DETAIL_TEXT"]);
										}
									}
									else
									{
										$arAttachedFiles[] = $fileID;
									}
								}
								$GLOBALS[$fieldName] = $arAttachedFiles;
							}

							if (count($arParams["POST_PROPERTY"]) > 0)
							{
								$GLOBALS["USER_FIELD_MANAGER"]->EditFormAddFields("BLOG_POST", $arFields);
							}

							$bAdd = false;
							if ($arParams["ID"] > 0)
							{
								$arOldPost = CBlogPost::GetByID($arParams["ID"]);
								if($_POST["apply"] && strlen($_POST["PUBLISH_STATUS"]) <= 0)
									$arFields["PUBLISH_STATUS"] = $arOldPost["PUBLISH_STATUS"];
								if(strlen($_POST["DATE_PUBLISH"]) <= 0)
									unset($arFields["DATE_PUBLISH"]);
								$newID = CBlogPost::Update($arParams["ID"], $arFields);
							}
							else
							{
								$arFields["=DATE_CREATE"] = $DB->GetNowFunction();
								$arFields["AUTHOR_ID"] = $arResult["UserID"];
								$arFields["BLOG_ID"] = $arBlog["ID"];

								if($_POST["apply"] && strlen($_POST["PUBLISH_STATUS"]) <= 0)
									$arFields["PUBLISH_STATUS"] = BLOG_PUBLISH_STATUS_DRAFT;

								$dbDuplPost = CBlogPost::GetList(array("ID" => "DESC"), array("BLOG_ID" => $arBlog["ID"]), false, array("nTopCount" => 1), array("ID", "BLOG_ID", "AUTHOR_ID", "DETAIL_TEXT", "TITLE"));
								if($arDuplPost = $dbDuplPost->Fetch())
								{
									if($arDuplPost["BLOG_ID"] == $arFields["BLOG_ID"] && IntVal($arDuplPost["AUTHOR_ID"]) == IntVal($arFields["AUTHOR_ID"]) && md5($arDuplPost["DETAIL_TEXT"]) == md5($arFields["DETAIL_TEXT"]) && md5($arDuplPost["TITLE"]) == md5($arFields["TITLE"]))
									{
										$bError = true;
										$arResult["ERROR_MESSAGE"] = GetMessage("B_B_PC_DUPLICATE_POST");
									}
								}

								if(strlen($arResult["ERROR_MESSAGE"]) <= 0)
								{
									$newID = CBlogPost::Add($arFields);
									$bAdd = true;
									$bNeedMail = false;
								}
							}
							if(IntVal($newID) > 0)
							{
								CBlogPostCategory::DeleteByPostID($newID);
								foreach($CATEGORYtmp as $v)
									CBlogPostCategory::Add(Array("BLOG_ID" => $arBlog["ID"], "POST_ID" => $newID, "CATEGORY_ID"=>$v));

								$DB->Query("UPDATE b_blog_image SET POST_ID=".$newID." WHERE BLOG_ID=".$arBlog["ID"]." AND POST_ID=0", true);

								if (strlen($TRACKBACK)>0)
								{
									$arPingUrls = explode("\n",$TRACKBACK);
									CBlogTrackback::SendPing($newID, $arPingUrls);
								}
							}

							//move/copy post to another blog
							if(IntVal($newID) > 0 && IntVal($_POST["move2blog"]) > 0 && $arParams["ALLOW_POST_MOVE"] == "Y")
							{
								if($arCopyBlog = CBlog::GetByID($_POST["move2blog"]))
								{
									$copyPerms = BLOG_PERMS_DENY;
									$copyPerms = CBlog::GetBlogUserPostPerms($arCopyBlog["ID"], $user_id);
									if($copyPerms >= BLOG_PERMS_PREMODERATE)
									{
										$arCopyPost = CBlogPost::GetByID($arParams["ID"]);
										$arCopyPost["BLOG_ID"] = $arCopyBlog["ID"];
										unset($arCopyPost["ID"]);
										unset($arCopyPost["ATTACH_IMG"]);
										unset($arCopyPost["VIEWS"]);

										$pathTemplate = htmlspecialcharsBack($arParams["PATH_TO_POST"]);
										$pathTemplateEdit = htmlspecialcharsBack($arParams["PATH_TO_POST_EDIT"]);
										$pathTemplateDraft = htmlspecialcharsBack($arParams["PATH_TO_DRAFT"]);
										$pathTemplateBlog = htmlspecialcharsBack($arParams["PATH_TO_BLOG"]);
										//take from new params
										$pathTemplate = htmlspecialcharsBack($arParams["PATH_TO_BLOG_POST"]);
										$pathTemplateEdit = htmlspecialcharsBack($arParams["PATH_TO_BLOG_POST_EDIT"]);
										$pathTemplateDraft = htmlspecialcharsBack($arParams["PATH_TO_BLOG_DRAFT"]);
										$pathTemplateBlog = htmlspecialcharsBack($arParams["PATH_TO_BLOG_BLOG"]);

										$arCopyPost["PATH"] = CComponentEngine::MakePathFromTemplate($pathTemplate, array("blog" => $arCopyBlog["URL"], "post_id" => "#post_id#", "user_id" => $arCopyBlog["OWNER_ID"]));

										$arCopyPost["PERMS_POST"] = Array();
										$arCopyPost["PERMS_COMMENT"] = Array();
										if($copyPerms == BLOG_PERMS_PREMODERATE)
											$arCopyPost["PUBLISH_STATUS"] = BLOG_PUBLISH_STATUS_READY;

										if($copyID = CBlogPost::Add($arCopyPost))
										{
											$arCopyPostUpdate = Array();
											//images
											$arCopyImg = Array();
											$arPat = Array();
											$arRep = Array();

											$arFilter = array(
												"POST_ID"=>$arParams["ID"],
												"BLOG_ID"=>$arBlog["ID"],
												"IS_COMMENT" => "N",
												);
											$res = CBlogImage::GetList(array("ID"=>"ASC"), $arFilter);
											while($arImg = $res->GetNext())
											{
												$arNewImg = Array("FILE_ID" => CFile::MakeFileArray($arImg["FILE_ID"]));
												$arNewImg["BLOG_ID"] = $arCopyBlog["ID"];
												$arNewImg["POST_ID"] = $copyID;
												$arNewImg["USER_ID"] = $arImg["USER_ID"];
												$arNewImg["=TIMESTAMP_X"] = $DB->GetNowFunction();
												$arNewImg["TITLE"] = $arImg["TITLE"];
												$arNewImg["MODULE_ID"] = "blog";

												if($imgID = CBlogImage::Add($arNewImg))
												{
													$arPat[] = "[IMG ID=".$arImg["ID"]."]";
													$arRep[] = "[IMG ID=".$imgID."]";
												}
											}
											if(!empty($arRep))
											{
												$arCopyPostUpdate["DETAIL_TEXT"] = str_replace($arPat, $arRep, $arCopyPost["DETAIL_TEXT"]);
											}

											//tags
											$arCopyCat = Array();
											$dbCategory = CBlogCategory::GetList(Array(), Array("BLOG_ID" => $arCopyBlog["ID"]));
											while($arCategory = $dbCategory->Fetch())
											{
												$arCatBlogCopy[ToLower($arCategory["NAME"])] = $arCategory["ID"];
											}

											$dbCat = CBlogPostCategory::GetList(Array("NAME" => "ASC"), Array("BLOG_ID" => $arBlog["ID"], "POST_ID" => $arParams["ID"]));
											while($arCat = $dbCat->Fetch())
											{
												if(empty($arCatBlogCopy[ToLower($arCat["NAME"])]))
													$v = CBlogCategory::Add(array("BLOG_ID" => $arCopyBlog["ID"], "NAME" => $arCat["NAME"]));
												else
													$v = $arCatBlogCopy[ToLower($arCat["NAME"])];
												CBlogPostCategory::Add(Array("BLOG_ID" => $arCopyBlog["ID"], "POST_ID" => $copyID, "CATEGORY_ID"=>$v));
												$arCopyCat[] = $v;
											}
											if(!empty($arCopyCat))
												$arCopyPostUpdate["CATEGORY_ID"] = implode(",", $arCopyCat);

											if($_POST["move2blogcopy"] == "Y")
												$arCopyPostUpdate["NUM_COMMENTS"] = 0;

											if(!empty($arCopyPostUpdate))
											{
												$copyID = CBlogPost::Update($copyID, $arCopyPostUpdate);
												$arCopyPost = CBlogPost::GetByID($copyID);
											}

											if($_POST["move2blogcopy"] != "Y")
											{
												if(CBlogPost::CanUserDeletePost($arParams["ID"], $user_id))
												{
													$dbC = CBlogComment::GetList(Array("ID" => "ASC"), Array("BLOG_ID" => $arBlog["ID"], "POST_ID" => $arParams["ID"]), false, false, Array("PATH" , "PUBLISH_STATUS" , "POST_TEXT" , "TITLE" , "DATE_CREATE" , "AUTHOR_IP1" , "AUTHOR_IP" , "AUTHOR_EMAIL" , "AUTHOR_NAME" , "AUTHOR_ID" , "PARENT_ID" , "POST_ID" , "BLOG_ID" , "ID"));
													while($arC = $dbC->Fetch())
													{
														$arCTmp = Array(
															"BLOG_ID" => $arCopyBlog["ID"],
															"POST_ID" => $copyID,
															);
														CBlogComment::Update($arC["ID"], $arCTmp);
													}
													$arFilter = array(
														"POST_ID"=>$arParams["ID"],
														"BLOG_ID"=>$arBlog["ID"],
														"IS_COMMENT" => "Y",
														);
													$res = CBlogImage::GetList(array("ID"=>"ASC"), $arFilter);
													while($arImg = $res->GetNext())
													{
														$arNewImg = Array(
																"BLOG_ID" => $arCopyBlog["ID"],
																"POST_ID" => $copyID,
															);

														CBlogImage::Update($arImg["ID"], $arNewImg);
													}

													if(!CBlogPost::Delete($arParams["ID"]))
														$arResult["ERROR_MESSAGE"] = GetMessage("BPE_COPY_DELETE_ERROR");
													else
														CBlogPost::DeleteLog($arParams["ID"], $arParams["MICROBLOG"]);
												}
											}

											BXClearCache(True, "/".SITE_ID."/blog/".$arCopyBlog["URL"]."/first_page/");
											BXClearCache(True, "/".SITE_ID."/blog/".$arCopyBlog["URL"]."/calendar/");
											BXClearCache(True, "/".SITE_ID."/blog/last_messages/");
											BXClearCache(True, "/".SITE_ID."/blog/commented_posts/");
											BXClearCache(True, "/".SITE_ID."/blog/popular_posts/");
											BXClearCache(True, "/".SITE_ID."/blog/last_comments/");
											BXClearCache(True, "/".SITE_ID."/blog/groups/".$arCopyBlog["GROUP_ID"]."/");
											BXClearCache(True, "/".SITE_ID."/blog/".$arCopyBlog["URL"]."/rss_out/");
											BXClearCache(True, "/".SITE_ID."/blog/".$arCopyBlog["URL"]."/rss_all/");
											BXClearCache(True, "/".SITE_ID."/blog/rss_sonet/");
											BXClearCache(True, "/".SITE_ID."/blog/rss_all/");
											BXClearCache(True, "/".SITE_ID."/blog/".$arCopyBlog["URL"]."/favorite/");
											BXClearCache(True, "/".SITE_ID."/blog/last_messages_list_extranet/");
											BXClearCache(True, "/".SITE_ID."/blog/last_messages_list/");
										}
										else
										{
											$arResult["ERROR_MESSAGE"] = GetMessage("BPE_COPY_ERROR");
											if($ex = $APPLICATION->GetException())
												$arResult["ERROR_MESSAGE"] .= $ex->GetString();
										}
									}
									else
										$arResult["ERROR_MESSAGE"] = GetMessage("BPE_COPY_NO_PERM");
								}
								else
									$arResult["ERROR_MESSAGE"] = GetMessage("BPE_COPY_NO_BLOG");
							}

							if(
								(
									($bAdd && $newID && $arFields["PUBLISH_STATUS"] == BLOG_PUBLISH_STATUS_PUBLISH)
									|| ($arOldPost["PUBLISH_STATUS"] != BLOG_PUBLISH_STATUS_PUBLISH && $arFields["PUBLISH_STATUS"] == BLOG_PUBLISH_STATUS_PUBLISH)
								)
								&& (
									IntVal($copyID) <= 0
									|| (IntVal($copyID) > 0 && $_POST["move2blogcopy"] == "Y")
								)
							)
							{
								$arFields["ID"] = $newID;
								$arParamsNotify = Array(
									"bSoNet" => false,
									"UserID" => $arResult["UserID"],
									"allowVideo" => $arResult["allowVideo"],
									"bGroupMode" => false,
									"PATH_TO_SMILE" => $arParams["PATH_TO_SMILE"],
									"PATH_TO_POST" => $arParams["PATH_TO_POST"],
									"user_id" => $user_id,
									"NAME_TEMPLATE" => $arParams["NAME_TEMPLATE"],
									"SHOW_LOGIN" => $arParams["SHOW_LOGIN"],
									);

								CBlogPost::Notify($arFields, $arBlog, $arParamsNotify);

								if(COption::GetOptionString("blog","send_blog_ping", "N") == "Y")
								{
									if(strlen($serverName) <= 0)
									{
										$serverName = ((defined("SITE_SERVER_NAME") && strlen(SITE_SERVER_NAME) > 0) ? SITE_SERVER_NAME : COption::GetOptionString("main", "server_name", ""));
										if (strlen($serverName) <=0)
											$serverName = $_SERVER["SERVER_NAME"];
									}

									$blogUrl = "http://".$serverName.CComponentEngine::MakePathFromTemplate(htmlspecialcharsBack($arParams["PATH_TO_BLOG"]), array("blog" => $arBlog["URL"], "user_id" => $arBlog["OWNER_ID"]));
									CBlog::SendPing($arBlog["NAME"], $blogUrl);
								}
							}

							if(IntVal($copyID) > 0 && $arCopyPost["PUBLISH_STATUS"] == BLOG_PUBLISH_STATUS_PUBLISH)
							{
								$arCopyPost["ID"] = $copyID;
								$arParamsNotify = Array(
									"bSoNet" => false,
									"UserID" => $arResult["UserID"],
									"allowVideo" => $arResult["allowVideo"],
									"bGroupMode" => false,
									"PATH_TO_SMILE" => $arParams["PATH_TO_SMILE"],
									"PATH_TO_POST" => $pathTemplate,
									"user_id" => $user_id,
									"MICROBLOG" => ($arParams["MICROBLOG"]) ? "Y" : "N",
									);

								CBlogPost::Notify($arCopyPost, $arCopyBlog, $arParamsNotify);

								if(COption::GetOptionString("blog","send_blog_ping", "N") == "Y")
								{
									if(strlen($serverName) <= 0)
									{
										$serverName = ((defined("SITE_SERVER_NAME") && strlen(SITE_SERVER_NAME) > 0) ? SITE_SERVER_NAME : COption::GetOptionString("main", "server_name", ""));
										if (strlen($serverName) <=0)
											$serverName = $_SERVER["SERVER_NAME"];
									}

									$blogUrl = "http://".$serverName.CComponentEngine::MakePathFromTemplate($pathTemplateBlog, array("blog" => $arCopyBlog["URL"], "user_id" => $arCopyBlog["OWNER_ID"]));
									CBlog::SendPing($arCopyBlog["NAME"], $blogUrl);
								}
							}

							if ($newID > 0 && strlen($arResult["ERROR_MESSAGE"]) <= 0) // Record saved successfully
							{
								$arParams["ID"] = $newID;

								BXClearCache(True, "/".SITE_ID."/blog/".$arBlog["URL"]."/first_page/");
								BXClearCache(True, "/".SITE_ID."/blog/".$arBlog["URL"]."/calendar/");
								BXClearCache(True, "/".SITE_ID."/blog/last_messages/");
								BXClearCache(True, "/".SITE_ID."/blog/commented_posts/");
								BXClearCache(True, "/".SITE_ID."/blog/popular_posts/");
								BXClearCache(True, "/".SITE_ID."/blog/last_comments/");
								BXClearCache(True, "/".SITE_ID."/blog/groups/".$arBlog["GROUP_ID"]."/");
								BXClearCache(True, "/".SITE_ID."/blog/".$arBlog["URL"]."/rss_out/");
								BXClearCache(True, "/".SITE_ID."/blog/".$arBlog["URL"]."/rss_all/");
								BXClearCache(True, "/".SITE_ID."/blog/rss_sonet/");
								BXClearCache(True, "/".SITE_ID."/blog/rss_all/");
								BXClearCache(True, "/".SITE_ID."/blog/".$arBlog["URL"]."/favorite/");
								BXClearCache(True, "/".SITE_ID."/blog/last_messages_list_extranet/");
								BXClearCache(True, "/".SITE_ID."/blog/last_messages_list/");
								BXClearCache(True, "/".SITE_ID."/blog/".$arBlog["URL"]."/comment/".$arParams["ID"]."/");
								BXClearCache(True, "/".SITE_ID."/blog/".$arBlog["URL"]."/trackback/".$arParams["ID"]."/");
								BXClearCache(True, "/".SITE_ID."/blog/".$arBlog["URL"]."/post/".$arParams["ID"]."/");

								if(IntVal($copyID) > 0 && $_POST["move2blogcopy"] != "Y")
								{
									if (strlen($_POST["apply"])<=0)
									{
										if($arCopyPost["PUBLISH_STATUS"] == BLOG_PUBLISH_STATUS_DRAFT || strlen($_POST["draft"]) > 0)
											$redirectUrl = CComponentEngine::MakePathFromTemplate($pathTemplateDraft, array("blog" => $arCopyBlog["URL"], "user_id" => $arCopyBlog["OWNER_ID"]));
										elseif($arCopyPost["PUBLISH_STATUS"] == BLOG_PUBLISH_STATUS_READY)
											$redirectUrl = CComponentEngine::MakePathFromTemplate($pathTemplateEdit, array("blog" => $arCopyBlog["URL"], "post_id" => $copyID, "user_id" => $arCopyBlog["OWNER_ID"]));
										else
											$redirectUrl = CComponentEngine::MakePathFromTemplate($pathTemplateBlog, array("blog" => $arCopyBlog["URL"], "user_id" => $arCopyBlog["OWNER_ID"]));
									}
									else
										$redirectUrl = CComponentEngine::MakePathFromTemplate($pathTemplateEdit, array("blog" => $arCopyBlog["URL"], "post_id" => $copyID, "user_id" => $arCopyBlog["OWNER_ID"]));
								}
								else
								{
									if (strlen($_POST["apply"])<=0)
									{
										if($arFields["PUBLISH_STATUS"] == BLOG_PUBLISH_STATUS_DRAFT || strlen($_POST["draft"]) > 0)
											$redirectUrl = CComponentEngine::MakePathFromTemplate($arParams["PATH_TO_DRAFT"], array("blog" => $arBlog["URL"], "user_id" => $arBlog["OWNER_ID"]));
										elseif($arFields["PUBLISH_STATUS"] == BLOG_PUBLISH_STATUS_READY)
											$redirectUrl = CComponentEngine::MakePathFromTemplate($arParams["PATH_TO_POST_EDIT"], array("blog" => $arBlog["URL"], "post_id"=>$newID, "user_id" => $arBlog["OWNER_ID"]));
										else
										{
											$redirectUrl = CComponentEngine::MakePathFromTemplate($arParams["PATH_TO_BLOG"], array("blog" => $arBlog["URL"], "user_id" => $arBlog["OWNER_ID"]));
										}
									}
									else
										$redirectUrl = CComponentEngine::MakePathFromTemplate($arParams["PATH_TO_POST_EDIT"], array("blog" => $arBlog["URL"], "post_id"=>$newID, "user_id" => $arBlog["OWNER_ID"]));
								}
								$as = new CAutoSave();
								LocalRedirect($redirectUrl);
							}
							else
							{
								if(strlen($arResult["ERROR_MESSAGE"]) <= 0)
								{
									if ($ex = $APPLICATION->GetException())
										$arResult["ERROR_MESSAGE"] = $ex->GetString()."<br />";
									else
										$arResult["ERROR_MESSAGE"] = "Error saving data to database.<br />";
								}
							}
						}
					}
					else
						$arResult["ERROR_MESSAGE"] = GetMessage("BPE_SESS");
				}
				elseif($_POST["reset"])
				{
					if($arFields["PUBLISH_STATUS"] == BLOG_PUBLISH_STATUS_DRAFT)
						LocalRedirect(CComponentEngine::MakePathFromTemplate($arParams["PATH_TO_DRAFT"], array("blog" => $arBlog["URL"], "user_id" => $arBlog["OWNER_ID"])));
					else
					{
						LocalRedirect(CComponentEngine::MakePathFromTemplate($arParams["PATH_TO_BLOG"], array("blog" => $arBlog["URL"], "user_id" => $arBlog["OWNER_ID"])));
					}
				}

				if ($arParams["ID"] > 0 && strlen($arResult["ERROR_MESSAGE"])<=0 && $arResult["preview"] != "Y") // Edit post
				{
					$arResult["PostToShow"]["TITLE"] = $arPost["TITLE"];
					$arResult["PostToShow"]["DETAIL_TEXT"] = $arPost["DETAIL_TEXT"];
					$arResult["PostToShow"]["~DETAIL_TEXT"] = $arPost["~DETAIL_TEXT"];
					$arResult["PostToShow"]["DETAIL_TEXT_TYPE"] = $arPost["DETAIL_TEXT_TYPE"];
					$arResult["PostToShow"]["PUBLISH_STATUS"] = $arPost["PUBLISH_STATUS"];
					$arResult["PostToShow"]["ENABLE_TRACKBACK"] = $arPost["ENABLE_TRACKBACK"] == "Y";
					$arResult["PostToShow"]["ENABLE_COMMENTS"] = $arPost["ENABLE_COMMENTS"];
					$arResult["PostToShow"]["ATTACH_IMG"] = $arPost["ATTACH_IMG"];
					$arResult["PostToShow"]["DATE_PUBLISH"] = $arPost["DATE_PUBLISH"];
					$arResult["PostToShow"]["CATEGORY_ID"] = $arPost["CATEGORY_ID"];
					$arResult["PostToShow"]["FAVORITE_SORT"] = $arPost["FAVORITE_SORT"];
					if($arParams["ALLOW_POST_CODE"])
					{
						$arResult["PostToShow"]["CODE"] = $arPost["CODE"];
					}
					if($arParams["SEO_USE"] == "Y")
					{
						$arResult["PostToShow"]["SEO_TITLE"] = $arPost["SEO_TITLE"];
						$arResult["PostToShow"]["SEO_TAGS"] = $arPost["SEO_TAGS"];
						$arResult["PostToShow"]["SEO_DESCRIPTION"] = $arPost["SEO_DESCRIPTION"];
					}


					$res = CBlogUserGroupPerms::GetList(array("ID"=>"DESC"),array("BLOG_ID"=>$arBlog["ID"],"POST_ID"=>$arParams["ID"]));
					while($arPerms = $res->Fetch())
					{
						if ($arPerms["AUTOSET"]=="N")
							$arResult["PostToShow"]["ExtendedPerms"] = "Y";
						if ($arPerms["PERMS_TYPE"]=="P")
							$arResult["PostToShow"]["arUGperms_p"][$arPerms["USER_GROUP_ID"]] = $arPerms["PERMS"];
						elseif ($arPerms["PERMS_TYPE"]=="C")
							$arResult["PostToShow"]["arUGperms_c"][$arPerms["USER_GROUP_ID"]] = $arPerms["PERMS"];
					}

					if($arParams["ALLOW_POST_MOVE"] == "Y")
					{
						//copy or move post to another blog
						if($USER->IsAdmin() || $blogModulePermissions >= "W")
						{
							$arFlt = Array(
									"ACTIVE" => "Y",
									"GROUP_SITE_ID" => SITE_ID,
									"!ID" => $arBlog["ID"],
								);

							$dbBlog = CBlog::GetList(Array("NAME" => "ASC"), $arFlt, false, false, array("ID", "NAME", "OWNER_ID", "URL", "GROUP_ID", "GROUP_NAME"));
							while($arBlogS = $dbBlog->GetNext())
							{
								$arBlogS["PERMS"] = BLOG_PERMS_FULL;
								$arResult["avBlog"][$arBlogS["ID"]] = $arBlogS;
							}
						}
						else
						{
							$arFlt = Array(
									"USE_SOCNET" => "N",
									">=PERMS" => BLOG_PERMS_PREMODERATE,
									"PERMS_TYPE" => BLOG_PERMS_POST,
									"PERMS_USER_ID" => $user_id,
									"PERMS_POST_ID" => false,
									"ACTIVE" => "Y",
									"GROUP_SITE_ID" => SITE_ID,
									"!ID" => $arBlog["ID"],
								);

							$dbBlog = CBlog::GetList(Array("NAME" => "ASC"), $arFlt, false, false, array("ID", "NAME", "OWNER_ID", "URL", "PERMS", "GROUP_ID", "GROUP_NAME"));
							while($arBlogS = $dbBlog->GetNext())
							{
								$arBlogS["USE_SOCNET"] = "N";
								$arResult["avBlog"][$arBlogS["ID"]] = $arBlogS;
							}
							$arFlt = Array(
									"OWNER_ID" => $user_id,
									"ACTIVE" => "Y",
									"GROUP_SITE_ID" => SITE_ID,
									"!ID" => $arBlog["ID"],
								);

							$dbBlog = CBlog::GetList(Array("NAME" => "ASC"), $arFlt, false, false, array("ID", "NAME", "OWNER_ID", "URL", "GROUP_ID", "GROUP_NAME"));
							while($arBlogS = $dbBlog->GetNext())
							{
								$arBlogS["PERMS"] = BLOG_PERMS_FULL;
								$arResult["avBlog"][$arBlogS["ID"]] = $arBlogS;
							}
						}
						foreach($arResult["avBlog"] as $id => $blog)
						{
							$arResult["avBlogCategory"]["users_".$blog["GROUP_ID"]][$id] = $blog;
						}
					}
				}
				else
				{
					$arResult["PostToShow"]["TITLE"] = htmlspecialcharsEx($_POST["POST_TITLE"]);
					$arResult["PostToShow"]["CATEGORY_ID"] = $_POST["CATEGORY_ID"];
					$arResult["PostToShow"]["CategoryText"] = htmlspecialcharsEx($_POST["TAGS"]);
					$arResult["PostToShow"]["DETAIL_TEXT_TYPE"] = htmlspecialcharsEx($_POST["POST_MESSAGE_TYPE"]);
					$arResult["PostToShow"]["DETAIL_TEXT"] = (($_POST["POST_MESSAGE_TYPE"] == "html")? $_POST["POST_MESSAGE_HTML"] : htmlspecialcharsEx($_POST["POST_MESSAGE"]));
					$arResult["PostToShow"]["~DETAIL_TEXT"] = (($_POST["POST_MESSAGE_TYPE"] == "html")? $_POST["POST_MESSAGE_HTML"] : $_POST["POST_MESSAGE"]);
					$arResult["PostToShow"]["PUBLISH_STATUS"] = htmlspecialcharsEx($_POST["PUBLISH_STATUS"]);
					$arResult["PostToShow"]["ENABLE_TRACKBACK"] = htmlspecialcharsEx($_POST["ENABLE_TRACKBACK"]);
					$arResult["PostToShow"]["ENABLE_COMMENTS"] = htmlspecialcharsEx($_POST["ENABLE_COMMENTS"]);
					$arResult["PostToShow"]["TRACKBACK"] = htmlspecialcharsEx($_POST["TRACKBACK"]);
					$arResult["PostToShow"]["DATE_PUBLISH"] = $_POST["DATE_PUBLISH"] ? htmlspecialcharsEx($_POST["DATE_PUBLISH"]) : ConvertTimeStamp(time()+CTimeZone::GetOffset(),"FULL");
					$arResult["PostToShow"]["FAVORITE_SORT"] = htmlspecialcharsEx($_POST["FAVORITE_SORT"]);
					if($_POST["POST_MESSAGE_TYPE"] == "html" && strlen($_POST["POST_MESSAGE_HTML"]) <= 0)
					{
						$arResult["PostToShow"]["DETAIL_TEXT"] = htmlspecialcharsEx($_POST["POST_MESSAGE"]);
						$arResult["PostToShow"]["~DETAIL_TEXT"] = $_POST["POST_MESSAGE"];
					}

					if($arParams["ALLOW_POST_CODE"])
					{
						$arResult["PostToShow"]["CODE"] = htmlspecialcharsEx($_POST["CODE"]);
					}
					if($arParams["SEO_USE"] == "Y")
					{
						$arResult["PostToShow"]["SEO_TITLE"] = htmlspecialcharsEx($_POST["SEO_TITLE"]);
						$arResult["PostToShow"]["SEO_TAGS"] = htmlspecialcharsEx($_POST["SEO_TAGS"]);
						$arResult["PostToShow"]["SEO_DESCRIPTION"] = htmlspecialcharsEx($_POST["SEO_DESCRIPTION"]);
					}

					if ($_POST["apply"] || $_POST["save"] || $arResult["preview"] == "Y")
					{
						$arResult["PostToShow"]["arUGperms_p"] = $_POST["perms_p"];
						$arResult["PostToShow"]["arUGperms_c"] = $_POST["perms_c"];
						$arResult["PostToShow"]["ExtendedPerms"] = (IntVal($_POST["blog_perms"])==1 ? "Y" : "N");
					}
					else
					{
						$res = CBlogUserGroupPerms::GetList(array("ID"=>"DESC"),array("BLOG_ID"=>$arBlog["ID"],"POST_ID"=>0));
						while($arPerms = $res->Fetch())
						{
							if ($arPerms["PERMS_TYPE"]=="P")
								$arResult["PostToShow"]["arUGperms_p"][$arPerms["USER_GROUP_ID"]] = $arPerms["PERMS"];
							elseif ($arPerms["PERMS_TYPE"]=="C")
								$arResult["PostToShow"]["arUGperms_c"][$arPerms["USER_GROUP_ID"]] = $arPerms["PERMS"];
						}
					}
				}
				$arResult["BLOG_POST_PERMS"] = $GLOBALS["AR_BLOG_POST_PERMS"];
				$arResult["BLOG_COMMENT_PERMS"] = $GLOBALS["AR_BLOG_COMMENT_PERMS"];

				if(!$USER->IsAdmin() && $blogModulePermissions < "W")
				{
					$arResult["post_everyone_max_rights"] = COption::GetOptionString("blog", "post_everyone_max_rights", "");
					$arResult["comment_everyone_max_rights"] = COption::GetOptionString("blog", "comment_everyone_max_rights", "");
					$arResult["post_auth_user_max_rights"] = COption::GetOptionString("blog", "post_auth_user_max_rights", "");
					$arResult["comment_auth_user_max_rights"] = COption::GetOptionString("blog", "comment_auth_user_max_rights", "");
					$arResult["post_group_user_max_rights"] = COption::GetOptionString("blog", "post_group_user_max_rights", "");
					$arResult["comment_group_user_max_rights"] = COption::GetOptionString("blog", "comment_group_user_max_rights", "");

					foreach($arResult["BLOG_POST_PERMS"] as  $v)
					{
						if(strlen($arResult["post_everyone_max_rights"]) > 0 && $v <= $arResult["post_everyone_max_rights"])
							$arResult["ar_post_everyone_rights"][] = $v;
						if(strlen($arResult["post_auth_user_max_rights"]) > 0 && $v <= $arResult["post_auth_user_max_rights"])
							$arResult["ar_post_auth_user_rights"][] = $v;
						if(strlen($arResult["post_group_user_max_rights"]) > 0 && $v <= $arResult["post_group_user_max_rights"])
							$arResult["ar_post_group_user_rights"][] = $v;

					}

					foreach($arResult["BLOG_COMMENT_PERMS"] as  $v)
					{
						if(strlen($arResult["comment_everyone_max_rights"]) > 0 && $v <= $arResult["comment_everyone_max_rights"])
							$arResult["ar_comment_everyone_rights"][] = $v;
						if(strlen($arResult["comment_auth_user_max_rights"]) > 0 && $v <= $arResult["comment_auth_user_max_rights"])
							$arResult["ar_comment_auth_user_rights"][] = $v;
						if(strlen($arResult["comment_group_user_max_rights"]) > 0 && $v <= $arResult["comment_group_user_max_rights"])
							$arResult["ar_comment_group_user_rights"][] = $v;
					}
				}

				$arResult["UserGroups"] = array();
				$res = CBlogUserGroup::GetList(array(),$arFilter=array("BLOG_ID"=>$arBlog["ID"]));
				while ($aUGroup = $res->GetNext())
					$arResult["UserGroups"][] = $aUGroup;

				$arSelectFields = array("ID", "SMILE_TYPE", "TYPING", "IMAGE", "DESCRIPTION", "CLICKABLE", "SORT", "IMAGE_WIDTH", "IMAGE_HEIGHT", "LANG_NAME");
				$total = 0;
				$arSmiles = array();
				$res = CBlogSmile::GetList(array("SORT"=>"ASC","ID"=>"DESC"), array("SMILE_TYPE"=>"S", "LANG_LID"=>LANGUAGE_ID), false, false, $arSelectFields);
				while ($arr = $res->GetNext())
				{
					$total++;
					list($type)=explode(" ",$arr["TYPING"]);
					$arr["TYPE"]=str_replace("'","\'",$type);
					$arr["TYPE"]=str_replace("\\","\\\\",$arr["TYPE"]);
					$arSmiles[] = $arr;
				}
				$arResult["Smiles"] = $arSmiles;
				$arResult["SmilesCount"] = $total;

				$arResult["Images"] = Array();
				if(!empty($arBlog))
				{
					$arFilter = array(
							"POST_ID" => $arParams["ID"],
							"BLOG_ID" => $arBlog["ID"],
							"IS_COMMENT" => "N",
						);
					if ($arParams["ID"]==0)
						$arFilter["USER_ID"] = $arResult["UserID"];

					$iMaxW = 100;
					$iMaxH = 100;
					$res = CBlogImage::GetList(array("ID"=>"ASC"), $arFilter);
					while($aImg = $res->GetNext())
					{
						$aImg["PARAMS"] = CFile::_GetImgParams($aImg["FILE_ID"]);
						$intWidth = $aImg["PARAMS"]['WIDTH'];
						$intHeight = $aImg["PARAMS"]['HEIGHT'];
						if(
							$iMaxW > 0 && $iMaxH > 0
							&& ($intWidth > $iMaxW || $intHeight > $iMaxH)
						)
						{
							$coeff = ($intWidth/$iMaxW > $intHeight/$iMaxH? $intWidth/$iMaxW : $intHeight/$iMaxH);
							$iHeight = intval(roundEx($intHeight/$coeff));
							$iWidth = intval(roundEx($intWidth/$coeff));
						}
						else
						{
							$coeff = 1;
							$iHeight = $intHeight;
							$iWidth = $intWidth;
						}

						$aImg["FileShow"] = "<img src=\"".$aImg["PARAMS"]["SRC"]."\" width=\"".$iWidth."\" height=\"".$iHeight."\" id=\"".$aImg["ID"]."\" border=\"0\" style=\"cursor:pointer\" onclick=\"InsertBlogImage('".$aImg["ID"]."', '".$aImg["PARAMS"]['WIDTH']."');\" title=\"".GetMessage("BLOG_P_INSERT")."\">";
						$arResult["Images"][] = $aImg;
					}
				}

				if(strpos($arResult["PostToShow"]["CATEGORY_ID"], ",")!==false)
					$arResult["PostToShow"]["CATEGORY_ID"] = explode(",", trim($arResult["PostToShow"]["CATEGORY_ID"]));

				$arResult["Category"] = Array();


				if(strlen($arResult["PostToShow"]["CategoryText"]) <= 0)
				{
					$res = CBlogCategory::GetList(array("NAME"=>"ASC"),array("BLOG_ID"=>$arBlog["ID"]));
					while ($arCategory=$res->GetNext())
					{
						if(is_array($arResult["PostToShow"]["CATEGORY_ID"]))
						{
							if(in_array($arCategory["ID"], $arResult["PostToShow"]["CATEGORY_ID"]))
								$arCategory["Selected"] = "Y";
						}
						else
						{
							if(IntVal($arCategory["ID"])==IntVal($arResult["PostToShow"]["CATEGORY_ID"]))
								$arCategory["Selected"] = "Y";
						}
						if($arCategory["Selected"] == "Y")
							$arResult["PostToShow"]["CategoryText"] .= $arCategory["~NAME"].", ";

						$arResult["Category"][$arCategory["ID"]] = $arCategory;
					}
					$arResult["PostToShow"]["CategoryText"] = substr($arResult["PostToShow"]["CategoryText"], 0, strlen($arResult["PostToShow"]["CategoryText"])-2);
				}

				$arResult["POST_PROPERTIES"] = array("SHOW" => "N");

				if (!empty($arParams["POST_PROPERTY"]))
				{
					$arPostFields = $GLOBALS["USER_FIELD_MANAGER"]->GetUserFields("BLOG_POST", $arParams["ID"], LANGUAGE_ID);

					if (count($arParams["POST_PROPERTY"]) > 0)
					{
						foreach ($arPostFields as $FIELD_NAME => $arPostField)
						{
							if (!in_array($FIELD_NAME, $arParams["POST_PROPERTY"]))
								continue;
							$arPostField["EDIT_FORM_LABEL"] = strLen($arPostField["EDIT_FORM_LABEL"]) > 0 ? $arPostField["EDIT_FORM_LABEL"] : $arPostField["FIELD_NAME"];
							$arPostField["EDIT_FORM_LABEL"] = htmlspecialcharsEx($arPostField["EDIT_FORM_LABEL"]);
							$arPostField["~EDIT_FORM_LABEL"] = $arPostField["EDIT_FORM_LABEL"];
							if(strlen($arResult["ERROR_MESSAGE"]) > 0 && !empty($_POST[$FIELD_NAME]))
							{
								$arPostField["VALUE"] = $_POST[$FIELD_NAME];
							}
							$arResult["POST_PROPERTIES"]["DATA"][$FIELD_NAME] = $arPostField;
				}
					}
					if (!empty($arResult["POST_PROPERTIES"]["DATA"]))
						$arResult["POST_PROPERTIES"]["SHOW"] = "Y";
				}

				$arResult["CUR_PAGE"] = urlencode($APPLICATION->GetCurPageParam());

				$serverName = "";
				$serverName = ((defined("SITE_SERVER_NAME") && strlen(SITE_SERVER_NAME) > 0) ? SITE_SERVER_NAME : COption::GetOptionString("main", "server_name", ""));
				if (strLen($serverName) <=0)
					$serverName = $_SERVER["HTTP_HOST"];
				$serverName = "http://".$serverName;

				$arResult["PATH_TO_POST"] = CComponentEngine::MakePathFromTemplate(htmlspecialcharsBack($arParams["PATH_TO_POST"]), array("blog" => $arBlog["URL"], "post_id" => "#post_id#", "user_id" => $arBlog["OWNER_ID"]));
				$arResult["PATH_TO_POST1"] = $serverName.substr($arResult["PATH_TO_POST"], 0, strpos($arResult["PATH_TO_POST"], "#post_id#"));
				$arResult["PATH_TO_POST2"] = substr($arResult["PATH_TO_POST"], strpos($arResult["PATH_TO_POST"], "#post_id#") + strlen("#post_id#"));

				if($arResult["preview"] == "Y")
				{
					if(check_bitrix_sessid())
					{
						$arResult["postPreview"]["TITLE"] = $arResult["PostToShow"]["TITLE"];
						$arResult["postPreview"]["CATEGORY_ID"] = $arResult["PostToShow"]["CATEGORY_ID"];
						$arResult["postPreview"]["DETAIL_TEXT"] = (($_POST["POST_MESSAGE_TYPE"] == "html")? $_POST["POST_MESSAGE_HTML"] : ($_POST["POST_MESSAGE"]));
						$arResult["postPreview"]["POST_MESSAGE_TYPE"] = htmlspecialcharsEx($_POST["POST_MESSAGE_TYPE"]);
						$arResult["postPreview"]["DATE_PUBLISH"] = $arResult["PostToShow"]["DATE_PUBLISH"];
						$arResult["postPreview"]["DATE_PUBLISH_FORMATED"] = FormatDate($arParams["DATE_TIME_FORMAT"], MakeTimeStamp($arResult["postPreview"]["DATE_PUBLISH"], CSite::GetDateFormat("FULL")));
						$arResult["postPreview"]["DATE_PUBLISH_DATE"] = ConvertDateTime($arResult["postPreview"]["DATE_PUBLISH"], FORMAT_DATE);
						$arResult["postPreview"]["DATE_PUBLISH_TIME"] = ConvertDateTime($arResult["postPreview"]["DATE_PUBLISH"], "HH:MI");
						$arResult["postPreview"]["DATE_PUBLISH_D"] = ConvertDateTime($arResult["postPreview"]["DATE_PUBLISH"], "DD");
						$arResult["postPreview"]["DATE_PUBLISH_M"] = ConvertDateTime($arResult["postPreview"]["DATE_PUBLISH"], "MM");
						$arResult["postPreview"]["DATE_PUBLISH_Y"] = ConvertDateTime($arResult["postPreview"]["DATE_PUBLISH"], "YYYY");
						$arResult["postPreview"]["FAVORITE_SORT"] = htmlspecialcharsEx($arResult["FAVORITE_SORT"]);
						if($_POST["POST_MESSAGE_TYPE"] == "html" && strlen($_POST["POST_MESSAGE_HTML"]) <= 0)
						{
							$arResult["postPreview"]["DETAIL_TEXT"] = htmlspecialcharsEx($_POST["POST_MESSAGE"]);
							$arResult["postPreview"]["~DETAIL_TEXT"] = $_POST["POST_MESSAGE"];
						}

						if (!empty($_POST["CATEGORY_ID"]))
						{
							foreach($_POST["CATEGORY_ID"] as $v)
							{

								if(substr($v, 0, 4) == "new_")
									$arResult["Category"][$v] = Array("ID" => $v, "NAME" => substr($v, 4), "Selected" => "Y");
							}
						}

						$p = new blogTextParser(false, $arParams["PATH_TO_SMILE"]);
						$arParserParams = Array(
							"imageWidth" => $arParams["IMAGE_MAX_WIDTH"],
							"imageHeight" => $arParams["IMAGE_MAX_HEIGHT"],
						);

						$res = CBlogImage::GetList(array("ID"=>"ASC"),array("POST_ID"=>$arPost['ID'], "BLOG_ID"=>$arBlog['ID'], "IS_COMMENT" => "N"));
						while ($arImage = $res->Fetch())
							$arImages[$arImage['ID']] = $arImage['FILE_ID'];

						if($arResult["postPreview"]["POST_MESSAGE_TYPE"] == "html" && $arResult["allowHTML"] == "Y")
						{
							$arAllow = array("HTML" => "Y", "ANCHOR" => "Y", "IMG" => "Y", "SMILES" => "Y", "NL2BR" => "N", "VIDEO" => "Y", "QUOTE" => "Y", "CODE" => "Y");
							if($arResult["allowVideo"] != "Y")
								$arAllow["VIDEO"] = "N";

							$arResult["postPreview"]["textFormated"] = $p->convert($arResult["postPreview"]["~DETAIL_TEXT"], false, $arImages, $arAllow, $arParserParams);
						}
						else
						{
							$arAllow = array("HTML" => "N", "ANCHOR" => "Y", "BIU" => "Y", "IMG" => "Y", "QUOTE" => "Y", "CODE" => "Y", "FONT" => "Y", "LIST" => "Y", "SMILES" => "Y", "NL2BR" => "N", "VIDEO" => "Y");
							if($arResult["allowVideo"] != "Y")
								$arAllow["VIDEO"] = "N";
							$arResult["postPreview"]["textFormated"] = $p->convert($arResult["postPreview"]["DETAIL_TEXT"], false, $arImages, $arAllow, $arParserParams);
						}
						$arResult["postPreview"]["BlogUser"] = CBlogUser::GetByID($arResult["UserID"], BLOG_BY_USER_ID);
						$arResult["postPreview"]["BlogUser"] = CBlogTools::htmlspecialcharsExArray($arResult["postPreview"]["BlogUser"]);
						$dbUser = CUser::GetByID($arResult["UserID"]);
						$arResult["postPreview"]["arUser"] = $dbUser->GetNext();
						$arResult["postPreview"]["AuthorName"] = CBlogUser::GetUserName($arResult["postPreview"]["BlogUser"]["ALIAS"], $arResult["postPreview"]["arUser"]["NAME"], $arResult["postPreview"]["arUser"]["LAST_NAME"], $arResult["postPreview"]["arUser"]["LOGIN"]);

						$arResult["postPreview"]["BlogUser"]["AVATAR_file"] = CFile::GetFileArray($arResult["postPreview"]["BlogUser"]["AVATAR"]);
						if ($arResult["postPreview"]["BlogUser"]["AVATAR_file"] !== false)
						{
							$arResult["postPreview"]["BlogUser"]["Avatar_resized"] = CFile::ResizeImageGet(
									$arResult["postPreview"]["BlogUser"]["AVATAR_file"],
									array("width" => 100, "height" => 100),
									BX_RESIZE_IMAGE_EXACT,
									false
								);

							$arResult["postPreview"]["BlogUser"]["AVATAR_img"] = CFile::ShowImage($arResult["postPreview"]["BlogUser"]["Avatar_resized"]["src"], 100, 100, "border=0 align='right'");
						}

						if(strlen($arResult["PostToShow"]["CategoryText"]) > 0)
						{
							$arCatTmp = explode(",", $arResult["PostToShow"]["CategoryText"]);
							if(is_array($arCatTmp))
							{
								foreach($arCatTmp as $v)
									$arResult["postPreview"]["Category"][] = Array("NAME" => htmlspecialcharsbx(trim($v)));
							}
						}
						elseif(strlen($arResult["postPreview"]["CATEGORY_ID"])>0)
						{
							foreach($arResult["postPreview"]["CATEGORY_ID"] as $v)
							{
								if(strlen($v)>0)
								{
									$arResult["postPreview"]["Category"][] = $arResult["Category"][$v];
								}
							}
						}
					}
					else
						$arResult["preview"] = "N";
				}
			}
		}
		else
			$arResult["FATAL_MESSAGE"] = GetMessage("BLOG_ERR_NO_RIGHTS");
	}
	else
	{
		$arResult["FATAL_MESSAGE"] = GetMessage("B_B_MES_NO_BLOG");
		CHTTP::SetStatus("404 Not Found");
	}
}
else
{
	$arResult["FATAL_MESSAGE"] = GetMessage("B_B_MES_NO_BLOG");
	CHTTP::SetStatus("404 Not Found");
}
	
$this->IncludeComponentTemplate();
?>