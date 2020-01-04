const osuToken = "<osu token>",
        fs = require("fs"),
        readline = require('readline'),
        ojsama = require('ojsama'),
        axios = require('axios');

let maps = JSON.parse(fs.readFileSync("./maps.json").toString()).loved;
maps = maps.filter(i => i.mode == 0);
let index = 0;
const { Sequelize, Model, DataTypes } = require('sequelize');
const sequelize = new Sequelize('maps', 'sgezha', '1234', {
    dialect: 'sqlite',
    storage: 'database.sqlite'
})

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

calc(0);
async function calc() {
    let m = maps[index];
    let bmid = m.id;
    Map.findAll({ where: { beatmapset_id: bmid } }).then(async (check) => {
        if (check.length > 0) { console.log(`#727 already have in bd.`); index++; calc(); } else {
            console.log(`#0 ${bmid} start calc. ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`);
            let bmSet = await axios.get(`http://ripple.moe/api/get_beatmaps?s=${bmid}`);
            bmSet.data.forEach(async (b, ind) => {
                let id = b.beatmap_id;
                console.log(`#1 ${bmid} start calc. ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`);
                let osu = await axios.get(`https://osu.ppy.sh/osu/${id}`);
                fs.writeFileSync("map.osu", osu.data);
                let parser = new ojsama.parser();
                readline.createInterface({ input: fs.createReadStream("map.osu") }).on("line", parser.feed_line.bind(parser)).on("close", async () => {
                    let map = parser.map,
                        result = [],
                        combo = map.max_combo();
                    let osuapi = b;
                    Object.keys(mods).forEach(function (key) {
                        for (let i = 0; i < 10; i++) {
                            let star = new ojsama.diff().calc({ map: map, mods: this[key] }),
                                acc = 100 - i,
                                pp = ojsama.ppv2({ stars: star, combo: parseInt(combo), nmiss: parseInt(0), acc_percent: parseFloat(acc) }).total,
                                stats = new ojsama.std_beatmap_stats({ ar: map.ar, od: map.od, cs: map.cs, hp: map.hp }).with_mods(this[key]);
                            let ppobj = { mods: key, modsNum: this[key], star: Math.round(star.total * 100) / 100, ar: Math.round(stats.ar * 10) / 10, cs: stats.cs, od: Math.round(stats.od * 10) / 10, hp: stats.hp, rawbpm: parseInt(osuapi.bpm), bpm: parseInt(osuapi.bpm) * parseFloat(stats.speed_mul), pp: Math.round(pp * 100) / 100, combo: combo, acc: acc };
                            result.push(ppobj);
                        }
                    }, mods);
                    console.log(`#2 ${id} pp calculated. ${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`);
                    sequelize.sync().then(() => Map.create({
                        beatmapset_id: osuapi.beatmapset_id,
                        beatmap_id: osuapi.beatmap_id,
                        approved: osuapi.approved,
                        status: "Loved",
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
                        sleep(300);
                        index++;
                        calc();
                    });
                })
            })
        }
    });
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