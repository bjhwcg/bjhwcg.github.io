var rslt;
var grad;
var minthreshold;
var maxthreshold;

/* 依赖math.js */
/* 提取图片边缘 */

//Canny的一整套流程
//src：原图
//canvas：显示的画布
//gauss：高斯矩阵
//min、max：双阈值
//short：要去除的短边的长度
function ToCanny(src, canvas, gauss, min, max, short) {

    //转灰度
    rslt = ToGray(src);
    //ShowMiddle(rslt, canvas);
    //转高斯，从这里开始各位参数就是有形状的矩阵了
    rslt = ToBlur(rslt, gauss);
    //console.log(rslt);
    //ShowMiddle(rslt, canvas);
    //计算梯度
    grad = ToGrad(rslt);
    //非极大值抑制
    ToNMS(grad.mag, grad.dir);
    //ShowMiddle(grad.mag, canvas);
    //双阈值
    rslt = ToDoubleThreshold(grad.mag, min, max);
    //ShowMiddle(rslt, canvas);
    //去除短边
    rslt = ToCutShort(rslt, short);
    ShowMiddle(rslt, canvas);
    return rslt;
}

//把灰度矩阵显示到画布上面去（测试用）
function ShowMiddle(mat, canvas) {
    var ctx = canvas.getContext('2d');
    var Image = ctx.createImageData(mat.size()[1], mat.size()[0]);
    for (var i = 0; i < mat.size()[0]; i++) {
        for (var j = 0; j < mat.size()[1]; j++) {
            let index = i * mat.size()[1] + j;
            Image.data[index * 4] = Image.data[index * 4 + 1] = Image.data[index * 4 + 2] = mat._data[i][j];
            Image.data[index * 4 + 3] = 255;
        }  
    }
    ctx.putImageData(Image, 0, 0);
}
//以上部分和main.js有关



//######################################################################################
//第一步：转化为灰度图像

//把图像转化为灰度值
//参数
//src：需要转化的原图（canvas的imgdata格式）
//返回值
//rslt: 得到的灰度矩阵（matrix）
function ToGray(src)
{
    var rslt = math.zeros(src.height, src.width);
    
    //canvas的图像是【RGBARGBA……】这样的排列
    for (var i = 0; i < src.height; i++) {
        for (var j = 0; j < src.width; j++) {
            let index = i * src.width + j;
            rslt._data[i][j] = RGB2Y(src.data[index * 4], src.data[index * 4 + 1], src.data[index * 4 + 2]);
        }
    }
    //length = src.width * src.height * 4;
    //for (var i = 0; i < length; i += 4) {
    //    rslt[i + 2] = rslt[i + 1] = rslt[i] = RGB2Y([src.data[i], src.data[i + 1], src.data[i + 2]]);
    //    rslt[i + 3] = 255;
    //}
    return rslt;
}
//单像素RGB转灰度
//RGB先转到Yuv空间再取Y通道
//data：单个像素的三个值（RGB）
function RGB2Y(r,g,b) {
    return 0.299 * r + 0.587 * g + 0.114 * b;
}


//######################################################################################
//第二步：高斯模糊

//参数是矩阵
function ToBlur(src, gauss) {
    //计算高斯卷积
    return MyConvolution(gauss, src);
}

//生成高斯矩阵
//halfsize：设定size必须是奇数所以这里就用了一半的边长
//sigma：方差
//rslt：是一个画布的imagedata，用于可视化高斯矩阵0
//返回：一个高斯矩阵
//结果不作为参数传入而是用返回值的话，最后结果一直都是0，发现函数调用之后不仅仅返回了data还有奇奇怪怪的其他东西。
function GenGauss(halfSize, sigma, rslt) {
    size = 2 * halfSize + 1;
    var gauss = math.zeros(size, size);
    sum = 0;
    for (var i = 0; i < size; ++i) {      
        for (var j = 0; j < size; ++j) {
            x = i - halfSize;
            y = j - halfSize;
            gauss._data[i][j] = math.exp(-0.5 * (x * x + y * y) / (sigma * sigma)) / (2.0 * 3.1415926 * sigma * sigma);
            sum += gauss._data[i][j];
        }
    }
    for (var i = 0; i < size; ++i) {
        for (var j = 0; j < size; ++j) {
            //gauss是用来计算的
            gauss._data[i][j] /= sum;
            //console.log(gauss[i]);
            //rslt是用来绘制高斯矩阵效果图的，所以会有点处理，为了效果好一点
            if (rslt == 0) { continue; }
            let index = i * size + j;
            rslt[index * 4] = rslt[index * 4 + 1] = rslt[index * 4 + 2] = gauss._data[i][j] * 255;
            rslt[index * 4 + 3] = 255;
        }

    }
    return gauss;
}


