<?if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();?>

<h2 class="indenth2-2 mar0">our staff</h2>
<ul class="staff">
    <li>
        <figure class="img-block"><img src="/images/43328/staff.jpg" alt="">
            <span>
                <strong><a href="#">Alise Puse</a></strong>
                <span>Chief Operating
                Officer </span>
                <a href="#"><img src="/images/43328/staff-a.png" alt=""></a><a href="#"><img src="/images/43328/staff-a-1.png" alt=""></a>
            </span>
        </figure>
    </li>
    <li>
        <figure class="img-block"><img src="/images/43328/staff-1.jpg" alt="">
            <span>
                <strong><a href="#">Alex Rise</a></strong>
                <span>Chief Operating
                Officer </span>
                <a href="#"><img src="/images/43328/staff-a.png" alt=""></a><a href="#"><img src="/images/43328/staff-a-1.png" alt=""></a>
            </span>
        </figure>
    </li>
    <li>
        <figure class="img-block"><img src="/images/43328/staff-2.jpg" alt="">
            <span>
                <strong><a href="#">Max Band</a></strong>
                <span>Chief Operating
                Officer </span>
                <a href="#"><img src="/images/43328/staff-a.png" alt=""></a><a href="#"><img src="/images/43328/staff-a-1.png" alt=""></a>
            </span>
        </figure>
    </li>
    <li>
        <figure class="img-block"><img src="/images/43328/staff-3.jpg" alt="">
            <span>
                <strong><a href="#">Melisa Pot</a></strong>
                <span>Chief Operating
                Officer </span>
                <a href="#"><img src="/images/43328/staff-a.png" alt=""></a><a href="#"><img src="/images/43328/staff-a-1.png" alt=""></a>
            </span>
        </figure>
    </li>
</ul>
<h2 class="indenth2-2 mar0">Why choose us?</h2>
<ul class="list">
    <li><a href="#">Sound auto, home, and specialty personal insurance products that span a wide range of possibilities.</a></li>
    <li><a href="#">A single-service platform that encompasses sales, claims, customer service, and innovative technology</a></li>
    <li><a href="#">Our Company Now, an online new-business hub for agents to quote, bind, and service products in just minutes</a></li>
    <li><a href="#">80 years of experience that agents can rely on</a></li>
    <li><a href="#">A commitment to continually broadening our offering to meet as many of our customers needs as possible</a></li>
    <li><a href="#">Outstanding support, leading expertise, and a range of resources</a></li>
</ul>
<?$APPLICATION->AddHeadScript(SITE_DIR.'js/43328/jquery.jqtransform.js');?>
<?$APPLICATION->SetAdditionalCSS(SITE_DIR."css/43328/jqtransform.css");?>
<script type="text/javascript">
    $(function(){
        $('#form-2').jqTransform({imgPath:'../images/'});
    });
</script>
<div class="quote">
    <span>get a quote</span>
    <form id="form-2">
        <fieldset class="d-block">
            <div class="box-1">
                <select name="select1">
                    <option value="opt1"> </option>
                    <option value="opt2"> </option>
                </select>
            </div>
            <div class="box-1">
                <input type="text" value="">
            </div>
            <a href="#" class="btn"  onClick="document.getElementById('form-2').submit()">Submit</a><br>
            <a href="#" class="link-form">Retrieve a Saved Quote</a>
        </fieldset>
    </form>
</div>