function log(eventName, data) {
    $('#log').append('<li class="list-group-item"><b>' + eventName + '</b>: ' + data + '</li>');
}

function setConnectionStatus(connected) {
    if (connected) {
        $('#connection').removeClass('fa-frown-o text-danger');
        $('#connection').addClass('fa-smile-o text-success');
    } else {
        $('#connection').removeClass('fa-smile-o text-success');
        $('#connection').addClass('fa-frown-o text-danger');
    }
}

$('#clear-status').click(function () {
    $('#log').html('');
});

function onSSEOpen(e, sse) {
    console.log('OPEN: ', e, sse);
    setConnectionStatus(true);
}

function onSSEError(e, sse) {
    console.log('ERROR: ', e, sse);
    setConnectionStatus(false);
}

////////// Demo cpu usage
var chartOptions = {
    legend: {
        display: false
    },
    maintainAspectRatio: false
};
var cpuChartBg = [
    "#FF6384",
    "transparent",
];
var ramChartBg = [
    "#00FF00",
    "transparent",
];
var cpuChart = new Chart(document.getElementById("server-cpu"), {
    type: 'pie',
    options: chartOptions,
    data: {
        labels: ['CPU (%)', 'Free'],
        datasets: [
            {
                data: [0, 100],
                borderColor: '#000',
                borderWidth: '0.2',
                backgroundColor: cpuChartBg,
                hoverBackgroundColor: cpuChartBg
            }
        ]
    },
});

var ramChart = new Chart(document.getElementById("server-ram"), {
    type: 'pie',
    options: chartOptions,
    data: {
        labels: ['RAM (%)', 'Free'],
        datasets: [
            {
                data: [0, 100],
                borderColor: '#000',
                borderWidth: '0.2',
                backgroundColor: ramChartBg,
                hoverBackgroundColor: ramChartBg
            }
        ]
    },
});

var serverInfoSSE = new EventSource('./src/server-info/libsse.php');
var serverInfoEvent = 'server-info';
serverInfoSSE.addEventListener(serverInfoEvent, function(e) {
    log(serverInfoEvent, e.data);

    var data = JSON.parse(e.data);

    cpuChart.data.datasets[0].data[0] = data.cpu;
    cpuChart.data.datasets[0].data[1] = 100 - data.cpu;
    cpuChart.update();

    ramChart.data.datasets[0].data[0] = data.ram;
    ramChart.data.datasets[0].data[1] = 100 - data.ram;
    ramChart.update();
}, false);

serverInfoSSE.addEventListener('open', function(e) {
    onSSEOpen(e, serverInfoSSE);
}, false);

serverInfoSSE.addEventListener('error', function(e) {
    onSSEError(e, serverInfoSSE);
}, false);

////////// Demo long running task
$('#start-task').click(function () {
    var longTaskSSE = new EventSource('./src/long-task/basic.php');
    var longTaskEvent = 'long-task';
    var progressEl = $('#long-task-progress');
    progressEl.parent().removeClass('hide');

    var button = $(this);
    button.prop('disabled', true);

    longTaskSSE.addEventListener(longTaskEvent, function(e) {
        log(longTaskEvent, e.data);

        var data = e.data;
        progressEl.css('width', data + '%')
            .attr('aria-valuenow', data)
            .html(data + '%');

        if (e.lastEventId == 'ENDED') {
            longTaskSSE.close();
            progressEl.parent().addClass('hide');
            button.prop('disabled', false);
        }
    }, false);

    longTaskSSE.addEventListener('open', function(e) {
        onSSEOpen(e, longTaskSSE);
    }, false);

    longTaskSSE.addEventListener('error', function(e) {
        onSSEError(e, longTaskSSE);
    }, false);
});

$('#start-task').trigger('click');