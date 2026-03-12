const USER_API = "http://localhost:8080/api/users";

// 1. Save or Update User
function saveUser() {
    const userData = {
        id: $('#userId').val(), // Update කරන විට id එක තිබිය යුතුය
        name: $('#userName').val(),
        email: $('#userEmail').val(),
        role: $('#userRole').val()
    };

    $.ajax({
        url: USER_API,
        method: "POST", // Spring Boot හි @PostMapping භාවිතා වේ
        contentType: "application/json",
        data: JSON.stringify(userData),
        success: function (res) {
            alert("User saved successfully!");
            getAllUsers();
        },
        error: function (error) {
            console.error("Error saving user", error);
        }
    });
}

// 2. Get All Users
function getAllUsers() {
    $.ajax({
        url: USER_API,
        method: "GET",
        success: function (res) {
            $('#userTableBody').empty();
            res.forEach(user => {
                $('#userTableBody').append(`
                    <tr>
                        <td>${user.id}</td>
                        <td>${user.name}</td>
                        <td>${user.email}</td>
                        <td><button onclick="deleteUser(${user.id})">Delete</button></td>
                    </tr>
                `);
            });
        }
    });
}

// 3. Delete User
function deleteUser(id) {
    if(confirm("Are you sure?")) {
        $.ajax({
            url: `${USER_API}/${id}`,
            method: "DELETE",
            success: function () {
                getAllUsers();
            }
        });
    }
}