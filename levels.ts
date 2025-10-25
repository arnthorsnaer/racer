export interface Level {
	level: number;
	target: string;
}

const levels: Level[] = [
	{
		level: 1,
		target: "köttur"
	},
	{
		level: 2,
		target: "hundur"
	},
	{
		level: 3,
		target: "bók"
	},
	{
		level: 4,
		target: "hestur"
	},
	{
		level: 5,
		target: "sól"
	},
	{
		level: 6,
		target: "vatn"
	},
	{
		level: 7,
		target: "eyja"
	},
	{
		level: 8,
		target: "fjall"
	},
	{
		level: 9,
		target: "ský"
	},
	{
		level: 10,
		target: "vinur"
	},
	{
		level: 11,
		target: "blóm"
	},
	{
		level: 12,
		target: "tré"
	},
	{
		level: 13,
		target: "rós"
	},
	{
		level: 14,
		target: "stjarna"
	},
	{
		level: 15,
		target: "tungl"
	},
	{
		level: 16,
		target: "hús"
	},
	{
		level: 17,
		target: "borð"
	},
	{
		level: 18,
		target: "stóll"
	},
	{
		level: 19,
		target: "gluggi"
	},
	{
		level: 20,
		target: "hurð"
	},
	{
		level: 21,
		target: "regnbogi"
	},
	{
		level: 22,
		target: "brauð"
	},
	{
		level: 23,
		target: "fiskur"
	},
	{
		level: 24,
		target: "fugl"
	},
	{
		level: 25,
		target: "strönd"
	},
	{
		level: 26,
		target: "sjór"
	},
	{
		level: 27,
		target: "ís"
	},
	{
		level: 28,
		target: "snjór"
	},
	{
		level: 29,
		target: "regn"
	},
	{
		level: 30,
		target: "vindur"
	},
	{
		level: 31,
		target: "þoka"
	},
	{
		level: 32,
		target: "morgunn"
	},
	{
		level: 33,
		target: "kvöld"
	},
	{
		level: 34,
		target: "nótt"
	},
	{
		level: 35,
		target: "dagur"
	},
	{
		level: 36,
		target: "sumar"
	},
	{
		level: 37,
		target: "vetur"
	},
	{
		level: 38,
		target: "haust"
	},
	{
		level: 39,
		target: "vor"
	},
	{
		level: 40,
		target: "hljómsveit"
	},
	{
		level: 41,
		target: "tónlist"
	},
	{
		level: 42,
		target: "dans"
	},
	{
		level: 43,
		target: "leikur"
	},
	{
		level: 44,
		target: "gleði"
	},
	{
		level: 45,
		target: "ást"
	},
	{
		level: 46,
		target: "friður"
	},
	{
		level: 47,
		target: "von"
	},
	{
		level: 48,
		target: "draumur"
	},
	{
		level: 49,
		target: "hamingja"
	},
	{
		level: 50,
		target: "vetrtur"
	},
	{
		level: 51,
		target: "höfuður"
	},
	{
		level: 52,
		target: "bíbílar"
	},
	{
		level: 53,
		target: "kennari"
	},
	{
		level: 54,
		target: "stokkur"
	},
	{
		level: 55,
		target: "höfuðborg"
	},
	{
		level: 56,
		target: "barnabók"
	},
	{
		level: 57,
		target: "gluggatjöld"
	},
	{
		level: 58,
		target: "ástarsaga"
	},
	{
		level: 59,
		target: "málfræði"
	},
	{
		level: 60,
		target: "manneskja"
	},
	{
		level: 61,
		target: "græðlingur"
	},
	{
		level: 62,
		target: "sjúkrahús"
	},
	{
		level: 63,
		target: "tölvuleikur"
	},
	{
		level: 64,
		target: "aðferðafræði"
	},
	{
		level: 65,
		target: "menntaskóli"
	},
	{
		level: 66,
		target: "listrænt"
	},
	{
		level: 67,
		target: "kjallarinn"
	},
	{
		level: 68,
		target: "kappakstur"
	},
	{
		level: 69,
		target: "fjallatoppur"
	},
	{
		level: 70,
		target: "gott veður"
	},
	{
		level: 71,
		target: "fallegt land"
	},
	{
		level: 72,
		target: "kaldur vindur"
	},
	{
		level: 73,
		target: "hlýtt í dag"
	},
	{
		level: 74,
		target: "blátt ský"
	},
	{
		level: 75,
		target: "grænir dalir"
	},
	{
		level: 76,
		target: "djúpur sjór"
	},
	{
		level: 77,
		target: "há fjöll"
	},
	{
		level: 78,
		target: "gulur sandur"
	},
	{
		level: 79,
		target: "fögur náttúra"
	},
	{
		level: 80,
		target: "sætur köttur"
	},
	{
		level: 81,
		target: "stór hestur"
	},
	{
		level: 82,
		target: "lítill fugl"
	},
	{
		level: 83,
		target: "góður vinur"
	},
	{
		level: 84,
		target: "falleg rós"
	},
	{
		level: 85,
		target: "björt stjarna"
	},
	{
		level: 86,
		target: "hvítur snjór"
	},
	{
		level: 87,
		target: "rauður bíll"
	},
	{
		level: 88,
		target: "nýtt hús"
	},
	{
		level: 89,
		target: "gamalt tré"
	},
	{
		level: 90,
		target: "ég er hamingjusöm"
	},
	{
		level: 91,
		target: "veðrið er gott"
	},
	{
		level: 92,
		target: "sólin skín björt"
	},
	{
		level: 93,
		target: "tunglið er fullt"
	},
	{
		level: 94,
		target: "vindurinn blæs sterkt"
	},
	{
		level: 95,
		target: "hafið er blátt"
	},
	{
		level: 96,
		target: "fjöllin eru há"
	},
	{
		level: 97,
		target: "fuglinn syngur fallega"
	},
	{
		level: 98,
		target: "kötturinn sefur í sólinni"
	},
	{
		level: 99,
		target: "hesturinn hleypur hratt"
	},
	{
		level: 100,
		target: "börnin leika sér úti"
	},
	{
		level: 101,
		target: "ég elska Ísland"
	},
	{
		level: 102,
		target: "náttúran er undursamleg"
	},
	{
		level: 103,
		target: "regnboginn er litrík"
	},
	{
		level: 104,
		target: "morgunninn er fríður"
	},
	{
		level: 105,
		target: "kvöldið er kyrrt"
	},
	{
		level: 106,
		target: "sumarið er yndislegt"
	},
	{
		level: 107,
		target: "vetrarnóttin er löng"
	},
	{
		level: 108,
		target: "haustið er gylltur tími"
	},
	{
		level: 109,
		target: "vorið kemur með blómum"
	},
	{
		level: 110,
		target: "ég sé norðurljósin dansa"
	}
];

export default levels;
