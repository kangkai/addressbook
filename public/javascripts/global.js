// Userlist data array for filling in info box
var userListData = [];

// DOM Ready =============================================================
$(document).ready(function() {
    // Populate the user table on initial page load
    populateTable();
    // Username link click
    $('#userList table tbody').on('click', 'td a.linkshowuser', showUserInfo);
    // Delete User link click
    $('#userList table tbody').on('click', 'td a.linkdeleteuser', alertInfo);

    $('#btnModify').on('click', modifyUser);
    $('#btnDelete').on('click', deleteUser);
});



function alertInfo(event) {
    _.each(userListData, function (obj) {
	console.log(JSON.stringify(obj));
    });
    alert($(this).attr('rel'));
};

// Fill table with data
function populateTable() {
    // Empty content string
    var tableContent = '';

    // jQuery AJAX call for JSON
    $.getJSON('/users/userlist', function(data) {
	userListData = data;

        // For each item in our JSON, add a table row and cells to the content string
        $.each(data, function() {
            tableContent += '<tr>';
            tableContent += '<td><a href="#" class="linkshowuser" rel="' + this._id + '" title="Show Details">' + this.username + '</td>';
            tableContent += '<td>' + this.email + '</td>';
            tableContent += '<td><a href="#" class="linkdeleteuser" rel="' + this._id + '">delete</a></td>';
            tableContent += '</tr>';
        });

        // Inject the whole content string into our existing HTML table
        $('#userList table tbody').html(tableContent);
    });
};

function refreshPage() {
    // Clear the form inputs
    $('#userInfo fieldset input').val('');
    $('#userInfo fieldset textarea').val('');

    // Update the table
    populateTable();
};

// Show User Info
function showUserInfo(event) {

    // Prevent Link from Firing
    event.preventDefault();

    // Retrieve username from link rel attribute
    var thisUserId = $(this).attr('rel');

    // Get Index of object based on id value
    var arrayPosition = userListData.map(function(arrayItem) { return arrayItem._id; }).indexOf(thisUserId);

    // Get our User Object
    var thisUserObject = userListData[arrayPosition];

    // populate into form
    $('#userInfo fieldset input#inputUserId').val(thisUserObject._id);
    $('#userInfo fieldset input#inputUserName').val(thisUserObject.username);
    $('#userInfo fieldset input#inputUserEmail').val(thisUserObject.email);
    $('#userInfo fieldset input#inputUserFullname').val(thisUserObject.fullname);
    $('#userInfo fieldset input#inputUserAge').val(thisUserObject.age);
    $('#userInfo fieldset input#inputUserLocation').val(thisUserObject.location);
    $('#userInfo fieldset input#inputUserGender').val(thisUserObject.gender);
    $('#userInfo fieldset textarea#textareaUserNotes').val(thisUserObject.notes);

};

// Modify User
function modifyUser(event) {
    event.preventDefault();

    // Super basic validation - increase errorCount variable if any fields are blank
    var errorCount = 0;
    $('#userInfo input').each(function(index, val) {
        if($(this).val() === '') { errorCount++; }
    });

    // Check and make sure errorCount's still at zero
    if(errorCount === 0) {

        // If it is, compile all user info into one object
        var userInfo = {
            '_id': $('#userInfo fieldset input#inputUserId').val(),
            'username': $('#userInfo fieldset input#inputUserName').val(),
            'email': $('#userInfo fieldset input#inputUserEmail').val(),
            'fullname': $('#userInfo fieldset input#inputUserFullname').val(),
            'age': $('#userInfo fieldset input#inputUserAge').val(),
            'location': $('#userInfo fieldset input#inputUserLocation').val(),
            'gender': $('#userInfo fieldset input#inputUserGender').val(),
            'notes': $('#userInfo fieldset textarea#textareaUserNotes').val()
        };

        // Use AJAX to post the object to our adduser service
        $.ajax({
            type: 'POST',
            data: userInfo,
            url: '/users/modifyuser',
            dataType: 'JSON'
        }).done(function( response ) {

            // Check for successful (blank) response
            if (response.msg === '') {
		refreshPage();
            }
            else {

                // If something goes wrong, alert the error message that our service returned
                alert('Error: ' + response.msg);

            }
        });
    }
    else {
        // If errorCount is more than 0, error out
        alert('Please fill in all fields');
        return false;
    }
};


// Delete User
function deleteUser(event) {

    event.preventDefault();

    var id = $('#userInfo fieldset input#inputUserId').val();
    var username = $('#userInfo fieldset input#inputUserFullname').val();

    // Pop up a confirmation dialog
    var confirmation = confirm('Are you sure you want to delete this user?\n\n' + username);

    // Check and make sure the user confirmed
    if (confirmation === true) {

        // If they did, do our delete
        $.ajax({
            type: 'DELETE',
            url: '/users/deleteuser/' + id
        }).done(function( response ) {

            // Check for a successful (blank) response
            if (response.msg === '') {
            }
            else {
                alert('Error: ' + response.msg);
            }

	    refreshPage();
        });

    }
    else {

        // If they said no to the confirm, do nothing
        return false;

    }

};