//计算卷积
//kernel：需要一个高宽相等的小矩阵
//src：待卷积的图像矩阵
//保持图片原有大小
function MyConvolution(kernel, src) {
    //参数有错误的时候报错
    if (kernel.size()[0] != kernel.size()[1]) {
        console.log("核矩阵的行列数不一致，不能进行MyConvolution()啊");
        return 0;
    }
    //小图片的情况
    if (src.size()[0] < kernel.size()[0] || src.size()[1] < kernel.size()[1]) {
        console.log("小图片的MyConvolution()处理暂时还没有写……稍等哦");
        return 0;
    }

    //将原图的边缘向四面扩充一个halfsize
    var halfsize = (kernel.size()[0] - 1) * 0.5;
    var tmp = ExpandBorder(src, halfsize);

    //计算卷积
    var rslt = math.zeros(src.size()[0], src.size()[1]);
    for (var i = 0; i < src.size()[0]; i++) {
        for (var j = 0; j < src.size()[1]; j++) {
            rslt._data[i][j] = Mult(kernel, tmp.subset(math.index(math.range(i, i + kernel.size()[0]), math.range(j, j + kernel.size()[1]))));
        }
    }
    //console.log(rslt);
    return rslt;
}

//扩展图片边缘
//参数：
//src：带扩充的图片矩阵
//halfsize：四周要加长的长度
//返回值：
//扩大后的图片矩阵
//限制：
//只能在四周扩大相同的长度，而且边缘不能超过图片大小，而且拼接是平铺方式的
function ExpandBorder(src, halfsize){
    var tmp = math.zeros(src.size()[0] + 2 * halfsize, src.size()[1] + 2 * halfsize);
    //填充中间
    tmp.subset(math.index(math.range(halfsize, tmp.size()[0] - halfsize), math.range(halfsize, tmp.size()[1] - halfsize)), src);
    //上
    tmp.subset(math.index(math.range(0, halfsize), math.range(halfsize, tmp.size()[1] - halfsize)),
        src.subset(math.index(math.range(0, halfsize), math.range(0, src.size()[1]))));
    //下
    tmp.subset(math.index(math.range(tmp.size()[0] - halfsize, tmp.size()[0]),math.range(halfsize, tmp.size()[1] - halfsize)),
        src.subset(math.index(math.range(src.size()[0] - halfsize, src.size()[0]),math.range(0, src.size()[1]))));
    //左
    tmp.subset(math.index(math.range(0, tmp.size()[0]), math.range(0, halfsize)),
        tmp.subset(math.index(math.range(0, tmp.size()[0]), math.range(halfsize, halfsize*2))));
    //右
    tmp.subset(math.index(math.range(0, tmp.size()[0]), math.range(tmp.size()[1] - halfsize, tmp.size()[1])),
        tmp.subset(math.index(math.range(0, tmp.size()[0]), math.range(tmp.size()[1] - halfsize*2, tmp.size()[1] - halfsize))));

    return tmp;
}
//矩阵点乘
function Mult(a, b) {
    if (a.size()[0] != b.size()[0] || a.size()[1] != b.size()[1]) {
        console.log("两个矩阵大小不一致，不能进行点乘。");
        return 0;
    }
    var sum = 0;
    for (var i = 0; i < a.size()[0]; i++) {
        for (var j = 0; j < a.size()[1]; j++) {
            sum += a._data[i][j] * b._data[i][j];
        }
    }
    return sum;
}

