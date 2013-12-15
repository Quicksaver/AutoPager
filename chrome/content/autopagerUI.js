const CI = Components.interfaces;
const CC = Components.classes;

var allSites = null;
var hashSites = null;
var sites = null;
var userModifiableTreeChildren=null;
var treeSites,treebox, urlPattern,isRegex, description,lblOwner;
var descriptions = {} //description caches for current view, avoid polling them evey time
var chkEnabled, chkEnableJS,chkForceJS,chkAjax,chkneedMouseDown
var chkFixOverflow,btnAdd,btnCopy, btnClone,btnDelete,btnPublic,btnReset;
var btnAddPath,btnEditPath,btnDeletePath,btnPickLinkPath;
var btnUp,btnDown,btnFilterUp,btnFilterDown, btnSiteUp,btnSiteDown;
var chkCtrl,chkAlt,chkShift,chkQuickLoad;
var txtLoading,txtPagebreak,txtConfirmStyle,txtTimeout;
var mnuUpdate;
var linkXPath,containerXPath, monitorXPath;

var chkSettingEnabled,lbSettinglOwner,settingurl
var settingtype,settingUpdatePeriod,settingxpath,settingdesc,rulecount

var selectedSource;
    
var mynameText,grpSmart,smarttext,smartlinks,discoverytext,smartenable,smartmatch,alwaysEnableJavaScript,showPrompt, showStatusBar,gdelaymsecs,ignoresites;
var selectedListItem = null;
var margin,minipages,delaymsecs,smartMargin,lazyImgSrc;
var selectedSite;
var contentXPath;
var xpath="";
var ids,ir;
var siteSearch;
var btnPickRemovePath, btnPickContentPath,btnPickContainerPath,btnPickCleanPath,btnModifyCleanPath,btnModifyContainerXPath,btnModifyLinkXPath

if (autopagerPref.loadBoolPref("show-help"))
{
    var tips = new autopagerTip("AutopagerUI:");

    window.addEventListener("mouseover",function(event){
        tips.onMouseOver(event);
    },false);
    window.addEventListener("mouseout",function(event){
        tips.onMouseOut(event);
    },false);
}
var btnAddRemovePath, btnEditRemovePath, btnDeleteRemovePath, lstRemoveXPath

var settingDeck;
var winLoad =  function(ev) {
    window.removeEventListener("load",winLoad,false);
        
    loadControls();
    {
        setTimeout(function (){
            //var t = new Date().getTime();
            var url = "";
            if (window.opener && window.opener.autopagerSelectUrl)
                url = window.opener.autopagerSelectUrl;
            else
                url = AutoPagerNS.get_tab_url(AutoPagerNS.do_get_current_tab());
            
            if (!url || url.indexOf('about:')==0 || url.indexOf('chrome:')==0)
                url = ""
            if(url)
                siteSearch.value = url
            else
                siteSearch.value = ""
            onSiteFilter(url,true,true);
            
            if (!autopagerPref.loadBoolPref("disable-tooltips"))
                var de = new autopagerDescription("AutoPagerSetting:",document);
            //alert(new Date().getTime() -t)
            setTimeout(function(){
                updateSearchStatus(url);
            },1000);
            setTimeout(function(){
                updateSearchStatus(url);
            },10);
        },20);
            
    }
}
window.addEventListener("load",winLoad, false);
function getMatchedIndex(url)
{
    var index = -1;
    var view = treeSites.view;
    for(index=0; index<treeSites.view.rowCount; ++index)
    {
        var treerow = treeSites.view.wrappedJSObject.getItemAtIndex(index);
        if (treerow.site != null && treerow.site.urlPattern == url)
            return index;
    }
    if(index>=treeSites.view.rowCount)
    {
        for(index=0; index<treeSites.view.rowCount; ++index)
        {
            var treerow = treeSites.view.wrappedJSObject.getItemAtIndex(index);
            if (treerow.site != null && autopagerUtils.getRegExp(treerow.site).test(url))
                return index;
        }
            
    }
    if(index>=treeSites.view.rowCount)
        index =0;
    return index;
}
function getMatchedByGuid(guid)
{
    var index = -1;
    var key;
    for ( key in allSites){
        var tmpsites = allSites[key];
        if (tmpsites==null || tmpsites.updateSite.filename=="autopager.xml")
            continue;
        for (var i = 0; i < tmpsites.length; i++) {
            var site = tmpsites[i];
            if (site.guid == guid) {
                return site;
            }
        }
    }
    return null;
		
    var view = treeSites.view;
    for(index=0; index<treeSites.view.rowCount; ++index)
    {
        var treerow = treeSites.view.wrappedJSObject.getItemAtIndex(index);
        var parentItem = treerow.parentItem();
        var updateSite = null
        if (parentItem!=null)
            updateSite =parentItem.updateSite
        alert(updateSite)
        if (treerow.site != null && parentItem!=null && updateSite != null &&
            updateSite.filename != "autopager.xml" && treerow.site.guid == guid)
            return index;
    }
    if(index>=treeSites.view.rowCount)
        index = -1;
    return index;
}
function chooseInView(view,url)
{
    for(var index=0; index<view.getChildCount(); ++index)
    {
        var treerow = view.wrappedJSObject.getChildAtIndex(index);
        if (treerow.site != null && (treerow.site.urlPattern == url ||  autopagerUtils.getRegExp(treerow.site).test(url)))
        {
            treeSites.view.wrappedJSObject.selectItem(treerow);
            return true;
        }
        var ret = chooseInView(treerow,url);
        if (ret)
            return true;
                  
    }
    return false;
}


