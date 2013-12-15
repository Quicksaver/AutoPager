/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Aardvark Firefox extension.
 *
 * The Initial Developer of the Original Code is
 * Rob Brown.
 * Portions created by the Initial Developer are Copyright (C) 2006-2007
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 * Wladimir Palant
 * Wind Li
 *
 * ***** END LICENSE BLOCK ***** */

/**********************************
 * General element selection code *
 **********************************/

var autopagerSelector = {
	browser: null,
	paused: false,
	selectedElem: null,
	commentElem : null,
	mouseX: -1,
	mouseY: -1,
	commandLabelTimeout: 0,
	borderElems: null,
	labelElem: null,
        onStartFunctions: [],
        onSelectFunctions: [],
        onQuitFunctions:[]
};

autopagerSelector.registorStartFunction = function (func)
{
    this.onStartFunctions.push(func);
}
autopagerSelector.registorSelectFunction = function (func)
{
    this.onSelectFunctions.push(func);
}
autopagerSelector.registorQuitFunction = function (func)
{
    this.onQuitFunctions.push(func);
}
autopagerSelector.clearFunctions = function ()
{
    this.onStartFunctions = [];
    this.onSelectFunctions = [];
    this.onQuitFunctions = [];
}

autopagerSelector.CanSelect = function (browser) {
	if (!browser || !browser.contentWindow || 
			//!(browser.contentDocument instanceof HTMLDocument) ||
			!browser.contentDocument.body)
		return false;

	var location = browser.contentWindow.location;
	if (location.href == "about:blank")
		return false;

	if (location.hostname == "" &&
			location.protocol != "mailbox:" &&
			location.protocol != "imap:" &&
			location.protocol != "news:" &&
			location.protocol != "snews:")
		return false;

	return true;
}

autopagerSelector.addEventListener = function(browser,name,func,user)
{
	browser.contentWindow.addEventListener(name, func, user);
    
        if (browser.contentWindow.frames != null) {
            //alert(doc.defaultView.frames.length);
            for(var i=0;i<browser.contentWindow.frames.length;++i) {
                try{
                  browser.contentWindow.frames[i].addEventListener(name, func, user);
                }catch(e)
                {
                }
            }
        }
    
}
autopagerSelector.removeEventListener = function(browser,name,func,user)
{
	browser.contentWindow.removeEventListener(name, func, user);
    
        if (browser.contentWindow.frames != null) {
            //alert(doc.defaultView.frames.length);
            for(var i=0;i<browser.contentWindow.frames.length;++i) {
                try{
                    browser.contentWindow.frames[i].removeEventListener(name, func, user);
                }catch(e){
                }
            }
        }
    
}
autopagerSelector.start = function(browser) {
	if (!this.CanSelect(browser))
		return;
	this.paused = false;
	if (!("viewSourceURL" in this)) {
		// Firefox/Thunderbird and SeaMonkey have different viewPartialSource URLs
		var urls = [
			"chrome://global/content/viewPartialSource.xul",
			"chrome://navigator/content/viewPartialSource.xul"
		];
		this.viewSourceURL = null;
		for (var i = 0; i < urls.length && !this.viewSourceURL; i++) {
			var request = new XMLHttpRequest();
			request.open("GET", urls[i], urls[i].indexOf("chrome")==0);//local synchronous request
			try {
				request.send(null);
				this.viewSourceURL = urls[i];
			} catch (e) {}
		}

		if (!this.viewSourceURL) {
			for (i = 0; i < this.commands.length; i++)
				if (this.commands[i] == "viewSourceWindow")
					this.commands.splice(i--, 1);
		}
	}

	this.addEventListener(browser,"click", this.mouseClick, true);
	this.addEventListener(browser,"mouseover", this.mouseOver, true);
	this.addEventListener(browser,"keypress", this.keyPress, true);
	this.addEventListener(browser,"mousemove", this.mouseMove, true);
	this.addEventListener(browser,"pagehide", this.pageHide, true);
	this.addEventListener(browser,"resize", this.resize, true);

	browser.contentWindow.focus();

	this.browser = browser;

	if (!this.labelElem)
		this.makeElems(browser.contentDocument);

	this.initHelpBox();

        var notshowMenu = autopagerPref.loadBoolPref("selector.notshowhelp");
	if (notshowMenu)
		this.showMenu();
}

autopagerSelector.doCommand = function(command, event) {
	if (this[command](this.selectedElem)) {
		if (event)
			event.stopPropagation();
	}
	if (event)
		event.preventDefault();
}

