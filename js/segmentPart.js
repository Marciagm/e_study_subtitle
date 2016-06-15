define(['jquery', 'peaks', 'utility'], function ($, peaks, utility) {
    var segmentPart = {};

    /**
     * 添加textarea
     *
     * @param {Object} peaksInstance instance实例
     */
    var addTextArea = function (peaksInstance) {
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
    };

    /**
     * 有序插入segment
     *
     * @param {Object} segment 要插入的segment
     */
    var insertSegment = function (segment) {
        // 数组为空的话直接push
        if (!orderedSegments.length) {  
            orderedSegments.push(segment);
            return;
        }
        var i = 0, len = orderedSegments.length;
        while (i < len && segment.startTime > orderedSegments[i].startTime) {
            i++;
        }
        // 从i开始整体后移
        for (var j = len - 1; j >= i; j--) {
            orderedSegments[j + 1] = orderedSegments[j];
        }
        orderedSegments[i] = segment;
    };

    /**
     * TODO是否暴露此接口，再定
     *
     * @param {Object} instance 片段对象
     * @return {Object} orderedSegments 排序后的数组
     */
    segmentPart.sortSegments = function (instance) {
        orderedSegments = [];
        var allSegments = instance.segments.getSegments();
        for (var i = 0, len = allSegments.length; i < len; i++) {
            var seg = allSegments[i];
            insertSegment(seg);
        }
        return orderedSegments;
    };

    /**
     * 添加片段
     * 
     * @param {Object} instance 实例对象
     * @pram {Object} segment 片段对象
     */
    segmentPart.addSegment = function (instance, segment) {
        // TODO如果当前位置已经添加了，就自动focus到相应的textarea

        // 如果没有传递segment就默认从当前时间开始1秒钟
        if (!segment) {
            segment = {
              startTime: instance.time.getCurrentTime(),
              endTime: instance.time.getCurrentTime() + 1,
              editable: true
            }
        }
        instance.segments.add([segment]);
        // 添加后重新排序
        this.sortSegments(instance);
        // TODO调用textarea接口添加textarea
        addTextArea(instance);
    };


    /**
     * 删除当前片段
     *
     * @param {Object} instance 实例
     */
    segmentPart.deleteSegment = function (instance) {
        // 删除
    };

    /**
     * 获取相邻有重叠的片段
     *
     * @param {Object} segment 片段对象
     * @param {string} tag 平移的位置量即当前位置+tag，比如1：后面的一个; -1: 前面的一个;默认后面的
     */
    segmentPart.getNeighborSegment = function (segment, tag) {
        if (!tag) {
            tag = 1;
        }
        for (var i = 0, len = orderedSegments.length; i < len; i++) {
            if (orderedSegments[i].id === segment.id) {
                var desPos = i + tag;
                if (desPos >= 0 && desPos < len) {
                    if ((segment.startTime < orderedSegments[desPos].startTime 
                        && segment.endTime < orderedSegments[desPos].startTime)
                        || (orderedSegments[desPos].startTime < segment.startTime 
                            && orderedSegments[desPos].endTime < segment.startTime)) {
                        return ''; 
                    }
                    else {
                        return orderedSegments[desPos];    
                    }
                }
                else {
                    return '';
                }
                
            }
        }
    };

    /**
     * 根据传过来的segment调整前后相邻的片段
     *
     * @param {Object} instance 实例对象
     * @param {Object} segment getSegments()中的片段
     */
    segmentPart.ajustSegments = function (instance, segment) {
        var allSegments = instance.segments.getSegments();
        this.sortSegments(instance);
        // 找到前后两个片段，调整前面片段的endtime，调整后面片段的starttime
        var prevSegment = this.getNeighborSegment(segment, -1);
        var nextSegment = this.getNeighborSegment(segment, 1);
        console.log(prevSegment);
        console.log(nextSegment);
        for (var i = 0, len = allSegments.length; i < len; i++) {
            var seg = allSegments[i];
            if (prevSegment && seg.id === prevSegment.id) {
                if (seg.endTime > segment.startTime) {
                    seg.endTime = segment.startTime;   
                }
            }
            if (nextSegment && seg.id === nextSegment.id) {
                if (seg.startTime < segment.endTime) {
                    seg.startTime = segment.endTime;   
                }
            }
        }
    };

    /**
     * 拖动时间轴时进行的操作
     * 
     * @param {Object} instance 实例对象
     * @param {Object} segment 片段对象
     */
    segmentPart.draggSegment = function (instance, segment) {
        // 调整前后有重合的时间轴
        this.ajustSegments(instance, segment);
        // 更新对应textarea的字段
        utility.updateData(segment);
    };
    return segmentPart;
})
// 提出来封装成单独的模块
    