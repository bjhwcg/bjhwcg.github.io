//全局的东西
//查找平方运算的表
//根据opencv的函数里据说为了提高效率所以用查找表的方法来计算平方
//由于tab是查找表所以下标一定要一定要一定要保证是整数！！
//我的天哪因为这个东西debug了一个晚上还熬夜了表现就是只有金字塔0层能正常segment后面都只有高斯。
//js为啥不自己转个下标我要die了再一次被自己蠢哭
var tab = new Array(768);


//构造child树(我觉得内存药丸)
//疏忽了没有存rate，所以这里就当参数吧，记得要和下面的rate保持一致
//论文什么细节都没给，甚至觉得算法是有漏洞的……自己脑补出一万出戏……论选论文的时候脑子进的水……
function GiveBirth(py, rate) {
    var r = 1 / rate;
    var level = py.idPy.length;
    //每层金字塔构造一个邻居表和一个孩子表，初始化
    var neighbor = new Array(level);
    var child = new Array(level);//注意往下偏移一层……因为最高层是-1，大家共同的爸爸，而最底层显然没有孩子
    child[level - 1] = new Array();
    var idmax;
    for (var i = 0; i < level; i++) {
        idmax = py.idPy[i].idmax;
        neighbor[i] = math.zeros(idmax + 1, idmax + 1);//不用稀疏矩阵不知道会不会死得很惨
        if (i > 0) {
            child[i - 1] = new Array(idmax + 1);
            for (var j = 0; j < idmax + 1; j++) {
                child[i-1][j] = new Array();
            }
        }
    }
    //根据论文构造active set R，并把所有的level0的区域push到R
    var R = new Array();
    for (var i = 1; i <= py.idPy[0].idmax; i++) {
        R.push([0, i]);
    }
    var key = 0;
    //开始计算R中的东西的孩子
    while (R.length != 0) {
         //退出循环条件暂定
        if (key >= R.length) {
            break;
        }
        //遍历到最后一层则加入世界爸爸节点
        if (R[key][0] == level - 1) {
            child[level - 1].push([R[key][0], R[key][1]]);
            R.splice(key, 1);
            continue;
        }
        //初始化爸爸表
        var k;
        var father = new Array(py.idPy[R[key][0] + 1].idmax + 1);
        for (k = 0; k < father.length; k++) {
            father[k] = { num: 0, overlap: 0 };
        }
        //遍历当前层所有像素，找每一个属于level(=R[key][0])当前ID(=R[key][1])的像素
        for (var i = 0; i < py.idPy[R[key][0]].idmap.size()[0]; i++) {
            for (var j = 0; j < py.idPy[R[key][0]].idmap.size()[1]; j++) {
                //在当前层找到id等于当前id的像素
                if (py.idPy[R[key][0]].idmap._data[i][j] == R[key][1]) {
                    //往father的方向找对应像素点
                    var indi = parseInt(i * r);
                    indi = math.min(indi, py.idPy[R[key][0] + 1].idmap.size()[0]-1);
                    var indj = parseInt(j * r);                    
                    indj = math.min(indj, py.idPy[R[key][0] + 1].idmap.size()[1]-1);
                    var ppx = py.idPy[R[key][0] + 1].idmap._data[indi][indj];//上层对应id
                    father[ppx].num++;
                }
                //找爸爸以后找四邻域邻居，然后邻居表矩阵对应点数量++
                var n1;
                if (i + 1 < py.idPy[R[key][0]].idmap.size()[0]) {
                    n1 = py.idPy[R[key][0]].idmap._data[i + 1][j];
                    neighbor[R[key][0]]._data[R[key][1]][n1]++;
                    neighbor[R[key][0]]._data[n1][R[key][1]]++;
                }
                if (j + 1 < py.idPy[R[key][0]].idmap.size()[1]) {
                    n1 = py.idPy[R[key][0]].idmap._data[i][j + 1];
                    neighbor[R[key][0]]._data[R[key][1]][n1]++;
                    neighbor[R[key][0]]._data[n1][R[key][1]]++;
                }
                if (j > 0) {
                    n1 = py.idPy[R[key][0]].idmap._data[i][j - 1];
                    neighbor[R[key][0]]._data[R[key][1]][n1]++;
                    neighbor[R[key][0]]._data[n1][R[key][1]]++;
                }
                if (i > 0) {
                    n1 = py.idPy[R[key][0]].idmap._data[i - 1][j];
                    neighbor[R[key][0]]._data[R[key][1]][n1]++;
                    neighbor[R[key][0]]._data[n1][R[key][1]]++;
                }
            }
        }

        //在爸爸表里面计算和爸爸们的overlap
        var cc = py.idPy[R[key][0]].idAvgColor[R[key][1]];
        for (k = 1; k < father.length; k++) {
            var cp = py.idPy[R[key][0] + 1].idAvgColor[k];           
            var dcol = tab[parseInt(cp[0] - cc[0] + 255)] + tab[parseInt(cp[1] - cc[1] + 255)] + tab[parseInt(cp[2] - cc[2] + 255)];
            father[k].overlap = father[k].num / (1 + dcol);//防止除数是0
        }
        //找到最大的overlap的爸爸id作为准爸爸
        var maxovlp = 0;
        var maxovlpid = 0;
        for (k = 1; k < father.length; k++) {
            if (father[k].overlap > maxovlp) {
                maxovlp = father[k].overlap;
                maxovlpid = k;
            }
        }
        //测试准爸爸合不合格(注意child往下偏移一层)
        if (child[R[key][0]][maxovlpid].length == 0)//没有孩子的爸爸就直接认了
        {
            child[R[key][0]][maxovlpid].push([R[key][0], R[key][1]]);//记录child的level和id，层级先留着吧，不知道有没有用
            R.push([R[key][0] + 1, maxovlpid]);//把爸爸扔进active set
            R.splice(key, 1);//把有家的孩子扔出active set
            //注意先push再splice，而且是splice不是slice
        }
        else//找有没有孩子是自己的邻居
        {
            var hasneiborchild = 0;
            for (k = 0; k < child[R[key][0]][maxovlpid].length; k++) {
                n1 = child[R[key][0]][maxovlpid][k][1];//准爸爸现有孩子的id
                if (neighbor[R[key][0]]._data[R[key][1]][n1] > 0) {
                    child[R[key][0]][maxovlpid].push([R[key][0], R[key][1]]);
                    R.splice(key, 1);//把有家的孩子扔出active set
                    hasneiborchild = 1;
                    break;
                }
            }
            if (hasneiborchild==0) {
                key++;
                //R.push([R[key][0], R[key][1]]);//把自己扔进active set
                //R.shift();//把自己从第一个移除
            }
        }
    }
    //剩下的像素的处理
    for (var i = 0; i < R.length; i++) {
        //原文是小于500并入最小邻居，这里稍微考虑一下图大小，随便设的
        if (py.idPy[R[i][0]].idPxNum[R[i][1]] < 6*py.idPy[R[i][0]].idmap.size()[1]) {
            //找到最接近的邻居
            var maxneinum = 0;
            var maxnei = 0;
            for (var j = 1; j <= py.idPy[R[i][0]].idmax; j++) {
                if (neighbor[R[i][0]]._data[R[i][1]][j] > maxneinum) {
                    maxneinum = neighbor[R[i][0]]._data[R[i][1]][j];
                    maxnei = j;
                }
            }
            if (maxnei != 0) {
                //找到邻居的爸爸并加入
                for (var j = 1; j < child[R[i][0]].length; j++) {
                    for (var l = 0; l < child[R[i][0]][j].length; l++) {
                        if (child[R[i][0]][j][l] == maxnei) {
                            child[R[i][0]][j].push([R[i][0], R[i][1]]);
                        }
                    }
                }
            }
            else {
                child[level - 1].push([R[i][0], R[i][1]]);
            }
        }
        else {
            child[level - 1].push([R[i][0], R[i][1]]);
        }
    }
    return [child, neighbor];
}