function handleHelpButton()
{
    autopagerBwUtil.autopagerOpenIntab("http://autopager.teesoft.info/help.html",null);
}
function handleOkButton() {
    handleApplyButton();                  
    return true;
}
function handleApplyButton() {
    autopagerConfig.saveConfig(sites);
    var allConfigs = {};
    autopagerConfig.saveAllOverride(allSites);
    for (var key in allSites){
        if(!allSites[key].updateSite)
            continue;
        allConfigs[allSites[key].updateSite.filename] = allSites[key]
    }
    allConfigs["autopager.xml"] = sites;
    AutoPagerNS.UpdateSites.getAutopagerCOMP().setAll(allConfigs);
    //autopagerConfig.autoSites = autopagerConfig.loadConfig();
        
    autopagerMain.saveMyName(mynameText.value);
    autopagerPref.saveBoolPref("smartenable",smartenable.checked);
    autopagerPref.saveBoolPref("smartexactlymatch",smartmatch.checked);
    
    autopagerPref.saveUTF8Pref("smarttext",smarttext.value);
    autopagerPref.savePref("smartlinks",smartlinks.value);
    autopagerPref.savePref("smartMargin",smartMargin.value);
    autopagerPref.savePref("loadingDelayMiliseconds",gdelaymsecs.value);

    autopagerPref.saveUTF8Pref("discoverytext",discoverytext.value);
    autopagerPref.saveBoolPref("alwaysEnableJavaScript",alwaysEnableJavaScript.checked);
    autopagerPref.saveBoolPref("noprompt",!showPrompt.checked);
    autopagerPref.saveBoolPref("hide-status",!showStatusBar.checked);

    var v = getListValues(ignoresites,"\n")
    autopagerPref.savePref("ignoresites",v);

    //autopagerPref.savePref("timeout",txtTimeout.value);
    autopagerMain.setCtrlKey(chkCtrl.checked);
    autopagerMain.setAltKey(chkAlt.checked );
    autopagerMain.setShiftKey(chkShift.checked);
    autopagerMain.setLoadingStyle(txtLoading.value);
    autopagerPref.saveUTF8Pref("pagebreak",txtPagebreak.value);
    autopagerPref.saveUTF8Pref("optionstyle",txtConfirmStyle.value);
    autopagerPref.savePref("update",mnuUpdate.value);
    var newIds = autopagerLite.processIds(ids.value)
    if (newIds != autopagerPref.loadPref("ids"))
        autopagerPref.savePref("ids",newIds);
    autopagerPref.saveBoolPref("with-lite-recommended-rules",ir.checked);

    AutoPagerNS.AutoPagerUpdateTypes.saveSettingSiteConfig(getAllRepository(allSites));
    //AutoPagerNS.AutoPagerUpdateTypes.saveAllSettingSiteConfig();
	 
    var doc
    if (window.opener.getBrowser)
        doc = window.opener.getBrowser().contentDocument;
    else if (window.opener.gBrowser)
        doc = window.opener.gBrowser.contentDocument;
    else if (window.opener.autopagerOpenerObj)
        doc = window.opener.autopagerOpenerObj.contentDocument;
    else if (typeof window.opener.autopagerSelectUrl == 'undefined')
        doc = autopagerUtils.currentDocument();
    if (doc)
    {
        var event = doc.createEvent("Events");
        event.initEvent("AutoPagerRefreshPage", true, true);
        try{
            doc.dispatchEvent(event)
        }catch(e)
        {
            autopagerBwUtil.consoleError(e);
        }
    }
    return true;
}
function onSiteChange(treeitem,site,invalidateRow)
{
    site.changedByYou = autopagerConfig.isChanged(site);
    btnReset.hidden = !site.changedByYou;
    checkChanged(site);
    //        var treerow = treeitem.childNodes[0];
    //        var treecell = treerow.childNodes[0];
    //        treecell.setAttribute("properties","status" + getColor(site));
    //        treecell = treerow.childNodes[1];
    //        treecell.setAttribute("properties","status" + getColor(site));
    if (typeof invalidateRow == "undefined" || invalidateRow)
        treeSites.view.wrappedJSObject.invalidateRow();

}
function onSourceChange(treeitem,site)
{
    site.changedByYou = autopagerConfig.isChanged(site);
    treeSites.view.wrappedJSObject.invalidateRow();

}    
function loadControls() {
    treeSites = document.getElementById("treeSites");
    treebox = document.getElementById("siteContents");
    urlPattern = document.getElementById("urlPattern");
    isRegex = document.getElementById("chkIsRegex");
    margin = document.getElementById("margin");
    minipages = document.getElementById("minipages");
    delaymsecs = document.getElementById("delaymsecs");
    lblOwner = document.getElementById("lblOwner");
    description = document.getElementById("desc");
    btnAdd = document.getElementById("btnAdd");
    btnCopy = document.getElementById("btnCopy");
    btnClone = document.getElementById("btnCloneToEdit");
    btnReset = document.getElementById("btnReset");
    btnDelete = document.getElementById("btnDelete");
    btnPublic = document.getElementById("btnPublic");

    lazyImgSrc = document.getElementById("lazyImgSrc");
    btnAddPath = document.getElementById("btnAddPath");
    btnEditPath = document.getElementById("btnEditPath");
    btnUp = document.getElementById("btnUp");
    btnDown = document.getElementById("btnDown");
    btnFilterUp = document.getElementById("btnFilterUp");
    btnFilterDown = document.getElementById("btnFilterDown");
    btnSiteUp = document.getElementById("btnSiteUp");
    btnSiteDown = document.getElementById("btnSiteDown");
    btnDeletePath = document.getElementById("btnDeletePath");
    contentXPath = document.getElementById("lstContentXPath");
        
    btnAddRemovePath = document.getElementById("btnAddRemovePath");
    btnEditRemovePath = document.getElementById("btnEditRemovePath");
    btnDeleteRemovePath = document.getElementById("btnDeleteRemovePath");
    lstRemoveXPath = document.getElementById("lstRemoveXPath");
        
    chkEnabled = document.getElementById("chkEnabled");
    chkEnableJS = document.getElementById("chkEnableJS");
    chkForceJS = document.getElementById("chkForceJS");
    chkAjax = document.getElementById("chkAjax");
    chkneedMouseDown = document.getElementById("chkneedMouseDown");

    chkQuickLoad = document.getElementById("chkQuickLoad");
    chkFixOverflow = document.getElementById("chkFixOverflow");
    linkXPath  = document.getElementById("linkXPath");
    containerXPath  = document.getElementById("containerXPath");
    monitorXPath  = document.getElementById("monitorXPath");

    btnPickLinkPath  = document.getElementById("pickLinkPath");
        
    settingDeck = document.getElementById("settingDeck");
        
    siteSearch  = document.getElementById("siteSearch");
        
    chkSettingEnabled = document.getElementById("chkSettingEnabled");
    lbSettinglOwner = document.getElementById("lbSettinglOwner");
    settingurl = document.getElementById("settingurl");
    settingtype = document.getElementById("settingtype");
    settingUpdatePeriod = document.getElementById("settingUpdatePeriod");
    settingxpath = document.getElementById("settingxpath");
    settingdesc  = document.getElementById("settingdesc");
    rulecount = document.getElementById("rulecount");

    mynameText = document.getElementById("myname");
    mynameText.value = autopagerMain.loadMyName();
    txtLoading = document.getElementById("loading");
    txtLoading.value = autopagerMain.getLoadingStyle();
    mnuUpdate = document.getElementById("updatePeriod");
    mnuUpdate.value = autopagerPref.loadPref("update");
    ids = document.getElementById("ids");
    ids.value = autopagerPref.loadPref("ids");
    ir = document.getElementById("ir");
    ir.checked = autopagerPref.loadBoolPref("with-lite-recommended-rules");
    txtPagebreak = document.getElementById("pagebreak");
    txtPagebreak.value = autopagerPref.loadUTF8Pref("pagebreak");
        
    txtConfirmStyle = document.getElementById("confirm");
    txtConfirmStyle.value = autopagerPref.loadUTF8Pref("optionstyle");
    //var chkCtrl,chkAlt,chkShift;
    chkCtrl = document.getElementById("chkCtrl");
    chkAlt = document.getElementById("chkAlt");
    chkShift = document.getElementById("chkShift");
    chkCtrl.checked = autopagerMain.getCtrlKey();
    chkAlt.checked = autopagerMain.getAltKey();
    chkShift.checked = autopagerMain.getShiftKey();
        
        
    alwaysEnableJavaScript = document.getElementById("alwaysEnableJavaScript");
    alwaysEnableJavaScript.checked = autopagerPref.loadBoolPref("alwaysEnableJavaScript");
        
    showPrompt = document.getElementById("showPrompt");
    showPrompt.checked = !autopagerUtils.noprompt();

    showStatusBar = document.getElementById("showStatusBar");
    showStatusBar.checked = !autopagerPref.loadBoolPref("hide-status");

    ignoresites = document.getElementById("ignoresites");
    populateIgnoreSites(autopagerPref.loadPref("ignoresites"),ignoresites)
    //        ignoresites.value = autopagerPref.loadPref("ignoresites");


    smartenable = document.getElementById("smartenable");
    smartenable.checked = autopagerPref.loadBoolPref("smartenable");
    smartmatch = document.getElementById("smartmatch");
    smartmatch.checked = autopagerPref.loadBoolPref("smartexactlymatch");

    grpSmart = document.getElementById("grpSmart");
		
    smarttext = document.getElementById("smarttext");
    smarttext.value = autopagerPref.loadUTF8Pref("smarttext");
        
    smartlinks = document.getElementById("smartlinks");
    smartlinks.value = autopagerPref.loadPref("smartlinks");
        
    discoverytext = document.getElementById("discoverytext");
    discoverytext.value = autopagerPref.loadUTF8Pref("discoverytext");
        
    smartMargin = document.getElementById("smartMargin");
    smartMargin.value = autopagerPref.loadPref("smartMargin");

    gdelaymsecs = document.getElementById("gdelaymsecs");
    gdelaymsecs.value = autopagerPref.loadPref("loadingDelayMiliseconds");

    //txtTimeout = document.getElementById("timeout");
    //txtTimeout.value = autopagerPref.loadPref("timeout");

    enableSmartControl(smartenable.checked);

    btnPickRemovePath = document.getElementById("pickRemovePath")
    btnPickContentPath = document.getElementById("pickContentPath")
    btnPickContainerPath = document.getElementById("pickContainerPath")
    btnModifyContainerXPath = document.getElementById("modifyContainerXPath")
    btnPickCleanPath = document.getElementById("pickCleanPath")
    btnModifyCleanPath = document.getElementById("pickCleanPath")
    btnModifyLinkXPath = document.getElementById("modifyLinkXPath")

    treeSites.addEventListener("select", updateDetails, false);
    treeSites.addEventListener("focus",function(e)
    {
        //            alert(document.commandDispatcher.focusedElement);
        //            if (e.explicitOriginalTarget!=null)
        //            {
        //                var node = e.explicitOriginalTarget
        //                //alert(node);
        //                var newCmdEvent = document.createEvent('Events');
        //                newCmdEvent.initEvent('change',true, true);
        //                node.dispatchEvent(newCmdEvent);
        //            }
        },true);

    treeSites.filterIng=false;
        
    btnAdd.addEventListener("command", handleAddSiteButton, false);
    btnCopy.addEventListener("command", handleCopySiteButton, false);
    btnClone.addEventListener("command", handleCopySiteButton, false);
    btnReset.addEventListener("command", handleResetSiteButton, false);
    btnDelete.addEventListener("command", handleDeleteSiteButton, false);
    btnPublic.addEventListener("command", handlePublicSiteButton, false);
    chkEnabled.addEventListener("command", function() {
        if (selectedSite != null) {
            selectedSite.enabled = chkEnabled.checked;
            onSiteChange(selectedListItem,selectedSite);
        }
    }, false);
        
    chkSettingEnabled.addEventListener("command", function() {
        if (selectedSource != null) {
            selectedSource.enabled = chkSettingEnabled.checked;
            onSourceChange(selectedListItem,selectedSource);
        }
    }, false);
        
    settingtype.addEventListener("command", function() {
        if (selectedSource != null) {
            selectedSource.updateType = AutoPagerNS.AutoPagerUpdateTypes.getType( settingtype.value);
            onSourceChange(selectedListItem,selectedSource);
        }
    }, false);
    settingUpdatePeriod.addEventListener("command", function() {
        if (selectedSource != null) {
            selectedSource.updateperiod = settingUpdatePeriod.value;
            onSourceChange(selectedListItem,selectedSource);
        }
    }, false);

    lbSettinglOwner.addEventListener("change", function() {
        if (selectedSite != null) {
            selectedSite.owner = lbSettinglOwner.value;
            onSiteChange(selectedListItem,selectedSite);
        }
    }, false);
    settingurl.addEventListener("change", function() {
        if (selectedSite != null) {
            selectedSite.url = settingurl.value;
            onSiteChange(selectedListItem,selectedSite);
        }
    }, false);
    settingxpath.addEventListener("change", function() {
        if (selectedSite != null) {
            selectedSite.xpath = settingxpath.value;
            onSiteChange(selectedListItem,selectedSite);
        }
    }, false);

    settingdesc.addEventListener("change", function() {
        if (selectedSite != null) {
            selectedSite.desc = settingdesc.value;
            onSiteChange(selectedListItem,selectedSite);
        }
    }, false);
        
    smartenable.addEventListener("command", function() {
        enableSmartControl(smartenable.checked);
    }, false);
        
        
    chkEnableJS.addEventListener("command", function() {
        if (selectedSite != null) {
            selectedSite.enableJS = getEnableJS()
            onSiteChange(selectedListItem,selectedSite);
        }
    }, false);
    chkForceJS.addEventListener("command", function() {
        if (selectedSite != null) {
            if (chkForceJS.checked)
                chkEnableJS.checked = true
            selectedSite.enableJS = getEnableJS()
            onSiteChange(selectedListItem,selectedSite);
        }
    }, false);

    chkAjax.addEventListener("command", function() {
        if (selectedSite != null) {
            selectedSite.ajax = chkAjax.checked;
            if (selectedSite.ajax)
            {
                chkEnableJS.checked = true;
                chkForceJS.checked = true;
                selectedSite.enableJS = 2;
            }
            onSiteChange(selectedListItem,selectedSite);
        }
    }, false);
    chkneedMouseDown.addEventListener("command", function() {
        if (selectedSite != null) {
            selectedSite.needMouseDown = chkneedMouseDown.checked;
            onSiteChange(selectedListItem,selectedSite);
        }
    }, false);
    chkQuickLoad.addEventListener("command", function() {
        if (selectedSite != null) {
            selectedSite.quickLoad = chkQuickLoad.checked;
            onSiteChange(selectedListItem,selectedSite);
        }
    }, false);
    chkFixOverflow.addEventListener("command", function() {
        if (selectedSite != null) {
            selectedSite.fixOverflow = chkFixOverflow.checked;
            onSiteChange(selectedListItem,selectedSite);
        }
    }, false);
    linkXPath.addEventListener("change", function(evt) {
        if (selectedSite != null) {
            selectedSite.linkXPath = linkXPath.value;
            onSiteChange(selectedListItem,selectedSite);
        }
    }, false);
    containerXPath.addEventListener("change", function() {
        if (selectedSite != null) {
            selectedSite.containerXPath = containerXPath.value;
            onSiteChange(selectedListItem,selectedSite);
        }
    }, false);
    monitorXPath.addEventListener("change", function() {
        if (selectedSite != null) {
            selectedSite.monitorXPath = monitorXPath.value;
            onSiteChange(selectedListItem,selectedSite);
        }
    }, false);
    siteSearch.addEventListener("command", function() {
        onSiteFilter(siteSearch.value,false,true);
    }, false);
    siteSearch.addEventListener("keyup", function() {
        onSiteFilter(siteSearch.value,false,true);
        siteSearch.focus();
    }, false);
    description.addEventListener("change", function() {
        if (selectedSite != null) {
            selectedSite.desc = description.value;
            onSiteChange(selectedListItem,selectedSite);
        }
    }, false);
    urlPattern.addEventListener("change", function() {
        if (selectedSite != null) {
           	
            selectedSite.urlPattern = urlPattern.value;
            selectedSite.regex=null;
            onSiteChange(selectedListItem,selectedSite);
            checkurlPattern(isRegex,urlPattern,selectedSite);
        }
    }, false);
    urlPattern.addEventListener("input", function() {
        if (selectedSite != null) {
            window.setTimeout(function(){
                checkurlPattern(isRegex,urlPattern,selectedSite);
            },10);
        }
    }, false);
    isRegex.addEventListener("command", function() {
        if (selectedSite != null) {
           	
            selectedSite.isRegex = isRegex.checked;
            onSiteChange(selectedListItem,selectedSite);
            checkurlPattern(isRegex,urlPattern,selectedSite);
        }
    }, false);
    margin.addEventListener("change", function() {
        if (selectedSite != null) {
            if (!autopagerConfig.isNumeric( margin.value))
            {
                alert(autopagerUtils.autopagerGetString("inputnumber"));
                margin.focus();
                return;
            }
            selectedSite.margin = margin.value;
            onSiteChange(selectedListItem,selectedSite);
        }
    }, false);
    minipages.addEventListener("change", function() {
        if (selectedSite != null) {
            if (!autopagerConfig.isNumeric( minipages.value))
            {
                alert(autopagerUtils.autopagerGetString("inputnumber"));
                minipages.focus();
                return;
            }
            selectedSite.minipages = minipages.value;
            onSiteChange(selectedListItem,selectedSite);
        }
    }, false);

    lazyImgSrc.addEventListener("change", function() {
        if (selectedSite != null) {
            if (!( lazyImgSrc.value) || lazyImgSrc.value == "")
            {
                selectedSite.lazyImgSrc = null;
            }else
                selectedSite.lazyImgSrc = lazyImgSrc.value;
            onSiteChange(selectedListItem,selectedSite);
        }
    }, false);

    delaymsecs.addEventListener("change", function() {
        if (selectedSite != null) {
            if (!autopagerConfig.isNumeric( delaymsecs.value))
            {
                alert(autopagerUtils.autopagerGetString("inputnumber"));
                delaymsecs.focus();
                return;
            }
            selectedSite.delaymsecs = delaymsecs.value;
            onSiteChange(selectedListItem,selectedSite);
        }
    }, false);
    contentXPath.addEventListener("change", function() {
        if (selectedSite != null) {
            onPathChange();
        }
    }, false);
    lstRemoveXPath.addEventListener("change", function() {
        if (selectedSite != null) {
            onRemovePathChange();
        }
    }, false);
			
    btnAddPath.addEventListener("command", function() {
        xpath = prompt(autopagerUtils.autopagerGetString("inputxpath"),xpath);
        if (xpath!=null && xpath.length>0)
        {
            addListItem(xpath,contentXPath);
            onPathChange();
        }
    }, false);

    btnAddRemovePath.addEventListener("command", function() {
        xpath = prompt(autopagerUtils.autopagerGetString("inputxpath"),xpath);
        if (xpath!=null && xpath.length>0)
        {
            addListItem(xpath,lstRemoveXPath);
            onRemovePathChange();
        }
    }, false);

    btnSiteUp.addEventListener("command", function() {
        if (treeSites.currentIndex > 0) {
            var index = treeSites.currentIndex;
            var treeitem = treeSites.view.wrappedJSObject.getItemAtIndex(treeSites.currentIndex);
            if (treeitem.updateSite != null)
            {
                var updateIndex = getMatchedRepositoryIndex(allSites,treeitem.updateSite);
                if (updateIndex > allSites.length-1 || updateIndex<1)
                    return;
                   
                var curr = allSites[updateIndex];
                allSites[updateIndex] = allSites[updateIndex-1];
                allSites[updateIndex-1] = curr;

                onSiteFilter(siteSearch.value,false,false);
                treeSites.view.selection.select(index-1);
                return;
            }
                   
            var itemParent = treeitem.parentItem();
            var updateSite = itemParent.updateSite;
            if (updateSite.url.length > 0)
                return;
            var siteIndex = autopagerConfig.getSiteIndex(sites,treeitem.site)
            if (siteIndex<=0)
                return;
            sites[siteIndex] = sites[siteIndex-1];
            sites[siteIndex-1] = treeitem.site;
               
            onSiteFilter(siteSearch.value,false,true);
            treeSites.view.selection.select(index-1);
        }
    }, false);
    btnSiteDown.addEventListener("command", function() {
        if (treeSites.currentIndex >= 0) {
            var index = treeSites.currentIndex;
            var treeitem = treeSites.view.wrappedJSObject.getItemAtIndex(treeSites.currentIndex);
            if (treeitem.updateSite != null)
            {
                var updateIndex = getMatchedRepositoryIndex(allSites,treeitem.updateSite);
                if (updateIndex >= allSites.length-1 || updateIndex==-1)
                    return;
                var curr = allSites[updateIndex];
                allSites[updateIndex] = allSites[updateIndex+1];
                allSites[updateIndex+1] = curr;

                onSiteFilter(siteSearch.value,false,false);
                treeSites.view.selection.select(index+1);
                return;

            }
            var itemParent = treeitem.parentItem();
            var updateSite = itemParent.updateSite;
            if (updateSite.url.length > 0)
                return;
            var siteIndex = autopagerConfig.getSiteIndex(sites,treeitem.site)
            if (siteIndex<0 || siteIndex>=sites.length-1)
                return;
            sites[siteIndex] = sites[siteIndex+1];
            sites[siteIndex+1] = treeitem.site;
               
            onSiteFilter(siteSearch.value,false,true);
            treeSites.view.selection.select(index+1);
        }
    }, false);
    btnUp.addEventListener("command", function() {
        if (contentXPath.selectedIndex > 0) {
            var treeitem = contentXPath.getSelectedItem(0);
            var path = treeitem.label;
            var newitem = contentXPath.childNodes[contentXPath.selectedIndex  -1];
            treeitem.label = newitem.label;
            newitem.label = path;
            contentXPath.selectedIndex = contentXPath.selectedIndex -1;
            onPathChange();
        }
    }, false);
    btnDown.addEventListener("command", function() {
        if (contentXPath.selectedIndex >= 0 && contentXPath.selectedIndex <contentXPath.childNodes.length-1 ) {
            var treeitem = contentXPath.getSelectedItem(0);
            var path = treeitem.label;
            var newitem = contentXPath.childNodes[contentXPath.selectedIndex  +1];
            treeitem.label = newitem.label;
            newitem.label = path;
            contentXPath.selectedIndex = contentXPath.selectedIndex +1;
            onPathChange();
        }
    }, false);
    btnFilterUp.addEventListener("command", function() {
        if (lstRemoveXPath.selectedIndex > 0) {
            var treeitem = lstRemoveXPath.getSelectedItem(0);
            var path = treeitem.label;
            var newitem = lstRemoveXPath.childNodes[lstRemoveXPath.selectedIndex  -1];
            treeitem.label = newitem.label;
            newitem.label = path;
            lstRemoveXPath.selectedIndex = lstRemoveXPath.selectedIndex -1;
            onRemovePathChange();
        }
    }, false);
    btnFilterDown.addEventListener("command", function() {
        if (lstRemoveXPath.selectedIndex >= 0 && lstRemoveXPath.selectedIndex <lstRemoveXPath.childNodes.length-1 ) {
            var treeitem = lstRemoveXPath.getSelectedItem(0);
            var path = treeitem.label;
            var newitem = lstRemoveXPath.childNodes[lstRemoveXPath.selectedIndex  +1];
            treeitem.label = newitem.label;
            newitem.label = path;
            lstRemoveXPath.selectedIndex = lstRemoveXPath.selectedIndex +1;
            onRemovePathChange();
        }
    }, false);
    btnEditPath.addEventListener("command", function() {
        if (contentXPath.selectedCount > 0) {
            var treeitem = contentXPath.getSelectedItem(0);
            var xpath = treeitem.label;
            xpath = prompt(autopagerUtils.autopagerGetString("inputxpath"),xpath);
            if (btnAddPath.disabled)
                return;
            if (xpath!=null && xpath.length>0)
            {
                treeitem.label = xpath;
                onPathChange();
            }
        }
    }, false);
    btnDeletePath.addEventListener("command", function() {
        if (contentXPath.selectedCount > 0) {
            var s = contentXPath.selectedIndex
            contentXPath.removeChild(contentXPath.childNodes[contentXPath.selectedIndex]);
            onPathChange();
            contentXPath.selectedIndex = s
        }
    }, false);
    btnEditRemovePath.addEventListener("command", function() {
        if (lstRemoveXPath.selectedCount > 0) {
            treeitem = lstRemoveXPath.getSelectedItem(0);
            xpath = treeitem.label;
            xpath = prompt(autopagerUtils.autopagerGetString("inputxpath"),xpath);
            if (btnAddPath.disabled)
                return;
            if (xpath!=null && xpath.length>0)
            {
                treeitem.label = xpath;
                onRemovePathChange();
            }
        }
    }, false);
    btnDeleteRemovePath.addEventListener("command", function() {
        if (lstRemoveXPath.selectedCount > 0) {
            var s = lstRemoveXPath.selectedIndex
            lstRemoveXPath.removeChild(lstRemoveXPath.childNodes[lstRemoveXPath.selectedIndex]);
            onRemovePathChange();
            lstRemoveXPath.selectedIndex = s
        }
    }, false);
    btnPickLinkPath.addEventListener("command", function() {
        pickupLink();
    }, false);

}
function enableSmartControl(enabled)
{
    grpSmart.disabled = !enabled;
    smarttext.disabled = !enabled;
    smartlinks.disabled = !enabled;
    smartMargin.disabled = !enabled;
    smartmatch.disabled = !enabled;
}
function onPathChange()
{
    if (selectedSite != null) {
        selectedSite.contentXPath = new Array();
        for(var i =0;i<contentXPath.childNodes.length;++i)
        {
            selectedSite.contentXPath.push(contentXPath.childNodes[i].label);
        }
        onSiteChange(selectedListItem,selectedSite);
    }    	
}
function onRemovePathChange()
{
    if (selectedSite != null) {
        selectedSite.removeXPath = new Array();
        for(var i =0;i<lstRemoveXPath.childNodes.length;++i)
        {
            selectedSite.removeXPath.push(lstRemoveXPath.childNodes[i].label);
        }
        onSiteChange(selectedListItem,selectedSite);
    }    	
}
function clearInfo()
{
    selectedSite = null;
    selectedListItem = null;
    urlPattern.value = " ";
    margin.value = autopagerMain.getDefaultMargin();
    minipages.value = -1;
    delaymsecs.value = -1;
    description.value = " ";
    chkEnabled.checked = true;
    chkEnableJS.checked = false;
    chkAjax.checked = false;
    chkneedMouseDown.checked = false;
    chkQuickLoad.checked = false;
    chkFixOverflow.checked = true;
    lblOwner.value = "";
    btnClone.hidden = true;
    btnReset.hidden = true;
    lazyImgSrc.value = ""
}
function updateSourceDetail(updateSite,count)
{
    selectedSource = updateSite
    chkSettingEnabled.checked = updateSite.enabled;
    lbSettinglOwner.value = updateSite.owner;
    settingurl.value = updateSite.url;
    settingtype.value = updateSite.updateType.type;
    settingUpdatePeriod.value = updateSite.updateperiod;
    document.getElementById("settingUpdateContainer").hidden = (!updateSite.url)
    settingxpath.value = updateSite.xpath;
    settingdesc.value =  updateSite.desc;
    rulecount.value =  count;
        
    rulecount.hidden = !autopagerPref.loadBoolPref("show-rulecount")

    var readOnly = updateSite.defaulted;
    chkSettingEnabled.readOnly = readOnly;
    lbSettinglOwner.readOnly = readOnly;
    settingurl.readOnly = readOnly;
    settingtype.disabled = readOnly;
    //settingUpdatePeriod.disabled = readOnly;
    settingxpath.readOnly = readOnly;
    settingdesc.readOnly = readOnly;
    btnSiteUp.disabled =false;
    btnSiteDown.disabled =false;
    document.getElementById("idsPanel").hidden =  (updateSite.updateType.type != "autopager-lite");
}
function updateDetails(event) {
    setTimeout(doUdateDetails,10);
}
function setChangedClass(node,changed)
{
    if (changed)
        node.setAttribute("class",addString(node.getAttribute("class"),"changed"))
    else
        node.setAttribute("class",removeString(node.getAttribute("class"),"changed"))
}
        