autopagerSelector.initHelpBox = function() {
        for (var i = 0; i < this.onStartFunctions.length; i++)
        {
            this.onStartFunctions[i]();
        }
	var added = false;
    var helpBoxRows = document.getElementById("autopager-helpbox-rows");
	if (helpBoxRows!=null && helpBoxRows.firstChild)
		added = true;;

        var strings = AutoPagerNS.strings;

	for (var i = 0; i < this.commands.length; i++) {
		var command = this.commands[i];
		var key = strings.getString("command." + command + ".key");
		var label = strings.getString("command." + command + ".label");
		this.commands[command + "_key"] = key.toLowerCase();
		this.commands[command + "_label"] = label;

        if (!added && helpBoxRows)
        {
            var row = document.createElement("row");
            helpBoxRows.appendChild(row);

            var element = document.createElement("description");
            element.setAttribute("value", key);
            element.className = "key";
            row.appendChild(element);

            element = document.createElement("description");
            element.setAttribute("value", label);
            element.className = "label";
            row.appendChild(element);
        }
	}
}

autopagerSelector.onMouseClick = function(event) {
	if (this.paused)
			return;
	if (event.button != 0 || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey)
		return;

	this.doCommand("select", event);
}

autopagerSelector.onMouseOver = function(event) {
	if (this.paused)
			return;
	var elem = event.originalTarget;
        if (elem==null)
            elem = event.target;
	var aardvarkLabel = elem;
	while (aardvarkLabel && !("autopagerSelectorLabel" in aardvarkLabel))
		aardvarkLabel = aardvarkLabel.parentNode;

	if (elem == null || aardvarkLabel)
	{
		this.clearBox ();
		return;
	}

	if (elem == this.selectedElem)
		return;

        this.showBoxAndLabel (elem, this.makeElementLabelString (elem));
}

autopagerSelector.onKeyPress = function(event) {
	if (event.altKey || event.ctrlKey || event.metaKey)
		return;

	var command = null;
	if (event.keyCode == event.DOM_VK_ESCAPE)
		command = "quit";
	else if (event.keyCode == event.DOM_VK_RETURN)
		command = "select";
	else if (event.charCode) {
		var key = String.fromCharCode(event.charCode).toLowerCase();
		var commands = this.commands;
		for (var i = 0; i < commands.length; i++)
			if (commands[commands[i] + "_key"] == key)
				command = commands[i];
	}

	if (command)
		this.doCommand(command, event);
}

autopagerSelector.onPageHide = function(event) {
	this.doCommand("quit", null);
}

autopagerSelector.onResize = function(event) {
	if (this.selectedElem == null)
		return;

	this.showBoxAndLabel (this.selectedElem, this.makeElementLabelString (this.selectedElem));
}

autopagerSelector.onMouseMove = function(event) {
	this.mouseX = event.screenX;
	this.mouseY = event.screenY;
}

// Makes sure event handlers like autopagerSelector.keyPress redirect
// to the real handlers (autopagerSelector.onKeyPress in this case) with
// correct this pointer.
autopagerSelector.generateEventHandlers = function(handlers) {
	var generator = function(handler) {
		return function(event) {autopagerSelector[handler](event)};
	};

	for (var i = 0; i < handlers.length; i++) {
		var handler = "on" + handlers[i][0].toUpperCase() + handlers[i].substr(1);
		this[handlers[i]] = generator(handler);
	}
}
autopagerSelector.generateEventHandlers(["mouseClick", "mouseOver", "keyPress", "pageHide","resize", "mouseMove"]);

autopagerSelector.appendDescription = function(node, value, className) {
	var descr = document.createElement("description");
	descr.setAttribute("value", value);
	if (className)
		descr.setAttribute("class", className);
	node.appendChild(descr);
}

/***************************
 * Highlight frame display *
 ***************************/

//-------------------------------------------------
// create the box and tag etc (done once and saved)
autopagerSelector.makeElems = function (doc)
{
	this.borderElems = [];
	var d, i;

	for (i=0; i<4; i++)
	{
		d = doc.createElementNS("http://www.w3.org/1999/xhtml", "div");
		d.style.display = "none";
		d.style.position = "absolute";
		d.style.height = "0px";
		d.style.width = "0px";
		d.style.zIndex = "65534";
		if (i < 2)
			d.style.borderTop = "2px solid #f00";
		else
			d.style.borderLeft = "2px solid #f00";
		d.autopagerSelectorLabel = true; // mark as ours
		this.borderElems[i] = d;
	}

	d = doc.createElementNS("http://www.w3.org/1999/xhtml", "div");
	this.setElementStyleDefault (d, "#fff0cc");
	d.style.borderTopWidth = "0";
	d.style.MozBorderRadiusBottomleft = "6px";
	d.style.MozBorderRadiusBottomright = "6px";
	d.style.zIndex = "65535";
	d.autopagerSelectorLabel = true; // mark as ours
	this.labelElem = d;
}

