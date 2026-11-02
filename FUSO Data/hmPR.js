if (typeof SiebelAppFacade.hmPR === "undefined") {
    SiebelJS.Namespace("SiebelAppFacade.hmPR");
    define("siebel/custom/hmPR", ["siebel/viewpr"], function () {
        SiebelAppFacade.hmPR = (function () {
            if (language == "jpn") var lng = 1;
            else var lng = 0;
            function hmPR(pm) {
                SiebelAppFacade.hmPR.superclass.constructor.apply(this, arguments);
            }
            SiebelJS.Extend(hmPR, SiebelAppFacade.ViewPR);
            hmPR.prototype.Init = function () {
                SiebelAppFacade.hmPR.superclass.Init.apply(this, arguments);
            };
            hmPR.prototype.ShowUI = function () {
                SiebelAppFacade.hmPR.superclass.ShowUI.apply(this, arguments);
            };
            hmPR.prototype.BindData = function (bRefresh) {
                SiebelAppFacade.hmPR.superclass.BindData.apply(this, arguments);
            };
            hmPR.prototype.BindEvents = function () {
                SiebelAppFacade.hmPR.superclass.BindEvents.apply(this, arguments);
                var a = SiebelApp.S_App.GetService("MF Home Page Tiles Service");
                var b = SiebelApp.S_App.NewPropertySet();
                var c = a.InvokeMethod("GetTiles", b).GetChildByType("ResultSet").GetProperty("boxdetail").split(",");
                if (c.length > 0) {
                    for (i = 0; i < c.length; i++) {
                        if (c[i] != "") {
                            var e = c[i].split("|");
                            var f = "SiebelApp.S_App.GotoView('" + e[2] + "')";
                            if (lng) {
                                var d =
                                    '<div class="hm-card siebui-span-lg-3 siebui-span-md-3 siebui-span-sm-3"><div class="hm-card-r1"><div id="' +
                                    e[0] +
                                    '" class="hm-card-r1-inner"><img src="./images/custom/loader.gif" height="25px"></div></div><div class="hm-card-r2"><div class="hm-card-r2-inner">' +
                                    e[3] +
                                    '</div></div><div class="hm-card-r2-inner-col2"><img src="./images/custom/ar.png" onclick="' +
                                    f +
                                    '"></div></div>';
                            } else {
                                var d =
                                    '<div class="hm-card siebui-span-lg-3 siebui-span-md-3 siebui-span-sm-3"><div class="hm-card-r1"><div id="' +
                                    e[0] +
                                    '" class="hm-card-r1-inner"><img src="./images/custom/loader.gif" height="25px"></div></div><div class="hm-card-r2"><div class="hm-card-r2-inner">' +
                                    e[1] +
                                    '</div></div><div class="hm-card-r2-inner-col2"><img src="./images/custom/ar.png" onclick="' +
                                    f +
                                    '"></div></div>';
                            }
                            $(".hm-col-1").append(d);
                            var k = SiebelApp.S_App.GetService("MF Home Page Tiles Service");
                            var l = SiebelApp.S_App.NewPropertySet();
                            l.SetProperty("box", e[0]);
                            k.InvokeMethod("GetCount", l, {
                                async: true,
                                scope: this,
                                selfbusy: false,
                                cb: function () {
                                    if (arguments[2]) {
                                        var n = arguments[2].GetChildByType("ResultSet").GetProperty("count");
                                        var o = arguments[2].GetChildByType("ResultSet").GetProperty("box");
                                        $("#" + o)
                                            .find("img")
                                            .remove();
                                        $("#" + o).append("<span>" + n + "</span>");
                                    }
                                },
                            });
                        }
                    }
                }
            };
            hmPR.prototype.EndLife = function () {
                SiebelAppFacade.hmPR.superclass.EndLife.apply(this, arguments);
            };
            return hmPR;
        })();
        return "SiebelAppFacade.hmPR";
    });
}
