//Set variables
let pathName = window.location.pathname; //To get current URL for navbar active

//Check if document is ready for script
$(document).ready(() => {
    //Assign active class to proper navBar element according to URL
    $('.navbar-nav > li > a[href="' + pathName + '"]').parent().addClass('active');
});