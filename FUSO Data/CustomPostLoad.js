if (typeof(SiebelAppFacade.CustomPostLoad) === "undefined") {

    Namespace('SiebelAppFacade.CustomPostLoad');
    define("siebel/custom/CustomPostLoad", [],

        function () {
        SiebelApp.EventManager.addListner("postload", modifyUI, this);
        var a = SiebelApp.clientLocaleMessages;
        if (language == "jpn")
            var b = 1;
        else
            var b = 0;

        function modifyUI() {
            //$('[title]').removeAttr('title');
            if (SiebelApp.S_App.GetActiveView().GetName() != "User Profile Default View") {
                CallAlertMsg();
                CustomReport();
                var postnType = SiebelApp.S_App.GetProfileAttr("MF Primary Position Type LIC");
                if (postnType != "UOE-Customer") {
                    CustomChatbot();
                }
                //OverrideDialogBox();

                if ($('#logoff').length == 0) {
                    $('#_swecontent').after('<img id="back-top" src="images/custom/ScrolltoTop.png">');
                    $('#back-top').hide();
                    $('[title="Taxes and Expenses Form Applet"]').find('.siebui-icon-map').replaceWith('REGISTRATION');
                    $('#siebui-toolbar-settings').before('<div id="logoff" data-cmd="#58" role="button" title="Log Off" name="Log Off" tabindex="-1"><img src="images/custom/Icon-Logoff.png" class="ToolbarButtonOn"></div>');
                    $('div#logoff').css("float", "right");
                    $('div#logoff').css("cursor", "pointer");
                    var position = theApplication().GetProfileAttr('Position');
                    var fn = theApplication().GetProfileAttr('First Name');
                    var ln = theApplication().GetProfileAttr('Last Name');
                    $('#siebui-toolbar-toggle-communication-panel').hide();
                }

                var viewTitle = $('.siebui-logo').parent().find('.siebui-hb-header');
                viewTitle.css("color", "white");
                viewTitle.css("font-size", "18px");
                viewTitle.css("position", "absolute");
                viewTitle.css("top", "40px");
                viewTitle.css("text-align", "center");
                viewTitle.css("overflow", "initial");
                viewTitle.css("left", "40%");
                if ($('#_swecontent').before($('#_swethreadbar'))) {
                    $('#_swecontent').before($('#_swethreadbar'));
                    $('#_swethreadbar').css('position', 'relative');
                    $('#_swethreadbar').css('top', '1px');
                }

                if ($('div[title="Second Level View Bar"]>ul').length < 1)
                    $('div[title="Second Level View Bar"]').css('visibility', 'hidden');
                else
                    $('div[title="Second Level View Bar"]').css('visibility', 'visible');

                $('.sitemapSection.sitemapIndexSection').remove();
                $('.sitemapFilter').append("<div id='sitemapFilterLabel'>Administrator</div>");
                $('#filterReset').remove();
                $('#logoff').click(function () {
                    SiebelApp.S_App.InvokeMethod("Logoff");
                });

                $("input[aria-required='true']").focusin(function () {
                    this.style.setProperty('border', 'inherit');
                });
                $("input[aria-label*='Required']").focusin(function () {
                    this.style.setProperty('border', 'inherit');
                });

                $("input[aria-required='true']").focusout(function () {
                    var x = false;
                    if (($('.siebui-applet-msg').hasClass('siebui-no-display') || $('.siebui-applet-msg').hasClass('siebui-invisible-el')) && ($('.siebui-applet-msg span[id="1_msg"]').text() == 'Enter Query.' || $('.siebui-applet-msg span[id="1_msg"]').text() == ""))
                        x = true;
                    var xx = SiebelApp.S_App.GetActiveView().GetActiveApplet().GetBusComp().GetIdValue();
                    console.log('x = ', x);
                    console.log('xx = ', xx);
                    if ($(this).val() == "" && x && xx != "")
                        this.style.setProperty('border', '2px solid #d65353', 'important');
                    else if ($(this).val() != "") {
                        this.style.setProperty('border', 'inherit');
                        $(this).css({
                            "backgroundColor": "white"
                        });
                    }
                });
                $("input[aria-label*='Required']").focusout(function () {
                    var x = false;
                    if (($('.siebui-applet-msg').hasClass('siebui-no-display') || $('.siebui-applet-msg').hasClass('siebui-invisible-el')) && ($('.siebui-applet-msg span[id="1_msg"]').text() == 'Enter Query.' || $('.siebui-applet-msg span[id="1_msg"]').text() == ""))
                        x = true;
                    var xx = SiebelApp.S_App.GetActiveView().GetActiveApplet().GetBusComp().GetIdValue();
                    console.log('x = ', x);
                    console.log('xx = ', xx);
                    if ($(this).val() == "" && x && xx != "")
                        this.style.setProperty('border', '2px solid #d65353', 'important');
                    else if ($(this).val() != "") {
                        this.style.setProperty('border', 'inherit');
                        $(this).css({
                            "backgroundColor": "white"
                        });
                    }
                });

                $('#back-top').click(function () {
                    $('#_sweview').scrollTop(0);
                });

                $("#_sweview").scroll(function () {
                    if ($(this).scrollTop() > 100)
                        $('#back-top').fadeIn();
                    else
                        $('#back-top').fadeOut();
                });

                var activeview = SiebelApp.S_App.GetActiveView();

                if (activeview != null) {
                    var viewName = activeview.GetName(); //get the active view name
                    if (viewName == "Auto Home Page View (SDW)") {

                        $('#_swethreadbar').css({
                            "display": "none"
                        });
                        $('#s_sctrl_tabView').css({
                            'display': 'none'
                        });
                        $('#_swecontent').css({
                            'height': 'calc(100% - 97px)'
                        });
                    }

                    if (viewName != "Auto Home Page View (SDW)") {

                        $('#_swethreadbar').css({
                            "display": "inline-block"
                        });
                        $('#s_sctrl_tabView').css({
                            'display': 'inline-block'
                        });
                        $('#_swecontent').css({
                            'height': 'calc(100% - 157px)'
                        });
                    }
                }

                $(".B1").click(function () {
                    SiebelApp.S_App.GotoView("Quote List View");
                    SiebelApp.S_App.SetProfileAttr("Newrecord", "Y");
                });

                $(".B2").click(function () {
                    SiebelApp.S_App.GotoView("MF PA Order Entry - All Orders View (PO)");
                    SiebelApp.S_App.SetProfileAttr("Newrecord", "Y");
                });

                $(".B3").click(function () {
                    SiebelApp.S_App.GotoView("MF PA Order Entry - All Orders View (Expense)");
                    SiebelApp.S_App.SetProfileAttr("Newrecord", "Y");
                });

                $(".B4").click(function () {
                    SiebelApp.S_App.GotoView("MF Landscape Search View");
                    SiebelApp.S_App.SetProfileAttr("Newrecord", "Y");
                });

                $(".B5").click(function () {
                    SiebelApp.S_App.GotoView("MF My Org Vehicle View");
                    SiebelApp.S_App.SetProfileAttr("Newrecord", "Y");
                });

                $(".B6").click(function () {
                    SiebelApp.S_App.GotoView("Order Entry - My Orders View (Sales)");
                    SiebelApp.S_App.SetProfileAttr("Newrecord", "Y");
                });

                if (viewName == "Auto Home Page View (SDW)") {
                    var sposition = SiebelApp.S_App.GetProfileAttr("Position");

                    var Uoechk = sposition.indexOf("UOE");

                    if (Uoechk == '0') {
                        $('[title="My Pending Chassis Orders List Applet"]').hide();
                        $('[title="未処理シャシオーダー（個人） リストアプレット"]').hide();
                    }
                }
                if (viewName != "User Profile Default View") {
                    if (SiebelApp.S_App.GetProfileAttr("posData") == "") {
                        $('.PositionNameDisplay').remove();
                        FetchUserPosition();
                    } else {
                        $('.PositionNameDisplay').remove();
                        $('#s_toolbar').find('ul.siebui-toolbar').append(SiebelApp.S_App.GetProfileAttr("posMsg"));
                    }
                }

                $(".PosId").change(function () {
                    var BS = SiebelApp.S_App.GetService("MF Fetch User Position BS");
                    var spsIN = SiebelApp.S_App.NewPropertySet();
                    spsIN.SetProperty("posName", $(".PosId").val().split(": ")[1]);
                    BS.InvokeMethod("ChangePosition", spsIN);
                    SiebelApp.S_App.GotoView("Auto Home Page View (SDW)");
                });
            }
        }
    });
}

