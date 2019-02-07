//Set variables
let pathName = window.location.pathname; //To get current URL for navbar active

//Check if document is ready for script
$(document).ready(() => {
    //Assign active class to proper navBar element according to URL
    $('.navbar-nav > li > a[href="' + pathName + '"]').parent().addClass('active');

    //Confirm Delete 
    $("#deleteForm").submit(function () {
        if ($("input[type='submit']").val() == "delete") {
            alert("Click confirm if you're sure.");
            $("input[type='submit']").val("confirm");
            return false;
        }
    });
});