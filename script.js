let json = "";
let allResArray = [];
let selectedResArray = [];
let sortOrder="";

fetch("http://localhost:3001/restaurants")
  .then(res => res.json())
  .then(data => {
    json = JSON.parse(data.response.scriptResult);
    const fetchImagePromises = [];

    Object.entries(json).forEach(([key, value]) => {
      const imagePromise = fetch("http://localhost:3001/picture/" + value.recordID)
        .then(res => res.json())
        .then(data => {
          json[key].Picture = data;
          console.log(json)
        })
        .catch(err => {
          console.warn(`Nie udało się pobrać obrazka dla ${key}`, err);
        });

      fetchImagePromises.push(imagePromise);

      allResArray.push(key);
      selectedResArray.push(key);
    });

    return Promise.all(fetchImagePromises);
  })
  .then(() => {
    renderRestaurantCards(json, selectedResArray);
  })
  .catch(err => {
    console.error("Błąd:", err);
  })
  

document.querySelector(".search-btn").addEventListener("click", (e)=>{
  let filterValue = document.querySelector(".search-form-input").value
  selectedResArray = allResArray.filter(str=> str.toLowerCase().includes(filterValue))
  renderRestaurantCards(json, selectedResArray)
  console.log(selectedResArray)
})

document.querySelector(".cancel-btn").addEventListener("click", (e)=>{
  document.querySelector(".search-form-input").value = ""
  selectedResArray = allResArray.slice()
  renderRestaurantCards(json, selectedResArray)
  console.log(selectedResArray)
})

document.querySelector(".go-back-btn").addEventListener("click", (e)=>{
  renderRestaurantCards(json, selectedResArray)
  console.log(selectedResArray)
})

document.querySelector(".sort-btn").addEventListener("click", (e)=>{
  console.log(sortOrder)
  if(sortOrder == "asc"){
    selectedResArray.sort((a, b) => b.localeCompare(a))
    renderRestaurantCards(json, selectedResArray)
    sortOrder = "desc"
    console.log(sortOrder)
  }else{
    selectedResArray.sort()
    renderRestaurantCards(json, selectedResArray)
    console.log(selectedResArray)
    sortOrder = "asc"
    console.log(sortOrder)
  }
})

function renderRestaurantCards(json, selectedKeys) {
  const main = document.querySelector(".main")
  const table = document.createElement("table")
  table.classList.add("restaurantCardsTable")
  main.innerHTML = ""

  selectedKeys.forEach(key => {
    const restaurant = json[key]
    if (!restaurant) return

    const td = document.createElement("td")
    td.classList.add("restaurantCard")

    const img = document.createElement("img")
    img.classList.add("restaurantImg", "image")
    img.alt = "restaurantPicture"
    img.src = restaurant.Picture?.base64
      ? `data:image/jpeg;base64,${restaurant.Picture.base64}`
      : "default.jpg"

    const name = document.createElement("h3")
    name.classList.add("restaurantName")
    name.textContent = restaurant.name || key

    const price = document.createElement("p")
    price.classList.add("restaurantPrices")
    price.textContent = restaurant.avgPrice ? `${restaurant.avgPrice} pln` : "brak ceny"

    td.appendChild(img)
    td.appendChild(name)
    td.appendChild(price)
    table.appendChild(td)
    main.appendChild(table)
  });
  
  let resCards = document.querySelectorAll(".restaurantCard")
  resCards.forEach((el) => {el.addEventListener("click", (e)=>{renderRestaurantDetails(e.target.parentElement.querySelector('h3').innerHTML)})})

  let goBack = document.querySelector(".go-back-btn")
  goBack.classList.add("display-none")
  
  let searchElements = document.querySelector(".search").children
  for( let el of searchElements) {
    el.classList.remove("display-none")
  }
}



