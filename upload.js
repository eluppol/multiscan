$(function () {
    function initialize() {
        $('#placeholder').html('');
        $('#result-table').hide();
        $('#bar-container').hide();
        $('#progress-bar').width(0);
        $('#result-table tbody').html('');
    }
    var file;
    var dropbox = $("#dropbox");
    var fileInput = $("#file-field");
    initialize();
    fileInput.on("change", function() {
          file = this.files[0];
        });

    $('#upload-btn').on("click", function() {
        if (file) {
        initialize();
        checkAndSend(file);
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

function checkAndSend(file) {
    var reader = new FileReader();
    reader.onload = function() {
       var hash=CryptoJS.SHA256(reader.result);
       console.log(hash.toString(CryptoJS.enc.hex));
       $('#hash').modal('show');
    }
    reader.readAsText(file);
}

function sendFile(file) {
    $('#bar-container').show();
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

    $('#result-table').show();

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
                'last' : 1,
                'limit': 100
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

    $('#placeholder').html("<h3>Scanning is in progress</h3><img src=\"ajax-loader.gif\"/>");
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
                    $("#result-table tbody").append('<tr><td>' + avs[i].full_name + '</td><td>' + result['result'] + '</td></tr>');
                    avs.splice(i, 1);
                } else {
                    i++;
                }
            }
            if (avs.length > 0 && j++ < 25) {
                setTimeout(getResults, 3000);
            } else {    
                $('#placeholder').html("<h3>Scanning completed</h3>");
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