function FetchUserPosition() {
    $('.PositionNameDisplay').remove();
    var sBS = SiebelApp.S_App.GetService("MF Fetch User Position BS");
    var psIN = SiebelApp.S_App.NewPropertySet();
    var z = sBS.InvokeMethod("FetchPosition", psIN).GetChildByType("ResultSet").GetProperty("posName").split(",");
    if (z.length > 0) {
        if (language == "jpn") {
            var msg1 = '<li1 id="tb_12_user_postn" class="PositionNameDisplay" data-cmd="#58" style="font-size: 15px;position: absolute;right: 0px;color: #fff;margin-right: 15px;">' + SiebelApp.S_App.GetProfileAttr("Login Name") + ' さん、 ' + SiebelApp.S_App.GetProfileAttr("MF Position Org Code") + ' : <span="font-size: 13px;"><select class = "PosId" id = "PosId" style="height: 24px; width:auto; color:#000000"><option>' + SiebelApp.S_App.GetProfileAttr("Position") + '</option>';
        } else {
            var msg1 = '<li1 id="tb_12_user_postn" class="PositionNameDisplay" data-cmd="#58" style="font-size: 15px;position: absolute;right: 0px;color: #fff;margin-right: 15px;">Hello ' + SiebelApp.S_App.GetProfileAttr("Login Name") + ' at ' + SiebelApp.S_App.GetProfileAttr("MF Position Org Code") + ' as <span="font-size: 13px;"><select class = "PosId" id = "PosId" style="height: 24px; width:auto; color:#000000"><option>' + SiebelApp.S_App.GetProfileAttr("Position") + '</option>';
        }
        var msg2 = '';
        for (var i = 0; i < z.length; i++) {
            if (z[i] != "") {
                msg2 = msg2 + "<option id = op" + i + 1 + "value=" + z[i] + ">" + z[i] + "</option>"
            }
        }
        if (language == "jpn") {
            var msg3 = '</select> で使用中です</span></li1>';
            var msg = msg1 + msg2 + msg3;
        } else {
            var msg3 = '</select></span></li1>';
            var msg = msg1 + msg2 + msg3;
        }
        $('#s_toolbar').find('ul.siebui-toolbar').append(msg);
        SiebelApp.S_App.SetProfileAttr("posMsg", msg);
    }
}

