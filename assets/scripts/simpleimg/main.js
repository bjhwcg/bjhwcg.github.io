/*依赖jquery和CannyEdge*/

//限定能处理的图片大小，减少计算量
var max_w = 800;
var max_h = 600;
//现存图片
//var ctx;
var h=300;
var w=500;
var imgData;
//高斯
var ksize = 3;
var sigma = 1;
var gauss;
//双阈值
var min=0;
var max=1;
var xScale;
var yScale;
//计算好的短边阈值
var short = 0;
var cannyImg;
//计算好的meanshift
var sp = 0;
var sr = 0;
var maxit = 1;
var dist = 0;
var level = 3;
//金字塔数组
var Py;
var child;
var neighbor;
//状态，0表示初始，1表示已选图片，2表示图片已生成
var state = 0;
//聚焦中心
var fixx = 0;
var fixy = 0;
var fixr = 0;
var cscale = 1;
$(document).ready(

    function () {

        //鼠标滑过input-img-mask不可行，因为它是被input-img覆盖的，所以响应动作发挥不了
        //想要鼠标滑过和其他按钮保持一样的效果，这里只好用js解决了
        $("#input-img").hover(
            function () {
                //console.log("hover");
                $("#input-img-mask")[0].style.color = "#1bdc9b";
                //$('#input-img-mask').attr('color', "#1bdc9b");
            },
            function () {
                //console.log("hover");
                $("#input-img-mask")[0].style.color = "white";
                //$('#input-img-mask').attr('color', "#1bdc9b");
            }
        );

        //选择图片以后，在canvas显示本地图片
        $('#input-img').change(
            function () {
                var f = document.getElementById('input-img').files[0];
                var src = window.URL.createObjectURL(f);

                var cvs = document.getElementById('my-canvas');
                var ctx = cvs.getContext('2d');

                var svs = document.getElementById('my-circle-svg');

                var img = new Image();
                img.src = src;

                img.onload = function () {
                    //console.log(img.width, img.height); 
                    //确保图片大小合适
                    if (img.width > max_w && img.height / max_h <= img.width / max_w) {
                        cvs.width = max_w;
                        cvs.height = img.height * cvs.width / img.width;
                    }
                    else if (img.height > max_h) {
                        cvs.height = max_h;
                        cvs.width = img.width * cvs.height / img.height;
                    }
                    else {
                        cvs.width = img.width;
                        cvs.height = img.height;
                    }
                    h = cvs.height;
                    w = cvs.width
                    svs.style.width = cvs.width + "px";
                    svs.style.height = cvs.height + "px";
                    cvs.style.width = cvs.width+"px";
                    cvs.style.height = cvs.height+"px";
                    ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
                    imgData = ctx.getImageData(0,0,w,h);
                    state = 1;

                    //绘制meanshift调节画布
                    drawMSRect();
                }
            }
        );

        drawKernel();
        //核矩阵大小滑动条改变
        $('#kernel-sliderBar').change(
            function showKernelValue() {
                //得到size大小
                var result = document.getElementById('kernel-result');
                var num = $('#kernel-sliderBar').val();
                result.innerHTML = num;
                ksize = num;
                drawKernel();
            }
        );
        //sigma大小滑动条改变
        $('#sigma-sliderBar').change(
            function showKernelValue() {
                //得到sigma大小
                var result = document.getElementById('sigma-result');
                var num = $('#sigma-sliderBar').val();
                result.innerHTML = num;           
                sigma = num;
                drawKernel();
            }
        );
        function drawKernel() {
            //显示图片
            var gaussCanvas = $("#my-gauss")[0];
            gaussCanvas.width = 7;
            gaussCanvas.height = 7;
            var gctx = gaussCanvas.getContext('2d');
            var newImage = gctx.createImageData(ksize, ksize);
            //计算得到的guass赋值给图片
            gauss = GenGauss((ksize - 1) / 2, sigma, newImage.data);
            gctx.putImageData(newImage, (7 - ksize) * 0.5, (7 - ksize) * 0.5);
        }

        //在画布上点击时显示颜色信息（测试用）
        $("#my-circle-svg").click(
            function (e) {
                //获取鼠标和画布的相对位置
                var canvasOffset = $("#my-canvas").offset();
                var canvasX = Math.floor(e.pageX - canvasOffset.left);
                var canvasY = Math.floor(e.pageY - canvasOffset.top);
                var cvs = document.getElementById('my-canvas');
                var ctx = cvs.getContext('2d');
                var c = ctx.getImageData(canvasX, canvasY, 1, 1).data;

                //输出rgb
                var red = c[0];
                var green = c[1];
                var blue = c[2];

                fixx = canvasX;
                fixy = canvasY;
          
                console.log('fixx:',fixx, 'fixy:',fixy);

                ////画圈圈
                //ctx.beginPath();
                //ctx.arc(canvasX, canvasY, 10, 5, 0);
                //ctx.lineWidth=5;
                //ctx.strokeStyle="green";
                //ctx.stroke();//画空心圆
                //ctx.closePath();
                
            }
        );
        $("#my-circle-svg").mousedown(
            function (e) {
                //画圈圈
                var canvasOffset = $("#my-circle-svg").offset();
                var canvasX = Math.floor(e.pageX - canvasOffset.left);
                var canvasY = Math.floor(e.pageY - canvasOffset.top);
                var svgcircle = $("#my-circle");
                svgcircle.attr('cx', canvasX);
                svgcircle.attr('cy', canvasY);
                svgcircle.attr('r', 2);
                bigger(svgcircle); 
            }
        );
        $("#my-circle-svg").mouseup(
            function (e) {
                clearInterval(timer);
            }
        )
        function bigger(svgcircle) {
            timer = setInterval(function () {
                //if (typeof (timer) != "undefined") clearInterval(timer);
                var r = parseInt(svgcircle.attr('r'));
                if (r >= math.min(w, h)) {
                    clearInterval(timer);
                }
                svgcircle.attr('r', r + 2);
                fixr = r;
                console.log('fixr:', fixr);
            }, 50);
        }
        //min大小滑动条改变
        $('#min-sliderBar').change(
            function showMinValue() {
                //得到size大小
                var result = document.getElementById('min-result');
                var num = $('#min-sliderBar').val();               
                result.innerHTML = num;
                //var num1 = $('#max-sliderBar').val();
                //if (num >= num1) { max = num; }
                //else { min = num; }
                min = num;
                if ($("#new-canvas").length > 0) {
                    var canvas = $("#new-canvas")[0];
                    rslt = ToDoubleThreshold(grad.mag, min, max);
                    rslt = ToCutShort(rslt, short);
                    ShowMiddle(rslt, canvas);
                }
                drawThresholdPoint();
            }
        );
        //max大小滑动条改变
        $('#max-sliderBar').change(
            function showMaxValue() {
                //得到sigma大小
                var result = document.getElementById('max-result');
                var num = $('#max-sliderBar').val();             
                result.innerHTML = num;
                //var num1 = $('#min-sliderBar').val();
                //if (num <= num1) { min = num; }
                //else { max = num; }
                max = num;
                if ($("#new-canvas").length > 0) {
                    var canvas = $("#new-canvas")[0];
                    rslt = ToDoubleThreshold(grad.mag, min, max);
                    rslt = ToCutShort(rslt, short);
                    ShowMiddle(rslt, canvas);
                }
                drawThresholdPoint();
            }
        );
        //short大小滑动条改变
        $('#short-sliderBar').change(
            function showShortValue() {
                //得到sigma大小
                var result = document.getElementById('short-result');
                var num = $('#short-sliderBar').val();
                result.innerHTML = num;
                short = math.max(w, h)*num;
                if ($("#new-canvas").length > 0) {
                    var canvas = $("#new-canvas")[0];
                    rslt = ToDoubleThreshold(grad.mag, min, max);
                    rslt = ToCutShort(rslt, short);
                    ShowMiddle(rslt, canvas);
                }
            }
        );
        //sp大小滑动条改变
        $('#ms-sp-sliderBar').change(
            function showSpValue() {
                //得到sigma大小
                var result = document.getElementById('ms-sp-result');
                var num = $('#ms-sp-sliderBar').val();
                result.innerHTML = num;
                sp = math.min(w, h) * num;
                //影响dist
                var result1 = document.getElementById('ms-dist-result');
                var num1 = $('#ms-dist-sliderBar').val();
                result1.innerHTML = num1;
                dist = sp * num1;
                //重新绘制
                drawMSRect();
            }
        );
        //sr大小滑动条改变
        $('#ms-sr-sliderBar').change(
            function showSrValue() {
                //得到sigma大小
                var result = document.getElementById('ms-sr-result');
                var num = $('#ms-sr-sliderBar').val();
                result.innerHTML = num;
                sr = 100*num;//765=255*根号3，就是两个像素的最大的颜色差异半径
                drawMSRect();
            }
        );
        //distance大小滑动条改变
        $('#ms-dist-sliderBar').change(
            function showDistValue() {
                //得到sigma大小
                var result = document.getElementById('ms-dist-result');
                var num = $('#ms-dist-sliderBar').val();
                result.innerHTML = num;
                dist = sp * num;
                drawMSRect();
            }
        );
        //maxit大小滑动条改变
        $('#ms-maxit-sliderBar').change(
            function showMaxitValue() {
                //得到sigma大小
                var result = document.getElementById('ms-maxit-result');
                var num = $('#ms-maxit-sliderBar').val();
                result.innerHTML = num;
                maxit = num;
                drawMSRect();
            }
        );
        //layer大小滑动条改变
        $('#ms-layer-sliderBar').change(
            function showLayerValue() {
                //得到sigma大小
                var result = document.getElementById('ms-layer-result');
                var num = $('#ms-layer-sliderBar').val();
                result.innerHTML = num;
                level = num;
            }
        );
        //点击edge按钮生成边缘图片
        $("#generate-edge").click(
            function () {
                if (state > 0) {
                    //添加画布
                    var newCanvas;
                    if ($("#new-canvas").length == 0) {
                        newCanvas = document.createElement("canvas");
                        newCanvas.id = "new-canvas";
                        newCanvas.className = "my-cvs";
                        $("#canvas-area").append(newCanvas);
                    }
                    else {
                        newCanvas = $("#new-canvas")[0];
                    }
                    newCanvas.width = w;
                    newCanvas.height = h;
                    newCanvas.style.width = w + "px";
                    newCanvas.style.height = h + "px";

                    //获得图片像素
                    histdata = [];
                    //图像处理
                    cannyImg = ToCanny(imgData, newCanvas, gauss, min, max, short);
                    if (state == 3 || state==4) {
                        state = 4;
                    }
                    else {
                        state = 2;
                    }

                    //显示图片分析区域
                    $("#anals-area")[0].style.visibility = "visible";
                    $("#anals-area")[0].style.height = "200px";
                    
                    showGraph(histdata);
                }
            }
        );

        //点击segment按钮图像分割
        $("#generate-color").click(
            function () {
                if (state > 0) {
                    /*选择画布
                    canvas = $("#my-canvas-2")[0];

                    //显示第二画布区域
                    canvas.style.marginTop = 50 + "px";
                    canvas.style.width = w + "px";
                    canvas.style.height = h + "px";
                    canvas.style.visibility = "visible";
                    canvas.width = w;
                    canvas.height = h;*/

                    //图像处理
                    Py = ToPyMSSeg(imgData, level, 1.414, sp, sr, maxit, dist);
                    ShowPy(Py.segPy);
                    if (state == 2 || state == 4) {
                        state = 4;
                    }
                    else {
                        state = 3;
                    }
                }
            }
        );

        //点击result按钮产生最终图像
        $("#generate-rslt").click(
            function () {
                //构造区域树
                if (state == 4) {
                    [child, neighbor] = GiveBirth(Py, 1.414);
                }
                //显示画布
                $("#canvas-area-3")[0].style.visibility = "visible";
                var cvs = $("#my-canvas-3")[0];
                cvs.width = w;
                cvs.height = h;
                cvs.style.width = w + "px";
                cvs.style.height = h + "px";
                //显示图片
                ShowPruneImg(cvs, fixx, fixy, fixr, 1.414, Py, child, neighbor, cscale, cannyImg);
            }
        );
    }    
);

