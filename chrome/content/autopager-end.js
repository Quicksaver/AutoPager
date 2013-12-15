try{
    if (typeof AutoPagerNS["post_init"] == "function")
    {
        AutoPagerNS["post_init"]();
    }
    for(var k in AutoPagerNS)
    {
        var obj = AutoPagerNS[k];
        if (typeof obj == "object")
        {
            if (typeof obj["post_init"] == "function")
            {
//                autopagerBwUtil.consoleLog("Performing post_init for " + k);
                obj["post_init"]();
//                autopagerBwUtil.consoleLog("Complete post_init for " + k);
            }            
        }
    }
}catch(e)
{
    autopagerBwUtil.consoleError(e);
}