/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

var autopagerSiteSetting =
{
    onInit : function ()
    {
        // During initialisation
        //window.addEventListener("load", autopagerSiteSetting.onContentLoad, false);
        AutoPagerNS.browser.addEventListener("DOMContentLoaded", autopagerSiteSetting.onContentLoad, false);
    },
    TabSelected : function(event)
    {
        autopagerSiteSetting.onContentLoad(event);
    },
    onContentLoad : function (event)
    {
        var doc = event;

        if (!autopagerUtils.isHTMLDocument(doc))
        {
            if (autopagerUtils.isValidDoc(event.target))
                doc = event.target;
            else if (autopagerUtils.isValidDoc(event.explicitOriginalTarget))
                doc = event.explicitOriginalTarget;
            else if (autopagerUtils.isValidDoc(event.originalTarget))
                doc = event.originalTarget;
        }
        doc = autopagerUtils.getTopDoc(doc)
        if (!doc || !doc.location || !doc.location.href || !(doc.location.href.match(/\.teesoft\.info/)))
            return;
        var flag =doc.getElementById("r");
        if (!flag)
            return;
        autopagerSiteSetting.loadfromclip(doc);
    },
loadfromclip : function(doc)
{
    //alert("loading");
    //if (window.opener!=null && window.opener.autopagerPublicSite != null)
    var site = autopagerRules.getPublishingSite();
    if (site!=null)
    {
        var guid =doc.getElementsByName('r:'+"guid");
        if (guid && guid.length>0)
        {   
        //var site = window.opener.autopagerPublicSite;
        
        autopagerSiteSetting.autopagerSetField(doc,site,"guid");
        autopagerSiteSetting.autopagerSetField(doc,site,"urlPattern");
        autopagerSiteSetting.autopagerSetCheck(doc,site,"urlIsRegex","isRegex");
        autopagerSiteSetting.autopagerSetField(doc,site,"margin");
        autopagerSiteSetting.autopagerSetField(doc,site,"minipages");
        autopagerSiteSetting.autopagerSetField(doc,site,"delaymsecs");
        autopagerSiteSetting.autopagerSetField(doc,site,"linkXPath");
        autopagerSiteSetting.autopagerSetField(doc,site,"containerXPath");
        autopagerSiteSetting.autopagerSetField(doc,site,"monitorXPath");
        autopagerSiteSetting.autopagerSetFieldArray(doc,site,"contentXPath");
        autopagerSiteSetting.autopagerSetField(doc,site,"desc");
        autopagerSiteSetting.autopagerSetCheck(doc,site,"enableJS");
        autopagerSiteSetting.autopagerSetCheck2(doc,"forceJS",site.enableJS>1);
        autopagerSiteSetting.autopagerSetCheck(doc,site,"quickLoad");
        autopagerSiteSetting.autopagerSetCheck(doc,site,"fixOverflow");
        autopagerSiteSetting.autopagerSetCheck(doc,site,"ajax");
        autopagerSiteSetting.autopagerSetCheck(doc,site,"needMouseDown");
        autopagerSiteSetting.autopagerSetField(doc,site,"lazyImgSrc");
        autopagerSiteSetting.autopagerSetField(doc,site,"keywordXPath");
        //window.opener.autopagerPublicSite = null;
        autopagerRules.setPublishingSite(null);
        autopagerSiteSetting.autopagerSetFieldArray(doc,site,"removeXPath");
        autopagerSiteSetting.autopagerSetFieldArray(doc,site,"testLink");
        window.focus();
        }
         
    }
    //  alert(window.opener.autopagerPublicSite);
    
},
autopagerSetCheck : function(doc,site,name,attr)
{
  if (!attr)
      attr = name;
    if (site[attr] == 1 || site[attr])
      this.getElementsByName(doc,name).checked = true;
    else
       this.getElementsByName(doc,name).checked = false;
},
autopagerSetCheck2 : function(doc,name,value)
{
    this.getElementsByName(doc,name).checked = value;
}
,autopagerSetField : function(doc,site,name)
{
    if (site[name])
        this.getElementsByName(doc,name).value = site[name];
}
,autopagerSetFieldArray:function(doc,site,name)
{
	try{
    var values = site[name];
    if (values==null)
    	return;
    for(var i=0 ;i<values.length;++i)
    {
        var el = name;
        var n = 1 + i;
        if (i!=0)
            el = el + n;
        this.getElementsByName(doc,el).value = values[i];
    }
  }
  catch(e)
  {
  }
    
}
,getElementsByName : function(doc,name)
{
    var ele = doc.getElementById('r:' + name)
    if (!ele || ele.tagName.toUpperCase()=='TABLE')
        ele = doc.getElementsByName('r:' + name)[0]
    return ele;
}
}
autopagerSiteSetting.onInit();