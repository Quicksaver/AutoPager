var autopagerOptionUI = {
    init : function()
    {
        var checks = document.getElementsByTagName("checkbox")
        for(var i=0;i<checks.length;i++)
        {
            if (checks[i].getAttribute("pref"))
            {
                checks[i].setAttribute("checked",autopagerPref.loadBoolPref(checks[i].getAttribute("pref")));
            }else if (checks[i].getAttribute("prefV"))
            {
                checks[i].setAttribute("checked",!autopagerPref.loadBoolPref(checks[i].getAttribute("prefV")));
            }
        }
        var menus = document.getElementsByTagName("menulist")
        for(var i=0;i<menus.length;i++)
        {
            if (menus[i].getAttribute("pref"))
            {
                menus[i].value=autopagerPref.loadPref(menus[i].getAttribute("pref"));
            }
        }
    },
    handleHelpButton : function(){
        autopagerUtils.showHelp();
    },
    setBoolPref : function (key, v)
    {
        autopagerPref.saveBoolPref(key,v);
    },
    setCharPref : function (key, v)
    {
        autopagerPref.savePref(key,v);
    },
    handleOkButton : function()
    {
        var checks = document.getElementsByTagName("checkbox")
        for(var i=0;i<checks.length;i++)
        {
            if (checks[i].getAttribute("pref"))
            {
                this.setBoolPref(checks[i].getAttribute("pref"),checks[i].getAttribute("checked")=='true');
            }else if (checks[i].getAttribute("prefV"))
            {
                this.setBoolPref(checks[i].getAttribute("prefV"),checks[i].getAttribute("checked")!='true');
            }
        }
        var menus = document.getElementsByTagName("menulist")
        for(var i=0;i<menus.length;i++)
        {
            if (menus[i].getAttribute("pref"))
            {
                this.setCharPref(menus[i].getAttribute("pref"),menus[i].getAttribute("value"));
            }
        }
    },
    handleMoreOptionButton : function()
    {
        autopagerBwUtil.openSetting("");
    }
}