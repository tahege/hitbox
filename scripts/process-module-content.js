const { readDbAsMap, writeMapAsDb, Constants, getUltimateAssetsMap, assetExists, copyModuleFile } = require("./process-utils");
const processRollTables = require("./process-roll-tables");

const DSCRYB_FLAG = "<!---dscryb--->";

// Loading Zone
const wotcFeats = readDbAsMap("wotc-feats");
const kpMonsters = readDbAsMap("kp-monsters");
const wotcMonsters = readDbAsMap("wotc-monsters");
const kpSpells = readDbAsMap("kp-spells");
const wotcSpells = readDbAsMap("wotc-spells");
const wotcItems = readDbAsMap("wotc-items");
const dActions = readDbAsMap("dscryb-actions");
const dCharacters = readDbAsMap("dscryb-characters");
const dItems = readDbAsMap("dscryb-items");
const dMonsters = readDbAsMap("dscryb-monsters");
const dNature = readDbAsMap("dscryb-nature");
const dSpells = readDbAsMap("dscryb-spells");
const dByTags = readDbAsMap("dscryb-by-tags");
// Just for copying
const dAfflictions = readDbAsMap("dscryb-afflictions");
const dCartographer = readDbAsMap("dscryb-cartographer");
const dEnchanterAcademy = readDbAsMap("dscryb-enchanter-academy");
const dDialogue = readDbAsMap("dscryb-dialogue");
const dEvents = readDbAsMap("dscryb-events");
const dPlaces = readDbAsMap("dscryb-places");
const dPlanes = readDbAsMap("dscryb-planes");
const dTraps = readDbAsMap("dscryb-traps");
const dVehicles = readDbAsMap("dscryb-vehicles");
const wotcClasses = readDbAsMap("wotc-classes");
const wotcClassfeatures = readDbAsMap("wotc-classfeatures");
const wotcRaces = readDbAsMap("wotc-races");
const wotcSubclasses = readDbAsMap("wotc-subclasses");

const UltimateAssets = getUltimateAssetsMap();