autopagerSelector.makeElementLabelString = function(elem) {
	var s = "<b style='color:#000'>" + elem.tagName.toLowerCase() + "</b>";
	if (elem.id != '')
		s += ", id: " + elem.id;
	if (elem.className != '')
		s += ", class: " + elem.className;
	/*for (var i in elem.style)
		if (elem.style[i] != '')
			s += "<br> " + i + ": " + elem.style[i]; */
	if (elem.style.cssText != '')
		s += ", style: " + elem.style.cssText;
		
	return s;
}

autopagerSelector.showBoxAndLabel = function(elem, string) {
	var doc = elem.ownerDocument;
	if (!doc || !doc.body)
		return;

	this.selectedElem = elem;

	for (var i = 0; i < 4; i++) {
                var n = this.borderElems[i]
		try {
			n = doc.adoptNode(this.borderElems[i]);
                    }
		catch (e) {
			// Gecko 1.8 doesn't implement adoptNode, ignore
                        autopagerBwUtil.consoleError(e)
		}
                try {
			doc.documentElement.appendChild(n);
                    }
		catch (e) {
                    //may already belong to this doc
                    autopagerBwUtil.consoleError(e)
		}
		
	}

	var pos = this.getPos(elem)
	var dims = this.getWindowDimensions (doc);

	this.borderElems[0].style.left
		= this.borderElems[1].style.left
		= this.borderElems[2].style.left
		= (pos.x - 1) + "px";
	this.borderElems[3].style.left = (pos.x + elem.offsetWidth - 1) + "px";

	this.borderElems[0].style.width
		= this.borderElems[1].style.width
		= (elem.offsetWidth + 2) + "px";

	this.borderElems[2].style.height
		= this.borderElems[3].style.height
		= (elem.offsetHeight + 2) + "px";

	this.borderElems[0].style.top
		= this.borderElems[2].style.top
		= this.borderElems[3].style.top
		= (pos.y - 1) + "px";
	this.borderElems[1].style.top = (pos.y + elem.offsetHeight - 1) + "px";
	
	this.borderElems[0].style.display
		= this.borderElems[1].style.display
		= this.borderElems[2].style.display
		= this.borderElems[3].style.display
		= "";
	
	var y = pos.y + elem.offsetHeight + 1;
	
	try {
		doc.adoptNode(this.labelElem);
	}
	catch(e) {
		// Gecko 1.8 doesn't implement adoptNode, ignore
                autopagerBwUtil.consoleError(e)
	}
	doc.body.appendChild(this.labelElem);

	this.labelElem.innerHTML = string;
	this.labelElem.style.display = "";

	// adjust the label as necessary to make sure it is within screen and
	// the border is pretty
	if ((y + this.labelElem.offsetHeight) >= dims.scrollY + dims.height)
	{
		this.labelElem.style.borderTopWidth = "1px";
		this.labelElem.style.MozBorderRadiusTopleft = "6px";
		this.labelElem.style.MozBorderRadiusTopright = "6px";
		this.labelDrawnHigh = true;
		y = (dims.scrollY + dims.height) - this.labelElem.offsetHeight;
	}
	else if (this.labelElem.offsetWidth > elem.offsetWidth)
	{
		this.labelElem.style.borderTopWidth = "1px";
		this.labelElem.style.MozBorderRadiusTopright = "6px";
		this.labelDrawnHigh = true;
	}
	else if (this.labelDrawnHigh)
	{
		this.labelElem.style.borderTopWidth = "0";
		this.labelElem.style.MozBorderRadiusTopleft = "";
		this.labelElem.style.MozBorderRadiusTopright = "";
		delete (this.labelDrawnHigh); 
	}
	this.labelElem.style.left = (pos.x + 2) + "px";
	this.labelElem.style.top = y + "px";
}

autopagerSelector.clearBox = function() {
	this.selectedElem = null;

	for (var i = 0; i < this.borderElems.length; i++)
		if (this.borderElems[i].parentNode)
			this.borderElems[i].parentNode.removeChild(this.borderElems[i]);

	if (this.labelElem.parentNode)
		this.labelElem.parentNode.removeChild(this.labelElem);
}

autopagerSelector.getPos = function (elem)
{
	var pos = {x: 0, y: 0};

	while (elem)
	{
		pos.x += elem.offsetLeft;
		pos.y += elem.offsetTop;
		elem = elem.offsetParent;
	}
	return pos;
}

