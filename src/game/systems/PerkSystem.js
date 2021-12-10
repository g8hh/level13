// A system that adds and removes perks to player based on various conditions// A system that updates accumulates resources in collectors
define([
	'ash',
	'game/GameGlobals',
	'game/GlobalSignals',
	'game/constants/GameConstants',
	'game/constants/LogConstants',
	'game/constants/ItemConstants',
	'game/constants/PerkConstants',
	'game/components/common/PositionComponent',
	'game/components/common/LogMessagesComponent',
	'game/components/sector/SectorFeaturesComponent',
	'game/components/sector/SectorStatusComponent',
	'game/components/player/PlayerActionComponent',
	'game/nodes/player/PlayerStatsNode',
	'game/nodes/PlayerLocationNode',
], function (Ash, GameGlobals, GlobalSignals, GameConstants, LogConstants, ItemConstants, PerkConstants, PositionComponent, LogMessagesComponent, SectorFeaturesComponent, SectorStatusComponent, PlayerActionComponent, PlayerStatsNode, PlayerLocationNode) {
	
	var PerkSystem = Ash.System.extend({
		
		playerNodes: null,
		locationNodes: null,
		
		constructor: function () {},
		
		addToEngine: function (engine) {
			this.engine = engine;
			this.playerNodes = engine.getNodeList(PlayerStatsNode);
			this.locationNodes = engine.getNodeList(PlayerLocationNode);
			GlobalSignals.add(this, GlobalSignals.gameShownSignal, this.onGameShown);
			GlobalSignals.add(this, GlobalSignals.playerMovedSignal, this.onPlayerMoved);
			GlobalSignals.add(this, GlobalSignals.equipmentChangedSignal, this.onEquipmentChanged);
			GlobalSignals.add(this, GlobalSignals.improvementBuiltSignal, this.onImprovementBuilt);
		},
		
		removeFromEngine: function (engine) {
			GlobalSignals.removeAll(this);
			this.playerNodes = null;
			this.locationNodes = null;
			this.engine = null;
		},
		
		update: function (time) {
			if (!this.locationNodes.head) return;
			this.updatePerkTimers(time);
		},
		
		updatePerkTimers: function (time) {
			var featuresComponent = this.locationNodes.head.entity.get(SectorFeaturesComponent);
			var statusComponent = this.locationNodes.head.entity.get(SectorStatusComponent);
			var busyComponent = this.playerNodes.head.entity.get(PlayerActionComponent);
			var itemsComponent = this.playerNodes.head.items;
			var perksComponent = this.playerNodes.head.perks;
			
			var perks = perksComponent.getAll();
			var isResting = this.isResting();
			var perksToRemove = [];
	
			for (let i = 0; i < perks.length; i++) {
				var perk = perks[i];
				
				if (perk.removeTimer !== PerkConstants.TIMER_DISABLED) {
					// is deactivating
					perk.removeTimer -= time * PerkConstants.getRemoveTimeFactor(perk, isResting) * GameConstants.gameSpeedExploration;
					if (perk.removeTimer < 0) {
						perksComponent.removePerkById(perk.id);
						this.addPerkRemovedLogMessage(perk.id);
					}
				} else if (perk.startTimer !== PerkConstants.TIMER_DISABLED) {
					// is activating
					perk.startTimer -= time * PerkConstants.getStartTimeFactor(perk, isResting) * GameConstants.gameSpeedExploration;
					if (perk.startTimer < 0) {
						perk.startTimer = PerkConstants.TIMER_DISABLED;
						this.addPerkStartedLogMessage(perk.id);
					}
				}
			}
		},
		
		updateLocationPerks: function () {
			if (!this.locationNodes.head) return;
			let isActive = GameGlobals.sectorHelper.isBeaconActive(this.playerNodes.head.entity.get(PositionComponent));
			if (isActive) {
				this.addOrUpdatePerk(PerkConstants.perkIds.lightBeacon);
			} else {
				this.deactivatePerk(PerkConstants.perkIds.lightBeacon, 0)
			}
		},
		
		updateHazardPerks: function () {
			if (!this.locationNodes.head) return;
			var featuresComponent = this.locationNodes.head.entity.get(SectorFeaturesComponent);
			var statusComponent = this.locationNodes.head.entity.get(SectorStatusComponent);
			var itemsComponent = this.playerNodes.head.items;
			var hazardPerksForSector = this.getHazardPerksForSector(featuresComponent, statusComponent, itemsComponent);
			var hazardPerksAll = [ PerkConstants.perkIds.hazardCold, PerkConstants.perkIds.hazardPoison, PerkConstants.perkIds.hazardRadiation];
			for (let i = 0; i < hazardPerksAll.length; i++) {
				var perkID = hazardPerksAll[i];
				var isActive = hazardPerksForSector.indexOf(perkID) >= 0;
				if (isActive) {
					this.addOrUpdatePerk(perkID, PerkConstants.ACTIVATION_TIME_HEALTH_DEBUFF);
				} else {
					this.deactivatePerk(perkID, 10);
				}
			}
		},
		
		addOrUpdatePerk: function (perkID, startTimer) {
			startTimer = startTimer || PerkConstants.TIMER_DISABLED;
			let perksComponent = this.playerNodes.head.perks;
			let playerPerk = perksComponent.getPerk(perkID);
			if (playerPerk) {
				playerPerk.setStartTimer(startTimer);
			} else {
				let perk = PerkConstants.getPerk(perkID);
				perksComponent.addPerk(perk);
				perk.setStartTimer(startTimer);
				this.addPerkAddedLogMessage(perkID);
			}
		},
		
		deactivatePerk: function (perkID, timer) {
			let perksComponent = this.playerNodes.head.perks;
			let perk = perksComponent.getPerk(perkID);
			if (perk) {
				if (perk.removeTimer == PerkConstants.TIMER_DISABLED || perk.removeTimer > timer) {
					perk.effectFactor = PerkConstants.getPerkActivePercent(perk);
					perk.removeTimer = timer;
					this.addPerkDeactivatedMessage(perkID);
				}
			}
		},
		
		addPerkAddedLogMessage: function (perkID) {
			var logComponent = this.playerNodes.head.entity.get(LogMessagesComponent);
			var msg = "";
			switch (perkID) {
				case PerkConstants.perkIds.hazardCold:
					msg = "It's unbearably cold.";
					break;
					
				case PerkConstants.perkIds.hazardPoison:
					msg = "The air here is toxic.";
					break;
					
				case PerkConstants.perkIds.hazardRadiation:
					msg = "Feeling nauseous.";
					break;
					
				case PerkConstants.perkIds.lightBeacon:
					msg = "Nearby beacon lights the way";
					break;
					
				default:
					log.w("unknown perk " + perkID);
					return;
			}
			logComponent.addMessage(LogConstants.MSG_ID_ADD_HAZARD_PERK, msg);
		},
		
		addPerkStartedLogMessage: function (perkID) {
			
		},
		
		addPerkDeactivatedMessage: function (perkID) {
			var logComponent = this.playerNodes.head.entity.get(LogMessagesComponent);
			var msg = "";
			switch (perkID) {
				case PerkConstants.perkIds.hazardCold:
					msg = "Warmer here.";
					break;
					
				case PerkConstants.perkIds.lightBeacon:
					msg = "Outside the beacon's range.";
					break;
					
				default:
					msg = "Safer here.";
					break;
			}
			logComponent.addMessage(LogConstants.MSG_ID_TIME_HAZARD_PERK, msg);
		},
		
		addPerkRemovedLogMessage: function (perkID) {
			var logComponent = this.playerNodes.head.entity.get(LogMessagesComponent);
			var msg = "";
			switch (perkID) {
				case PerkConstants.perkIds.hazardCold:
					msg = "Feeling warm again.";
					break;
					
				case PerkConstants.perkIds.hazardPoison:
					msg = "Feeling better again.";
					break;
					
				case PerkConstants.perkIds.hazardRadiation:
					msg = "Feeling better again.";
					break;
				
				case PerkConstants.perkIds.staminaBonusPenalty:
					msg = "Feeling better again.";
					break;
					
				case PerkConstants.perkIds.lightBeacon:
					return;
					
				default:
					log.w("unknown perk " + perkID);
					return;
			}
			logComponent.addMessage(LogConstants.MSG_ID_REMOVE_HAZARD_PERK, msg);
		},
		
		getHazardPerksForSector: function (featuresComponent, statusComponent, itemsComponent) {
			var hazards = GameGlobals.sectorHelper.getEffectiveHazards(featuresComponent, statusComponent);
			let result = [];
			if (hazards.radiation > itemsComponent.getCurrentBonus(ItemConstants.itemBonusTypes.res_radiation))
				result.push(PerkConstants.perkIds.hazardRadiation);
			if (hazards.poison > itemsComponent.getCurrentBonus(ItemConstants.itemBonusTypes.res_poison))
				result.push(PerkConstants.perkIds.hazardPoison);
			if (hazards.cold > itemsComponent.getCurrentBonus(ItemConstants.itemBonusTypes.res_cold))
				result.push(PerkConstants.perkIds.hazardCold);
			return result;
		},
		
		isResting: function () {
			var busyComponent = this.playerNodes.head.entity.get(PlayerActionComponent);
			return busyComponent && busyComponent.getLastActionName() == "use_in_home";
		},
		
		onGameShown: function () {
			let sys = this;
			// TODO add signal for this - game shown and one freame (systmes like LevelPassagesSystem have had time to update)
			this.engine.updateComplete.addOnce(function () {
				sys.updateLocationPerks();
				sys.updateHazardPerks();
			});
		},
		
		onPlayerMoved: function () {
			this.updateLocationPerks();
			this.updateHazardPerks();
		},
		
		onEquipmentChanged: function () {
			this.updateHazardPerks();
		},
		
		onImprovementBuilt: function () {
			this.updateHazardPerks();
			this.updateLocationPerks();
		},
		
		
	});
	
	return PerkSystem;
});