//######################################################################################
//第三步：计算梯度
function ToGrad(src) {
	///使用sobel算子
	var sobelX = new math.matrix([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]]);
	var sobelY = new math.matrix([[1, 2, 1], [0, 0, 0], [-1, -2, -1]]);
	var gradX = MyConvolution(sobelX, src);
	var gradY = MyConvolution(sobelY, src);
	//计算强度和方向
	var nRows = src.size()[0];
	var nCols = src.size()[1];
	var grad_mag = math.zeros(nRows, nCols);
	var grad_dir = math.zeros(nRows, nCols);
	for (var i = 0; i < nRows; ++i){
		for(var j=0;j<nCols;++j){
			grad_mag._data[i][j] = gradX._data[i][j] + gradY._data[i][j];
			grad_dir._data[i][j] = QuantAngle(Math.atan2(gradY._data[i][j], (gradX._data[i][j] == 0 ? 1 : gradX._data[i][j])));//防止除数为0
		}
	}
	return {mag:grad_mag, dir:grad_dir};
}

//量化角度
function QuantAngle(n){
	var a = 0.3927;//pi/8
	if ((n >= -3 * a && n < -a) || (n >= 5 * a && n < 7 * a)) {
		return 135;
	}
	else if ((n >= a && n < 3 * a) || (n >= -7 * a && n < -5 * a)) {
		return 45;
	}
	else if ((n >= 3 * a && n < 5 * a) || (n >= -5 * a && n < -3 * a)) {
		return 90;
	}
	else {
		return 0;
	}
}

//######################################################################################
//非极大值抑制
//参数：
//mag：梯度强度矩阵
//dir：梯度方向矩阵
//输出：
//mag：修改之后的强度矩阵
function ToNMS(mag, dir) {
	var nRows = mag.size()[0];
	var nCols = mag.size()[1];
	//下面和卷积函数差不多，创建一个临时的扩大过的矩阵，因为只要8邻域所以每个边界扩大1像素就可以了
    var tmp = ExpandBorder(mag, 1);
	//然后进行扫描、计算，重新赋值
	for (var i = 0; i < nRows; ++i)
	{
        for (var j = 0; j < nCols; ++j){
            //如果需要抑制，则强度值为0，不需要抑制则保留现在的强度值
            
            mag._data[i][j] *= Suppress(tmp, dir._data[i][j], i, j);
		}
    }
	return 0;
}

//判断是否需要抑制这个点
//参数：
//src：四周扩大1以后的矩阵（方便起见）
//flag：当前点的梯度方向
//i, j：当前坐标
function Suppress(src, flag, i, j) {
    //要比较的是梯度方向的两个点
    var left = 0;
    var right = 0;
    var now = src._data[i + 1][j + 1];
    switch (flag) {
        case 0: {
            left = src._data[i + 1][j];
            right = src._data[i + 1][j + 2];
            break;
        }
        case 45: {
            left = src._data[i][j + 2];
            right = src._data[i + 2][j];
            break;
        }
        case 90: {
            left = src._data[i][j + 1];
            right = src._data[i + 2][j + 1];
            break;
        }
        case 135: {
            left = src._data[i][j];
            right = src._data[i + 2][j + 2];
            break;
        }
    }
    return (now >= left && now > right);
}

//######################################################################################
//双阈值处理

//（全局）记录
var myAddVec = new Array();

//用于展示和便于debug的d3规范梯度强度直方图数据
var histdata = [];