autopagerSelector.getWindowDimensions = function (doc)
{
	var out = {};

	out.scrollX = doc.body.scrollLeft + doc.documentElement.scrollLeft; 
	out.scrollY = doc.body.scrollTop + doc.documentElement.scrollTop;

	if (doc.compatMode == "BackCompat")
	{
		out.width = doc.body.clientWidth;
		out.height = doc.body.clientHeight;
	}
	else
	{
		out.width = doc.documentElement.clientWidth;
		out.height = doc.documentElement.clientHeight;
	}
	return out;
}

autopagerSelector.setElementStyleDefault = function (elem, bgColor)
{
	var s = elem.style;
	s.display = "none";
	s.backgroundColor = bgColor;
	s.borderColor = "black";
	s.borderWidth = "1px 2px 2px 1px";
	s.borderStyle = "solid";
	s.fontFamily = "arial";
	s.textAlign = "left";
	s.color = "#000";
	s.fontSize = "12px";
	s.position = "absolute";
	s.paddingTop = "2px";
	s.paddingBottom = "2px";
	s.paddingLeft = "5px";
	s.paddingRight = "5px";
}

/*********************************
 * Code from aardvarkCommands.js *
 *********************************/

//------------------------------------------------------------
// 0: name, 1: needs element
autopagerSelector.commands = [
	"select",
	"pause",
	"wider",
	"narrower",
	"quit",
	"blinkElement",
	"viewSource",
	"viewSourceWindow"
        //,"showMenu"
];

//------------------------------------------------------------
autopagerSelector.wider = function (elem)
{
	if (elem)
	{
		var newElem = elem.parentNode;
		if (newElem && newElem.nodeType == newElem.DOCUMENT_NODE && newElem.defaultView && !(newElem.defaultView.frameElement instanceof HTMLFrameElement))
			newElem = newElem.defaultView.frameElement;

		if (!newElem || newElem.nodeType != newElem.ELEMENT_NODE)
			return false;
		
		if (this.widerStack && this.widerStack.length>0 && 
			this.widerStack[this.widerStack.length-1] == elem)
		{
			this.widerStack.push (newElem);
		}
		else
		{
			this.widerStack = [elem, newElem];
		}
		this.showBoxAndLabel (newElem, 
				this.makeElementLabelString (newElem));
		return true;
	}
	return false;
} 

//------------------------------------------------------------
autopagerSelector.narrower = function (elem)
{
	if (elem)
	{
		if (this.widerStack && this.widerStack.length>1 && 
			this.widerStack[this.widerStack.length-1] == elem)
		{
			this.widerStack.pop();
			var newElem = this.widerStack[this.widerStack.length-1];
			this.showBoxAndLabel (newElem, 
					this.makeElementLabelString (newElem));
			return true;
		}
	}
	return false;
}
	
//------------------------------------------------------------
autopagerSelector.quit = function ()
{
	if (!this.browser)
		return false;

        for (var i = 0; i < this.onQuitFunctions.length; i++)
        {
            this.onQuitFunctions[i]();
        }
	this.clearBox();
	//ehhHideTooltips();
	
	this.removeEventListener(this.browser,"click", this.mouseClick, true);
	this.removeEventListener(this.browser,"mouseover", this.mouseOver, true);
	this.removeEventListener(this.browser,"keypress", this.keyPress, true);
	this.removeEventListener(this.browser,"mousemove", this.mouseMove, true);
	this.removeEventListener(this.browser,"pagehide", this.pageHide, true);
	this.removeEventListener(this.browser,"resize", this.resize, true);

	this.selectedElem = null;
	this.browser = null;
	this.commentElem = null;
	delete this.widerStack;
	return true;
}

//------------------------------------------------------------
autopagerSelector.select = function (elem)
{
	if (!elem || !this.quit())
		return false;

        for (var i = 0; i < this.onSelectFunctions.length; i++)
        {
            this.onSelectFunctions[i](elem);
        }
//	window.openDialog("chrome://autopager/content/composer.xul", "_blank",
//										"chrome,centerscreen,resizable,dialog=no", elem);
	return true;
}

