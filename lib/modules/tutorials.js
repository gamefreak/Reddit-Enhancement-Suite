addModule('tutorials', function(module, moduleID) {
	module.moduleName = 'Tutorials';
	module.category = 'About RES';
	module.description = 'GameFreak PLZ write description';
	// module.alwaysEnabled = true;
	// module.hidden = true;

	var TUTORIAL_HASH_PATTERN = /^#!RESTutorials?\/([^\/]+)(?:\/([^\/]+))?$/i;
	var loadedTutorials = {};


	module.go = function() {
		if (!(this.isEnabled() && this.isMatchURL())) return;


		window.addEventListener('hashchange', hashUpdated);
		setTimeout(hashUpdated, 300);
		setTimeout(installViewer, 50);
	};


	function installViewer() {
		var tutorialOverlay = document.getElementById('TutorialOverlay');
		if (tutorialOverlay !== null) return tutorialOverlay;

		var html = '\
		<div id="TutorialOverlay" class="">\
			<div class="RESDialogSmall">\
				<h3 id="TutorialHeader"></h3>\
				<a href="#" class="RESCloseButton close">X</a>\
				<div class="RESDialogContents">\
					<div id="TutorialBody" class="md"></div>\
				</div>\
				<div id="TutorialFoot" class="RESGalleryControls">\
					<a id="TutorialPrevious" class="previous"></a>\
					<a id="TutorialNext" class="next"></a>\
				</div>\
			</div>\
		</div>';
		
		$(html).appendTo(document.body);

	}

	function hashUpdated(event) {
		var match = TUTORIAL_HASH_PATTERN.exec(location.hash);
		if (match === null) {
			document.body.classList.remove('res-tutorials-open');
			return;
		}
		document.body.classList.add('res-tutorials-open');

		var tutorialId = encodeHeadingName(match[1]),
		    sectionId = encodeHeadingName(match[2]);


		findTutorialPage(tutorialId, sectionId).then(function(idx) {
			var tut = loadedTutorials[tutorialId];
			var entry = tut[idx];

			$('#TutorialHeader').empty().append(entry.header.childElementCount > 0 ? entry.header.firstElementChild.innerHTML : '');
			$('#TutorialBody').empty().append(entry.body.cloneNode(true));


			$('#TutorialPrevious').toggle(idx > 0).attr('href', getPageName(tutorialId, idx - 1))
			$('#TutorialNext').toggle(idx < tut.length - 1).attr('href', getPageName(tutorialId, idx + 1))
		}, function(error) {
			console.error(error);
		});
	}


	function getMarkdownInstance() {
		if ('markdown' in module) return module.markdown;

		var SnuOwnd = window.SnuOwnd;

		var callbacks = SnuOwnd.getRedditCallbacks();
		
		//Override the rendering callbacks

		// Divide up the text at level 1 headers using <section> elements
		callbacks.doc_header = function(out, options) {
			console.log('options', options);
			//Special case for the first one is _front
			out.s += '<section name="_front">\n';
		};


		var header_old = callbacks.header;
		callbacks.header = function(out, text, level, options) {
			if (level !== 1) return header_old(out, text, level, options);
			
			out.s += '</section>\n'
			out.s += '<section name="' + encodeHeadingName(text.s) + '">\n';
			out.s += '<h1>' + text.s + '</h1>\n';
		};


		var doc_footer_old = callbacks.doc_footer; //Save the old one
		callbacks.doc_footer = function(out, options) {
			console.log('end options', options);
			//Used the original callback
			doc_footer_old(out, options);

			out.s += '</section>';
		};


		var rendererConfig = SnuOwnd.defaultRenderState();
		rendererConfig.flags = SnuOwnd.DEFAULT_WIKI_FLAGS;
		rendererConfig.html_element_whitelist = SnuOwnd.DEFAULT_HTML_ELEMENT_WHITELIST;
		rendererConfig.html_attr_whitelist = SnuOwnd.DEFAULT_HTML_ATTR_WHITELIST;

		return module.converter = SnuOwnd.getParser({
			callbacks: callbacks,
			context: rendererConfig
		});
	}


	function getTutorial(id) {
		if (id in loadedTutorials) return Promise.resolve(loadedTutorials[id]);

		return $.get('/r/RESTutorials/wiki/'+id+'.json')
			.then(compileTutorial)
			.then(function(sections) {
				loadedTutorials[id] = sections;
				return sections;
			});
	}

	function compileTutorial(json) {
		var wrapper = document.createElement('div');
		wrapper.innerHTML = getMarkdownInstance().render(json.data.content_md);

		var sections = [].filter.call(wrapper.children, function(elem) {
			return elem.tagName === 'SECTION';
		}).map(function(sec, index) {
			var header = document.createDocumentFragment(),
			    body = document.createDocumentFragment();
			if (sec.childElementCount > 0 && sec.firstElementChild.tagName === 'H1') {
				header.appendChild(sec.firstElementChild);
			}
			body.appendChild(sec);

			var name = 'page_' + index;
			if (header.textContent.trim().length > 0) {
				name = encodeHeadingName(header.textContent);
			}
			return {
				name: name,
				header: header,
				body: body
			}
		});
		return sections;
	}

	function findTutorialPage(tutorialId, sectionId) {
		return getTutorial(tutorialId).then(function(sections) {
			//Shortcut for number
			if (Number.isInteger(Number(sectionId))) return Number(sectionId);

			//scan ids
			for (var i = 0, length = sections.length; i < length; i++) {
				if (sections[i].name === sectionId) return i;
			}

			//return the first one
			return 0;
		})
	}

	function getPageName(tutorialId, index) {
		var entry = loadedTutorials[tutorialId][index];
		if (entry == null) return '';
		var name = index===0 ? '' : '/' + entry.name
		return '#!RESTutorial/' + tutorialId + name;
	}


	function encodeHeadingName(text) {
		if (text == undefined) return undefined;
		return text.replace(/ +/g, '_').replace(/\W/g, '');
	}

	$.extend({
		hashUpdated: hashUpdated
	});
});