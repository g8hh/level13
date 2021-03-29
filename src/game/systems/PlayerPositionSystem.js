// A system that saves the player's current location (level&sector) based on their PositionComponent
// and handles updating sector components related to the player's position
define([
	'ash',
	'game/GameGlobals',
	'game/GlobalSignals',
	'game/constants/GameConstants',
	'game/constants/LevelConstants',
	'game/constants/LogConstants',
	'game/nodes/PlayerPositionNode',
	'game/nodes/level/LevelNode',
	'game/nodes/PlayerLocationNode',
	'game/nodes/sector/SectorNode',
	'game/nodes/sector/CampNode',
	'game/components/common/CurrentPlayerLocationComponent',
	'game/components/sector/CurrentNearestCampComponent',
	'game/components/sector/PassagesComponent',
	'game/components/common/LogMessagesComponent',
	'game/components/common/PositionComponent',
	'game/components/common/VisitedComponent',
	'game/components/common/RevealedComponent',
	'game/components/common/CampComponent',
	'game/components/type/LevelComponent',
], function (Ash, GameGlobals, GlobalSignals, GameConstants, LevelConstants, LogConstants,
	PlayerPositionNode, LevelNode, PlayerLocationNode, SectorNode, CampNode,
	CurrentPlayerLocationComponent, CurrentNearestCampComponent, PassagesComponent,
	LogMessagesComponent, PositionComponent,
	VisitedComponent, RevealedComponent, CampComponent, LevelComponent) {

	var PlayerPositionSystem = Ash.System.extend({

		sectorNodes: null,
		levelNodes: null,
		playerPositionNodes: null,
		playerLocationNodes: null,
		campNodes: null,

		lastUpdatePosition: null,

		constructor: function () { },

		addToEngine: function (engine) {
			this.sectorNodes = engine.getNodeList(SectorNode);
			this.levelNodes = engine.getNodeList(LevelNode);
			this.playerPositionNodes = engine.getNodeList(PlayerPositionNode);
			this.playerLocationNodes = engine.getNodeList(PlayerLocationNode);
			this.campNodes = engine.getNodeList(CampNode);

			var sys = this;
			this.playerPositionNodes.nodeAdded.addOnce(function(node) {
				sys.lastUpdatePosition = null;
			});
			this.campNodes.nodeAdded.addOnce(function (node) {
				sys.lastUpdatePosition = null;
			});
			this.playerLocationNodes.nodeAdded.addOnce(function (node) {
				sys.handleNewSector(node.entity, false);
			});

			GlobalSignals.add(this, GlobalSignals.gameStartedSignal, this.onGameStarted);
			GlobalSignals.add(this, GlobalSignals.gameResetSignal, this.onGameStarted);
			GlobalSignals.add(this, GlobalSignals.tabChangedSignal, this.ontabChanged);
			GlobalSignals.add(this, GlobalSignals.campBuiltSignal, this.updateCamps);
			GlobalSignals.add(this, GlobalSignals.sectorScoutedSignal, this.onSectorScouted);
		},

		removeFromEngine: function (engine) {
			this.sectorNodes = null;
			this.levelNodes = null;
			this.playerPositionNodes = null;
			this.playerLocationNodes = null;

			GlobalSignals.removeAll(this);
		},

		onGameStarted: function () {
			this.lastUpdatePosition = null;
			this.lastValidPosition = null;
		},

		ontabChanged: function () {
			this.lastUpdatePosition = null;
			this.lastValidPosition = null;
		},
		
		onSectorScouted: function () {
			this.triggerEndMessage();
		},

		update: function (time) {
			var playerPos = this.playerPositionNodes.head.position;
			if (!this.lastValidPosition || !this.lastValidPosition.equals(playerPos)) {
				this.updateEntities(!this.lastUpdatePosition);
			}
		},

		updateEntities: function (updateAll) {
			var playerPos = this.playerPositionNodes.head.position;
			var playerSector = GameGlobals.levelHelper.getSectorByPosition(playerPos.level, playerPos.sectorX, playerPos.sectorY);
			
			if (playerSector) {
				this.updateLevelEntities(updateAll);
				this.updateSectors(updateAll);
				this.updateCamps();
				this.lastValidPosition = playerPos.clone();
			} else {
				this.handleInvalidPosition();
			}
			this.lastUpdatePosition = playerPos.clone();
		},

		updateLevelEntities: function (updateAll) {
			var isInitLocation = this.playerLocationNodes.head == null;
			var playerPos = this.playerPositionNodes.head.position;
			var startPos = playerPos.getPosition();
			var levelpos;
			for (var levelNode = this.levelNodes.head; levelNode; levelNode = levelNode.next) {
				levelpos = levelNode.level.position;
				if (levelpos == playerPos.level && !levelNode.entity.has(CurrentPlayerLocationComponent)) {
					levelNode.entity.add(new CurrentPlayerLocationComponent());
					if (!levelNode.entity.has(VisitedComponent)) {
						this.handleNewLevel(levelNode, levelpos, isInitLocation);
					}
					this.handleEnterLevel(levelNode, levelpos, isInitLocation);
				} else if (levelpos != playerPos.level && levelNode.entity.has(CurrentPlayerLocationComponent)) {
					levelNode.entity.remove(CurrentPlayerLocationComponent);
				}
			}
		},

		updateSectors: function (updateAll) {
			var playerPos = this.playerPositionNodes.head.position;
			var playerSector = GameGlobals.levelHelper.getSectorByPosition(playerPos.level, playerPos.sectorX, playerPos.sectorY);
			updateAll = updateAll && this.lastUpdatePosition;

			if (updateAll) {
				for (var sectorNode = this.sectorNodes.head; sectorNode; sectorNode = sectorNode.next) {
					this.updateSector(sectorNode.entity);
				}
			} else {
				if (this.lastUpdatePosition) {
					var previousPlayerSector = GameGlobals.levelHelper.getSectorByPosition(this.lastUpdatePosition.level, this.lastUpdatePosition.sectorX, this.lastUpdatePosition.sectorY);
					this.updateSector(previousPlayerSector);
				}
				this.updateSector(playerSector);
			}
		},

		updateSector: function (sector) {
			if (!sector) return;
			var playerPos = this.playerPositionNodes.head.position;
			if (!playerPos) return;
			var levelpos = sector.get(PositionComponent).level;
			var sectorPos = sector.get(PositionComponent).sectorId();
			var hasLocationComponent = sector.has(CurrentPlayerLocationComponent);

			if (levelpos === playerPos.level && sectorPos === playerPos.sectorId() && !hasLocationComponent) {
				if (this.playerLocationNodes.head)
					this.playerLocationNodes.head.entity.remove(CurrentPlayerLocationComponent);
				sector.add(new CurrentPlayerLocationComponent());
				if (!sector.has(VisitedComponent)) {
					this.handleNewSector(sector, true);
				}
				GlobalSignals.playerMovedSignal.dispatch(playerPos);
				GameGlobals.uiFunctions.onPlayerMoved();
			} else if ((levelpos !== playerPos.level || sectorPos !== playerPos.sectorId()) && hasLocationComponent) {
				sector.remove(CurrentPlayerLocationComponent);
			}
		},

		updateCamps: function () {
			var playerPos = this.playerPositionNodes.head.position;
			var levelpos;
			var hasCurrentCampComponent;
			for (var campNode = this.campNodes.head; campNode; campNode = campNode.next) {
				hasCurrentCampComponent = campNode.entity.has(CurrentNearestCampComponent);
				levelpos = campNode.entity.get(PositionComponent).level;
				if (levelpos === playerPos.level && !hasCurrentCampComponent) {
					campNode.entity.add(new CurrentNearestCampComponent());
				} else if (levelpos !== playerPos.level && hasCurrentCampComponent) {
					campNode.entity.remove(CurrentNearestCampComponent);
				}
			}
		},

		handleNewLevel: function (levelNode, levelPos) {
			levelNode.entity.add(new VisitedComponent());
			levelNode.entity.add(new RevealedComponent());
			var levelOrdinal = GameGlobals.gameState.getLevelOrdinal(levelPos);
			var campOrdinal = GameGlobals.gameState.getCampOrdinal(levelPos);
			GameGlobals.gameState.level = Math.max(GameGlobals.gameState.level, levelOrdinal);
			gtag('set', { 'max_level': levelOrdinal });
			gtag('event', 'reach_new_level', { event_category: 'progression', value: levelOrdinal});
			gtag('event', 'reach_new_level_time', { event_category: 'game_time', event_label: levelOrdinal, value: GameGlobals.gameState.playTime });
			if (levelPos !== 13) GameGlobals.gameState.unlockedFeatures.levels = true;
		},

		handleEnterLevel: function (levelNode, levelPos, isInitLocation) {
			if (isInitLocation) return;
			
			var levelEntity = levelNode.entity;
			var levelComponent = levelEntity.get(LevelComponent);
			var level = levelPos.level;
			
			var surfaceLevel = GameGlobals.gameState.getSurfaceLevel();
			var groundLevel = GameGlobals.gameState.getGroundLevel();
			
			var msg = "Entered level " + levelPos + ". ";
			if (levelPos == surfaceLevel) {
				msg += "There is no ceiling here, the whole level is open to the elements. Sun glares down from an impossibly wide blue sky all above.";
			} else if (levelPos == groundLevel) {
				msg += "The floor here is different - uneven, organic, continuous. There seems to be no way further down. There are more plants, mud, stone and signs of animal life.";
			} else if (!levelComponent.isCampable) {
				switch (levelComponent.notCampableReason) {
					case LevelConstants.UNCAMPABLE_LEVEL_TYPE_RADIATION:
						msg += "You notice several graffiti warning about radiation.";
						break;
					case LevelConstants.UNCAMPABLE_LEVEL_TYPE_POLLUTION:
						msg += "There are signs of significant pollution.";
						break;
					default:
						msg += "This area seems eerily devoid of any signs of recent human activity.";
						break;
				}
			}
			this.addLogMessage(LogConstants.MSG_ID_ENTER_LEVEL, msg);
		},

		handleNewSector: function (sectorEntity, isNew) {
			sectorEntity.add(new VisitedComponent());
			sectorEntity.add(new RevealedComponent());

			var sectorPos = sectorEntity.get(PositionComponent);

			var neighbours = GameGlobals.levelHelper.getSectorNeighboursMap(sectorEntity);
			for (var direction in neighbours) {
				var revealedNeighbour = neighbours[direction];
				if (revealedNeighbour && !revealedNeighbour.has(RevealedComponent)) {
					revealedNeighbour.add(new RevealedComponent());
				}
			}

			if (isNew) {
				GameGlobals.gameState.numVisitedSectors++;
				GameGlobals.gameState.unlockedFeatures.sectors = true;
			}
		},

		handleInvalidPosition: function () {
			var playerPos = this.playerPositionNodes.head.position;
			log.w("Player location could not be found (" + playerPos.level + "." + playerPos.sectorId() + ").");
			if (this.lastValidPosition) {
				log.w("Moving to a known valid position " + this.lastValidPosition);
				playerPos.level = this.lastValidPosition.level;
				playerPos.sectorX = this.lastValidPosition.sectorX;
				playerPos.sectorY = this.lastValidPosition.sectorY;
				playerPos.inCamp = this.lastValidPosition.inCamp;
			} else {
				var sectors = GameGlobals.levelHelper.getSectorsByLevel(playerPos.level);
				var newPos = sectors[0].get(PositionComponent);
				log.w("Moving to random position " + newPos);
				playerPos.level = newPos.level;
				playerPos.sectorX = newPos.sectorX;
				playerPos.sectorY = newPos.sectorY;
				playerPos.inCamp = false;
			}
			this.lastUpdatePosition = null;
		},
		
		triggerEndMessage: function () {
			var playerPos = this.playerPositionNodes.head.position;
			var isLastAvailableLevel = this.isLastAvailableLevel(playerPos.level);
			var sector = this.playerLocationNodes.head.entity;
			var passages = sector.get(PassagesComponent);
			if (isLastAvailableLevel && passages.passageUp) {
				this.showEndMessage();
			}
		},
		
		showEndMessage: function () {
			setTimeout(function () {
				gtag('event', 'level_14_passage_up_reached', { event_category: 'progression' })
				var msg = "You've reached the end of the current version of Level 13. ";
				msg += "You can continue exploring this level, but it will not be possible to repair the passage up yet. Congrats on surviving to the end!";
				msg += "<br/><br/>"
				msg += "<span class='p-meta'>Thank you for playing this far. The developer would love to hear your feedback. You can use any of these channels:</span>";
				msg += "<p>" + GameConstants.getFeedbackLinksHTML() + "</p>";
				GameGlobals.uiFunctions.showInfoPopup(
					"The end",
					msg,
					"Continue"
				);
			}, 300);
		},

		isLastAvailableLevel: function (level) {
			var levelOrdinal = GameGlobals.gameState.getLevelOrdinal(level);
			var nextLevel = GameGlobals.gameState.getLevelForOrdinal(levelOrdinal + 1);
			var nextLevelEntity = GameGlobals.levelHelper.getLevelEntityForPosition(nextLevel);
			if (!nextLevelEntity)
				return false;
			
			var levelComponent = GameGlobals.levelHelper.getLevelEntityForPosition(level).get(LevelComponent);
			var nextLevelComponent = nextLevelEntity.get(LevelComponent);
			return levelComponent.notCampableReason != LevelConstants.UNCAMPABLE_LEVEL_TYPE_ORDINAL_LIMIT && nextLevelComponent.notCampableReason == LevelConstants.UNCAMPABLE_LEVEL_TYPE_ORDINAL_LIMIT;
		},

		addLogMessage: function (msgID, msg, replacements, values) {
			var logComponent = this.playerPositionNodes.head.entity.get(LogMessagesComponent);
			logComponent.addMessage(msgID, msg, replacements, values);
		},

	});

	return PlayerPositionSystem;
});