function CallAlertMsg() {
    $MsgbarUrgent = $("#HTMLMessageBar a#MsgBar.siebui-msgbar-bkgrnd-msg-urgent");
    if ($MsgbarUrgent.length > 0) {
        $("#MsgBar").click();
        var $MsgBar = $('div.ui-dialog.ui-widget.ui-widget-content.ui-corner-all.ui-front.siebui-msgbar-popup');
        var unreadMsg = $MsgBar.find(".siebui-unreadmessage");
        if (unreadMsg.length > 0) {
            var msgHeader = unreadMsg[0].getElementsByClassName("ui-accordion-content");
            var Msg_content = msgHeader.item(0).textContent;
            alert(Msg_content);
            $('.siebui-msgbar-summary').click();
            $('.ui-widget-overlay.ui-front').click();
        }
    }
    setTimeout(CallAlertMsg, 1);
}

/*function OverrideDialogBox() {
$.widget( "ui.dialog", $.ui.dialog, {
open: function() {
if(this.uiDialog.length > 0 && (this.uiDialog[0].outerText.includes("SBL-UIJ-53077") ||
this.uiDialog[0].outerText.includes("Desktop Integration Siebel Agent"))){
$("#downloadButton").trigger("click");

return;
}
return this._super();
}
});
}*/
function CustomChatbot() {
    if ($('.siebui-toolbar').find('#chatbot').length == 0) {
        $('[name="CUSTOMICON"]').after('<li id="chatbot" title="chatbot" name="chatbot"><span class="siebui-icon-tb-Customreports ToolbarButtonOn"><img src="images/custom/chatbot.png" height="16" width="16"></span></li>');
        $('#chatbot').bind("click", function () {
            var sAppletName = SiebelApp.S_App.GetActiveView().GetActiveApplet().GetName();
            var sURL = "http://sgscvaiw0551.inedc.corpintra.net/57531/index.html";
            /*var schatbotContent = '<div id="divIframeContent"><form id="chatbotForm" target="chatbotIframe" method="Get"><iframe name="chatbotIframe" id="chatbotIframe" scrolling="no"></iframe></div>';
            var sReplaceWithAppletId = SiebelApp.S_App.GetActiveView().GetApplet(sAppletName).GetFullId();
            $("#"+sReplaceWithAppletId).replaceWith(schatbotContent);
            $("#chatbotForm").attr("action",sURL);
            $("#chatbotForm").submit();*/
            //var popattr = "top=380,left=1500,toolbar=no,location=no,addressbar=no,width=350,height=600,menubar=no";
            var popattr = "toolbar=no,resizable=yes,location=no,menubar=0,top=" + screen.height * 2 / 5 + ",left=" + screen.width * 23 / 30 + ",width=" + screen.width * 6.8 / 30 + ",height=" + screen.height * 9 / 20;
            var win = window.open('', "null", popattr).location.href = "http://sgscvaiw0551.inedc.corpintra.net/57531/index.html";
            if (win) {
                win.focus();
            }
        });
    }
}

