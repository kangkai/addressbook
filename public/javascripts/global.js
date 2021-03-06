// Userlist data array for filling in info box
var userListData = [];

// DOM Ready =============================================================
$(document).ready(function() {
    refreshPage();

    popupForm();
    file_upload();

    // Username link click
    $('#userList table tbody').on('click', 'td a.linkshowuser', showUserInfo);
    // Delete User link click
    $('#userList table tbody').on('click', 'td a.linkdeleteuser', alertInfo);

    $('#btnModify').button().click(modifyUser);
    $('#btnDelete').button().on('click', deleteUser);
    $('#add-user').button().click(function() {
        $( "#dialog-form" ).dialog( "open" );
    });
});

function alertInfo(event) {
    _.each(userListData, function (obj) {
	console.log(JSON.stringify(obj));
    });
    alert($(this).attr('rel'));
};


function refresh_userlist(data) {
    var tableContent;

    // data is array of user info
    $.each(data, function() {
        tableContent += '<tr>';
        tableContent += '<td><a href="#" class="linkshowuser" rel="' + this._id + '" title="Show Details">' + this.username + '</td>';
        tableContent += '<td>' + this.email + '</td>';
        tableContent += '<td><a href="#" class="linkdeleteuser" rel="' + this._id + '">delete</a></td>';
        tableContent += '</tr>';
    });

    // Inject the whole content string into our existing HTML table
    $('#userList table tbody').html(tableContent);
};

function refresh_userinfo(id) {
    if (!id) {
	// clean up
	$('#UserAvatar').html('');
	$('#name').html('');
	$('#category').html('');
	$('#address').html('');
	$('#email').html('');
	$('#birthday').html('');
	$('#gender').html('');
	$('#notes').html('');

	return;
    }

    var arrayPosition = userListData.map(function(arrayItem) { return arrayItem._id; }).indexOf(id);
    var thisUserObject = userListData[arrayPosition];
    var html = '';

    if (thisUserObject.avatartype && thisUserObject.avatardata) {
	html = '<img src="data:' + thisUserObject.avatartype + ';base64, ' + thisUserObject.avatardata + '" />';
    } else {
	html = '<img src="images/placeholder.png">'
    }

    $('#UserAvatar').html(html);
    $('#name').html(thisUserObject.username);
    $('#category').html(thisUserObject.fullname);
    $('#address').html(thisUserObject.location);
    $('#email').html(thisUserObject.email);
    $('#birthday').html(thisUserObject.age);
    $('#gender').html(thisUserObject.gender);
    $('#notes').html(thisUserObject.notes);

    // set the db ._id which we're showing
    $('#db_id').val(id);
};

// Fill table with data
function populate_users() {

    // jQuery AJAX call for JSON
    $.getJSON('/users/userlist', function(data) {
	userListData = data;
	refresh_userlist(data);
	refresh_userinfo();
    });
};

function refreshPage() {
    populate_users();
};

// Show User Info
function showUserInfo(event) {

    // Prevent Link from Firing
    event.preventDefault();

    // Retrieve username from link rel attribute
    var thisUserId = $(this).attr('rel');

    refresh_userinfo(thisUserId);
};

// Modify User
function modifyUser(event) {
    event.preventDefault();

    $('#is_modify').val("true");
    $( "#dialog-form" ).dialog( "open" );

    return;
};


