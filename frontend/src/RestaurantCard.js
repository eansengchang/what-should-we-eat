import React from "react";
import "./RestaurantCard.css";
import { socket } from "./socket";

const choices = [
  "strongly dislike",
  "dislike",
  "neutral",
  "like",
  "strongly like",
];

const RestaurantCard = ({ restaurant }) => {
  const {
    displayName,
    formattedAddress,
    rating,
    userRatingCount,
    regularOpeningHours,
    websiteUri,
    googleMapsUri,
    reviews,
    compatibility,
  } = restaurant;

  const openNow = regularOpeningHours?.openNow;

  function emitChoice(choice) {
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
      {reviews && reviews.length > 0 && (
        <div className="reviews">
          <h3>Reviews</h3>
          <div className="review">
            <p>"{reviews[0].text?.text}"</p>
            <p className="author">
              - {reviews[0].authorAttribution?.displayName}
            </p>
          </div>
        </div>
      )}
      <div>Current Compatibility: {compatibility}</div>
      <div>Rate this restaurant:</div>
      {choices.map((choice, index) => (
        <button key={index} onClick={() => emitChoice(index)}>
          {choice}
        </button>
      ))}
    </div>
  );
};

export default RestaurantCard;
