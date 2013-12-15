var autopagerJsonSetting= {
    apOtherConfig:"http://ap.teesoft.info/autopager/default",
    apUpdates:"updates",
    onJsonLoad :function(doc,updatesite)
    {
        return autopagerJsonSetting.loadCompactFromString(doc);
    },
    loadCompactFromString : function (str,updatesite)
    {        
        var info = autopagerBwUtil.decodeJSON(str);
        var sites = new Array();        
        if (info)
        {
            var browserId = autopagerBwUtil.apBrowserId();
            var browserFlag = (1<<browserId);
            for(var i=0;i<info.length;i++){
                var site = info[i]
                if (site.u == autopagerJsonSetting.apOtherConfig)
                {
                    autopagerJsonSetting.saveApConfig(site);
                    continue;
                }
                if (site.u == autopagerJsonSetting.apUpdates && site.ur)
                {
                    return autopagerJsonSetting.loadFromUpdate(site.ur,updatesite);
                }
                if (!site.bf || site.bf & browserFlag)
                {
                    var newSite = autopagerJsonSetting.compactToNormal(site);
                    //newSite.oldSite = null;
                    sites.push(newSite);
                }
            }
        }
        return sites;
    },
    loadFromUpdate : function (updates,updateSite)
    {
        var sites; 
        var configContents="";
        var jsonfile = updateSite.filename.replace(/\.xml/,".json");
        try{
            configContents= autopagerBwUtil.getConfigFileContents(jsonfile);
            if (typeof configContents !="undefined" && configContents!=null && configContents.length>0)
            {
                sites = autopagerJsonSetting.loadCompactFromString(configContents,updateSite);
                sites.updateSite = updateSite;                
            }
            sites = autopagerJsonSetting.doMergeOverrides(sites,updates,true);
        }catch(e){
            sites = new Array();
        }
        sites.partlyUpdated = true;
        return sites;
    }
    ,
    saveCompactToString : function (sites)
    {
        return autopagerBwUtil.encodeJSON(sites);
    },
    saveNormalToCompactString : function (normalSites)
    {
        var str = null;
        var sites = new Array();
        var defaultMargin = autopagerMain.getDefaultMargin();
        for(var i=0;i<normalSites.length;i++){
            var site = normalSites[i]

            var newSite = autopagerJsonSetting.normalToCompact(site,defaultMargin);
            sites.push(newSite);
        }

        str = autopagerJsonSetting.saveCompactToString(sites);
        return str;
    },
    saveOverrideToCompactString : function (normalSites)
    {
        var str = null;
        var overrides = new Array();
        for(var i=0;i<normalSites.length;i++){
            var site = normalSites[i]
            if (site.changedByYou)
            {
                var override = autopagerJsonSetting.overrideToCompact(site);
                if (override!=null)
                    overrides.push(override);
            }
        }

        str = autopagerJsonSetting.saveCompactToString(overrides);

        return str;
    },
    mergeOverrides : function (updateSite,normalSites,overrides)
    {
        if (overrides==null || updateSite==null)
            return;
        var guids = []
        var file = updateSite.filename
        if (file=="autopagerTee.xml" || file =="autopagerBeta.xml")
        {
            for(var o=0;o<overrides.length;o++)
            {
                var override = overrides[o]
                if (override.g && (typeof override.g!="number" && !override.g.match(/^a?[0-9]+$/)))
                {
                    guids.push(override.g)
                }
            }
        }
        if (guids.length>0)
        {
            try{
                var xmlhttp=autopagerUtils.newXMLHttpRequest()
                xmlhttp.overrideMimeType("application/json");
                xmlhttp.onreadystatechange = function (aEvt) {
                    if(xmlhttp.readyState == 4) {
                        if(xmlhttp.status == 200) {
                            var maps = autopagerBwUtil.decodeJSON(xmlhttp.responseText);
                            var newOverrides = [];
                            for(var o=0;o<overrides.length;o++)
                            {
                                var override = overrides[o]
                                if (override.g)
                                {
                                    if ((typeof override.g=="number" || !override.g.match(/^a?[0-9]+$/)))
                                    {
                                        newOverrides.push(override)
                                    }else if (maps!=null && typeof maps[override.g] != "undefined")
                                    {
                                        override.g = maps[override.g];
                                        override.k = override.g;
                                        newOverrides.push(override)
                                    }
                                }
                            }
                            autopagerJsonSetting.doMergeOverrides(normalSites,newOverrides);
                            var jsonfile = updateSite.filename.replace(/\.xml/,".json.override");
                            autopagerConfig.saveOverrideToJsonFile(normalSites, autopagerBwUtil.getConfigFile(jsonfile));
                        }
                    }
                }

                xmlhttp.open("GET", autopagerPref.loadPref("repository-site") + "d/guid2id?gids=" +guids.join(","), true);
                //window.content.status = "loading ... " + url;
                xmlhttp.send(null);

            }catch (e){
                autopagerBwUtil.consoleError(e);
            }
            
        }
        else
        {
            autopagerJsonSetting.doMergeOverrides(normalSites,overrides)
        }
    }
    ,doMergeOverrides : function (normalSites,overrides,noOldRefer)
    {
        var newSites = []
        for(var o=overrides.length-1;o>=0;o--)
        {
            var merged = false;
            try{
                var override = overrides[o]
                //check the first part of rules
                for(var i=o;i>=0;i--){
                    var site = normalSites[i]
                    if (site.guid == override.g || (override.k && site.id == override.k))
                    {
                        autopagerJsonSetting.mergeOverrideToNormal(site,override,noOldRefer);
                        merged = true;
                        break;
                    }
                }
                if (!merged){
                    for(var i=o+1;i<normalSites.length;i++){
                        var site = normalSites[i]
                        if (site.guid == override.g || (override.k && site.id == override.k))
                        {
                            autopagerJsonSetting.mergeOverrideToNormal(site,override,noOldRefer);
                            merged = true;
                            break;
                        }
                    }                    
                }                    
                if (!merged)
                {
                    var newSite = autopagerJsonSetting.compactToNormal(override);
                    newSites.push(newSite);
                }
            }catch (e){
                autopagerBwUtil.consoleError(e);
            }
        }
        if(newSites.length==0)
            return normalSites;
        return newSites.concat(normalSites);
    },
    compactToNormal : function(site)
    {
            var newSite = new AutoPagerNS.Site();
            newSite.urlPattern  = site.u;
            if (typeof site.k != 'undefined')
            {
                newSite.id = site.k;
                newSite.guid  = site.k;
            }
            if (typeof site.g != 'undefined')
                newSite.guid  = site.g;
            
            if (typeof site.r != 'undefined')
                newSite.isRegex  = site.r;

            if (typeof site.e != 'undefined')
                newSite.enabled  = site.e;

            if (typeof site.j != 'undefined')
                newSite.enableJS  = site.j;

            
            if (!(typeof site.x == 'undefined'))
            {
                newSite.contentXPath=[]
                if (typeof site.x == 'string')
                {
                    var x = autopagerUtils.trim(site.x);
                    if (x.length>0)
                        newSite.contentXPath.push(x);
                }
                else
                {
                    for(var i=0;i<site.x.length;i++)
                    {
                        newSite.contentXPath.push(site.x[i]);
                    }
                }
            }

            newSite.linkXPath = site.n;
            if (typeof site.d != 'undefined')
                newSite.desc = site.d;

            if (typeof site.m != 'undefined')
                newSite.margin  = site.m;

            if (typeof site.q != 'undefined' && site.q!=1 && site.q!=true)
                newSite.quickLoad  = site.q;

            if (typeof site.f != 'undefined')
                newSite.fixOverflow  = site.f;

            if (site.c)
                newSite.createdByYou  = site.c;

            if (site.y)
                newSite.changedByYou  = site.y;

            if (typeof site.o != 'undefined')
                newSite.owner  = site.o;

            if (typeof site.t != 'undefined')
            {
                newSite.testLink = []
                newSite.testLink.push(site.t);
            }
            if (typeof site.h != 'undefined')
                newSite.containerXPath=site.h;
            if (typeof site.b != 'undefined')
                newSite.monitorXPath=site.b;

            if (typeof site.l != 'undefined')
            {
                newSite.removeXPath = []
                if (typeof site.l == 'string')
                    newSite.removeXPath.push(site.l);
                else
                {
                    for(var i=0;i<site.l.length;i++)
                    {
                        newSite.removeXPath.push(site.l[i]);
                    }
                }
            }
            if (typeof site.a != 'undefined')
                newSite.ajax=site.a;
            if (typeof site.w != 'undefined')
                newSite.needMouseDown = site.w;

            if (typeof site.p != 'undefined')
                newSite.published = site.p;
            if (typeof site.i != 'undefined')
                newSite.minipages = site.i;
            if (typeof site.s != 'undefined')
                newSite.delaymsecs = site.s;

            if (typeof site.v != 'undefined')
                newSite.formatVersion = site.v;

            if (typeof site.lz != 'undefined')
                newSite.lazyImgSrc  = site.lz;
            if (typeof site.kx != 'undefined')
                newSite.keywordXPath  = site.kx;
            if (typeof site.ah != 'undefined')
                newSite.alertsHash  = site.ah;

            if (typeof site.rt != 'undefined')
                newSite.rate  = site.rt;
            
            return newSite;
    },
    mergeOverrideToNormal : function(normalSite,site,noOldRefer)
    {
        if (normalSite.guid  != site.g && normalSite.guid  != site.k)
            return;
        if (!noOldRefer)
        {
            normalSite.oldSite = autopagerConfig.cloneSite(normalSite);
            normalSite.changedByYou  = true;
        }
            if (typeof site.u != 'undefined')
                normalSite.urlPattern  = site.u;
            //normalSite.guid  = site.g;
            if (typeof site.r != 'undefined')
                normalSite.isRegex  = site.r;

            if (typeof site.e != 'undefined')
                normalSite.enabled  = site.e;

            if (typeof site.j != 'undefined')
                normalSite.enableJS  = site.j;

            if (typeof site.x != 'undefined')
            {
                normalSite.contentXPath = [];
                if (typeof site.x == 'string')
                {
                    var x = autopagerUtils.trim(site.x);
                    if (x.length>0)
                        normalSite.contentXPath.push(x);
                }
                else
                {
                    for(var i=0;i<site.x.length;i++)
                    {
                        normalSite.contentXPath.push(site.x[i]);
                    }
                }
           }

            if (typeof site.n != 'undefined')
                normalSite.linkXPath = site.n;
            if (typeof site.d != 'undefined')
                normalSite.desc = site.d;

            if (typeof site.m != 'undefined')
                normalSite.margin  = site.m;

            if (typeof site.q != 'undefined' && site.q!=1 && site.q!=true)
                normalSite.quickLoad  = site.q;

            if (typeof site.f != 'undefined')
                normalSite.fixOverflow  = site.f;


            if (typeof site.o != 'undefined')
                normalSite.owner  = site.o;

            if (typeof site.t != 'undefined')
                normalSite.testLink.push(site.t);
            if (typeof site.h != 'undefined')
                normalSite.containerXPath=site.h;
            if (typeof site.b != 'undefined')
                normalSite.monitorXPath=site.b;

            if (typeof site.l != 'undefined')
            {
                normalSite.removeXPath = [];
                if (typeof site.l == 'string')
                    normalSite.removeXPath.push(site.l);
                else
                {
                    for(var i=0;i<site.l.length;i++)
                    {
                        normalSite.removeXPath.push(site.l[i]);
                    }
                }
            }
            if (typeof site.a != 'undefined')
                normalSite.ajax=site.a;
            if (typeof site.w != 'undefined')
                normalSite.needMouseDown = site.w;

            if (typeof site.p != 'undefined')
                normalSite.published = site.p;
            if (typeof site.i != 'undefined')
                normalSite.minipages = site.i;
            if (typeof site.s != 'undefined')
                normalSite.delaymsecs = site.s;

            if (typeof site.v != 'undefined')
                normalSite.formatVersion = site.v;
            if (typeof site.lz != 'undefined')
                normalSite.lazyImgSrc  = site.lz;
            if (typeof site.kx != 'undefined')
                normalSite.keywordXPath  = site.kx;
            if (typeof site.ah != 'undefined')
                normalSite.alertsHash  = site.ah;
            if (typeof site.rt != 'undefined')
                normalSite.rate  = site.rt;
    },

    arrayEqual : function (a1, a2)
    {
        if (a1==null)
        {
            return (a2==null);
        }
        if (a2==null)
            return false;
        if (a1.length!=a2.length)
            return false;
        for(var i=0;i<a1.length;++i)
	{
            if (a1[i] != a2[i])
		return false;
	}
        return true;
    },
    overrideToCompact : function(normal)
    {
            var override = new Object();
            override.g = normal.guid;
            var oldSite = normal.oldSite
            if (oldSite==null)
                return null;
            if (normal.urlPattern!=oldSite.urlPattern)
                override.u = normal.urlPattern;

            if (normal.isRegex != oldSite.isRegex)
                override.r = normal.isRegex;
            if (normal.margin != oldSite.margin)
                override.m = normal.margin;
            if (normal.enabled != oldSite.enabled)
              override.e = normal.enabled;

            if (normal.enableJS != oldSite.enableJS)
                override.j = normal.enableJS;
            if (normal.quickLoad != oldSite.quickLoad)
                override.q = normal.quickLoad;
            if (normal.fixOverflow != oldSite.fixOverflow)
                override.f = normal.fixOverflow;

//            if (normal.createdByYou != oldSite.createdByYou)
//                override.c = normal.createdByYou;

//            if (normal.changedByYou != oldSite.changedByYou)
//                override.y = normal.changedByYou;

//            override.o = normal.owner;

            if (!autopagerJsonSetting.arrayEqual(normal.contentXPath,oldSite.contentXPath))
            {
                if (normal.contentXPath.length==1)
                    override.x = normal.contentXPath[0];
                else
                    override.x = normal.contentXPath;
            }
            if (normal.linkXPath != oldSite.linkXPath)
                override.n = normal.linkXPath;

            if (normal.desc != oldSite.desc)
                if (typeof normal.desc != 'undefined' && normal.desc!=null && normal.desc.length>0)
                    override.d = normal.desc;
            
            if (normal.testLink && normal.testLink != oldSite.testLink && normal.testLink.length>0)
                override.t = normal.testLink[0];

            if (normal.containerXPath != oldSite.containerXPath)
            if (normal.containerXPath && normal.containerXPath.length>0)
                override.h = normal.containerXPath;

            if (normal.monitorXPath != oldSite.monitorXPath)
            if (normal.monitorXPath && normal.monitorXPath.length>0)
                override.b = normal.monitorXPath;

            if (!autopagerJsonSetting.arrayEqual(normal.removeXPath,oldSite.removeXPath))
            {
                if (normal.removeXPath.length==1)
                    override.l = normal.removeXPath[0];
                else if (normal.removeXPath.length>1)
                    override.l = normal.removeXPath;
            }
            if (normal.lazyImgSrc != oldSite.lazyImgSrc)
                override.lz  = normal.lazyImgSrc;

            if (normal.ajax != oldSite.ajax)
                override.a = normal.ajax;
            if (normal.needMouseDown != oldSite.needMouseDown)
                 override.w = normal.needMouseDown;

//            if (normal.published != oldSite.published)
//                 override.p = normal.published;
            if (normal.minipages != oldSite.minipages)
                 override.i = normal.minipages;
            if (normal.delaymsecs != oldSite.delaymsecs)
                override.s = normal.delaymsecs;
            
            if (typeof normal.id != 'undefined')
                override.k = normal.id;

            var count=0;
            for(var key in override)
            {
                count ++;
            }
            //not only g : guid
            if (count>1)
                return override;
            return null;
    },
    normalToCompact : function(normal,defaultMargin)
    {
            var site = new Object();
            site.u = normal.urlPattern;
            site.g = normal.guid;
            if (normal.isRegex)
                site.r = normal.isRegex;
            if (normal.margin != defaultMargin)
                site.m = normal.margin;
            if (!normal.enabled)
              site.e = normal.enabled;

            if (normal.enableJS)
                site.j = normal.enableJS;
            if (!normal.quickLoad)
                site.q = normal.quickLoad;
            if (normal.fixOverflow)
                site.f = normal.fixOverflow;
            
            if (normal.createdByYou)
                site.c = normal.createdByYou;

            if (normal.changedByYou)
                site.y = normal.changedByYou;

            site.o = normal.owner;
            if (normal.contentXPath.length==1)
                site.x = normal.contentXPath[0];
            else
                site.x = normal.contentXPath;

            site.n = normal.linkXPath;
            if (typeof normal.desc != 'undefined' && normal.desc!=null && normal.desc.length>0)
                site.d = normal.desc;
            if (normal.testLink && normal.testLink.length>0)
                site.t = normal.testLink[0];
            if (normal.containerXPath!=null && normal.containerXPath.length>0)
                site.h = normal.containerXPath;
            if (normal.monitorXPath!=null && normal.monitorXPath.length>0)
                site.b = normal.monitorXPath;

            if (normal.removeXPath)
            {
                if (normal.removeXPath.length==1)
                    site.l = normal.removeXPath[0];
                else if (normal.removeXPath.length>1)
                    site.l = normal.removeXPath;
            }

            if (normal.ajax)
                site.a = normal.ajax;
            if (normal.needMouseDown)
                 site.w = normal.needMouseDown;
            
            if (normal.published)
                 site.p = normal.published;
            if (normal.minipages >=0)
                 site.i = normal.minipages;
            if (normal.delaymsecs>=0)
                site.s = normal.delaymsecs;
            if (typeof normal.formatVersion != 'undefined')
                site.v = normal.formatVersion;
            if (typeof normal.id != 'undefined')
                site.k = normal.id;

            if (typeof normal.lazyImgSrc != 'undefined')
                site.lz = normal.lazyImgSrc;

            if (typeof normal.keywordXPath != 'undefined')
                site.kx = normal.keywordXPath;

            if (typeof normal.alertsHash != 'undefined')
                site.ah = normal.alertsHash;
            if (typeof normal.rate != 'undefined')
                site.rt = normal.rate;

            return site;
    },
    supported : function (site,browserFlag)
    {
        //browser flag
        return !site.bf || site.bf & browserFlag;
    },
    saveApConfig : function (site)
    {
        if (typeof site.n != 'undefined')
        {
           autopagerPref.savePref("messageId",site.n);
           var latestMessageId = autopagerPref.loadPref("latestMessageId");
           if (!latestMessageId)
               latestMessageId=0;
           if (site.n > latestMessageId)
           {
               var url =autopagerPref.loadPref("repository-site") + "msgs?from=" + latestMessageId
               var callback = function()
               {
                   autopagerPref.savePref("latestMessageId",site.n);
                   AutoPagerNS.add_tab({url:url});
               }
               AutoPagerNS.browser.open_alert(autopagerUtils.autopagerGetString("thereisalert"),autopagerUtils.autopagerGetString("needyourattention"),url,callback)
           }
           

        }
        else
            autopagerPref.savePref("messageId",0);
        if (typeof site.kx != 'undefined')
            autopagerPref.savePref("keywordXPath",site.kx);
        else
            autopagerPref.savePref("keywordXPath","");

        if (typeof site.ss != 'undefined')
            autopagerPref.savePref("searchs",autopagerBwUtil.encodeJSON(site.ss));
    }
}
