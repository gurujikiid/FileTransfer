//VIJAY_KASHYAP: to popup a display msg in siebel via script

function ShowIUPRMPopupMsg(Inputs, Outputs) {
    try {
        var sOrderId = Inputs.GetProperty("orderId");
        var bOrdBO = TheApplication().GetBusObject("HMCL Perf Order Entry");
        var bBCOrd = bOrdBO.GetBusComp("Order Entry - Orders Service");
        with(bBCOrd) {
            ClearToQuery();
            SetViewMode(AllView);
            ActivateField("HMCL VIN IUPRM Flag");
            ActivateField("HMCL Dealer IUPRM Flag");
            ActivateField("Id");
            var Srchstr = "([Id]  = '" + sOrderId + "' AND [HMCL VIN IUPRM Flag] = 'Y' AND [HMCL Dealer IUPRM Flag] = 'Y')";
            SetSearchExpr(Srchstr);
            ExecuteQuery(ForwardOnly);
            if (FirstRecord()) {
                var obs = TheApplication().GetService("LS Pharma Signature UI Service");
                var inp = TheApplication().NewPropertySet();
                var outp = TheApplication().NewPropertySet();
                var txt = "Your Test Here";
                inp.SetProperty("Confirm Text", txt);
                obs.InvokeMethod("ShowConfirmDialog", inp, outp);
            }
        }
    } catch (e) {
        throw (e);
    } finally {

    }
}