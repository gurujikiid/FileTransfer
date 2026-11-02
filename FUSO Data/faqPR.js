if (typeof SiebelAppFacade.faqPR === "undefined") {
    SiebelJS.Namespace("SiebelAppFacade.faqPR");
    define("siebel/custom/faqPR", ["siebel/jqgridrenderer"], function () {
        SiebelAppFacade.faqPR = (function () {
            function faqPR(pm) {
                SiebelAppFacade.faqPR.superclass.constructor.apply(this, arguments);
            }
            SiebelJS.Extend(faqPR, SiebelAppFacade.JQGridRenderer);
            faqPR.prototype.Init = function () {
                SiebelAppFacade.faqPR.superclass.Init.apply(this, arguments);
            };
            faqPR.prototype.ShowUI = function () {
                SiebelAppFacade.faqPR.superclass.ShowUI.apply(this, arguments);
				var Appletid = this.GetPM().Get('GetFullId');
				var posType = SiebelApp.S_App.GetProfileAttr("MF Primary Position Type LIC");
				if(posType == "UOE-Customer"){
				    $('#'+Appletid).hide();
				}
                $('#'+Appletid).find('.siebui-applet-header').append('<button style="font-size: 20px;color:black!important;margin: 7px 20px;float:right" type="button" id="ForceFAQ" name="ForceFAQ" data-display="ForceFAQ"><span><img src="images/custom/forceportal.png">FORCE FAQ</span></button><button style="font-size: 20px;color:black!important;margin: 7px;float:right" type="button" id="forcechatbot" name="forcechatbot" data-display="Chatbot"><span><img src="images/custom/chatbot.png" height="32" width="32"></span></button>');
                $("#ForceFAQ").click(function() {
                    var win = window.open("https://force-portal-qa.azurewebsites.net/faq-1-2/");
                    if (win) {
                        win.focus()
                    }
                });
				
				$('#forcechatbot').bind("click", function() {
					var sAppletName = SiebelApp.S_App.GetActiveView().GetActiveApplet().GetName();
					var sURL = "http://sgscvaiw0551.inedc.corpintra.net/57531/index.html";
					/*var schatbotContent = '<div id="divIframeContent"><form id="chatbotForm" target="chatbotIframe" method="Get"><iframe name="chatbotIframe" id="chatbotIframe" scrolling="no"></iframe></div>';
					var sReplaceWithAppletId = SiebelApp.S_App.GetActiveView().GetApplet(sAppletName).GetFullId();
					$("#"+sReplaceWithAppletId).replaceWith(schatbotContent);
					$("#chatbotForm").attr("action",sURL);
					$("#chatbotForm").submit();*/
					//var popattr = "top=380,left=1500,toolbar=no,location=no,addressbar=no,width=350,height=600,menubar=no";
					/*if(window.navigator && window.navigator.msSaveOrOpenBlobr){
					/*if(window.navigator && window.navigator.msSaveOrOpenBlobr){
						var popattr = "top=380,left=1500,toolbar=no,location=no,addressbar=no,width=350,height=600,menubar=no";
					}
					else{
						var popattr = "toolbar=no,scrollbars=no,resizable=no,location=no,menubar=0,fullscreen=1,channelmode=1,top="+screen.height*2/5+",left="+screen.width*23/30+",width="+screen.width*6.8/30+",height="+screen.height*9/20;
					}*/
					var popattr = "toolbar=no,resizable=yes,location=no,menubar=0,top="+screen.height*2/5+",left="+screen.width*23/30+",width="+screen.width*6.8/30+",height="+screen.height*9/20;
					var win = window.open('', "null", popattr).location.href = "http://sgscvaiw0551.inedc.corpintra.net/57531/index.html";
					if (win) {
						win.focus();
					}
				});
            };
            faqPR.prototype.BindData = function (bRefresh) {
                SiebelAppFacade.faqPR.superclass.BindData.apply(this, arguments);
                $('.hm-col-2 td[id*="_Name"]').each(function (index) {
                    $(this).hide();
                });
                $('.hm-col-2 td[id*="_Created"]').each(function (index) {
                    $(this).remove();
                });
                $('.hm-col-2 td[id*="_LitFileExt"]').each(function (index) {
                    $(this).remove();
                });
                $(".hm-col-2 tr.ui-row-ltr").each(function (index) {
                    var tr = $(this);
                    var tds = tr.find("td");
                    $.each(tds, function () {
                        var x = $(this).attr("id");
                        if (x != undefined && x.indexOf("Description") > -1) {
                            var a = $(this).text();
                            if (a != "") {
                                $(this).css("width", "100%");
                                var b = fetchData(index);
								if(b != undefined){
									if (b[2] == "")
										var c =
											'<span style="float:left;font-weight:500;font-size:16px">' +
											b[1] +
											'</span><span style="float:right;padding-right:12px;"><span style="font-size:13px;font-style:italic;">' +
											b[3] +
											"</span></span><br><br><span>" +
											a +
											"<span>";
									else {
										var d = "$('#S_A1 tr[id=" + (index - -1 * 1) + "] a').trigger('click')";
										var c =
											'<span style="float:left;font-weight:500;font-size:16px">' +
											b[1] +
											'</span><span style="float:right;padding-right:12px;"><img src="./images/custom/att.png" height="25px" width="25px" onclick="' +
											d +
											'" style="cursor:pointer"><span style="padding-left:5px;padding-right:5px">|</span><span style="font-size:13px;font-style:italic;">' +
											b[3] +
											"</span></span><br><br><span>" +
											a +
											"<span>";
									}
								}
                                $(this).html(c);
                            }
                        }
                    });
                });
            };
            faqPR.prototype.BindEvents = function () {
                SiebelAppFacade.faqPR.superclass.BindEvents.apply(this, arguments);
            };
            faqPR.prototype.EndLife = function () {
                SiebelAppFacade.faqPR.superclass.EndLife.apply(this, arguments);
            };
            function fetchData(index) {
                var a = new Array();
                var b = SiebelApp.S_App.GetActiveView().GetAppletMap()["MF Sales Tool FAQ List Applet"].GetRecordSet()[index];
				if(b != undefined){
					var FAQName = b["Name"].split("|");
					a.push(b["Id"], FAQName[0], b["LitFileExt"], b["Created"]);
					return a;
				}
            }
            return faqPR;
        })();
        return "SiebelAppFacade.faqPR";
    });
}
