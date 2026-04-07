const menu = document.getElementById('menu')
const menu2 = document.getElementById('menu2')
const pageNav = document.getElementById('pageNav')
const overlay = document.getElementById('overlay')

let menuOpen = false

function openMenu() {
    menuOpen = true
    overlay.style.display = 'block'
    pageNav.style.left = '25px'
}

function closeMenu() {
    menuOpen = false
    overlay.style.display = 'none'
    pageNav.style.left = '-350px'
}

menu.addEventListener('click', function() {
    if(!menuOpen) {
        openMenu()
    }
})

menu2.addEventListener('click', function() {
    if(!menuOpen) {
        openMenu()
    }
})

overlay.addEventListener('click', function () {
    if (menuOpen) {
        closeMenu()
    }
})