function showGraph(data) {
    //创建svg
    var width = 300;
    var height = 200;
    var svg;
    if ($('#my-hist').length == 0) {
        
        d3.select('#anals-area')
            .append('svg')
            .attr('id', 'my-hist')
            .attr('width', width + 'px')
            .attr('height', height + 'px');
    }
    svg = d3.select('#my-hist');

    // 创建x轴的比例尺(线性比例尺)
    xScale = d3.scale.linear()
        .domain([0, d3.max(data, function (d) { return d.x; })])
        .range([0, width*0.8]);

    // 创建y轴的比例尺(线性比例尺)
    yScale = d3.scale.linear()
        .domain([0, d3.max(data, function (d) { return d.y; })])
        .range([height*0.8, 0]);

    // 创建x轴
    var xAxis = d3.svg.axis()
        .scale(xScale)
        .ticks(5)
        .orient('bottom');

    // 创建y轴
    var yAxis = d3.svg.axis()
        .scale(yScale)
        .ticks(5)
        .orient('left');

    if ($("#hist-x-axis").length == 0) {
        // 添加SVG元素
        svg.append('g')
            .attr('id', 'hist-x-axis')
            .attr('class', 'axis')
            .attr('transform', 'translate(' + width * 0.1 + ',' + height * 0.9 + ')')
            .append('text')
            .attr('id', 'hist-x-tag')
            .attr('transform', 'translate(' + width * 0.83 + ',' + height * 0.025 + ')')
            .text('bin');

        // 添加SVG元素
        svg.append('g')
            .attr('id', 'hist-y-axis')
            .attr('class', 'axis')
            .attr('transform', 'translate(' + width * 0.1 + ',' + height * 0.1 + ')')
            .append('text')
            .attr('transform', 'translate(' + width * -0.03 + ',' + height * -0.05 + ')')
            .attr('id', 'hist-y-tag')
            .text('num');

        // 添加path元素
        svg.append('path')
            .attr('id', 'hist-line')
            .attr('class', 'line')
            .attr('transform', 'translate(' + width * 0.1 + ',' + height * 0.1 + ')');

    }

    //与x、y轴进行“绑定”
    d3.select('#hist-x-axis').call(xAxis);
    d3.select('#hist-y-axis').call(yAxis);

    // 添加折线
    var line = d3.svg.line()
        .x(function (d) {
            return xScale(d.x)
        })
        .y(function (d) {
            return yScale(d.y);
        })
        // 选择线条的类型
        .interpolate('linear');

    //通过line()计算出值来赋值
    d3.select('#hist-line')
        .attr('d', line(data));

    //清除点
    $('.dot-circle').remove();
    //重新添加点
    svg.selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('transform', 'translate(' + width * 0.1 + ',' + height * 0.1 + ')')
        .attr('class', 'dot-circle')
        .attr('cx', function (d) {
            return xScale(d.x);
        })
        .attr('cy', function (d) {
            return yScale(d.y);
        })
        .attr('r', 2)
        .attr('fill', '#15F3A8');

    drawThresholdPoint();  
}

