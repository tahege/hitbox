const fs = require("fs");
const path = require("path");

const MODULE_ROOT = "modules/shady-grey-zone";
const PACKS_ROOT = `${MODULE_ROOT}/packs`;
const ASSETS_ROOT = `${MODULE_ROOT}/assets`;
const ICONS_ROOT = `${ASSETS_ROOT}/icons`;
const MAPS_ROOT = `${ASSETS_ROOT}/maps`;
const TOKENS_ROOT = `${ASSETS_ROOT}/tokens`;

const Constants = {
    MODULE_ROOT,
    PACKS_ROOT,
    ASSETS_ROOT,
    ICONS_ROOT,
    MAPS_ROOT,
    TOKENS_ROOT
};

const _nameMap = new WeakMap();
function readDbAsMap(fileName) {
    const filePath = path.resolve(__dirname, '../src/pack-data', fileName.endsWith('.db') ? fileName : fileName + '.db');
    const fileContent = fs.readFileSync(filePath).toString();
    const fileEntries = fileContent.trim().split("\n").map(JSON.parse);
    const result = fileEntries.reduce((prev, curr, idx) => {
        prev[curr.name.toLowerCase()] = curr;
        curr._guid = normID(`sgz${hashCode(fileName)}@${idx}`);
        return prev;
    }, {});
    _nameMap.set(result, fileName);
    return result;
}

function ensureOutputLocation(asWell = "") {
    fs.mkdirSync(path.resolve(__dirname, `../output${asWell}`), { recursive: true });
}

function writeMapAsDb(objMap, fileName) {
    if (!fileName) {
        fileName = _nameMap.get(objMap);
    }
    ensureOutputLocation('/packs');
    const fileContent = Object.values(objMap).map(JSON.stringify).join("\n");
    const filePath = path.resolve(__dirname, '../output/packs', fileName.endsWith('.db') ? fileName : fileName + '.db');
    fs.writeFileSync(filePath, fileContent);
}

function hashCode(str) {
    let hash = 0;
    for (let i = 0, len = str.length; i < len; i++) {
        let chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

function normID(id) {
    return id.padEnd(16, "0").substr(0, 16);
}

function getAssetsMap() {
    let assetsMap = {};
    const assetsPath = path.resolve(__dirname, "assets");
    const categories = fs.readdirSync(assetsPath);
    categories.forEach(category => {
        assetsMap[category] = {};
        const categoryPath = path.resolve(assetsPath, category);
        const assets = fs.readdirSync(categoryPath);
        assets.forEach(asset => {
            assetsMap[category][asset] = `${ASSETS_ROOT}/${category}/${asset}`;
        });
    });
    return assetsMap;
}

function getUltimateAssetsMap() {
    let assetsMap = {};
    const tokenAssetsPath = path.resolve("F:/Dungeons & Dragons/Forgotten Adventures/Tokens/Creatures");
    const iconAssetsPath = path.resolve("F:/Dungeons & Dragons/Forgotten Adventures/Icons");
    const tokenCategories = fs.readdirSync(tokenAssetsPath);
    const icons = fs.readdirSync(iconAssetsPath);
    tokenCategories
        .filter(category => !category.startsWith("."))
        .forEach(category => {
            const categoryPath = path.resolve(tokenAssetsPath, category);
            const assets = fs.readdirSync(categoryPath);
            assets.forEach(asset => {
                const assetPath = path.resolve(tokenAssetsPath, category, asset);
                const assetStats = fs.lstatSync(assetPath);
                if (!assetStats.isDirectory()) {
                    assetsMap[asset] = assetPath;
                } else {
                    fs.readdirSync(assetPath)
                        .forEach(subasset => {
                            console.log(subasset)
                            assetsMap[subasset] = path.resolve(assetPath, subasset);
                        });
                }
            });
        });
    icons
        .filter(asset => !asset.startsWith("."))
        .forEach(asset => {
            const assetPath = path.resolve(iconAssetsPath, asset);
            const assetStats = fs.lstatSync(assetPath);
            if (!assetStats.isDirectory()) {
                Object.defineProperty(assetsMap, asset, { value: assetPath });
            } else {
                fs.readdirSync(assetPath)
                    .forEach(subasset => {
                        Object.defineProperty(assetsMap, subasset, { value: path.resolve(assetPath, subasset) });
                    });
            }
        });
    ensureOutputLocation('/assets/tokens');
    ensureOutputLocation('/assets/icons');
    assetsMap.packAsset = async (asset, type = "Token") => {
        console.log(`Packing ${type.toLowerCase()} asset ${asset}`);
        const { default: imagemin } = await import("imagemin");
        const { default: webp } = await import("imagemin-webp");
        const outputSubdir = assetsMap.packAsset._types[type];
        const destFolder = path.resolve(__dirname, '../output', outputSubdir);
        const files = await imagemin([assetsMap[asset]], {
            destination: destFolder,
            glob: false,
            plugins: [webp()]
        });
        return files[0].destinationPath.replace(destFolder, `modules/shady-grey-zone/${outputSubdir}`);
    };
    assetsMap.packAsset._types = {
        Token: 'assets/tokens',
        Icon: 'assets/icons'
    };
    Object.keys(assetsMap.packAsset._types)
        .forEach(type => assetsMap[`packAsset${type}`] = (asset => assetsMap.packAsset(asset, type)));
    return assetsMap;
}

function assetExists(filePath) {
    return fs.existsSync(path.resolve("../..", filePath));
}

function copyModuleFile() {
    fs.writeFileSync(path.resolve(__dirname, '../output/module.json'), fs.readFileSync(path.resolve(__dirname, '../src/module.json')));
}

module.exports = {
    readDbAsMap,
    writeMapAsDb,
    hashCode,
    normID,
    Constants,
    getAssetsMap,
    getUltimateAssetsMap,
    assetExists,
    copyModuleFile
}