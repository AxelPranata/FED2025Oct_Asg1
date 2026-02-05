// Toggle navigation links on hamburger click
let hamburger = document.getElementById("hamburger");
let nav_links = document.getElementById("nav-links");

hamburger.addEventListener("click", () => {
    nav_links.classList.toggle("active");
});
// Display current date 
const dateElement = document.querySelector(".date");

const today = new Date();

const options = { 
  weekday: "long", 
  day: "2-digit", 
  month: "short", 
  year: "numeric" 
};

dateElement.textContent = today.toLocaleDateString("en-GB", options);