function addString(str1,str2)
{
    if (!autopagerUtils.isBlank(str1))
        return str2;
    return str1 + "," + str2
}
function removeString(str1,str2)
{
    if (autopagerUtils.isBlank(str1))
        return "";
    var strs = str1.split(",");
    var newS = "";
    for(var i=0;i<strs.length;i++)
    {
        var s = strs[i];
        if (s!=str2)
        {
            if (newS!="")
                newS += ",";
            newS += s;
        }
    }
    return newS
}

function doUdateDetails(event) {
    if(treeSites.filterIng)
        return;
    if (treeSites.view.selection.getRangeCount() == 0) {
        clearInfo();
    }
    else {
                
        selectedListItem = treeSites.view.wrappedJSObject.getItemAtIndex (treeSites.currentIndex);
        var itemParent = selectedListItem.parentItem();
        var updateSite = itemParent.updateSite;
        if (updateSite == null)
        {
            switchDeck(1);
            enableSiteEditControls(false,false);
            updateSourceDetail(selectedListItem.updateSite,selectedListItem.getChildCount());
            clearInfo();
            return;
        }
        switchDeck(0);
        var enableEdit =  (updateSite.url.length == 0);
        //               if (enableEdit)
        //                    selectedSite = sites[selectedListItem.siteIndex];
        //                else
        selectedSite = autopagerConfig.completeRule(selectedListItem.site);

        if (selectedSite.oldSite == null)
            selectedSite.oldSite = autopagerConfig.cloneSite(selectedSite);
        enableSiteEditControls(enableEdit,selectedSite.changedByYou);
        if (selectedSite == null)
        {
            selectedListItem = null;
            return;
        }
        urlPattern.value = selectedSite.urlPattern;
        isRegex.checked = selectedSite.isRegex;
        margin.value = selectedSite.margin;
        minipages.value = selectedSite.minipages;
        if (selectedSite.lazyImgSrc)
            lazyImgSrc.value = selectedSite.lazyImgSrc
        else
            lazyImgSrc.value = ""
        delaymsecs.value = selectedSite.delaymsecs;
        description.value = "";
        if (selectedSite.desc && selectedSite.desc!="")
            description.value = selectedSite.desc;
        else if (selectedSite.id)
        {
            if (descriptions[selectedSite.id])
            {
                description.value = descriptions[selectedSite.id]
            }
            else
            {
                description.value = "loading"
                var id=selectedSite.id
                try{
                    var xmlhttp
                    xmlhttp=autopagerUtils.newXMLHttpRequest()
                    xmlhttp.overrideMimeType("text/plan");
                    xmlhttp.onreadystatechange = function (aEvt) {
                        if(xmlhttp.readyState == 4) {
                            if(xmlhttp.status == 200) {
                                var value = xmlhttp.responseText
                                description.value = value
                                descriptions[id] = value
                            }
                        }
                    }

                    xmlhttp.open("GET", autopagerPref.loadPref("repository-site") +"d/desc?id=" +selectedSite.id, true);
                    //window.content.status = "loading ... " + url;
                    xmlhttp.send(null);

                }catch (e){
                    description.value = "failed to load"
                }                        
            }
        }
        chkEnabled.checked = selectedSite.enabled;
        chkEnableJS.checked = selectedSite.enableJS>0;
        chkForceJS.checked = selectedSite.enableJS>1;
        chkAjax.checked = selectedSite.ajax
        chkneedMouseDown.checked = selectedSite.needMouseDown
        chkQuickLoad.checked = selectedSite.quickLoad;
        chkFixOverflow.checked = selectedSite.fixOverflow;
        populateXPath(selectedSite.contentXPath,contentXPath);
        linkXPath.value    = selectedSite.linkXPath;
        containerXPath.value    = selectedSite.containerXPath;
        monitorXPath.value    = selectedSite.monitorXPath;
        populateXPath(selectedSite.removeXPath,lstRemoveXPath);
        lstRemoveXPath.value    = selectedSite.removeXPath;
        lblOwner.value = selectedSite.owner;
        checkChanged(selectedSite);
    }
}
function checkChanged(selectedSite) {
    var oldSite = selectedSite.oldSite
    setChangedClass(urlPattern, oldSite!=null && urlPattern.value != oldSite.urlPattern)
    setChangedClass(isRegex, oldSite!=null && isRegex.checked != oldSite.isRegex)
    setChangedClass(margin, oldSite!=null && margin.value != oldSite.margin)
    setChangedClass(minipages, oldSite!=null && minipages.value != oldSite.minipages)
    setChangedClass(delaymsecs, oldSite!=null && delaymsecs.value != oldSite.delaymsecs)
    setChangedClass(description, oldSite!=null && description.value != oldSite.desc)
    setChangedClass(chkEnabled, oldSite!=null && chkEnabled.checked != oldSite.enabled)
    setChangedClass(chkEnableJS, oldSite!=null && ( (oldSite.enableJS !=2 && oldSite.enableJS != chkEnableJS.checked) || chkEnableJS.checked != (oldSite.enableJS >0)))
    setChangedClass(chkForceJS, oldSite!=null && chkForceJS.checked != (oldSite.enableJS>1))
    setChangedClass(chkAjax, oldSite!=null && chkAjax.checked != oldSite.ajax)
    setChangedClass(chkneedMouseDown, oldSite!=null && chkneedMouseDown.checked != oldSite.needMouseDown)
    setChangedClass(chkQuickLoad, oldSite!=null && chkQuickLoad.checked != oldSite.quickLoad)
    setChangedClass(chkFixOverflow, oldSite!=null && chkFixOverflow.checked != oldSite.fixOverflow)
    setChangedClass(contentXPath, oldSite!=null && !autopagerJsonSetting.arrayEqual(selectedSite.contentXPath,oldSite.contentXPath))
    setChangedClass(linkXPath, oldSite!=null && linkXPath.value != oldSite.linkXPath)
    setChangedClass(containerXPath, oldSite!=null && containerXPath.value != oldSite.containerXPath)
    setChangedClass(monitorXPath, oldSite!=null && monitorXPath.value != oldSite.monitorXPath)
    setChangedClass(lstRemoveXPath, oldSite!=null && !autopagerJsonSetting.arrayEqual(selectedSite.removeXPath,oldSite.removeXPath))
    //setChangedClass(urlPattern, oldSite!=null && selectedSite.urlPattern != oldSite.urlPattern)
    setChangedClass(lblOwner, oldSite!=null && lblOwner.value != oldSite.owner)
    setChangedClass(lazyImgSrc, oldSite!=null && !autopagerUtils.equals(lazyImgSrc.value, oldSite.lazyImgSrc))
}    
function switchDeck(index)
{
    settingDeck.selectedIndex = index;
}
function enableSiteEditControls(enableEdit,changedByYou)
{
    btnClone.hidden = enableEdit;
    btnReset.hidden = enableEdit || !changedByYou;
    var disabled = !enableEdit;
    btnPublic.disabled =disabled;
    btnSiteUp.disabled =disabled;
    btnSiteDown.disabled =disabled;
    return;
    btnDelete.disabled =disabled;
    urlPattern.readOnly =disabled;
    isRegex.disabled =disabled;
    margin.readOnly =disabled;
    minipages.readOnly =disabled;
    delaymsecs.readOnly =disabled;
    description.readOnly =disabled;
    btnAddPath.disabled =disabled;
    btnUp.disabled =disabled;
    btnDown.disabled =disabled;
    //btnEditPath.disabled =disabled;
    btnDeletePath.disabled =disabled;
    btnAddRemovePath.disabled =disabled;
    btnPickRemovePath.disabled = disabled
    btnPickContentPath.disabled = disabled
    btnPickContainerPath.disabled = disabled
    btnModifyContainerXPath.disabled = disabled
    btnPickCleanPath.disabled = disabled
    btnModifyCleanPath.disabled = disabled

    btnModifyLinkXPath.disabled = disabled
    //btnEditPath.disabled =disabled;
    btnDeleteRemovePath.disabled =disabled;
        

    btnFilterUp.disabled =disabled;
    btnFilterDown.disabled =disabled;
    contentXPath.readOnly =disabled;
    chkEnabled.disabled =disabled;
    chkEnableJS.disabled =disabled;
    chkForceJS.disabled =disabled;
    chkAjax.disabled =disabled;
    chkneedMouseDown.disabled = disabled;
    chkQuickLoad.disabled =disabled;
    chkFixOverflow.disabled =disabled;
    linkXPath.readOnly =disabled;
    containerXPath.readOnly =disabled;
    btnPickLinkPath.disabled = disabled;
}
function populateXPath(paths,lst)
{
    if (typeof paths=="undefined")
        paths=[]
    //clear
    while (lst.hasChildNodes()) {
        lst.removeChild(lst.childNodes[0]);
    }
    for (var i = 0, path = null; (path = paths[i]); i++) {
        addListItem( path,lst);
    }
}
function addListItem(path,lst)
{
    var listitem = document.createElement("listitem");
    listitem.setAttribute("label", path);
    lst.appendChild(listitem);
}

