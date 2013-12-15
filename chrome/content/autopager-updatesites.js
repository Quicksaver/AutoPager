AutoPagerNS.AutoPagerUpdateType=function (type,defaultLocales,defaultUrl,contentType,filenamePrefix,callback,xpath,desc)
{
    this.type=type;
    this.defaultLocales = defaultLocales;
    this.defaultUrl=defaultUrl;
    this.contentType = contentType;
    this.filenamePrefix = filenamePrefix;
    this.callback = callback;
    this.xpath = xpath;
    this.desc=desc;
}

AutoPagerNS.AutoPagerUpdateSite=function (owner,locales,url,contenttype,desc,filename,xpath,enabled,typeName,updateperiod,backupUrls)
{
    if (owner!=null)
    {
        this.owner = owner;
        this.locales=locales;
        this.url=url;
        this.contenttype=contenttype;
        this.filename = filename;
        this.enabled = enabled;
        this.xpath = xpath;
        this.desc=desc;
        this.updateType = AutoPagerNS.AutoPagerUpdateTypes.getType(typeName);
        this.callback = this.updateType.callback;
        this.updateperiod = updateperiod;//use global setting
        this.backupUrls = backupUrls;
    }
    this.triedTime=0;
	this.triedBackup = 0;
    this.defaulted = true;
    this.lastupdate =null;
}

