
module.exports = function processMonsters(kpMonsters, wotcMonsters) {
    let usedDescriptors = new Set(), secrets = new WeakMap(), possibleDescriptors = { ...dMonsters, ...dActions, ...dCharacters, ...dNature };
    const getDescriptor = name => possibleDescriptors[name]?.pages.find(({ name, type }) => name === "Text" || type === "text")?.text.content;
    function dscrybMonsterPrimary(mob) {
        const normName = mob.name.toLowerCase();
        const primary = getDescriptor(normName);
        if (mob.data) mob.data.details.biography.value = mob.data.details.biography.value.replace("<em>Token artwork by Forgotten Adventures.</em>", "").replace("Content licensed under the @Compendium[koboldpressogl.koboldpressmonsters.KPOGL]{Open Game License}", "").trim();
        if (mob.system) mob.system.details.biography.value = mob.system.details.biography.value.replace("<em>Token artwork by Forgotten Adventures.</em>", "").replace("Content licensed under the @Compendium[koboldpressogl.koboldpressmonsters.KPOGL]{Open Game License}", "").trim();
        if (primary) {
            if (mob.data) mob.data.details.biography.value += `<blockquote>${primary}</blockquote>`;
            if (mob.system) mob.system.details.biography.value += `<blockquote>${primary}</blockquote>`;
            usedDescriptors.add(normName);
        }
    }
    const addSecret = (mob, title, copy) => {
        const secretCount = (secrets.get(mob) || 0) + 1;
        secrets.set(mob, secretCount);
        const secretId = mob._id.substr(0, 14) + String(secretCount).padStart(2, "0");
        if (mob.data) mob.data.details.biography.value += `<section id="secret-${secretId}" class="secret"><strong>${title}</strong><em>${copy}</em></section>`;
        if (mob.system) mob.system.details.biography.value += `<section id="secret-${secretId}" class="secret"><strong>${title}</strong><em>${copy}</em></section>`;
    };
    function dscrybMonsterSecondary(mob) {
        const normName = mob.name.toLowerCase();
        const noAgeName = normName.replace(/(adult|young|ancient|wyrmling)/g, "").trim();
        Object.keys(possibleDescriptors)
            .forEach(key => {
                if (key.includes(noAgeName) && !usedDescriptors.has(key)) {
                    const value = getDescriptor(key);
                    addSecret(mob, possibleDescriptors[key].name, value);
                    usedDescriptors.add(key);
                }
            });
    }
    function dscrybMonsterTertiary(mob) {
        const normName = mob.name.toLowerCase();
        const noAgeName = normName.replace(/(adult|young|ancient|wyrmling)/g, "").trim();
        const isDragon = normName.includes("dragon");
        const ignoreDragonDescriptors = ["dragonsong", "faerie dragon", "deep dragon", "invisible dragon", "steel dragon", "prismatic dragon", "house dragon", "dragonfly", "bearded dragon", "dragonborn", "elder brain dragon attack", "construct dragon", "dragon dance", "dragon wings"];
        Object.keys(possibleDescriptors)
            .forEach(key => {
                if (!usedDescriptors.has(key) && (key.includes(noAgeName) || (isDragon && key.includes("dragon") && !ignoreDragonDescriptors.find(d => key.includes(d))))) {
                    const value = getDescriptor(key);
                    addSecret(mob, possibleDescriptors[key].name, value);
                }
            });
    }
    let total = 0, foundClose = 0, foundSomething = 0, notFound = 0;
    Object.values(kpMonsters)
        .forEach(mob => {
            dscrybMonsterPrimary(mob);
            const normName = mob.name.toLowerCase();
            const normNameParts = normName.split(/\s+/g);
            let matches = [];
            Object.keys(UltimateAssets)
                .forEach(key => {
                    if (key.startsWith("packAsset")) {
                        return;
                    }
                    let score = 0;
                    let normAssetName = key.toLowerCase();
                    if (normAssetName.includes(normName)) {
                        score = 100;
                    } else {
                        normNameParts.forEach(part => {
                            if (normAssetName.includes(part)) {
                                score += (part.length / normAssetName.length) * 100;
                            }
                            if (["young", "wyrmling"].includes(part)) {
                                if (normAssetName.includes("young")) {
                                    score += 12;
                                } else if (normAssetName.includes("wyrmling")) {
                                    score += 5;
                                }
                            }
                            if (["adult", "ancient"].includes(part) && (normAssetName.includes("adult") || normAssetName.includes("ancient"))) {
                                if (normAssetName.includes("adult")) {
                                    score += 9;
                                } else if (normAssetName.includes("ancient")) {
                                    score += 5;
                                }
                            }
                        });
                    }
                    if (score) {
                        matches.push([score, key]);
                    }
                });
            matches.sort((a, b) => b[0] - a[0]);
            if (matches[0]) {
                mob.img = UltimateAssets.packAssetToken(matches[0][1]);
                if (mob.token) {
                    mob.token.src = mob.img;
                }
                if (mob.prototypeToken) {
                    mob.prototypeToken.texture.src = mob.img;
                }
                if (matches[0][0] > 60) {
                    foundClose++;
                } else {
                    foundSomething++;
                }
            } else {
                notFound++;
            }
            total++;
        });
    Object.values(wotcMonsters)
        .forEach(mob => {
            dscrybMonsterPrimary(mob);
            if (!mob.img.includes("/")) {
                mob.img = `${Constants.TOKENS_ROOT}/${mob.img}`;
                if (mob.token) {
                    mob.token.src = mob.img;
                }
                if (mob.prototypeToken) {
                    mob.prototypeToken.texture.src = mob.img;
                }
            }
        });
    Object.values(kpMonsters)
        .forEach(mob => {
            dscrybMonsterSecondary(mob);
        });
    Object.values(wotcMonsters)
        .forEach(mob => {
            dscrybMonsterSecondary(mob);
        });
    Object.values(kpMonsters)
        .forEach(mob => {
            dscrybMonsterTertiary(mob);
        });
    Object.values(wotcMonsters)
        .forEach(mob => {
            dscrybMonsterTertiary(mob);
        });
    console.log(`Total: ${total}, Close Matches: ${foundClose}, Some Match: ${foundSomething}, No Match: ${notFound}`);
    return [kpMonsters, wotcMonsters];
};