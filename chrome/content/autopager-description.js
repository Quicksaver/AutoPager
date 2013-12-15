/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

function autopagerDescription(prefix,doc)
{
    this.likPrefix = prefix;
    if (doc)
        this.init(doc)
}

autopagerDescription.prototype= {
    tipsOn:0,
    previouseElement : null,
    likPrefix: null,
    eventAdded: false,
    moutIn : false,
    init : function(doc)
    {
        var nodes = autopagerXPath.evaluate(doc,"//*[@keyword]",false,1024);
        for(var i=0;i<nodes.length;i++)
        {
            var node = nodes[i]
            this.initNode(node);
        }
    }
    ,
    initNode: function(node)
    {
        var ctrlClik = (node.tagName == "toolbarbutton" || node.tagName == "button"
                || node.tagName == "treecol" || node.tagName == "menuitem"|| node.tagName == "menupopup"
                || node.tagName == "A");
        if (!ctrlClik)
        {
            if (node.tagName != "caption" && node.tagName != "label"
                && node.tagName != "H2" && node.tagName != "H1" && node.tagName != "SPAN" && node.tagName != "P")
            {
                var q = node.ownerDocument.createElement('label');
                q.setAttribute("value", "?")
                if (node.parentNode.tagName!="hbox")
                {
                    var h = node.ownerDocument.createElement('hbox');
                    node.parentNode.insertBefore(h,node)
                    h.appendChild(node)
                    h.appendChild(q)
                    if (autopagerUtils.isBlank(node.getAttribute("flex")))
                        node.setAttribute("flex", "1");
                }
                else if(node.nextSibling)
                {
                    node.parentNode.insertBefore(q,node.nextSibling)
                }
                else
                    node.parentNode.appendChild(q)

                q.setAttribute("keyword", node.getAttribute("keyword"))
                node= q
            }
            var classname = "show-tip";
            if (!autopagerUtils.isBlank(node.getAttribute("class")))
                classname = node.getAttribute("class") + "," + classname;
            node.setAttribute("class",classname)
        }
        var Me = this

        var tip = autopagerUtils.autopagerGetString("viewdescription")
        if (!ctrlClik)
        {
            node.addEventListener("click",function(event){Me.onClick(event.target);},false)
        }else{
            if (!autopagerUtils.isBlank(node.getAttribute("onclick")))
            {
                node.setAttribute("onclick","if (event.ctrlKey) return;" + node.getAttribute("onclick"));
            }
            if (!autopagerUtils.isBlank(node.getAttribute("oncommand")))
            {
                node.setAttribute("oncommand","if (event.ctrlKey) return;" + node.getAttribute("oncommand"));
            }

            node.addEventListener("click",function(event){Me.onCtrlClick(event);},true)
            tip = autopagerUtils.autopagerGetString("viewdescription2")
        }
        node.setAttribute("tooltiptext",autopagerUtils.mergeString(". " , node.getAttribute("tooltiptext"), tip));
        node.setAttribute("title",autopagerUtils.mergeString(". " , node.getAttribute("title"), tip));
    },
    needShowTip : function(ele)
    {
        return ele.tagName == 'lable'
        || ele.tagName == 'textbox'
        || ele.tagName == 'button'
        || ele.tagName == 'tree'
        || ele.tagName == 'checkbox'
        || ele.tagName == 'menulist'
        || ele.tagName == 'toolbarbutton'
    ;
    },
    onClick : function(ele)
    {
        var hostPrefix = autopagerPref.loadPref("site-prefix")
        if (autopagerUtils.isBlank(hostPrefix))
            hostPrefix = 'http://www.teesoft.info';
        AutoPagerNS.add_tab({url:hostPrefix + "/wiki/" + this.likPrefix + ele.getAttribute("keyword"), target:"_blank"});
        window.setTimeout(function(){autopagerUtils.currentBrowser().contentWindow.focus();}, 20);
        
    }
    ,onCtrlClick : function(event)
    {
        if (event.ctrlKey)
        {
            event.preventBubble();
            event.preventDefault();
            this.onClick(event.target);
        }
    }
}