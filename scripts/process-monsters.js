const { normID, assetExists, Constants } = require('./process-utils');

module.exports = async function processMonsters(
    { kpMonsters, wotcMonsters },
    { possibleMonsterDescriptors = {}, UltimateAssets }
) {
    console.log("Processing monsters...");
    let usedMonsterDescriptors = new Set(),
        monsterSecrets = new WeakMap(),
        skipMonsters = new Set();
    const getMonsterDescriptor = name => possibleMonsterDescriptors[name]?.pages.find(({ name, type }) => name === "Text" || type === "text")?.text.content;
    function dscrybMonsterPrimary(mob) {
        if (mob.data && mob.data.details.biography.value.includes(Constants.DSCRYB_FLAG)) return skipMonsters.add(mob);
        if (mob.system && mob.system.details.biography.value.includes(Constants.DSCRYB_FLAG)) return skipMonsters.add(mob);
        const normName = mob.name.toLowerCase();
        const primary = getMonsterDescriptor(normName);
        if (mob.data) mob.data.details.biography.value = mob.data.details.biography.value.replace("<em>Token artwork by Forgotten Adventures.</em>", "").replace("Content licensed under the @Compendium[koboldpressogl.koboldpressmonsters.KPOGL]{Open Game License}", "").trim();
        if (mob.system) mob.system.details.biography.value = mob.system.details.biography.value.replace("<em>Token artwork by Forgotten Adventures.</em>", "").replace("Content licensed under the @Compendium[koboldpressogl.koboldpressmonsters.KPOGL]{Open Game License}", "").trim();
        if (primary) {
            if (mob.data) mob.data.details.biography.value += `${Constants.DSCRYB_FLAG}<blockquote>${primary}</blockquote>`;
            if (mob.system) mob.system.details.biography.value += `${Constants.DSCRYB_FLAG}<blockquote>${primary}</blockquote>`;
            usedMonsterDescriptors.add(normName);
        }
    }
    const addMonsterSecret = (mob, title, copy) => {
        const secretCount = (monsterSecrets.get(mob) || 0) + 1;
        monsterSecrets.set(mob, secretCount);
        const secretId = mob._id.substr(0, 14) + String(secretCount).padStart(2, "0");
        if (mob.data) mob.data.details.biography.value += `${Constants.DSCRYB_FLAG}<section id="secret-${secretId}" class="secret"><strong>${title}</strong><em>${copy}</em></section>`;
        if (mob.system) mob.system.details.biography.value += `${Constants.DSCRYB_FLAG}<section id="secret-${secretId}" class="secret"><strong>${title}</strong><em>${copy}</em></section>`;
    };
    function dscrybMonsterSecondary(mob) {
        if (skipMonsters.has(mob)) return;
        const normName = mob.name.toLowerCase();
        const noAgeName = normName.replace(/(adult|young|ancient|wyrmling)/g, "").trim();
        Object.keys(possibleMonsterDescriptors)
            .forEach(key => {
                if (key.includes(noAgeName) && !usedMonsterDescriptors.has(key)) {
                    const value = getMonsterDescriptor(key);
                    addMonsterSecret(mob, possibleMonsterDescriptors[key].name, value);
                    usedMonsterDescriptors.add(key);
                }
            });
    }
    function dscrybMonsterTertiary(mob) {
        if (skipMonsters.has(mob)) return;
        const normName = mob.name.toLowerCase();
        const noAgeName = normName.replace(/(adult|young|ancient|wyrmling)/g, "").trim();
        const isDragon = normName.includes("dragon");
        const ignoreDragonDescriptors = ["dragonsong", "faerie dragon", "deep dragon", "invisible dragon", "steel dragon", "prismatic dragon", "house dragon", "dragonfly", "bearded dragon", "dragonborn", "elder brain dragon attack", "construct dragon", "dragon dance", "dragon wings"];
        Object.keys(possibleMonsterDescriptors)
            .forEach(key => {
                if (!usedMonsterDescriptors.has(key) && (key.includes(noAgeName) || (isDragon && key.includes("dragon") && !ignoreDragonDescriptors.find(d => key.includes(d))))) {
                    const value = getMonsterDescriptor(key);
                    addMonsterSecret(mob, possibleMonsterDescriptors[key].name, value);
                }
            });
    }
    let total = 0, foundClose = 0, foundSomething = 0, notFound = 0;
    for (let mob of Object.values(kpMonsters)) {
        mob._id = normID(`KP${mob.name.toLowerCase().replace(/[^0-9a-z]/gi, '')}`);
        dscrybMonsterPrimary(mob);
        const normName = mob.name.toLowerCase();
        const normNameParts = normName.split(/\s+/g);
        let matches = [];
        for (let key of Object.keys(UltimateAssets)) {
            if (key.startsWith("packAsset")) {
                continue;
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
        }
        matches.sort((a, b) => b[0] - a[0]);
        if (matches[0]) {
            mob.img = await UltimateAssets.packAssetToken(matches[0][1]);
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
    }
    console.log(`Total: ${total}, Close Matches: ${foundClose}, Some Match: ${foundSomething}, No Match: ${notFound}`);
    for (let mob of Object.values(wotcMonsters)) {
        mob._id = normID(`SRC${mob.name.toLowerCase().replace(/[^0-9a-z]/gi, '')}`);
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
        if (!assetExists(mob.img)) {
            for (let key of Object.keys(UltimateAssets)) {
                if (key.startsWith("packAsset")) {
                    continue;
                }
                if (mob.img.endsWith(key)) {
                    mob.img = await UltimateAssets.packAssetToken(key);
                    if (mob.token) {
                        mob.token.src = mob.img;
                    }
                    if (mob.prototypeToken) {
                        mob.prototypeToken.texture.src = mob.img;
                    }
                    break;
                }
            }
        }
    }
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
    return [kpMonsters, wotcMonsters];
};