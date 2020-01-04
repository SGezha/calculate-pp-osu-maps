const fs = require("fs"),
    readline = require('readline'),
    ojsama = require('ojsama'),
    axios = require('axios'),
    lowdb = require('lowdb'),
    FileSync = require('lowdb/adapters/FileSync'),
    adapter = new FileSync("maps.json"),
    db = lowdb(adapter);

const { Sequelize, Model, DataTypes } = require('sequelize');
const sequelize = new Sequelize('maps', 'ck', 'jklj42o34k234', {
    dialect: 'sqlite',
    storage: 'database.sqlite',
    logging: false
})
let sts = "loved";
class Map extends Model { }
Map.init({
    beatmapset_id: DataTypes.INTEGER,
    beatmap_id: DataTypes.INTEGER,
    approved: DataTypes.INTEGER,
    status: DataTypes.STRING,
    total_length: DataTypes.INTEGER,
    hit_length: DataTypes.INTEGER,
    version: DataTypes.STRING,
    file_md5: DataTypes.STRING,
    diff_size: DataTypes.FLOAT,
    diff_overall: DataTypes.FLOAT,
    diff_approach: DataTypes.FLOAT,
    diff_drain: DataTypes.FLOAT,
    mode: DataTypes.INTEGER,
    approved_date: DataTypes.DATE,
    last_update: DataTypes.DATE,
    artist: DataTypes.STRING,
    title: DataTypes.STRING,
    creator: DataTypes.STRING,
    bpm: DataTypes.FLOAT,
    source: DataTypes.STRING,
    tags: DataTypes.STRING,
    genre_id: DataTypes.INTEGER,
    max_combo: DataTypes.INTEGER,
    difficultyrating: DataTypes.FLOAT,
    pp: DataTypes.FLOAT,
    ppJSON: DataTypes.JSON,
    json: DataTypes.JSON
}, { sequelize, modelName: 'Map' });
calc();
async function calc() {
    db.get(sts).value().reverse().forEach(async (d, i) => {
        setTimeout(() => {
            if (d.mode != 0) return;
            let bmid = d.id;
            Map.findAll({ where: { beatmapset_id: bmid } }).then(async (check) => {
                try {
                    if (check.length > 0) {
                        console.log(`${bmid} #727 already have in bd.`);
                    } else {
                        let bmSet = await axios.get(`http://ripple.moe/api/get_beatmaps?s=${bmid}`);
                        bmSet.data.forEach(async (b, ind) => {
                            setTimeout(async () => {
                                try {
                                    let id = b.beatmap_id;
                                    let osu = await axios.get(`https://osu.ppy.sh/osu/${id}`);
                                    fs.writeFileSync("map.osu", osu.data);
                                    let parser = new ojsama.parser();
                                    readline.createInterface({ input: fs.createReadStream("map.osu") }).on("line", parser.feed_line.bind(parser)).on("close", async () => {
                                        try {
                                            let map = parser.map, result = [],
                                                combo = map.max_combo();
                                            let osuapi = b;
                                            Object.keys(mods).forEach(async (key) => {
                                                try {
                                                    for (let i = 0; i < 10; i++) {
                                                        let star = new ojsama.diff().calc({ map: map, mods: this[key] }),
                                                            acc = 100 - i,
                                                            pp = ojsama.ppv2({ stars: star, combo: parseInt(combo), nmiss: parseInt(0), acc_percent: parseFloat(acc) }).total,
                                                            stats = new ojsama.std_beatmap_stats({ ar: map.ar, od: map.od, cs: map.cs, hp: map.hp }).with_mods(this[key]);
                                                        let ppobj = { mods: key, modsNum: this[key], star: Math.round(star.total * 100) / 100, ar: Math.round(stats.ar * 10) / 10, cs: stats.cs, od: Math.round(stats.od * 10) / 10, hp: stats.hp, rawbpm: parseInt(osuapi.bpm), bpm: parseInt(osuapi.bpm) * parseFloat(stats.speed_mul), pp: Math.round(pp * 100) / 100, combo: combo, acc: acc };
                                                        result.push(ppobj);
                                                    }
                                                } catch (err) { console.log(`#4 ${err.message}`); }
                                            }, mods);
                                            sequelize.sync().then(() => Map.create({
                                                beatmapset_id: osuapi.beatmapset_id,
                                                beatmap_id: osuapi.beatmap_id,
                                                approved: osuapi.approved,
                                                status: sts,
                                                total_length: osuapi.total_length,
                                                hit_length: osuapi.hit_length,
                                                version: osuapi.version,
                                                file_md5: osuapi.file_md5,
                                                diff_size: osuapi.diff_size,
                                                diff_overall: osuapi.diff_overall,
                                                diff_approach: osuapi.diff_approach,
                                                diff_drain: osuapi.diff_drain,
                                                mode: osuapi.mode,
                                                approved_date: osuapi.approved_date,
                                                last_update: osuapi.last_update,
                                                artist: osuapi.artist,
                                                title: osuapi.title,
                                                creator: osuapi.creator,
                                                bpm: osuapi.bpm,
                                                source: osuapi.source,
                                                tags: osuapi.tags,
                                                genre_id: osuapi.genre_id,
                                                max_combo: osuapi.max_combo,
                                                difficultyrating: osuapi.difficultyrating,
                                                pp: result[0].pp,
                                                ppJSON: result,
                                                json: osuapi
                                            })).then(map => {
                                                console.log(`#3 ${id} save to BD. ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`);
                                            });
                                        } catch (err) { console.log(`#3 ${err.message}`); }
                                    })
                                } catch (err) {console.log(`#5 ${err.message}`);}
                                
                            }, i * 100);
                        })
                    }
                } catch (err) {console.log(`#1 ${err.message}`);}
            });
        }, i * 100);
    });
}
async function createDB() {
    sequelize.sync().then(() => Map.create({
        beatmapset_id: 0,
        beatmap_id: 0,
        approved: 0,
        status: 0,
        total_length: 0,
        hit_length: 0,
        version: 0,
        file_md5: 0,
        diff_size: 0,
        diff_overall: 0,
        diff_approach: 0,
        diff_drain: 0,
        mode: 0,
        approved_date: 0,
        last_update: 0,
        artist: 0,
        title: 0,
        creator: 0,
        bpm: 0,
        source: 0,
        tags: 0,
        genre_id: 0,
        max_combo: 0,
        difficultyrating: 0,
        pp: 0,
        ppJSON: 0,
        json: 0
    }))
}
let mods = {
    NoMod: 0,
    EZ: 2,
    HD: 8,
    HR: 16,
    DT: 64,
    HT: 256,
    FL: 1024,
    EZHD: 10,
    EZDT: 66,
    EZHT: 258,
    EZFL: 1026,
    HDHR: 24,
    HDDT: 72,
    HDHT: 264,
    HDFL: 1032,
    HRDT: 80,
    HRHT: 272,
    HRFL: 1040,
    DTFL: 1088,
    HTFL: 1280,
    EZHDDT: 74,
    EZHDHT: 266,
    EZHDFL: 1034,
    EZDTFL: 1090,
    EZHTFL: 1282,
    HDHRDT: 88,
    HDHRHT: 280,
    HDHRFL: 1048,
    HDDTFL: 1096,
    HDHTFL: 1288,
    HRDTFL: 1104,
    HRHTFL: 1296,
    EZHDDTFL: 1098,
    EZHDHTFL: 1290,
    HDHRDTFL: 1112,
    HDHRHTFL: 1304
};

async function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); };