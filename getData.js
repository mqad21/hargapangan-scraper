import puppeteer from "puppeteer";
import cliProgress from "cli-progress";

const getSelectOptions = async (page, selectId) => {
  await page.waitForSelector("select#" + selectId);
  return await page.evaluate((selectId) => {
    const commoditySelectInput = document.getElementById(selectId);
    return Object.values(commoditySelectInput.options).map((option) => {
      return { text: option.text.trim(), value: option.value };
    });
  }, selectId);
};

export default (date) => {
  const dateString =
    date.getDate() + "-" + (date.getMonth() + 1) + "-" + date.getFullYear();

  console.log("Mengambil data tanggal: ", dateString);

  const progressBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  );
  progressBar.start(102, 0);

  return new Promise(async (resolve, reject) => {
    try {
      const browser = await puppeteer.launch({
        // headless: false,
      });

      const url = "https://hargapangan.id";
      const page = await browser.newPage();
      await page.goto(url);

      //   Mengambil select options.
      const commodityId = "commodity_id";
      const priceTypeId = "price_type_id";
      const commodityOptions = await getSelectOptions(page, commodityId);
      const priceTypeOptions = await getSelectOptions(page, priceTypeId);
      //   Perulangan kombinasi options.
      const dateId = "date";
      let result = [];

      await page.evaluate((dateId) => {
        document.getElementById(dateId).removeAttribute("readonly");
      }, dateId);

      await page.focus("input#" + dateId);
      await page.keyboard.down("Control");
      await page.keyboard.press("A");
      await page.keyboard.up("Control");
      await page.keyboard.press("Backspace");
      await page.type("input#" + dateId, dateString);

      let i = 1;
      const length = commodityOptions.length * priceTypeOptions.length;
      progressBar.setTotal(length);

      for (const commodity of commodityOptions) {
        await page.waitForSelector(
          "#mapForm > div > div.control-group.col-md-1 > button > i.fa-arrow-down"
        );
        for (const priceType of priceTypeOptions) {
          i++;
          progressBar.update(Math.ceil((i / length) * 100));

          await page.select("select#" + commodityId, commodity.value);
          await page.select("select#" + priceTypeId, priceType.value);

          await page.waitForTimeout(1000);

          await page.click(
            "#mapForm > div > div.control-group.col-md-1 > button"
          );

          await page.waitForSelector(
            "#mapForm > div > div.control-group.col-md-1 > button > i.fa-arrow-down"
          );

          await page.waitForSelector(
            'div.table-container[style*="opacity: 1"]'
          );

          const data = await page.evaluate(
            (commodity, priceType, dateString) => {
              const tableId = "DataTables_Table_0";
              const rows = document.querySelectorAll(
                "table#" + tableId + " tr"
              );
              return Array.from(rows, (row) => {
                const columns = row.querySelectorAll("td");
                return Array.from(columns, (column) => column.innerText);
              })
                .filter((item) => item.length)
                .map((item) => {
                  return {
                    date: dateString,
                    commodity,
                    priceType,
                    province: item[0],
                    price: item[1],
                  };
                });
            },
            commodity.text,
            priceType.text,
            dateString
          );
          result.push(data);
        }
      }
      await browser.close();
      resolve(result.flat());
    } catch (e) {
      reject(e);
    }
  });
};
