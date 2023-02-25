const SRD = "SRD";
const KP = "KP";

module.exports = function processRollTables(kpMonsters, wotcMonsters) {
    let allCreatures = {};

    Object.values(kpMonsters)
        .forEach(monster => {
            allCreatures[monster.name] = monster;
            monster.source = KP;
        });
        

    Object.values(wotcMonsters)
        .forEach(monster => {
            allCreatures[monster.name] = monster;
            monster.source = SRD;
        });

    let byCr = {};

    Object.values(allCreatures)
        .forEach(creature => {
            const { cr } = (creature?.data?.details || creature?.system?.details);
            if (byCr[cr] === undefined) {
                byCr[cr] = [];
            }
            byCr[cr].push(creature);
        });


    let kpTables = [], srdTables = [], combinedTables = [];

    Object.entries(byCr)
        .forEach(([cr, creatures]) => {
            creatures.sort((a, b) => a.name.localeCompare(b.name));
            const normCRDisplay = String(cr).padStart(2, 0);
            const normCRLonger = String(cr).padStart(5, 0);
            const kpTable = {
                _id: `KBLcr${normCRLonger}mobs`,
                name: `KP Monsters: CR ${normCRDisplay}`,
                img: "icons/svg/d20-grey.svg",
                description: `Kobold Press OGL Monsters CR ${cr}`,
                results: [],
                replacement: true,
                displayRoll: true,
                folder: null,
                sort: 0,
                ownership: { default: 0 },
                flags: {},
                _stats: {
                    systemId: "dnd5e",
                    systemVersion: "2.0.2",
                    coreVersion: "10.285",
                    createdTime: 1664056856181,
                    modifiedTime: 1664056897740,
                    lastModifiedBy: "SzDXZz2XHRTXHG7s",
                    cr
                }
            };
            const srdTable = {
                _id: `SRDcr${normCRLonger}mobs`,
                name: `SRD Monsters: CR ${normCRDisplay}`,
                img: "icons/svg/d20-grey.svg",
                description: `SRD Monsters CR ${cr}`,
                results: [],
                replacement: true,
                displayRoll: true,
                folder: null,
                sort: 0,
                ownership: { default: 0 },
                flags: {},
                _stats: {
                    systemId: "dnd5e",
                    systemVersion: "2.0.2",
                    coreVersion: "10.285",
                    createdTime: 1664056856181,
                    modifiedTime: 1664056897740,
                    lastModifiedBy: "SzDXZz2XHRTXHG7s",
                    cr
                }
            };
            const combined = {
                _id: `COMcr${normCRLonger}mobs`,
                name: `Combined Monsters: CR ${normCRDisplay}`,
                img: "icons/svg/d20-grey.svg",
                description: `Combined Monsters CR ${cr}`,
                results: [],
                replacement: true,
                displayRoll: true,
                folder: null,
                sort: 0,
                ownership: { default: 0 },
                flags: {},
                _stats: {
                    systemId: "dnd5e",
                    systemVersion: "2.0.2",
                    coreVersion: "10.285",
                    createdTime: 1664056856181,
                    modifiedTime: 1664056897740,
                    lastModifiedBy: "SzDXZz2XHRTXHG7s",
                    cr
                }
            };
            creatures.map((creature, index) => {
                let base = {
                    "type": 2,
                    "weight": 1,
                    "drawn": false,
                    "text": creature.name,
                    "img": creature.img,
                    "documentId": creature._id,
                    "flags": {}
                };
                if (creature.source === SRD) {
                    base.documentCollection = "dnd5e.monsters";
                    base.range = [srdTable.results.length + 1, srdTable.results.length + 1];
                    base._id = `SRCR${normCRLonger}${creature._id.substr(0, 7)}`;
                    srdTable.results.push(base);
                }
                if (creature.source === KP) {
                    base.documentCollection = "koboldpressogl.koboldpressmonsters";
                    base.range = [kpTable.results.length + 1, kpTable.results.length + 1];
                    base._id = `KPCR${normCRLonger}${creature._id.substr(0, 7)}`;
                    kpTable.results.push(base);
                }
                base = { ...base };
                base.range = [combined.results.length + 1, combined.results.length + 1];
                combined.results.push(base);
            });
            kpTable.formula = `d${kpTable.results.length}`;
            srdTable.formula = `d${srdTable.results.length}`;
            combined.formula = `d${combined.results.length}`;
            kpTables.push(kpTable);
            srdTables.push(srdTable);
            combinedTables.push(combined);
        });
    return [kpTables, srdTables, combinedTables];
}