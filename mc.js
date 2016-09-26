$(function () {

    // TODO: what if no querystring present?
    var code = location.href.split('?')[1]

    $.getJSON('https://aggregate.promisetracker.org/surveys/'+
              code +'/survey-with-responses',
              '',
              dataReceived)

    function plotAll(data) {
        var charts = $('#charts')
        charts.html('')
        $.each(data.survey.inputs, function (i, input) {
            var answerId = input.id
            var contId = 'container' + answerId
            var contSel = '#' + contId
            var container = '<div id="' + contId +
                '" style="min-width: 310px; margin: 0 auto"></div>'
            charts.append(container)
            if (input.input_type == 'date') {
                plotDates(contSel, data, answerId)
            } else if (input.input_type == 'select1') {
                if (input.options.length <= 2) {
                    plotBool(contSel, data, answerId)
                } else {
                    plotManyOptions(contSel, data, answerId)
                }
            }
        })
    }

    function dataReceived(json) {
        console.log(json)
        var data = json.payload


        window.d = data

        // set selectfield options
        var output = ['<option value="none">Nenhum</option>']
        $.each(data.survey.inputs, function (i, val) {
            if (val.input_type == "select1")
                output.push('<option value="'+ val.id +'">'+ val.label +'</option>')
        })
        $('#selectField').html(output.join(''));

        $('#selectField').on('change', function () {
            // set selectvalues options
            var output = ['<option value="none">Nenhum</option>']
            var answerId = this.value
            $.each(getSurveyInputById(data, answerId).options, function (i, val) {
                output.push('<option value="'+ answerId + ',' + i +'">'+ val +'</option>')
            })
            $('#selectValue').html(output.join(''));
        })

        // filter by value
        $('#selectValue').on('change', function () {
            if (this.value == 'none') {
                plotAll(data)}
            else {
                var indexes = this.value.split(',')
                var answerId = parseInt(indexes[0])
                var valueIndex = parseInt(indexes[1])
                var filterValue = getSurveyInputById(data, answerId).options[valueIndex]
                var newData = $.extend(true, {}, data)
                newData.responses = data.responses.filter(function (response) {
                    return getAnswerById(response, answerId).value == filterValue
                })
                plotAll(newData)
            }
        })

        plotAll(data)
    }




    function plotBool(id, data, answerId) {
        var counts = count(data.responses, answerId)
        var values = []
        for (var key in counts) {
            values.push({name: key, y:counts[key]})
        }
        // plot
        $(id).highcharts({
            chart: {
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false,
                type: 'pie'
            },
            title: {
                text: getSurveyInputById(data, answerId).label
            },

            series: [{
                name: 'registros',
                colorByPoint: true,
                data: values
            }]
        })
    }

    function plotManyOptions(id, data, answerId) {

        var counts = count(data.responses, answerId)

        var categories = []
        var values = []
        for (var key in counts) {
            categories.push(key)
            values.push(counts[key])
        }

        // plot
        $(id).highcharts({
            chart: {
                type: 'bar'
            },
            title: {
                text: getSurveyInputById(data, answerId).label
            },
            xAxis: {
                categories: categories,
                title: {
                    text: null
                }
            },
            yAxis: {
                min: 0,
                title: {
                    text: 'Número de registros',
                    align: 'high'
                },
                labels: {
                    overflow: 'justify'
                }
            },
            // tooltip: {
            //     // headerFormat: '<b>{series.name}</b><br>',
            //     headerFormat: '',
            //     pointFormat: '{point.x:%e/%b}: {point.y}'
            // },

            // plotOptions: {
            //     spline: {
            //         marker: {
            //             enabled: true
            //         }
            //     }
            // },

            series: [{
                name: 'registros',
                data: values
            }]
        })
    }


    function plotDates(id, data, answerId) {

        var counts = count(data.responses, answerId)
        // convert counts to array
        var dates = []
        for (var key in counts) {
            dates.push([parseInt(Date.parse(key)), counts[key]])
        }
        dates.sort(function (a, b) {return a[0] - b[0]})

        // plot
        $(id).highcharts({
            chart: {
                type: 'column'
            },
            title: {
                text: getSurveyInputById(data, answerId).label
            },
            // subtitle: {
            //     text: 'Irregular time data in Highcharts JS'
            // },
            xAxis: {
                type: 'datetime',
                dateTimeLabelFormats: { // don't display the dummy year
                    month: '%e. %b',
                    year: '%b'
                },
                title: {
                    text: 'Datas'
                }
            },
            yAxis: {
                title: {
                    text: 'Número de registros'
                },
                min: 0
            },
            tooltip: {
                // headerFormat: '<b>{series.name}</b><br>',
                headerFormat: '',
                pointFormat: '{point.x:%e/%b}: {point.y}'
            },

            series: [{
                name: 'registros',
                data: dates
            }]
        })
    }




    function getSurveyInputById(data, id) {
        for(var i = 0; i< data.survey.inputs.length; i++) {
            if (data.survey.inputs[i].id == id) return data.survey.inputs[i]
        }
        return null
    }

    function getAnswerById(response, id) {
        for(var i = 0; i< response.answers.length; i++) {
            if (response.answers[i].id == id) return response.answers[i]
        }
        return null
    }

    // count number of registers per date
    function count(responses, answerId) {
        var counts = {}
        for(var i = 0; i< responses.length; i++) {
            var date = getAnswerById(responses[i], answerId).value
            counts[date] = counts[date] ? counts[date]+1 : 1
        }
        return counts
    }
});
