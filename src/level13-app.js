define([
	'module',
	'jquery/jquery-3.7.1.min',
	'core/ConsoleLogger',
	'game/level13',
	'game/constants/GameConstants',
	'text/Text',
	'text/TextBuilder',
	'text/lang/LangEnglish'
], function (module, jQuery, ConsoleLogger, Level13, GameConstants, Text, TextBuilder, LangEnglish) {
	'use strict';

	function Level13App() {

		this.initialise = function (config) {
			let isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);

			GameConstants.isMobile = isMobileDevice;
			GameConstants.isMobileOverlayShown = isMobileDevice;

			GameConstants.isDebugVersion = config.isDebugVersion;
			GameConstants.isCheatsEnabled = config.isCheatsEnabled;
			GameConstants.isAutosaveEnabled = config.isAutosaveEnabled;
			ConsoleLogger.logInfo = config.isDebugOutputEnabled;
			
			if (!config.isAnalyticsEnabled) {
				window.gtag = function () { };
			}
			
			Text.isDebugMode = config.isDebugVersion;
			Text.language = LangEnglish;
			TextBuilder.isDebugMode = config.isDebugVersion;
			TextBuilder.language = LangEnglish;

			GameConstants.STARTTimeStart = new Date().getTime();
			GameConstants.STARTTimeNow = function () {
				return new Date().getTime() - this.STARTTimeStart;
			}

			var level13 = new Level13(config.plugins);

			if (GameConstants.isCheatsEnabled) {
				window.app = level13;
			}
		};

	}

	new Level13App().initialise(module.config());
});
