<?if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();?>
				
	<?$APPLICATION->IncludeComponent("bitrix:main.include", "tabs", Array(
						"AREA_FILE_SHOW" => "sect",	// Показывать включаемую область
						"AREA_FILE_SUFFIX" => "top_1",	// Суффикс имени файла включаемой области
						"AREA_FILE_RECURSIVE" => "Y",	// Рекурсивное подключение включаемых областей разделов
						"EDIT_MODE" => "html",
						"EDIT_TEMPLATE" => "sect_top_1.php",	// Шаблон области по умолчанию
						),
						false
					);?> 
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
<script>
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-48821694-1', 'entask.ru');
  ga('send', 'pageview');

</script>
<!-- Yandex.Metrika counter -->
<script type="text/javascript">
(function (d, w, c) {
    (w[c] = w[c] || []).push(function() {
        try {
            w.yaCounter24242929 = new Ya.Metrika({id:24242929,
                    clickmap:true,
                    trackLinks:true,
                    accurateTrackBounce:true});
        } catch(e) { }
    });

    var n = d.getElementsByTagName("script")[0],
        s = d.createElement("script"),
        f = function () { n.parentNode.insertBefore(s, n); };
    s.type = "text/javascript";
    s.async = true;
    s.src = (d.location.protocol == "https:" ? "https:" : "http:") + "//mc.yandex.ru/metrika/watch.js";

    if (w.opera == "[object Opera]") {
        d.addEventListener("DOMContentLoaded", f, false);
    } else { f(); }
})(document, window, "yandex_metrika_callbacks");
</script>
<noscript><div><img src="//mc.yandex.ru/watch/24242929" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
<!-- /Yandex.Metrika counter -->
	</body>
</html>