function renderRestaurantDetails(selectedRestaurant) {

  const main = document.querySelector(".main")
  main.innerHTML = ""

  recid = json[selectedRestaurant].recordID

  let menuJson = "{}"

  fetch("http://localhost:3001/restaurant/"+recid)
  .then(res => res.json())
  .then(data => {
    menuJson = JSON.parse(data.response.scriptResult)

  const restaurantSection = document.createElement("section")
  restaurantSection.className = "restaurantSection"

  const img = document.createElement("img")
  img.src = json[selectedRestaurant].Picture?.base64
      ? `data:image/jpeg;base64,${json[selectedRestaurant].Picture.base64}`
      : "default.jpg"
  img.className = "restaurantPicture"
  restaurantSection.appendChild(img)

  const article = document.createElement("article")
  article.className = "restaurantDetails"

  const h1 = document.createElement("h1")
  h1.textContent = json[selectedRestaurant].name || "Nazwa Restauracji"

  const line1 = document.createElement("span")
  line1.className = "addressLine"
  line1.innerHTML = `<p>${json[selectedRestaurant].city || "Miasto"}</p><p>${json[selectedRestaurant].postal || "00-000"}</p>`

  const line2 = document.createElement("span")
  line2.className = "addressLine"
  line2.innerHTML = `<p>${json[selectedRestaurant].street || "Ulica"}</p><p>${json[selectedRestaurant].streetNo || "1"}</p>`
  
  const desc = document.createElement("p")
  desc.className = "restaurantDescription"
  desc.innerHTML =json[selectedRestaurant].desc

  article.appendChild(h1)
  article.appendChild(line1)
  article.appendChild(line2)
  article.appendChild(desc)
  restaurantSection.appendChild(article)

  const menuSection = document.createElement("section")
  menuSection.className = "menuSection"

  const menuHeader = document.createElement("h3");
  menuHeader.className = "sectionHeader";
  menuHeader.textContent = "Menu";

  const menuList = document.createElement("ul");

  const categoryMap = {
    "1": "Przystawki",
    "2": "Dania główne",
    "3": "Desery",
    "4": "Napoje"
  };

  const categorized = {};

  for (const key in menuJson.menu) {
    const item = menuJson.menu[key];
    if (!categorized[item.category]) categorized[item.category] = [];
    categorized[item.category].push(item.name);
  }

  for (const cat of Object.keys(categoryMap)) {
    if (!categorized[cat]) continue;
    const categoryItem = document.createElement("li");
    categoryItem.className = "menuCategory";
    categoryItem.textContent = categoryMap[cat];
    menuList.appendChild(categoryItem);


    categorized[cat].forEach(name => {
      const item = document.createElement("li");
      item.className = "menuItem";
      item.textContent = name;
      menuList.appendChild(item);
    });
  }

  menuSection.appendChild(menuHeader);
  menuSection.appendChild(menuList);

  const commentsSection = document.createElement("section");
  commentsSection.className = "commentsSection";


  const commentsHeader = document.createElement("h3");
  commentsHeader.className = "sectionHeader";
  commentsHeader.textContent = "Komentarze";


  const commentsList = document.createElement("ul");


  for (const id in menuJson.comments) {
    const comment = menuJson.comments[id];
    const li = document.createElement("li");
    li.className = "comment";

    const header = document.createElement("h5");
    header.className = "commentHeader";
    header.innerHTML = `<p>${comment.user}</p><p>${comment.rate}</p>`;

    const text = document.createElement("p");
    text.className = "commentText";
    text.textContent = comment.comment;

    li.appendChild(header);
    li.appendChild(text);
    commentsList.appendChild(li);
  }

  commentsSection.appendChild(commentsHeader);
  commentsSection.appendChild(commentsList);

  main.appendChild(restaurantSection);
  main.appendChild(menuSection);
  main.appendChild(commentsSection);

  let goBack = document.querySelector(".go-back-btn")
  goBack.classList.remove("display-none")
  
  let searchElements = document.querySelector(".search").children
  for( let el of searchElements) {
    console.log(el)
    el.classList.add("display-none")
  }

  })
  .catch(err => {
    console.error("Błąd:", err)
  })
}

