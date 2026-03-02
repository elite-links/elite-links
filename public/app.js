let users = JSON.parse(localStorage.getItem("users")) || [];

function register(){
const email=document.getElementById("regEmail").value;
const password=document.getElementById("regPassword").value;

users.push({email,password});
localStorage.setItem("users",JSON.stringify(users));

alert("Account created");
window.location="login.html";
}

function login(){

const email=document.getElementById("email").value;
const password=document.getElementById("password").value;

const user=users.find(
u=>u.email===email && u.password===password
);

if(user){
localStorage.setItem("loggedIn","true");
window.location="dashboard.html";
}else{
document.getElementById("error").innerText="Wrong login";
}
}

if(window.location.pathname.includes("dashboard.html")){
if(localStorage.getItem("loggedIn")!=="true"){
window.location="login.html";
}
}

function logout(){
localStorage.removeItem("loggedIn");
window.location="login.html";
}