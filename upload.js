$(function () {
    var dropbox = $("#dropbox");
    var fileInput = $("#file-field");
    fileInput.on("change", function() {
          sendFile(this.files[0]);
        });

    dropbox.on("dragover", function(event) {
        event.preventDefault();  
        event.stopPropagation();
        $(this).addClass('dragging');
    });

    dropbox.on("dragleave", function(event) {
        event.preventDefault();  
        event.stopPropagation();
        $(this).removeClass('dragging');
    });

    dropbox.on("drop", function (event) {
        event.preventDefault();  
        event.stopPropagation();
        sendFile(event.originalEvent.dataTransfer.files[0]);
    });
});

function sendFile(file) {
    var formData = new FormData();
    formData.append('upload', file);
    var xhr = new XMLHttpRequest();
    xhr.open("POST", '/apr/uploads');
    xhr.onload = function (response) {
        //if (response.status == 200) {
            console.log(response);
        //}
    }
    xhr.send(formData);
}

function processFile (fileId) {
    var avs, results;

    function getAntiviruses() {
        $.ajax({
            dataType: "json",
            url: './api/antiviruses',
            data: {
                'fields' : ['id', 'full_name'],
                'active' : 1,
                'limit' : 100,
            },
            success: function (antiviruses) {
                if (antiviruses['status'] == 200) {
                    avs = antiviruses['result'];
                    updateTable();
                }   
            },

            error: function (jqXHR, status, err) {
                if (status > 500) {
                    $(placeholder).html('<h2>ORACUL IS DEAD!</h2><br><h1>GAME OVER</h1>');
                } else if (status == 400) {
                    $(placeholder).html('<h2>NO DATA</h2>');
                } else {
                    $(placeholder).text('status: ' + jqXHR['status'] + '\nerror: ' + err + '\nResponse: ' + JSON.stringify(jqXHR));
                }
            }
        });
    }

    function getResults() {
        $.ajax({
            dataType: "json",
            url: './api/results',
            data: {
                'file_id' : 35,
                'from' : from,
            },
            success: function (data) {
                if (data['status'] == 200) {
                   results = data['results'];
                   updateTable();
               }
            },
            error: function (jqXHR, status, err) {
                $(placeholder).text('status: ' + jqXHR['status'] + '\nerror: ' + err + '\nResponse:' + JSON.stringify(jqXHR));
            }
        });
    }

    function updateTable() {
        if (avs && results) {
            var i = 0;
            while (i < avs.length) {
                var result = results.find(avs[i].id);
                if (result) { //Wrong
                    $("#results-table tr:last").after('<tr><td>' + av[i].full_name + '</td><td>' + result['result'] + '</td></tr>');
                    avs.splice(i, 1);
                } else {
                    i++;
                }
            }
            if (avs.length > 0) {
                getResults();
            }
        }
    }
}
