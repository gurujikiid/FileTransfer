if (typeof SiebelAppFacade.MFUVProfitPM === "undefined") {
    SiebelJS.Namespace("SiebelAppFacade.MFUVProfitPM");
    define("siebel/custom/MFUVProfitPM", ["siebel/pmodel"], function() {
        SiebelAppFacade.MFUVProfitPM = function() {
            function MFUVProfitPM(pm) {
                SiebelAppFacade.MFUVProfitPM.superclass.constructor.apply(this, arguments)
            }
            SiebelJS.Extend(MFUVProfitPM, SiebelAppFacade.PresentationModel);
            MFUVProfitPM.prototype.Init = function() {
                SiebelAppFacade.MFUVProfitPM.superclass.Init.apply(this, arguments);
                this.AddProperty("Changed", "N");
                this.AddMethod("ShowSelection", SelectionChange, {
                    sequence: false,
                    scope: this
                });
                this.AddMethod("InvokeMethod", PreInvokeMethod, {
                    sequence: true,
                    scope: this
                });
            };

            function SelectionChange() {
                var controls = this.Get("GetControls");
                var Profit = controls["MF Profit"];
                //var DirectSalesProfit = controls["MF Direct Sales Profit"];
                var DealerResalePrice = controls["MF Dealer Resale Price"];
                var DirectResalePrice = controls["MF Direct Resale Price"];
                var SalesPrice = controls["MF Total Selling Price"];
                var DRCalc = controls["MF DRPrice Calc"];
                var ProfitValue = this.ExecuteMethod("GetFieldValue", Profit);
                //var DirectSalesProfitValue = this.ExecuteMethod("GetFieldValue", DirectSalesProfit);
                var DealerPriceValue = this.ExecuteMethod("GetFieldValue", DealerResalePrice);
                var DirectPriceValue = this.ExecuteMethod("GetFieldValue", DirectResalePrice);
                var DRPriceValue = this.ExecuteMethod("GetFieldValue", DRCalc);
                var SalesPriceValue = this.ExecuteMethod("GetFieldValue", SalesPrice);
                var x = Number(ProfitValue);
                //var y = Number(DirectSalesProfitValue);
                var a = Number(DealerPriceValue);
                var b = Number(DirectPriceValue);
                var c = Number(DRPriceValue);
                var d = Number(SalesPriceValue);
                console.log(ProfitValue);
                //console.log(DirectSalesProfitValue);
                /*if (x < y) {
					$('[name="' + Profit.GetInputName() + '"]').css("color", "red");
                    //$('[aria-labelledby="MF_Profit_Label_1"]').css("color", "red");
                    console.log("red")
                } else {
					$('[name="' + Profit.GetInputName() + '"]').css("color", "#727780");
                    //$('[aria-labelledby="MF_Profit_Label_1"]').css("color", "#727780");
                    console.log("black")
                }*/
                if (d < c) {
					$('[name="' + SalesPrice.GetInputName() + '"]').css("color", "red");
                    //$('[aria-labelledby="MF_Total_Selling_Price_Label_1"]').css("color", "red");
                    console.log("red")
                } else {
					$('[name="' + SalesPrice.GetInputName() + '"]').css("color", "#29303f");
                    //$('[aria-labelledby="MF_Total_Selling_Price_Label_1"]').css("color", "#29303f");
                    console.log("black")
                }
            }

            function PreInvokeMethod(methodName, psInputArgs, ip, returnStructure) {
                if (methodName === "MFBIPPrintReport") {
                    var sWFBS = SiebelApp.S_App.GetService("Workflow Process Manager");
                    var sWFInputPS = SiebelApp.S_App.NewPropertySet();
                    var sWFOutputPS = SiebelApp.S_App.NewPropertySet();
                    if (sWFBS) {
                        var sAppletName = this.GetObjName();
                        var sReportName = "",
                            sIOName = "",
                            sRecordId = "",
                            sBookmark1 = "",
                            sBookmark2 = "",
                            sBookmark = "";
                        sRecordId = SiebelApp.S_App.GetBusObj().GetBusCompByName(SiebelApp.S_App.GetActiveView().GetApplet(sAppletName).GetBusComp().GetName()).GetFieldValue("Id");
                        if (sAppletName == "MF Sales Quote Form Applet") {
                            sReportName = "UV Sales Quotation";
                            sIOName = "BIP UV Quote";
                            sBookmark1 = "'Quote'.Search = ";
                            sBookmark2 = "([Id] = '" + sRecordId + "')";
                            sBookmark = sBookmark1 + '"' + sBookmark2 + '"'
                        }
                        sWFInputPS.SetProperty("ProcessName", "MF BIP Get Base64 Content Process");
                        sWFInputPS.SetProperty("ReportName", sReportName);
                        sWFInputPS.SetProperty("IntegrationObject", sIOName);
                        sWFInputPS.SetProperty("Bookmark", sBookmark);
                        sWFInputPS.SetProperty("ReportOutputLanguage", "JPN");
                        sWFInputPS.SetProperty("ReportOutputType", "PDF");
                        sWFInputPS.SetProperty("BIPUserId", "VIJAY");
                        sWFInputPS.SetProperty("BIPPassword", "VIJAY#1");
                        sWFInputPS.SetProperty("ViewMode", "Organization");
						oWFBS.InvokeMethod("RunProcess", sWFInputPS, {
							async: true,
							scope: this,
							selfbusy: true,
							cb: function() {
								if (arguments[2]) {
									var sWFResultSet = arguments[2].GetChildByType("ResultSet");
									var sBase64Content = SiebelApp.S_App.GetProfileAttr("Base64Content");
									if (sBase64Content.length != 0) {
										if (window.navigator && window.navigator.msSaveOrOpenBlob) {
											var sByteCharacters = atob(sBase64Content);
											var sByteNumbers = new Array(sByteCharacters.length);
											for (var i = 0; i < sByteCharacters.length; i++) {
												sByteNumbers[i] = sByteCharacters.charCodeAt(i)
											}
											var sByteArray = new Uint8Array(sByteNumbers);
											var blob = new Blob([sByteArray], {
												type: "application/pdf"
											});
											window.navigator.msSaveOrOpenBlob(blob, "Report.pdf")
										} else {
											var sWindowParameters = "dependent=yes,locationbar=no,scrollbars=yes,menubar=yes,resizable,screenX=50,screenY=50,width=850,height=1050";
											var sHTMLContent = '<embed width=100% height=100% type="application/pdf" src="data:application/pdf;base64,' + escape(sBase64Content) + '"></embed>';
											var printWindow = window.open("", "PDF", sWindowParameters);
											printWindow.document.write(sHTMLContent);
											setTimeout(function() {
												printWindow.print()
											}, 5e3)
										}
									} else {
										SiebelApp.S_App.SetErrorMsg("An error has occurred. Please try again")
										SiebelApp.S_App.ProcessError();
									}
									returnStructure["CancelOperation"] = true;
									returnStructure["ReturnValue"] = "";
									SiebelApp.S_App.uiStatus.Free();
								}
							}
						});
                    }
					/*
                    if (sBase64Content.length != 0) {
                        if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                            var sByteCharacters = atob(sBase64Content);
                            var sByteNumbers = new Array(sByteCharacters.length);
                            for (var i = 0; i < sByteCharacters.length; i++) {
                                sByteNumbers[i] = sByteCharacters.charCodeAt(i)
                            }
                            var sByteArray = new Uint8Array(sByteNumbers);
                            var blob = new Blob([sByteArray], {
                                type: "application/pdf"
                            });
                            window.navigator.msSaveOrOpenBlob(blob, "Report.pdf")
                        } else {
                            var sWindowParameters = "dependent=yes,locationbar=no,scrollbars=yes,menubar=yes,resizable,screenX=50,screenY=50,width=850,height=1050";
                            var sHTMLContent = '<embed width=100% height=100% type="application/pdf" src="data:application/pdf;base64,' + escape(sBase64Content) + '"></embed>';
                            var printWindow = window.open("", "PDF", sWindowParameters);
                            printWindow.document.write(sHTMLContent);
                            setTimeout(function() {
                                printWindow.print()
                            }, 5e3)
                        }
                    } else {
                        alert("An error has occurred. Please try again")
                    }
                    returnStructure["CancelOperation"] = true;
                    returnStructure["ReturnValue"] = "";
                    SiebelApp.S_App.uiStatus.Free();
					*/
                }
            }
            MFUVProfitPM.prototype.Setup = function(propSet) {
                SiebelAppFacade.MFUVProfitPM.superclass.Setup.apply(this, arguments)
            };
            return MFUVProfitPM
        }();
        return "SiebelAppFacade.MFUVProfitPM"
    })
}