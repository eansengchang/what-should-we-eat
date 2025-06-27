import "./RestaurantCard.css";
import { socket } from "./socket";

const choices = [
  "strongly dislike",
  "dislike",
  "neutral",
  "like",
  "strongly like",
];

const RestaurantCard = ({
  restaurant,
  signalChoiceGiven,
  giveChoiceAvailable,
}) => {
  const {
    displayName,
    formattedAddress,
    rating,
    userRatingCount,
    currentOpeningHours,
    websiteUri,
    googleMapsUri,
    compatibility,
    photos,
    primaryType,
    types,
    generativeSummary, 
  } = restaurant;

  const openNow = currentOpeningHours?.openNow;

  const getTodaysHours = () => {
    if (!currentOpeningHours?.weekdayDescriptions) {
      return null;
    }
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const todayName = dayNames[new Date().getDay()];
    const hoursString = currentOpeningHours.weekdayDescriptions.find((d) =>
      d.startsWith(todayName)
    );

    return hoursString?.split(": ").slice(1).join(": ");
  };

  const todaysHours = getTodaysHours();

  // The backend URL should be stored in an environment variable.
  const backendUrl =
    process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";

  // Construct the photo URL to point to our backend proxy, keeping the API key secure.
  const photoName = photos?.[0]?.name;
  const photoUrl = photoName ? `${backendUrl}/api/photo/${photoName}` : null;

  function emitChoice(choice) {
    signalChoiceGiven();

    socket.emit("restaurant-rated", {
      restaurantId: restaurant.id,
      choice,
    });
  }

  return (
    <div className="restaurant-card">
      {photoUrl && (
        <img
          src={photoUrl}
          alt={displayName?.text}
          className="restaurant-photo"
        />
      )}
      <div className="restaurant-card-content">
        <h2>{displayName?.text}</h2>
        {primaryType && (
          <p className="primary-type">{primaryType.replace(/_/g, " ")}</p>
        )}
        <p className="address">{formattedAddress}</p>
        <div className="details">
          <span className="rating">
            ⭐ {rating} ({userRatingCount} reviews)
          </span>
          <div className="status-container">
            <span className={`status ${openNow ? "open" : "closed"}`}>
              {openNow ? "Open Now" : "Closed"}
            </span>
            {todaysHours && <span className="todays-hours">{todaysHours}</span>}
          </div>
        </div>
        {types && types.length > 0 && (
          <p className="types">
            Categories:{" "}
            {types.map((type) => type.replace(/_/g, " ")).join(", ")}
          </p>
        )}
        <div className="links">
          {websiteUri && (
            <a href={websiteUri} target="_blank" rel="noopener noreferrer">
              Website
            </a>
          )}
          {googleMapsUri && (
            <a href={googleMapsUri} target="_blank" rel="noopener noreferrer">
              Google Maps
            </a>
          )}
        </div>
        {generativeSummary?.text && (
          <p className="generative-summary">{generativeSummary.text}</p>
        )}

        <div className="rating-section">
          <div>Current Compatibility: {compatibility}</div>
        </div>
        {giveChoiceAvailable && (
          <div className="rating-section">
            <h3>Rate this restaurant:</h3>
            {choices.map((choice, index) => (
              <button key={index} onClick={() => emitChoice(index)}>
                {choice}
              </button>
            ))}
          </div>
        )}
      </div> {/* End of restaurant-card-content */}
    </div>
  );
};

export default RestaurantCard;
