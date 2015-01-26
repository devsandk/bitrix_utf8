<?if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();?>
		   	 				</div>
		   	 			</article>
		   	 			<?$APPLICATION->IncludeComponent("bitrix:main.include", "grid4", Array(
							"AREA_FILE_SHOW" => "sect",	// РџРѕРєР°Р·С‹РІР°С‚СЊ РІРєР»СЋС‡Р°РµРјСѓСЋ РѕР±Р»Р°СЃС‚СЊ
							"AREA_FILE_SUFFIX" => "right_1",	// РЎСѓС„С„РёРєСЃ РёРјРµРЅРё С„Р°Р№Р»Р° РІРєР»СЋС‡Р°РµРјРѕР№ РѕР±Р»Р°СЃС‚Рё
							"AREA_FILE_RECURSIVE" => "Y",	// Р РµРєСѓСЂСЃРёРІРЅРѕРµ РїРѕРґРєР»СЋС‡РµРЅРёРµ РІРєР»СЋС‡Р°РµРјС‹С… РѕР±Р»Р°СЃС‚РµР№ СЂР°Р·РґРµР»РѕРІ
							"EDIT_MODE" => "html",
							"EDIT_TEMPLATE" => "sect_right_1.php",	// РЁР°Р±Р»РѕРЅ РѕР±Р»Р°СЃС‚Рё РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ
							),
							false
						);?>
		  			</div>
				</section>
			</div>
<!--==============================footer=================================-->
			<footer>
			   <div class="container_12">
			        <article class="grid_4 fright">
			        	<div class="schedule">
							<?$APPLICATION->IncludeFile(
								$APPLICATION->GetTemplatePath("include_areas/contacts.php"),
								Array(),
								Array("MODE"=>"html")
							);?>
			        	</div>
			        </article>
			        <article class="grid_4 fright">
			        	<?$APPLICATION->IncludeFile(
							$APPLICATION->GetTemplatePath("include_areas/social.php"),
							Array(),
							Array("MODE"=>"html")
						);?>
			        </article>
			        <article class="grid_4 fleft">
			        	<div class="div-footer">
			        		<?$APPLICATION->IncludeFile(
								$APPLICATION->GetTemplatePath("include_areas/copy.php"),
								Array(),
								Array("MODE"=>"html")
							);?>
			        	</div>
			        </article>
			   </div>
			</footer>
		</div>
	</body>
</html>