async function run() {
    // Module file
    copyModuleFile();
    // Make Copy
    writeMapAsDb(dActions);
    writeMapAsDb(dByTags);
    writeMapAsDb(dAfflictions);
    writeMapAsDb(dCartographer);
    writeMapAsDb(dCharacters);
    writeMapAsDb(dDialogue);
    writeMapAsDb(dEnchanterAcademy);
    writeMapAsDb(dEvents);
    writeMapAsDb(dItems);
    writeMapAsDb(dPlaces);
    writeMapAsDb(dPlanes);
    writeMapAsDb(dMonsters);
    writeMapAsDb(dNature);
    writeMapAsDb(dSpells);
    writeMapAsDb(dTraps);
    writeMapAsDb(dVehicles);
    writeMapAsDb(wotcClasses);
    writeMapAsDb(wotcClassfeatures);
    writeMapAsDb(wotcRaces);
    writeMapAsDb(wotcSubclasses);
    // Feats
    console.log("Processing feats...");
    for (let feat of Object.values(wotcFeats)) {
        if (!feat.img.startsWith("icons")) {
            const img = feat.img.split("/").pop();
            feat.img = `${Constants.ICONS_ROOT}/${img}`;
            await UltimateAssets.packAssetIcon(img);
        }
    }
    writeMapAsDb(wotcFeats);

    // Items
    console.log("Processing items...");
    let usedItemDescriptors = new Set(), 
        itemSecrets = new WeakMap(),
        possibleItemDescriptors = { ...dItems, ...dActions },
        skipItems = new Set();
    const getItemDescriptor = name => possibleItemDescriptors[name]?.pages.find(({ name, type }) => name === "Text" || type === "text")?.text.content;
    function dscrybItemPrimary(item) {
        if (item.data && item.data.description.value.includes(DSCRYB_FLAG)) return skipItems.add(item);
        if (item.system && item.system.description.value.includes(DSCRYB_FLAG)) return skipItems.add(item);
        let normName = item.name.toLowerCase();
        if (normName.startsWith("adamantine")) {
            normName = "adamantine armor";
        } else if (normName.startsWith("mithral")) {
            normName = "mithral armor";
        }
        const primary = getItemDescriptor(normName);
        if (item.data) item.data.description.value = item.data.description.value.replace("<em>Token artwork by Forgotten Adventures.</em>", "").replace("Content licensed under the @Compendium[koboldpressogl.koboldpressmonsters.KPOGL]{Open Game License}", "").trim();
        if (item.system) item.system.description.value = item.system.description.value.replace("<em>Token artwork by Forgotten Adventures.</em>", "").replace("Content licensed under the @Compendium[koboldpressogl.koboldpressmonsters.KPOGL]{Open Game License}", "").trim();
        if (primary) {
            // console.log(`adding item primary to ${item.name}`);
            if (item.data) item.data.description.value += `${DSCRYB_FLAG}<blockquote>${primary}</blockquote>`;
            if (item.system) item.system.description.value += `${DSCRYB_FLAG}<blockquote>${primary}</blockquote>`;
            usedItemDescriptors.add(normName);
        }
    }
    const addItemSecret = (item, title, copy) => {
        // console.log(`adding item secret to ${item.name}`);
        const secretCount = (itemSecrets.get(item) || 0) + 1;
        itemSecrets.set(item, secretCount);
        const secretId = item._id.substr(0, 14) + String(secretCount).padStart(2, "0");
        if (item.data) item.data.description.value += `${DSCRYB_FLAG}<section id="secret-${secretId}" class="secret revealed"><strong>${title}</strong><em>${copy}</em></section>`;
        if (item.system) item.system.description.value += `${DSCRYB_FLAG}<section id="secret-${secretId}" class="secret revealed"><strong>${title}</strong><em>${copy}</em></section>`;
    };
    function dscrybItemSecondary(item) {
        if (skipItems.has(item)) return;
        const normName = item.name.toLowerCase();
        const noAgeName = normName.replace(/(adult|young|ancient|wyrmling)/g, "").trim();
        const ignoreActions = ["cast", "manifest", "maximum", "bloody", "destructive", "burning", "warlock", "loot", "sundries", "clockwork"];
        const ignoreItems = ["shield", "sword", "greatsword", "shortsword", "staff", "quarterstaff", "dagger", "warhammer", "battleaxe", "greataxe", "handaxe", "club", "javelin", "light hammer", "mace", "sickle", "spear", "crossbow", "dart", "sling", "flail", "glaive", "halbert", "lance", "longsword", "maul", "morningstar", "pike", "rapier", "scimitar", "whip", "trident", "war pick", "blowgun", "longbow", "shortbow", "net", "arrow", "belt", "book", "boots", "gloves", "bracers", "breastplate", "chain mail", "chain shirt", "cloak", "crossbow bolt", "flask", "vial", "half plate armor", "hide armor", "plate armor", "ring mail", "scale mail", "splint armor", "horn", "horseshoes", "lute", "lyre", "orb", "padded armor", "pike", "quiver", "ring", "necklace", "sling bullet", "studded leather armor", "totem", "tome", "wand", "fan"];
        Object.keys(possibleItemDescriptors)
            .forEach(key => {
                if (key.includes(noAgeName) && !usedItemDescriptors.has(key) && !ignoreActions.find(a => key.includes(a)) && !ignoreItems.includes(noAgeName)) {
                    const value = getItemDescriptor(key);
                    addItemSecret(item, possibleItemDescriptors[key].name, value);
                    usedItemDescriptors.add(key);
                }
            });
    }
    Object.values(wotcItems)
        .forEach(item => {
            dscrybItemPrimary(item);
        });
    Object.values(wotcItems)
        .forEach(item => {
            dscrybItemSecondary(item);
        });
    writeMapAsDb(wotcItems);

    // Spells
    console.log("Processing spells...");
    let usedSpellDescriptors = new Set(),
        spellSecrets = new WeakMap(),
        possibleSpellDescriptors = { ...dSpells, ...dActions },
        skipSpells = new Set();
    const getSpellDescriptor = name => possibleSpellDescriptors[name]?.pages.find(({ name, type }) => name === "Text" || type === "text")?.text.content;
    function dscrybSpellPrimary(spell) {
        if (spell.data && spell.data.description.value.includes(DSCRYB_FLAG)) return skipSpells.add(spell);
        if (spell.system && spell.system.description.value.includes(DSCRYB_FLAG)) return skipSpells.add(spell);
        const normName = spell.name.toLowerCase();
        const primary = getSpellDescriptor(normName);
        if (spell.data) spell.data.description.value = spell.data.description.value.replace("<em>Token artwork by Forgotten Adventures.</em>", "").replace("Content licensed under the @Compendium[koboldpressogl.koboldpressmonsters.KPOGL]{Open Game License}", "").trim();
        if (spell.system) spell.system.description.value = spell.system.description.value.replace("<em>Token artwork by Forgotten Adventures.</em>", "").replace("Content licensed under the @Compendium[koboldpressogl.koboldpressmonsters.KPOGL]{Open Game License}", "").trim();
        if (primary) {
            // console.log(`adding spell primary to ${spell.name}`);
            if (spell.data) spell.data.description.value += `${DSCRYB_FLAG}<blockquote>${primary}</blockquote>`;
            if (spell.system) spell.system.description.value += `${DSCRYB_FLAG}<blockquote>${primary}</blockquote>`;
            usedSpellDescriptors.add(normName);
        }
    }
    const addSpellSecret = (spell, title, copy) => {
        // console.log(`adding spell secret to ${spell.name}`);
        const secretCount = (spellSecrets.get(spell) || 0) + 1;
        spellSecrets.set(spell, secretCount);
        const secretId = spell._id.substr(0, 14) + String(secretCount).padStart(2, "0");
        if (spell.data) spell.data.description.value += `${DSCRYB_FLAG}<section id="secret-${secretId}" class="secret revealed"><strong>${title}</strong><em>${copy}</em></section>`;
        if (spell.system) spell.system.description.value += `${DSCRYB_FLAG}<section id="secret-${secretId}" class="secret revealed"><strong>${title}</strong><em>${copy}</em></section>`;
    };
    function dscrybSpellSecondary(spell) {
        if (skipSpells.has(spell)) return;
        const normName = spell.name.toLowerCase();
        const noAgeName = normName.replace(/(adult|young|ancient|wyrmling)/g, "").trim();
        const onlyActions = ["cast", "manifest", "maximum", "bloody", "destructive", "burning"];
        Object.keys(possibleSpellDescriptors)
            .forEach(key => {
                if (key.includes(noAgeName) && !usedSpellDescriptors.has(key) && (onlyActions.find(a => key.includes(a)) || key.startsWith(noAgeName))) {
                    if (noAgeName === "shield" && (key.includes("shield of faith") || key.includes("fire shield"))) return;
                    if (noAgeName === "harm" && !key.includes(" harm")) return;
                    const value = getSpellDescriptor(key);
                    addSpellSecret(spell, possibleSpellDescriptors[key].name, value);
                    usedSpellDescriptors.add(key);
                }
            });
    }
    Object.values(kpSpells)
        .forEach(spell => {
            dscrybSpellPrimary(spell);
        });
    Object.values(wotcSpells)
        .forEach(spell => {
            dscrybSpellPrimary(spell);
        });
    Object.values(kpSpells)
        .forEach(spell => {
            dscrybSpellSecondary(spell);
        });
    Object.values(wotcSpells)
        .forEach(spell => {
            dscrybSpellSecondary(spell);
        });
    writeMapAsDb(kpSpells);
    writeMapAsDb(wotcSpells);

    // Monsters
    console.log("Processing monsters...");
    let usedMonsterDescriptors = new Set(),
        monsterSecrets = new WeakMap(),
        possibleMonsterDescriptors = { ...dMonsters, ...dActions, ...dCharacters, ...dNature, ...dItems },
        skipMonsters = new Set();
    const getMonsterDescriptor = name => possibleMonsterDescriptors[name]?.pages.find(({ name, type }) => name === "Text" || type === "text")?.text.content;
    function dscrybMonsterPrimary(mob) {
        if (mob.data && mob.data.details.biography.value.includes(DSCRYB_FLAG)) return skipMonsters.add(mob);
        if (mob.system && mob.system.details.biography.value.includes(DSCRYB_FLAG)) return skipMonsters.add(mob);
        const normName = mob.name.toLowerCase();
        const primary = getMonsterDescriptor(normName);
        if (mob.data) mob.data.details.biography.value = mob.data.details.biography.value.replace("<em>Token artwork by Forgotten Adventures.</em>", "").replace("Content licensed under the @Compendium[koboldpressogl.koboldpressmonsters.KPOGL]{Open Game License}", "").trim();
        if (mob.system) mob.system.details.biography.value = mob.system.details.biography.value.replace("<em>Token artwork by Forgotten Adventures.</em>", "").replace("Content licensed under the @Compendium[koboldpressogl.koboldpressmonsters.KPOGL]{Open Game License}", "").trim();
        if (primary) {
            // console.log(`adding mob primary to ${mob.name}`);
            if (mob.data) mob.data.details.biography.value += `${DSCRYB_FLAG}<blockquote>${primary}</blockquote>`;
            if (mob.system) mob.system.details.biography.value += `${DSCRYB_FLAG}<blockquote>${primary}</blockquote>`;
            usedMonsterDescriptors.add(normName);
        }
    }
    const addMonsterSecret = (mob, title, copy) => {
        // console.log(`adding mob secret to ${mob.name}`);
        const secretCount = (monsterSecrets.get(mob) || 0) + 1;
        monsterSecrets.set(mob, secretCount);
        const secretId = mob._id.substr(0, 14) + String(secretCount).padStart(2, "0");
        if (mob.data) mob.data.details.biography.value += `${DSCRYB_FLAG}<section id="secret-${secretId}" class="secret"><strong>${title}</strong><em>${copy}</em></section>`;
        if (mob.system) mob.system.details.biography.value += `${DSCRYB_FLAG}<section id="secret-${secretId}" class="secret"><strong>${title}</strong><em>${copy}</em></section>`;
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
    writeMapAsDb(kpMonsters);
    writeMapAsDb(wotcMonsters);

    // Monster Roll Tables
    const [kpMobTables, wotcMobTables, combinedMobTables] = processRollTables(kpMonsters, wotcMonsters);
    writeMapAsDb(kpMobTables, "kp-monster-tables");
    writeMapAsDb(wotcMobTables, "wotc-monster-tables");
    writeMapAsDb(combinedMobTables, "combined-monster-tables");

    process.exit(0);
}

try {
    run();
} catch (err) {
    console.error(err);
}