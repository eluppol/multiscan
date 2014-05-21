$(function () {
    var dropbox = $("#dropbox");
    var fileInput = $("#file-field");
    fileInput.on("change", function() {
          processFile(this.files[0]);
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
        processFile(event.originalEvent.dataTransfer.files[0]);
    });
});

function sendFile(file) {
    var reader = new FileReader();
 
    reader.onload = function() {    
        var xhr = new XMLHttpRequest();    
        
        xhr.upload.addEventListener("progress", function(e) {
          if (e.lengthComputable) {
            var progress = (e.loaded * 100) / e.total;
            /* ... обновляем инфу о процессе загрузки ... */
          }
        }, false);
        
        /* ... можно обрабатывать еще события load и error объекта xhr.upload ... */
     
        xhr.onload = function () {
            if(this.status == 200) {
              /* ... все ок! смотрим в this.responseText ... */
            } else {
              /* ... ошибка! ... */
            }
        };
        xhr.open("POST", "http://avms.dit.in.ua");

        // Составляем заголовки и тело запроса к серверу,  в котором и отправим файл.

        var boundary = "xxxxxxxxx";
        // Устанавливаем заголовки.
        xhr.setRequestHeader('Content-type', 'multipart/form-data; boundary="' + boundary + '"');
        xhr.setRequestHeader('Cache-Control', 'no-cache');

        // Формируем тело запроса.
        var body = "--" + boundary + "\r\n";
        body += "Content-Disposition: form-data; name='superfile'; filename='" + unescape( encodeURIComponent(file.name)) + "'\r\n"; // unescape позволит отправлять файлы с русскоязычными именами без проблем.
        body += "Content-Type: application/octet-stream\r\n\r\n";
        body += reader.result + "\r\n";
        body += "--" + boundary + "--";

        // Пилюля от слабоумия для Chrome, который гад портит файлы в процессе загрузки.        
        if (!XMLHttpRequest.prototype.sendAsBinary) {
            XMLHttpRequest.prototype.sendAsBinary = function(datastr) {
                function byteValue(x) {
                    return x.charCodeAt(0) & 0xff;
                }
                var ords = Array.prototype.map.call(datastr, byteValue);
                var ui8a = new Uint8Array(ords);
                this.send(ui8a.buffer);
            }
        }

        // Отправляем файлы.
        if(xhr.sendAsBinary) {
            // Только для Firefox
            xhr.sendAsBinary(body);
        } else {
            // Для остальных (как нужно по спецификации W3C)
            xhr.send(body);
        }
  };
  // Читаем файл
  reader.readAsBinaryString(file); 

    return 1;
}

function processFile (file) {

    var fileId = sendFile(file);

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
