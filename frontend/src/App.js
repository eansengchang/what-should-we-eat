import "./App.css";
import { useEffect, useState } from "react";

import { socket } from "./socket";

import HeroPage from "./components/HeroPage";
import RestaurantCard from "./RestaurantCard";

function App() {
  const [restaurants, setRestaurants] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [roomCode, setRoomCode] = useState("");

  const [seeGroupRankings, setSeeGroupRankings] = useState(false);

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
          {/* Moved inline styles to App.css for better maintainability */}
          <div className="room-code-container">
            Room Code: {roomCode}
            {/* Added a class for the button for potential styling */}
            <button
              className="copy-button"
              onClick={() => navigator.clipboard.writeText(roomCode)}
              style={{ marginLeft: "10px" }}
            >
              Copy Room Code
            </button>
          </div>
          <div className="App">
            <main className="App-main">
              <div className="App-content">
                <button onClick={() => setSeeGroupRankings(!seeGroupRankings)}>
                  {seeGroupRankings ? "Go Back" : "Show Group Rankings"}
                </button>
                {seeGroupRankings ? (
                  <>
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
                  </>
                ) : (
                  <>
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
                  </>
                )}
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
