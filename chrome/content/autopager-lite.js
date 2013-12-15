/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

var autopagerLite =
{
    siteReg: /ap\.teesoft\.info/,
    openRules : function(event) {
        if(event.currentTarget != event.target) return;
        if(event.button == 2) {
            event.preventDefault();
            autopagerMain.showAutoPagerMenu("autopagerlite-popup");
        }
        else if(event.button == 0) {
            autopagerLite.openRulesSelector(AutoPagerNS.getContentDocument());
        }
    },
    openRulesSelector : function(doc)
    {
        if (doc && doc.location && doc.location.href)
        {
            autopagerLite.openRulesSelectorForUrl(doc.location.href);
        }
    },
    openRulesSelectorForUrl : function(pageurl)
    {
        var url=autopagerPref.loadPref("repository-site");
        if (!pageurl)
            pageurl = "";
        url = url + "d/r?apv=" + autopagerUtils.version + "&exp=0&url=" + encodeURIComponent(pageurl) + "&ids=" + autopagerPref.loadPref("ids");
        AutoPagerNS.add_tab({url:url});
    },
    asyncRequest : function(url,contentType, handler)
    {
        var xmlhttp;
        xmlhttp=autopagerUtils.newXMLHttpRequest()
        xmlhttp.overrideMimeType(contentType);
        xmlhttp.open("GET", url);
        xmlhttp.addEventListener("load", function(event)
        {
            handler(xmlhttp);
        }, false);
        xmlhttp.send(null);
    },
    hiddenStatus : function (hidden)
    {
        var icon = document.getElementById("autopagerlite_status");
        if (icon)
        {
            if (autopagerPref.loadBoolPref("with-lite-discovery-aways-display"))
                hidden = false;
            icon.setAttribute("hidden", hidden);
        }
    },
    setStatus : function (doc,length,hidden)
    {
        var event = doc.createEvent("Events");
        if (length==null || length=="0" || length=="?")
            event.initEvent("AutoPagerLiteRulesNotFound", true, true);
        else
            event.initEvent("AutoPagerLiteRulesFound", true, true);
        doc.dispatchEvent(event)
        autopagerUtils.updateStatusIcons(doc);
        
        if (typeof document!= "undefined")
        {
            var icon = document.getElementById("autopagerlite_status");
            if (icon)
            {
                if (autopagerPref.loadBoolPref("with-lite-discovery-aways-display"))
                    hidden = false;
                if (!hidden && (length==null||length.length==0))
                    length="?";
                icon.setAttribute("label", length);
                icon.setAttribute("hidden", hidden);
            }            
        }
    },
    apSiteRegex : function ()
    {
        return /\.teesoft\.info\/.*/;
    }
    ,
    discoveryRules : function (doc)
    {        
        if (doc && doc.location && doc.location.href && !doc.documentElement.apDiscovered)
        {
            doc.documentElement.apDiscovered = true;
                var href = doc.location.href;
                var text = autopagerRules.getAutopagerCOMP().discoverdUrls[href]
                if (text)
                {
                    if (text == " ")
                        text = "";
                    autopagerLite.processDiscoverResult(doc,text);
                }else
                {                            
                    autopagerRules.discoverRule(href,function(pattern){
                        if (!pattern)
                            return;
                        if (pattern.k)
                            text = pattern.k;
                        else
                            text = "0";
                        autopagerRules.getAutopagerCOMP().discoverdUrls[href] = text
                        autopagerLite.processDiscoverResult(doc,text);
                    });
                }                            
                
        }
    }
    ,
    discoveryRulesOnLine : function (doc)
    {
        if (doc && doc.location && doc.location.href)
        {
            if (doc.location.href.match(autopagerLite.apSiteRegex()))
                autopagerLite.processDiscoverResult(doc,"0");
            else
            {
                var href = doc.location.href;
                var clearedHref = autopagerUtils.clearUrl(href);
                var text = autopagerRules.getAutopagerCOMP().discoverdUrls[clearedHref]
                if (text)
                {
                    if (text == " ")
                        autopagerLite.processDiscoverResult(doc,"");
                    else
                        autopagerLite.processDiscoverResult(doc,text);
                }else
                {
                    var url=autopagerPref.loadPref("repository-site") + "d/discover?ir=false&url=" + encodeURIComponent(doc.location.href);
                    autopagerLite.asyncRequest(url,"text/plan",function(xmlhttp){
                        if (xmlhttp)
                        {
                            if (xmlhttp.responseText)
                                autopagerRules.getAutopagerCOMP().discoverdUrls[clearedHref] = xmlhttp.responseText
                            else
                                autopagerRules.getAutopagerCOMP().discoverdUrls[clearedHref] = " "
                            autopagerLite.processDiscoverResult(doc,xmlhttp.responseText);
                        }
                    })
                }
            }
        }
    },
    promptLiteDiscovery : function ()
    {        
        if (/*autopagerBwUtil.isMobileVersion() &&*/
                !autopagerPref.loadBoolPref("mode-prompted"))
        {
            autopagerLite.promptAutoPagerMode();
            return;
        }                
        
        if (autopagerPref.loadBoolPref("lite-discovery-prompted"))
        {
            return;
        }
        var message = autopagerUtils.autopagerGetString("lite-discovery");
        var id = "autopager-lite-discovery";
        var buttons = [{
            label: autopagerUtils.autopagerGetString("Yes"),
            accessKey: "Y",
            callback: function(){
                autopagerPref.saveBoolPref("lite-discovery-prompted",true);
                autopagerPref.saveBoolPref("with-lite-discovery",true);
                if (AutoPagerNS.getContentDocument())
                {
                    AutoPagerNS.getContentDocument().documentElement.apDiscovered=false;
                    autopagerLite.discoveryRules(AutoPagerNS.getContentDocument());
                }
                else{
                    document.documentElement.apDiscovered=false;
                    autopagerLite.discoveryRules(AutoPagerNS.getContentDocument());
                }
            }
        },{
            label: autopagerUtils.autopagerGetString("No"),
            accessKey: "N",
            callback: function(){
                autopagerPref.saveBoolPref("lite-discovery-prompted",true)
                autopagerPref.saveBoolPref("with-lite-discovery",false)
                autopagerPref.saveBoolPref("with-lite-discovery-aways-display",true)
            }
        },{
            label: autopagerUtils.autopagerGetString("Help"),
            accessKey: "H",
            callback: function(){
                AutoPagerNS.add_tab({url:"http://autopager.teesoft.info/lite.html"});
            }
        }];
        autopagerUtils.notification(id,message,buttons);
    },
    
    promptAutoPagerMode : function ()
    {        
        if (autopagerPref.loadBoolPref("mode-prompted"))
        {
            return;
        }
        var now = new Date();
        
//        if (this.promptAutoPagerModetime && (now.getTime()-this.promptAutoPagerModetime<(1000 * 60 * 2) ))
//            return
        this.promptAutoPagerModetime = now.getTime();
        
        var message = autopagerUtils.autopagerGetString("autopager-mode");
        var id = "autopager-mode";
        var buttons = [{
            label: autopagerUtils.autopagerGetString("normal_repositories"),
            accessKey: "O",
            callback: function(){
                autopagerPref.saveBoolPref("work-in-lite-mode",false)
                autopagerPref.saveBoolPref("mode-prompted",true)
                autopagerPref.resetPref("mode-no-repository")
                AutoPagerNS.message.call_function("autopager_enable_repositories",{
                        repositories:[
                            {filename:"autopagerTee.xml",
                        enabled:true},
                            {filename:"autopagerLite.xml",
                        enabled:true},
                            {filename:"autopagerizeJson.xml",
                        enabled:true}
                        ]
                    },function(options){                            
                    })
            }
        },{
            label: autopagerUtils.autopagerGetString("choosed_rules"),
            accessKey: "L",
            callback: function(){
                autopagerPref.saveBoolPref("work-in-lite-mode",true);
                autopagerPref.saveBoolPref("mode-prompted",true)
                autopagerPref.resetPref("mode-no-repository")
                AutoPagerNS.message.call_function("autopager_enable_repository",{
                        filename:"autopagerLite.xml",
                        enabled:true
                    },function(options){                            
                    })

            }
        },{
            label: autopagerUtils.autopagerGetString("no_rules_from_repository"),
            accessKey: "N",
            callback: function(){
                autopagerPref.saveBoolPref("mode-prompted",true)
                autopagerPref.saveBoolPref("mode-no-repository",true)
            }
        },{
            label: autopagerUtils.autopagerGetString("Help"),
            accessKey: "H",
            callback: function(){
                AutoPagerNS.add_tab({url:"http://autopager.teesoft.info/modes.html"});
            }
        }];
        autopagerUtils.notification(id,message,buttons);
    },
    processDiscoverResult : function (doc,result)
    {
        var values;
        if (result.length==0)
            values = [];
        else
            values = result.split(",");
        doc.documentElement.setAttribute("autopagerMatchedRules",values.length);
        autopagerLite.setStatus(doc,values.length,values.length==0 && autopagerPref.loadBoolPref("hide-lite-discovery-on-no-rules"));
    //        if (gBrowser && gBrowser.selectedTab && gBrowser.selectedTab.linkedBrowser)
    //        {
    //            gBrowser.selectedTab.linkedBrowser.setAttribute("autopagerMatchedRules",values.length);
    //        }
    },
    getMatchedRules : function(doc)
    {
        if (doc && doc.documentElement && !doc.documentElement.hasAttribute("autopagerguid"))
        {
            return doc.documentElement.getAttribute("autopagerMatchedRules");
        }
        return 0;
    },
    clearMatchedRules : function(doc)
    {
        if (doc && doc.documentElement)
        {
            doc.documentElement.removeAttribute("autopagerMatchedRules");
            autopagerLite.setStatus(doc,0,true);
        }
        return 0;
    },
    TabSelected : function(doc)
    {
        if (doc)
        {
            var length = doc.documentElement.getAttribute("autopagerMatchedRules");
            autopagerLite.setStatus(doc,length,(length==null || length.length==0) && autopagerPref.loadBoolPref("hide-lite-discovery-on-no-rules"));
        }
    },
    apRuleSiteOnInit : function (event)
    {
//        autopagerBwUtil.consoleLog("apRuleSiteOnInit")
        
        // During initialisation
        AutoPagerNS.browser.addEventListener("DOMContentLoaded", autopagerLite.onContentLoad, false);
        AutoPagerNS.browser.addEventListener("load", autopagerLite.onContentLoad, false);
        if (autopagerBwUtil.supportHiddenBrowser())
        {
            autopagerUtils.addTabSelectListener(autopagerLite.TabSelected, true)
        }
        if (autopagerPref.loadBoolPref("with-lite-discovery-aways-display"))
            autopagerLite.hiddenStatus(false);
        
        if (event)
        {
            autopagerLite.onContentLoad(event);
        }
    },
    onContentLoad : function (event)
    {
        //autopagerLite.promptAutoPagerMode();
//        autopagerBwUtil.consoleLog("autopagerLite onContentLoad")
        var doc = event;
        if (!autopagerUtils.isHTMLDocument(doc))
        {
            if (autopagerUtils.isValidDoc(event.explicitOriginalTarget))
                doc = event.explicitOriginalTarget;
            else if (autopagerUtils.isValidDoc(event.originalTarget))
                doc = event.originalTarget;
            else if (autopagerUtils.isValidDoc(event.target))
                doc = event.target;
        }
        if (!doc || !doc.location || !doc.location.href || !(doc.location.href.match(autopagerLite.siteReg)))
            return;

        if (autopagerBwUtil.isMobileVersion() && typeof Browser!="undefined" && Browser._browserView)
        {
            var bv = Browser._browserView
           // bv.setZoomLevel(2);
        //            var browser = Browser;
        //            if (browser && browser.markupDocumentViewer)
        //            {
        //                var zoomFactor=2
        //              if (FullZoom.siteSpecific) {
        //                FullZoom._cps.setPref(browser.currentURI, FullZoom.name, zoomFactor);
        //              } else {
        //                browser.markupDocumentViewer.fullZoom = zoomFactor;
        //              }
        //            }
        }
        var needAp = doc.getElementById("need-ap");
        if (needAp)
            needAp.style.display='none';
        
        var selectAll = doc.getElementById("apRulesForm:rulesTable:selectAll");
        if (selectAll)
            selectAll.checked = false;

//        autopagerBwUtil.consoleLog("autopagerLite onContentLoad 1")
        var sheets = doc.styleSheets
        for(var i=0;i<sheets.length;i++)
        {
            var sheet = sheets.item(i);
//            autopagerBwUtil.consoleLog("autopagerLite onContentLoad sheet:" + sheet)
            if (!sheet)
                continue;
            if (sheet.href ==null || sheet.href.match(autopagerLite.siteReg))
            {
                if (typeof sheet.cssRules != "undefined")
                    for(var r=0;r<sheet.cssRules.length;r++)
                    {
                        if (sheet.cssRules[r].selectorText=='.editor')
                        {
                            sheet.cssRules[r].style.display="inline";
                        }
                        else if (sheet.cssRules[r].selectorText=='.install')
                        {
                            sheet.cssRules[r].style.display="inline";
                        }
                    }
            }
        }
        var enableButtons = ["apRulesForm:rulesTable:enable1","apRulesForm:rulesTable:enable2"];        
        for(var i=0;i<enableButtons.length;i++)
        {
            var button = doc.getElementById(enableButtons[i]);
            if (button)
            {
                
                button.addEventListener("click", function(e){
//                    autopagerBwUtil.consoleLog("autopagerLite onContentLoad click:" + e)
                    autopagerLite.enableRules(doc,true);
                }, true)
            }
        }
        var disableButtons = ["apRulesForm:rulesTable:disable1","apRulesForm:rulesTable:disable2"];
        for(var i=0;i<disableButtons.length;i++)
        {
            var button = doc.getElementById(disableButtons[i]);
            if (button)
            {
                button.addEventListener("click", function(e){
//                    autopagerBwUtil.consoleLog("autopagerLite onContentLoad click:" + e)
                    autopagerLite.enableRules(doc,false);
                }, true)
            }
        }
        var idsEle = doc.getElementById("apRulesForm:ids_body");
        if (idsEle)
        {
            //idsEle.addEventListener("DOMAttrModified",autopagerLite.idsChanged,false);
            idsEle.addEventListener("AutoPagerSetIds",autopagerLite.idsChanged,false);
        }
        doc.addEventListener("AutoPagerAddIds", function(e){autopagerLite.onModifyIds(e.target,true)},false);
        doc.addEventListener("AutoPagerDeleteIds",function(e){autopagerLite.onModifyIds(e.target,false)},false);
        doc.addEventListener("DOMNodeInserted",function(e){autopagerLite.onAddNodes(e)},false);


    },
    onAddNodes : function (e)
    {
        var node = e.target
        if (node.nodeType == 3)
            return;
        if (node.getAttribute("id")=="ap:AutoPagerAddIds")
        {
            autopagerLite.onModifyIds(node,true)
        }else if (node.getAttribute("id")=="ap:AutoPagerDeleteIds")
        {
            autopagerLite.onModifyIds(node,false)
        }
    },
    onModifyIds : function (node,add)
    {
        //var ids = node.getAttribute("name");
        var ids = node.textContent;
        if (add)
            autopagerPref.savePref("ids",autopagerLite.processIds(autopagerPref.loadPref("ids") + "," + ids));
        else
            autopagerPref.savePref("ids",autopagerLite.removeIds(autopagerPref.loadPref("ids") ,"," + ids + ","));

        autopagerUtils.Set_Cookie(node.ownerDocument, "ids", autopagerPref.loadPref("ids"), 365, 'ap.teesoft.info'/*, path, secure */)
    },
    idsChanged : function (e)
    {
        var node = e.target
        //var ids = node.getAttribute("name");
        var ids = node.textContent;
        ids = autopagerLite.processIds(ids)
        autopagerPref.savePref("ids",ids);
        autopagerUtils.Set_Cookie(node.ownerDocument, "ids", ids, 365, 'ap.teesoft.info'/*, path, secure */)
    }
    ,
    enableRules : function(doc,enabled)
    {
        var inputs = doc.getElementsByTagName("input");
        var ids = "";
        for(var i=0; i < inputs.length; i++)
        {
            if (inputs[i].type=='checkbox' && inputs[i].id.match(/\:select$/)
                && inputs[i].checked)
                {
                ids = ids + "," + (inputs[i].nextSibling.textContent);
            }
        }
        if (enabled)
            autopagerPref.savePref("ids",autopagerLite.processIds(autopagerPref.loadPref("ids") + "," + ids));
        else
            autopagerPref.savePref("ids",autopagerLite.removeIds(autopagerPref.loadPref("ids") ,"," + ids + ","));

    //TODO:update the rules online
    },
    processIds : function (idStr)
    {
        var strs = idStr.replace(/\s+/g,",").split(",");
        var newS = ",";
        var numReg = new RegExp("\\d+")
        for(var i=0;i<strs.length;i++)
        {
            var s = strs[i];
            if (numReg.test(s) && newS.indexOf("," + s + ",")==-1)
            {
                newS += s + ",";
            }
        }
        return newS.substring(1,newS.length - 1);
    },
    removeIds : function (idStr,removedStr)
    {
        var strs = idStr.replace(/\s+/g,",").split(",");
        var newS = "";
        var numReg = new RegExp("\\d+")
        for(var i=0;i<strs.length;i++)
        {
            var s = strs[i];
            if (numReg.test(s) && !removedStr.match("," + s + ","))
            {
                if (newS.length>0)
                    newS+=",";
                newS += s;
            }
        }
        return newS;
    },
    switchToLite : function(liteMode)
    {
        var changed = autopagerPref.saveBoolPref("work-in-lite-mode",liteMode);
        if (changed)
        {
            if (liteMode)
            {
                autopagerPref.saveBoolPref("with-lite-discovery",true);
                autopagerPref.saveBoolPref("noprompt",true);
                autopagerPref.saveBoolPref("disable-by-default",false);
            }
            //       else
            //           autopagerPref.saveBoolPref("with-lite-rules",true);
            AutoPagerNS.UpdateSites.getAutopagerCOMP().setUpdateSites(null);
            AutoPagerNS.UpdateSites.updateSites=null;
            AutoPagerNS.UpdateSites.init();
            AutoPagerNS.UpdateSites.getAutopagerCOMP().setAll(null);
            AutoPagerNS.UpdateSites.loadAll();
            AutoPagerNS.UpdateSites.updatePatternOnline(true);            
        }
        return changed;
    },
    isInLiteMode : function ()
    {
        //        if (!autopagerBwUtil.isMobileVersion())
        return autopagerPref.loadBoolPref("work-in-lite-mode");
    //        return true;
    }
    ,removeId : function(id)
    {
        autopagerPref.savePref("ids",autopagerLite.removeIds(autopagerPref.loadPref("ids") ,"," + id + ","));
    }
}