//src：非极大值抑制的结果
//max：高阈值
//min：低阈值
function ToDoubleThreshold(src, min, max) {
    //计算直方图
    var bins = 50;
    var maxbin = 1000;
    var hist = MyHist(src, maxbin, bins);
    //获取直方图data
    histdata.push({ x: 0, y: 0 });//美观起见多一个起始点
    for (var i = 0; i < bins; i++) {
        histdata.push({ x: hist.rangehist[i], y: hist.numhist[i] });
    }
    histdata.push({ x: hist.rangehist[i - 1] + hist.rangehist[i - 2] - hist.rangehist[i - 3], y: 0 });
    //计算两个阈值的绝对值
    var m, n;
    m = MyHistBin(hist.rangehist, hist.numhist, max);
    n = MyHistBin(hist.rangehist, hist.numhist, min);
    //全局赋值
    minthreshold = n;
    maxthreshold = m;
    
    //遍历一遍图像，让高于高阈值设为1，低于低阈值设为0
    var nRows = src.size()[0];
    var nCols = src.size()[1];
    var dst = math.zeros(nRows, nCols); 
    for (var i = 0; i < nRows; ++i)
    {
        for (var j = 0; j < nCols; ++j)
        {
            if (src._data[i][j] > m) {
                dst._data[i][j] = 255;
            }
            else if (src._data[i][j] > n) {
                dst._data[i][j] = 100;//表示阈值中间部分还未确定要不要保留
            }
        }
    }
    //根据上面步骤产生的图像计算中间域和高阈值的连通
    for (var i = 0; i < nRows; ++i)
    {
        for (var j = 0; j < nCols; ++j)
        {
            //如果找到一个高阈值点，则开始向外找八连的中间阈值点，并把它自己标记为已经找过了
            if (dst._data[i][j] == 255) {
                dst._data[i][j] = 200;//200表示已经遍历到过
                //然后找这个点的连通域
                MyFindConnect(dst, i, j, 100);//100是中间未确定点的标记
                //找vec里面的点的连通域
                while (myAddVec.length != 0) {
                    MyFindConnect(dst, myAddVec[0][0], myAddVec[0][1], 100);//查找第一个元素
                    myAddVec.shift();//删除第一个元素
                }
            }
        }
    }
    //重定义图片，删掉不符合的点
    for (var i = 0; i < nRows; ++i)
    {
        for (var j = 0; j < nCols; ++j)
        {
            //200是上次遍历的时候被标记的点
            if (dst._data[i][j] == 200) {
                dst._data[i][j] = 0;
            }
            else {
                dst._data[i][j] = 255;
            }
        }
    }
    return dst;
}


//计算直方图(均匀分布)
//rghist：存放范围（放该bin的最小值）的数组
//numhist：存放数量的数组
//max：限制直方图最大分割区域的范围（只有最后一个不是均匀分割的，100000）
function MyHist(src, max, bins) {
    var nRows = src.size()[0];
    var nCols = src.size()[1];
    var maxVal = 0;
	//找到最大值
	for (var i = 0; i < nRows; ++i)
	{
		for (var j = 0; j < nCols; ++j)
		{
			if (src._data[i][j] > maxVal) {
				maxVal =src._data[i][j];
			}
        }
    }
    if (maxVal < max) {
        max = maxVal;
    }
    //console.log("阈值设定的参考意见：图像中的最大值是" + maxVal);
    //初始化hist，确定如何分割bin的范围
    var rghist = new Array(bins);
    var numhist = new Array(bins);
    for (var i = 0; i < bins; i++) {
        rghist[i] = i * (max + 1) / bins + 1;
        numhist[i] = 0;
    }
    //然后进行遍历计算hist
    for (var i = 0; i < nRows; ++i)
    {
        for (var j = 0; j < nCols; ++j)
        {
            if (src._data[i][j] != 0) {
                var n = Math.min(max, src._data[i][j]);
                numhist[Math.floor(n * bins / (max + 1))]++;
            }
        }
    }
    return { rangehist: rghist, numhist: numhist, maxVal:maxVal }
}

//按比例计算在哪个bin上面
function MyHistBin(rghist, numhist, n) {
    //计算总数
    var sum = 0;
    var bins = rghist.length;
    for (var i = 0; i < bins; ++i)
    {
        sum += numhist[i];
    }
    //计算到n要多少数量的积累
    var val = sum * n;
    //计算n在哪个bin
    var b;
    for (var i = 0; i < bins; ++i)
    {
        val -= numhist[i];
        if (val <= 0) {
            return rghist[i];
        }
    }
    return rghist[bins - 1];
}

