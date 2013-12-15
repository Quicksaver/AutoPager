var autopagerRules =
{
    autopagerCOMP:null,
    ignoresites : null,
    ignoreRegex : null,
    isAllowUpdate : function()
    {
        return true;
    }
    ,
    getAutopagerCOMP : function ()
    {
        if (this.autopagerCOMP == null)
        {
            this.autopagerCOMP = new AutopagerCOMPType();
        }
        return this.autopagerCOMP;
    }
    ,
    getNextMatchedSiteConfig: function(url,pos)
    {
        //truncateUrl long url
        if (url.length>1024)
            url = this.truncateUrl(url);
        if (!autopagerUtils.equals(autopagerPref.loadPref("ignoresites"),this.ignoresites))
        {
            this.ignoresites = autopagerPref.loadPref("ignoresites");
            this.ignoreRegex = autopagerUtils.newRegExp(this.ignoresites);
        }
        if (this.ignoreRegex && this.ignoreRegex.test(url))
        {
            return null;
        }
        return autopagerRules.doGetNextMatchedSiteConfig(AutoPagerNS.UpdateSites.loadAll(),url,pos);
    }
    ,
    doGetNextMatchedSiteConfig: function(allSites,url,pos)
    {
        var key;
        var fileStarted = (pos ==="" || pos ==null || pos.key==null || pos.index==null);
        var firstCall = fileStarted
        //var lineStarted = (pos =="" || pos ==null || pos.key==null || pos.index==null);
        for ( key in allSites){
            var tmpsites = allSites[key];
            
            // alert(autopagerBwUtil.encodeJSON(tmpsites))
            if (tmpsites==null || !tmpsites.updateSite || !tmpsites.updateSite.enabled)
                continue;
            if (!fileStarted)
                fileStarted = (key == pos.key);
            if (!fileStarted)
                continue;
            var start = 0;
            if (!firstCall && key == pos.key)
                start = pos.index +1
            //alert(tmpsites.updateSite.filename + ":" + tmpsites.length)

            for (var i = start; i < tmpsites.length; i++) {
            //                if (!started)
            //                    started = ((key == pos.key) && i>=pos.index);
            //                else
            {
                var site = tmpsites[i];
                var pattern = site.regex || autopagerUtils.getRegExp(site);
                if (pattern.test(url)) {
                    var newSite = autopagerConfig.cloneSite (site);
                    newSite = autopagerConfig.completeRule(newSite)
                    newSite.updateSite = null;
                    delete newSite.oldSite;

                    var p = {};
                    p.key = key;
                    p.index = i;
                    p.site=newSite;
                    return p;
                }
            }
            }
        }
        return null;
    }
    ,
    discoverRule: function(url)
    {
        if (!autopagerPref.loadBoolPref("with-lite-discovery"))
            return null;
        if (!autopagerPref.loadBoolPref("mode-prompted") || !autopagerPref.loadBoolPref("lite-discovery-prompted"))
        {
//            //use chrome notification api if there are
//            safari.windows.getCurrent(function(w){
//                alert(w.notifications)
//                alert(w.webkitNotifications)
//            })
            //safari.windows.create({url:'about:blank',height:90},function(w){                
            //})
            return {promptNeed:true};
        }
        //truncateUrl long url
        if (url.length>1024)
            url = this.truncateUrl(url);
        var patterns = this.getAutopagerCOMP().getPatterns();
        if (patterns)
        {
            for(var i=0;i<patterns.length;i++)
            {
                var pattern = patterns[i];
                if (pattern)
                {
                    var p = pattern.rg || autopagerUtils.getRegExp2(pattern);
                    if (p.test(url)) {
                        return pattern;
                    }                    
                }
            }
        }
        return null;
    }
    ,truncateUrl : function(url)
    {
        //include the first 1000 char and the latest 24 chars
        return url.substr(0,1000) + url.substr(url.length-24);
    }
    , addRule : function (key,rule)
    {
        var repos = AutoPagerNS.UpdateSites.loadAll();
        var tmpsites = repos[key];
        if (!tmpsites)
        {
            tmpsites = []
            tmpsites.updateSite = new AutoPagerNS.AutoPagerUpdateSite("Wind Li","all",
            "","text/html; charset=utf-8",
            key+ " configurations",
            key,"//site",true,"autopager-xml",0);
            repos[key] = tmpsites;
        }
        tmpsites.push(rule);
        return {key:key,index:tmpsites.length-1,site:rule};
    }
}