function CustomReport() {
    if ($('.siebui-toolbar').find('#CUSTOMICON').length == 0) {
        $('[name="Reports"]').after('<li id="CUSTOMICON" title="CustomReport" name="CUSTOMICON"><span class="siebui-icon-tb-Customreports ToolbarButtonOn"><img src="images/icon_report.gif" height="16" width="16"></span></li>');

        $('#CUSTOMICON').bind("click", function () {
            if ($('.reportPane').length == 1) {
                $('#s_reportclose').click();
                setTimeout(function () {
                    CustomReportPane();
                }, 1000);
            } else if ($('.MFCustomreportPane').length == 0)
                CustomReportPane();
            else {
                $('.MFCustomreportPane').remove();
                $(".AppletHIListBorder").children().children().css({
                    "width": "100%"
                });
                $(".ui-jqgrid-view").css({
                    "width": "100%"
                });
                $(".ui-jqgrid-view").children().css({
                    "width": "100%"
                });
                $(".ui-jqgrid-htable").css({
                    "width": "100%"
                });
                $(".ui-jqgrid-btable").css({
                    "width": "100%"
                });
                $(".siebui-applet-footer").css({
                    "width": "100%"
                });
            }
        });
    }

    if ($('.MFCustomreportPane').length != 0) {
        var ReportNameList = [];
        var ReportOutputTypeList = [];
        var ReportTranslationList = [];
        var sResultSet = "";
        var oBS = SiebelApp.S_App.GetService("Workflow Process Manager");
        var sInputPS = SiebelApp.S_App.NewPropertySet();
        var sOutputPS = SiebelApp.S_App.NewPropertySet();
        var sViewName = SiebelApp.S_App.GetActiveView().GetName();
        sInputPS.SetProperty("ProcessName", "MF Generate BIP Report Custom Process");
        sInputPS.SetProperty("ViewName", sViewName);
        sInputPS.SetProperty("GetReportList", "Y");
        oBS.InvokeMethod("RunProcess", sInputPS, {
            async: true,
            scope: this,
            selfbusy: true,
            cb: function () {
                $('#maskoverlay').remove();
                SiebelApp.S_App.uiStatus.Free();
                if (arguments[2]) {
                    var sResultSet = arguments[2].GetChildByType("ResultSet");
                    var ListOfReportList = sResultSet.GetChildByType("ReportDetails").GetChildByType("ListOfReport List");
                    var ReportListCount = ListOfReportList.GetChildCount();
                    for (var i = 0; i < ReportListCount; i++) {
                        ReportNameList.push(ListOfReportList.GetChild(i).GetProperty("Report Name"));
                        ReportOutputTypeList.push(ListOfReportList.GetChild(i).GetProperty("Report Output Type"));
                        ReportTranslationList.push(ListOfReportList.GetChild(i).GetProperty("Report Translate Name"));
                    }
                    SortDropdown(ReportNameList, ReportOutputTypeList, ReportTranslationList);
                    $('#MF_Custom_Output_Type').empty();
                    $('#MF_Custom_Report_Name').empty();
                    if (ReportOutputTypeList[0] != "All" && ReportOutputTypeList[0] != "すべて" && ReportOutputTypeList[0] != undefined)
                        $('#MF_Custom_Output_Type').append('<option value="' + ReportOutputTypeList[0] + '">' + ReportOutputTypeList[0] + '</option>');
                    else
                        $('#MF_Custom_Output_Type').append('<option value="PDF">PDF</option><option value="HTML">HTML</option><option value="RTF">RTF</option><option value="XLS">XLS</option><option value="PPT">PPT</option><option value="MHTML">MHTML</option>');
                    for (var i = 0; i < ReportNameList.length; i++) {
                        if (ReportTranslationList[i] == '')
                            $('#MF_Custom_Report_Name').append('<option value="' + ReportNameList[i] + '">' + ReportNameList[i] + '</option>');
                        else
                            $('#MF_Custom_Report_Name').append('<option value="' + ReportNameList[i] + '">' + ReportTranslationList[i] + '</option>');
                    }

                    $('#MF_Custom_Report_Name').unbind("change");
                    $('#MF_Custom_Report_Name').bind("change", function () {
                        $('#MF_Custom_Output_Type').empty();
                        var sNewReportName = $('#MF_Custom_Report_Name').val();
                        var sIndex = ReportNameList.indexOf(sNewReportName);
                        if (ReportOutputTypeList[sIndex] != "All" && ReportOutputTypeList[sIndex] != "すべて")
                            $('#MF_Custom_Output_Type').append('<option value="' + ReportOutputTypeList[sIndex] + '">' + ReportOutputTypeList[sIndex] + '</option>');
                        else
                            $('#MF_Custom_Output_Type').append('<option value="PDF">PDF</option><option value="HTML">HTML</option><option value="RTF">RTF</option><option value="XLS">XLS</option><option value="PPT">PPT</option><option value="MHTML">MHTML</option>');
                    });

                    $(".AppletHIListBorder").children().children().css({
                        "width": "100%"
                    });
                    $(".ui-jqgrid-view").css({
                        "width": "100%"
                    });
                    $(".ui-jqgrid-view").children().css({
                        "width": "100%"
                    });
                    $(".ui-jqgrid-htable").css({
                        "width": "100%"
                    });
                    $(".ui-jqgrid-btable").css({
                        "width": "100%"
                    });
                    $(".siebui-applet-footer").css({
                        "width": "100%"
                    });
                }
            }
        });
    }
}