//从当前点出发找连通域
//src：
//x,y：点坐标
//flag：需要查找的点的标记数值
function MyFindConnect(src, y, x, flag) {
    //对正常的中间点，遍历周围八个点，如果是中间阈值点（100），就放进vec里面，并且把值设为已访问（200）
    //左边
    if (x >= 1 && src._data[y][x - 1] == flag) {
        myAddVec.push([y, x - 1]);
        src._data[y][x - 1] = 200;
    }
    //右边
    if (x < src.size()[1] - 1 && src._data[y][x + 1] == flag) {
        myAddVec.push([y, x + 1]);
        src._data[y][x + 1] = 200;
    }
    //上面
    if (y >= 1) {
        //上面
        if (src._data[y - 1][x] == flag) {
            myAddVec.push([y - 1, x]);
            src._data[y - 1][x] = 200;
        }
        //左上
        if (x >= 1 && src._data[y - 1][x - 1] == flag) {
            myAddVec.push([y - 1, x - 1]);
            src._data[y - 1][x - 1] = 200;
        }
        //右上
        if (x < src.size()[1] - 1 && src._data[y - 1][x + 1] == flag) {
            myAddVec.push([y - 1, x + 1]);
            src._data[y - 1][x + 1] = 200;
        }
    }
    //下面
    if (y < src.size()[0] - 1) {
        //下面
        if (src._data[y + 1][x] == flag) {
            myAddVec.push([y + 1, x]);
            src._data[y + 1][x] = 200;
        }
        //左下
        if (x >= 1 && src._data[y + 1][x - 1] == flag) {
            myAddVec.push([y + 1, x - 1]);
            src._data[y + 1][x - 1] = 200;
        }
        //右下
        if (x < src.size()[1] - 1 && src._data[y + 1][x + 1] == flag) {
            myAddVec.push([y + 1, x + 1]);
            src._data[y + 1][x + 1] = 200;
        }
    }
}

//######################################################################################
//去除短边
function ToCutShort(src, short) {
    var rslt = math.clone(src);  
    //计算边的连通
    for (var i = 0; i < src.size()[0]; ++i) {
        for (var j = 0; j < src.size()[1]; ++j) {
            var key = 0;//目前正在查找的点
            //清空一下……虽然好像本来就是空的……
            myAddVec.splice(0, myAddVec.length);
            //如果找到一个边界点，则开始向外找八连的边界点，并把它自己标记为已经找过了
            if (src._data[i][j] == 0) {
                myAddVec.push([i, j]);
                src._data[i][j] = 200;//200表示已经遍历到过
                //找vec里面的点的连通域
                while (myAddVec.length > key) {
                    MyFindConnect(src, myAddVec[key][0], myAddVec[key][1], 0);//继续查找元素
                    key++;
                }
                if (myAddVec.length < short) {
                    for (var k = 0; k < myAddVec.length; k++) {
                        rslt._data[myAddVec[k][0]][myAddVec[k][1]] = 255;
                    }
                }
            }
        }
    }
    return rslt;
}


/*
bug记录：

@ matrix的赋值：a[0][0]、a[0,0]、a(0,0)、a([0,0])、a.data()[][]、a.data[][]之类的全都不让我赋值
观察了一下matrix的构成，数据都在_data里面，然后a._data[0][0]=xxx这样就成功了……
这这这……居然用下划线开头的变量直接赋值吗……好暴力啊……
可是_size也是下划线开头的就只能用a.size()这样得到值……
赋值有时候是引用……var a = b;的时候修改a也会影响到b

@ matrix和array：
matrix：获得col和row的数量使用.size()[0]和.size()[1];
初始化可以用math.zeros(size)
array:new的时候注意参数大于一个的时候都是视为按元素赋值
如果要建立一个二维数组，可以先创建移位数组，在循环里面创建第二维。
一维的数组size是用.length得到，不用小括号也不用中括号。

@ 函数参数的问题：经过修改，把原来混乱的函数参数类型全都改成了以mat为主的。
然后把绘图和计算两部分分开成单独的函数了。
一修改……遇到了超多问题，大多数是数组（矩阵）下标的问题，必须是整数啊……
不过也有开心的事情那就是长宽和col、row对应没颠倒。
刚说完这句话发现密密麻麻的math.index那一块col、row颠倒了，调试绝对不能用正方形图片。

@ 乱糟糟的坐标：居然发现上学期的C++的CannyEdge的右下点myAddVec.push_back()里面一个坐标加号写成了减号
 */