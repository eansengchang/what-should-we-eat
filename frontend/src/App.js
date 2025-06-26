import "./App.css";
import { useEffect, useState } from "react";
import RestaurantCard from "./RestaurantCard";
import { socket } from "./socket";

import HeroPage from "./components/HeroPage";

function App() {
  const [restaurants, setRestaurants] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [roomCode, setRoomCode] = useState("");

  const [choicesGiven, setChoicesGiven] = useState({});

  useEffect(() => {
    const handleRoomName = (roomName) => {
      setRoomCode(roomName);
    };

    const handleRestaurantsDict = (restaurantsDict) => {
      console.log(restaurantsDict);
      const restaurantsFromDict = Object.values(restaurantsDict);

      // Always update the rankings with the latest compatibility scores
      const sortedRankings = [...restaurantsFromDict].sort(
        (a, b) => b.compatibility - a.compatibility
      );
      setRankings(sortedRankings);

      // Only set the initial list of restaurants once.
      setRestaurants((prevRestaurants) => {
        if (prevRestaurants.length > 0) {
          return prevRestaurants;
        } else {
          const newChoicesGiven = {};
          restaurantsFromDict.forEach((r) => {
            newChoicesGiven[r.id] = false;
          });
          setChoicesGiven(newChoicesGiven);
          return restaurantsFromDict;
        }
      });
    };

    socket.on("room-name", handleRoomName);
    socket.on("restaurants-dict", handleRestaurantsDict);

    return () => {
      socket.off("room-name", handleRoomName);
      socket.off("restaurants-dict", handleRestaurantsDict);
    };
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
            <main className="App-main">
              <div className="App-content">
                <div className="restaurants-list">
                  <h2>Unranked Restaurants</h2>
                  {restaurants.length > 0 ? (
                    restaurants.map((restaurant) =>
                      // Don't show the card if user has already given their choice
                      choicesGiven[restaurant.id] ? null : (
                        <RestaurantCard
                          key={restaurant.id}
                          restaurant={restaurant}
                          signalChoiceGiven={() => {
                            setChoicesGiven((prevChoices) => ({
                              ...prevChoices,
                              [restaurant.id]: true,
                            }));
                          }}
                          giveChoiceAvailable={true}
                        />
                      )
                    )
                  ) : (
                    <p>No restaurants found nearby.</p>
                  )}
                </div>
                {/* Ranking list on the side for user to see current rankings */}
                <div className="rankings-list">
                  <h2>Current Rankings</h2>
                  {rankings.length > 0 ? (
                    rankings.map((restaurant) => (
                      <RestaurantCard
                        key={restaurant.id}
                        restaurant={restaurant}
                        signalChoiceGiven={() => {
                          setChoicesGiven((prevChoices) => ({
                            ...prevChoices,
                            [restaurant.id]: true,
                          }));
                        }}
                        giveChoiceAvailable={false}
                      />
                    ))
                  ) : (
                    <p>No restaurants found nearby.</p>
                  )}
                </div>
              </div>
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
