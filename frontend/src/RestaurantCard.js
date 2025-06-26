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
    regularOpeningHours,
    websiteUri,
    googleMapsUri,
    compatibility,
  } = restaurant;

  const openNow = regularOpeningHours?.openNow;

  function emitChoice(choice) {
    signalChoiceGiven();

    socket.emit("restaurant-rated", {
      restaurantId: restaurant.id,
      choice,
    });
  }

  return (
    <div className="restaurant-card">
      <h2>{displayName?.text}</h2>
      <p className="address">{formattedAddress}</p>
      <div className="details">
        <span className="rating">
          ⭐ {rating} ({userRatingCount} reviews)
        </span>
        <span className={`status ${openNow ? "open" : "closed"}`}>
          {openNow ? "Open Now" : "Closed"}
        </span>
      </div>
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

      <div>Current Compatibility: {compatibility}</div>
      {giveChoiceAvailable && (
        <>
          <div>Rate this restaurant:</div>
          {choices.map((choice, index) => (
            <button key={index} onClick={() => emitChoice(index)}>
              {choice}
            </button>
          ))}
        </>
      )}
    </div>
  );
};

export default RestaurantCard;