//######################################################################################


//显示图像金字塔
//暂时没有考虑level数减小导致的后面几个level没有隐藏的bug……我会改的！！
function ShowPy(segPy) {
    //创建画布
    var level = segPy.length;
    var canvasArea = $("#canvas-area-2");
    canvasArea[0].style.visibility = "visible";
    var cvsArray = new Array(level);
    for (var i = 0; i < level; i++) {
        if ($("#ms-canvas" + i).length == 0) {
            cvsArray[i] = document.createElement("canvas");
            cvsArray[i].id = "ms-canvas" + i;
            cvsArray[i].className = "my-cvs";
            canvasArea.append(cvsArray[i]);
        }
        else {
            cvsArray[i] = $("#ms-canvas" + i)[0];
        }
        cvsArray[i].width = segPy[i].r.size()[1];
        cvsArray[i].height = segPy[i].r.size()[0];
        cvsArray[i].style.width = segPy[i].r.size()[1] + "px";
        cvsArray[i].style.height = segPy[i].r.size()[0] + "px";

        MatrixToImg(segPy[i], cvsArray[i]);
    }
}

//金字塔图像分割整个流程走一走
//src:原图像数据，不是矩阵
//level：层数,1层表示只有原图
//rate：每层往下放大的倍数
//返回值：
//segPy：用于显示的矩阵金字塔
//idPy：用于构造树的结构金字塔
function ToPyMSSeg(src, level, rate, sp, sr, maxit, distance) {
    //构造平方计算的查找表
    GenTab();
    var dst = ImgToMatrix(src);
    //初始化各级图像金字塔，以及储存结果的数组
    var srcPy = ToPy(dst, level, rate);
    var segPy = new Array(level);
    var idPy = new Array(level);
    //对每层进行meanshift分割
    var r = 1;

    for (var i = 0; i < level; i++) {
        //console.log(srcPy[i], sp / r, sr, maxit, distance / r);
        segPy[i] = ToMSSeg(srcPy[i], sp, sr, maxit, distance);
        //中值滤波是直接在src上面做的所以不用返回值
        //中值滤波为了去除一些噪音点，算是个优化吧但是同时也拖慢了速度，看情况决定加不加吧
        //MidFilter(segPy[i]);
        idPy[i] = ToDivided(segPy[i], 5, 5);
        r *= rate;
    }
    return {segPy:segPy, idPy:idPy};
}

