if (typeof(SiebelAppFacade.laPM) === "undefined") {

 SiebelJS.Namespace("SiebelAppFacade.laPM");
 define("siebel/custom/laPM", ["siebel/listpmodel"],
  function () {
   SiebelAppFacade.laPM = (function () {

    function laPM(pm) {
     SiebelAppFacade.laPM.superclass.constructor.apply(this, arguments);
	 
    }

    SiebelJS.Extend(laPM, SiebelAppFacade.ListPresentationModel);

    laPM.prototype.Init = function () {
     SiebelAppFacade.laPM.superclass.Init.apply(this, arguments);
	 
	 this.AttachPostProxyExecuteBinding("NewRecord", HighlightBorder);
	this.AttachPostProxyExecuteBinding("NewQuery", ResetBorder);
	this.AttachPostProxyExecuteBinding("UndoQuery", ResetBorder);
	this.AttachPostProxyExecuteBinding("UndoRecord", ResetBorder);
    }
	
	function HighlightBorder(methodName, inputPS, outputPS)
	{
		$("input[aria-required='true']").each(function() {
			if ($(this).val() == null || $(this).val() == "") this.style.setProperty('border', '2px solid #d65353', 'important');
		});
		$("input[aria-label*='Required']").each(function() {
			if ($(this).val() == null || $(this).val() == "") this.style.setProperty('border', '2px solid #d65353', 'important');
		});
		return;
	}
	
	function ResetBorder(methodName, inputPS, outputPS)
	{
		$("input[aria-required='true']").each(function() {
			this.style.setProperty('border', 'inherit');
		});
		$("input[aria-label*='Required']").each(function() {
			this.style.setProperty('border', 'inherit');
		});
		return;
	}

    laPM.prototype.Setup = function (propSet) {
     SiebelAppFacade.laPM.superclass.Setup.apply(this, arguments);
    }

    return laPM;
   }()
  );
  return "SiebelAppFacade.laPM";
 })
}
