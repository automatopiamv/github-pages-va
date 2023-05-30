// We use a function to check if an element is in viewport
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Get all elements with the class 'scroll-animation'
const elements = document.querySelectorAll('.scroll-animation');

// Check if the element is in viewport. If it is, add the 'visible' class
window.addEventListener('scroll', function() {
    elements.forEach(function(element) {
        if (isInViewport(element)) {
            element.style.opacity = "1";
            element.style.transform = "translateX(0px)"; /* Make it appear at its final position */
        }
    });
}, false);
