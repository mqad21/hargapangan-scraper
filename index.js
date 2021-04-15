import { createRequire } from "module";
import getData from "./getData.js";
import ObjectsToCsv from "objects-to-csv";

const require = createRequire(import.meta.url);
const prompt = require("prompt-sync")();

let startDate = prompt("Masukkan Tanggal Awal (YYYY-MM-DD):");
startDate = new Date(startDate);
let endDate = prompt("Masukkan Tanggal Akhir (YYYY-MM-DD):");
endDate = new Date(endDate);
const fileName = prompt("Masukkan Nama File:");

const diffTime = Math.abs(endDate - startDate) + 1;
const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
const range = [...Array(diffDays).keys()];

(async () => {
  for (const i of range) {
    try {
      let date = new Date(startDate);
      date.setDate(date.getDate() + i);
      console.log("--------------------");
      const data = await getData(date);
      console.log("");
      console.log("Menyimpan dalam csv...");
      const csv = new ObjectsToCsv(data);
      await csv.toDisk("./" + fileName + ".csv", { append: true });
      console.log("Selesai :)");
    } catch (e) {
      console.error("Terdapat kesalahan: ", e);
    }
  }
})();
