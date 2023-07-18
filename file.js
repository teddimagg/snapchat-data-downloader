const fs = require("fs");
const path = require("path");
const { ExifTool } = require("exiftool-vendored");

// Create an instance of ExifTool
const exiftool = new ExifTool();

// Get file name based on the media type and file time
const getFileName = (download, fileTime) => {
  let extension;
  const mediaType = download["Media Type"].toLowerCase();

  // Decide extension based on the media type
  if (mediaType === "image" || mediaType === "photo") {
    extension = ".jpg";
  } else if (mediaType === "video") {
    extension = ".mp4";
  } else {
    throw new Error(`Unsupported media type: ${mediaType}`);
  }

  return `${fileTime.format("YYYY-MM-DD_HH-mm-ss")}${extension}`;
};

// Write data to a file and return the file path
const writeToFile = async (outputDir, fileName, data) => {
  const outputFilePath = path.join(outputDir, fileName);
  const writer = fs.createWriteStream(outputFilePath);

  data.pipe(writer);
  await new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });

  return outputFilePath;
};

// Add Exif data to a file
const addExifData = async (fileName, geoData, fileTime) => {
  try {
    const dateTime = fileTime.format("YYYY:MM:DD HH:mm:ss");
    const exifObject = {
      CreateDate: dateTime,
      DateTimeOriginal: dateTime,
    };

    const isVideoFile = path.extname(fileName).toLowerCase() === ".mp4";

    // Add QuickTime metadata if it's a video file
    if (isVideoFile) {
      exifObject["Keys:CreationDate"] = dateTime;
    }

    // Add geoData if they are not zero
    if (Number(geoData.lat) !== 0 && Number(geoData.lng) !== 0) {
      exifObject.GPSLatitude = geoData.lat;
      exifObject.GPSLongitude = geoData.lng;
      exifObject.GPSLatitudeRef = geoData.lat < 0 ? "S" : "N";
      exifObject.GPSLongitudeRef = geoData.lng < 0 ? "W" : "E";

      // Add QuickTime:GPSCoordinates if it's a video file
      if (isVideoFile) {
        exifObject["Keys:GPSCoordinates"] = convertToISO6709(
          geoData.lat,
          geoData.lng
        );

        exifObject["Userdata:GPSCoordinates"] = convertToISO6709(
          geoData.lat,
          geoData.lng
        );
      }
    }

    await exiftool.write(fileName, exifObject, ["-overwrite_original"]);
    return fileName;
  } catch (err) {
    throw new Error(`Something terrible happened: ${err.message}`);
  }
};

// Convert to ISO6709
const convertToISO6709 = (lat, lng) => {
  const formattedLat =
    (Number(lat).toFixed(4) >= 0 ? "+" : "") + Number(lat).toFixed(4);
  const formattedLng =
    (Number(lng).toFixed(4) >= 0 ? "+" : "-") +
    Math.abs(Number(lng).toFixed(4));

  return `${formattedLat}${formattedLng}/`;
};

// Close ExifTool
const closeExifTool = () => {
  exiftool.end();
};

module.exports = {
  getFileName,
  writeToFile,
  addExifData,
  closeExifTool,
};