//------------------------------------------------------------
autopagerSelector.blinkElement = function (elem)
{
	if (!elem)
		return false;

	if ("blinkInterval" in this)
		this.stopBlinking();

	var counter = 0;
	this.blinkElem = elem;
	this.blinkOrigValue = elem.style.visibility;
	this.blinkInterval = setInterval(function() {
		counter++;
		elem.style.visibility = (counter % 2 == 0 ? "visible" : "hidden");
		if (counter == 6)
			autopagerSelector.stopBlinking();
	}, 250);

	return true;
}
//------------------------------------------------------------
autopagerSelector.pause = function (elem)
{
	this.paused = !this.paused;
	return true;
}
autopagerSelector.stopBlinking = function() {
	clearInterval(this.blinkInterval);
	this.blinkElem.style.visibility = this.blinkOrigValue;

	delete this.blinkElem;
	delete this.blinkOrigValue;
	delete this.blinkInterval;
}

//------------------------------------------------------------
autopagerSelector.viewSource = function (elem)
{
	if (!elem)
		return false;

	var sourceBox = document.getElementById("autopager-viewsource");
	if (sourceBox.getAttribute("_moz-menuactive") == "true" && this.commentElem == elem) {
		sourceBox.hidePopup();
		return true;
	}
	sourceBox.hidePopup();

	while (sourceBox.firstChild)
		sourceBox.removeChild(sourceBox.firstChild);
	this.getOuterHtmlFormatted(elem, sourceBox);
	this.commentElem = elem;

	var x = this.mouseX;
	var y = this.mouseY;
	setTimeout(function() {
		sourceBox.showPopup(document.documentElement, x, y, "tooltip", "topleft", "topleft");
	}, 500);
	return true;
}

//--------------------------------------------------------
autopagerSelector.viewSourceWindow = function(elem) {
	if (!elem || !this.viewSourceURL)
		return false;

	var range = elem.ownerDocument.createRange();
	range.selectNodeContents(elem);
	var selection = {rangeCount: 1, getRangeAt: function() {return range}};

	// SeaMonkey uses a different 
	window.openDialog(this.viewSourceURL, "_blank", "scrollbars,resizable,chrome,dialog=no",
										null, null, selection, "selection");
	return true;
}

//--------------------------------------------------------
autopagerSelector.getOuterHtmlFormatted = function (node, container)
{
	var type = null;
	switch (node.nodeType) {
		case node.ELEMENT_NODE:
			var box = document.createElement("vbox");
			box.className = "elementBox";

			var startTag = document.createElement("hbox");
			startTag.className = "elementStartTag";
			if (!node.firstChild)
				startTag.className += "elementEndTag";

			this.appendDescription(startTag, "<", null);
			this.appendDescription(startTag, node.tagName, "tagName");

			for (var i = 0; i < node.attributes.length; i++) {
				var attr = node.attributes[i];
				this.appendDescription(startTag, attr.name, "attrName");
				if (attr.value != "") {
					this.appendDescription(startTag, "=", null);
					this.appendDescription(startTag, '"' + attr.value.replace(/"/, "&quot;") + '"', "attrValue");
				}
			}

			this.appendDescription(startTag, node.firstChild ? ">" : " />", null);
			box.appendChild(startTag);

			if (node.firstChild) {
				for (var child = node.firstChild; child; child = child.nextSibling)
					this.getOuterHtmlFormatted(child, box);

				var endTag = document.createElement("hbox");
				endTag.className = "elementEndTag";
				this.appendDescription(endTag, "<", null);
				this.appendDescription(endTag, "/" + node.tagName, "tagName");
				this.appendDescription(endTag, ">", null);
				box.appendChild(endTag);
			}
			container.appendChild(box);
			return;

		case node.TEXT_NODE:
			type = "text";
			break;
		case node.CDATA_SECTION_NODE:
			type = "cdata";
			break;
		case node.COMMENT_NODE:
			type = "comment";
			break;
		default:
			return;
	}

	var text = node.nodeValue.replace(/\r/g, '').replace(/^\s+/, '').replace(/\s+$/, '');
	if (text == "")
		return;

	if (type != "cdata") {
		text = text.replace(/&/g, "&amp;")
							 .replace(/</g, "&lt;")
							 .replace(/>/g, "&gt;");
	}
	text = text.replace(/\t/g, "  ");
	if (type == "cdata")
		text = "<![CDATA[" + text + "]]>";
	else if (type == "comment")
		text = "<!--" + text + "-->";

	var lines = text.split("\n");
	for (var i = 0; i < lines.length; i++)
		this.appendDescription(container, lines[i].replace(/^\s+/, '').replace(/\s+$/, ''), type);
}

//-------------------------------------------------
autopagerSelector.showMenu = function ()
{
	var helpBox = document.getElementById("ehh-helpbox");
	if (helpBox.getAttribute("_moz-menuactive") == "true") {
		helpBox.hidePopup();
		return true;
	}

	// Show help box
	helpBox.showPopup(this.browser, -1, -1, "tooltip", "topleft", "topleft");
	return true;
}