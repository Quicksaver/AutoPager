var autopagerTranslate =
{
    translateStrings : function(doc,callback)
    {
//        autopagerBwUtil.consoleLog("translateStrings")
        var Me = this
        var strings = AutoPagerNS.strings
//        autopagerBwUtil.consoleLog("translateStrings :" + strings)
        

//        autopagerBwUtil.consoleLog("translateStrings 2")
        var title = Me.processString(doc.title,strings)
//        autopagerBwUtil.consoleLog("translateStrings 4")
        
        doc.title = title
//        autopagerBwUtil.consoleLog("translateStrings 5")
        
        Me.processDocumentText(doc,strings);
//        autopagerBwUtil.consoleLog("translateStrings 6")
        
        Me.processDocumentAttr(doc,strings,"title");
//        autopagerBwUtil.consoleLog("translateStrings 7")
        
        if (callback)
            callback(Me)
//        autopagerBwUtil.consoleLog("translateStrings 8")

    }
    ,
    processDocumentText : function (doc,strings)
    {
        var nodes = doc.evaluate("//text()[contains(.,'&') and contains(.,';')]", doc, null, AutoPagerNS.XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null );
        var node = nodes.iterateNext();
        var arr=[]
        while (node) {
            arr.push(node)
            node = nodes.iterateNext();
        }
        for(var i=0;i<arr.length;i++)
        {
            var s = this.processString(arr[i].textContent,strings)
            arr[i].textContent = s;
        }
    }
    ,
    processDocumentAttr : function (doc,strings,attr)
    {
        var nodes = doc.evaluate("//*[contains(@" + attr +",'&') and contains(@" + attr +",';')]", doc, null, AutoPagerNS.XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null );
        var node = nodes.iterateNext();
        var arr=[]
        while (node) {
            arr.push(node)
            node = nodes.iterateNext();
        }
        for(var i=0;i<arr.length;i++)
        {
            var s = this.processString(arr[i].getAttribute(attr),strings)
            arr[i].setAttribute(attr, s);
        }
    }
    ,
    processString : function (str,strings)
    {
        //alert(str)
        var keys = str.match(/\&amp\;[a-zA-Z0-9\.\-\_]+\;/g);
        if (keys)
        {
            //alert(keys.length)
            for(var i=0;i<keys.length;i++)
            {
                var k = keys[i]
                var key = k;
                if (/^\&amp\;/.test(k))
                    key = k.substring(5,k.length-1)
                else
                    key = k.substring(1,k.length-1)
                //html = html.replace(new RegExp("&" + k, 'g'),strings.getString(k))
                str = str.replace(new RegExp(k, 'g'),strings.getString(key))
            }
        }
        //alert(str)
        keys = str.match(/\&[a-zA-Z0-9\.\-\_]+\;/g);
        if (keys)
        {
            //alert(keys.length)
            for(var i=0;i<keys.length;i++)
            {
                var k = keys[i]
                var key = k;
                if (/^\&amp\;/.test(k))
                    key = k.substring(5,k.length-1)
                else
                    key = k.substring(1,k.length-1)
                //html = html.replace(new RegExp("&" + k, 'g'),strings.getString(k))
                str = str.replace(new RegExp(k, 'g'),strings.getString(key))
            }
        }
        //alert(str)
        return str;
    }
    ,
    translate : function (doc,callback)
    {
        this.translateStrings(doc,callback);
    }
}
