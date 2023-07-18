function loadDataTakeOut(configFile) {
  let downloads;
  try {
    downloads = require(configFile)["Saved Media"];
  } catch (e) {
    if (e.code === "MODULE_NOT_FOUND") {
      console.log(
        `Couldn't find the file ${configFile}, please put your memories_history.json file into the folder.`
      );
      process.exit();
    }
    throw e;
  }

  return downloads;
}

module.exports = loadDataTakeOut;
