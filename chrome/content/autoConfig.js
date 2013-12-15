AutoPagerNS.UpdateSites=
    {
    updateSites: null,
    submitCount:0,
    AutopagerCOMP:null,
    updatedCount: 0,
    init:function()
    {
        if (this.updateSites == null || this.AutopagerCOMP==null)
        {
            this.updateSites = this.getUpdateSites();
        }
    },
    getAutopagerCOMP : function()
    {
        if (this.AutopagerCOMP==null)
        try{
            this.AutopagerCOMP = autopagerRules.getAutopagerCOMP();
        }catch(e){
            autopagerBwUtil.consoleError(e);
        }
            
        return this.AutopagerCOMP;
    },
    getUpdateSites : function()
    {
        var sites = this.getAutopagerCOMP().getUpdateSites();
        if (sites==null || sites.length==0)
        {

            sites = AutoPagerNS.AutoPagerUpdateTypes.getUpdateSites();
            this.getAutopagerCOMP().setUpdateSites(sites);
        }
        return sites;
    },
    updateSiteOnline :function (updatesite,force,error)
    {
        if (!autopagerRules.isAllowUpdate())
            return;
        AutoPagerNS.UpdateSites.submitCount ++;
        var needUpdate = force;
        if (!force)
        {
            var updateperiod = updatesite.updateperiod;
            if (updateperiod == -2) //global
                updateperiod = autopagerPref.loadPref("update");

            if (updateperiod == "-1")
                needUpdate = true;
            else if (0 == updateperiod)
            {
                var allSettings = AutoPagerNS.UpdateSites.loadAll();
                needUpdate = allSettings[updatesite.filename].length<=0;
            }
            else
            {
                var today = new Date();
                var lastUpdate = updatesite.lastupdate;
                var lasttry = updatesite.lasttry;
                if (typeof lastUpdate=="undefined" || lastUpdate==null || lastUpdate=="null" || lastUpdate.length == 0 || (today.getTime() - lastUpdate) /(1000 * 60 * 60) > updateperiod)
                {
                    //try if not try in last 1 minutes
                    if (typeof lasttry=="undefined" || lasttry==null || lasttry.length == 0 || (today.getTime() - lasttry) /(1000 * 60) > 1)
                    {
                        needUpdate = true;
                        updatesite.lasttry = today.getTime();
                    }
                }
                //alert(updatesite.filename + " " + (today.getTime() - lastUpdate) /(1000 * 60 * 60))
            }
        }
        //        autopagerBwUtil.consoleLog("needUpdate:" + needUpdate)
        if (needUpdate)
        {            
            AutoPagerNS.apxmlhttprequest.xmlhttprequest( this.getUrl(updatesite.url,force,error,updatesite.fullUpdate),updatesite.contenttype,this.callback,this.onerror,updatesite);
            //alert("update " + updatesite.filename)
        }
    },
    updateSiteOnlineBackup :function (updatesite,error)
    {
        if (updatesite.backupUrls!=null &&  updatesite.triedBackup < updatesite.backupUrls.length)
            AutoPagerNS.apxmlhttprequest.xmlhttprequest( this.getUrl(updatesite.backupUrls[updatesite.triedBackup],true,error,updatesite.fullUpdate),updatesite.contenttype,this.callback,this.onerror,updatesite);
    },
    getUrl : function (url,force,error,fullupdate)
    {
        var all=0;
        if (autopagerPref.loadBoolPref("include-unsafe-rules"))
            all=1;
        var t='';
        if (force)
            t +=  (new Date()).getTime() + "&apForce=1";
        if (error!=0)
            t += (new Date()).getTime() + "&apError=" + error;
        if (!force && fullupdate)
        {
            fullupdate = Math.ceil(fullupdate/1000);
            t += "&ft=" + fullupdate;
        }

        url = url.replace(/\{version\}/,autopagerUtils.version).replace(/\{timestamp\}/,t).replace(/\{all\}/,all);
        var ids = autopagerPref.loadUTF8Pref("ids");
        if (!autopagerPref.loadBoolPref("with-lite-recommended-rules"))
            ids = ids + "&ir=false";
        url = url.replace(/\{ids\}/,ids);
        return url;
    },
    updatePatternOnline :function (force)
    {
        if (!autopagerRules.isAllowUpdate() || !autopagerPref.loadBoolPref("with-lite-discovery"))
            return;
        var needUpdate = force;
        var today = new Date();
        if (!force)
        {
            var updateperiod = autopagerPref.loadPref("update");

            if (updateperiod == "-1")
                needUpdate = true;
            else if (0 == updateperiod)
            {
                var patterns = this.getAutopagerCOMP().getPatterns();
                needUpdate = patterns==null || patterns.length==0;
            }
            else
            {
                var lastUpdate = autopagerPref.loadPref("pattern-update-date");
                var lasttry = autopagerPref.loadPref("pattern-lasttry-date");
                if (typeof lastUpdate=="undefined" || lastUpdate==null || lastUpdate=="null" || lastUpdate.length == 0 || (today.getTime() - lastUpdate) /(1000 * 60 * 60) > updateperiod)
                {
                    //try if not try in last 1 minutes
                    if (typeof lasttry=="undefined" || lasttry==null || lasttry.length == 0 || (today.getTime() - lasttry) /(1000 * 60) > 1)
                    {
                        needUpdate = true;
                    }
                }
            }
        }
        if (needUpdate)
        {
            //            var lastUpdate = autopagerPref.loadPref("pattern-update-date");
            autopagerPref.savePref("pattern-lasttry-date",today.getTime());
            var url = "http://rep.teesoft.info/autopager/patterns/?approvedOnly=0&version={version}&lastupdate={timestamp}&all={all}";
            if (autopagerLite.isInLiteMode())
                url = "http://rep.teesoft.info/autopager/patterns/?version={version}&lastupdate={timestamp}&all={all}";
            AutoPagerNS.apxmlhttprequest.xmlhttprequest( this.getUrl(url,force,0)
            ,"application/json; charset=utf-8"
            ,function(str,options){
                AutoPagerNS.UpdateSites.getAutopagerCOMP().setPatterns(autopagerBwUtil.decodeJSON(str));
                autopagerBwUtil.saveContentToConfigFile(str,"autopager-patterns.json");
                autopagerPref.savePref("pattern-update-date",today.getTime());
            }
            ,function(){
                var str = autopagerBwUtil.getConfigFileContents("autopager-patterns.json","utf-8");
                AutoPagerNS.UpdateSites.getAutopagerCOMP().setPatterns(autopagerBwUtil.decodeJSON(str));
            },{});
            //alert("update " + updatesite.filename)
        }
        else
        {
            var str = autopagerBwUtil.getConfigFileContents("autopager-patterns.json","utf-8");
            AutoPagerNS.UpdateSites.getAutopagerCOMP().setPatterns(autopagerBwUtil.decodeJSON(str));
        }

    },
    updateOnline :function (force)
    {
        if (!autopagerRules.isAllowUpdate())
            return;
        if (force || AutoPagerNS.UpdateSites.updatedCount<=0)
        {
            AutoPagerNS.UpdateSites.updatedCount=0;
            this.init();
            AutoPagerNS.UpdateSites.submitCount=0;
            var updateSites = AutoPagerNS.UpdateSites.getUpdateSites();
            for(var i=0;i<updateSites.length;i++)
            {
                var site= updateSites[i];
                if ( (force || site.enabled) && site.url.length >0)
                {
                    site.triedTime = 0;
                    site.triedBackup = 0;
                    if (site.enabled)
                        this.updateSiteOnline(site,force,0);
                }
            }
        }
        this.updatePatternOnline(force);
    },
    updateRepositoryOnline :function (repositoryName,force)
    {
        if (force || AutoPagerNS.UpdateSites.updatedCount<=0)
        {
            AutoPagerNS.UpdateSites.updatedCount=0;
            this.init();
            AutoPagerNS.UpdateSites.submitCount=0;
            for(var i=0;i<this.updateSites.length;i++)
            {
                var site= this.updateSites[i];
                if (site.filename != repositoryName)
                    continue;

                if ( (force || site.enabled) && site.url.length >0)
                {
                    site.triedTime = 0;
                    site.triedBackup = 0;
                    this.updateSiteOnline(site,force,0);
                }
            }
        }
    },
    onerror:function(doc,obj)
    {
        //TODO:notification the update failed
        AutoPagerNS.UpdateSites.submitCount--;
        if (AutoPagerNS.UpdateSites.submitCount<=0)
            autopagerPref.savePref("lastupdate",(new Date()).getTime());

        if (obj.triedTime < 2)
        {
            obj.triedTime ++;
            //try 2 times
            AutoPagerNS.getContentWindow().setTimeout(function(){
                AutoPagerNS.UpdateSites.updateSiteOnline(obj,true,obj.triedTime)
            },10);

        }
        else
            if (obj.backupUrls!=null &&  obj.triedBackup < obj.backupUrls.length)
        {
            AutoPagerNS.getContentWindow().setTimeout(function(){
                obj.triedBackup ++;
                AutoPagerNS.UpdateSites.updateSiteOnlineBackup(obj,obj.triedBackup * -1)
            },10);
        }
    },
    callback:function(doc,updatesite)
    {
        //        autopagerBwUtil.consoleLog("callback:" + updatesite + " " + doc)
        var sites = updatesite.callback(doc,updatesite);
        if (sites==null || sites.length==0)
            return;

        sites.updateSite = updatesite;
        var file = autopagerBwUtil.getConfigFile(updatesite.filename.replace(/\.xml/,".json"));
        if (file)
        {
            autopagerConfig.saveConfigToJsonFile(sites,file,true);
            var jsonOverridefile = updatesite.filename.replace(/\.xml/,".json.override");
            try{
                if (updatesite.filename != "autopager.xml")
                {
                    var overrideContents= autopagerBwUtil.getConfigFileContents(jsonOverridefile);
                    if (overrideContents!=null && overrideContents.length>0)
                    {
                        var overrides = autopagerBwUtil.decodeJSON(overrideContents);
                        autopagerJsonSetting.mergeOverrides(updatesite,sites,overrides);
                    }
                }
            }catch(e)
            {
                autopagerBwUtil.consoleError(e);
            }
        }
        AutoPagerNS.UpdateSites.submitCount--;
        //if (AutoPagerNS.UpdateSites.submitCount<=0)
        autopagerPref.savePref("lastupdate",(new Date()).getTime());
        updatesite.lastupdate = (new Date()).getTime();
        if (!sites.partlyUpdated)
            updatesite.fullUpdate = (new Date()).getTime();
        updatesite.ruleCount = sites.length;        
        var allSites = AutoPagerNS.UpdateSites.loadAll();
        allSites[updatesite.filename] = sites;
        AutoPagerNS.UpdateSites.AutopagerCOMP.setAll(allSites);//notify update
        //        alert("start save " + updatesite.filename);
        var settings = AutoPagerNS.UpdateSites.getUpdateSites();
        AutoPagerNS.AutoPagerUpdateTypes.saveSettingSiteConfig(settings);
        //        alert("saved " + updatesite.filename);
        AutoPagerNS.UpdateSites.updateSites = AutoPagerNS.UpdateSites.getUpdateSites();
        //autopagerMain.handleCurrentDoc();
        AutoPagerNS.UpdateSites.updatedCount++;
    },
    defaultSite : function()
    {
        return AutoPagerNS.UpdateSites.updateSites[AutoPagerNS.UpdateSites.updateSites.length-3].url;
    },
    loadAll:function()
    {
        var allSiteSetting = this.getAutopagerCOMP().loadAll();
                
        if (allSiteSetting == null || !allSiteSetting["autopager.xml"])
        {
            allSiteSetting = {};
            //allSiteSetting.length=0;
            allSiteSetting["testing.xml"] = null;
            var updateSites = AutoPagerNS.UpdateSites.getUpdateSites();
            for(var i=updateSites.length-1;i>=0;i--)
            {
                var sites = autopagerConfig.reLoadConfig(allSiteSetting,updateSites[i]);
                allSiteSetting[updateSites[i].filename] = sites;
                //allSiteSetting.length++;
            }
            this.getAutopagerCOMP().setAll(allSiteSetting);
        }
        return this.getAutopagerCOMP().loadAll();
    },
    getMatchedSiteConfig: function(allSites,url,count)
    {
        var newSites = new Array();
        var key;
        for ( key in allSites){
            //alert(key)
            var tmpsites = allSites[key];
            if (tmpsites==null || !tmpsites.updateSite.enabled)
                continue;
            for (var i = 0; i < tmpsites.length; i++) {
                var site = tmpsites[i];
                var pattern = autopagerUtils.getRegExp(site);
                if (pattern.test(url)) {
                    var newSite = autopagerConfig.cloneSite (site);
                    newSite = autopagerConfig.completeRule(newSite)
                    newSite.updateSite = tmpsites.updateSite;
                    newSites.push(newSite);
                    if (count == newSites.length)
                        return newSites;
                }
            }
        }
        return newSites;

    },
    getMatchedSiteConfigByGUID: function(allSites,guid,includeLocal,count)
    {
        var newSites = new Array();
        var key;
        for ( key in allSites){
            var tmpsites = allSites[key];
            if (tmpsites==null || !tmpsites.updateSite.enabled)
                continue;
            if (!includeLocal && (tmpsites.updateSite.filename == 'autopager.xml'))
                continue;

            for (var i = 0; i < tmpsites.length; i++) {
                var site = tmpsites[i];
                if (site.guid == guid) {
                    var newSite = autopagerConfig.cloneSite (site);
                    newSite.updateSite = tmpsites.updateSite;
                    newSites.push(newSite);
                    if (count == newSites.length)
                        return newSites;
                }
            }
        }
        return newSites;

    }
};

