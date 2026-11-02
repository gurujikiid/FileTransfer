if (typeof(SiebelAppFacade.MFQuoteEntryAppletPR) === "undefined") {

	SiebelJS.Namespace("SiebelAppFacade.MFQuoteEntryAppletPR");
	define("siebel/custom/MFQuoteEntryAppletPR", ["siebel/phyrenderer"],	function ()
	{
	SiebelAppFacade.MFQuoteEntryAppletPR = (function ()
	{
		var a = SiebelApp.clientLocaleMessages;
		if (language == 'jpn') var b = 1;
		else var b = 0; 

		function MFQuoteEntryAppletPR(pm) {
			SiebelAppFacade.MFQuoteEntryAppletPR.superclass.constructor.apply(this, arguments);
		}

		SiebelJS.Extend(MFQuoteEntryAppletPR, SiebelAppFacade.PhysicalRenderer);

		MFQuoteEntryAppletPR.prototype.Init = function () {
			SiebelAppFacade.MFQuoteEntryAppletPR.superclass.Init.apply(this, arguments);
		}

		MFQuoteEntryAppletPR.prototype.ShowUI = function () {
			SiebelAppFacade.MFQuoteEntryAppletPR.superclass.ShowUI.apply(this, arguments);				
		}

		MFQuoteEntryAppletPR.prototype.BindData = function (bRefresh) {
			SiebelAppFacade.MFQuoteEntryAppletPR.superclass.BindData.apply(this, arguments);
		}

		MFQuoteEntryAppletPR.prototype.BindEvents = function () {
			SiebelAppFacade.MFQuoteEntryAppletPR.superclass.BindEvents.apply(this, arguments);
			var appletname = this.GetPM().GetObjName();
			try{
				$('.siebui-icon-ascentsearchquote').click(function() {
					$('#maskoverlay').show();$('#mask-img').show();
					var oWFBS = SiebelApp.S_App.GetService("Workflow Process Manager");
					if(oWFBS)
					{
						var sWFInputPS = SiebelApp.S_App.NewPropertySet();
						var sWFOutputPS = SiebelApp.S_App.NewPropertySet();
						sWFInputPS.SetProperty("ProcessName", "MF IFPT026 WF");
						sWFInputPS.SetProperty("Applet Name", appletname);
						var sRecordId = SiebelApp.S_App.GetActiveView().GetActiveApplet().GetBusComp().GetFieldValue("Id");
						var sParentCheck = SiebelApp.S_App.GetActiveView().GetActiveApplet().GetBusComp().GetParentBusComp();
						if (sParentCheck != '' && sParentCheck != null && sParentCheck != "undefined") {
							var sParentBC = SiebelApp.S_App.GetActiveView().GetActiveApplet().GetBusComp().GetParentBusComp().GetName();
							sRecordId = SiebelApp.S_App.GetActiveView().GetBusObj().GetBusCompByName(sParentBC).GetFieldValue('Id');
						}
                        sWFInputPS.SetProperty("Object Id", sRecordId);
						oWFBS.InvokeMethod("RunProcess", sWFInputPS, {
							async: true,
							scope: this,
							selfbusy: true,
							cb: function() {
								if (arguments[2]) {
									var sWFResultSet = arguments[2].GetChildByType("ResultSet");
									if(sWFResultSet)
									{
										var sErrorCode = sWFResultSet.GetProperty("Interface Status");
										var sErrorMessage = sWFResultSet.GetProperty("Interface Status Message");
										if(sErrorCode == "false"){
											SiebelApp.S_App.SetErrorMsg("Response from Ascent : " + sErrorMessage);
											SiebelApp.S_App.ProcessError();
										}
										else
										{
											var sURL = sWFResultSet.GetProperty("URL");
											if (sURL) window.open(sURL, "ASCENT");
											else{
												if(b){
													SiebelApp.S_App.SetErrorMsg("サーバーエラー。もう一度試してください。");
													SiebelApp.S_App.ProcessError();
												}
												else{
													SiebelApp.S_App.SetErrorMsg("Server Error. Please try again");
													SiebelApp.S_App.ProcessError();
												}
											}
										}
									}
								}
							}
						});
					}
				});
			}
			catch(e){
				throw (e);
			}
			finally{
				$('#maskoverlay').hide();$('#mask-img').hide();
			}
		}

		MFQuoteEntryAppletPR.prototype.EndLife = function () {
			SiebelAppFacade.MFQuoteEntryAppletPR.superclass.EndLife.apply(this, arguments);
		}
		return MFQuoteEntryAppletPR;
	}()
	);
	return "SiebelAppFacade.MFQuoteEntryAppletPR";
	})
}