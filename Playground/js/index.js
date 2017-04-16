﻿var jsEditor;
(function () {
    var fontSize = 14;

    var splitInstance = Split(['#jsEditor', '#canvasZone']);

    var elementToTheme = [
        '.wrapper .gutter',
        '.wrapper #jsEditor',
        '.navbar',
        '.navbar .select .toDisplay .option',
        '.navbar .select .toDisplayBig',
        '.navbar .select .toDisplayBig a',
        '.navbar .select .toDisplayBig ul li',
        '.navbarBottom',
        '.navbarBottom .links .link',
        '.save-message'];

    var run = function () {
        var blockEditorChange = false;

        jsEditor.onKeyDown(function (evt) {
        });

        jsEditor.onKeyUp(function (evt) {
            if (blockEditorChange) {
                return;
            }

            document.getElementById("currentScript").innerHTML = "Custom";
            document.getElementById('safemodeToggle').classList.add('checked');
        });

        var snippetUrl = "https://babylonjs-api2.azurewebsites.net/snippets";
        var currentSnippetToken;
        var currentSnippetTitle = null;
        var currentSnippetDescription = null;
        var currentSnippetTags = null;
        var engine;
        var fpsLabel = document.getElementById("fpsLabel");
        var scripts;
        var zipCode;
        BABYLON.Engine.ShadersRepository = "/src/Shaders/";

        var currentVersionElement = document.getElementById("currentVersion");

        if (currentVersionElement) {
            switch (BABYLON.Engine.Version) {
                case "2.5":
                    currentVersionElement.innerHTML = "Version: " + BABYLON.Engine.Version;
                    break;
                default:
                    currentVersionElement.innerHTML = "Version: Latest";
                    break;
            }
        }


        var loadScript = function (scriptURL, title) {
            var xhr = new XMLHttpRequest();

            xhr.open('GET', scriptURL, true);

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        blockEditorChange = true;
                        jsEditor.setValue(xhr.responseText);
                        jsEditor.setPosition({ lineNumber: 0, column: 0 });
                        blockEditorChange = false;
                        compileAndRun();

                        document.getElementById("currentScript").innerHTML = title;

                        currentSnippetToken = null;
                    }
                }
            };

            xhr.send(null);
        };

        var loadScriptFromIndex = function (index) {
            if (index === 0) {
                index = 1;
            }

            var script = scripts[index - 1].trim();
            loadScript("scripts/" + script + ".js", script);
        }

        var onScriptClick = function (evt) {
            loadScriptFromIndex(evt.target.scriptLinkIndex);
        }

        var loadScriptsList = function () {
            var xhr = new XMLHttpRequest();

            xhr.open('GET', 'scripts/scripts.txt', true);

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        scripts = xhr.responseText.split("\n");
                        var ul = document.getElementById("scriptsList");
                        var index;
                        for (index = 0; index < scripts.length; index++) {
                            var option = document.createElement("li");
                            var a = document.createElement("a");
                            a.href = "#";
                            a.innerHTML = (index + 1) + " - " + scripts[index];
                            a.scriptLinkIndex = index + 1;
                            a.onclick = onScriptClick;

                            option.appendChild(a);
                            ul.appendChild(option);
                        }

                        if (!location.hash) {
                            // Query string
                            var queryString = window.location.search;

                            if (queryString) {
                                var query = queryString.replace("?", "");
                                index = parseInt(query);
                                if (!isNaN(index)) {
                                    loadScriptFromIndex(index);
                                } else {
                                    loadScript("scripts/" + query + ".js", query);
                                }
                            } else {
                                loadScript("scripts/basic scene.js", "Basic scene");
                            }
                        }

                        // Restore theme
                        var theme = localStorage.getItem("bjs-playground-theme") || 'light';
                        toggleTheme(theme);

                        // Remove editor if window size is less than 850px
                        var removeEditorForSmallScreen = function () {
                            if (mq.matches) {
                                splitInstance.collapse(0);
                            } else {
                                splitInstance.setSizes([50, 50]);
                            }
                        }
                        var mq = window.matchMedia("(max-width: 850px)");
                        mq.addListener(removeEditorForSmallScreen);


                    }
                }
            };

            xhr.send(null);
        }

        var createNewScript = function () {
            location.hash = "";
            currentSnippetToken = null;
            currentSnippetTitle = null;
            currentSnippetDescription = null;
            currentSnippetTags = null;
            showNoMetadata();
            jsEditor.setValue('// You have to create a function called createScene. This function must return a BABYLON.Scene object\r\n// You can reference the following variables: scene, canvas\r\n// You must at least define a camera\r\n// More info here: https://doc.babylonjs.com/generals/The_Playground_Tutorial\r\n\r\nvar createScene = function() {\r\n\tvar scene = new BABYLON.Scene(engine);\r\n\tvar camera = new BABYLON.ArcRotateCamera("Camera", 0, Math.PI / 2, 12, BABYLON.Vector3.Zero(), scene);\r\n\tcamera.attachControl(canvas, true);\r\n\r\n\r\n\r\n\treturn scene;\r\n};');
            jsEditor.setPosition({ lineNumber: 11, column: 0 });
            jsEditor.focus();
            compileAndRun();
        }

        var clear = function () {
            location.hash = "";
            currentSnippetToken = null;
            jsEditor.setValue('');
            jsEditor.setPosition({ lineNumber: 0, column: 0 });
            jsEditor.focus();
        }

        var showError = function (errorMessage, errorEvent) {
            var errorContent =
                '<div class="alert alert-error"><button type="button" class="close" data-dismiss="alert">&times;</button>';
            if (errorEvent) {
                var regEx = /\(.+:(\d+):(\d+)\)\n/g;

                var match = regEx.exec(errorEvent.stack);
                if (match) {
                    errorContent += "Line ";
                    var lineNumber = match[1];
                    var columnNumber = match[2];

                    errorContent += lineNumber + ':' + columnNumber + ' - ';
                }
            }

            errorContent += errorMessage + '</div>';

            document.getElementById("errorZone").style.display = 'block';
            document.getElementById("errorZone").innerHTML = errorContent;

            // Close button error
            document.getElementById("errorZone").querySelector('.close').addEventListener('click', function () {
                document.getElementById("errorZone").style.display = 'none';
            });
        }

        var showNoMetadata = function () {
            document.getElementById("saveFormTitle").value = '';
            document.getElementById("saveFormTitle").readOnly = false;
            document.getElementById("saveFormDescription").value = '';
            document.getElementById("saveFormDescription").readOnly = false;
            document.getElementById("saveFormTags").value = '';
            document.getElementById("saveFormTags").readOnly = false;
            document.getElementById("saveFormButtons").style.display = "block";
            document.getElementById("saveMessage").style.display = "block";
            document.getElementById("metadataButton").style.display = "none";
        };
        showNoMetadata();

        var hideNoMetadata = function () {
            document.getElementById("saveFormTitle").readOnly = true;
            document.getElementById("saveFormDescription").readOnly = true;
            document.getElementById("saveFormTags").readOnly = true;
            document.getElementById("saveFormButtons").style.display = "none";
            document.getElementById("saveMessage").style.display = "none";
            document.getElementById("metadataButton").style.display = "inline-block";
        };

        compileAndRun = function () {
            try {

                if (!BABYLON.Engine.isSupported()) {
                    showError("Your browser does not support WebGL", null);
                    return;
                }

                if (engine) {
                    engine.dispose();
                    engine = null;
                }

                var canvas = document.getElementById("renderCanvas");
                engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
                document.getElementById("errorZone").style.display = 'none';
                document.getElementById("errorZone").innerHTML = "";
                document.getElementById("statusBar").innerHTML = "Loading assets...Please wait";

                engine.runRenderLoop(function () {
                    if (engine.scenes.length === 0) {
                        return;
                    }

                    if (canvas.width !== canvas.clientWidth) {
                        engine.resize();
                    }

                    var scene = engine.scenes[0];

                    if (scene.activeCamera || scene.activeCameras.length > 0) {
                        scene.render();
                    }

                    fpsLabel.innerHTML = engine.getFps().toFixed() + " fps";
                });

                var code = jsEditor.getValue();
                var scene;
                if (code.indexOf("createScene") !== -1) { // createScene
                    eval(code);
                    scene = createScene();
                    if (!scene) {
                        showError("createScene function must return a scene.", null);
                        return;
                    }

                    zipCode = code + "\r\n\r\nvar scene = createScene();";
                } else if (code.indexOf("CreateScene") !== -1) { // CreateScene
                    eval(code);
                    scene = CreateScene();
                    if (!scene) {
                        showError("CreateScene function must return a scene.", null);
                        return;
                    }

                    zipCode = code + "\r\n\r\nvar scene = CreateScene();";
                } else if (code.indexOf("createscene") !== -1) { // createscene
                    eval(code);
                    scene = createscene();
                    if (!scene) {
                        showError("createscene function must return a scene.", null);
                        return;
                    }

                    zipCode = code + "\r\n\r\nvar scene = createscene();";
                } else { // Direct code
                    scene = new BABYLON.Scene(engine);
                    eval("runScript = function(scene, canvas) {" + code + "}");
                    runScript(scene, canvas);

                    zipCode = "var scene = new BABYLON.Scene(engine);\r\n\r\n" + code;
                }

                if (engine.scenes.length === 0) {
                    showError("You must at least create a scene.", null);
                    return;
                }

                if (engine.scenes[0].activeCamera == null) {
                    showError("You must at least create a camera.", null);
                    return;
                }

                engine.scenes[0].executeWhenReady(function () {
                    document.getElementById("statusBar").innerHTML = "";
                });

            } catch (e) {
                showError(e.message, e);
            }
        };
        window.addEventListener("resize",
            function () {
                if (engine) {
                    engine.resize();
                }
            });

        // Load scripts list
        loadScriptsList();

        // Zip
        var addContentToZip = function (zip, name, url, replace, buffer, then) {
            var xhr = new XMLHttpRequest();

            xhr.open('GET', url, true);

            if (buffer) {
                xhr.responseType = "arraybuffer";
            }

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        var text;
                        if (!buffer) {
                            if (replace) {
                                var splits = replace.split("\r\n");
                                for (var index = 0; index < splits.length; index++) {
                                    splits[index] = "        " + splits[index];
                                }
                                replace = splits.join("\r\n");

                                text = xhr.responseText.replace("####INJECT####", replace);
                            } else {
                                text = xhr.responseText;
                            }
                        }

                        zip.file(name, buffer ? xhr.response : text);

                        then();
                    }
                }
            };

            xhr.send(null);
        }

        var addTexturesToZip = function (zip, index, textures, folder, then) {
            if (index === textures.length) {
                then();
                return;
            }

            if (textures[index].isRenderTarget || textures[index] instanceof BABYLON.DynamicTexture) {
                addTexturesToZip(zip, index + 1, textures, folder, then);
                return;
            }

            if (textures[index].isCube) {
                if (textures[index]._extensions) {
                    for (var i = 0; i < 6; i++) {
                        textures.push({ name: textures[index].name + textures[index]._extensions[i] });
                    }
                }
                else {
                    textures.push({ name: textures[index].name });
                }
                addTexturesToZip(zip, index + 1, textures, folder, then);
                return;
            }


            if (folder == null) {
                folder = zip.folder("textures");
            }
            var url;

            if (textures[index].video) {
                url = textures[index].video.currentSrc;
            } else {
                url = textures[index].name;
            }

            var name = url.substr(url.lastIndexOf("/") + 1);


            addContentToZip(folder,
                name,
                url,
                null,
                true,
                function () {
                    addTexturesToZip(zip, index + 1, textures, folder, then);
                });
        }

        var addImportedFilesToZip = function (zip, index, importedFiles, folder, then) {
            if (index === importedFiles.length) {
                then();
                return;
            }

            if (!folder) {
                folder = zip.folder("scenes");
            }
            var url = importedFiles[index];

            var name = url.substr(url.lastIndexOf("/") + 1);

            addContentToZip(folder,
                name,
                url,
                null,
                true,
                function () {
                    addImportedFilesToZip(zip, index + 1, importedFiles, folder, then);
                });
        }

        var getZip = function () {
            if (engine.scenes.length === 0) {
                return;
            }

            var zip = new JSZip();

            var scene = engine.scenes[0];

            var textures = scene.textures;

            var importedFiles = scene.importedMeshesFiles;

            document.getElementById("statusBar").innerHTML = "Creating archive...Please wait";

            if (zipCode.indexOf("textures/worldHeightMap.jpg") !== -1) {
                textures.push({ name: "textures/worldHeightMap.jpg" });
            }

            addContentToZip(zip,
                "index.html",
                "zipContent/index.html",
                zipCode,
                false,
                function () {
                    addTexturesToZip(zip,
                        0,
                        textures,
                        null,
                        function () {
                            addImportedFilesToZip(zip,
                                0,
                                importedFiles,
                                null,
                                function () {
                                    var blob = zip.generate({ type: "blob" });
                                    saveAs(blob, "sample.zip");
                                    document.getElementById("statusBar").innerHTML = "";
                                });
                        });
                });
        }

        // Versions
        setVersion = function (version) {
            switch (version) {
                case "2.5":
                    location.href = "index2_5.html" + location.hash;
                    break;
                default:
                    location.href = "index.html" + location.hash;
                    break;
            }
        }

        // Fonts
        setFontSize = function (size) {
            fontSize = size;
            document.querySelector(".view-lines").style.fontSize = size + "px";
            document.getElementById("currentFontSize").innerHTML = "Font: " + size;
        };

        // Fullscreen
        var goFullscreen = function () {
            if (engine) {
                engine.switchFullscreen(true);
            }
        }

        var toggleEditor = function () {
            var editorButton = document.getElementById("editorButton");
            var scene = engine.scenes[0];

            // If the editor is present
            if (editorButton.classList.contains('checked')) {
                editorButton.classList.remove('checked');
                splitInstance.collapse(0);
                editorButton.innerHTML = 'Editor <i class="fa fa-square-o" aria-hidden="true"></i>';
            } else {
                editorButton.classList.add('checked');
                splitInstance.setSizes([50, 50]);  // Reset
                editorButton.innerHTML = 'Editor <i class="fa fa-check-square" aria-hidden="true"></i>';
            }
            engine.resize();

            if (scene.debugLayer.isVisible()) {
                scene.debugLayer.hide();
                scene.debugLayer.show();
            }
        }

        /**
         * Toggle the dark theme
         */
        var toggleTheme = function (theme) {
            // Monaco
            var vsTheme;
            if (theme == 'dark') {
                vsTheme = 'vs-dark'
            } else {
                vsTheme = 'vs'
            }

            let oldCode = jsEditor.getValue();
            jsEditor.dispose();
            jsEditor = monaco.editor.create(document.getElementById('jsEditor'), {
                value: "",
                language: "javascript",
                lineNumbers: true,
                tabSize: "auto",
                insertSpaces: "auto",
                roundedSelection: true,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                readOnly: false,
                theme: vsTheme,
                contextmenu: false
            });
            jsEditor.setValue(oldCode);
            setFontSize(fontSize);

            for (var obj of elementToTheme) {
                let domObjArr = document.querySelectorAll(obj);
                for (let domObj of domObjArr) {
                    domObj.classList.remove('light');
                    domObj.classList.remove('dark');
                    domObj.classList.add(theme);
                }
            }

            localStorage.setItem("bjs-playground-theme", theme);

        }

        var toggleDebug = function () {
            var debugButton = document.getElementById("debugButton");
            var scene = engine.scenes[0];

            if (debugButton.classList.contains('uncheck')) {
                debugButton.classList.remove('uncheck');
                scene.debugLayer.show();
            } else {
                debugButton.classList.add('uncheck');
                scene.debugLayer.hide();
            }
        }

        var toggleMetadata = function () {
            var metadataButton = document.getElementById("metadataButton");
            var scene = engine.scenes[0];
            metadataButton.classList.add('checked');
            document.getElementById("saveLayer").style.display = "block";
        }

        // UI
        document.getElementById("runButton").addEventListener("click", compileAndRun);
        document.getElementById("zipButton").addEventListener("click", getZip);
        document.getElementById("fullscreenButton").addEventListener("click", goFullscreen);
        document.getElementById("newButton").addEventListener("click", createNewScript);
        document.getElementById("clearButton").addEventListener("click", clear);
        document.getElementById("editorButton").addEventListener("click", toggleEditor);
        document.getElementById("debugButton").addEventListener("click", toggleDebug);
        document.getElementById("metadataButton").addEventListener("click", toggleMetadata);
        document.getElementById("darkTheme").addEventListener("click", toggleTheme.bind(this, 'dark'));
        document.getElementById("lightTheme").addEventListener("click", toggleTheme.bind(this, 'light'));

        // Restore theme
        var theme = localStorage.getItem("bjs-playground-theme") || 'light';
        toggleTheme(theme);

        //Navigation Overwrites
        var exitPrompt = function (e) {
            var safeToggle = document.getElementById("safemodeToggle");
            if (safeToggle.classList.contains('checked')) {
                e = e || window.event;
                var message =
                    'This page is asking you to confirm that you want to leave - data you have entered may not be saved.';
                if (e) {
                    e.returnValue = message;
                }
                return message;
            }
        };

        window.onbeforeunload = exitPrompt;

        // Snippet
        var save = function () {

            // Retrieve title if necessary
            if (document.getElementById("saveLayer")) {
                currentSnippetTitle = document.getElementById("saveFormTitle").value;
                currentSnippetDescription = document.getElementById("saveFormDescription").value;
                currentSnippetTags = document.getElementById("saveFormTags").value;
            }

            var xmlHttp = new XMLHttpRequest();
            xmlHttp.onreadystatechange = function () {
                if (xmlHttp.readyState === 4) {
                    if (xmlHttp.status === 201) {
                        var baseUrl = location.href.replace(location.hash, "").replace(location.search, "");
                        var snippet = JSON.parse(xmlHttp.responseText);
                        var newUrl = baseUrl + "#" + snippet.id;
                        currentSnippetToken = snippet.id;
                        if (snippet.version && snippet.version !== "0") {
                            newUrl += "#" + snippet.version;
                        }
                        location.href = newUrl;
                        // Hide the complete title & co message
                        hideNoMetadata();
                        compileAndRun();
                    } else {
                        showError("Unable to save your code. It may be too long.", null);
                    }
                }
            }

            xmlHttp.open("POST", snippetUrl + (currentSnippetToken ? "/" + currentSnippetToken : ""), true);
            xmlHttp.setRequestHeader("Content-Type", "application/json");

            var dataToSend = {
                payload: {
                    code: jsEditor.getValue()
                },
                name: currentSnippetTitle,
                description: currentSnippetDescription,
                tags: currentSnippetTags
            };

            xmlHttp.send(JSON.stringify(dataToSend));
        }

        document.getElementById("saveButton").addEventListener("click", function () {
            if (currentSnippetTitle == null
                && currentSnippetDescription == null
                && currentSnippetTags == null) {

                document.getElementById("saveLayer").style.display = "block";
            }
            else {
                save();
            }
        });
        document.getElementById("saveFormButtonOk").addEventListener("click", function () {
            document.getElementById("saveLayer").style.display = "none";
            save();
        });
        document.getElementById("saveFormButtonCancel").addEventListener("click", function () {
            document.getElementById("saveLayer").style.display = "none";
        });
        document.getElementById("saveMessage").addEventListener("click", function () {
            document.getElementById("saveMessage").style.display = "none";
        });
        document.getElementById("mainTitle").innerHTML = "v" + BABYLON.Engine.Version;

        var previousHash = "";

        var cleanHash = function () {
            var splits = decodeURIComponent(location.hash.substr(1)).split("#");

            if (splits.length > 2) {
                splits.splice(2, splits.length - 2);
            }

            location.hash = splits.join("#");
        }

        var checkHash = function (firstTime) {
            if (location.hash) {
                if (previousHash !== location.hash) {
                    cleanHash();

                    previousHash = location.hash;

                    try {
                        var xmlHttp = new XMLHttpRequest();
                        xmlHttp.onreadystatechange = function () {
                            if (xmlHttp.readyState === 4) {
                                if (xmlHttp.status === 200) {
                                    var snippet = JSON.parse(xmlHttp.responseText)[0];

                                    blockEditorChange = true;
                                    jsEditor.setValue(JSON.parse(snippet.jsonPayload).code.toString());

                                    // Check if title / descr / tags are already set
                                    if ((snippet.name != null && snippet.name != "")
                                        || (snippet.description != null && snippet.description != "")
                                        || (snippet.tags != null && snippet.tags != "")) {
                                        currentSnippetTitle = snippet.name;
                                        currentSnippetDescription = snippet.description;
                                        currentSnippetTags = snippet.tags;

                                        if (document.getElementById("saveLayer")) {
                                            var elem = document.getElementById("saveLayer");

                                            document.getElementById("saveFormTitle").value = currentSnippetTitle;
                                            document.getElementById("saveFormDescription").value = currentSnippetDescription;
                                            document.getElementById("saveFormTags").value = currentSnippetTags;

                                            hideNoMetadata();
                                        }
                                    }
                                    else {
                                        currentSnippetTitle = null;
                                        currentSnippetDescription = null;
                                        currentSnippetTags = null;

                                        showNoMetadata();
                                    }

                                    jsEditor.setPosition({ lineNumber: 0, column: 0 });
                                    blockEditorChange = false;
                                    compileAndRun();

                                    document.getElementById("currentScript").innerHTML = "Custom";
                                } else if (firstTime) {
                                    location.href = location.href.replace(location.hash, "");
                                    if (scripts) {
                                        loadScriptFromIndex(0);
                                    }
                                }
                            }
                        };

                        var hash = location.hash.substr(1);
                        currentSnippetToken = hash.split("#")[0];
                        if (!hash.split("#")[1]) hash += "#0";


                        xmlHttp.open("GET", snippetUrl + "/" + hash.replace("#", "/"));
                        xmlHttp.send();
                    } catch (e) {

                    }
                }
            }
            setTimeout(checkHash, 200);
        }

        checkHash(true);
    }

    // Monaco

    var xhr = new XMLHttpRequest();

    xhr.open('GET', "babylon.d.txt", true);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                require.config({ paths: { 'vs': 'node_modules/monaco-editor/min/vs' } });
                require(['vs/editor/editor.main'], function () {
                    monaco.languages.typescript.javascriptDefaults.addExtraLib(xhr.responseText, 'babylon.d.ts');

                    jsEditor = monaco.editor.create(document.getElementById('jsEditor'), {
                        value: "",
                        language: "javascript",
                        lineNumbers: true,
                        tabSize: "auto",
                        insertSpaces: "auto",
                        roundedSelection: true,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        readOnly: false,
                        theme: "vs",
                        contextmenu: false
                    });

                    run();
                });
            }
        }
    };
    xhr.send(null);
})();
