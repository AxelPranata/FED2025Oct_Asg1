const mainDishes = [
  {
    name: "Steam Chicken Rice",
    price: 5.00,
    img: "assets/images/order/Steam_Chicken_Rice.jpg"
  },
  {
    name: "Roasted Chicken Rice",
    price: 5.00,
    img: "assets/images/order/Roasted_Chicken.webp"
  },
  {
    name: "Lemon Cutlet Rice",
    price: 5.00,
    img: "assets/images/order/Lemon_Cutlet.jpg"
  },
  {
    name: "Dumpling",
    price: 3.00,
    img: "assets/images/order/Dumpling.jpg"
  }
];

const productDiv = document.getElementById("products");
const searchInput = document.getElementById("search");

function displayMainDishes(list) {
  productDiv.innerHTML = "";

  list.forEach(p => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${p.img}" alt="${p.name}">
      <h4>${p.name}</h4>
      <div class="price">$${p.price.toFixed(2)}</div>
    `;
    productDiv.appendChild(card);
  });
}

searchInput.addEventListener("input", () => {
  const value = searchInput.value.toLowerCase();
  const filtered = mainDishes.filter(p =>
    p.name.toLowerCase().includes(value)
  );
  displayMainDishes(filtered);
});

displayMainDishes(mainDishes);
