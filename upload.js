$(function () {
    var file;
    $('#result-table').hide();
    var dropbox = $("#dropbox");
    var fileInput = $("#file-field");
    fileInput.on("change", function() {
          file = this.files[0];
        });

    $('#upload-btn').on("click", function() {
        if (file) {
          sendFile(file);
        }
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
        dropbox.text(event.originalEvent.dataTransfer.files[0].name);
        sendFile(event.originalEvent.dataTransfer.files[0]);
    });
});

function sendFile(file) {
    var formData = new FormData();
    formData.append('upload', file);
    var xhr = new XMLHttpRequest();
    xhr.open("POST", '/api/uploads');
    xhr.onload = function () {
        if (this.status == 200) {
	    var response = JSON.parse(this.response); 
            //console.log(response);
            processFile(response.result.id);
        }
    }
    xhr.onprogress = function (event) {
        $('#progress-bar').width(Math.round(event.loaded / event.total * 100) + '%');
    }
    xhr.send(formData);
}

function processFile (fileId) {
    var avs, results;

    function getAntiviruses() {
        $.ajax({
            dataType: "json",
            url: '/api/antiviruses',
            data: {
                'fields' : ['id', 'full_name'],
                'active' : 1,
                'limit' : 100,
            },
            success: function (antiviruses) {
                if (antiviruses['status'] == 200) {
                    avs = antiviruses['result'];
                    //console.log('avs:');
                    //console.log(avs);
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

    function getResults(id) {
        if (!id) { id=fileId; }
        //console.log('getting result id=' + id);
        $.ajax({
            dataType: "json",
            url: '/api/results',
            data: {
                'file_id' : id,
                'last' : 1
            },
            success: function (data) {
                if (data['status'] == 200) {
                   results = data['result'];
                    //console.log('results:');
                    //console.log(results);
                   updateTable();
               }
            },
            error: function (jqXHR, status, err) {
                $(placeholder).text('status: ' + jqXHR['status'] + '\nerror: ' + err + '\nResponse:' + JSON.stringify(jqXHR));
            }
        });
    }

    $('#placeholder').text('Scanning');
    $('#result-table').html('');
    var j = 0;

    function updateTable() {
        //console.log("update table");
        if (avs && results) {
            //console.log('length: ', avs.length);
            var i = 0;
            while (i < avs.length) {
                var result = find(results, 'av_id', avs[i].id);
                if (result) { 
                    //console.log('found');
                    $("#result-table").append('<tr><td>' + avs[i].full_name + '</td><td>' + result['result'] + '</td></tr>');
                    avs.splice(i, 1);
                } else {
                    i++;
                }
            }
            if (avs.length > 0 && j++ < 15) {
                $('#placeholder').append('.');
                setTimeout(getResults, 3000);
            } else {    
                $('#placeholder').text('Scanned!');
            }
        }
    }

    getAntiviruses();
    getResults(fileId);
}

function find(arr, key_name, key) {
    for (var i = 0; i<arr.length; i++) { 
        if (arr[i][key_name] == key) {
            return arr[i];
        }
    }
}
