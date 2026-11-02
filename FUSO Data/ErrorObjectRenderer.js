    SiebelJS.Namespace('SiebelAppFacade.ErrorObjectRenderer');

    define("siebel/errorpopuprenderer", ["siebel/basephyrenderer"], function () {
    SiebelAppFacade.ErrorObjectRenderer = (function () {
		if (language == "jpn") var b = 1;
        else var b = 0;
		
        function ErrorObjectRenderer(pm) {
            SiebelAppFacade.ErrorObjectRenderer.superclass.constructor.call(this, pm);
        }

        SiebelJS.Extend(ErrorObjectRenderer, SiebelAppFacade.BasePR);

        ErrorObjectRenderer.prototype.ShowUI = function () {
            SiebelAppFacade.ErrorObjectRenderer.superclass.ShowUI.call(this);
            CreateErrorPopup(this);
        };

        ErrorObjectRenderer.prototype.BindEvents = function (controls, forceStop) {
            SiebelAppFacade.ErrorObjectRenderer.superclass.BindEvents.call(this);
                        
            $("#_sweview_popup").dialog({
                beforeClose: function (event, ui) {
                    if ($("#_sweview_popup").data("InitDlg")) {
                        return false;
                    }
                    return true;
                },
                buttons: [{ id: "btn-accept",
                    text: "Ok",
                    click: function () { $(this).dialog("close"); }
                }]
            });
        };

        ErrorObjectRenderer.prototype.ShowError = function (errMsg) {
            if (errMsg) {
				if(errMsg.indexOf("1- Provided Labor codes are not mapped with VIN Number in FALCON system") > -1){
					errMsg = "作業の数量が「1」以外のため、FALCONに作業コードが存在していません。サービスの種類に”作業コード未設定”を入力して再度申請してください。（該当作業コードは特殊作業として申請されます）FALCONの特殊作業名称が空白になるため、FALCONのドラフトクレームで名称を入力してください。";
				}
				else if(errMsg.indexOf("1- No Pending Field fix for this inventory 日(SBL-BPR-00131)") > -1){
					errMsg = "FALCON上で市場措置実施済み、または市場措置コードの登録がない可能性があります。FALCONを確認してください。";
				}
				else if(errMsg.indexOf("1-(8)サービス添付をご確認してください。") > -1){
					errMsg = "添付が必要な作業/部品/油脂が含まれています。ライン毎に添付して下さい。（※ファイル名が一緒だとエラーが出ますので、ライン毎に違う名前に変更して添付してください）";
				}
				else if(errMsg.indexOf("3.JCスケジュール＞工事完了日時にWOの工事完了日時が反映します。") > -1){
					errMsg = "工事完了日時が空白です。JC状況を「メンテナンス開始」選択＞保存＞「メンテナンス完了」選択＞保存を行うと、3.JCスケジュール＞工事完了日時にWOの工事完了日時が反映します。";
				}
				else if (errMsg.indexOf("予定納期の値を入力してください") > -1){
					errMsg = "受領日(納車)予定日を入力してください。";
				}
				else if (errMsg.indexOf("フィールド 'JC状況' の値を '予約' から '入庫' に変更する権限がありません。") > -1){
					errMsg = "手動でJC状況を予約から入庫に変えることはできません。条件を確認してください。";
				}
                $("#_sweview_popup").data("InitDlg", true);
                setTimeout(function () {
                    $("#_sweview_popup").removeData("InitDlg");
                }, 2);
                //$("#_sweview_popup").text(errMsg).dialog("open");
				if(b){
					var msg = '<div class="errpop"><label style ="font-size: 22px; color: red">'+errMsg+'</label><br><br><br><label >参考:エラーメッセージの内容詳細はFORCEボットでも検索できます。この参考情報を除くエラーメッセージ本文を</label><br><label>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;コピー頂>きFORCEボットに貼り付けて下さい</label><br><label>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;★★FORCEボットへのリンク：<a href="http://sgscvaiw0551.inedc.corpintra.net/57531/index.html" target="popup" onclick="window.open(`http://sgscvaiw0551.inedc.corpintra.net/57531/index.html`,`popup`,`toolbar=no,resizable=yes,location=no,menubar=0,top=`+screen.height*2/5+`,left=`+screen.width*23/30+`,width=`+screen.width*6.8/30+`,height=`+screen.height*9/20)">FORCEボット</a></label><label>★★</label><br><br><label>※もし、FORCEボットで検索しても解決しない場合>は、Support Deskへお問い合わせください。</label></div>';
				}
				else{
					var msg = '<div class="errpop"><label style ="font-size: 22px; color: red">'+errMsg+'</label><br><br><br><label >Note: You can also search the FORCE bot for details on the content of the error message. The error message body excluding this reference information</label><br><label>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Copy top> Please paste it on the FORCE bot</label><br><label>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;★★FORCEボットへのリンク：<a href="http://sgscvaiw0551.inedc.corpintra.net/57531/index.html" target="popup" onclick="window.open(`http://sgscvaiw0551.inedc.corpintra.net/57531/index.html`,`popup`,`toolbar=no,resizable=yes,location=no,menubar=0,top=`+screen.height*2/5+`,left=`+screen.width*23/30+`,width=`+screen.width*6.8/30+`,height=`+screen.height*9/20)">FORCEボット</a></label><label>★★</label><br><br><label>* If searching with the FORCE bot does not help>, please contact Support Desk.</label></div>';           
                }
				
				//alert(errMsg +'\n\n参考:エラーメッセージの内容詳細はFORCEボットでも検索できます。この参考情報を除くエラーメッセージ本文をコピー頂きFORCEボットに貼り付け下さい。\n\nFORCEチャットボット: http://sgscvaiw0551.inedc.corpintra.net/57531/index.html');
				$(".errpop").dialog("destroy").remove();
				$(msg).dialog({
					autoOpen: true,
					modal: true,
					maxWidth: 'auto',
					maxHeight: 'auto',
					closeOnEscape: false,
					width: 'auto',
					height: 'auto',
					title: "メッセージ",
					
					open: function() {$('#Close_dialog_btn_close').focus();},
					//open: function() {setTimeout(function() {$('#Close_dialog_btn_close').focus();}, 100);},
					dialogClass: "no-close",
					buttons: {
						1: {
							id: "Close_dialog_btn_close",
							text: "OK",
							click: function() {
								$(this).dialog("destroy").remove()
							},
							"class": "appletButton"
						}
					}
				});
            }
        };

        function CreateErrorPopup(errMsg) {
            var divErr;
            var parentContainer = SiebelApp.S_App.IsRwd() ? SiebelApp.S_App.ViewTarget() : "_sweview";
            if ($("#_sweview_popup").length === 0) {
                divErr = "<div id = '_sweview_popup'>" + "</div>";
                if ($("#" + parentContainer).length !== 0) {
                    $("#" + parentContainer).append(divErr);
                }
            }
            $("#_sweview_popup").dialog({
                autoOpen: false,
                modal: true
            });
        }

        return ErrorObjectRenderer;
    })();
        return SiebelAppFacade.ErrorObjectRenderer;
    });
