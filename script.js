"use strict";

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

let map, mapEvent;

class App {
  constructor() {
    this._getPosition();

    form.addEventListener("submit", this._newWorkout.bind(this));

    inputType.addEventListener("change", this._toggleElevationField);

    containerWorkouts.addEventListener("click", this._moveToPopup);
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Could not get your position");
        }
      );
    } else {
      alert("Your browser does not support geolocation");
    }
  }

  _loadMap(position) {
    {
      // console.log(position);
      const { latitude } = position.coords;
      const { longitude } = position.coords;
      // console.log(latitude, longitude);
      // console.log(`https://www.google.com/maps/@${latitude},${longitude}`);
      const coords = [latitude, longitude];
      map = L.map("map").setView(coords, 13); // Using the Leaflet library (L), this initializes a map and centers it on the coords with a zoom level of 13. The map will be displayed inside the HTML element with an ID of map.
      // console.log(map);

      L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
        attribution: `Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors,
                      <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>`,
      }).addTo(map); // This adds a tile layer to the map, which is essentially the imagery and styling of the map. The tiles come from OpenStreetMap.

      // Handling clicks on map
      map.on("click", function (mapE) {
        mapEvent = mapE;
        form.classList.remove("hidden");
        inputDistance.focus();

        // console.log(mapEvent);
        // const { lat, lng } = mapEvent.latlng;
        // L.marker([lat, lng])
        //   .addTo(map)
        //   .bindPopup(
        //     L.popup({
        //       maxWidth: 250,
        //       minWidth: 100,
        //       autoClose: false,
        //       closeOnClick: false,
        //       className: "running-popup",
        //     })
        //   )
        //   .setPopupContent("Workout")
        //   .openPopup();
      });
    }
  }

  _showForm() {}

  _toggleElevationField() {}

  _newWorkout() {}

  _renderWorkoutMarker() {}

  _renderWorkout() {}

  _moveToPopup() {}

  _setLocalStorage() {}

  _getLocalStorage() {}

  reset() {}
}

class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-10); // This is a hack to create a unique ID. It converts the current date to a string, then slices the last 10 characters from the string.

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 
                        'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = "running";

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = "cycling";

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}
