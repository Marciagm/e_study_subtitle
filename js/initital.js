requirejs.config({
    paths: {
      peaks: 'threeParty/peaks.min',
      jquery: "threeParty/jquery-2.1.4.min",
      utility: 'js/utility',
      mCustomScrollbar : "threeParty/jquery.mCustomScrollbar.concat.min",
      localstorage:"js/localstorage",
      videoPlayer:"js/videoPlayer",
      videoInfo:"js/videoInfo"
    }
});
require(['jquery',"videoPlayer","localstorage","videoInfo"], function($,player,localstorage,videoInfo) {
  initVideoInfo();
});
require(['jquery', 'peaks'], function ($, Peaks) {
    var globalSegments = {};
    var options = {
      container: document.getElementById('peaks-container'),
      mediaElement: document.querySelector('video'),
      dataUri: {
        arraybuffer: 'data/ad512d90-8a31-4df4-872b-876a378824bd.dat',
        json: 'data/ad512d90-8a31-4df4-872b-876a378824bd.json'
      },
      keyboard: false,
      height: 150,
      // Colour for the overview waveform rectangle that shows what the zoom view shows
      overviewHighlightRectangleColor: 'red',
      // Colour for the zoomed in waveform
      zoomWaveformColor: 'rgba(0, 225, 128, 1)',
      // Colour for the overview waveform
      overviewWaveformColor: 'rgba(0, 0, 0, 0.2)',
      // Colour of the play head(move line)
      playheadColor: 'rgba(0, 0, 0, 1)',
      // Colour of the axis gridlines
      axisGridlineColor: '#ccc',
      // Colour of the axis labels
      axisLabelColor: '#aaa',
      // 覆盖在总体波形图上面的矩形宽度
      zoomLevels: [512, 1024, 2048, 4096],
      pointMarkerColor:     'red', //Color for the point marker
      /**
       * Colour for the in marker of segments
       */
      //inMarkerColor:         'black',
      /**
       * Colour for the out marker of segments
       */
      outMarkerColor:        'red',
    };
    var peaksInstance = Peaks.init(options);
    // 提出来封装成单独的模块
    var utility = {
        /**
         * 将单位为s的时间戳转换为时间格式 eg: 10:23:23.22
         * 
         * @param {timeStamp} string 时间戳
         */
        getTime: function (timeStamp) {
            var formatTime = '';
            var hour = Math.floor(timeStamp / 3600);
            var minute = Math.floor(timeStamp / 60);
            var seconds = Math.round(timeStamp % 60 * 100) / 100;
            if (hour && hour < 10) {
              formatTime = '0' + hour + ':';
            }
            else {
              formatTime = hour + ':';
            }
            if (minute < 10) {
               formatTime += '0' + minute + ':';
            }
            else {
              formatTime += minute + ':'
            }
            formatTime += seconds >= 10 ? seconds : '0' + seconds;
            return formatTime;
        },

        /**
         * 获取textarea中的字数（其他的input也okay）
         */
        getLength: function (id) {
            var content = $('#' + id).val();
            return content.split(/\s+/).length;
        },

        /** 
         * 更新显示li显示数据 TODO 再抽象出来
         *
         * @param {segment} string segment
         */
        updateData: function (segment) {
            var textId = 'text_' + segment.id;
            globalSegments[textId].startTime = utility.getTime(segment.startTime);
            globalSegments[textId].alltime = Math.round((segment.endTime - segment.startTime) * 100) / 100;
            
            var wps = Math.round(globalSegments[textId].wordsCount / globalSegments[textId].alltime * 100) / 100;

            $('#text_' + segment.id + ' .start-time').html(globalSegments[textId].startTime);
            $('#text_' + segment.id + ' .js_alltime').html(globalSegments[textId].alltime + 'seconds');
            $('#text_' + segment.id + ' .js_wps').html(wps + 'WPS');
        },

        /**
         * 添加textarea
         *
         * @param {Object} peaksInstance instance实例
         */
        addTextArea: function (peaksInstance) {
          var segmentObj = {};
            // A new segment created
          var allSegments = peaksInstance.segments.getSegments();
          var currentSegment = allSegments[allSegments.length -1];
          var startTime = currentSegment.startTime;
          var endTime = currentSegment.endTime;
          var textId = 'text_' + (currentSegment.id || 'segment');
          segmentObj.textId = textId;
          segmentObj.startTime = utility.getTime(startTime);
          segmentObj.alltime = Math.round((endTime - startTime) * 100) / 100;
          segmentObj.wordsCount = 0;
          // edit words
          // add a li
          var li = [
              '<li class="active" data-pindex="29" data-index="29" id="{@textId}">',
                    '<div class="subtitle">',
                        '<div class="subspan">',
                              '<span class="start-time">{@startTime}</span>',
                        '</div>',
                        '<div class="sub-content">',
                             '<div class="txt">Koreanclass101.com Hanna Hanna Hangul</div>',
                             '<textarea name="" cols="30" rows="10" placeholder="edit..."></textarea>',
                        '</div>',
                        '<div class="subspan">',
                            '<span class="js_wps">{@wps}</span>',
                            '<span class="js_alltime">{@alltime}seconds</span>',
                            '<span class="js_wordsCount">0word</span>',
                            '<span class="delete-icon">——</span>',
                        '</div>',
                    '</div>',
                    '<div class="buttomline"></div>',
                 '</li>'
          ].join('');
          li = li.replace('{@startTime}', segmentObj.startTime)
                 .replace('{@alltime}', segmentObj.alltime)
                 .replace('{@textId}', segmentObj.textId)
                 .replace('{@wps}', '0WPS');
          $('#contentList').prepend(li);  
          // store in global parametes
          globalSegments[textId] = segmentObj;      
          // tetxarea监听以修改字数等信息
          $('#' + textId + ' textarea').on('propertychange input', function () {
              // TODO more accurate
              var wordsCount = $(this).val().replace(/\s+$/, '').split(/\s+/).length;
              globalSegments[textId].wordsCount = wordsCount;
              var alltime = globalSegments[textId].alltime;
              var wps = alltime ? Math.round(wordsCount / alltime * 100) / 100 : 0;
              $(this).parent().parent().find('.js_wordsCount').html(wordsCount + 'words');
              $(this).parent().parent().find('.js_wps').html(wps + 'WPS');
          }).blur(function () {
              // store the content in localstorage
              localStorage.setItem('textId', $(this).val());
              // when send?
              // editable?
          })
        },

        /**
         * 封装后的添加片段事件
         *
         * @param {Object} instance instance实例
         * @param {Object} segment 要添加的片段
         */
        addSegment: function (instance, segment) {
          // 第一步添加片段
          instance.segments.add([segment]);
          // 第二步添加textarea
          this.addTextArea(instance);
        }
    }
    peaksInstance.on('segments.dragged', function (segment) {
        console.log(segment);
        // change content TODO容错处理
        utility.updateData(segment);        
    })
    peaksInstance.on('dbclickAddSegment', function () {
        console.log('dbclickAddSegment');
        var segment = {
          startTime: peaksInstance.time.getCurrentTime(),
          endTime: peaksInstance.time.getCurrentTime() + 1,
          editable: true
        }
        utility.addSegment(peaksInstance, segment);
    })
    $('#createSegment').click(function (e) {
        var segmentObj = {};
        var startTime = peaksInstance.time.getCurrentTime();
        var  endTime = startTime + 20;
        var  segmentEditable = true;
        peaksInstance.segments.add(startTime, endTime, segmentEditable);
        // A new segment created
        var allSegments = peaksInstance.segments.getSegments();
        var currentSegment = allSegments[allSegments.length -1];
        var textId = 'text_' + (currentSegment.id || 'segment');
        segmentObj.textId = textId;
        segmentObj.startTime = utility.getTime(startTime);
        segmentObj.alltime = Math.round((endTime - startTime)*100) / 100;
        segmentObj.wordsCount = 0;
        // edit words
        // add a li
        var li = [
            '<li class="active" data-pindex="29" data-index="29" id="{@textId}">',
                  '<div class="subtitle">',
                      '<div class="subspan">',
                            '<span class="start-time">{@startTime}</span>',
                      '</div>',
                      '<div class="sub-content">',
                           '<div class="txt">Koreanclass101.com Hanna Hanna Hangul</div>',
                           '<textarea name="" cols="30" rows="10" placeholder="edit..."></textarea>',
                      '</div>',
                      '<div class="subspan">',
                          '<span class="js_wps">{@wps}</span>',
                          '<span class="js_alltime">{@alltime}seconds</span>',
                          '<span class="js_wordsCount">0word</span>',
                          '<span class="delete-icon">——</span>',
                      '</div>',
                  '</div>',
                  '<div class="buttomline"></div>',
               '</li>'
        ].join('');
        li = li.replace('{@startTime}', segmentObj.startTime)
               .replace('{@alltime}', segmentObj.alltime)
               .replace('{@textId}', segmentObj.textId)
               .replace('{@wps}', '0WPS');
        $('#contentList').prepend(li);  
        // store in global parametes
        globalSegments[textId] = segmentObj;      
        // tetxarea监听以修改字数等信息
        $('#' + textId + ' textarea').on('propertychange input', function () {
            // TODO more accurate
            var wordsCount = $(this).val().replace(/\s+$/, '').split(/\s+/).length;
            globalSegments[textId].wordsCount = wordsCount;
            var alltime = globalSegments[textId].alltime;
            var wps = alltime ? Math.round(wordsCount / alltime * 100) / 100 : 0;
            $(this).parent().parent().find('.js_wordsCount').html(wordsCount + 'words');
            $(this).parent().parent().find('.js_wps').html(wps + 'WPS');
        }).blur(function () {
            // store the content in localstorage
            localStorage.setItem('textId', $(this).val());
            // when send?
            // editable?
        })
    })
})