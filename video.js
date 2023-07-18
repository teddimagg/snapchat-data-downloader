const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const chalk = require("chalk");
const pLimit = require("p-limit");
const config = require("./config");
const cliProgress = require("cli-progress");

const directoryPath = config.outputDir + "/videos";
const outputPath = config.outputDir + "/videos_joined";

if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath);
}

fs.readdir(directoryPath, (err, files) => {
  if (err) {
    return console.log("Unable to scan directory: " + err);
  }

  let groups = groupVideosByTimeGap(files);

  let totalFiles = 0;
  let singleFileVideos = 0;
  let multiFileVideos = 0;

  groups.forEach((group) => (totalFiles += group.length));

  const limit = pLimit(5); // Only allow 5 simultaneous processes

  let tasks = [];

  const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  groups.forEach((group, groupIndex) => {
    // If there's only one video in the group, copy it to the output directory and skip merging.
    if (group.length === 1) {
      // console.log(`Group ${groupIndex}: NO MERGE NEEDED`);
      fs.copyFileSync(
        group[0],
        path.join(outputPath, `Group_${groupIndex}.mp4`)
      );
      singleFileVideos++;
    } else {
      multiFileVideos++;

      // Add this task to the tasks array
      tasks.push(() => limit(() => mergeVideos(group, groupIndex, bar)));
    }
  });

  console.log("====================================");
  console.log(chalk.green(`Total video files: ${totalFiles}`));
  console.log(
    chalk.blue(`${singleFileVideos} video files did not need merging`)
  );
  console.log(
    chalk.yellow(
      `Now merging: ${
        totalFiles - singleFileVideos
      } files into ${multiFileVideos} videos.`
    )
  );

  console.log("====================================");
  console.log("");

  bar.start(multiFileVideos, 0);
  // Execute all tasks, with at most 5 at the same time
  Promise.all(tasks.map((task) => task())).then(() => {
    bar.stop();
  });
});

function mergeVideos(group, key, bar) {
  return new Promise((resolve, reject) => {
    // console.log(chalk.bgWhite.black(key) + chalk.white(": MERGE STARTED"));

    let proc = ffmpeg();

    group.forEach((videoFile) => {
      proc = proc.addInput(videoFile);
    });

    let filtergraph = group
      .map((_, index) => `[${index}:v]scale=540:1110,fps=30[v${index}]`)
      .join(";");
    filtergraph +=
      ";" +
      group.map((_, index) => `[v${index}]`).join(",") +
      "concat=n=" +
      group.length +
      ":v=1:a=0[out]";

    proc
      .complexFilter(filtergraph, ["out"])
      .outputOptions("-map_metadata 0")
      .outputOptions("-vsync 2")
      .mergeToFile(path.join(outputPath, `${key}.mp4`), "./temp")
      .on("progress", (progress) => {
        // console.log(progress);
      })
      .on("error", (err, stdout, stderr) => {
        // console.log(chalk.bgRed.white(key) + chalk.white(": MERGE ERROR"));
        reject(false);
        return;
      })
      .on("end", () => {
        // console.log(chalk.bgWhite.black(key) + chalk.white(": MERGE COMPLETE"));
        bar.increment();
        resolve();
      });
  });
}

function groupVideosByTimeGap(files) {
  let groups = [];
  let currentGroup = [];
  let lastTimestampInSeconds = null;

  let videoFiles = files
    .filter((file) => path.extname(file) === ".mp4")
    .map((file) => {
      let [datePart, timePart] = file.substring(0, 19).split("_");
      let [hours, minutes, seconds] = timePart.split("-").map(Number);
      let [year, month, day] = datePart.split("-").map(Number);

      let date = new Date(year, month - 1, day, hours, minutes, seconds);
      let totalSeconds = Math.floor(date.getTime() / 1000);

      return {
        path: path.join(directoryPath, file),
        timestamp: totalSeconds,
      };
    });

  videoFiles.sort((a, b) => a.timestamp - b.timestamp);

  videoFiles.forEach((file) => {
    if (
      lastTimestampInSeconds &&
      file.timestamp - lastTimestampInSeconds > 10
    ) {
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
        currentGroup = [];
      }
    }
    currentGroup.push(file.path);
    lastTimestampInSeconds = file.timestamp;
  });

  if (currentGroup.length) {
    groups.push(currentGroup);
  }

  return groups;
}