function populateIgnoreSites(sites,lst)
{
    var ss = sites.split("\n");
    //clear
    while (lst.hasChildNodes()) {
        lst.removeChild(lst.childNodes[0]);
    }
    for (var i = 0, path = null; (path = ss[i]); i++) {
        addListItem( path,lst);
    }
}
function getListValues(lst,separater)
{
    var str=""
    for(var i =0;i<lst.childNodes.length;++i)
    {
        if (i==0)
        {
            str = lst.childNodes[i].label
        }
        else
        {
            if (separater)
                str += separater;
            str += lst.childNodes[i].label;
        }
    }
    return str;
}
function addIgnoreSiteToList(lst)
{
    //fix http://member.teesoft.info/phpbb/viewtopic.php?t=3445
    var url = window.opener.autopagerSelectUrl;
    if (typeof window.opener.autopagerSelectUrl == 'undefined')
        try{
            url = autopagerUtils.currentDocument().location.href;
        }catch(e)
        {}

    var href=url
    var v = prompt("",href);
    if (v)
        addListItem( v,lst);
}
function addValueToList(lst)
{
    var v = prompt();
    if (v)
        addListItem( v,lst);
}
function deleteValueFromList(lst)
{
    if (lst.selectedCount > 0) {
        var s = lst.selectedIndex
        lst.removeChild(lst.childNodes[lst.selectedIndex]);

        lst.selectedIndex = s
    }
}
function editValueFromList(lst)
{
    if (lst.selectedCount > 0) {
        var s = lst.selectedIndex

        var item = lst.childNodes[lst.selectedIndex]
        var v = prompt("",item.label);
        if (v)
            item.label = v
    }
}
function checkMyName()
{
    var myname = mynameText.value;
    if (myname==null || myname.length == 0)
    {
        myname = autopagerMain.changeMyName();
        if (myname==null || myname.length == 0)
        {
            alert(autopagerUtils.autopagerGetString("mustinput"));
            return "";
        }
    }
    mynameText.value = myname;
    return myname;
}
function handleAddSiteButton() {
    var myname = checkMyName();
    if (myname==null || myname.length == 0)
        return;
    		
    var site = autopagerConfig.newSite("http://yourhost/*","your desc"
        ,"//a[contains(.//text(),'Next')]","//body/*",[]);
    site.createdByYou = true;
    site.owner = myname;
    //addSite(site,sites.length -1);
    autopagerConfig.insertAt(sites,0,site);
    onSiteFilter(siteSearch.value,false,true);
}

