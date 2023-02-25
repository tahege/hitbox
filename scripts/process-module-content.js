const { readDbAsMap, writeMapAsDb, getUltimateAssetsMap, copyModuleFile, Constants } = require("./process-utils");
const processRollTables = require("./process-roll-tables");
const processMonsters = require("./process-monsters");


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
            feat.img = await UltimateAssets.packAssetIcon(feat.img.split("/").pop());
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
        if (item.data && item.data.description.value.includes(Constants.DSCRYB_FLAG)) return skipItems.add(item);
        if (item.system && item.system.description.value.includes(Constants.DSCRYB_FLAG)) return skipItems.add(item);
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
            if (item.data) item.data.description.value += `${Constants.DSCRYB_FLAG}<blockquote>${primary}</blockquote>`;
            if (item.system) item.system.description.value += `${Constants.DSCRYB_FLAG}<blockquote>${primary}</blockquote>`;
            usedItemDescriptors.add(normName);
        }
    }
    const addItemSecret = (item, title, copy) => {
        const secretCount = (itemSecrets.get(item) || 0) + 1;
        itemSecrets.set(item, secretCount);
        const secretId = item._id.substr(0, 14) + String(secretCount).padStart(2, "0");
        if (item.data) item.data.description.value += `${Constants.DSCRYB_FLAG}<section id="secret-${secretId}" class="secret revealed"><strong>${title}</strong><em>${copy}</em></section>`;
        if (item.system) item.system.description.value += `${Constants.DSCRYB_FLAG}<section id="secret-${secretId}" class="secret revealed"><strong>${title}</strong><em>${copy}</em></section>`;
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
        if (spell.data && spell.data.description.value.includes(Constants.DSCRYB_FLAG)) return skipSpells.add(spell);
        if (spell.system && spell.system.description.value.includes(Constants.DSCRYB_FLAG)) return skipSpells.add(spell);
        const normName = spell.name.toLowerCase();
        const primary = getSpellDescriptor(normName);
        if (spell.data) spell.data.description.value = spell.data.description.value.replace("<em>Token artwork by Forgotten Adventures.</em>", "").replace("Content licensed under the @Compendium[koboldpressogl.koboldpressmonsters.KPOGL]{Open Game License}", "").trim();
        if (spell.system) spell.system.description.value = spell.system.description.value.replace("<em>Token artwork by Forgotten Adventures.</em>", "").replace("Content licensed under the @Compendium[koboldpressogl.koboldpressmonsters.KPOGL]{Open Game License}", "").trim();
        if (primary) {
            if (spell.data) spell.data.description.value += `${Constants.DSCRYB_FLAG}<blockquote>${primary}</blockquote>`;
            if (spell.system) spell.system.description.value += `${Constants.DSCRYB_FLAG}<blockquote>${primary}</blockquote>`;
            usedSpellDescriptors.add(normName);
        }
    }
    const addSpellSecret = (spell, title, copy) => {
        const secretCount = (spellSecrets.get(spell) || 0) + 1;
        spellSecrets.set(spell, secretCount);
        const secretId = spell._id.substr(0, 14) + String(secretCount).padStart(2, "0");
        if (spell.data) spell.data.description.value += `${Constants.DSCRYB_FLAG}<section id="secret-${secretId}" class="secret revealed"><strong>${title}</strong><em>${copy}</em></section>`;
        if (spell.system) spell.system.description.value += `${Constants.DSCRYB_FLAG}<section id="secret-${secretId}" class="secret revealed"><strong>${title}</strong><em>${copy}</em></section>`;
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
    const [processedKpMonsters, processedWotcMonsters] = await processMonsters(
        { kpMonsters, wotcMonsters },
        {
            possibleMonsterDescriptors: { ...dMonsters, ...dActions, ...dCharacters, ...dNature, ...dItems },
            UltimateAssets
        }
    );
    writeMapAsDb(processedKpMonsters);
    writeMapAsDb(processedWotcMonsters);

    // Monster Roll Tables
    const [kpMobTables, wotcMobTables, combinedMobTables] = processRollTables(processedKpMonsters, processedWotcMonsters);
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