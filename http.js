const axios = require("axios");

// Get download link with a max retry limit
const getDownloadLink = async (url, body, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.post(url, body);
      if (response.status === 200) {
        return response.data;
      }
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error("Could not fetch download link");
};

// Download memory with a max retry limit
const downloadMemory = async (downloadUrl, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.get(downloadUrl, { responseType: "stream" });
      if (response.status === 200) {
        return response.data;
      }
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error("Could not download memory");
};

module.exports = {
  getDownloadLink,
  downloadMemory,
};