// Delete User
function deleteUser(event) {

    event.preventDefault();

    var id = $('#db_id').val();
    var username = $('#name').html();

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

function popupForm() {
    var userid = $("#popupUserId"),
	useremail = $("#popupUserEmail"),
	userfullname = $("#popupUserFullname"),
	userage = $("#popupUserAge"),
	userlocation = $("#popupUserLocation"),
	usergender = $("#popupUserGender"),
	usernotes = $("#popupUserNotes");
    var tips = $( ".validateTips" );

    var thisUserId = 0;
    var arrayPosition = 0;
    var thisUserObject = userListData[arrayPosition];

    var allFields = $([]).add(userid).add(useremail).add(userfullname).add(userage).add(userlocation).add(usergender);

    function updateTips(t) {
	tips
            .text( t )
            .addClass( "ui-state-highlight" );
	setTimeout(function() {
            tips.removeClass( "ui-state-highlight", 1500 );
	}, 500 );
    }

    function checkLength( o, n, min, max ) {
	if ( o.val().length > max || o.val().length < min ) {
            o.addClass( "ui-state-error" );
            updateTips( "Length of " + n + " must be between " +
			min + " and " + max + "." );
            return false;
	} else {
            return true;
	}
    }

    function checkRegexp( o, regexp, n ) {
	if ( !( regexp.test( o.val() ) ) ) {
            o.addClass( "ui-state-error" );
            updateTips( n );
            return false;
	} else {
            return true;
	}
    }

    $( "#dialog-form" ).dialog({
	autoOpen: false,
	height: 640,
	width: 460,
	modal: true,
	buttons: {
            "Apply": function() {
		var bValid = true;
		allFields.removeClass( "ui-state-error" );

		bValid = bValid && checkLength( userid, "userid", 3, 16 );
		bValid = bValid && checkLength( useremail, "email", 6, 80 );
		bValid = bValid && checkLength( userfullname, "Full Name", 3, 80 );
		bValid = bValid && checkLength( userage, "Age", 1, 3 );
		bValid = bValid && checkLength( userlocation, "Location", 3, 80 );
		bValid = bValid && checkLength( usergender, "Gender", 1, 6 );

		bValid = bValid && checkRegexp( userid, /^[a-z]([0-9a-z_])+$/i, "Username may consist of a-z, 0-9, underscores, begin with a letter." );
		// From jquery.validate.js (by joern), contributed by Scott Gonzalez: http://projects.scottsplayground.com/email_address_validation/
		bValid = bValid && checkRegexp( useremail, /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i, "eg. ui@jquery.com" );
		// bValid = bValid && checkRegexp( password, /^([0-9a-zA-Z])+$/, "Password field only allow : a-z 0-9" );

		if ( bValid ) {

		    var userInfo = {
			'db_id': $('#db_id').val(),
			'username': $('#dialog-form fieldset input#popupUserId').val(),
			'email': $('#dialog-form fieldset input#popupUserEmail').val(),
			'fullname': $('#dialog-form fieldset input#popupUserFullname').val(),
			'age': $('#dialog-form fieldset input#popupUserAge').val(),
			'location': $('#dialog-form fieldset input#popupUserLocation').val(),
			'gender': $('#dialog-form fieldset input#popupUserGender').val(),
			'notes': $('#dialog-form fieldset textarea#popupUserNotes').val(),
			'avatarid': $('#avatarId').val()
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

		    $( this ).dialog( "close" );
		}
            },
            Cancel: function() {
		$( this ).dialog( "close" );
            }
	},
	open: function(event, ui) {
	    // event triggered after dialog opened.

	    if ($('#is_modify').val()) {
		thisUserId = $('#db_id').val();
		arrayPosition = userListData.map(function(arrayItem) { return arrayItem._id; }).indexOf(thisUserId);
		thisUserObject = userListData[arrayPosition];

		var src = '';

		if (thisUserObject.avatartype && thisUserObject.avatardata) {
		    src = 'data:' + thisUserObject.avatartype + ';base64, ' + thisUserObject.avatardata;
		} else {
		    src = 'images/placeholder.png';
		}

		$('#avatarupload').attr("src", src);

		userid.val(thisUserObject.username);
		useremail.val(thisUserObject.email);
		userfullname.val(thisUserObject.fullname);
		userage.val(thisUserObject.age);
		userlocation.val(thisUserObject.location);
		usergender.val(thisUserObject.gender);
		usernotes.val(thisUserObject.notes);
	    } else {
		$('#db_id').val('');
	    }
	},
	close: function() {
            allFields.val( "" ).removeClass( "ui-state-error" );
            usernotes.val( "" ).removeClass( "ui-state-error" );
	    $("#is_modify").val('');
	    $('#avatarupload').attr("src", 'images/placeholder.png');
	}
    });

};

function file_upload() {
    'use strict';

    $('#avatarupload').click(function () {
	$('#fileupload').trigger('click');
    });

    $('#fileupload').fileupload({
        url: '/users/avatar',
        dataType: 'json',
        done: function (e, data) {
            $.each(data.result.files, function (index, file) {
		var src = 'data:' + file.avatartype + ';base64, ' + file.avatardata;

		$('#avatarupload').attr("src", src);
		$('#avatarId').val(file._id);
		console.log(file);
            });
        },
        progressall: function (e, data) {
            var progress = parseInt(data.loaded / data.total * 100, 10);
            $('#progress .progress-bar').css(
                'width',
                progress + '%'
            );
        }
    }).prop('disabled', !$.support.fileInput)
        .parent().addClass($.support.fileInput ? undefined : 'disabled');
};
