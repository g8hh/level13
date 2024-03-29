define([
	'ash',
	'game/components/player/VisionComponent',
	'game/components/player/StaminaComponent',
	'game/components/player/RumoursComponent',
	'game/components/player/EvidenceComponent',
	'game/components/player/InsightComponent',
	'game/components/player/PerksComponent',
	'game/components/player/ItemsComponent',
	'game/components/player/FollowersComponent',
], function (Ash, VisionComponent, StaminaComponent, RumoursComponent, EvidenceComponent, InsightComponent, PerksComponent, ItemsComponent, FollowersComponent) {
	var PlayerStatsNode = Ash.Node.create({
		vision : VisionComponent,
		stamina : StaminaComponent,
		rumours : RumoursComponent,
		evidence: EvidenceComponent,
		insight: InsightComponent,
		perks: PerksComponent,
		items: ItemsComponent,
		followers: FollowersComponent
	});

	return PlayerStatsNode;
});