function handleResetSiteButton()
{
    if (treeSites.currentIndex >= 0) {

        selectedSite = treeSites.view.wrappedJSObject.getItemAtIndex(treeSites.currentIndex).site;
        if (selectedSite == null)
            return;
        var site = autopagerConfig.doCloneSite(selectedSite,selectedSite.oldSite);
        //site.oldSite = null;
        site.changedByYou = false;
        updateDetails();
    }

}
function handleCopySiteButton() {
    if (treeSites.currentIndex >= 0) {
        var myname = checkMyName();
        if (myname==null || myname.length == 0)
            return;

        selectedSite = treeSites.view.wrappedJSObject.getItemAtIndex(treeSites.currentIndex).site;
        if (selectedSite == null)
            return;
        var site = autopagerConfig.cloneSite(selectedSite);
            
        autopagerConfig.insertAt(sites,0,site);
        onSiteFilter(siteSearch.value,false,true);
    }
}
	

function exportSelectedSetting(exportToClipboard)
{
    var exportSites = new Array();
    var start = new Object();
    var end = new Object();
    var numRanges = treeSites.view.selection.getRangeCount();

    for (var t = 0; t < numRanges; t++){
        treeSites.view.selection.getRangeAt(t,start,end);
        for (var v = start.value; v <= end.value; v++){
            var treeitem = treeSites.view.wrappedJSObject.getItemAtIndex(v);
            if (treeitem.site != null)
                exportSites.push(treeitem.site);
        }
    }

    if (exportSites.length > 0) {
        var file = null;
        if (!exportToClipboard)
            file = autopagerConfig.selectFile(autopagerUtils.autopagerGetString("outputfile"),Components.interfaces.nsIFilePicker.modeSave);
        else
        {
            file = Components.classes["@mozilla.org/file/directory_service;1"]
            .getService(Components.interfaces.nsIProperties)
            .get("TmpD", Components.interfaces.nsIFile);
            file.append("autopager.tmp");
            file.createUnique(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, parseInt("0664", 8));
        // do whatever you need to the created file
        //alert(file.path);
        }
                
                
        if (file)
        {
            autopagerConfig.saveConfigToFile(exportSites,file,false);
            if (exportToClipboard)
            {
                var contentStr = autopagerConfig.autopagerGetContents(Components.classes["@mozilla.org/network/io-service;1"]
                    .getService(Components.interfaces.nsIIOService)
                    .newFileURI(file));
                          
                file.remove(true);
                var gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"].
                getService(Components.interfaces.nsIClipboardHelper);
                gClipboardHelper.copyString(contentStr);
            }
        }
    }

}
function handlePublicSiteButton() {
    var start = new Object();
    var end = new Object();
    var numRanges = treeSites.view.selection.getRangeCount();
    var items = new Array();
    for (var t = 0; t < numRanges; t++){
        treeSites.view.selection.getRangeAt(t,start,end);
        for (var v = start.value; v <= end.value; v++){
            items.push(treeSites.view.wrappedJSObject.getItemAtIndex(v));
        }
    }
    if (items.length ==0)
        return;

    //public the first one
    var treeitem = items[0];
    if (treeitem.updateSite != null)
        return;
    var site = treeitem.site;
    if (site.published ||  getMatchedByGuid( site.guid)!=null)
    {
        var msg  = autopagerUtils.autopagerFormatString("alreadpubliced",[ site.urlPattern ]);
        if (!confirm(msg))
        {
            return;
        }
    }
    site.published = true;
    window.autopagerPublicSite=site;
    //        window.opener.autopagerPublicSite=site;
    autopagerRules.setPublishingSite(site);
    //var browser = window.open("http://www.teesoft.info/aprules/submit");
    //var browser = window.open("http://local-ap.teesoft.info/aprules/new/");
    var url=autopagerPref.loadPref("repository-site");
    url = url + "new?apv=" + autopagerUtils.version + "&id=&f=" + (new Date().getTime());
    autopagerBwUtil.autopagerOpenIntab(url);
        
}
    