//src:图像矩阵矩阵矩阵
//level：层数
//rate：每层往下放大的倍数
//返回值：
//一个矩阵数组，从0到length依次是最好的一层矩阵（原图）到最小的一层矩阵
function ToPy(src, level, rate){
    var dst = new Array(level);
    var gauss = GenGauss(2, 1, 0);
	//第0层的图片是原图
	dst[0]  = src;
    //上面几层的压缩图片
    for (var i = 1; i < level; i++){
        var h = math.floor(dst[i - 1].r.size()[0] / rate);
        var w = math.floor(dst[i - 1].r.size()[1] / rate);
        dst[i] = { r: math.zeros(h, w), g: math.zeros(h, w), b: math.zeros(h, w) };
        //将上一层进行高斯模糊        
        var tmpr = MyConvolution(gauss, dst[i - 1].r);
        var tmpg = MyConvolution(gauss, dst[i - 1].g);
        var tmpb = MyConvolution(gauss, dst[i - 1].b);
		var u0,v0;
		for(var u=0;u<dst[i].r.size()[0];u++){
			for(var v=0;v<dst[i].r.size()[1];v++){
				u0=parseInt(u*rate);
				v0=parseInt(v*rate);
                dst[i].r._data[u][v] = tmpr._data[u0][v0];
                dst[i].g._data[u][v] = tmpg._data[u0][v0];
                dst[i].b._data[u][v] = tmpb._data[u0][v0];
			}
		}
	}
	return dst;
}


