/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

/** Simple extension that adds a "File > Jekyll serve" menu item */
define(function (require, exports, module) {
    "use strict";

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
		nodeConnection  		= new NodeConnection(),
		domainPath				= ExtensionUtils.getModulePath(module) + "domain",
		JekyllMenuID			= "jekyll-menu",
		JekyllMenu				= Menus.addMenu("Jekyll", JekyllMenuID),
		JEKYLL_IMPORT_DIALOG_ID	= "jekyll-import-dialog";
		
	var curProjectDir,
		cmd = '';
    // Function to run when the menu item is clicked
    function handleJekyllServe() {
        window.alert("ToDo: bundle exec jekyll serve -t -w");
    }
	
	//JSON.parse(require('text!builder.json'))

	function handleJekyllDoctor() {
 		curProjectDir = ProjectManager.getProjectRoot().fullPath;
		
		nodeConnection.connect(true).fail(function (err) {
			console.error("[[Brackets Jekyll]] Cannot connect to node: ", err);
		}).then(function () {			
			return nodeConnection.loadDomains([domainPath], true).fail(function (err) {
				console.error("[[Brackets Jekyll]] Cannot register domain: ", err);
			});
		}).then(function () {
			nodeConnection.domains["jekyll.execute"].jekyll(curProjectDir, 'bundle exec jekyll doctor')
			.fail(function (err) {
				console.error("[[Brackets Jekyll]] fail: ", err);
			})
			.then(function (data) {
				console.log("[[Brackets Jekyll]] then: " + data);
				Dialogs.showModalDialog(Dialogs.DIALOG_ID_ERROR, "Jekyll Doctor", data);
			});
		}).done();
	}
	
	function handleJekyllNewSite() {
 		ProjectManager.openProject().done(function () {
			curProjectDir = ProjectManager.getProjectRoot().fullPath;
			nodeConnection.connect(true).fail(function (err) {
				console.error("[[Brackets Jekyll]] Cannot connect to node: ", err);
			}).then(function () {			
				return nodeConnection.loadDomains([domainPath], true).fail(function (err) {
					console.error("[[Brackets Jekyll]] Cannot register domain: ", err);
				});
			}).then(function () {
				nodeConnection.domains["jekyll.execute"].jekyll(curProjectDir, 'jekyll new '+ curProjectDir)
				.fail(function (err) {
					console.error("[[Brackets Jekyll]] fail: ", err);
					if(err.search("Conflict")!=-1){
						Dialogs.showModalDialog(Dialogs.DIALOG_ID_ERROR, "Jekyll Site", curProjectDir + " is not empty")
					}
				})
				.then(function (data) {
					console.log("[[Brackets Jekyll]] then: " + data);
					nodeConnection.domains["jekyll.execute"].jekyll(curProjectDir, 'bundle init')
					.fail(function (err) {
						console.error("[[Brackets Jekyll]] fail: ", err);
					})
					.then(function (data2) {
						console.log("[[Brackets Jekyll]] then: " + data2);
						Dialogs.showModalDialog(Dialogs.DIALOG_ID_ERROR, "Jekyll Site", data + '\r\n' + data2).done(function () {
							ProjectManager.refreshFileTree();
 							var file = NativeFileSystem.getFileForPath(curProjectDir + 'Gemfile');
							var promise = FileUtils.readAsText(file);  // completes asynchronously
							promise.done(function (text) {
								FileUtils.writeText(file, text + "gem 'github-pages'\r\ngem 'wdm'", false).done(function(){
									DocumentManager.getDocumentForPath(curProjectDir + 'Gemfile').done(
										function (doc) {
											DocumentManager.addToWorkingSet(file);
											DocumentManager.setCurrentDocument(doc);
										}
									);
								});
							})
							.fail(function (errorCode) {
								console.log("Error #" + errorCode);  // one of the FileSystemError constants
							}); 
							
							//var src = FileUtils.getNativeModuleDirectoryPath(module) + "/builder.json";

							 //console.log(doc);
							 //doc.replaceRange("//Black magic. Do not modify EVER", 6);
							//EditorManager.getCustomViewerForPath(curProjectDir + 'Gemfile');
							
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
					
					nodeConnection.connect(true).fail(function (err) {
						console.error("[[Brackets Jekyll]] Cannot connect to node: ", err);
					}).then(function () {			
						return nodeConnection.loadDomains([domainPath], true).fail(function (err) {
							console.error("[[Brackets Jekyll]] Cannot register domain: ", err);
						});
					}).then(function () {
						console.log('bundle exec jekyll import '+ blog.value + ' --source "' + source.value +'"');
						curProjectDir = ProjectManager.getProjectRoot().fullPath;
						console.log(curProjectDir);
						nodeConnection.domains["jekyll.execute"].jekyll(curProjectDir, 'bundle exec jekyll import '+ blog.value + ' --source "' + source.value +'"')
						.fail(function (err) {
							console.warn("[[Brackets Jekyll]] fail: ", err);
							Dialogs.showModalDialog(Dialogs.DIALOG_ID_ERROR, "Jekyll Import", err);
						})
						.then(function (data) {
							console.log("[[Brackets Jekyll]] then: " + data);
							Dialogs.showModalDialog(Dialogs.DIALOG_ID_ERROR, "Jekyll Import", data).done(function () {
								ProjectManager.refreshFileTree();
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
					//(allowMultipleSelection, chooseDirectories, title, initialPath, fileTypes, callback)
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
				
                Dialogs.showModalDialog(
                    JEKYLL_IMPORT_DIALOG_ID, // ID the specify the dialog
                    "Contact with the developer", // Title
                    this.html,               // HTML-Content
                    [                        // Buttons
                        {className: Dialogs.DIALOG_BTN_CLASS_PRIMARY, id: Dialogs.DIALOG_BTN_OK, text: "Enviar"},
                        {className: Dialogs.DIALOG_BTN_CLASS_NORMAL, id: Dialogs.DIALOG_BTN_CANCEL, text: "Cancel"}
                    ]
                ).done(function(id) {
					
					// Only saving
					if(id !== "ok") return;
					
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
							'headers': {
								'Reply-To': 'a.salas@ieee.org'
							},
							"important": false,
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
				var email = document.querySelector("." + JEKYLL_IMPORT_DIALOG_ID + " .email"), 
					body = document.querySelector("." + JEKYLL_IMPORT_DIALOG_ID + " .body");
					
					$.ajax({
					  type: "GET",
					  url: "http://gravatar.com/4a14258e09d19be8002d418c9a633baa.json"
					 }).done(function(response) {
					   console.log(response); // if you're into that sorta thing
					   console.log(response.entry[0].displayName);
					 });
				
			}
        }
    };
    
    // First, register a command - a UI-less object associating an id to a handler
    var JEKYLL_SERVE_CMD_ID = "jekyll.serve";   // package-style naming to avoid collisions
    CommandManager.register("Run server", JEKYLL_SERVE_CMD_ID, handleJekyllServe);
    var JEKYLL_DOCS_CMD_ID = "jekyll.docs";   // package-style naming to avoid collisions
    CommandManager.register("Local documentation", JEKYLL_DOCS_CMD_ID, handleJekyllServe);
    var JEKYLL_DOCTOR_CMD_ID = "jekyll.doctor";   // package-style naming to avoid collisions
    CommandManager.register("Search deprecation warnings", JEKYLL_DOCTOR_CMD_ID, handleJekyllDoctor);
    var JEKYLL_IMPORT_CMD_ID = "jekyll.import";   // package-style naming to avoid collisions
    CommandManager.register("Import your old blog", JEKYLL_IMPORT_CMD_ID,  function() {
		Dialog.importBlog.show();
	});
    var JEKYLL_NEW_CMD_ID = "jekyll.new";   // package-style naming to avoid collisions
	CommandManager.register("New site scaffold", JEKYLL_NEW_CMD_ID, handleJekyllNewSite);
    var JEKYLL_ABOUT_CMD_ID = "jekyll.about";   // package-style naming to avoid collisions
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
	JekyllMenu.addMenuItem(JEKYLL_ABOUT_CMD_ID);
});