if (typeof(SiebelAppFacade.faPM) === "undefined") {

 SiebelJS.Namespace("SiebelAppFacade.faPM");
 define("siebel/custom/faPM", ["siebel/pmodel"],
  function () {
   SiebelAppFacade.faPM = (function () {

    function faPM(pm) {
     SiebelAppFacade.faPM.superclass.constructor.apply(this, arguments);
    }

    SiebelJS.Extend(faPM, SiebelAppFacade.PresentationModel);

    faPM.prototype.Init = function () {
		SiebelAppFacade.faPM.superclass.Init.apply(this, arguments);
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
	
    faPM.prototype.Setup = function (propSet) {
     SiebelAppFacade.faPM.superclass.Setup.apply(this, arguments);
    }

    return faPM;
   }()
  );
  return "SiebelAppFacade.faPM";
 })
}