//meanshift之后分割区域和填充
//先中值滤波，为了效果更好
//再赋予这张图的每一像素点一个类编号
//参数：
//src：矩阵矩阵矩阵，会被重新填充
//sp\sr：查找的误差范围
//返回值：
//idmap：记录每个像素的类别号的矩阵
//idmax：最大的id类别号
//idAvgColor：每个id对应的平均rgb颜色的二维数组
function ToDivided(src, sp, sr) {
    //用于标号的map
    var idmap = math.zeros(src.r.size()[0], src.r.size()[1]);
    var idmax = 1;//记录当前的最大编号（0表示编号初始值）
    var sr2 = sr*sr;
    //给相似区域标号
    //对于每个点
    idmap._data[0][0]=1;
    for (var i = 0; i < src.r.size()[0]; i++) {
        for (var j = 0; j < src.r.size()[1]; j++) {
            //在一定的位置阈值中寻找接近的像素
            //半个窗口的顶点位置
            var minx = math.round(j - sp); minx = math.max(minx, 0);
            var miny = math.round(i - sp); miny = math.max(miny, 0);
            var maxx = math.round(j + sp); maxx = math.min(src.r.size()[1] - 1, maxx);
            //在位置窗口内寻找标号的颜色点
            //注意是小于等于，而且是外y内x;
            for (var y = miny; y <= i; y++) {
                for (var x = minx; x <= maxx; x++) {
                    //如果这个点有编号
                    if (idmap._data[y][x] != 0) {
                    	//如果这个点在meanshift里面是分为同一块的
                    	if (src.x._data[y][x] == src.x._data[i][j] && src.y._data[y][x] == src.y._data[i][j]){
                    		//赋予这个点一样的标号
                        	idmap._data[i][j] = idmap._data[y][x];
                        	break;
                    	}
                        //如果这个点的颜色容忍度在一定范围
                        else if (tab[parseInt(src.r._data[y][x] - src.r._data[i][j] + 255)] + 
                        	tab[parseInt(src.g._data[y][x] - src.g._data[i][j] + 255)] + 
                        	tab[parseInt(src.b._data[y][x] - src.b._data[i][j] + 255)] <= sr2)//给个误差范围
                        {
                        	//赋予这个点一样的标号
                        	idmap._data[i][j] = idmap._data[y][x];
                        	break;
                        }

                    }
                }
                if(idmap._data[i][j] != 0 ){
                	break;
                }
            }
            //如果找不到同类，则赋予这个点新的编号
            if(idmap._data[i][j] == 0){
            	idmap._data[i][j] = ++idmax;
            }
        }
    }
    //计算平均颜色
    var col = new Array(k);
    var num = new Array(k);
    for(var k=1;k<=idmax;k++){
    	col[k]=[0,0,0];
    	num[k]=0;//num本来也想返回的……嗯果然是要返回的
        var csum = [0,0,0];    	
    	for (var i = 0; i < src.r.size()[0]; i++) {
            for (var j = 0; j < src.r.size()[1]; j++) {
            	if(idmap._data[i][j] == k){
            		num[k]++;
            		csum[0] += src.r._data[i][j];
            		csum[1] +=src.g._data[i][j];
            		csum[2] +=src.b._data[i][j];
            	}
            }
        }     
        col[k]=[ csum[0]/num[k], csum[1]/num[k], csum[2]/num[k] ];

    }
    //重新填充src
    for (var i = 0; i < src.r.size()[0]; i++) {
        for (var j = 0; j < src.r.size()[1]; j++) {
            src.r._data[i][j] = col[idmap._data[i][j]][0];
            src.g._data[i][j] = col[idmap._data[i][j]][1];
            src.b._data[i][j] = col[idmap._data[i][j]][2];
        }
    }
    return { idmap: idmap, idmax: idmax, idAvgColor: col, idPxNum: num };
}

