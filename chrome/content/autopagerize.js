var AutoPagerize= {
    parseInfo:function(str) {
        var lines = str.split(/\r\n|\r|\n/)
        var re = /(^[^:]*?):(.*)$/
        var strip = function(str) {
            return str.replace(/^\s*/, '').replace(/\s*$/, '')
        }
        var info = {}
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].match(re)) {
                info[RegExp.$1] = strip(RegExp.$2)
            }
        }
        if (info["url"]=="^https?://.*")
            return false;
        info.remainHeight = parseInt(info.remainHeight)
        var isValid = function(info) {
            var infoProp = ['nextLink', 'insertBefore', 'pageElement']
            for (var i = 0; i < infoProp.length; i++) {
                if (!infoProp[i]) {
                    return false
                }
            }
            return true
        }
        return isValid(info) ? info : null
    },
    onJsonLoad :function(doc,updatesite)
    {
        var info = autopagerBwUtil.decodeJSON(doc);
        //alert(info)
        var sites = new Array();
        for(var i=0;i<info.length;i++){
            var ifo = info[i]
            var site = ifo.data;
            if (site["url"]=="^https?://.*" || site["url"]=="^https?://.")
                continue;
            var newSite = autopagerConfig.newDefaultSite();
            newSite.urlPattern  = site["url"];
            newSite.guid  = ifo.resource_url;
            newSite.isRegex  = true;
            if (!isNaN(site["remainHeight"] ))
                newSite.margin  = site["remainHeight"] / 500;
            newSite.enabled  = true;
            newSite.enableJS  = false;
            newSite.quickLoad  = false;
            newSite.fixOverflow  = false;
            newSite.createdByYou  = false;
            newSite.changedByYou  = false;
            newSite.owner  = ifo.created_by;
            newSite.contentXPath=new Array();
            newSite.contentXPath.push(site["pageElement"]);

            newSite.linkXPath = site["nextLink"];
            //if (site["desc"] && site["exampleUrl"])
            newSite.desc = site["exampleUrl"];
            if (site["desc"])
                newSite.desc = newSite.desc + "\n" + site["desc"];
//            else if (site["exampleUrl"])
//                newSite.desc = site["exampleUrl"];
//            else if (site["desc"])
//                newSite.desc = site["desc"];
//            
//            newSite.oldSite = null;
            sites.push(newSite);
	}
        
        return sites;        
    },
    onload:function(doc,updatesite)
    {
        var info = []
        // '//*[@class="autopagerize_data"]'
        var textareas = AutoPagerNS.apxmlhttprequest.getElementsByXPath(
            updatesite.xpath, doc) || [];
            
        for(var i=0;i<textareas.length;i++)
        {
            var textarea = textareas[i];
            var d = AutoPagerize.parseInfo(textarea.value)
            if (d) {
                var text = AutoPagerize.getDesc(textarea);
                d["desc"] = text;
                info.push(d)
            }
        }
        return AutoPagerize.handleInfos(info,updatesite);
    },
    handleInfos :function(info,updatesite)
    {    var sites = new Array();
        for(var i=0;i<info.length;i++){
            var site = info[i];
            var newSite = autopagerConfig.newDefaultSite();
            newSite.urlPattern  = site["url"];
            newSite.guid  = newSite.urlPattern;
            newSite.isRegex  = true;
            if (!isNaN(site["remainHeight"] ))
                newSite.margin  = site["remainHeight"] / 500;
            newSite.enabled  = true;
            newSite.enableJS  = false;
            newSite.quickLoad  = false;
            newSite.fixOverflow  = false;
            newSite.createdByYou  = false;
            newSite.changedByYou  = false;
            newSite.owner  = updatesite.owner;
            newSite.contentXPath=new Array();
            newSite.contentXPath.push(site["pageElement"]);

            newSite.linkXPath = site["nextLink"];
            newSite.desc = site["desc"];
            newSite.oldSite = null;
            sites.push(newSite);
	}
        
        return sites;
    },
    getDesc:function(textarea)
    {
        var descNode = textarea.parentNode.previousSibling;
        while ( (descNode.previousSibling != null) && (! (descNode instanceof HTMLHeadingElement)))
        {
            descNode = descNode.previousSibling;
        }
        if (descNode!=null)
        {
            return descNode.textContent;
        }
        return "Can't get desc";
    }
}
