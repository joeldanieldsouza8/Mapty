"use strict";

/* 
  Note to self:
  - insertAdjacentHTML() is a method that allows us to insert a string of HTML into the DOM, adjacent to the element we selected.
  - The first argument is the position where we want to insert the HTML.
  - The second argument is the string of HTML we want to insert.
  - We use the afterend position to insert the HTML element as a sibling, after the selected element. 

  beforebegin - Before the element itself.
  afterbegin - Just inside the element, before its first child.
  beforeend - Just inside the element, after its last child.
  afterend - After the element itself.
  */

class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);

  constructor(distance, duration, coords) {
    // this.date = ...
    // this.id = ...
    this.distance = distance; // in km
    this.duration = duration; // in min
    this.coords = coords; // [lat, lng]
  }

  _setDescription() {
    // prettier-ignore
    const months = [
      "January", 
      "February", 
      "March", 
      "April", 
      "May", 
      "June", 
      "July", 
      "August", 
      "September", 
      "October", 
      "November", 
      "December"
    ];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = "running";

  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this.type = "running";
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

  constructor(distance, duration, coords, elevationGain) {
    super(distance, duration, coords);
    this.elevationGain = elevationGain;
    this.type = "cycling";
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

const run1 = new Running(5.2, 24, [39, -12], 178);

/////////////////////////////////////////////
// APPLICATION ARCHITECTURE

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");
const btnReset = document.querySelector(".btn--reset");
const btnSort = document.querySelector(".btn--sort");

class App {
  #map;
  #mapEvent;
  #workouts = [];
  #mapZoomLevel = 13;
  #sorted = false;

  constructor() {
    // Get user's position
    this._getPosition();

    // Get data from local storage
    this._getLocalStorage();

    // Attach event handlers
    form.addEventListener("submit", this._newWorkout.bind(this));
    inputType.addEventListener("change", this._toggleElevationField);
    containerWorkouts.addEventListener("click", this._moveToPopup.bind(this));
    btnReset.addEventListener("click", this._reset.bind(this));

    // Sort workouts by distance
    btnSort.addEventListener("click", this._sort.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Could not get your position");
        }
      );
    }
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    // console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];
    this.#map = L.map("map").setView(coords, this.#mapZoomLevel);
    // console.log(map);

    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution: `&copy; <a href="https://www.google.com/maps/@${latitude},${longitude}">Google Maps`,
    }).addTo(this.#map);

    // Handling clicks on map
    this.#map.on("click", this._showForm.bind(this));

    // Render markers
    this.#workouts.forEach((work) => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
    inputDistance.focus();
  }

  _hideForm() {
    // Empty input fields
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        "";

    // Hide form
    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => (form.style.display = "grid"), 1000);
  }

  _toggleElevationField() {
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }

  _newWorkout(e) {
    e.preventDefault();

    // Helper functions
    const validInputs = (...inputs) =>
      inputs.every((input) => Number.isFinite(input));

    const allPositive = (...inputs) => inputs.every((input) => input > 0);

    // Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value; // + converts string to number
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // If workout running, create running object
    if (type === "running") {
      const cadence = +inputCadence.value;

      // Check if data is valid
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        return alert("Inputs have to be positive numbers!");
      }

      workout = new Running(distance, duration, [lat, lng], cadence);
    }

    // If workout cycling, create cycling object
    if (type === "cycling") {
      const elevation = +inputElevation.value;

      // Check if data is valid
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(elevation)
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      ) {
        return alert("Inputs have to be positive numbers!");
      }

      workout = new Cycling(distance, duration, [lat, lng], elevation);
    }

    // Add new object to workout array
    this.#workouts.push(workout);
    console.log(workout);

    // Render workout on map as marker
    this._renderWorkoutMarker(workout);

    this._renderWorkout(workout);

    // Hide form + clear input fields
    this._hideForm();

    // Set local storage to all workouts
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    // If sort is false, render workouts as they are
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
    <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
  `;

    if (workout.type === "running") {
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
      `;
    }

    if (workout.type === "cycling") {
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div> 
      </li>
      `;
    }

    // This inserts the HTML element as a sibling, after the selected element. In this case, the selected element is the form. The HTML element is the workout list item. This is the element that will be inserted into the DOM.
    form.insertAdjacentHTML("afterend", html);
  }

  _moveToPopup(e) {
    // The closest() method traverses the Element and its parents (heading toward the document root) until it finds a node that matches the provided selector string. Will return itself or the matching ancestor. If no such element exists, it returns null.
    const workoutEl = e.target.closest(".workout");
    // console.log(workoutEl);

    if (!workoutEl) return;

    // The dataset property on the HTMLElement interface provides read/write access to all the custom data attributes (data-*) set on the element. It is a map of DOMString, one entry for each custom data attribute.
    const workout = this.#workouts.find(
      (work) => work.id === workoutEl.dataset.id
    );
    // console.log(workout);

    // The setView() method sets the view of the map (geographical center and zoom) with the given animation options.
    // The setZoom() method sets the zoom level of the map.

    if (workout === undefined || this.#map === undefined) return;

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    // workout.click();
  }

  _setLocalStorage() {
    // The localStorage and sessionStorage properties allow to save key/value pairs in a web browser.
    // The localStorage object stores data with no expiration date. The data will not be deleted when the browser is closed, and will be available the next day, week, or year.
    // The localStorage property is read-only.
    // The following example assigns the value "Smith" to the key "lastname" in the browser's localStorage object:
    // localStorage.lastname = "Smith";
    // The syntax for reading the localStorage item is as follows:
    // var lastname = localStorage.lastname;
    // The syntax for removing the localStorage item is as follows:
    // localStorage.removeItem("lastname");
    // The syntax for removing all the localStorage items is as follows:
    // localStorage.clear();

    // The JSON.stringify() method converts a JavaScript object or value to a JSON string.
    // The JSON.parse() method parses a JSON string, constructing the JavaScript value or object described by the string.
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    // The JSON.parse() method parses a JSON string, constructing the JavaScript value or object described by the string.
    const data = JSON.parse(localStorage.getItem("workouts")); // This gets the data associated with the key "workouts" from the browser's localStorage. If there is no data associated with that key, it returns null.

    // Guard clause
    if (!data) return;

    // If there is valid data retrieved from localStorage, it's assigned to the app's private field #workouts.
    this.#workouts = data;

    // Render all workouts
    this.#workouts.forEach((work) => {
      this._renderWorkout(work);
    });
  }

  _reset() {
    localStorage.removeItem("workouts");
    location.reload();
  }

  _sort() {
    // Get the list of workouts
    const workouts = document.querySelector(".workouts");

    // Get the list items
    const items = workouts.querySelectorAll(".workout");

    // Convert the list items into an array
    const itemsArr = Array.from(items);

    // Sort the array
    if (!this.#sorted) {
      itemsArr.sort((a, b) => {
        const aDistance = a.querySelector(".workout__value").textContent;
        const bDistance = b.querySelector(".workout__value").textContent;
        return aDistance - bDistance;
      });
      this.#sorted = true;
    } else {
      itemsArr.sort((a, b) => {
        const aDistance = a.querySelector(".workout__value").textContent;
        const bDistance = b.querySelector(".workout__value").textContent;
        return bDistance - aDistance;
      });
      this.#sorted = false;
    }

    // Remove all existing list items from the DOM
    items.forEach((item) => item.remove());

    // Insert the sorted list items back into the DOM
    itemsArr.forEach((item) => {
      // This inserts the HTML element as the last child of the selected element. In this case, the selected element is the workouts list. The HTML element is the workout list item. This is the element that will be inserted into the DOM.
      workouts.insertAdjacentElement("beforeend", item);
    });
  }
}

const app = new App();