//meanshift segmentation
//参数：
//src：原图矩阵
//maxit：最大的迭代步数
//sp：位置的窗口半径
//distance：步长精度
//返回值：
//包含rgbxy五层矩阵的dst
function ToMSSeg(src, sp, sr, maxit, distance) {

    var sr2 = math.round(sr * sr);
    var dst = {
        r: math.zeros(src.r.size()[0], src.r.size()[1]),
        g: math.zeros(src.r.size()[0], src.r.size()[1]),
        b: math.zeros(src.r.size()[0], src.r.size()[1]),
        x: math.zeros(src.r.size()[0], src.r.size()[1]),
        y: math.zeros(src.r.size()[0], src.r.size()[1])
    };
    for (var i = 0; i < src.r.size()[0]; i++) {
        for (var j = 0; j < src.r.size()[1]; j++) {
            var y0 = i, x0 = j;
            var x1, y1;//mode坐标
            //当前点的颜色值
            var c0 = src.r._data[i][j];
            var c1 = src.g._data[i][j];
            var c2 = src.b._data[i][j];
            //迭代
            for (var k = 0; k < maxit; k++) {
                var count = 0;

                //s：总颜色值和总位置值
                var s0 = 0, s1 = 0, s2 = 0, sx = 0, sy = 0;
                var icount;
                var stopFlag;

                //窗口的顶点位置
                var minx = math.round(x0 - sp); minx = math.max(minx, 0);
                var miny = math.round(y0 - sp); miny = math.max(miny, 0);
                var maxx = math.round(x0 + sp); maxx = math.min(src.r.size()[1] - 1, maxx);
                var maxy = math.round(y0 + sp); maxy = math.min(src.r.size()[0] - 1, maxy);

                //在位置窗口内寻找符合的颜色点
                //注意是小于等于，而且是外y内x
                for (var y = miny; y <= maxy; y++) {
                    var rcount = 0;
                    for (var x = minx; x <= maxx; x++) {
                        //窗内当前点的颜色值
                        var t0 = src.r._data[y][x];
                        var t1 = src.g._data[y][x];
                        var t2 = src.b._data[y][x];

                        //只计算关于颜色的有限距离内的像素点的重心
                        if (tab[parseInt(t0 - c0 + 255)] + tab[parseInt(t1 - c1 + 255)] + tab[parseInt(t2 - c2 + 255)] <= sr2) {
                            s0 += t0;
                            s1 += t1;
                            s2 += t2;
                            sx += x;
                            rcount++;
                        }
                    }
                    //这种计算总重量的方式……感觉到了opencv代码的优化，好厉害诶以后可以学着这样做呢
                    count += rcount;
                    sy += y * rcount;
                }

                //这个是跳出迭代，count==0应该是觉得无路可走了
                if (count == 0) {
                    break;
                }
                //计算平均值，也就是位置和颜色的重心位置（之前算的是总量，所以要除以点的数量）
                //这个应该也是优化，减少除法的计算
                icount = 1 / count;
                x1 = math.round(sx * icount);
                y1 = math.round(sy * icount);
                s1 = math.round(s1 * icount);
                s2 = math.round(s2 * icount);
                s0 = math.round(s0 * icount);

                stopFlag = (x0 == x1 && y0 == y1) || (math.abs(x1 - x0) + math.abs(y1 - y0) + tab[parseInt(s0 - c0 + 255)] + tab[parseInt(s1 - c1 + 255)] + tab[parseInt(s2 - c2 + 255)]) <= distance;
                //这个就是进行了meanshift吧
                x0 = x1; y0 = y1;
                c0 = s0; c1 = s1; c2 = s2;
                //如果感觉可以了，也就是重心没有怎么移动，那么就跳出迭代了
                if (stopFlag) {
                    break;
                }              
            }
            //给结果赋上现在的值
            dst.r._data[i][j] = c0;
            dst.g._data[i][j] = c1;
            dst.b._data[i][j] = c2;
            //和opencv相比，原文的坐标值也赋值了
            dst.x._data[i][j] = x0;
            dst.y._data[i][j] = y0;
        }
    }
    return dst;
}

//######################################################################################

//中值滤波
function MidFilter(src) {
    var tmp = {
        r: ExpandBorder(src.r, 1),
        g: ExpandBorder(src.g, 1),
        b: ExpandBorder(src.b, 1)
    };
    var dst = math.zeros(src.r.size()[0], src.r.size()[1]);
    for (var i = 0; i < src.r.size()[0]; i++) {
        for (var j = 0; j < src.r.size()[1]; j++) {
            //取出rgb的9个数
            var datar = [tmp.r._data[i][j], tmp.r._data[i + 1][j], tmp.r._data[i + 2][j],
                tmp.r._data[i][j + 1], tmp.r._data[i + 1][j + 1], tmp.r._data[i + 2][j + 1],
                tmp.r._data[i][j + 2], tmp.r._data[i + 1][j + 2], tmp.r._data[i + 2][j + 2]];

            var datag = [tmp.g._data[i][j], tmp.g._data[i + 1][j], tmp.g._data[i + 2][j],
            tmp.g._data[i][j + 1], tmp.g._data[i + 1][j + 1], tmp.g._data[i + 2][j + 1],
                tmp.g._data[i][j + 2], tmp.g._data[i + 1][j + 2], tmp.g._data[i + 2][j + 2]];

            var datab = [tmp.b._data[i][j], tmp.b._data[i + 1][j], tmp.b._data[i + 2][j],
            tmp.b._data[i][j + 1], tmp.b._data[i + 1][j + 1], tmp.b._data[i + 2][j + 1],
                tmp.b._data[i][j + 2], tmp.b._data[i + 1][j + 2], tmp.b._data[i + 2][j + 2]];
            //计算rgb转Yuv的Y
            var data = new Array(9);
            for (var k = 0; k < 9; k++) {
                data[k] = RGB2Y(datar[k], datag[k], datab[k]);
            }
            //最中间的值作为本次取值
            switch (MySortMiddle(data)) {
                case 0:
                    src.r._data[i][j] = tmp.r._data[i][j];
                    src.g._data[i][j] = tmp.g._data[i][j];
                    src.b._data[i][j] = tmp.b._data[i][j];
                    break;
                case 1:
                    src.r._data[i][j] = tmp.r._data[i + 1][j];
                    src.g._data[i][j] = tmp.g._data[i + 1][j];
                    src.b._data[i][j] = tmp.b._data[i + 1][j];
                    break;
                case 2:
                    src.r._data[i][j] = tmp.r._data[i + 2][j];
                    src.g._data[i][j] = tmp.g._data[i + 2][j];
                    src.b._data[i][j] = tmp.b._data[i + 2][j];
                    break;
                case 3:
                    src.r._data[i][j] = tmp.r._data[i][j + 1];
                    src.g._data[i][j] = tmp.g._data[i][j + 1];
                    src.b._data[i][j] = tmp.b._data[i][j + 1];
                    break;
                case 4:
                    src.r._data[i][j] = tmp.r._data[i + 1][j + 1];
                    src.g._data[i][j] = tmp.g._data[i + 1][j + 1];
                    src.b._data[i][j] = tmp.b._data[i + 1][j + 1];
                    break;
                case 5:
                    src.r._data[i][j] = tmp.r._data[i + 2][j + 1];
                    src.g._data[i][j] = tmp.g._data[i + 2][j + 1];
                    src.b._data[i][j] = tmp.b._data[i + 2][j + 1];
                    break;
                case 6:
                    src.r._data[i][j] = tmp.r._data[i][j + 2];
                    src.g._data[i][j] = tmp.g._data[i][j + 2];
                    src.b._data[i][j] = tmp.b._data[i][j + 2];
                    break;
                case 7:
                    src.r._data[i][j] = tmp.r._data[i + 1][j + 2];
                    src.g._data[i][j] = tmp.g._data[i + 1][j + 2];
                    src.b._data[i][j] = tmp.b._data[i + 1][j + 2];
                    break;
                case 8:
                    src.r._data[i][j] = tmp.r._data[i + 2][j + 2];
                    src.g._data[i][j] = tmp.g._data[i + 2][j + 2];
                    src.b._data[i][j] = tmp.b._data[i + 2][j + 2];
                    break;
            }
        }
    }
}

