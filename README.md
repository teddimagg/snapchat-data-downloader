# Snapchat-Data-Downloader

Welcome to the Snapchat Data Downloader! This Node.js-based application is here to help you download your memories from Snapchat's Data Takeout. Make sure you export your memories from Snapchat beforehand. This project draws inspiration from [ToTheMax's Snapchat-All-Memories-Downloader](https://github.com/ToTheMax/Snapchat-All-Memories-Downloader).

## Features

1. **Download Memories:** Easily download all your memories (images, videos) from the Snapchat-provided takeout file (json).

2. **Error Handling:** Simple error handling ensures that even if some memories fail to download, the application continues to process the rest.

3. **Retries:** The application automatically retries failed downloads to ensure a high success rate.

4. **EXIF Date:** The correct date is stored in the EXIF data of the images and videos.

5. **EXIF GPS:** If the original image or video contains geo data, the correct location information is preserved.

6. **Video Merging**: Some video memories need video mergin ( see below )

## How to Download Your Data from Snapchat

1. Visit [Snapchat's Accounts website](https://accounts.snapchat.com) and log in using your username and password.
2. Click on ['My Data'](https://accounts.snapchat.com/accounts/downloadmydata), then click on the 'Submit Request' button.
3. Snapchat will prepare your data for download. This process may take some time.
4. Once your data is ready, Snapchat will send you an email with a link to download it. The link will direct you to the 'My Data' page, where you can access your data.
5. The downloaded data will be in a .zip file. Extract the .zip file to view your data.

## Documentation

### Prerequisites

- Node.js
- npm

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/user/memories-downloader.git
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

### Usage

1. Place your "memories_history.json' file into the ./json directory.
1. Update the `config.json` file in the root directory to configure the application:

   ```json
   {
     "outputDir": "Downloads",
     "jsonFile": "./json/memories_history.json"
   }
   ```
   **outputDir**: The directory where you want to save your downloaded memories
   
   **jsonFile**: The path to your JSON file containing the memories.
1. Run the application:

   ```bash
   node main.js
   ```

After updating the configuration, run the application using `node main.js`.

## Video Merger

Video memories captured in 2018 and lasting longer than 10 seconds are stored as separate maximum-length 10-second videos. To merge them, we've created an additional script called `video.js`. Make sure to install ffmpeg before using it:

```bash
node video.js
```

Feel free to reach out if you need any assistance or have any questions. Happy memories downloading!