function handleDeleteSiteButton() {
    var start = new Object();
    var end = new Object();
    var numRanges = treeSites.view.selection.getRangeCount();
    var items = new Array();
    var minIndex = 100000;
    for (var t = 0; t < numRanges; t++){
        treeSites.view.selection.getRangeAt(t,start,end);
        for (var v = start.value; v <= end.value; v++){
            if (start.value<minIndex)
                minIndex = start.value;
            items.push(treeSites.view.wrappedJSObject.getItemAtIndex(v));
        }
    }
    if (items.length ==0)
        return;
    var nodeIndex = minIndex-1;
       
    var alertDisable = false;
    for(var i=items.length-1;i>=0;i--)
    {
        var selectedListItem = items[i];
        var siteItem = selectedListItem.site;
        var itemParent = items[i].parentItem();
        var updateSite = itemParent.updateSite;
        if (updateSite.filename == "autopager.xml")
            autopagerUtils.removeFromArray(sites,siteItem);
        else
        {
            if (updateSite.filename == "autopagerLite.xml")
            {
                autopagerUtils.removeFromArray(itemParent.sites,siteItem);
                autopagerLite.removeId(siteItem.guid);
            }
            else
            {
                if (siteItem.oldSite == null)
                    siteItem.oldSite = autopagerConfig.cloneSite(siteItem);
                siteItem.enabled = false;
                onSiteChange(selectedListItem,siteItem,false);
                alertDisable = true;
            }
        }            
    }
    if (alertDisable)
    {
        alert(autopagerUtils.autopagerGetString("Disableinsteadofremove"));        
    }
    onSiteFilter(siteSearch.value,false,true);
    treeSites.view.selection.select(nodeIndex);
//chooseTreeItem(node);

}
function deleteItem(item)
{
{
    var treeitem = item;
    if (treeitem.updateSite != null)
        return;
    var itemParent = treeitem.parentItem();
    var updateSite = itemParent.updateSite;
    if (updateSite.url.length > 0)
        return;
    //todo:notify users that he can't modify these online imported configurations
    var node = treeitem.nextSibling;
    if (node==null)
        node = treeitem.previousSibling;
    if (node==null)
        node = treeitem.parentItem();
    //var site = treeitem.site;
    autopagerConfig.removeFromArray(sites,treeitem.site);
    treeitem.parentNode.removeChild(treeitem);
}

}
function onSiteFilter(filter,reload,select)
{
    updateSearchStatus(filter);
    treeSites.filterIng = true;
    var url = urlPattern.value;
    while(treebox.childNodes.length>0)
    {
        //remove from end
        treebox.removeChild(treebox.childNodes[treebox.childNodes.length-1]);
    }
    var selectFilter = ""
    if (select)
    {
        if (!filter || filter=="")
            selectFilter = treebox.oldFilter
        else
        {
            selectFilter = filter
            treebox.oldFilter = filter
        }
    }
            
    populateChooser(filter,reload,selectFilter);
    treeSites.filterIng = false;  
}
function updateSearchStatus(filter)
{
    try
    {
        siteSearch._searchIcons.selectedIndex = (!filter)?0:1;
    } catch(e){
    }         
}

