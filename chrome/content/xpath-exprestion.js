var xpath;
var description;
var doc;
var sourceBox;

function init()
{
    xpath = document.getElementById("xpath");
    description = document.getElementById("descriptionBox");
    xpath.value = window.arguments[0];
    doc = window.arguments[1]
    sourceBox = window.arguments[2]
}
function handleOkButton()
{
    if (sourceBox!=null)
    {
        sourceBox.value = xpath.value
//        var event = sourceBox.ownerDocument.createEvent("XULCommandEvent");
//        event.initCommandEvent("command", false, false, sourceBox.ownerDocument.defaultView,
//                1, false, false, false, false,  null);
        var event = sourceBox.ownerDocument.createEvent("KeyboardEvent");
        event.initKeyEvent("keypress", false, false, sourceBox.ownerDocument.defaultView,
        false, false, false, false, event.DOM_VK_RETURN, event.DOM_VK_RETURN);
        sourceBox.dispatchEvent(event)
        //sourceBox.doCommand();
    }
}
function reset()
{
    if (sourceBox!=null)
        xpath.value = sourceBox.value;
    else
        xpath.value = '';
}
function appendExpr(event)
{
    var treechildren = event.target;
    if (treechildren.parentNode.view.selection.currentIndex>=0)
    {
        var treeitem = treechildren.childNodes[treechildren.parentNode.view.selection.currentIndex]
        setSelection(xpath, getExpr(treeitem.childNodes[0].childNodes[0].getAttribute("label") ))
    }
}
function getExpr(s)
{
    return  s.substring(s.indexOf(' ')+1);
}
function setSelection(box,s)
{
    var start = box.selectionStart
    var end = box.selectionStart + s.length
    var str = box.value.substring(0,box.selectionStart) + s + box.value.substring(box.selectionEnd)
    box.value = str
    box.focus();
    box.setSelectionRange(start,end);
}
function displayDescription(event)
{
    var tree = event.target;
    if (tree.view.selection.currentIndex>=0)
    {
        var s = tree.view.getCellText(tree.view.selection.currentIndex,tree.columns.getNamedColumn("description"));
        description.textContent = s;
    }
}