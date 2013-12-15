var autopagerTroubleShoting =
{
    autoFix : function (doc)
    {
        autopagerTroubleShoting.shoting(doc,true);
    },
    shoting : function (doc, autofix)
    {
        //check whether AutoPager enabled
        if (!autopagerPref.loadBoolPref("enabled") || !autopagerUtils.isEnabledOnHost(doc))
        {
            if (autofix || autopagerTroubleShoting.prompt("AutoFix","EnableAutoPager")){
                autopagerMain.setGlobalEnabled(true);
                autopagerUtils.setEnabledOnHost(true,doc)                
                autopagerUtils.setConfirmedOnHost(true,doc)
            }
        }

        //check whether AutoPager enabled on the site
        var matched = autopagerTroubleShoting.reEnableOnDoc(autopagerUtils.getTopDoc(doc),autofix);
        AutoPagerNS.UpdateSites.updateOnline(true);
        //check whether there is rules for this site
        if (!matched)
        {
            if (autopagerTroubleShoting.prompt("AutoFix","CreateANewRule"))
            {
                autopagerBwUtil.sitewizard(doc);
            }
            else if (autofix || autopagerTroubleShoting.prompt("AutoFix","RequestHelpOnSite"))
            {
                autopagerMain.requestHelp(doc,doc);
            }
        }

    },
    reEnableOnDoc : function(doc,autofix)
    {
        var de = doc.documentElement;
        var matched = false;
        if (doc.location && autopagerUtils.getAutoPagerObject(de) != null)
        {
            var obj = autopagerUtils.getAutoPagerObject(de)
            var siteConfirm = autopagerConfig.findConfirm(autopagerConfig.getConfirm(),
                obj.site.guid,doc.location.host);
            if (siteConfirm!=null && !siteConfirm.UserAllowed)
            {
                if (autofix || autopagerTroubleShoting.prompt("AutoFix","EnableAutoPagerOnSite"))
                {
                    siteConfirm.UserAllowed = true;
                    document.autopagerConfirmDoc = doc
                    autopagerMain.enabledInThisSession(siteConfirm.UserAllowed);
                    autopagerConfig.saveConfirm(autopagerConfig.getConfirm());
                }
            }

            matched = true;
        }
        if (doc.defaultView && doc.defaultView.frames != null) {
            //alert(doc.defaultView.frames.length);
            for(var i=0;i<doc.defaultView.frames.length;++i) {
                var frame = doc.defaultView.frames[i].document;
                if (autofix.reEnableOnDoc(frame,autofix) && !matched)
                    matched = true
            }
        }
        return matched;
    },

    prompt : function (titleKey,textKey)
    {
        var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
        .getService(Components.interfaces.nsIPromptService);
        return prompts.confirm(window,autopagerUtils.autopagerGetString(titleKey),autopagerUtils.autopagerGetString(textKey));

    }
    ,resetAll  : function(doc)
    {
        //reset all config
        autopagerPref.resetAll();
        //reset all rules
        autopagerRules.resetAll();
        //delete autopager config folder
        autopagerBwUtil.deleteConfigFolder();

    }
}