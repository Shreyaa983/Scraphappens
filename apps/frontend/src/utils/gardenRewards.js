export const TREE_VARIANTS = [
	{ type: "plant1", label: "Plant 1", icon: "🌳" },
	{ type: "plant2", label: "Plant 2", icon: "🌲" },
	{ type: "plant3", label: "Plant 3", icon: "🌴" },
	{ type: "plant4", label: "Plant 4", icon: "🌵" },
	{ type: "plant5", label: "Plant 5", icon: "🌿" }
];

const LEGACY_TREES_KEY = "gardenTrees";
const LEGACY_UNLOCKED_KEY = "gardenUnlockedPlants";
const LEGACY_LAST_TYPE_KEY = "gardenLastUnlockedType";

function scopeUserId(userId) {
	return userId || "guest";
}

function safeParse(value, fallback) {
	try {
		return value ? JSON.parse(value) : fallback;
	} catch {
		return fallback;
	}
}

function readStorage(key, fallback) {
	if (typeof localStorage === "undefined") {
		return fallback;
	}

	return safeParse(localStorage.getItem(key), fallback);
}

function writeStorage(key, value) {
	if (typeof localStorage === "undefined") {
		return;
	}

	localStorage.setItem(key, JSON.stringify(value));
}

export function createUniqueId() {
	if (typeof crypto !== "undefined" && crypto.randomUUID) {
		return crypto.randomUUID();
	}

	return `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

export function getRandomVariantNoRepeat(lastType, preferredType) {
	if (preferredType) {
		const preferredVariant = TREE_VARIANTS.find((variant) => variant.type === preferredType);
		if (preferredVariant) {
			return preferredVariant;
		}
	}

	const candidates = TREE_VARIANTS.filter((variant) => variant.type !== lastType);
	const pool = candidates.length > 0 ? candidates : TREE_VARIANTS;
	const randomIndex = Math.floor(Math.random() * pool.length);
	return pool[randomIndex];
}

export function getScopedGardenTreesKey(userId) {
	return `gardenTrees:${scopeUserId(userId)}`;
}

export function getScopedUnlockedPlantsKey(userId) {
	return `gardenUnlockedPlants:${scopeUserId(userId)}`;
}

export function getScopedLastTypeKey(userId) {
	return `gardenLastUnlockedType:${scopeUserId(userId)}`;
}

export function getScopedPendingRewardsKey(userId) {
	return `gardenPendingRewards:${scopeUserId(userId)}`;
}

export function loadStoredPlacedTrees(userId) {
	const scopedTrees = readStorage(getScopedGardenTreesKey(userId), null);
	if (scopedTrees) {
		return scopedTrees;
	}

	return readStorage(LEGACY_TREES_KEY, []);
}

export function loadStoredUnlockedPlants(userId) {
	const scopedPlants = readStorage(getScopedUnlockedPlantsKey(userId), null);
	if (scopedPlants) {
		return scopedPlants;
	}

	return readStorage(LEGACY_UNLOCKED_KEY, []);
}

export function loadLastUnlockedType(userId) {
	if (typeof localStorage === "undefined") {
		return null;
	}

	return localStorage.getItem(getScopedLastTypeKey(userId)) || localStorage.getItem(LEGACY_LAST_TYPE_KEY) || null;
}

export function persistPlacedTrees(userId, trees) {
	writeStorage(getScopedGardenTreesKey(userId), trees);
}

export function persistUnlockedPlants(userId, plants) {
	writeStorage(getScopedUnlockedPlantsKey(userId), plants);
}

export function persistLastUnlockedType(userId, lastType) {
	if (typeof localStorage === "undefined") {
		return;
	}

	if (!lastType) {
		localStorage.removeItem(getScopedLastTypeKey(userId));
		return;
	}

	localStorage.setItem(getScopedLastTypeKey(userId), lastType);
}

export function queuePendingGardenReward(userId, reward) {
	if (!reward) {
		return;
	}

	const key = getScopedPendingRewardsKey(userId);
	const existingRewards = readStorage(key, []);
	writeStorage(key, [...existingRewards, reward]);
}

export function consumePendingGardenRewards(userId) {
	const key = getScopedPendingRewardsKey(userId);
	const rewards = readStorage(key, []);
	writeStorage(key, []);
	return rewards;
}

export function createPlantFromAchievement(achievement, lastUnlockedType) {
	const reward = achievement?.reward || {};
	const preferredTreeType = reward.randomize ? undefined : reward.treeType;
	const variant = getRandomVariantNoRepeat(lastUnlockedType, preferredTreeType);

	return {
		id: createUniqueId(),
		type: variant.type,
		label: reward.plantLabel || "Circular Sapling",
		icon: reward.icon || variant.icon || "🌱",
		achievementId: achievement?.id || createUniqueId(),
		achievement: achievement?.name || achievement?.title || "Achievement Unlocked",
		achievementDetails: achievement,
		sourceOrderId: achievement?.orderId || null,
		isNew: true,
		isAchievementPlant: true,
		badgeText: reward.badgeText || "NEW"
	};
}

export function createListingAchievementReward(lastUnlockedType) {
	const variant = getRandomVariantNoRepeat(lastUnlockedType);

	return {
		plant: {
			id: createUniqueId(),
			type: variant.type,
			label: variant.label,
			icon: variant.icon,
			achievementId: `listing_${Date.now()}`,
			achievement: "First Scrap Listed",
			achievementDetails: {
				id: `listing_${Date.now()}`,
				name: "First Scrap Listed",
				description: "You turned leftover inventory into circular value.",
				materialSummary: "Marketplace listing",
				impact: {
					label: "Circular contribution",
					value: "1",
					unit: "listing",
					display: "Listing created"
				},
				reward: {
					plantLabel: variant.label,
					treeType: variant.type,
					icon: variant.icon,
					badgeText: "NEW"
				}
			},
			isNew: true,
			isAchievementPlant: true,
			badgeText: "NEW"
		},
		popup: {
			name: "First Scrap Listed",
			reward: variant.label,
			icon: variant.icon,
			description: "You turned leftover inventory into circular value."
		},
		nextLastType: variant.type
	};
}
