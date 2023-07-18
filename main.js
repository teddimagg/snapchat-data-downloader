const fs = require("fs");
const moment = require("moment");
const retry = require("async-retry");
const chalk = require("chalk");
const cliProgress = require("cli-progress");
const config = require("./config");
const loadDataTakeOut = require("./load");
const { getDownloadLink, downloadMemory } = require("./http");
const {
  getFileName,
  writeToFile,
  addExifData,
  closeExifTool,
} = require("./file");

const downloadAndWrite = async (download, bar) => {
  const [url, body] = download["Download Link"].split("?", 2);
  const fileTime = moment.utc(download["Date"], "YYYY-MM-DD HH:mm:ss Z");
  const geoData = {
    lng: download["Location"].split(":")[1].split(",")[1].trim(),
    lat: download["Location"].split(":")[1].split(",")[0].trim(),
  };
  const fileName = getFileName(download, fileTime);

  try {
    const downloadUrl = await retry(() => getDownloadLink(url, body));
    const data = await retry(() => downloadMemory(downloadUrl));
    const filePath = await retry(() =>
      writeToFile(
        `${config.outputDir}/${download["Media Type"].toLowerCase()}s`,
        fileName,
        data
      )
    );

    await retry(() => addExifData(filePath, geoData, fileTime));

    bar.increment();
  } catch (error) {
    console.error(`Failed to download and write file: ${fileName}`);
    console.error(error);
  }
};

const main = async () => {
  console.log(chalk.yellow("Welcome to the Snapchat Data Downloader!\n"));
  console.log(
    chalk.yellow(`
      ⠀⠀⠀⠀⠀⠀⠀⠀⢀⣠⣤⣶⣶⣶⣶⣤⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀
      ⠀⠀⠀⠀⠀⠀⢀⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⡀⠀⠀⠀⠀⠀⠀
      ⠀⠀⠀⠀⠀⠀⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⠀⠀⠀⠀⠀⠀
      ⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀⠀
      ⠀⠀⠀⢀⣀⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⣀⡀⠀⠀⠀
      ⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠀⠀⠀
      ⠀⠀⠀⠈⠙⢻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟⠋⠁⠀⠀⠀
      ⠀⠀⠀⣀⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⣀⠀⠀⠀
      ⢠⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⡄
      ⠘⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠃
      ⠀⠀⠉⠉⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠉⠉⠀⠀
      ⠀⠀⠀⠀⠈⠛⠛⠋⠙⠿⣿⣿⣿⣿⣿⣿⠿⠋⠙⠛⠛⠁⠀⠀⠀⠀
  `)
  );
  console.log(chalk.green("Starting to download files...\n"));

  let downloads = loadDataTakeOut(config.jsonFile);
  downloads = removeDuplicates(downloads, "Date");

  if (!fs.existsSync(config.outputDir)) fs.mkdirSync(config.outputDir);
  if (!fs.existsSync(`${config.outputDir}/images`))
    fs.mkdirSync(`${config.outputDir}/images`);
  if (!fs.existsSync(`${config.outputDir}/videos`))
    fs.mkdirSync(`${config.outputDir}/videos`);

  const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  bar.start(downloads.length, 0);

  const promises = downloads.map((download) => downloadAndWrite(download, bar));

  await Promise.all(promises);

  bar.stop();

  console.log(chalk.green("\nAll downloads have been completed successfully!"));

  closeExifTool();
};

const removeDuplicates = (array, uniqueField) => {
  return array.filter(
    (item, index, self) =>
      index === self.findIndex((t) => t[uniqueField] === item[uniqueField])
  );
};

main();