//选择排序
function MySortMiddle(data) {
    //排序数组
    var d = math.clone(data);
    for (var i = 0; i < d.length; i++) {
        var minv = d[i];
        var index = i;
        for (var j = i + 1; j < 9; j++) {
            if (minv > d[j]) {
                minv = d[j];
                index = j;
            }
        }
        d[index] = d[i];
        d[i] = minv;
    }
    //返回中间序号
    var halflen = math.round(data.length / 2);
    for (var i = 0; i < data.length; i++) {
        if (data[i] == d[halflen]) {
            return i;
        }
    }
}

//平方计算的查找表
function GenTab() {
    for (var i = 0; i < 768; i++) {
        //猜测opencv里面-255是为了节省储存空间？
        tab[i] = (i - 255) * (i - 255);
    }

}
//检查Luv的最大最小值（测试用）
//未进行偏移的结果
//ml: 100.00425275 mu: 178.44863943 mv: 105.50819899 nl: 0, nu: -87.57672066 nv: -133.3563116
function testLuvmax() {
    var r, g, b, maxl = 0, maxu = 0, maxv = 0, minl = 100, minu = 100, minv = 100;
    for (r = 0; r < 256; r++) {
        for (g = 0; g < 256; g++) {
            for (b = 0; b < 256; b++) {
                var a = RGBToLuv(r, g, b);
                if (a.L > maxl) {
                    maxl = a.L;
                }
                if (a.u > maxu) {
                    maxu = a.u;
                }
                if (a.v > maxv) {
                    maxv = a.v;
                }
                if (a.L < minl) {
                    minl = a.L;
                }
                if (a.u < minu) {
                    minu = a.u;
                }
                if (a.v < minv) {
                    minv = a.v;
                }
            }
        }
    }
    return { ml: maxl, mu: maxu, mv: maxv, nl: minl, nu: minu, nv: minv };
}
//把rgb矩阵转化成luv矩阵
//网上公式千千万……听说opencv还把luv归一化成了0-255……到底应该相信哪个……
//我 要 炸 了
//各种资料显示的转换矩阵都不一样，所以是xyz所指的东西不一样还是什么情况？？
//网友的结果和我修改写出来的结果和网上在线运算的结果不一致，到底是哪个错了……
//后来发现luv有各种版本的标准……
function RGBToLuv(R,G,B)
{
    var L, u, v;
    var X = 0.431 * R + 0.343 * G + 0.178 * B;
    var Y = 0.222 * R + 0.707 * G + 0.071 * B;
    var Z = 0.020 * R + 0.13 * G + 0.939 * B;

    //white point
    //var xn = (0.431 + 0.343 + 0.178) * 255;
    //var yn = (0.222 + 0.707 + 0.071) * 255;
    //var zn = (0.020 + 0.13 + 0.939) * 255;
    //var xn = 242.76, yn = 255, zn = 277.695;

    if (Y > 2.25854) {
        L = 116 * math.pow(0.003922 * Y, 0.3333) - 16;
    }
    //公式来源：维基百科
    else {
        L = 3.5424 * Y;
    }

    var sum = X + 15 * Y + 3 * Z;
    //这个0处理的来源是网上
    if (sum != 0) {
        u = 4 * X / sum, v = 9 * Y / sum;
    }
    else {
        u = 4.0, v = 0.6;
    }
    //var un = 4 * xn / (xn + 15 * yn + 3 * zn);
    //var vn = 9 * yn / (xn + 15 * yn + 3 * zn);

    //LUV转化公式来源Computer Graphics: Principles and Practice in C, 2nd edition
    var U = 13 * L * (u - 0.198137);
    var V = 13 * L * (v - 0.46829);
    //标准化

    return { L: L, u: U, v: V };
}

