/* ==============================
   LINKTREE SYSTEM
============================== */

let links = JSON.parse(localStorage.getItem("links")) || [
  {
    title: "Unlock Access - $5",
    url: "https://www.paypal.com" // replace with YOUR PayPal link
  }
];

const linkContainer = document.getElementById("links");

function renderLinks() {

  if(!linkContainer) return;

  linkContainer.innerHTML = "";

  links.forEach((link,index)=>{

    const a = document.createElement("a");

    a.className = "link";
    a.href = link.url;
    a.target = "_blank";
    a.innerHTML = `
      ${link.title}
      <span onclick="deleteLink(${index})" 
      style="float:right;cursor:pointer;">❌</span>
    `;

    linkContainer.appendChild(a);
  });

  localStorage.setItem("links",JSON.stringify(links));
}

function addLink(){

  const title = document.getElementById("title");
  const url = document.getElementById("url");

  if(!title || !url) return;

  if(title.value === "" || url.value === "") return;

  links.push({
    title:title.value,
    url:url.value
  });

  title.value="";
  url.value="";

  renderLinks();
}

function deleteLink(index){
  links.splice(index,1);
  renderLinks();
}

renderLinks();



/* ==============================
   MEMBERSHIP SYSTEM
============================== */

let users = JSON.parse(localStorage.getItem("users")) || [];


/* REGISTER */

function register(){

  const email = document.getElementById("regEmail");
  const password = document.getElementById("regPassword");

  if(!email || !password) return;

  if(email.value === "" || password.value === "") return;

  users.push({
    email:email.value,
    password:password.value
  });

  localStorage.setItem("users",JSON.stringify(users));

  alert("Account Created ✅");

  window.location = "login.html";
}


/* LOGIN */

function login(){

  const email = document.getElementById("email");
  const password = document.getElementById("password");

  if(!email || !password) return;

  const user = users.find(
    u => u.email === email.value && u.password === password.value
  );

  if(user){

    localStorage.setItem("loggedIn","true");
    localStorage.setItem("userEmail",user.email);

    window.location="dashboard.html";

  }else{

    const error=document.getElementById("error");
    if(error) error.innerText="Wrong login ❌";

  }
}


/* DASHBOARD PROTECTION */

if(window.location.pathname.includes("dashboard.html")){

  if(localStorage.getItem("loggedIn")!=="true"){
    window.location="login.html";
  }

}


/* SHOW USER EMAIL */

const welcome = document.getElementById("welcome");

if(welcome){
  welcome.innerText =
    "Welcome " + (localStorage.getItem("userEmail") || "");
}


/* LOGOUT */

function logout(){
  localStorage.removeItem("loggedIn");
  localStorage.removeItem("userEmail");
  window.location="login.html";
}