function drawThresholdPoint() {
    var svg = $('#my-hist');
    var width = svg.width();
    var height = svg.height();
    //console.log(width, height);
    //清除指示点
    $('.threshold-point').remove();
    //添加指示点
    var mndata = [{ x: minthreshold, y: 0 }, { x: maxthreshold, y: 0 }];
    d3.select('#my-hist').selectAll('.threshold-point')
        .data(mndata)
        .enter()
        .append('circle')
        .attr('transform', 'translate(' + width * 0.1 + ',' + height * 0.1 + ')')
        .attr('cx', function (d) {
            return xScale(d.x);
        })
        .attr('cy', function (d) {
            return yScale(d.y);
        })
        .attr('class', 'threshold-point')
        .attr('r', 5)
        .attr('fill', 'grey');
}


//绘制meanshift调节区的画布
function drawMSRect() {
    var canvas = $("#my-ms")[0];
    var cw, ch;
    var rectw;
    var rectd;
    //显示画布区域
    if (w > h) {
        cw = 120;
        ch = 120 * h / w;
        rectw = sp * ch / h;
        rectd = dist * ch / h;
    }
    else {
        cw = 120 * w / h;
        ch = 120;
        rectw = sp * cw / w;
        rectd = dist * cw / w;
    }
    canvas.style.width = cw + "px";
    canvas.style.height = ch + "px";
    canvas.width = cw;
    canvas.height = ch;
    var context = canvas.getContext('2d');
    var recto = 1;
   
    //绘制矩形
    for (var i = 0; i <= maxit; i++) {
        context.fillStyle = "rgba(45, 42, 42," + recto + ")";//填充样式演示
        recto -= sr/100;
        context.lineWidth = 3;
        context.strokeStyle = "white";//轮廓颜色
        context.strokeRect(i * rectd, i * rectd, rectw, rectw);//绘制矩形轮廓
        context.fillRect(i * rectd, i * rectd, rectw, rectw);//绘制矩形
    }
}