AutoPagerNS.AutoPagerUpdateTypes =
{
    types : null,
    updateSites: null,
	backupUrls: [],
	triedBackup: 0,
    init : function (){
        if (this.types == null)
        {
            this.types =  new Array();

            this.types.push(new AutoPagerNS.AutoPagerUpdateType("autopager-xml","all",
            "http://rep.teesoft.info/autopager/json/?version={version}&lastupdate={timestamp}&all={all}",
            "application/json; charset=utf-8",
            "ap-",this.autopagerConfigCallback,"//site",
            "default configurations on teesoft.info"));
            
            this.types.push(new AutoPagerNS.AutoPagerUpdateType("autopager-lite","all",
            autopagerPref.loadPref("repository-site") + "d/json?ids={ids}&version={version}&lastupdate={timestamp}&all={all}",
            "application/json; charset=utf-8",
            "ap-",this.autopagerConfigCallback,"//site",
            "Lite configurations on teesoft.info"));

            this.types.push(new AutoPagerNS.AutoPagerUpdateType("autopager-freetext","all",
            "http://examplehost/examplepage",
            "text/html; charset=utf-8",
            "af-",this.blogConfigCallback,"//div[@class='autopager-setting']","configurations in web pages"));

            this.types.push(new AutoPagerNS.AutoPagerUpdateType("autopagerize","all",
            "http://swdyh.infogami.com/autopagerize","text/html; charset=utf-8",
            "az-",AutoPagerize.onload,'//*[@class="autopagerize_data"]',"autopagerize configurations"));

            this.types.push(new AutoPagerNS.AutoPagerUpdateType("autopagerize-json","all",
            "http://wedata.net/databases/AutoPagerize/items.json?lastupdate={timestamp}","text/plain; charset=utf-8",
            "az-",AutoPagerize.onJsonLoad,'//*[@class="autopagerize_data"]',"autopagerize configurations"));

        }
    },
    getType : function (name)
    {
        for(var i in this.types)
        {
            if (this.types[i].type == name)
            {
                return this.types[i];
            }
        }
        return null;
    },
    getUpdateSites : function()
    {
        var sites = AutoPagerNS.AutoPagerUpdateTypes.loadAllSites();
        if (sites == null|| sites.length==0)
        {
            sites = this.getDefaultSites();
            for(var i=0;i<sites.length;i++)
            {
                    var newSite = autopagerUtils.clone(sites[i]);
                    newSite.referred = sites[i];
                    sites[i]= newSite;
            }
            this.saveSettingSiteConfig(sites);
        }
        return sites;
    },
    getDefaultSites : function()
    {
        var repositories = new Array();
        var offlineMode = false;
        //always ask users to confirm the mode in mobile browsers
        //if (autopagerBwUtil.isMobileVersion())
        {
            var prompted = autopagerPref.loadBoolPref("mode-prompted");
            if (!prompted)
            {                
                offlineMode = true;
            }else if(autopagerPref.loadBoolPref("mode-no-repository"))
            {
                offlineMode = true;
            }
        }
        
//            sites.push(new AutoPagerNS.AutoPagerUpdateSite("pagerization","all",
//                        "http://k75.s321.xrea.com/pagerization/siteinfo","text/html; charset=utf-8",
//                        "pagerization configurations",
//                        "pagerization.xml",'//*[@class="autopagerize_data"]',false,"autopagerize",0,[]));
            var lite = autopagerLite.isInLiteMode();
            var withlite = autopagerPref.loadBoolPref("with-lite-rules");

//            sites.push(new AutoPagerNS.AutoPagerUpdateSite("autopagerize","all",
//                        "http://swdyh.infogami.com/autopagerize","text/html; charset=utf-8",
//                        "autopagerize configurations",
//                        "autopagerize.xml",'//*[@class="autopagerize_data"]',false,"autopagerize",0,[]));

            repositories.push(new AutoPagerNS.AutoPagerUpdateSite("autopagerize","all",
                        "http://rep.teesoft.info/autopager/AutoPagerize/items.json?lastupdate={timestamp}","text/plain; charset=utf-8",
                        "autopagerize new configurations. Use our cached version first. Use the orgnial sites if our cache failed.\nhttp://wedata.net/databases/AutoPagerize/items.json?lastupdate={timestamp},http://utatane.appjet.net/databases/AutoPagerize/items.json",
                        "autopagerizeJson.xml",'',!offlineMode && !lite,"autopagerize-json",168,["http://wedata.net/databases/AutoPagerize/items.json?lastupdate={timestamp}","http://utatane.appjet.net/databases/AutoPagerize/items.json"]));

            repositories.push(new AutoPagerNS.AutoPagerUpdateSite("Wind Li","all",
                        "http://autopager.mozdev.org/conf.d/autopager.xml","text/xml; charset=utf-8",
                        "configurations on autopager.mozdev.org",
                        "autopagerMozdev.xml","//site",false,"autopager-xml",0,[]));

            repositories.push(new AutoPagerNS.AutoPagerUpdateSite("Wind Li","all",
                        "http://rep.teesoft.info/autopager/json/?approvedOnly=0&version={version}&lastupdate={timestamp}&all={all}","application/json; charset=utf-8",
                        "Experimental configurations @ teesoft.info, please don't enable this.",
                        "autopagerBeta.xml","//site",false,"autopager-xml",-2,[
                            "http://vps.teesoft.info/autopager/json/?approvedOnly=0&version={version}&lastupdate={timestamp}&all={all}",
                            "http://stone.teesoft.info/autopager/json/?approvedOnly=0&version={version}&lastupdate={timestamp}&all={all}",
                            "http://s2.teesoft.info/autopager/json/?approvedOnly=0&version={version}&lastupdate={timestamp}&all={all}"]));

            repositories.push(new AutoPagerNS.AutoPagerUpdateSite("Wind Li","all",
                        "http://rep.teesoft.info/autopager/json/?version={version}&lastupdate={timestamp}&all={all}","application/json; charset=utf-8",
                        "default configurations @ teesoft.info",
                        "autopagerTee.xml","//site",!offlineMode && !lite,"autopager-xml",-2,
                                ["http://vps.teesoft.info/autopager/json/?version={version}&lastupdate={timestamp}&all={all}",
                                "http://stone.teesoft.info/autopager/json/?version={version}&lastupdate={timestamp}&all={all}",
                                "http://s2.teesoft.info/autopager/json/?version={version}&lastupdate={timestamp}&all={all}",
                                "http://es4.teesoft.info/autopager/json/?version={version}&lastupdate={timestamp}&all={all}",
                                "http://member.teesoft.info/autopager/json/?version={version}&lastupdate={timestamp}&all={all}",
                                "http://shared.teesoft.info/autopager/json/?version={version}&lastupdate={timestamp}&all={all}",
                                "http://wind.liyong.googlepages.com/autopager.json?version={version}&lastupdate={timestamp}&all={all}",
                                "http://teesoft.co.cc/autopager/json/?version={version}&lastupdate={timestamp}&all={all}"]));


            
            if(withlite || lite)
            {
                repositories.push(new AutoPagerNS.AutoPagerUpdateSite("Wind Li","all",
                        autopagerPref.loadPref("repository-site") +"d/json?ids={ids}&version={version}&lastupdate={timestamp}&all={all}","application/json; charset=utf-8",
                        "AutoPager Lite Configurations @ teesoft.info",
                        "autopagerLite.xml","//site",!offlineMode,"autopager-lite",-2,
                                ["http://s1-ap.teesoft.info/d/json?ids={ids}&version={version}&lastupdate={timestamp}&all={all}",
                                "http://member-ap.teesoft.info/d/json?ids={ids}&version={version}&lastupdate={timestamp}&all={all}",
                                "http://es4-ap.teesoft.info/d/json?ids={ids}&version={version}&lastupdate={timestamp}&all={all}"]));
            }
            repositories.push(new AutoPagerNS.AutoPagerUpdateSite("Wind Li","all",
                        "","text/html; charset=utf-8",
                        "user created configurations",
                        "autopager.xml","//site",true,"autopager-xml",-2,[]));
           return repositories;
        
    },
    xmlConfigCallback : function(doc,updatesite)
    {
        var sites = autopagerConfig.loadConfigFromDoc(doc);
        return sites;
    },
    autopagerConfigCallback : function(doc,updatesite)
    {
        var sites = null;
        if (typeof doc =='string')
            sites = autopagerJsonSetting.loadCompactFromString(doc,updatesite);
        else
            sites = autopagerConfig.loadConfigFromDoc(doc,updatesite);
        return sites;
    },
    blogConfigCallback : function(doc,updatesite)
    {
        var commentPath= updatesite.xpath;// "//div[@class='comment even' or @class='comment odd']";
        var nodes =doc.evaluate(commentPath, doc, null, 0, null);
        var allSites = new Array();
        for (var node = null; (node = nodes.iterateNext()); ) {
            
            var sites = autopagerConfig.loadConfigFromStr( "<root>" + node.textContent + "</root>");
            autopagerConfig.mergeArray(allSites,sites,true);
        }
        return allSites;
    },
    loadAllSites : function ()
    {
        
        var configContents="";
        var sites= null;
        var newSites = [];
        try{
            var file = "all-sites.json";
            if (autopagerLite.isInLiteMode())
                file = "all-sites-lite.json";
            configContents= autopagerBwUtil.getConfigFileContents(file);
            sites = autopagerBwUtil.decodeJSON(configContents);
            if (!sites)
                sites = {}
            var defaultSites = this.getDefaultSites();
            var needSave = false;
            for(var i in sites)
            {
                var site = sites[i];
                var found = false;
                for(var h in defaultSites)
                {
                    var defaultSite = defaultSites[h]
                    if (defaultSite.filename == site.filename)
                    {
                        if (typeof site.url != 'undefined')
                            needSave = true;
                        var newSite = autopagerUtils.clone(defaultSite);

                        newSite.referred = defaultSite;
                        if (typeof site.enabled != 'undefined')
                            newSite.enabled = site.enabled;

                        if (typeof site.updateType != 'undefined')
                            newSite.updateType = site.updateType;
                        if (typeof site.updateperiod != 'undefined')
                            newSite.updateperiod = site.updateperiod;
                        newSite.lastupdate = site.lastupdate
                        newSite.fullUpdate = site.fullUpdate
                        newSites.push(newSite);
                        found = true;
                        break;
                    }
                }
                if (!found && (typeof site.url != 'undefined'))
                {
                    newSites.push(site)
                }
            }
            //process the items added in default sites
            for(var h= defaultSites.length-1;h>=0;h--)
            {
                var defaultSite = defaultSites[h]
                var found = false;

                for(var i in sites)
                {
                    var site = sites[i];
                    if (defaultSite.filename == site.filename)
                    {
                        found = true;
                        break;
                    }
                }
                if (!found)
                {
                    var newSite = autopagerUtils.clone(defaultSite);
                    newSite.referred = defaultSite;
                    var off = defaultSites.length - h-1;
                    var pos = newSites.length-off

                    if(pos<0 || pos>newSites.length-1)
                        pos=newSites.length-1
                    newSites.splice(pos,0,newSite)
                    needSave = true;
                }
            }
            if (needSave)
            {
                this.saveSettingSiteConfig(newSites);
            }

        }catch(e)
        {
        //autopagerBwUtil.consoleError(e);
        }
        return newSites;

    },
    saveAllSettingSiteConfig : function() {
        this.saveSettingSiteConfig(AutoPagerNS.UpdateSites.getUpdateSites());
    },
    saveSettingSiteConfig : function(sites) {
        var file = "all-sites.json";
        if (autopagerLite.isInLiteMode())
            file = "all-sites-lite.json";
        this.saveSettingSiteConfigToFile(sites,autopagerBwUtil.getConfigFile(file));
    },    
    saveSettingSiteConfigToFile : function(sites,saveFile) {
        try{                        
            var newSites = [];            
            if (sites!=null)
            {
                for (var i = 0, siteObj = null; (siteObj = sites[i]); i++) {
                    var siteNode = {};
                    if (typeof siteObj.referred == 'undefined')
                    {
                        siteNode["enabled"]=siteObj.enabled;
                        siteNode["updateType"]=siteObj.updateType.type;
                        siteNode["updateperiod"]=siteObj.updateperiod;
                        siteNode["url"]=siteObj.url;

                        siteNode["owner"]=siteObj.owner;
                        if (siteObj.locales)
                            siteNode["locales"]=siteObj.locales;
                        if (siteObj.contenttype)
                            siteNode["contenttype"]=siteObj.contenttype;
                        if (siteObj.xpath)
                            siteNode["xpath"]=siteObj.xpath;
                        if (siteObj.desc)
                            siteNode["desc"]=siteObj.desc;
                        if (siteObj.defaulted)
                            siteNode["defaulted"]=siteObj.defaulted;
                        if (siteObj.backupUrls)
                            siteNode["backupUrl"]=siteObj.backupUrls;
                    }
                    else
                    {
                        if (siteObj.enabled != siteObj.referred.enabled)
                        {
                            siteNode["enabled"]=siteObj.enabled;                                
                        }
                        if (siteObj.updateType.type != siteObj.referred.updateType.type)
                        {
                            siteNode["updateType"]=siteObj.updateType.type;                                
                        }
                        if (siteObj.updateperiod != siteObj.referred.updateperiod)
                        {
                            siteNode["updateperiod"]=siteObj.updateperiod;                                
                        }
                    }
                    siteNode["filename"]=siteObj.filename;
                    if (siteObj.lastupdate)
                        siteNode["lastupdate"]=siteObj.lastupdate;
                    if (siteObj.fullUpdate)
                        siteNode["fullUpdate"]=siteObj.fullUpdate;
                    newSites.push(siteNode);
                }
            }
            
            var str = autopagerBwUtil.encodeJSON(newSites)
            autopagerBwUtil.saveContentToFile(str,saveFile);
            
        }catch(e)
        {
            autopagerBwUtil.consoleError(e);
        }
    }
}
AutoPagerNS.AutoPagerUpdateTypes.init();
