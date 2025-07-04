const axios = require("axios");
const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const { makeid } = require("./utils");
require("dotenv").config();

axios.defaults.headers.post["Content-Type"] = "application/json";
axios.defaults.headers.post["X-Goog-Api-Key"] = process.env.GOOGLE_API_KEY;

// All the information we are getting from google API
let fieldMask = [
  "id",
  "displayName",
  "formattedAddress",
  "rating",
  "userRatingCount",
  "photos",
  "primaryType",
  "types",
  "currentOpeningHours",
  "currentSecondaryOpeningHours",
  "regularOpeningHours",
  "websiteUri",
  "googleMapsUri",
  "generativeSummary",
];

let fieldMaskHeader = fieldMask.map((f) => `places.${f}`).join(",");

axios.defaults.headers.post["X-Goog-FieldMask"] = fieldMaskHeader;

const PORT = process.env.PORT || 4000;
const ALLOWED_ORIGIN = "*";
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGIN,
    methods: ["GET", "POST"],
  },
});

const responseExample = require("./response_example.json");

async function getAPI(latitude, longitude) {
  // Commented out in devolopment so that I don't use API credits and use response example

  const res = await axios.post(
    "https://places.googleapis.com/v1/places:searchNearby",
    {
      includedPrimaryTypes: ["restaurant", "cafe"],
      maxResultCount: 10,
      locationRestriction: {
        circle: {
          center: {
            latitude: latitude,
            longitude: longitude,
          },
          radius: 500.0,
        },
      },
    }
  );
  return res.data;

  // return responseExample;
}

// getAPI(37.7937, -122.3965).then((res) => {
//   console.log(res);
// });

const socketRooms = {}; //maps socketIDs to room names
let getStateObjFromRooms = {}; //maps room names to state objects

io.on("connect", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("join-room", handleJoinRoom);
  socket.on("create-room", handleNewRoom);
  socket.on("restaurant-rated", handleRestaurantRated);

  function handleRestaurantRated({ restaurantId, choice }) {
    // console.log(restaurantId, choice);

    // alter the compatibility of the respective restaurant

    const compatibilityDelta = [-2, -1, 0, 1, 2];
    const restaurantDict =
      getStateObjFromRooms[socketRooms[socket.id]].restaurantDict;

    restaurantDict[restaurantId].compatibility += compatibilityDelta[choice];

    getStateObjFromRooms[socketRooms[socket.id]].restaurantDict =
      restaurantDict;

    const roomName = socketRooms[socket.id];
    io.in(roomName).emit("restaurants-dict", restaurantDict);
  }

  async function handleNewRoom({ latitude, longitude }) {
    // First use location data to get near restaurants
    console.log(`Querying google for ${latitude}, ${longitude}`);
    let response = await getAPI(latitude, longitude);

    // add compatibility property to each restaurant to keep track of how good a restaurant is for the group
    // create a dictionary that maps restaurant ids to restaurants
    let restaurantDict = {};

    if (response?.places) {
      response?.places.forEach((r) => {
        r.compatibility = 0;
        restaurantDict[r.id] = r;
      });
    }
    // Emit the restaurant list
    socket.emit("restaurants-dict", restaurantDict);

    // create new room logic
    const roomName = makeid(5);
    socketRooms[socket.id] = roomName;
    socket.join(roomName);

    // Create state object and cache restaurant list for joining players
    getStateObjFromRooms[roomName] = { restaurantDict: null };
    getStateObjFromRooms[roomName].restaurantDict = restaurantDict;

    console.log(`Creating new room: ${roomName}`);

    socket.emit("room-name", roomName);
  }

  function handleJoinRoom(roomName) {
    if (!roomName) {
      socket.emit("unknownCode");
      return;
    }
    //room is a set
    const room = io.sockets.adapter.rooms.get(roomName);

    //get the size of the room if its a thing
    let numsockets;
    if (room) {
      numsockets = room.size;
    }

    if (!room || numsockets === 0) {
      socket.emit("unknownCode");
      return;
    }

    socketRooms[socket.id] = roomName;
    socket.join(roomName);

    console.log(`Socket joining room: ${roomName}`);

    socket.emit("room-name", roomName);
    socket.emit(
      "restaurants-dict",
      getStateObjFromRooms[roomName].restaurantDict
    );
  }
});

app.use((req, res, next) => {
  res.append("Access-Control-Allow-Origin", "*");
  // res.append("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  // res.append("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.get("/", async (req, res) => {
  res.send("Hello World!");
});

let counter = 0;

app.get(/\/api\/photo\/(.*)/, async (req, res) => {
  const photoName = req.params[0];
  // Make sure your GOOGLE_API_KEY is in your backend's .env file
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!photoName) {
    return res.status(400).send("Photo name is required.");
  }

  if (!apiKey) {
    console.error("Google API key is not configured on the backend.");
    return res.status(500).send("Server configuration error.");
  }

  const googlePhotoUrl = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=1000&key=${apiKey}`;

  try {
    // Make a request to Google's API and ask for the response as a stream
    counter++;
    console.log("quering google images api: ", counter);

    const response = await axios({
      method: "get",
      url: googlePhotoUrl,
      responseType: "stream",
    });

    // Set the content type from Google's response
    res.setHeader("Content-Type", response.headers["content-type"]);

    // Pipe the image stream from Google directly to the client
    response.data.pipe(res);
  } catch (error) {
    console.error("Error fetching photo from Google:", error.message);
    res.status(error.response?.status || 500).send("Failed to fetch photo.");
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