//把Luv矩阵转化成rgb矩阵
//经验证我写的这两个……是配对的
//但是单独来看，结果和别人的比，误差还是存在一些。
function LuvToRGB(L, u, v) {
    var R, G, B;

    if (L < 0.1) {
        R = G = B = 0;
    }
    else {
        //Luv转XYZ
        var X, Y, Z;

        if (L <= 8) {
            Y = L * 0.2823;
        }
        else {
            Y = 0.00862 * (L + 16.0), Y = Y * Y * Y, Y*=255;
        }

        var U = u / (13 * L) + 0.198137;
        var V = v / (13 * L) + 0.46829;

        X = 9 * U * Y / (4 * V);
        Z = (12 - 3 * U - 20 * V) * Y / (4 * V);

        //XYZ转RGB
        R = 3.063 * X - 1.393 * Y - 0.476 * Z;
        G = - 0.969 * X + 1.876 * Y + 0.042 * Z;
        B = 0.068 * X - 0.229 * Y + 1.069 * Z;
        //标准化
        R = ((R < 0) ? 0 : ((R > 255) ? 255 : R));
        G = ((G < 0) ? 0 : ((G > 255) ? 255 : G));
        B = ((B < 0) ? 0 : ((B > 255) ? 255 : B));
    }
    return { R: R, G: G, B: B };
}

//把canvas图像变成rgb三个矩阵，抱歉没考虑a通道了
//src：canvas上面的图像数据
function ImgToMatrix(src) {
    var r = math.zeros(src.height, src.width);
    var g = math.zeros(src.height, src.width);
    var b = math.zeros(src.height, src.width);
    for (var i = 0; i < src.height; i++) {
        for (var j = 0; j < src.width; j++) {
            var index = (i * src.width + j) * 4;
            r._data[i][j] = src.data[index];
            g._data[i][j] = src.data[index + 1];
            b._data[i][j] = src.data[index + 2];
        }
    }
    return { r: r, g: g, b: b };
}

//把rgb矩阵显示到canvas
//mat：包含rgb的矩阵
//canvas：目标画布
function MatrixToImg(mat, canvas) {
    var ctx = canvas.getContext('2d');
    var Image = ctx.createImageData(mat.r.size()[1], mat.r.size()[0]);
    for (var i = 0; i < mat.r.size()[0]; i++) {
        for (var j = 0; j < mat.r.size()[1]; j++) {
            let index = (i * mat.r.size()[1] + j) * 4;
            Image.data[index] = mat.r._data[i][j];
            Image.data[index + 1] = mat.g._data[i][j];
            Image.data[index + 2] = mat.b._data[i][j];
            Image.data[index + 3] = 255;
        }
    }
    ctx.putImageData(Image, 0, 0);
}

/*
bug记录：

@ 循环的下标：
五层循环里发现把计数器是xy的循环把下标也写成ij了
我找了一晚上，睡前才发现！哼！

@ tab
tab的下标必须是整数必须是整数

 */
