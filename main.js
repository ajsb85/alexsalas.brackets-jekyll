/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

/** Simple extension that adds a "File > Jekyll serve" menu item */
define(function (require, exports, module) {
    "use strict";

    window.jekyll = {
        debug: false
    };
    /** --- MODULES --- **/
    var CommandManager  		= brackets.getModule("command/CommandManager"),
		DocumentManager     	= brackets.getModule("document/DocumentManager"),
		Commands                = brackets.getModule("command/Commands"),
        Menus           		= brackets.getModule("command/Menus"),
		ProjectManager        	= brackets.getModule("project/ProjectManager"),
		ExtensionUtils  		= brackets.getModule("utils/ExtensionUtils"),
		Dialogs					= brackets.getModule("widgets/Dialogs"),
		NodeConnection  		= brackets.getModule("utils/NodeConnection"),
		NativeFileSystem  		= brackets.getModule("filesystem/FileSystem"),
		EditorManager       	= brackets.getModule("editor/EditorManager"),
		FileUtils 				= brackets.getModule("file/FileUtils"),
		NativeApp 				= brackets.getModule("utils/NativeApp"),
		nodeConnection  		= new NodeConnection(),
		domainPath				= ExtensionUtils.getModulePath(module) + "domain",
		JekyllMenuID			= "jekyll-menu",
		JekyllMenu				= Menus.addMenu("Jekyll", JekyllMenuID),
		JEKYLL_IMPORT_DIALOG_ID	= "jekyll-import-dialog",
		JEKYLL_ABOUT_DIALOG_ID	= "jekyll-about-dialog";
		
    var $icon                   = $("<a id='extension-jekyll-icon' href='#'></a>").attr("title", "Run jekyll serve").appendTo($("#main-toolbar .buttons")),
		curProjectDir,
		runing,
		cmd = '';
		
	ExtensionUtils.loadStyleSheet(module, "less/jekyll.less");
    // Function to run when the menu item is clicked
    function handleJekyllServe() {
		if($icon.hasClass('ok') || $icon.hasClass('loading') || $icon.hasClass('error')){
			Dialogs.showModalDialog(Dialogs.DIALOG_ID_INFO, "Jekyll Shutdown", "We going to kill all task of ruby.").done(function(id) {
				if(id !== "ok") return;
					nodeConnection.connect(true).fail(function (err) {
						_eN("Cannot connect to node: " + err);
					}).then(function () {			
						return nodeConnection.loadDomains([domainPath], true).fail(function (err) {
							_eN("Cannot register domain: " + err);
							$icon.attr( "class", "on" ).attr("title", "Jekyll serve");
						});
					}).then(function () {
						nodeConnection.domains["jekyll.execute"].jekyll(null, 'taskkill /F /IM ruby.exe')
						.then(function (data) {
							console.log("[[Brackets Jekyll]] then: " + data);
							$icon.attr( "class", "on" ).attr("title", "Jekyll serve");
						});
					}).done();
			});
		}else{
			curProjectDir = ProjectManager.getProjectRoot().fullPath;
			$icon.attr( "class", "ok" ).attr("title", "Jekyll's running");
			nodeConnection.connect(true).fail(function (err) {
				_eN("Cannot connect to node: " + err);
			}).then(function () {			
				return nodeConnection.loadDomains([domainPath], true).fail(function (err) {
					_eN("Cannot register domain: " + err);
				});
			}).then(function () {
				NativeApp.openURLInDefaultBrowser("http://localhost:4000/");
				nodeConnection.domains["jekyll.execute"].jekyll(curProjectDir, 'bundle exec jekyll serve -t -w')
				.fail(function (err) {
					_eN("fail: " + err);
				})
				.then(function (data) {
					console.log("[[Brackets Jekyll]] then: " + data);
					//Dialogs.showModalDialog(Dialogs.DIALOG_ID_INFO, "Jekyll Serve", data);
					//Dialogs.showModalDialog(Dialogs.DIALOG_ID_INFO, "Jekyll Documentation", "Enter to http://localhost:4000/ to view the documentation.");
					$icon.attr( "class", "on" ).attr("title", "Jekyll serve");
				});
			}).done();
		}
    }
	$icon.on("click", handleJekyllServe);
	
	//Error Notification
	function _eN(msj) {
		$icon.attr( "class", "error" ).attr("title", "Jekyll error");
		console.error("[[Brackets Jekyll]] ", msj);
	}

	function handleJekyllDoctor() {
		runing = $icon.hasClass('ok');
		$icon.attr( "class", "loading" ).attr("title", "Loading");
 		curProjectDir = ProjectManager.getProjectRoot().fullPath;
		nodeConnection.connect(true).fail(function (err) {
			_eN("Cannot connect to node: " + err);
		}).then(function () {			
			return nodeConnection.loadDomains([domainPath], true).fail(function (err) {
				_eN("Cannot register domain: " + err);
			});
		}).then(function () {
			$icon.attr( "class", "loading" ).attr("title", "Loading");
			nodeConnection.domains["jekyll.execute"].jekyll(curProjectDir, 'bundle exec jekyll doctor')
			.fail(function (err) {
				_eN("fail: " + err);
			})
			.then(function (data) {
				console.log("[[Brackets Jekyll]] then: " + data);
				Dialogs.showModalDialog(Dialogs.DIALOG_ID_INFO, "Jekyll Doctor", data);
				if(runing){
					$icon.attr( "class", "ok" ).attr("title", "Jekyll's running");
				}else{
					$icon.attr( "class", "on" ).attr("title", "Jekyll serve");
				}
			});
		}).done();
	}

	function handleJekyllDocs() {
 		curProjectDir = ProjectManager.getProjectRoot().fullPath;
		$icon.attr( "class", "ok" ).attr("title", "Jekyll's running");
		Dialogs.showModalDialog(Dialogs.DIALOG_ID_INFO, "Jekyll Documentation", "Enter to http://localhost:4000/ to view the documentation.");
		nodeConnection.connect(true).fail(function (err) {
			_eN("Cannot connect to node: " + err);
		}).then(function () {			
			return nodeConnection.loadDomains([domainPath], true).fail(function (err) {
				_eN("Cannot register domain: " + err);
			});
		}).then(function () {
			nodeConnection.domains["jekyll.execute"].jekyll(curProjectDir, 'chcp 65001 & bundle exec jekyll docs')
			.fail(function (err) {
				_eN("fail: " + err);
			})
			.then(function (data) {
				console.log("[[Brackets Jekyll]] then: " + data);
				$icon.attr( "class", "on" ).attr("title", "Jekyll serve");
			});
		}).done();
	}
	
	function handleJekyllNewSite() {
 		ProjectManager.openProject().done(function () {
			curProjectDir = ProjectManager.getProjectRoot().fullPath;
			$icon.attr( "class", "loading" ).attr("title", "Loading");
			nodeConnection.connect(true).fail(function (err) {
				_eN("Cannot connect to node: " + err);
			}).then(function () {			
				return nodeConnection.loadDomains([domainPath], true).fail(function (err) {
					_eN("Cannot register domain: " + err);
				});
			}).then(function () {
				nodeConnection.domains["jekyll.execute"].jekyll(curProjectDir, 'jekyll new '+ curProjectDir)
				.fail(function (err) {
					_eN("fail: " + err);
					if(err.search("Conflict")!=-1){
						Dialogs.showModalDialog(Dialogs.DIALOG_ID_ERROR, "Jekyll Site", curProjectDir + " is not empty")
					}
				})
				.then(function (data) {
					console.log("[[Brackets Jekyll]] then: " + data);
					nodeConnection.domains["jekyll.execute"].jekyll(curProjectDir, 'bundle init')
					.fail(function (err) {
						_eN("fail: " + err);
					})
					.then(function (data2) {
						console.log("[[Brackets Jekyll]] then: " + data2);
						ProjectManager.refreshFileTree();
						var file = NativeFileSystem.getFileForPath(curProjectDir + 'Gemfile');
						var promise = FileUtils.readAsText(file);  // completes asynchronously
						promise.done(function (text) {
							FileUtils.writeText(file, text + "gem 'github-pages'\r\ngem 'wdm'", false).done(function(){
								DocumentManager.getDocumentForPath(curProjectDir + 'Gemfile').done(
									function (doc) {
										DocumentManager.addToWorkingSet(file);
										DocumentManager.setCurrentDocument(doc);
										$icon.attr( "class", "on" ).attr("title", "Jekyll serve");
									}
								);
							});
						})
						.fail(function (errorCode) {
							_eN("fail: " + err);  // one of the FileSystemError constants
						}); 
					});
				});
			}).done();
		});		
	}
	
    
    var Dialog = {
		/**
		 * The import modal is used to install a module inside the directory of the current file
		 * HTML: html/modal-import.html
		 */
		importBlog: {
			
            /**
             * HTML put inside the dialog
             */
            html: require("text!html/modal-import.html"),
            
			/**
			 * Opens up the modal
			 */
			show: function() {
				
                Dialogs.showModalDialog(
                    JEKYLL_IMPORT_DIALOG_ID, // ID the specify the dialog
                    "Import your old & busted site or blog", // Title
                    this.html,               // HTML-Content
                    [                        // Buttons
                        {className: Dialogs.DIALOG_BTN_CLASS_PRIMARY, id: Dialogs.DIALOG_BTN_OK, text: "Import"},
                        {className: Dialogs.DIALOG_BTN_CLASS_NORMAL, id: Dialogs.DIALOG_BTN_CANCEL, text: "Cancel"}
                    ]
                ).done(function(id) {
					
					// Only saving
					if(id !== "ok") return;
					
					// Module name musn't be empty
					if(source.value == "") {
						Dialogs.showModalDialog(Dialogs.DIALOG_ID_ERROR, "Error", "Please enter the XML file of your blog's content.");
						return;
					}
					runing = $icon.hasClass('ok');
					$icon.attr( "class", "loading" ).attr("title", "Loading");
					nodeConnection.connect(true).fail(function (err) {
						_eN("Cannot connect to node: " + err);
					}).then(function () {			
						return nodeConnection.loadDomains([domainPath], true).fail(function (err) {
							_eN("Cannot register domain: " + err);
						});
					}).then(function () {
						console.log('bundle exec jekyll import '+ blog.value + ' --source "' + source.value +'"');
						curProjectDir = ProjectManager.getProjectRoot().fullPath;
						console.log(curProjectDir);
						nodeConnection.domains["jekyll.execute"].jekyll(curProjectDir, 'bundle exec jekyll import '+ blog.value + ' --source "' + source.value +'"')
						.fail(function (err) {
							console.warn("[[Brackets Jekyll]] fail: ", err);
							if(runing){
								$icon.attr( "class", "ok" ).attr("title", "Jekyll's running");
							}else{
								$icon.attr( "class", "warning" ).attr("title", "Jekyll Warning");
							}
							Dialogs.showModalDialog(Dialogs.DIALOG_ID_ERROR, "Jekyll Import", err);
						})
						.then(function (data) {
							console.log("[[Brackets Jekyll]] then: " + data);
							Dialogs.showModalDialog(Dialogs.DIALOG_ID_ERROR, "Jekyll Import", data).done(function () {
								ProjectManager.refreshFileTree();
								if(runing){
									$icon.attr( "class", "ok" ).attr("title", "Jekyll's running");
								}else{
									$icon.attr( "class", "on" ).attr("title", "Jekyll serve");
								}
								//ProjectManager.openProject(curProjectDir);
								//CommandManager.execute(Commands.APP_RELOAD);
							});
						});
					}).done();
					
					// Should it be saved to package.json
					//var s = save.checked ? "--save" : "";
					
					//ConnectionManager.new([name.value, s], "install");
					
				});
				// It's important to get the elements after the modal is rendered but before the done event
				var blog = document.querySelector("." + JEKYLL_IMPORT_DIALOG_ID + " .blog"), 
					filename = document.querySelector("." + JEKYLL_IMPORT_DIALOG_ID + " .filename"),
					source = document.querySelector("." + JEKYLL_IMPORT_DIALOG_ID + " .path");
				$("." + JEKYLL_IMPORT_DIALOG_ID + " .source").on("click", function() { 
					NativeFileSystem.showOpenDialog(false, false, "Please select source to import",'',[".xml"],function (file, files){
						if(typeof files[0] != 'undefined'){
							source.value = files[0];
							var name = files[0].replace(/^.*[\\\/]/, '');
							filename.innerHTML = name;
						}
					});
				})
			}
        },
		about: {
			
            /**
             * HTML put inside the dialog
             */
            html: require("text!html/modal-about.html"),
            
			/**
			 * Opens up the modal
			 */
			show: function() {
				var buttonSend = false;
                Dialogs.showModalDialog(
                    JEKYLL_ABOUT_DIALOG_ID, // ID the specify the dialog
                    "Contact with the developer", // Title
                    this.html,               // HTML-Content
                    [                        // Buttons
                        {className: Dialogs.DIALOG_BTN_CLASS_PRIMARY, id: Dialogs.DIALOG_BTN_OK, text: "Ok"},
                        {className: Dialogs.DIALOG_BTN_CLASS_NORMAL, id: Dialogs.DIALOG_BTN_CANCEL, text: "Cancel"}
                    ]
                ).done(function(id) {
					console.log(id);
					// Only saving
					if(id !== "ok" && !buttonSend) return;
					
					// Module name musn't be empty
					if(email.value == "") {
						Dialogs.showModalDialog(Dialogs.DIALOG_ID_ERROR, "Error", "Please enter your valid email.");
						return;
					}
					
					$.ajax({
					  type: "POST",
					  url: "https://mandrillapp.com/api/1.0/messages/send.json",
					  data: {
						'key': 'FtgWBNlvJIsLLVOgl5LpXw',
						'message': {
						  'from_email': email.value,
						  'from_name': 'User Jekyll Brackets',
						  'to': [
							  {
								'email': 'alexander.salas@gmail.com',
								'name': 'Alexander Salas',
								'type': 'to'
							  }
							],
							"important": true,
						  'autotext': 'true',
						  'bcc_address': email.value,
						  'subject': 'Jekyll Brakets Extension',
						  'html': body.value
						}
					  }
					 }).done(function(response) {
					   console.log(response); // if you're into that sorta thing
					 });
					
				});
				
				// It's important to get the elements after the modal is rendered but before the done event
				var email = document.querySelector("." + JEKYLL_ABOUT_DIALOG_ID + " .email"), 
					contributors = document.querySelector("." + JEKYLL_ABOUT_DIALOG_ID + " .about-contributors"),
					$table = $("." + JEKYLL_ABOUT_DIALOG_ID + " .table"),
					$about = $("." + JEKYLL_ABOUT_DIALOG_ID + " .about-text"),
					$message = $("." + JEKYLL_ABOUT_DIALOG_ID + " .message"),
					body = document.querySelector("." + JEKYLL_ABOUT_DIALOG_ID + " .body");
					$table.hide(); 
					$message.on("click", function(){
						$about.hide("easeInBack");
						$table.show();
						$("." + JEKYLL_ABOUT_DIALOG_ID).find("[data-button-id='ok']").html("Send");
						buttonSend = true;
					});
					$.ajax({
					  type: "GET",
					  url: "http://gravatar.com/4a14258e09d19be8002d418c9a633baa.json"
					 }).done(function(response) {
					   console.log(response); // if you're into that sorta thing
					   console.log(response.entry[0].displayName);
					 });
					
					$.ajax({
					  type: "GET",
					  url: "https://api.github.com/repos/alexsalas/alexsalas.brackets-jekyll/contributors"
					 }).done(function(response) {
						var key, html = '';
						for(key in response) {
							html += '<a href="' + response[key].html_url + '" title="' + response[key].login + ' at Github"><img src="' + response[key].avatar_url + '" alt="' + response[key].login + '" width="50" height="50" style="opacity: 1;"></a>';
						}
					    contributors.innerHTML = html;
						var ext = JSON.parse(require('text!package.json'));
						console.log(ext.version);
					 });
				
			}
        }
    };
    
    // First, register a command - a UI-less object associating an id to a handler
    var JEKYLL_SERVE_CMD_ID = "jekyll.serve";   
    CommandManager.register("Run server", JEKYLL_SERVE_CMD_ID, handleJekyllServe);
    var JEKYLL_DOCS_CMD_ID = "jekyll.docs";   
    CommandManager.register("Local documentation", JEKYLL_DOCS_CMD_ID, handleJekyllDocs);
    var JEKYLL_DOCTOR_CMD_ID = "jekyll.doctor";   
    CommandManager.register("Search deprecation warnings", JEKYLL_DOCTOR_CMD_ID, handleJekyllDoctor);
    var JEKYLL_IMPORT_CMD_ID = "jekyll.import";   
    CommandManager.register("Import your old blog", JEKYLL_IMPORT_CMD_ID,  function() {
		Dialog.importBlog.show();
	});
    var JEKYLL_NEW_CMD_ID = "jekyll.new";   
	CommandManager.register("New site scaffold", JEKYLL_NEW_CMD_ID, handleJekyllNewSite);
    var JEKYLL_FIX_CMD_ID = "jekyll.fix";   
	CommandManager.register("Troubleshooting", JEKYLL_FIX_CMD_ID, function() {
		NativeApp.openURLInDefaultBrowser("https://github.com/alexsalas/alexsalas.brackets-jekyll/issues/2");
	});
    var JEKYLL_ABOUT_CMD_ID = "jekyll.about";  
	CommandManager.register("About this extension", JEKYLL_ABOUT_CMD_ID, function() {
		Dialog.about.show();
	});
	
/*     
	build                Build your site
    default
    docs                 Launch local server with docs for Jekyll v1.4.3
    doctor               Search site and print specific deprecation warnings
    help                 Display global or [command] help documentation.
    import               Import your old blog to Jekyll
    new                  Creates a new Jekyll site scaffold in PATH
    serve                Serve your site locally */
	
    JekyllMenu.addMenuItem(JEKYLL_SERVE_CMD_ID, "Alt-J");
	JekyllMenu.addMenuDivider();
	JekyllMenu.addMenuItem(JEKYLL_NEW_CMD_ID);
	JekyllMenu.addMenuDivider();
	JekyllMenu.addMenuItem(JEKYLL_DOCTOR_CMD_ID);
	JekyllMenu.addMenuItem(JEKYLL_IMPORT_CMD_ID);
	JekyllMenu.addMenuDivider();
	JekyllMenu.addMenuItem(JEKYLL_DOCS_CMD_ID);
	JekyllMenu.addMenuItem(JEKYLL_FIX_CMD_ID);
	JekyllMenu.addMenuDivider();
	JekyllMenu.addMenuItem(JEKYLL_ABOUT_CMD_ID);
});