AutoPagerNS.Site = function()
{
//    this.urlPattern  = null;
//    this.regex = null;
//    this.isRegex = false;
//    this.enabled  = true;
//    this.enableJS  = false;
//    this.quickLoad = true;
//    this.fixOverflow  = false;
//    this.createdByYou  = false;
//    this.changedByYou  = false;
//    this.owner  = "";
//    this.contentXPath = [];//["//div[@class='g']"];
//
//    this.linkXPath = "//a[contains(.//text(),'Next')]";
//    this.containerXPath="";
//    this.monitorXPath="";
//    this.removeXPath=[];
//    //this.desc = null;
//    this.testLink = [];
//    this.oldSite = null;
//    this.margin = autopagerMain.getDefaultMargin();
//
//    this.maxLinks = -1;
//    this.isTemp = false;
//    this.tmpPaths = [];
//    this.guid = "";
//    this.ajax=false;
//    this.needMouseDown = false;
//    this.published = false;
//    this.minipages = -1;
//    this.delaymsecs = -1;
}

AutoPagerNS.SiteConfirm=function()
{
    this.guid = "";
    this.host = "";
    this.AllowedPageCount = -1;
    this.UserAllowed = false;
}


var autopagerConfig =
    {
    autoSites : null,
    autopagerDomParser : autopagerBwUtil.newDOMParser(),
    saveConfirmToFile : function(sites,saveFile) {
        try{
            var doc = document.implementation.createDocument("", "autopager", null);
            doc.firstChild.appendChild(doc.createTextNode("\n"))

            for (var i = 0, siteObj = null; (siteObj = sites[i]); i++) {
                var siteNode = doc.createElement("site-confirm");

                autopagerConfig.createNode(siteNode,"guid",siteObj.guid);
                autopagerConfig.createNode(siteNode,"host",siteObj.host);
                autopagerConfig.createNode(siteNode,"AllowedPageCount",siteObj.AllowedPageCount);
                autopagerConfig.createNode(siteNode,"UserAllowed",siteObj.UserAllowed);
                doc.firstChild.appendChild(siteNode);
                doc.firstChild.appendChild(doc.createTextNode("\n"));
            }

            var configStream = autopagerConfig.getWriteStream(saveFile);
            new window.XMLSerializer().serializeToStream(doc, configStream, "utf-8");
            configStream.close();
        }catch(e)
        {
            autopagerBwUtil.consoleError(e);
        }
    },
    saveConfirm : function(sites) {
        this.saveConfirmToFile(sites, autopagerBwUtil.getConfigFile("site-confim.xml"));
    }
    ,
    getConfigFile : function(fileName) {
        var file = this.getConfigDir();
        file.append(fileName);
        if (!file.exists()) {
            file.create(Components.interfaces.nsIFile.FILE_TYPE, parseInt("0755", 8));
        }

        return file;
    },

    getConfigDir : function() {
        try{
            var file = Components.classes["@mozilla.org/file/directory_service;1"]
            .getService(Components.interfaces.nsIProperties)
            .get("ProfD", Components.interfaces.nsILocalFile);
            file.append("autopager");
            if (!file.exists()) {
                file.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, Components.interfaces.nsIFile);
            }
        }catch(e)
        {
            autopagerBwUtil.consoleError(e);
        }
        return file;

    },
    loadConfirmFromStr : function(configContents) {
        var sites = new Array();
        try{
            var doc = this.autopagerDomParser.parseFromString(configContents, "text/xml");
            var nodes = doc.evaluate("/autopager/site-confirm", doc, null, 0, null);
            for (var node = null; (node = nodes.iterateNext()); ) {
                var site = new AutoPagerNS.SiteConfirm();

                for (var i = 0, childNode = null; (childNode = node.childNodes[i]); i++) {
                    var v = autopagerConfig.getValue(childNode);
                    if (childNode.nodeName == "guid") {
                        site.guid = v;
                    }else  if (childNode.nodeName == "AllowedPageCount") {
                        site.AllowedPageCount = v;
                    }else  if (childNode.nodeName == "host") {
                        site.host = v;
                    }
                    else if (childNode.nodeName == "UserAllowed") {
                        site.UserAllowed	= (v == 'true' || v == '1');
                    }
                }
                sites.push(site);
            }
        }catch(e)
        {
            autopagerBwUtil.consoleError(e);
        }
        return sites;
    }
    ,
    getConfirm : function() {
        var confirms = AutoPagerNS.UpdateSites.AutopagerCOMP.getSiteConfirms();
        if (confirms == null || confirms.length==0)
        {
            var confirmContents="";
            try{
                confirmContents= autopagerBwUtil.getConfigFileContents("site-confim.xml");
            }catch(e)
            {
                autopagerBwUtil.consoleError(e);
            }
            confirms = this.loadConfirmFromStr(confirmContents);
            AutoPagerNS.UpdateSites.AutopagerCOMP.setSiteConfirms(confirms);
        }
        return confirms;
    }
    ,
    findConfirm : function(confirmSites,guid,host)
    {
        for(var i=0;i<confirmSites.length;i++)
        {
            if (confirmSites[i].guid == guid
                && confirmSites[i].host == host  )
            {
                return confirmSites[i];
            }
        }
        return null;
    }
    ,
    addConfirm : function(confirmSites,guid,countNumber,host,enabled)
    {
        for(var i=0;i<confirmSites.length;i++)
        {
            if (confirmSites[i].guid == guid
                && confirmSites[i].host == host  )
            {
                confirmSites[i].AllowedPageCount = countNumber;
                confirmSites[i].UserAllowed = enabled;
                return;
            }
        }
        var site = new AutoPagerNS.SiteConfirm();
        site.guid = guid;
        site.host = host;
        site.AllowedPageCount = countNumber;
        site.UserAllowed = enabled;
        confirmSites.push(site);
        AutoPagerNS.UpdateSites.AutopagerCOMP.setSiteConfirms(confirmSites);
    },
    isNumeric : function (strNumber)
    {
        var  newPar=/^(\+|\-)?\d+(\.\d+)?$/
        return  newPar.test(strNumber);
    }
    // Array.insert( index, value ) - Insert value at index, without overwriting existing keys
    ,
    insertAt : function (sites, index, site ) {
        sites.push(site);
        if( index>=0 && index<sites.length) {
            for(var i=sites.length -1;i>index;i--)
            {
                sites[i] = sites[i-1];
            }
            sites[index] = site;
            return sites;
        }
    },
    generateGuid : function()
    {
        var result, i;
        result = '';
        for(i=0; i<32; i++)
        {
            if( i >4  && i % 4 == 0)
                result = result + '-';
            result +=Math.floor(Math.random()*16).toString(16).toUpperCase();
        }
        return result
    }
    , cloneSite : function(site)
    {
        var newSite = new AutoPagerNS.Site();
        return autopagerConfig.doCloneSite(newSite,site);
    },
    doCloneSite : function(newSite,site)
    {
        newSite.urlPattern  = site.urlPattern;
        //newSite.regex  = site.regex;

        newSite.guid  = site.guid;
        if (site.id)
            newSite.id  = site.id;
        newSite.isRegex  = site.isRegex;
        newSite.margin  = site.margin;
        newSite.minipages  = site.minipages;
        newSite.delaymsecs  = site.delaymsecs;
        newSite.enabled  = site.enabled;
        newSite.enableJS  = site.enableJS;
        newSite.ajax  = site.ajax;
        newSite.needMouseDown  = site.needMouseDown;
        newSite.published = site.published;
        newSite.quickLoad  = site.quickLoad;
        newSite.fixOverflow  = site.fixOverflow;
        if (site.createdByYou)
            newSite.createdByYou  = site.createdByYou;
        if (site.changedByYou)
            newSite.changedByYou  = site.changedByYou;
        newSite.owner  = site.owner;
        newSite.contentXPath = [];
        if (site.contentXPath)
            for(var i=0;i<site.contentXPath.length;++i)
                newSite.contentXPath[i] = site.contentXPath[i];

        newSite.testLink = [];
        if (site.testLink)
        {
            newSite.testLink = []
            for(var i=0;i<site.testLink.length;++i)
                newSite.testLink[i] = site.testLink[i];
        }

        if (site.removeXPath)
        {
            newSite.removeXPath = [];
            for(var i=0;i<site.removeXPath.length;++i)
                newSite.removeXPath[i] = site.removeXPath[i];
        }

        newSite.linkXPath = site.linkXPath;
        newSite.containerXPath = site.containerXPath;
        newSite.monitorXPath = site.monitorXPath;

        if (site.desc)
            newSite.desc = site.desc;

        if (typeof site.formatVersion != 'undefined')
            newSite.formatVersion = site.formatVersion;
        newSite.oldSite = site;
        newSite.isTemp = site.isTemp;
        newSite.tmpPaths = site.tmpPaths;
        newSite.maxLinks = site.maxLinks;
        if (!autopagerUtils.isBlank(site.lazyImgSrc))
            newSite.lazyImgSrc = site.lazyImgSrc;
        if (!autopagerUtils.isBlank(site.keywordXPath))
            newSite.keywordXPath = site.keywordXPath;
        if (!autopagerUtils.isBlank(site.alertsHash))
            newSite.alertsHash = site.alertsHash;
        newSite.rate = site.rate;
        return newSite;
    }
    ,
    isChanged : function(site)
    {
        if (site.oldSite == null)
            return true;
        else
        {
            site = this.completeRule(site);
            var oldSite = this.completeRule(site.oldSite);
            if (oldSite.urlPattern  != site.urlPattern
                || oldSite.id  != site.id
                || oldSite.guid  != site.guid
                || oldSite.isRegex  != site.isRegex
                || oldSite.margin  != site.margin
                || oldSite.minipages  != site.minipages
                || oldSite.delaymsecs  != site.delaymsecs
                || oldSite.enabled  != site.enabled
                || oldSite.enableJS  != site.enableJS
                || oldSite.published  != site.published
                || oldSite.ajax  != site.ajax
                || oldSite.needMouseDown  != site.needMouseDown
                || oldSite.quickLoad  != site.quickLoad
                || oldSite.fixOverflow  != site.fixOverflow
                || oldSite.owner  != site.owner
                || oldSite.linkXPath != site.linkXPath
                || oldSite.containerXPath != site.containerXPath
                || oldSite.monitorXPath != site.monitorXPath
                || oldSite.removeXPath.length != site.removeXPath.length
                || oldSite.desc != site.desc
                || oldSite.contentXPath.length != site.contentXPath.length
                || oldSite.testLink.length != site.testLink.length
                || !autopagerUtils.equals(oldSite.lazyImgSrc , site.lazyImgSrc)
                || !autopagerUtils.equals(oldSite.keywordXPath , site.keywordXPath)
                || !autopagerUtils.equals(oldSite.alertsHash , site.alertsHash)
            )
            {
                return true;
            }
            for(var i=0;i<site.contentXPath.length;++i)
            {
                if (oldSite.contentXPath[i] != site.contentXPath[i])
                    return true;
            }
            for(var i=0;i<site.testLink.length;++i)
            {
                if (oldSite.testLink[i] != site.testLink[i])
                    return true;
            }

            for(var i=0;i<site.removeXPath.length;++i)
            {
                if (oldSite.removeXPath[i] != site.removeXPath[i])
                    return true;
            }
        }
        return false;
    }

    ,cloneSites: function(sites)
    {
        var newSites = new Array();
        for (var i=0;i<sites.length;++i)
        {
            var site = autopagerConfig.cloneSite(sites[i]);
            newSites.push(site);
        }
        newSites.updateSite = sites.updateSite;
        return newSites;
    }

    ,
     getUpdateFrame : function(doc)
    {
        var divName = "autoPagerUpdateDiv";
        var frameName = divName + "ifr";

        var frame = doc.getElementById(frameName);
        if (frame == null || !frame)
        {
            var div = autopagerMain.createDiv(doc,divName,
            "border: 0px; margin: 0px; padding: 0px; position: absolute; width: 0px; display: block; z-index: -90; left: -100px; top: -100px; height: 0px;");
            div.innerHTML = "<iframe id='" + frameName + "' name='" + frameName + "' width='100%' height='100%' src=''></iframe>";

            //var div = autopagerMain.createDiv(doc,"<div  id='" + divName + "' class='autoPagerS'  style='border: 2px solid orange; margin: 0px; padding: 0px; position: absolute; width: 600px; display: block; z-index: 90; left: 0px; top: 0px; height: 600px; '>" +
            //		"<iframe id='" + frameName + "' name='" + frameName + "' width='100%' height='100%' src=''></iframe></div>");
            frame = doc.getElementById(frameName);
        }
        return frame;
    },
    autopagerUpdate : function()
    {
        AutoPagerNS.UpdateSites.updateOnline(false);
    },
    getConfigFileURI : function(fileName) {
        try{
            return Components.classes["@mozilla.org/network/io-service;1"]
            .getService(Components.interfaces.nsIIOService)
            .newFileURI(autopagerBwUtil.getConfigFile(fileName));
        }catch(e)
        {
            autopagerBwUtil.consoleError(e);
        }
    },
    getRemoteURI : function(url)
    {
        try{
            return Components.classes["@mozilla.org/network/io-service;1"]
            .getService(Components.interfaces.nsIIOService)
            .newURI(url,"UTF-8",null);
        }catch(e)
        {
            //autopagerBwUtil.consoleError(e);
        }
    }
    ,
    autopagerGetContents : function(aURL, charset,warn){
        var str;
        try{
            if( charset == null) {
                charset = "UTF-8";
                warn = false;
            }
            var ioService=Components.classes["@mozilla.org/network/io-service;1"]
            .getService(Components.interfaces.nsIIOService);
            var scriptableStream=Components
            .classes["@mozilla.org/scriptableinputstream;1"]
            .getService(Components.interfaces.nsIScriptableInputStream);
            // http://lxr.mozilla.org/mozilla/source/intl/uconv/idl/nsIScriptableUConv.idl
            var unicodeConverter = Components
            .classes["@mozilla.org/intl/scriptableunicodeconverter"]
            .createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
            unicodeConverter.charset = charset;

            var channel=ioService.newChannelFromURI(aURL);
            var input=channel.open();
            scriptableStream.init(input);
            str=scriptableStream.read(input.available());
            scriptableStream.close();
            input.close();

            try {
                return unicodeConverter.ConvertToUnicode(str);
            } catch( e ) {
                return str;
            }
        } catch( e ) {
            if (warn)
                alert("unable to load file because:" + e);
        }
    },
    loadConfig :function() {
        var allConfigs = AutoPagerNS.UpdateSites.loadAll();
        return allConfigs["autopager.xml"];
    },
    reLoadConfig :function(allSiteSetting,updateSite) {
        var sites= [];
        var configContents="";
        var loaded = false;
        var jsonfile = updateSite.filename.replace(/\.xml/,".json");
        var jsonOverridefile = updateSite.filename.replace(/\.xml/,".json.override");
        try{
            if (updateSite.enabled ||!autopagerBwUtil.isMobileVersion())
                configContents= autopagerBwUtil.getConfigFileContents(jsonfile);
            if (typeof configContents !="undefined" && configContents!=null && configContents.length>0)
            {
                sites = autopagerJsonSetting.loadCompactFromString(configContents);
                sites.updateSite = updateSite;
//                for(var a=0;a<10;a++)
//                {
//                    sites["xx"+a] = autopagerJsonSetting.loadCompactFromString(configContents);
//                }
                loaded = true;
                if (updateSite.filename != "autopager.xml")
                {
                    var overrideContents= autopagerBwUtil.getConfigFileContents(jsonOverridefile);
                    if (overrideContents!=null && overrideContents.length>0)
                    {
                        var overrides = autopagerBwUtil.decodeJSON(overrideContents);
                        autopagerJsonSetting.mergeOverrides(updateSite,sites,overrides);
                    }

                }
            }
        }catch(e)
        {
            loaded = false;
        }
        if (!loaded)
        {
            try{
                configContents= autopagerBwUtil.getConfigFileContents(updateSite.filename);
                if (typeof configContents !="undefined" && configContents!=null && configContents.length>0)
                {
                    sites = autopagerConfig.loadConfigFromStr(configContents);
                    sites.updateSite = updateSite;
                    //save to json
                    if (sites.length>0)
                    {
                        autopagerConfig.saveConfigToJsonFile(sites,autopagerBwUtil.getConfigFile(jsonfile),true);
                        //todo:delete old xml file
                    }
                }
            }catch(e)
            {
                autopagerBwUtil.consoleError(e);
            }
        }
        sites.updateSite = updateSite;
        sites.updateSite.ruleCount = sites.length;
        allSiteSetting[updateSite.filename] = sites;
        return sites
    },
    importText :function(str,silient,callback)
    {
        if (typeof silient=='undefined')
            silient=false
        try{
            var configContents =  str;
            if (configContents.substr(0,1)!="[")
                configContents = "<root>" + str + "</root>";
            var sites =  autopagerConfig.loadConfigFromStr(configContents);
            autopagerConfig.mergeSetting(sites,silient,callback);
        }catch(e)
        {
            autopagerBwUtil.consoleError(e);
        }
    }
    ,importFromURL :function(func)
    {
        var url = prompt(autopagerUtils.autopagerGetString("inputurl"),
        AutoPagerNS.UpdateSites.defaultSite());
        if (url!=null && url.length >0)
        {
            var callback=function(doc,obj)
            {
                var sites = autopagerConfig.loadConfigFromDoc(doc);
                autopagerConfig.mergeSetting(sites,false);

                if (func!=null)
                    func();
                autopagerMain.handleCurrentDoc();
            }
            var onerror=function(doc,obj)
            {
                //TODO:notify error
            }
            AutoPagerNS.apxmlhttprequest.xmlhttprequest(AutoPagerNS.UpdateSites.getUrl(url,false,0),"text/xml; charset=utf-8",callback,onerror,url);

        }
    },
    importFromClip :function()
    {
        try{
            var configContents = "<root></root>";
            var clip  = Components.classes["@mozilla.org/widget/clipboard;1"].getService(Components.interfaces.nsIClipboard);
            if (!clip) return false;

            var trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
            if (!trans) return false;
            trans.addDataFlavor("text/unicode");
            clip.getData(trans, clip.kGlobalClipboard);

            var str       = new Object();
            var strLength = new Object();

            trans.getTransferData("text/unicode", str, strLength);
            if (str) str       = str.value.QueryInterface(Components.interfaces.nsISupportsString);
            if (str) configContents = str.data.substring(0, strLength.value / 2);

            var sites =  autopagerConfig.loadConfigFromStr(configContents);
            autopagerConfig.mergeSetting(sites,false);
        }catch(e)
        {
            autopagerBwUtil.consoleError(e);
        }
    }
    ,importFromFile : function()
    {
        try{
            var fileURI  = null;
            try{
                var file = autopagerConfig.selectFile(autopagerUtils.autopagerGetString("inputfile"),Components.interfaces.nsIFilePicker.modeOpen);

                fileURI = Components.classes["@mozilla.org/network/io-service;1"]
                .getService(Components.interfaces.nsIIOService)
                .newFileURI(file);
            }catch(e){
                return;
            }
            var configContents = autopagerConfig.autopagerGetContents(fileURI);
            var sites =  autopagerConfig.loadConfigFromStr(configContents);
            autopagerConfig.mergeSetting(sites,false);
        }catch(e)
        {
            autopagerBwUtil.consoleError(e);
        }
    },
    exportToJson : function()
    {
        var sites = autopagerConfig.loadConfig();
        return autopagerJsonSetting.saveNormalToCompactString(sites);
    }
    ,
    exportSetting : function()
    {
        var file = autopagerConfig.selectFile(autopagerUtils.autopagerGetString("outputfile"),Components.interfaces.nsIFilePicker.modeSave);
        if (file)
        {
            autopagerConfig.autoSites = autopagerConfig.loadConfig();
            autopagerConfig.saveConfigToFile(autopagerConfig.autoSites,file,false);
        }
    },
    selectFile :function  (title,mode) {
        var fp = Components.classes["@mozilla.org/filepicker;1"]
        .createInstance(Components.interfaces.nsIFilePicker);

        fp.init(window, title, mode);
        fp.appendFilters(Components.interfaces.nsIFilePicker.filterAll);


        var ret = fp.show();
        if (ret == Components.interfaces.nsIFilePicker.returnOK ||
            ret == Components.interfaces.nsIFilePicker.returnReplace) {
            return  fp.file;
        }
        return null;
    },
    getSiteIndex : function(sites,site)
    {
        if ( site.guid.length >0)
        {
            for (var i=0;i<sites.length;i++)
            {
                if (sites[i].guid == site.guid)
                    return i;
            }
        }
        for (var i=0;i<sites.length;i++)
        {
            if (sites[i].urlPattern == site.urlPattern)
                return i;
        }
        return -1;
    },
    mergeSetting : function (sites,silient,callback)
    {
        autopagerConfig.autoSites = autopagerConfig.loadConfig();
        autopagerConfig.mergeArray(autopagerConfig.autoSites,sites,silient,callback);
        autopagerConfig.saveConfig(autopagerConfig.autoSites);
        //autopagerConfig.autoSites = autopagerConfig.loadConfig();        
        try{
            autopagerMain.handleCurrentDoc();
        }catch(e){}
    },
    clearLocalRules : function (sites,silient)
    {
        autopagerConfig.saveConfig([]);
        //autopagerConfig.autoSites = autopagerConfig.loadConfig();
        try{
            autopagerMain.handleCurrentDoc();
        }catch(e){}
    },
    mergeArray : function(autoSites,sites,silient,callback)
    {

        var insertCount=0;
        var updatedCount=0;
        var ignoreCount=0;
        for (var i=0;i<sites.length;i++)
        {
            var siteIndex = autopagerConfig.getSiteIndex(autoSites,sites[i]);
            if (siteIndex == -1)
            {
                autoSites.push(sites[i]);
                insertCount ++;
            }
            else
            {
                if (!(autoSites[siteIndex].changedByYou
                    || autoSites[siteIndex].createdByYou) &&
                    !(autoSites[siteIndex].guid.length > 0 && sites[i].guid.length == 0)
            )
                {
                    updatedCount++;
                    autoSites[siteIndex] = sites[i];
                }
                else
                    ignoreCount ++;
            }
        }
        var msg = autopagerUtils.autopagerFormatString("importdone",[insertCount,updatedCount,ignoreCount]);
        if (!silient)
        {
            alert(msg);
            //alert("import done with " + insertCount + " new sites and " + updatedCount +  " updated.");
        }
        if (typeof callback !='undefined')
        {
            callback({insertCount:insertCount,updatedCount:updatedCount,ignoreCount:ignoreCount});
        }

        autopagerMain.logInfo(msg,msg);
    },
    loadConfigFromUrl : function(url) {
        try{
            var configContents = autopagerConfig.autopagerGetContents(autopagerConfig.getRemoteURI(url),"UTF-8",true);
            return autopagerConfig.loadConfigFromStr(configContents);
        }
        catch(e)
        {
            autopagerBwUtil.consoleError(e);
        }
    },
    getValue :function(node)
    {
        if (!node.childNodes || node.childNodes.length==0)
            return "";
        var first = node.firstChild
        if (!first)
            return "";
        else
            return first.nodeValue;
    },
    autopagerGetNode : function(doc)
    {
        return doc.evaluate("//site", doc, null, 0, null);
    },
    loadConfigFromDoc : function(doc) {
        var sites = new Array();
        var nodes = autopagerConfig.autopagerGetNode(doc);
        var miniMargin = autopagerMain.getMiniMargin();
        if (nodes == null)
            return sites;
        var hasQuickLoad = false;
        for (var node = null; (node = nodes.iterateNext()); ) {
            var site = autopagerConfig.newDefaultSite();
            var ajax = false;
            var needMouseDown = false;
            var published =false;
            var enabled = true;
            var enableJS = true;
            var quickLoad = false;
            var fixOverflow = false;
            var isRegex = false;
            var createdByYou = false;
            var changedByYou = false;
            var childNode = node.firstChild
            while(childNode)
            {
                var nodeName = childNode.nodeName;
                if (nodeName == "#text")
                {
                    childNode = childNode.nextSibling
                    continue;
                }
                else
                {
                    var v = autopagerConfig.getValue(childNode);
                    if (nodeName == "urlPattern") {
                        site.urlPattern = v;
                    }
                    else  if (nodeName == "guid") {
                        site.guid = v;
                    }else if (nodeName == "urlIsRegex") {
                        isRegex	= (v == 'true' || v == '1');
                    }
                    else if (nodeName == "margin") {
                        if (autopagerConfig.isNumeric(v))
                        {
                            if (v>miniMargin)
                                site.margin = v;
                            else
                                site.margin = miniMargin;
                        }
                    }
                    else if (nodeName == "minipages") {
                        if (autopagerConfig.isNumeric(v))
                        {
                            site.minipages = v;
                        }
                    }
                    else if (nodeName == "delaymsecs") {
                        if (autopagerConfig.isNumeric(v))
                        {
                            site.delaymsecs = v;
                        }
                    }
                    else if (nodeName == "desc") {
                        site.desc	= v;
                    }
                    else if (nodeName == "linkXPath") {
                        site.linkXPath	= v;
                    }
                    else if (nodeName == "containerXPath") {
                        site.containerXPath	= v;
                    }
                    else if (nodeName == "contentXPath") {
                        site.contentXPath.push(v);
                    }
                    else if (nodeName == "testLink") {
                        site.testLink.push(v);
                    }
                    else if (nodeName == "removeXPath") {
                        site.removeXPath.push(v);
                    }
                    else if (nodeName == "enabled") {
                        enabled	= (v == 'true' || v == '1');
                    }
                    else if (nodeName == "enableJS") {
                        enableJS	= v;
                        if (v=="true")
                            enableJS = 1;
                        else if (v=="false")
                            enableJS = 0;
                    }
                    else if (nodeName == "needMouseDown") {
                        needMouseDown	= (v == 'true' || v == '1');
                    }
                    else if (nodeName == "ajax") {
                        ajax	= (v == 'true' || v == '1');
                    }
                    else if (nodeName == "quickLoad") {
                        if (autopagerConfig.isNumeric(v))
                            quickLoad = v
                        else
                            quickLoad	= (v == 'true' || v == '1');
                    }
                    else if (nodeName == "fixOverflow") {
                        fixOverflow	= (v == 'true' || v == '1');
                        //alert(site.fixOverflow + " " + childNode.firstChild.nodeValue);
                    }
                    else if (nodeName == "createdByYou") {
                        createdByYou	= (v == 'true' || v == '1');
                    }
                    else if (nodeName == "changedByYou") {
                        changedByYou	= (v == 'true' || v == '1');
                    }else if (nodeName == "owner") {
                        site.owner	= v ;
                    }
                    else if (nodeName == "published") {
                        published	= (v == 'true' || v == '1');
                    }
                    else if (nodeName == "monitorXPath") {
                        site.monitorXPath	= v;
                    }
                    else if (nodeName == "lazyImgSrc")
                    {
                        site.lazyImgSrc = v
                    }
                }
                childNode = childNode.nextSibling
            }
            site.ajax = ajax;
            site.needMouseDown = needMouseDown;
            site.published = published;
            site.enabled = enabled;
            site.enableJS = enableJS;
            site.quickLoad = quickLoad;
            site.fixOverflow = fixOverflow;
            site.isRegex = isRegex;
            if (createdByYou)
                site.createdByYou = createdByYou;
            if (changedByYou)
                site.changedByYou = changedByYou;

            if (site.guid.length == 0 && site.createdByYou)
                site.guid = autopagerConfig.generateGuid();
            sites.push(site);
        }
        return sites;
    },
    loadConfigFromStr : function(configContents) {
        var sites = null;
        try{
            //load xml
            if (configContents.substr(0,1)!="[")
            {
                var doc = autopagerConfig.autopagerDomParser.parseFromString(configContents, "text/xml");
                sites = autopagerConfig.loadConfigFromDoc(doc);
            }else{
                //load json
                sites = autopagerJsonSetting.loadCompactFromString(configContents);                
            }
        }catch(e)
        {
            autopagerBwUtil.consoleError(e);
        }        
        return sites;
    },
    newDefaultSite : function ()
    {
        var site = new AutoPagerNS.Site();
        return autopagerConfig.completeRule (site);//fill defaults first
    }
    ,newSite : function(urlPattern,desc,linkXPath,contentXPath,testLink)
    {
        var site =autopagerConfig.newDefaultSite();
        site.urlPattern = urlPattern;
        site.desc =desc;
        site.linkXPath = linkXPath;
        if (contentXPath[0].length == 1)
            site.contentXPath[0] = contentXPath;
        else
        {
            for(var i=0;i<contentXPath.length;++i)
                site.contentXPath[i] = contentXPath[i];
        }
        //	if (testLink[0].length == 1)
        //		site.testLink[0] = testLink;
        //	else
        {
            for(var i=0;i<testLink.length;++i)
                site.testLink[i] = testLink[i];
        }
        site.guid = autopagerConfig.generateGuid();
        site.quickLoad = true;
        return site;
    },
    saveAllOverride : function (allSites)
    {
        for (var key in allSites)
        {
            if (!allSites[key].updateSite)
                continue;
            var updateSite = allSites[key].updateSite;
            if (updateSite.fileName =='smartpaging.xml' || updateSite.fileName == 'testing.xml' || updateSite.fileName == 'autopager.xml')
                continue;
            var jsonfile = updateSite.filename.replace(/\.xml/,".json.override");
            autopagerConfig.saveOverrideToJsonFile(allSites[key], autopagerBwUtil.getConfigFile(jsonfile));
        }
    },
    saveOverrideToJsonFile: function(sites,saveFile)
    {
        try{
            var fStream = autopagerConfig.getWriteStream(saveFile);
            var configStream = autopagerConfig.getConverterWriteStream(fStream);
            var str = autopagerJsonSetting.saveOverrideToCompactString(sites);
            configStream.writeString(str);
            configStream.close();
            fStream.close();
        }catch(e)
        {
            autopagerBwUtil.consoleError(e);
        }
    },

    saveConfigXML : function(sites) {
        autopagerConfig.saveConfigToFile(sites,autopagerBwUtil.getConfigFile("autopager.xml"),true);
        var allConfigs = AutoPagerNS.UpdateSites.loadAll();
        //sites.updateSite = allConfigs["autopager.xml"].updateSite;
        allConfigs["autopager.xml"] = sites;
        AutoPagerNS.UpdateSites.AutopagerCOMP.setAll(allConfigs);
    },
    saveConfigJSON : function(sites) {
        autopagerConfig.saveConfigToJsonFile(sites,autopagerBwUtil.getConfigFile("autopager.json"),true);
        var allConfigs = AutoPagerNS.UpdateSites.loadAll();
        //sites.updateSite = allConfigs["autopager.xml"].updateSite;
        allConfigs["autopager.xml"] = sites;
        AutoPagerNS.UpdateSites.AutopagerCOMP.setAll(allConfigs);
    },
    saveConfigToJsonFile: function(sites,saveFile,includeChangeInfo)
    {
        try{
            var str = autopagerJsonSetting.saveNormalToCompactString(sites);
            autopagerBwUtil.saveContentToFile(str,saveFile);
        }catch(e)
        {
            autopagerBwUtil.consoleError(e);
        }
        //AutoPagerNS.UpdateSites.allSiteSetting= AutoPagerNS.UpdateSites.loadAll();
        autopagerPref.setDatePrefs("settingupdatedate", new Date());
    },
    saveConfig : function(sites) {
        autopagerConfig.saveConfigJSON(sites);
    },
    createNode : function(siteNode,name,value)
    {
        var doc = siteNode.ownerDocument;
        var node = doc.createElement(name);
        node.appendChild(doc.createTextNode(value));
        siteNode.appendChild(node);
        siteNode.appendChild(doc.createTextNode("\n"));
    },
    saveConfigToFile: function(sites,saveFile,includeChangeInfo) {

        try{
            var doc = document.implementation.createDocument("", "autopager", null);
            doc.firstChild.appendChild(doc.createTextNode("\n"))

            if (sites!=null)
            {
                for (var i = 0, siteObj = null; (siteObj = sites[i]); i++) {
                    var siteNode = doc.createElement("site");

                    if (siteObj.createdByYou && siteObj.guid.length == 0)
                        siteObj.guid = autopagerConfig.generateGuid();
                    autopagerConfig.createNode(siteNode,"urlPattern",siteObj.urlPattern);
                    autopagerConfig.createNode(siteNode,"guid",siteObj.guid);
                    if (siteObj.margin>autopagerMain.getMiniMargin())
                        autopagerConfig.createNode(siteNode,"margin",siteObj.margin);
                    if (siteObj.minipages>=0)
                        autopagerConfig.createNode(siteNode,"minipages",siteObj.minipages);
                    if (siteObj.delaymsecs>=0)
                        autopagerConfig.createNode(siteNode,"delaymsecs",siteObj.delaymsecs);
                    autopagerConfig.createNode(siteNode,"owner",siteObj.owner);

                    if (siteObj.isRegex)
                        autopagerConfig.createNode(siteNode,"urlIsRegex",siteObj.isRegex);
                    if (!siteObj.enabled)
                        autopagerConfig.createNode(siteNode,"enabled",siteObj.enabled);

                    if (!autopagerUtils.isBlank(siteObj.lazyImgSrc))
                        autopagerConfig.createNode(siteNode,"lazyImgSrc",siteObj.lazyImgSrc);

                    if (!autopagerUtils.isBlank(siteObj.keywordXPath))
                        autopagerConfig.createNode(siteNode,"keywordXPath",siteObj.keywordXPath);

                    if (!autopagerUtils.isBlank(siteObj.alertsHash))
                        autopagerConfig.createNode(siteNode,"alertsHash",siteObj.alertsHash);

                    if (siteObj.enableJS!=1 && siteObj.enableJS!="true")
                        autopagerConfig.createNode(siteNode,"enableJS",siteObj.enableJS);

                    if (siteObj.quickLoad)
                        autopagerConfig.createNode(siteNode,"quickLoad",siteObj.quickLoad);

                    if (siteObj.fixOverflow)
                        autopagerConfig.createNode(siteNode,"fixOverflow",siteObj.fixOverflow);

                    if (siteObj.ajax)
                        autopagerConfig.createNode(siteNode,"ajax",siteObj.ajax);

                    if (siteObj.needMouseDown)
                        autopagerConfig.createNode(siteNode,"needMouseDown",siteObj.needMouseDown);

                    if (siteObj.published)
                        autopagerConfig.createNode(siteNode,"published",siteObj.published);

                    for(var x=0;x<siteObj.contentXPath.length;++x)
                    {
                        autopagerConfig.createNode(siteNode,"contentXPath",siteObj.contentXPath[x]);
                    }
                    for(var x=0;x<siteObj.testLink.length;++x)
                    {
                        autopagerConfig.createNode(siteNode,"testLink",siteObj.testLink[x]);
                    }
                    for(var x=0;x<siteObj.removeXPath.length;++x)
                    {
                        autopagerConfig.createNode(siteNode,"removeXPath",siteObj.removeXPath[x]);
                    }

                    autopagerConfig.createNode(siteNode,"linkXPath",siteObj.linkXPath);
                    if (siteObj.containerXPath!=null && siteObj.containerXPath.length>0)
                        autopagerConfig.createNode(siteNode,"containerXPath",siteObj.containerXPath);

                    if (siteObj.monitorXPath!=null && siteObj.monitorXPath.length>0)
                        autopagerConfig.createNode(siteNode,"monitorXPath",siteObj.monitorXPath);

                    if (siteObj.desc!=null && siteObj.desc.length>0)
                        autopagerConfig.createNode(siteNode,"desc",siteObj.desc);

                    if (includeChangeInfo)
                    {
                        if (siteObj.createdByYou)
                            autopagerConfig.createNode(siteNode,"createdByYou",siteObj.createdByYou);
                        if (siteObj.changedByYou)
                            autopagerConfig.createNode(siteNode,"changedByYou",siteObj.changedByYou);
                    }

                    doc.firstChild.appendChild(siteNode);
                    doc.firstChild.appendChild(doc.createTextNode("\n"));
                }
            }
            var configStream = autopagerConfig.getWriteStream(saveFile);
            new window.XMLSerializer().serializeToStream(doc, configStream, "utf-8");
            configStream.close();
        }catch(e)
        {
            autopagerBwUtil.consoleError(e);
        }
        //AutoPagerNS.UpdateSites.allSiteSetting= AutoPagerNS.UpdateSites.loadAll();

        autopagerPref.setDatePrefs("settingupdatedate", new Date());
    },
    getWriteStream : function(file) {
        var stream = Components.classes["@mozilla.org/network/file-output-stream;1"]
        .createInstance(Components.interfaces.nsIFileOutputStream);

        stream.init(file, 0x02 | 0x08 | 0x20, 420, 0);

        return stream;
    },
    getConverterWriteStream : function(output) {
        var stream = Components.classes["@mozilla.org/intl/converter-output-stream;1"]
        .createInstance(Components.interfaces.nsIConverterOutputStream);

        stream.init(output, "UTF-8", 0, 0x0000);
        return stream;
    }
    ,defaultRule : {
        urlPattern  : null,
        regex : null,
        isRegex : false,
        enabled  : true,
        enableJS  : false,
        quickLoad : true,
        fixOverflow  : false,
        createdByYou  : false,
        changedByYou  : false,
        owner  : "",
        contentXPath : [],//["//div[@class:'g']"]
        linkXPath : "//a[contains(.//text(),'Next')]",
        containerXPath:"",
        monitorXPath:"",
        removeXPath:[],
        //desc : null,
        testLink : [],
        oldSite : null,
        margin : autopagerPref.loadPref("defaultheight"),

        maxLinks : -1,
        isTemp : false,
        tmpPaths : [],
        guid : "",
        ajax:false,
        needMouseDown : false,
        published : false,
        minipages : -1,
        delaymsecs : -1,
        rate : 0
    }
    ,arrayField : {
        contentXPath : [],//["//div[@class:'g']"]
        removeXPath:[],
        testLink : [],
        tmpPaths : []
    },
    completeRule : function (rule)
    {
        var newRule = rule;//this.clone(rule);
        
        for(var k in this.arrayField)
        {
            if (typeof newRule[k]=="undefined")
            {
                newRule[k] = []
            }
        }
        for(var k in this.defaultRule)
        {
            if (typeof newRule[k]=="undefined")
            {
                newRule[k] = this.defaultRule[k]
            }
        }
        return newRule;
    }
};


AutoPagerNS.util = AutoPagerNS.extend (AutoPagerNS.namespace("util"),
    {
        post_init : function()
        {
            try{
                AutoPagerNS.UpdateSites.init();    
            }catch(e)
            {
                autopagerBwUtil.consoleError(e);
            }
        }
    }
    );
        
