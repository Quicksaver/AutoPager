/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */


const autopagerHightlight =
    {
    
    counts : [],
    HighlightNodes : function(doc,nodes,selected ,color,focus)
    {
        var first = true;
        if (nodes == null || nodes.length == 0)
            return;
        for(var i=0;i<nodes.length;i++)
        {
            var node = nodes[i];
            if (typeof node == "string") //text node
            {             
                node = this.createTextDiv(doc,"autopagerText" + i,node);
            }
            if (node.nodeType == 2)
                node = node.ownerElement;
            
            this.createRegionDivs(doc,node,i,color);
            if (selected == -1 || selected == i)
            {
                var left = this.getOffsetLeft(node);
                var top = this.getOffsetTop(node);
                if (first)
                {
                    first = false;
					if (doc.defaultView)
						doc.defaultView.scrollTo(left,top);
                    if (focus)
                        node.focus();
                }
    
            }
        }
        for(var i=nodes.length; i<this.counts[color];i++)
        {
            this.hiddenRegionDivs(doc,i,color);
        }
        this.counts[color] = nodes.length;

    },
	HideAll : function(doc)
	{
        var nodes =doc.evaluate("//div[@class='autoPagerS' and contains(@id,'autoPagerBorder')]", doc, null, 0, null);
		if (!nodes)
				return;
		var datas=[];
        for (var node = null; (node = nodes.iterateNext()); ) {
				datas.push(node);
        }
        for (var i = 0; i<datas.length;++i ) {
            this.hiddenDiv(datas[i],true);
            var text = doc.getElementById("autopagerText" + i);
            if (text)
                text.parentNode.removeChild(text);
        }
        this.count = 0;
    },
    createRegionDivs : function(doc,target,subfix,color) {       
        if (!target.parentNode)
        {
            return;
        }
        var margin = 2;
        var leftDiv = this.getSelectorDiv(doc,"autoPagerBorderLeft" + color + subfix,color);
        var rightDiv =this.getSelectorDiv(doc,"autoPagerBorderRight" +color + subfix,color);
        var topDiv =this.getSelectorDiv(doc,"autoPagerBorderTop" + color + subfix,color);
        var bottomDiv =this.getSelectorDiv(doc,"autoPagerBorderBottom" + color +subfix,color);
        var left = this.getOffsetLeft(target);
        var top = this.getOffsetTop(target);
    
        var height = target.offsetHeight;
        if (!height)
            height = target.parentNode.offsetHeight;
        var width = target.offsetWidth;
        if (!width)
            width = target.parentNode.offsetWidth;
    
        leftDiv.style.left = (left - margin) + "px";
        leftDiv.style.top = (top - margin) + "px";
        leftDiv.style.height = (height + margin) + "px";
    
        rightDiv.style.left = (left + width) + "px";
        rightDiv.style.top = (top - margin) + "px";
        rightDiv.style.height = (height + margin) + "px";
    
        topDiv.style.left = left + "px";
        topDiv.style.top = (top - margin) + "px";
        topDiv.style.width = width + "px";
    
        bottomDiv.style.left = left + "px";
        bottomDiv.style.top = (top + height) + "px";
        bottomDiv.style.width = width + "px";
    
        this.hiddenDiv(leftDiv,false);
        this.hiddenDiv(rightDiv,false);
        this.hiddenDiv(topDiv,false);
        this.hiddenDiv(bottomDiv,false);
    
    },
    createDiv : function(doc,id,style) {
        var div = doc.createElement("div");
        //div.innerHTML = divHtml;
        doc.body.appendChild(div);
        div.className="autoPagerS";
        if (id.length>0)
            div.id = id;
    
        if (style.length>0)
            div.style.cssText = style;
        return div;
    },
    createTextDiv : function (doc,divName,text)
    {
        var div = doc.getElementById(divName);
        if (div)
            div.parentNode.removeChild(div);
        div = this.createDiv(doc,divName,"");
        div.textContent = text
        return div;
    },
    getSelectorDiv :function (doc,divName,color) {
        var div = doc.getElementById(divName);
        var style ="border: 2px solid " + color + "; margin: 0px; padding: 0px; position: absolute; width: 0px; display: block; z-index: 65534; left: -100px; top: -100px; height: 0px;";
        if (!div) {
            div = this.createDiv(doc,divName,style);
        }else
		{
				//alert(div.style.cssText)
				div.style.cssText = style;
				//div.style.border = "2px solid " + color;
		}
        return div;
    },
    getSelectorDivReadonly :function (doc,divName) {
        var div = doc.getElementById(divName);
        return div;
    },
    hiddenRegionDivs : function (doc,subfix,color) {
        var leftDiv =this.getSelectorDivReadonly(doc,"autoPagerBorderLeft" + color + subfix);
        var rightDiv =this.getSelectorDivReadonly(doc,"autoPagerBorderRight" + color + subfix);
        var topDiv =this.getSelectorDivReadonly(doc,"autoPagerBorderTop" + color + subfix);
        var bottomDiv =this.getSelectorDivReadonly(doc,"autoPagerBorderBottom" + color + subfix);
        this.hiddenDiv(leftDiv,true);
        this.hiddenDiv(rightDiv,true);
        this.hiddenDiv(topDiv,true);
        this.hiddenDiv(bottomDiv,true);
    },
    hiddenDiv : function (div,hidden) {
        if (div)
        {
            if (hidden) {
                div.style.display = "none";
            }else {
                div.style.display = "block";
            }
        }
        //div.hidden = hidden;
    },
    getOffsetTop : function(target) {
        var node=target;
        var top=0;
        while(node&&node.tagName!="BODY") {
            top+=node.offsetTop;
            node=node.offsetParent;
        }
        return top;
    },

    getOffsetLeft : function(target) {
        var node=target;
        var left=0;
        while(node&&node.tagName!="BODY") {
            left+=node.offsetLeft;
            node=node.offsetParent;
        }
        return left;
    }
}