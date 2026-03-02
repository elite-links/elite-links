const toggle = document.getElementById("themeToggle");
const body = document.body;

// Load saved theme
if(localStorage.getItem("theme") === "dark"){
    body.classList.add("dark");
}

toggle.onclick = () => {
    body.classList.toggle("dark");

    if(body.classList.contains("dark")){
        localStorage.setItem("theme","dark");
    }else{
        localStorage.setItem("theme","light");
    }
};