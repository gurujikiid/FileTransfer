//Regenerate using:https://duncanford.github.io/prpm-code-generator/?prpm=PR&object=DesktopForm&name=HMCLDocumentUploadLink&userprops=&comments=Yes&logging=No
if (typeof(SiebelAppFacade.FormAppletTestPR) === "undefined") {

    SiebelJS.Namespace("SiebelAppFacade.FormAppletTestPR");
    define("siebel/custom/FormAppletTestPR", ["siebel/phyrenderer"],
        function () {
        SiebelAppFacade.FormAppletTestPR = (function () {

            function FormAppletTestPR(pm) {
                SiebelAppFacade.FormAppletTestPR.superclass.constructor.apply(this, arguments);
            }

            SiebelJS.Extend(FormAppletTestPR, SiebelAppFacade.PhysicalRenderer);

            FormAppletTestPR.prototype.Init = function () {
                // Init is called each time the object is initialised.
                // Add code here that should happen before default processing
                SiebelAppFacade.FormAppletTestPR.superclass.Init.apply(this, arguments);
                // Add code here that should happen after default processing
            }

            FormAppletTestPR.prototype.ShowUI = function () {
                // ShowUI is called when the object is initially laid out.
                // Add code here that should happen before default processing
                SiebelAppFacade.FormAppletTestPR.superclass.ShowUI.apply(this, arguments);
                // Add code here that should happen after default processing
            }

            FormAppletTestPR.prototype.BindData = function (bRefresh) {
                // BindData is called each time the data set changes.
                // This is where you'll bind that data to user interface elements you might have created in ShowUI
                // Add code here that should happen before default processing
                SiebelAppFacade.FormAppletTestPR.superclass.BindData.apply(this, arguments);
                // Add code here that should happen after default processing
            }

            FormAppletTestPR.prototype.BindEvents = function () {
                var controls = this.GetPM().Get("GetControls");
            var Attachmentbtn = controls["HMCL Attachment"];
			$('[name="' + Attachmentbtn.GetInputName() + '"]').click(function() {
                var sURLName = controls["Attachment Url"];
                 var sURL = pm.ExecuteMethod("GetFieldValue", sURLName);
    			if (sURL) window.open(sURL, "ASCENT");
                else{
                	SiebelApp.S_App.SetErrorMsg("Server Error. Please try again");
                	SiebelApp.S_App.ProcessError();
                }
    			}
    			)
                // BindEvents is where we add UI event processing.
                // Add code here that should happen before default processing

                SiebelAppFacade.FormAppletTestPR.superclass.BindEvents.apply(this, arguments);
                // Add code here that should happen after default processing
            }

            FormAppletTestPR.prototype.EndLife = function () {
                // EndLife is where we perform any required cleanup.
                // Add code here that should happen before default processing
                SiebelAppFacade.FormAppletTestPR.superclass.EndLife.apply(this, arguments);
                // Add code here that should happen after default processing
            }

            return FormAppletTestPR;
        }
            ());
        return "SiebelAppFacade.FormAppletTestPR";
    })
}
