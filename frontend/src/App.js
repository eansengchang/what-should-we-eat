import "./App.css";
import { useEffect, useState } from "react";
import RestaurantCard from "./RestaurantCard";
import { socket } from "./socket";

import HeroPage from "./components/HeroPage";

function App() {
  const [restaurants, setRestaurants] = useState([]);
  const [roomCode, setRoomCode] = useState("");

  useEffect(() => {
    socket.on("room-name", (roomName) => {
      setRoomCode(roomName);
    });
    socket.on("restaurants-dict", (restaurantsDict) => {
      let restaurantsList = [];
      for (let key in restaurantsDict) {
        restaurantsList.push(restaurantsDict[key]);
      }

      // sort list by compatibility
      restaurantsList.sort((a, b) => b.compatibility - a.compatibility);

      setRestaurants(restaurantsList);
    });
  }, []);

  return (
    <>
      {roomCode ? (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              margin: "20px",
            }}
          >
            Room Code: {roomCode}
            <button
              onClick={() => navigator.clipboard.writeText(roomCode)}
              style={{ marginLeft: "10px" }}
            >
              Copy Room Code
            </button>
          </div>
          <div className="App">
            {/* <header className="App-header">
          <h1>What Should We Eat?</h1>
        </header> */}
            <main className="App-main">
              {
                <div className="restaurants-list">
                  {restaurants.length > 0 ? (
                    restaurants.map((restaurant) => (
                      <RestaurantCard
                        key={restaurant.id}
                        restaurant={restaurant}
                      />
                    ))
                  ) : (
                    <p>No restaurants found nearby.</p>
                  )}
                </div>
              }
            </main>
          </div>
        </>
      ) : (
        <HeroPage />
      )}
    </>
  );
}

export default App;