function CustomReportPane() {
    var oBS = SiebelApp.S_App.GetService("Workflow Process Manager");
    var sInputPS = SiebelApp.S_App.NewPropertySet();
    var sOutputPS = SiebelApp.S_App.NewPropertySet();
    var sViewName = SiebelApp.S_App.GetActiveView().GetName();
    var ReportNameList = [];
    var ReportOutputTypeList = [];
    var ReportTranslationList = [];
    sInputPS.SetProperty("ProcessName", "MF Generate BIP Report Custom Process");
    sInputPS.SetProperty("ViewName", sViewName);
    sInputPS.SetProperty("GetReportList", "Y");
    SiebelApp.S_App.uiStatus.ShowOnLoadIndicator();
    oBS.InvokeMethod("RunProcess", sInputPS, {
        async: true,
        scope: this,
        selfbusy: true,
        cb: function () {
            $('#maskoverlay').remove();
            SiebelApp.S_App.uiStatus.Free();
            if (arguments[2]) {
                var sResultSet = arguments[2].GetChildByType("ResultSet");
                var ListOfReportList = sResultSet.GetChildByType("ReportDetails").GetChildByType("ListOfReport List");
                var ReportListCount = ListOfReportList.GetChildCount();
                for (var i = 0; i < ReportListCount; i++) {
                    //if (ListOfReportList.GetChild(i).GetProperty("Report Name") != 'Maintenance Work Request Form Job Card' && ListOfReportList.GetChild(i).GetProperty("Report Translate Name") != 'Maintenance Work Request Form') {
					//if (ListOfReportList.GetChild(i).GetProperty("Report Name") != 'Maintenance Work Request Form' ) {
					  if (ListOfReportList.GetChild(i).GetProperty("Report Name") != 'Maintenance Work Request Form Job Card' ) {
                        ReportNameList.push(ListOfReportList.GetChild(i).GetProperty("Report Name"));
                        ReportOutputTypeList.push(ListOfReportList.GetChild(i).GetProperty("Report Output Type"));
                        ReportTranslationList.push(ListOfReportList.GetChild(i).GetProperty("Report Translate Name"));
                    }
                }
                SortDropdown(ReportNameList, ReportOutputTypeList, ReportTranslationList)
                var sHTML1,
                sHTML2,
                sHTML3,
                sHTML4,
                sHTML5 = "";
                var sRunReportLabel,
                sReportNameLabel,
                sOutputTypeLabel,
                sLanguageLabel,
                sGenerateLabel = "";

                if (language == 'enu') {
                    sRunReportLabel = "Run Report";
                    sReportNameLabel = "Report Name";
                    sOutputTypeLabel = "Output Type";
                    sLanguageLabel = "Report Locale";
                    sGenerateLabel = "Generate";
                } else {
                    sRunReportLabel = "実行レポート";
                    sReportNameLabel = "レポート名";
                    sOutputTypeLabel = "出力タイプ";
                    sLanguageLabel = "レポートのロケール";
                    sGenerateLabel = "生成する";
                }

                sHTML1 = '<div class="siebui-report-pane MFCustomreportPane"><div id="s_ReportPane" role="navigation" title="Run Report Applet" style="box-shadow: 0 2px 8px #727780"><div id="reportpaneHeader" class="siebui-report-header siebui-table-row"><span id="reportRUNNOW" class="siebui-report-caption siebui-ecfg-div-table-col siebui-report-caption-width"><span id="Report_Title_Label">' + sRunReportLabel + '</span></span><a id="s_reportclose" class="siebui-report-pane-close-icon siebui-ecfg-div-table-col" tabindex="0" role="button" title="Run Report:close"></a></div><div id="reportList" class="reportlist1 siebui-report-list"><div id="reportNames" class="siebui-report-row"><div class="mceGridLabel" align="Right"><span id="Report_Name_Label"  style="color:rgb(114,119,128);font-size:12px">' + sReportNameLabel + '</span></div><div id="reportnamesCombo" class="mceGridField" align="Right"><select id="MF_Custom_Report_Name" name="s_reportNameField" aria-labelledby="Report_Name_Label" class="siebui-ctrl-input">';
                for (var i = 0; i < ReportNameList.length; i++) {
                    if (ReportTranslationList[i] == '')
                        sHTML2 = sHTML2 + "<option value='" + ReportNameList[i] + "'>" + ReportNameList[i] + "</option>";
                    else
                        sHTML2 = sHTML2 + "<option value='" + ReportNameList[i] + "'>" + ReportTranslationList[i].replace(/"/g, '') + "</option>";
                }
                sHTML3 = '</select></div></div><div id="OutputType" class="siebui-report-row"><div class="mceGridLabel" align="Right"><span id="Report_Output_Type_Label" style="color:rgb(114,119,128);font-size:12px">' + sOutputTypeLabel + '</span></div><div class="mceGridField" align="Right"><select id="MF_Custom_Output_Type" name="s_reportOptTypeField" aria-labelledby="Report_Output_Type_Label" class="siebui-ctrl-input">';
                if (ReportOutputTypeList[0] != "All" && ReportOutputTypeList[0] != "すべて" && ReportOutputTypeList[0] != undefined)
                    sHTML4 = "<option value='" + ReportOutputTypeList[0] + "'>" + ReportOutputTypeList[0] + "</option>";
                else
                    sHTML4 = '<option value="PDF">PDF</option><option value="HTML">HTML</option><option value="RTF">RTF</option><option value="XLS">XLS</option><option value="PPT">PPT</option><option value="MHTML">MHTML</option>';

                sHTML5 = '</select></div></div><div id="LocaleName" class="siebui-report-row"><div class="mceGridLabel" align="Right"><span id="Report_Locale_Label" style="color:rgb(114,119,128);font-size:12px">' + sLanguageLabel + '</span></div><div id="reportLocaleCustomNames" class="mceGridField" align="Right"><select id="MF_Custom_Report_Locale" name="s_reportLocaleCustomField" aria-labelledby="Report_Locale_CustomLabel" class="siebui-ctrl-input"><option value="Japanese - Japan" selected="selected">Japanese - Japan</option><option value="English - United States">English - United States</option></select></div></div></div><div id="reportParameter" class="siebui-report-parameter siebui-report-margin siebui-report-header " style="display: none;"></div><div id="reportFooter" class="siebui-report-footer"><button id="GenerateBIPReport" class="appletButton" type="button">' + sGenerateLabel + '</button></div></div></div>';

                $('#SS_OpenUIReportPane').append(sHTML1 + sHTML2 + sHTML3 + sHTML4 + sHTML5);

                $("#GenerateBIPReport").bind("click", function () {
                    var sBIPReportName = $('#MF_Custom_Report_Name').val();
                    var sReportLocale = $('#MF_Custom_Report_Locale').val();
                    var sOutputType = $('#MF_Custom_Output_Type').val();
                    var sDownloadReportName = $('#MF_Custom_Report_Name option[value="' + sBIPReportName + '"]').text();
                    if (sBIPReportName != "undefined" && sBIPReportName != "" && sBIPReportName != null) {
                        if (sReportLocale == "Japanese - Japan")
                            sReportLocale = "JPN";
                        else
                            sReportLocale = "ENU";
                        var sRecordId = SiebelApp.S_App.GetActiveView().GetActiveApplet().GetBusComp().GetFieldValue("Id");
                        var ReportBCName = SiebelApp.S_App.GetActiveView().GetActiveApplet().GetBusComp().GetName();
                        var sParentCheck = SiebelApp.S_App.GetActiveView().GetActiveApplet().GetBusComp().GetParentBusComp();
                        var sGroupNum = "0";
						var sStatus="";
						var Oldest = "";
						var InvoiceReport = "";
                        if (sParentCheck != '' && sParentCheck != null && sParentCheck != "undefined") {
                            if (SiebelApp.S_App.GetActiveView().GetActiveApplet().GetName() == "MF Service Invoice Line Item Detail List Applet") {
                                ReportBCName = "FS Invoice"
                                    sRecordId = SiebelApp.S_App.GetActiveView().GetBusObj().GetBusCompByName("FS Invoice").GetFieldValue('Id');
                            } else {
                                var sParentBC = SiebelApp.S_App.GetActiveView().GetActiveApplet().GetBusComp().GetParentBusComp().GetName();
                                sRecordId = SiebelApp.S_App.GetActiveView().GetBusObj().GetBusCompByName(sParentBC).GetFieldValue('Id');
                                ReportBCName = sParentBC;
                            }
                        }
                        var sView = SiebelApp.S_App.GetActiveView().GetName();
                        if (sView == "MF Service Line Item Details View") {
                            sRecordId = SiebelApp.S_App.GetActiveView().GetBusObj().GetBusCompByName("FS Invoice").GetFieldValue('Id');
							sStatus = SiebelApp.S_App.GetActiveView().GetBusObj().GetBusCompByName("FS Invoice").GetFieldValue('Status');
							InvoiceReport = SiebelApp.S_App.GetActiveView().GetBusObj().GetBusCompByName("FS Invoice").GetFieldValue('MF Report Name');
							var invoicedate = SiebelApp.S_App.GetActiveView().GetBusObj().GetBusCompByName("FS Invoice").GetFieldValue('Invoice Date');
                            var oBIPBS = SiebelApp.S_App.GetService("MF BIP Validation BS");
                            var sINPS = SiebelApp.S_App.NewPropertySet();
                            var sOPS = SiebelApp.S_App.NewPropertySet();
                            sINPS.SetProperty("InvoiceId", sRecordId);
                            sOPS = oBIPBS.InvokeMethod("BIPValidation", sINPS);
                            var ResultSet = SiebelApp.S_App.NewPropertySet();
                            var ResultSet = sOPS.GetChildByType("ResultSet");
                            sLiabilityAmount = ResultSet.GetProperty("Amount")
                            sGroupNum = ResultSet.GetProperty("GroupNum")
							var sINPS1 = SiebelApp.S_App.NewPropertySet();
							var sOPS1 = SiebelApp.S_App.NewPropertySet();
							sINPS1.SetProperty("invoicedate",invoicedate);
							sINPS1.SetProperty("Defaultdate","06/23/2021 00:00:00");
							Oldest = oBIPBS.InvokeMethod("RecordCheck", sINPS1).GetChildByType("ResultSet").GetProperty("OldestRecord");
                        }
						
						if((sStatus=="Cancelled" || sStatus=="キャンセル" || sStatus=="Rejected" || sStatus=="却下") && sView == "MF Service Line Item Details View")
						{
							if(language == "jpn"){
							SiebelApp.S_App.SetErrorMsg("この諸費用はキャンセル/却下の為、作成できません。");
							SiebelApp.S_App.ProcessError();
							}
							else{
							SiebelApp.S_App.SetErrorMsg("Planned Expeses are Cancelled or Rejected");
							SiebelApp.S_App.ProcessError();
							}
						}
						
                        else if (((sGroupNum == '' || sGroupNum == null) && Oldest == "N" && sView == "MF Service Line Item Details View") || ((sGroupNum == '' || sGroupNum == null) && Oldest == "Y" && sView == "MF Service Line Item Details View" && (sStatus == "Open" || sStatus == "作成中"))) {
                            if (language == "jpn") {
                                SiebelApp.S_App.SetErrorMsg("”請求振分”ボタンをクリックし、請求番号を取得して下さい");
                                SiebelApp.S_App.ProcessError();
                            } 
							else {
                                SiebelApp.S_App.SetErrorMsg("Please click the Group button");
                                SiebelApp.S_App.ProcessError();
                            }
                        } 
						else{
                            var sViewName = SiebelApp.S_App.GetActiveView().GetName();
                            var sWFBS = SiebelApp.S_App.GetService("Workflow Process Manager");
                            var sWFInputPS = SiebelApp.S_App.NewPropertySet();
                            var sWFOutputPS = SiebelApp.S_App.NewPropertySet();
                            sWFInputPS.SetProperty("ProcessName", "MF Generate BIP Report Custom Process");
                            sWFInputPS.SetProperty("ReportTranslation", sBIPReportName);
                            sWFInputPS.SetProperty("EntityId", sRecordId);
                            sWFInputPS.SetProperty("ReportBCName", ReportBCName);
                            sWFInputPS.SetProperty("ReportOutputType", sOutputType);
                            sWFInputPS.SetProperty("ReportOutputLanguage", sReportLocale);
                            sWFInputPS.SetProperty("ViewName", sViewName);
                            SiebelApp.S_App.uiStatus.ShowOnLoadIndicator();
                            sWFBS.InvokeMethod("RunProcess", sWFInputPS, {
                                async: true,
                                scope: this,
                                selfbusy: true,
                                cb: function () {
                                    $('#maskoverlay').remove();
                                    SiebelApp.S_App.uiStatus.Free();
                                    if (arguments[2]) {
                                        var sWFResultSet = arguments[2].GetChildByType("ResultSet");
                                        var sVanillaReportFlag = sWFResultSet.GetProperty("VanillaReportFlag");
                                        var sBase64Content = sWFResultSet.GetProperty("Base64Content");
                                        if (sVanillaReportFlag == "N") {
                                            if (sBase64Content.length != 0) {
                                                if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                                                    var sByteCharacters = atob(sBase64Content);
                                                    var sByteNumbers = new Array(sByteCharacters.length);
                                                    for (var i = 0; i < sByteCharacters.length; i++) {
                                                        sByteNumbers[i] = sByteCharacters.charCodeAt(i);
                                                    }
                                                    var sByteArray = new Uint8Array(sByteNumbers);
                                                    var blob = new Blob([sByteArray], {
                                                        type: 'application/' + sOutputType
                                                    });
                                                    window.navigator.msSaveOrOpenBlob(blob, sDownloadReportName + "." + sOutputType);
                                                } else {
                                                    const linkSource = 'data:application/' + sOutputType + ';base64,' + sBase64Content;
                                                    const downloadLink = document.createElement("a");
                                                    const fileName = sDownloadReportName + "." + sOutputType;
                                                    downloadLink.href = linkSource;
                                                    downloadLink.download = fileName;
                                                    downloadLink.click();
													
													if(sView == "MF Service Line Item Details View" && (sDownloadReportName == "Expense Calculation Sheet" || sDownloadReportName == "諸費用計算書") && (InvoiceReport == "Invoice"  || InvoiceReport == "請求書") && sStatus != "Completed" && sStatus != "完了"){
														if (language == "jpn") {
															SiebelApp.S_App.SetErrorMsg("印刷後は上長に金額と内容の確認をお願いします。");
															SiebelApp.S_App.ProcessError();
														} else {
															SiebelApp.S_App.SetErrorMsg("After printing, please check the amount and contents with your supervisor.");
															SiebelApp.S_App.ProcessError();
														}														
													}								
                                                }
                                            } else {
                                                if (language == "jpn") {
                                                    SiebelApp.S_App.SetErrorMsg("エラーが起こりました。もう一度試してください。");
                                                    SiebelApp.S_App.ProcessError();
                                                } else {
                                                    SiebelApp.S_App.SetErrorMsg("An error occurred. Please try again");
                                                    SiebelApp.S_App.ProcessError();
                                                }
                                            }
                                        } else {
                                            if (language == "jpn") {
                                                SiebelApp.S_App.SetErrorMsg("選択したレポートには責任がありません。管理者におたずねください");
                                                SiebelApp.S_App.ProcessError();
                                            } else {
                                                SiebelApp.S_App.SetErrorMsg("The selected report does not have responsibility. Please ask administrator");
                                                SiebelApp.S_App.ProcessError();
                                            }
                                        }
                                    }
                                }
                            });
                        }
                    } else {
                        if (language == "jpn") {
                            SiebelApp.S_App.SetErrorMsg("レポートを選択してください");
                            SiebelApp.S_App.ProcessError();
                        } else {
                            SiebelApp.S_App.SetErrorMsg("Please select a Report");
                            SiebelApp.S_App.ProcessError();
                        }
                    }
                });
                $('[title="Run Report:close"]').bind("click", function () {
                    $('.MFCustomreportPane').remove();
                    $(".AppletHIListBorder").children().children().css({
                        "width": "100%"
                    });
                    $(".ui-jqgrid-view").css({
                        "width": "100%"
                    });
                    $(".ui-jqgrid-view").children().css({
                        "width": "100%"
                    });
                    $(".ui-jqgrid-htable").css({
                        "width": "100%"
                    });
                    $(".ui-jqgrid-btable").css({
                        "width": "100%"
                    });
                    $(".siebui-applet-footer").css({
                        "width": "100%"
                    });
                });
                $('#MF_Custom_Report_Name').bind("change", function () {
                    $('#MF_Custom_Output_Type').empty();
                    var sNewReportName = $('#MF_Custom_Report_Name').val();
                    var sIndex = ReportNameList.indexOf(sNewReportName);
                    if (ReportOutputTypeList[sIndex] != "All" && ReportOutputTypeList[sIndex] != "すべて")
                        $('#MF_Custom_Output_Type').append('<option value="' + ReportOutputTypeList[sIndex] + '">' + ReportOutputTypeList[sIndex] + '</option>');
                    else
                        $('#MF_Custom_Output_Type').append('<option value="PDF">PDF</option><option value="HTML">HTML</option><option value="RTF">RTF</option><option value="XLS">XLS</option><option value="PPT">PPT</option><option value="MHTML">MHTML</option>');
                });
                $(".AppletHIListBorder").children().children().css({
                    "width": "100%"
                });
                $(".ui-jqgrid-view").css({
                    "width": "100%"
                });
                $(".ui-jqgrid-view").children().css({
                    "width": "100%"
                });
                $(".ui-jqgrid-htable").css({
                    "width": "100%"
                });
                $(".ui-jqgrid-btable").css({
                    "width": "100%"
                });
                $(".siebui-applet-footer").css({
                    "width": "100%"
                });
            }
        }
    });
}

function SortDropdown(ReportNameList, ReportOutputTypeList, ReportTranslationList) {
    for (var i = 0; i < ReportNameList.length - 1; i++) {
        for (var j = i + 1; j < ReportNameList.length; j++) {
            if (ReportNameList[i] > ReportNameList[j]) {
                var temp = ReportNameList[i];
                ReportNameList[i] = ReportNameList[j];
                ReportNameList[j] = temp;
                temp = ReportOutputTypeList[i];
                ReportOutputTypeList[i] = ReportOutputTypeList[j];
                ReportOutputTypeList[j] = temp;
                temp = ReportTranslationList[i];
                ReportTranslationList[i] = ReportTranslationList[j];
                ReportTranslationList[j] = temp;
            }
        }
    }
}