function addTreeParent(treebox,updateSite)
{
    var treeitem = addNode(treebox,"treeitem");
    treeitem.updateSite = updateSite;
            
    treeitem.setAttribute("container", "true");
    treeitem.setAttribute("open","true");// (updateSite.url.length==0));
    var treerow = addNode(treeitem,"treerow");
    var treecell = addNode(treerow,"treecell");
    treecell.setAttribute("label", updateSite.filename);
    treecell = addNode(treerow,"treecell");
    treecell.setAttribute("label", updateSite.desc);
    return addNode(treeitem,"treechildren");
}
function addTreeItem(treebox,site,siteIndex)
{
    var treeitem = addNode(treebox,"treeitem");
    var treerow = addNode(treeitem,"treerow");
    var treecell = addNode(treerow,"treecell");
    treecell.setAttribute("label", site.urlPattern);
    treecell.setAttribute("properties","status" + getColor(site));
    treecell = addNode(treerow,"treecell");
    treecell.setAttribute("label", site.desc);
    treecell.setAttribute("properties","status" + getColor(site));
 
    treeitem.site = site;
    treeitem.siteIndex = siteIndex;
    //treerow.setAttribute("properties","statusgreen");
    return treeitem;
}
function populateChooser(filter,reload,select) {
    //            var t = new Date().getTime();
    var userSites = null;
    if(reload)
    {
        hashSites = AutoPagerNS.UpdateSites.loadAll();
        allSites = [];
        for(var key in hashSites)
        {
            if (hashSites[key]!=null)
                allSites.push(hashSites[key]);
        }
        try{
            userSites = autopagerConfig.reLoadConfig(hashSites, hashSites["autopager.xml"].updateSite);//  allSites["autopager.xml"] ;
        }catch(e)
        {
        }
        if (userSites == null)
            userSites = new Array();
        sites = autopagerConfig.cloneSites(userSites);
        sites.updateSite = userSites.updateSite;
    //allSites["autopager.xml"] = sites;
                
    }
    else
        userSites = hashSites["autopager.xml"] ;

    //allSites["autopager.xml"]  = sites
    var levels = getAutoPagerTree(allSites,sites,filter,select);
    treeSites.view = levels[0].wrappedJSObject;
    if (select && levels.selected && treeSites.view)
        treeSites.view.wrappedJSObject.selectItem(levels.selected)
}
function addNode(pNode,name)
{
    var node = document.createElement(name);
    pNode.appendChild(node);
    return node;
}
function addSite(site,siteIndex)
{
    var treebox = userModifiableTreeChildren;
    var addedItem = addTreeItem(treebox,site,siteIndex);
    chooseTreeItem(addedItem);
}
function getColor(site)
{
    var color='';
    if (!(typeof site.enabled=="undefined") && !site.enabled) {
        color = 'gray';
    }
    else if(site.published)
    {
        color = "darkgreen";
    }else if(site.createdByYou)
    {
        color = "green";
    }else if(site.changedByYou)
    {
        color = "blue";
    }
    return color;
}
function chooseSite(index) {
    //treeSites.boxObject.ensureRowIsVisible(index);
    var boxobject = treeSites.boxObject;
    boxobject.QueryInterface(Components.interfaces.nsITreeBoxObject);
    //boxobject.scrollToRow(index);
        
    boxobject.ensureRowIsVisible(index);
    treeSites.view.selection.select(index);
    treeSites.focus();
}
function chooseTreeItem(treeitem) {
    var index = treeSites.view.getIndexOfItem(treeitem);
    chooseSite(index);
}
function checkurlPattern  (chkIsRegex,urlPattern,site)
{
    var url = null;
    if (site.testLink && site.testLink.length>0)
    {
        url = site.testLink[0];
    }
    if (!url && window.opener)
    {
        url = window.opener.autopagerSelectUrl;
    }
    if (!url)
    {
        urlPattern.style.color = "";
    }

    var regex = null;
    try{
        if (chkIsRegex.checked)
        {
            regex = new RegExp(urlPattern.value);
        }else
        {
            regex = autopagerUtils.convert2RegExp(urlPattern.value);
        }
        if (url)
        {
            if (regex.test(url))
                urlPattern.style.color = "green";
            else
            {
                urlPattern.style.color = "red";
            }
        }
    }catch(e)
    {
        urlPattern.style.color = "red";
    }

}
function pickupLink ()
{
    //autopagerUtils.currentWindow().toggleSidebar('autopagerSiteWizardSidebar',true);
    autopagerSelector.clearFunctions();
    autopagerSelector.registorSelectFunction(function (elem){

        var doc = elem.ownerDocument;

        var nodes = [];
        nodes.push(elem);

        var links = [];
        links = autopagerXPath.discoveryMoreLinks(doc,links,nodes);
        window.focus();
        if (links.length>0)
        {
            linkXPath.value = links[0].xpath
            var newCmdEvent = document.createEvent('Events');
            newCmdEvent.initEvent('change',true, true);
            linkXPath.dispatchEvent(newCmdEvent)
        }

    })

    autopagerSelector.registorStartFunction(function (){
        //autopagerUtils.currentBrowser().ownerDocument.getElementById("xpathDeck").selectedIndex = 1;
        });
    autopagerSelector.registorQuitFunction(function (){
        //autopagerUtils.currentBrowser().ownerDocument.getElementById("xpathDeck").selectedIndex = 0;
        });

    autopagerSelector.start(autopagerUtils.currentBrowser());
}
function pickupContentForList(id)
{
    //autopagerUtils.currentWindow().toggleSidebar('autopagerSiteWizardSidebar',true);
    autopagerSelector.clearFunctions();
    autopagerSelector.registorSelectFunction(function (elem){

        var doc = elem.ownerDocument;

        var nodes = [];
        nodes.push(elem);

        var links = [];
        links = autopagerXPath.discoveryMoreLinks(doc,links,nodes);
        window.focus();
        if (links.length>0)
        {
            addListItem(links[0].xpath,document.getElementById(id));
            var newCmdEvent = document.createEvent('Events');
            newCmdEvent.initEvent('change',true, true);
            document.getElementById(id).dispatchEvent(newCmdEvent)
        }

    })

    autopagerSelector.registorStartFunction(function (){
        //autopagerUtils.currentBrowser().ownerDocument.getElementById("xpathDeck").selectedIndex = 1;
        });
    autopagerSelector.registorQuitFunction(function (){
        //autopagerUtils.currentBrowser().ownerDocument.getElementById("xpathDeck").selectedIndex = 0;
        });

    autopagerSelector.start(autopagerUtils.currentBrowser());
}
function pickupContent (id)
{
    //autopagerUtils.currentWindow().toggleSidebar('autopagerSiteWizardSidebar',true);
    autopagerSelector.clearFunctions();
    autopagerSelector.registorSelectFunction(function (elem){

        var doc = elem.ownerDocument;

        var nodes = [];
        nodes.push(elem);

        var links = [];
        links = autopagerXPath.discoveryMoreLinks(doc,links,nodes);
        window.focus();
        if (links.length>0)
        {
            document.getElementById(id).value = links[0].xpath
            var newCmdEvent = document.createEvent('Events');
            newCmdEvent.initEvent('change',true, true);
            document.getElementById(id).dispatchEvent(newCmdEvent)
        }

    })

    autopagerSelector.registorStartFunction(function (){
        //autopagerUtils.currentBrowser().ownerDocument.getElementById("xpathDeck").selectedIndex = 1;
        });
    autopagerSelector.registorQuitFunction(function (){
        //autopagerUtils.currentBrowser().ownerDocument.getElementById("xpathDeck").selectedIndex = 0;
        });

    autopagerSelector.start(autopagerUtils.currentBrowser());
}
        
function getMatchedRepositoryIndex(allSites , updateSite)
{
    var updateIndex = -1;
    for(var i=0;i<allSites.length;i++)
    {
        if (allSites[i].updateSite == updateSite)
        {
            updateIndex = i;
            break;
        }
    }
    return updateIndex;
}
function getAllRepository(allSites)
{
    var repositories = new Array();
    for (var i= allSites.length-1;i>=0;i--){
        if (allSites[i].updateSite.filename=="smartpaging.xml" || allSites[i].updateSite.filename=="testing.xml")
            continue;
        repositories.push(allSites[i].updateSite)
    }
    return repositories;
}
function getEnableJS()
{
    var enableJS = false
    if (chkEnableJS.checked)
        enableJS = true;
    if (chkForceJS.checked)
        enableJS = 2;
    return enableJS;
}