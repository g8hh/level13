// A system that updates various GameState.unlockedFeatures based on improvements etc
define([
	'ash',
	'game/GameGlobals',
	'game/GlobalSignals',
	'game/constants/ItemConstants',
	'game/constants/UpgradeConstants',
	'game/nodes/player/ItemsNode',
	'game/nodes/sector/CampNode',
	'game/nodes/player/PlayerStatsNode',
	'game/nodes/tribe/TribeUpgradesNode',
	'game/components/common/PositionComponent',
	'game/components/sector/SectorStatusComponent',
	'game/components/sector/SectorLocalesComponent',
	'game/components/sector/improvements/SectorImprovementsComponent',
	'game/vos/PositionVO'
], function (Ash, GameGlobals, GlobalSignals, ItemConstants, UpgradeConstants, ItemsNode, CampNode, PlayerStatsNode, TribeUpgradesNode, PositionComponent, SectorStatusComponent, SectorLocalesComponent, SectorImprovementsComponent, PositionVO) {
	var UnlockedFeaturesSystem = Ash.System.extend({
		
		gameState: null,
		campNodes: null,
		playerStatsNodes: null,
		tribeUpgradesNodes: null,
		itemNodes: null,
	
		constructor: function () { },

		addToEngine: function (engine) {
			this.engine = engine;
			this.campNodes = engine.getNodeList(CampNode);
			this.playerStatsNodes = engine.getNodeList(PlayerStatsNode);
			this.tribeUpgradesNodes = engine.getNodeList(TribeUpgradesNode);
			this.itemNodes = engine.getNodeList(ItemsNode);
			
			GlobalSignals.add(this, GlobalSignals.gameStartedSignal, this.onGameStarted);
			GlobalSignals.add(this, GlobalSignals.slowUpdateSignal, this.slowUpdate);
		},

		removeFromEngine: function (engine) {
			this.campNodes = null;
			this.playerStatsNodes = null;
			this.playerStatsNodes = null;
			this.engine = null;
			
			GlobalSignals.removeAll(this);
		},

		update: function (time) {
			this.updateUnlockedFeaturesDynamic();
		},
		
		slowUpdate: function (time) {
			this.updateDeadlocks();
		},
		
		updateUnlockedFeaturesDynamic: function () {
			let numCamps = 0;
			
			// Global improvements
			for (let node = this.campNodes.head; node; node = node.next) {
				let improvementsComponent = node.entity.get(SectorImprovementsComponent);

				if (node.camp.population >= 2 && improvementsComponent.getCount(improvementNames.campfire) > 0) {
					GameGlobals.playerActionFunctions.unlockFeature("upgrades");
				}
				if (improvementsComponent.getCount(improvementNames.home) < 1) {
					improvementsComponent.add(improvementNames.home);
				}
				numCamps++;
			}
			
			if (GameGlobals.gameState.numCamps !== numCamps) {
				GameGlobals.gameState.numCamps = numCamps;
			}

			if (numCamps > 1 && !GameGlobals.gameState.isFeatureUnlocked("housing")) {
				GameGlobals.playerActionFunctions.unlockFeature("housing");
			}
			
			if (!GameGlobals.gameState.unlockedFeatures.projects) {
				// TODO check with upgrade effects (has unlocked any upgrade that unlocks projects)
				if (this.tribeUpgradesNodes.head.upgrades.hasUpgrade("unlock_building_passage_staircase")) {
					GameGlobals.playerActionFunctions.unlockFeature("projects");
				}
			}
		},
		
		updateDeadlocks: function () {
			if (GameGlobals.gameState.isFeatureUnlocked("investigate") && !GameGlobals.playerHelper.hasItemBaseID("cache_insight") && GameGlobals.playerHelper.playerStatsNodes.head.insight.maxValue > 0) {
				let insightUpgradeIDs = UpgradeConstants.getAllUpgradesRequiringInsight();
				let lockedInsightUpgradeIDs = insightUpgradeIDs.filter(upgradeID => !GameGlobals.tribeHelper.hasUpgrade(upgradeID));
				let totalCost = GameGlobals.playerActionsHelper.getTotalCosts(lockedInsightUpgradeIDs);
				let totalCostInsight = totalCost.insight || 0;
				let currentInsight = GameGlobals.playerHelper.playerStatsNodes.head.insight.value;
				if (totalCostInsight > currentInsight && GameGlobals.levelHelper.getAllInvestigateableSectors().length == 0) {
					let sectors = GameGlobals.levelHelper.addFallbackInvestigateSectors();
					let positions = sectors.map(sector => sector.get(PositionComponent).getPosition());
					log.w("insight missing! adding fallback investigate sectors: " + positions.join(","));
					GameGlobals.playerHelper.addLogMessage("We have discovered new locations to investigate");
					return;
				}
			}
		},
		
		updateUnlockedFeaturesSanityChecks: function () {
			let upgradeID = GameGlobals.upgradeEffectsHelper.getUpgradeIdForAction("investigate");
			if (upgradeID) {
				if (!GameGlobals.tribeHelper.hasUpgrade(upgradeID)) {
					GameGlobals.playerActionFunctions.lockFeature("investigate")
				} else {
					GameGlobals.playerActionFunctions.unlockFeature("investigate")
				}
			}

			if (!GameGlobals.gameState.unlockedFeatures.explorers) {
				if (GameGlobals.playerHelper.getExplorers().length > 0) {
					GameGlobals.playerActionFunctions.unlockFeature("explorers");
				}
			}

			let groundLevel = GameGlobals.gameState.getGroundLevel();
			let position = new PositionVO(groundLevel, 0, 0, false);
			let groveSector = GameGlobals.levelHelper.findNearestLocaleSector(position, localeTypes.grove);
			if (groveSector) {
				let sectorStatusComponent = groveSector.get(SectorStatusComponent);
				let sectorLocalesComponent = groveSector.get(SectorLocalesComponent);
				for (let i = 0; i < sectorLocalesComponent.locales.length; i++) {
					let locale = sectorLocalesComponent.locales[i];
					let isScouted = sectorStatusComponent.isLocaleScouted(i);
					if (isScouted && locale.type == localeTypes.grove) {
						this.playerStatsNodes.head.hope.hasDeity = true;
					}
				}
				return null;
			}
		},
		
		onGameStarted: function () {
			this.updateUnlockedFeaturesSanityChecks();
		}
		
	});

	return UnlockedFeaturesSystem;
});
