AutoPagerNS.language = AutoPagerNS.extend (AutoPagerNS.namespace("language"),
{
    currentlang: "en-US",
    langs : ["de",
    "en-US",
    "es",
    "fi-FI",
    "fr",
    "he-IL",
    "hu-HU",
    "it-IT",
    "ja-JP",
    "nl",
    "pl-PL",
    "pt-BR",
    "ro-RO",
    "ru-RU",
    "sq-AL",
    "tr-TR",
    "vi",
    "zh-CN",
    "zh-TW"],
    supportLang : function (lang)
    {
        for(var l=0;l<this.langs.length;l++)
        {
            if (this.langs[l]==lang)
                return lang;
        }
        var lUp = lang.toUpperCase().replace(/_/, "-")
        for(var l=0;l<this.langs.length;l++)
        {
            if (this.langs[l].toUpperCase()==lUp)
                return this.langs[l];
        }
        return false;
    },
    init : function()
    {
        //alert("init")
        var Me = this
        try{
            AutoPagerNS.get_accept_languages(
                function(langs)
                {
                    for(var l=0;l<langs.length;l++)
                    {
                        var translatedLang = Me.supportLang(langs[l])
                        if (translatedLang)
                        {
                            Me.currentlang = translatedLang
                            //alert("3" + ts.currentlang)
                            break;
                        }
                    }
                });

        }catch(e){
            autopagerBwUtil.consoleError("error set language") 
        }
    }
    ,
    post_init : function ()
    {
        this.init();
    }
}
);
